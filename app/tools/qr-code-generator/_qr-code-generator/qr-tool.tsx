"use client";

// =============================================================================
// isaacpaha.com — Custom QR Code Generator
// app/tools/qr-code-generator/_components/qr-tool.tsx
//
// Full-featured client-side QR generator:
//   - 10 QR types (URL, vCard, LinkedIn, WiFi, email, SMS, payment, etc.)
//   - Live SVG preview with:
//       • 5 dot shape styles (square, rounded, dots, classy, classy-rounded)
//       • Solid or gradient colour fill
//       • Custom background colour
//       • Logo/image embedding in centre
//       • Frame + CTA text
//   - AI design suggestions from Claude
//   - Download as PNG or SVG
//   - Share card generator (LinkedIn/X)
//   - Save to workspace (signed-in users)
//
// QR matrix from: /api/tools/qr/generate
// Rendered entirely client-side as SVG (no external QR-rendering lib needed)
// =============================================================================

import React, {
  useState, useCallback, useEffect, useRef, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Link, User, Wifi, Mail, Phone, CreditCard, Share2, MessageSquare,
  Sparkles, Download, Copy, Check, Loader2, RefreshCw, Upload,
  Palette, Settings, Eye, X, ChevronDown, Info, Save, Globe,
  Linkedin, Twitter, Instagram, Zap, AlertCircle, Image,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

type QRType =
  | "url" | "vcard" | "linkedin" | "instagram" | "twitter"
  | "email" | "sms" | "phone" | "wifi" | "payment" | "text";

type DotStyle    = "square" | "rounded" | "dots" | "classy" | "classy-rounded";
type CornerStyle = "square" | "rounded" | "dot";
type FrameStyle  = "none" | "simple" | "rounded" | "bold";

interface QRDesign {
  primaryColor:   string;
  secondaryColor: string;
  bgColor:        string;
  useGradient:    boolean;
  dotStyle:       DotStyle;
  cornerStyle:    CornerStyle;
  frameStyle:     FrameStyle;
  ctaText:        string;
  logoDataUrl:    string | null;
  logoSize:       number;   // % of QR size, 15–30
  errorCorrection: "L" | "M" | "Q" | "H";
  margin:         number;   // modules
}

// ─── Config ───────────────────────────────────────────────────────────────────

const QR_TYPES: { id: QRType; label: string; icon: React.ElementType; desc: string; color: string }[] = [
  { id: "url",       label: "Website / URL",    icon: Globe,        desc: "Any web address",            color: "#6366f1" },
  { id: "linkedin",  label: "LinkedIn",          icon: Linkedin,     desc: "Profile page",               color: "#0a66c2" },
  { id: "instagram", label: "Instagram",         icon: Instagram,    desc: "Profile page",               color: "#e1306c" },
  { id: "twitter",   label: "Twitter / X",       icon: Twitter,      desc: "Profile page",               color: "#000000" },
  { id: "vcard",     label: "Contact Card",      icon: User,         desc: "Save contact instantly",     color: "#10b981" },
  { id: "email",     label: "Email",             icon: Mail,         desc: "Pre-filled email",           color: "#f59e0b" },
  { id: "sms",       label: "SMS",               icon: MessageSquare,desc: "Pre-filled text message",    color: "#8b5cf6" },
  { id: "phone",     label: "Phone Number",      icon: Phone,        desc: "Dial instantly",             color: "#06b6d4" },
  { id: "wifi",      label: "WiFi",              icon: Wifi,         desc: "Connect without typing",     color: "#3b82f6" },
  { id: "payment",   label: "Payment Link",      icon: CreditCard,   desc: "Stripe, PayPal, etc.",       color: "#10b981" },
  { id: "text",      label: "Plain Text",        icon: MessageSquare,desc: "Any text or note",           color: "#9ca3af" },
];

const DOT_STYLES: { id: DotStyle; label: string; preview: string }[] = [
  { id: "square",          label: "Square",          preview: "■■■" },
  { id: "rounded",         label: "Rounded",         preview: "●●●" },
  { id: "dots",            label: "Dots",            preview: "···" },
  { id: "classy",          label: "Classy",          preview: "◆◆◆" },
  { id: "classy-rounded",  label: "Classy+",         preview: "◉◉◉" },
];

const COLOUR_PRESETS = [
  { name: "Indigo",   primary: "#4f46e5", secondary: "#7c3aed", bg: "#ffffff" },
  { name: "Emerald",  primary: "#059669", secondary: "#0d9488", bg: "#ffffff" },
  { name: "Midnight", primary: "#1e293b", secondary: "#334155", bg: "#ffffff" },
  { name: "Amber",    primary: "#d97706", secondary: "#b45309", bg: "#ffffff" },
  { name: "Rose",     primary: "#e11d48", secondary: "#be123c", bg: "#ffffff" },
  { name: "Ocean",    primary: "#0284c7", secondary: "#0369a1", bg: "#f0f9ff" },
  { name: "Gold",     primary: "#000000", secondary: "#374151", bg: "#fbbf24" },
  { name: "Arctic",   primary: "#7c3aed", secondary: "#4f46e5", bg: "#f5f3ff" },
];

const DEFAULT_DESIGN: QRDesign = {
  primaryColor:    "#000000",
  secondaryColor:  "#000000",
  bgColor:         "#ffffff",
  useGradient:     false,
  dotStyle:        "square",
  cornerStyle:     "square",
  frameStyle:      "none",
  ctaText:         "",
  logoDataUrl:     null,
  logoSize:        22,
  errorCorrection: "M",
  margin:          4,
};

// ─── SVG QR Renderer ─────────────────────────────────────────────────────────
// Takes the matrix from the API and renders a fully customised SVG
// This is the core rendering engine — runs entirely client-side

function renderQRSVG(
  matrix: boolean[][],
  design: QRDesign,
  size = 300,
): string {
  if (!matrix?.length) return "";

  const moduleCount = matrix.length;
  const margin      = design.margin;
  const totalModules = moduleCount + margin * 2;
  const moduleSize  = size / totalModules;
  const offset      = margin * moduleSize;

  // Gradient IDs
  const gradId = "qrGrad";
  const gradDef = design.useGradient
    ? `<defs>
        <linearGradient id="${gradId}" x1="0%" y1="0%" x2="100%" y2="100%">
          <stop offset="0%" stop-color="${design.primaryColor}"/>
          <stop offset="100%" stop-color="${design.secondaryColor}"/>
        </linearGradient>
      </defs>`
    : `<defs/>`;

  const fillColor = design.useGradient ? `url(#${gradId})` : design.primaryColor;

  // Helper: draw a single module based on dot style
  const drawModule = (row: number, col: number): string => {
    const x = offset + col * moduleSize;
    const y = offset + row * moduleSize;
    const s = moduleSize;
    const pad = s * 0.1; // small gap for dot styles
    
    // Skip finder patterns (corners 7x7) — we'll draw them separately
    const isTopLeft     = row < 7 && col < 7;
    const isTopRight    = row < 7 && col >= moduleCount - 7;
    const isBottomLeft  = row >= moduleCount - 7 && col < 7;
    if (isTopLeft || isTopRight || isBottomLeft) return "";

    if (!matrix[row][col]) return "";

    switch (design.dotStyle) {
      case "rounded":
        return `<rect x="${x+pad*0.5}" y="${y+pad*0.5}" width="${s-pad}" height="${s-pad}" rx="${s*0.3}" fill="${fillColor}"/>`;
      case "dots":
        return `<circle cx="${x+s/2}" cy="${y+s/2}" r="${s*0.4}" fill="${fillColor}"/>`;
      case "classy":
        return `<rect x="${x+pad*0.5}" y="${y+pad*0.5}" width="${s-pad}" height="${s-pad}" rx="${s*0.15}" fill="${fillColor}"/>`;
      case "classy-rounded":
        return `<circle cx="${x+s/2}" cy="${y+s/2}" r="${s*0.42}" fill="${fillColor}"/>`;
      default: // square
        return `<rect x="${x}" y="${y}" width="${s}" height="${s}" fill="${fillColor}"/>`;
    }
  };

  // Helper: draw finder pattern (the 3 corner squares)
  const drawFinder = (row: number, col: number): string => {
    const x = offset + col * moduleSize;
    const y = offset + row * moduleSize;
    const s = moduleSize * 7;
    const r = design.cornerStyle === "dot" ? s * 0.5 :
              design.cornerStyle === "rounded" ? s * 0.2 : 0;
    // Outer ring
    const outer = `<rect x="${x}" y="${y}" width="${s}" height="${s}" rx="${r}" fill="${fillColor}" />`;
    // White inner
    const inner = `<rect x="${x+moduleSize}" y="${y+moduleSize}" width="${s-2*moduleSize}" height="${s-2*moduleSize}" rx="${Math.max(0, r-moduleSize)}" fill="${design.bgColor}" />`;
    // Inner dot (3x3)
    const dot_r = design.cornerStyle === "dot" ? (s*3/7)*0.5 :
                  design.cornerStyle === "rounded" ? (s*3/7)*0.3 : 0;
    const dotX = x + moduleSize * 2;
    const dotY = y + moduleSize * 2;
    const dotSize = moduleSize * 3;
    const dot  = `<rect x="${dotX}" y="${dotY}" width="${dotSize}" height="${dotSize}" rx="${dot_r}" fill="${fillColor}" />`;
    return outer + inner + dot;
  };

  // Render all data modules
  let modules = "";
  for (let r = 0; r < moduleCount; r++) {
    for (let c = 0; c < moduleCount; c++) {
      modules += drawModule(r, c);
    }
  }

  // Render finder patterns
  const finder1 = drawFinder(0, 0);                           // top-left
  const finder2 = drawFinder(0, moduleCount - 7);             // top-right
  const finder3 = drawFinder(moduleCount - 7, 0);             // bottom-left

  // Logo
  let logoEl = "";
  if (design.logoDataUrl) {
    const logoPixels = size * (design.logoSize / 100);
    const lx = (size - logoPixels) / 2;
    const ly = (size - logoPixels) / 2;
    // White background behind logo
    const logoBg = logoPixels * 1.2;
    const lbx = (size - logoBg) / 2;
    const lby = (size - logoBg) / 2;
    logoEl = `
      <rect x="${lbx}" y="${lby}" width="${logoBg}" height="${logoBg}" rx="4" fill="white" />
      <image href="${design.logoDataUrl}" x="${lx}" y="${ly}" width="${logoPixels}" height="${logoPixels}" preserveAspectRatio="xMidYMid meet"/>`;
  }

  // Frame
  const frameHeight = design.ctaText && design.frameStyle !== "none" ? 36 : 0;
  const totalHeight = size + frameHeight;

  let frameSVG = "";
  let frameTextSVG = "";
  if (design.ctaText && design.frameStyle !== "none") {
    const fr = design.frameStyle === "rounded" ? 8 : design.frameStyle === "bold" ? 0 : 4;
    if (design.frameStyle === "bold") {
      frameSVG = `<rect x="0" y="${size}" width="${size}" height="${frameHeight}" fill="${design.primaryColor}"/>`;
      frameTextSVG = `<text x="${size/2}" y="${size + frameHeight/2 + 5}" text-anchor="middle" fill="white" font-family="'Sora', 'Inter', sans-serif" font-size="13" font-weight="700">${design.ctaText}</text>`;
    } else {
      frameSVG = `<rect x="2" y="${size + 4}" width="${size - 4}" height="${frameHeight - 8}" rx="${fr}" fill="${design.primaryColor}15" stroke="${design.primaryColor}" stroke-width="1.5"/>`;
      frameTextSVG = `<text x="${size/2}" y="${size + frameHeight/2 + 6}" text-anchor="middle" fill="${design.primaryColor}" font-family="'Sora', 'Inter', sans-serif" font-size="12" font-weight="700">${design.ctaText}</text>`;
    }
  }

  return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${size} ${totalHeight}" width="${size}" height="${totalHeight}">
  ${gradDef}
  <!-- Background -->
  <rect width="${size}" height="${totalHeight}" fill="${design.bgColor}"/>
  <!-- Data modules -->
  ${modules}
  <!-- Finder patterns -->
  ${finder1}${finder2}${finder3}
  <!-- Logo -->
  ${logoEl}
  <!-- Frame -->
  ${frameSVG}
  ${frameTextSVG}
</svg>`;
}

// ─── Input forms per QR type ──────────────────────────────────────────────────

function TypeInputForm({ type, data, onChange }: {
  type:     QRType;
  data:     Record<string, string>;
  onChange: (key: string, value: string) => void;
}) {
  const input = (label: string, key: string, placeholder?: string, type_?: string) => (
    <div key={key}>
      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">{label}</label>
      <input
        type={type_ ?? "text"}
        value={data[key] ?? ""}
        onChange={(e) => onChange(key, e.target.value)}
        placeholder={placeholder}
        className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400 bg-white"
      />
    </div>
  );

  const fields: Record<QRType, React.ReactNode> = {
    url: (
      <div className="space-y-3">
        {input("Website URL", "url", "https://yourwebsite.com")}
      </div>
    ),
    linkedin: (
      <div className="space-y-3">
        {input("LinkedIn Profile URL", "url", "https://linkedin.com/in/your-name")}
      </div>
    ),
    instagram: (
      <div className="space-y-3">
        {input("Instagram Profile URL", "url", "https://instagram.com/yourusername")}
        <p className="text-[10px] text-stone-400">Or just enter your username: @yourusername</p>
      </div>
    ),
    twitter: (
      <div className="space-y-3">
        {input("X / Twitter Profile URL", "url", "https://twitter.com/yourusername")}
      </div>
    ),
    payment: (
      <div className="space-y-3">
        {input("Payment URL", "url", "https://buy.stripe.com/... or paypal.me/...")}
        <p className="text-[10px] text-stone-400">Paste your Stripe, PayPal, GoCardless, Monzo, or any payment link.</p>
      </div>
    ),
    text: (
      <div className="space-y-3">
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Text</label>
          <textarea value={data.text ?? ""} onChange={(e) => onChange("text", e.target.value)}
            placeholder="Enter any text, note, or information…" rows={3}
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400 resize-none"
          />
        </div>
      </div>
    ),
    vcard: (
      <div className="grid grid-cols-2 gap-3">
        {input("Full Name", "name", "Isaac Paha")}
        {input("Job Title", "title", "Software Engineer")}
        {input("Company", "org", "Acme Ltd")}
        {input("Phone", "phone", "+44 7700 000000", "tel")}
        {input("Email", "email", "isaac@example.com", "email")}
        {input("Website", "website", "https://isaacpaha.com")}
        {input("LinkedIn URL", "linkedin", "https://linkedin.com/in/...")}
        <div className="col-span-2">
          {input("Address", "address", "London, UK")}
        </div>
      </div>
    ),
    email: (
      <div className="space-y-3">
        {input("Email Address", "email", "hello@example.com", "email")}
        {input("Subject (optional)", "subject", "Hello!")}
      </div>
    ),
    sms: (
      <div className="space-y-3">
        {input("Phone Number", "phone", "+44 7700 000000", "tel")}
        {input("Pre-filled Message (optional)", "message", "Hi there!")}
      </div>
    ),
    phone: (
      <div className="space-y-3">
        {input("Phone Number", "phone", "+44 7700 000000", "tel")}
      </div>
    ),
    wifi: (
      <div className="space-y-3">
        {input("Network Name (SSID)", "ssid", "MyWifi")}
        {input("Password", "password", "wifipassword123")}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Security</label>
          <select value={data.encryption ?? "WPA"} onChange={(e) => onChange("encryption", e.target.value)}
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400 bg-white">
            <option value="WPA">WPA/WPA2</option>
            <option value="WEP">WEP</option>
            <option value="nopass">None (open)</option>
          </select>
        </div>
      </div>
    ),
  };

  return <>{fields[type] ?? fields.url}</>;
}

// ─── MAIN TOOL COMPONENT ─────────────────────────────────────────────────────

export function QRCodeTool({ isSignedIn = false }: { isSignedIn?: boolean }) {
  // State
  const [qrType,    setQrType]    = useState<QRType>("url");
  const [formData,  setFormData]  = useState<Record<string, string>>({});
  const [design,    setDesign]    = useState<QRDesign>(DEFAULT_DESIGN);
  const [matrix,    setMatrix]    = useState<boolean[][] | null>(null);
  const [generating, setGenerating] = useState(false);
  const [genError,  setGenError]  = useState("");
  const [activePane, setActivePane] = useState<"content" | "design">("content");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiPrompt,  setAiPrompt]  = useState("");
  const [saved,     setSaved]     = useState(false);
  const [saving,    setSaving]    = useState(false);
  const [copied,    setCopied]    = useState(false);
  const [label,     setLabel]     = useState("");
  const [shareMode, setShareMode] = useState(false);

  const svgRef  = useRef<HTMLDivElement>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  // Generate QR matrix whenever content changes
  const generateQR = useCallback(async (overrideData?: Record<string, string>) => {
    const d = overrideData ?? formData;
    // Check if we have sufficient content
    const hasContent = Object.values(d).some((v) => v.trim().length > 0);
    if (!hasContent) return;

    setGenerating(true); setGenError("");
    try {
      const res  = await fetch("/api/tools/qr/generate", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type: qrType,
          data: d,
          errorCorrection: design.logoDataUrl ? "H" : design.errorCorrection,
        }),
      });
      const result = await res.json();
      if (!res.ok || !result.matrix) {
        setGenError(result.error ?? "Generation failed");
        return;
      }
      setMatrix(result.matrix);
    } catch { setGenError("Network error"); }
    setGenerating(false);
  }, [formData, qrType, design.logoDataUrl, design.errorCorrection]);

  // Auto-generate on form change (debounced)
  useEffect(() => {
    const t = setTimeout(() => { generateQR(); }, 500);
    return () => clearTimeout(t);
  }, [generateQR]);

  // Computed SVG
  const svgString = useMemo(
    () => matrix ? renderQRSVG(matrix, design, 300) : null,
    [matrix, design]
  );

  // Form data update
  const setField = (key: string, value: string) => {
    setFormData((p) => ({ ...p, [key]: value }));
  };

  // Design update
  const setD = <K extends keyof QRDesign>(key: K, value: QRDesign[K]) => {
    setDesign((p) => ({ ...p, [key]: value }));
  };

  // Logo upload
  const handleLogoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500_000) { setGenError("Logo must be under 500KB"); return; }
    const reader = new FileReader();
    reader.onload = (ev) => {
      const dataUrl = ev.target?.result as string;
      setD("logoDataUrl", dataUrl);
      setD("errorCorrection", "H"); // need higher error correction with logo
    };
    reader.readAsDataURL(file);
  };

  // AI design suggest
  const handleAISuggest = async () => {
    if (!aiPrompt.trim() && !qrType) return;
    setAiLoading(true);
    try {
      const res  = await fetch("/api/tools/qr/ai-suggest", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: aiPrompt, type: qrType, purpose: aiPrompt || qrType }),
      });
      const data = await res.json();
      if (data.suggestion) {
        const s = data.suggestion;
        setDesign((prev) => ({
          ...prev,
          primaryColor:   s.primaryColor   ?? prev.primaryColor,
          secondaryColor: s.secondaryColor ?? prev.secondaryColor,
          bgColor:        s.bgColor        ?? prev.bgColor,
          useGradient:    s.useGradient    ?? prev.useGradient,
          dotStyle:       s.dotStyle       ?? prev.dotStyle,
          cornerStyle:    s.cornerStyle    ?? prev.cornerStyle,
          frameStyle:     s.frameStyle     ?? prev.frameStyle,
          ctaText:        s.ctaText        ?? prev.ctaText,
        }));
        if (s.label && !label) setLabel(s.label);
      }
    } catch {}
    setAiLoading(false);
  };

  // Download PNG
  const downloadPNG = async () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const img  = document.createElement("img");
    img.onload = () => {
      const canvas = document.createElement("canvas");
      canvas.width = canvas.height = 800;
      const ctx = canvas.getContext("2d")!;
      ctx.drawImage(img, 0, 0, 800, 800);
      canvas.toBlob((pngBlob) => {
        if (!pngBlob) return;
        const pngUrl = URL.createObjectURL(pngBlob);
        const a = document.createElement("a"); a.href = pngUrl;
        a.download = `qr-${label || qrType}-${Date.now()}.png`; a.click();
        URL.revokeObjectURL(pngUrl);
      }, "image/png");
      URL.revokeObjectURL(url);
    };
    img.src = url;
  };

  // Download SVG
  const downloadSVG = () => {
    if (!svgString) return;
    const blob = new Blob([svgString], { type: "image/svg+xml" });
    const url  = URL.createObjectURL(blob);
    const a    = document.createElement("a"); a.href = url;
    a.download = `qr-${label || qrType}-${Date.now()}.svg`; a.click();
    URL.revokeObjectURL(url);
  };

  // Copy SVG to clipboard
  const copySVG = () => {
    if (!svgString) return;
    navigator.clipboard.writeText(svgString);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Save to workspace
  const handleSave = async () => {
    if (!matrix || !isSignedIn) return;
    setSaving(true);
    try {
      const content = Object.values(formData).filter(Boolean).join(" ").trim();
      await fetch("/api/tools/qr/save", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          label:      label || `${QR_TYPES.find(t => t.id === qrType)?.label ?? qrType} QR`,
          type:       qrType,
          content,
          qrData:     content,
          designJson: design,
        }),
      });
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch {}
    setSaving(false);
  };

  const typeCfg = QR_TYPES.find((t) => t.id === qrType)!;

  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6" style={{ fontFamily: "Sora, sans-serif" }}>

      {/* ── LEFT PANEL: Config ────────────────────────────────────────────── */}
      <div className="space-y-5">

        {/* QR Type selector */}
        <div>
          <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">QR Code Type</label>
          <div className="grid grid-cols-2 gap-1.5">
            {QR_TYPES.map((t) => (
              <button key={t.id} onClick={() => { setQrType(t.id); setFormData({}); setMatrix(null); }}
                className={`flex items-center gap-2 px-3 py-2.5 rounded-sm border text-xs font-semibold transition-all text-left ${
                  qrType === t.id
                    ? "text-white border-transparent"
                    : "bg-white text-stone-500 border-stone-200 hover:border-stone-400 hover:text-stone-700"
                }`}
                style={qrType === t.id ? { backgroundColor: t.color, borderColor: t.color } : {}}>
                <t.icon className="w-3.5 h-3.5 flex-shrink-0" />
                <span className="truncate">{t.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Content / Design tabs */}
        <div className="border border-stone-200 rounded-sm overflow-hidden">
          <div className="flex border-b border-stone-200">
            {([
              { id: "content", label: "Content",  icon: typeCfg.icon },
              { id: "design",  label: "Design",   icon: Palette      },
            ] as const).map((tab) => (
              <button key={tab.id} onClick={() => setActivePane(tab.id)}
                className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-semibold transition-colors ${
                  activePane === tab.id ? "bg-stone-50 text-stone-900 border-b-2 border-indigo-500" : "bg-white text-stone-400 hover:text-stone-700"
                }`}>
                <tab.icon className="w-4 h-4" />{tab.label}
              </button>
            ))}
          </div>

          <div className="p-5">
            {activePane === "content" && (
              <div className="space-y-4">
                {/* Label */}
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Label (for your reference)</label>
                  <input value={label} onChange={(e) => setLabel(e.target.value)}
                    placeholder={`e.g. My ${typeCfg.label} QR`}
                    className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-indigo-400"
                  />
                </div>
                {/* Type-specific fields */}
                <TypeInputForm type={qrType} data={formData} onChange={setField} />
              </div>
            )}

            {activePane === "design" && (
              <div className="space-y-5">
                {/* Colour presets */}
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Colour Presets</label>
                  <div className="grid grid-cols-4 gap-2">
                    {COLOUR_PRESETS.map((p) => (
                      <button key={p.name} onClick={() => setDesign((prev) => ({ ...prev, primaryColor: p.primary, secondaryColor: p.secondary, bgColor: p.bg }))}
                        className="flex flex-col items-center gap-1 group">
                        <div className="w-full h-8 rounded-sm border border-stone-200 group-hover:border-stone-400 transition-colors overflow-hidden flex">
                          <div className="flex-1" style={{ backgroundColor: p.bg }} />
                          <div className="flex-1" style={{ background: `linear-gradient(to right, ${p.primary}, ${p.secondary})` }} />
                        </div>
                        <span className="text-[9px] text-stone-400 font-semibold">{p.name}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Custom colours */}
                <div className="grid grid-cols-3 gap-3">
                  {[
                    { label: "QR Colour",       key: "primaryColor"   as const },
                    { label: "Gradient End",     key: "secondaryColor" as const },
                    { label: "Background",       key: "bgColor"        as const },
                  ].map((c) => (
                    <div key={c.key}>
                      <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">{c.label}</label>
                      <div className="flex items-center gap-2">
                        <div className="w-8 h-8 rounded-sm border border-stone-300 overflow-hidden flex-shrink-0">
                          <input type="color" value={design[c.key]} onChange={(e) => setD(c.key, e.target.value)}
                            className="w-12 h-12 -translate-x-1 -translate-y-1 cursor-pointer" />
                        </div>
                        <input type="text" value={design[c.key]} onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setD(c.key, e.target.value); }}
                          className="flex-1 text-xs border border-stone-200 rounded-sm px-2 py-1.5 focus:outline-none focus:border-indigo-400 font-mono"
                        />
                      </div>
                    </div>
                  ))}
                </div>

                {/* Gradient toggle */}
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-xs font-bold text-stone-700">Use gradient</p>
                    <p className="text-[10px] text-stone-400">Blend from QR colour to gradient end</p>
                  </div>
                  <button onClick={() => setD("useGradient", !design.useGradient)}
                    className={`relative w-12 h-6 rounded-full transition-colors ${design.useGradient ? "bg-indigo-400" : "bg-stone-200"}`}>
                    <span className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${design.useGradient ? "translate-x-6" : "translate-x-0.5"}`} />
                  </button>
                </div>

                {/* Dot style */}
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Dot Style</label>
                  <div className="flex gap-2">
                    {DOT_STYLES.map((ds) => (
                      <button key={ds.id} onClick={() => setD("dotStyle", ds.id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-sm border text-center transition-colors ${
                          design.dotStyle === ds.id ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                        }`}>
                        <span className="text-base leading-none">{ds.preview}</span>
                        <span className="text-[9px] font-bold">{ds.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Corner style */}
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Corner Style</label>
                  <div className="flex gap-2">
                    {[
                      { id: "square"  as CornerStyle, label: "Square",  emoji: "⬛" },
                      { id: "rounded" as CornerStyle, label: "Rounded", emoji: "🔲" },
                      { id: "dot"     as CornerStyle, label: "Dot",     emoji: "⚫" },
                    ].map((cs) => (
                      <button key={cs.id} onClick={() => setD("cornerStyle", cs.id)}
                        className={`flex-1 flex flex-col items-center gap-1 py-2 rounded-sm border text-center transition-colors ${
                          design.cornerStyle === cs.id ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-stone-200 text-stone-500 hover:border-stone-400"
                        }`}>
                        <span className="text-base">{cs.emoji}</span>
                        <span className="text-[9px] font-bold">{cs.label}</span>
                      </button>
                    ))}
                  </div>
                </div>

                {/* CTA Text */}
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Frame & CTA Text</label>
                  <input value={design.ctaText} onChange={(e) => setD("ctaText", e.target.value)}
                    placeholder="e.g. Scan to view my portfolio"
                    className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-indigo-400 mb-2"
                  />
                  <div className="flex gap-2">
                    {(["none", "simple", "rounded", "bold"] as FrameStyle[]).map((f) => (
                      <button key={f} onClick={() => setD("frameStyle", f)}
                        className={`flex-1 text-[10px] font-bold py-1.5 rounded-sm border capitalize transition-colors ${
                          design.frameStyle === f ? "bg-indigo-50 border-indigo-400 text-indigo-700" : "bg-white border-stone-200 text-stone-500"
                        }`}>
                        {f}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Logo upload */}
                <div>
                  <label className="block text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Logo / Image (optional)</label>
                  <div className="flex gap-2">
                    <button onClick={() => fileRef.current?.click()}
                      className="flex items-center gap-2 text-xs font-bold text-stone-600 border border-stone-200 hover:border-indigo-400 hover:text-indigo-600 px-3 py-2 rounded-sm transition-colors">
                      <Upload className="w-3.5 h-3.5" />
                      {design.logoDataUrl ? "Change logo" : "Upload logo"}
                    </button>
                    {design.logoDataUrl && (
                      <button onClick={() => setD("logoDataUrl", null)}
                        className="flex items-center gap-1 text-xs text-red-500 hover:text-red-700 border border-red-200 hover:border-red-400 px-2.5 py-2 rounded-sm transition-colors">
                        <X className="w-3.5 h-3.5" />Remove
                      </button>
                    )}
                  </div>
                  <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={handleLogoUpload} />
                  {design.logoDataUrl && (
                    <div className="mt-2">
                      <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Logo Size: {design.logoSize}%</label>
                      <input type="range" min={15} max={30} value={design.logoSize} onChange={(e) => setD("logoSize", parseInt(e.target.value))}
                        className="w-full accent-indigo-500" />
                      <p className="text-[10px] text-stone-400 mt-1">
                        Logo auto-switches to high error correction for scannability.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* AI Design Suggest */}
        <div className="border border-stone-200 rounded-sm overflow-hidden">
          <div className="flex items-center gap-2 px-4 py-3 bg-gradient-to-r from-indigo-50 to-purple-50 border-b border-stone-100">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            <p className="text-xs font-black text-indigo-700">AI Design Suggestions</p>
          </div>
          <div className="p-4 space-y-3">
            <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && handleAISuggest()}
              placeholder={`Describe your use case… e.g. "professional CV QR for job applications"`}
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-indigo-400"
            />
            <button onClick={handleAISuggest} disabled={aiLoading || (!aiPrompt.trim() && !qrType)}
              className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 py-2.5 rounded-sm transition-colors disabled:opacity-60">
              {aiLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {aiLoading ? "Designing…" : "Get AI Design"}
            </button>
          </div>
        </div>
      </div>

      {/* ── RIGHT PANEL: Live Preview + Actions ───────────────────────────── */}
      <div className="space-y-4">
        {/* Preview area */}
        <div className="bg-stone-50 border border-stone-200 rounded-sm p-6 flex flex-col items-center gap-5">
          <div className="flex items-center justify-between w-full mb-1">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Live Preview</p>
            {generating && (
              <span className="flex items-center gap-1.5 text-[10px] text-stone-400">
                <Loader2 className="w-3 h-3 animate-spin" />Updating…
              </span>
            )}
          </div>

          {/* QR Preview */}
          <div className="flex items-center justify-center">
            {svgString ? (
              <motion.div
                key={svgString.length}
                initial={{ opacity: 0.7, scale: 0.97 }}
                animate={{ opacity: 1, scale: 1 }}
                transition={{ duration: 0.2 }}
                ref={svgRef}
                dangerouslySetInnerHTML={{ __html: svgString }}
                className="shadow-lg"
                style={{ maxWidth: 300, maxHeight: 340 }}
              />
            ) : (
              <div className="w-[300px] h-[300px] bg-white border-2 border-dashed border-stone-200 rounded-sm flex flex-col items-center justify-center gap-3">
                {generating ? (
                  <>
                    <Loader2 className="w-8 h-8 animate-spin text-indigo-300" />
                    <p className="text-xs text-stone-400">Generating…</p>
                  </>
                ) : (
                  <>
                    <div className="text-5xl opacity-20">⬛</div>
                    <p className="text-sm text-stone-300 text-center px-4">
                      Fill in the content on the left to generate your QR code
                    </p>
                  </>
                )}
              </div>
            )}
          </div>

          {genError && (
            <div className="flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm w-full">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{genError}
            </div>
          )}
        </div>

        {/* Download & save actions */}
        {svgString && (
          <div className="space-y-3">
            {/* Primary downloads */}
            <div className="grid grid-cols-2 gap-2">
              <button onClick={downloadPNG}
                className="flex items-center justify-center gap-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 py-3 rounded-sm transition-colors shadow-sm">
                <Download className="w-4 h-4" />Download PNG
              </button>
              <button onClick={downloadSVG}
                className="flex items-center justify-center gap-2 text-sm font-bold text-indigo-600 border border-indigo-300 hover:bg-indigo-50 py-3 rounded-sm transition-colors">
                <Download className="w-4 h-4" />Download SVG
              </button>
            </div>

            {/* Secondary actions */}
            <div className="flex gap-2">
              <button onClick={copySVG}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 py-2.5 rounded-sm transition-colors">
                {copied ? <><Check className="w-3.5 h-3.5 text-emerald-500" />Copied!</> : <><Copy className="w-3.5 h-3.5" />Copy SVG</>}
              </button>
              <button onClick={() => setShareMode(!shareMode)}
                className="flex-1 flex items-center justify-center gap-2 text-xs font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 py-2.5 rounded-sm transition-colors">
                <Share2 className="w-3.5 h-3.5" />Share Card
              </button>
              {isSignedIn && (
                <button onClick={handleSave} disabled={saving}
                  className={`flex-1 flex items-center justify-center gap-2 text-xs font-bold border py-2.5 rounded-sm transition-colors ${
                    saved
                      ? "text-emerald-600 border-emerald-300 bg-emerald-50"
                      : "text-stone-500 border-stone-200 hover:border-indigo-400 hover:text-indigo-600"
                  }`}>
                  {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : saved ? <Check className="w-3.5 h-3.5" /> : <Save className="w-3.5 h-3.5" />}
                  {saving ? "Saving…" : saved ? "Saved!" : "Save"}
                </button>
              )}
            </div>

            {/* Share card */}
            <AnimatePresence>
              {shareMode && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
                  className="bg-gradient-to-br from-indigo-600 to-purple-600 rounded-sm p-5 text-white text-center space-y-3">
                  <div className="flex justify-center">
                    <div className="bg-white p-2 rounded-sm shadow-lg"
                      dangerouslySetInnerHTML={{ __html: svgString }}
                      style={{ maxWidth: 120 }}
                    />
                  </div>
                  <div>
                    <p className="text-base font-black">{label || `My ${typeCfg.label}`}</p>
                    <p className="text-xs text-indigo-200 mt-1">Scan to connect instantly</p>
                  </div>
                  <div className="flex gap-2 justify-center">
                    {[
                      {
                        label: "Share on X",
                        url:   `https://twitter.com/intent/tweet?text=${encodeURIComponent(`I just created a custom QR code for my ${label || typeCfg.label}! Create yours free at isaacpaha.com/tools/qr-code-generator 📱`)}`,
                        bg:    "bg-black",
                      },
                      {
                        label: "Copy Link",
                        url:   null,
                        bg:    "bg-white/20",
                      },
                    ].map((btn) =>
                      btn.url ? (
                        <a key={btn.label} href={btn.url} target="_blank" rel="noopener noreferrer"
                          className={`${btn.bg} text-white text-xs font-bold px-4 py-2 rounded-sm transition-opacity hover:opacity-90`}>
                          {btn.label}
                        </a>
                      ) : (
                        <button key={btn.label}
                          onClick={() => {
                            navigator.clipboard.writeText("https://isaacpaha.com/tools/qr-code-generator");
                            setCopied(true); setTimeout(() => setCopied(false), 2000);
                          }}
                          className={`${btn.bg} text-white text-xs font-bold px-4 py-2 rounded-sm transition-opacity hover:opacity-90`}>
                          {copied ? "Copied!" : btn.label}
                        </button>
                      )
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        )}

        {/* Tips */}
        <div className="bg-stone-50 border border-stone-100 rounded-sm p-4 space-y-2">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Tips for a great QR code</p>
          {[
            "Test your QR code by scanning it before printing.",
            "Use high error correction (H) when adding a logo — it compensates for the covered area.",
            "SVG format is best for printing on business cards and posters — infinite resolution.",
            "Keep the background light and the QR dark for best scan rates.",
          ].map((tip) => (
            <p key={tip} className="text-[11px] text-stone-500 flex items-start gap-2">
              <span className="text-indigo-400 flex-shrink-0">›</span>{tip}
            </p>
          ))}
        </div>
      </div>
    </div>
  );
}
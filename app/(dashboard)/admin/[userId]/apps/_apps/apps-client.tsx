"use client";

// =============================================================================
// isaacpaha.com — Apps Admin Client (Fixed & Enhanced)
// components/admin/apps/apps-admin-client.tsx
// =============================================================================

import React, {
  useState, useCallback, useRef, useEffect, 
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  AppWindow, Plus, Search, Edit2, Trash2, Star, StarOff,
  Copy, Check, X, AlertCircle, Loader2, ArrowLeft,
  Globe, Github, ExternalLink, Tag, TrendingUp, Users,
  Eye, Heart, Save, ChevronDown, MoreHorizontal,
  CheckSquare, Square, Smartphone, Play, Apple,
  Code2, Database, Server, Shield, Zap, Package,
  BarChart2, Building2, Calendar, ImagePlus, Clock, Layers, Grid3x3, List,
  Pencil, 
} from "lucide-react";
import Image from "next/image";

// ─── Types ────────────────────────────────────────────────────────────────────

type AppStatus = "LIVE" | "BETA" | "IN_DEVELOPMENT" | "COMING_SOON" | "DEPRECATED";

type Screenshot = { id: string; url: string; alt: string | null; order: number };
type ChangelogEntry = {
  id: string; version: string; title: string;
  description: string; type: string; releasedAt: Date;
};

type TechStack = { name: string; category: string };

type AppSummary = {
  id: string;
  name: string;
  slug: string;
  tagline: string;
  description: string;
  category: string;
  status: AppStatus;
  emoji: string;
  accentColor: string;
  coverImage: string | null;
  logoImage: string | null;
  isFeatured: boolean;
  isNew: boolean;
  company: { name: string; flag: string; slug: string };
  companyId: string;
  appUrl: string | null;
  githubUrl: string | null;
  playStoreUrl: string | null;
  appStoreUrl: string | null;
  techStack: TechStack[];
  userCount: number;
  viewCount: number;
  likeCount: number;
  launchDate: Date | null;
  createdAt: Date;
  updatedAt: Date;
  _count: { screenshots: number; changelog: number };
  changelog: { version: string; releasedAt: Date }[];
};

type AppFull = AppSummary & {
  fullDescription: string | null;
  problemSolved: string | null;
  businessModel: string | null;
  targetUsers: string | null;
  nextMilestone: string | null;
  primaryCategory: string | null;
  screenshots: Screenshot[];
  changelog: ChangelogEntry[];
  metrics: any[];
  features: any[];
  integrations: any[];
  pricingTiers: any[];
  faqs: any[];
  awards: any[];
};

type Stats = {
  total: number;
  live: number;
  beta: number;
  inDev: number;
  comingSoon: number;
  deprecated: number;
  totalUsers: number;
  totalViews: number;
  byCompany: { companyId: string; count: number }[];
  byStatus: { status: AppStatus; count: number }[];
  topViewed: { 
    id: string; 
    name: string; 
    emoji: string; 
    status: AppStatus; 
    company: { name: string; flag: string };
    userCount: number; 
    viewCount: number; 
    accentColor: string;
  }[];
};

interface Props {
  userId: string;
  stats: Stats;
  initialApps: AppSummary[];
  appTotal: number;
  appPages: number;
  initialTab: "apps" | "editor" | "stats";
  initialSearch: string;
  initialStatus: string;
  initialCompany: string;
  initialEditId?: string;
  currentPage: number;
}

// ─── Config ───────────────────────────────────────────────────────────────────

const STATUS_CFG: Record<AppStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
  LIVE: { label: "Live", color: "#059669", bg: "#d1fae5", border: "#a7f3d0", dot: "#10b981" },
  BETA: { label: "Beta", color: "#d97706", bg: "#fef3c7", border: "#fde68a", dot: "#f59e0b" },
  IN_DEVELOPMENT: { label: "In Development", color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe", dot: "#3b82f6" },
  COMING_SOON: { label: "Coming Soon", color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", dot: "#9ca3af" },
  DEPRECATED: { label: "Deprecated", color: "#dc2626", bg: "#fee2e2", border: "#fecaca", dot: "#ef4444" },
};

const COMPANIES = [
  { id: "iPaha Ltd", flag: "🇬🇧", color: "#f59e0b", short: "iPaha" },
  { id: "iPahaStores Ltd", flag: "🇬🇧", color: "#3b82f6", short: "iPahaStores" },
  { id: "Okpah Ltd", flag: "🇬🇭", color: "#10b981", short: "Okpah" },
];

const CATEGORIES = [
  "Jobs & Recruitment", "E-Commerce", "Fintech", "AI & Productivity",
  "Education", "Logistics", "Marketplace", "SaaS", "Mobile", "Other",
];

const CHANGELOG_TYPES = [
  { value: "feature", label: "✨ Feature", color: "#8b5cf6" },
  { value: "improvement", label: "⚡ Improvement", color: "#3b82f6" },
  { value: "fix", label: "🐛 Bug Fix", color: "#10b981" },
  { value: "breaking", label: "⚠️ Breaking", color: "#ef4444" },
  { value: "launch", label: "🚀 Launch", color: "#f59e0b" },
];

const TECH_CATEGORIES = [
  { id: "frontend", label: "Frontend", icon: Globe, color: "#3b82f6" },
  { id: "backend", label: "Backend", icon: Server, color: "#10b981" },
  { id: "database", label: "Database", icon: Database, color: "#f59e0b" },
  { id: "infra", label: "Infra", icon: Layers, color: "#8b5cf6" },
  { id: "auth", label: "Auth", icon: Shield, color: "#ec4899" },
  { id: "api", label: "API", icon: Zap, color: "#f97316" },
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function toSlug(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
}

function fmtDate(d: Date | string): string {
  const date = new Date(d);
  const days = Math.floor((Date.now() - date.getTime()) / 86400000);
  if (days < 1) return "today";
  if (days === 1) return "yesterday";
  if (days < 7) return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
}

// ─── Status badge ─────────────────────────────────────────────────────────────

function StatusBadge({ status, sm }: { status: AppStatus; sm?: boolean }) {
  const c = STATUS_CFG[status];
  return (
    <span
      className={`inline-flex items-center gap-1.5 font-bold rounded-sm flex-shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
      style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
    >
      <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
      {c.label}
    </span>
  );
}

// ─── Company badge ────────────────────────────────────────────────────────────

function CompanyBadge({ companyName, flag, sm }: { companyName: string; flag: string; sm?: boolean }) {
  const cfg = COMPANIES.find((c) => c.id === companyName);
  return (
    <span
      className={`inline-flex items-center gap-1 font-semibold rounded-sm ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
      style={{ color: cfg?.color ?? "#6b7280", backgroundColor: `${cfg?.color ?? "#6b7280"}15` }}
    >
      {flag} {cfg?.short ?? companyName}
    </span>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, message, danger = false, confirmLabel = "Confirm",
  onConfirm, onCancel, loading,
}: {
  open: boolean; title: string; message: string;
  danger?: boolean; confirmLabel?: string;
  onConfirm: () => void; onCancel: () => void; loading: boolean;
}) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onCancel}
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-start gap-3 mb-5">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
                <AlertCircle className={`w-4 h-4 ${danger ? "text-red-500" : "text-amber-500"}`} />
              </div>
              <div>
                <p className="text-sm font-black text-stone-900">{title}</p>
                <p className="text-xs text-stone-500 mt-1 leading-relaxed">{message}</p>
              </div>
            </div>
            <div className="flex gap-2 justify-end">
              <button onClick={onCancel}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">
                Cancel
              </button>
              <button onClick={onConfirm} disabled={loading}
                className={`text-xs font-bold text-white px-4 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}>
                {loading && <Loader2 className="w-3 h-3 animate-spin" />}
                {confirmLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── App card (grid view) ─────────────────────────────────────────────────────

function AppCard({
  app, selected, onSelect, onEdit, onDelete, onToggleFeatured, onDuplicate,
}: {
  app: AppSummary;
  selected: boolean;
  onSelect: (id: string) => void;
  onEdit: (app: AppSummary) => void;
  onDelete: (id: string, name: string) => void;
  onToggleFeatured: (id: string) => void;
  onDuplicate: (id: string) => void;
}) {
  const [menuOpen, setMenuOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
    document.addEventListener("mousedown", h);
    return () => document.removeEventListener("mousedown", h);
  }, []);

  const tech = app.techStack?.slice(0, 4) || [];

  return (
    <motion.div
      layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
      className={`group relative bg-white border rounded-sm overflow-hidden transition-all hover:shadow-md ${
        selected ? "border-amber-300 ring-1 ring-amber-200" : "border-stone-100 hover:border-stone-200"
      }`}
    >
      <div className="h-1 w-full" style={{ backgroundColor: app.accentColor }} />

      <div className="p-4 pb-3">
        <div className="flex items-start gap-3">
          <button onClick={() => onSelect(app.id)} className="flex-shrink-0 mt-0.5">
            {selected
              ? <CheckSquare className="w-4 h-4 text-amber-500" />
              : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400 transition-colors" />
            }
          </button>

          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              <span className="text-xl">{app.emoji}</span>
              <button onClick={() => onEdit(app)}
                className="text-sm font-black text-stone-900 hover:text-amber-600 transition-colors text-left leading-tight">
                {app.name}
              </button>
              {app.isFeatured && (
                <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  Featured
                </span>
              )}
              {app.isNew && (
                <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
                  New
                </span>
              )}
            </div>
            <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">{app.tagline}</p>
          </div>

          <div className="relative flex-shrink-0" ref={menuRef}>
            <button onClick={() => setMenuOpen((p) => !p)}
              className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors">
              <MoreHorizontal className="w-4 h-4" />
            </button>
            <AnimatePresence>
              {menuOpen && (
                <motion.div
                  initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
                  exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}
                  className="absolute right-0 top-8 z-20 w-44 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden"
                >
                  {[
                    { label: "Edit", icon: Edit2, action: () => { onEdit(app); setMenuOpen(false); } },
                    { label: "Duplicate", icon: Copy, action: () => { onDuplicate(app.id); setMenuOpen(false); } },
                    { label: app.isFeatured ? "Unfeature" : "Set Featured", icon: Star, action: () => { onToggleFeatured(app.id); setMenuOpen(false); } },
                  ].map((m) => (
                    <button key={m.label} onClick={m.action}
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                      <m.icon className="w-3.5 h-3.5 text-stone-400" />{m.label}
                    </button>
                  ))}
                  {app.appUrl && (
                    <a href={app.appUrl} target="_blank" rel="noopener noreferrer"
                      className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
                      <ExternalLink className="w-3.5 h-3.5 text-stone-400" />View Live
                    </a>
                  )}
                  <div className="border-t border-stone-100" />
                  <button onClick={() => { onDelete(app.id, app.name); setMenuOpen(false); }}
                    className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
                    <Trash2 className="w-3.5 h-3.5" />Delete
                  </button>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>
      </div>

      <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
        <StatusBadge status={app.status} sm />
        <CompanyBadge companyName={app.company.name} flag={app.company.flag} sm />
        <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{app.category}</span>
      </div>

      {tech.length > 0 && (
        <div className="px-4 pb-3 flex items-center gap-1 flex-wrap">
          {tech.map((t) => (
            <span key={t.name} className="text-[9px] font-mono text-stone-400 bg-stone-50 border border-stone-100 px-1.5 py-0.5 rounded-sm">
              {t.name}
            </span>
          ))}
          {(app.techStack?.length || 0) > 4 && (
            <span className="text-[9px] text-stone-300">+{(app.techStack?.length || 0) - 4}</span>
          )}
        </div>
      )}

      <div className="px-4 pb-3 flex items-center gap-3 text-[11px] text-stone-400 border-t border-stone-50 pt-2.5">
        <span className="flex items-center gap-1"><Users className="w-3 h-3" />{app.userCount.toLocaleString()}</span>
        {/* <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{app.viewCount.toLocaleString()}</span> */}
        <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{app.likeCount}</span>
        <span className="ml-auto flex items-center gap-1">
          <Package className="w-3 h-3" />{app._count.screenshots}
          <Clock className="w-3 h-3 ml-1.5" />{app._count.changelog}
        </span>
      </div>

      <div className="px-4 py-2 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between">
        {app.changelog[0] ? (
          <span className="text-[10px] text-stone-400">v{app.changelog[0].version}</span>
        ) : (
          <span className="text-[10px] text-stone-300">No releases</span>
        )}
        <span className="text-[10px] text-stone-300">{fmtDate(app.updatedAt)}</span>
      </div>
    </motion.div>
  );
}

// ─── Editor ───────────────────────────────────────────────────────────────────

function AppEditor({
  app, onSaved, onCancel,
}: {
  app: AppFull | null;
  onSaved: (saved: AppFull) => void;
  onCancel: () => void;
}) {
  const isEdit = !!app;

  // Core fields
  const [name, setName] = useState(app?.name ?? "");
  const [slug, setSlug] = useState(app?.slug ?? "");
  const [tagline, setTagline] = useState(app?.tagline ?? "");
  const [description, setDescription] = useState(app?.description ?? "");
  const [fullDescription, setFullDescription] = useState(app?.fullDescription ?? "");
  const [problemSolved, setProblemSolved] = useState(app?.problemSolved ?? "");
  const [businessModel, setBusinessModel] = useState(app?.businessModel ?? "");
  const [targetUsers, setTargetUsers] = useState(app?.targetUsers ?? "");
  const [category, setCategory] = useState(app?.category ?? "Other");
  const [status, setStatus] = useState<AppStatus>(app?.status ?? "IN_DEVELOPMENT");
  const [emoji, setEmoji] = useState(app?.emoji ?? "📱");
  const [accentColor, setAccentColor] = useState(app?.accentColor ?? "#f59e0b");
  const [coverImage, setCoverImage] = useState(app?.coverImage ?? "");
  const [logoImage, setLogoImage] = useState(app?.logoImage ?? "");
  const [companyId, setCompanyId] = useState(app?.companyId ?? COMPANIES[0].id);
  const [isFeatured, setIsFeatured] = useState(app?.isFeatured ?? false);
  const [isNew, setIsNew] = useState(app?.isNew ?? true);
  const [appUrl, setAppUrl] = useState(app?.appUrl ?? "");
  const [githubUrl, setGithubUrl] = useState(app?.githubUrl ?? "");
  const [playStoreUrl, setPlayStoreUrl] = useState(app?.playStoreUrl ?? "");
  const [appStoreUrl, setAppStoreUrl] = useState(app?.appStoreUrl ?? "");
  const [userCount, setUserCount] = useState(app?.userCount ?? 0);
  const [launchDate, setLaunchDate] = useState(
    app?.launchDate ? new Date(app.launchDate).toISOString().slice(0, 10) : ""
  );

  // Tech stack
  const [techStack, setTechStack] = useState<TechStack[]>(app?.techStack ?? []);
  const [techInput, setTechInput] = useState("");
  const [techCategory, setTechCategory] = useState("frontend");

  // Screenshots
  const [screenshots, setScreenshots] = useState<Screenshot[]>(app?.screenshots ?? []);
  const [ssUrlInput, setSsUrlInput] = useState("");
  const [ssAltInput, setSsAltInput] = useState("");
  const [ssAdding, setSsAdding] = useState(false);

  // Changelog
  const [changelog, setChangelog] = useState<ChangelogEntry[]>(app?.changelog ?? []);
  const [clForm, setClForm] = useState({ 
    version: "", title: "", description: "", type: "feature", 
    releasedAt: new Date().toISOString().slice(0, 10) 
  });
  const [clAdding, setClAdding] = useState(false);
  const [showClForm, setShowClForm] = useState(false);

  // Active section
  const [section, setSection] = useState<"core" | "details" | "links" | "tech" | "screenshots" | "changelog">("core");

  // Save state
  const [saving, setSaving] = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const slugTouched = useRef(!!app);
  useEffect(() => {
    if (!slugTouched.current) setSlug(toSlug(name));
  }, [name]);

  const addTech = () => {
    const t = techInput.trim();
    if (t && !techStack.find((s) => s.name.toLowerCase() === t.toLowerCase())) {
      setTechStack((prev) => [...prev, { name: t, category: techCategory }]);
    }
    setTechInput("");
  };

  const removeTech = (name: string) => {
    setTechStack((prev) => prev.filter((s) => s.name !== name));
  };

  const addScreenshotFn = async () => {
    if (!ssUrlInput.trim() || !app) return;
    setSsAdding(true);
    try {
      const res = await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "addScreenshot", url: ssUrlInput.trim(), alt: ssAltInput.trim() || null }),
      });
      const ss = await res.json();
      setScreenshots((prev) => [...prev, ss]);
      setSsUrlInput("");
      setSsAltInput("");
    } catch (error) {
      console.error("Failed to add screenshot:", error);
    }
    setSsAdding(false);
  };

  const removeScreenshot = async (id: string) => {
    if (!app) {
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
      return;
    }
    try {
      await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "deleteScreenshot", screenshotId: id }),
      });
      setScreenshots((prev) => prev.filter((s) => s.id !== id));
    } catch (error) {
      console.error("Failed to delete screenshot:", error);
    }
  };

  const addChangelogFn = async () => {
    if (!clForm.version.trim() || !clForm.title.trim()) return;
    setClAdding(true);

    if (app) {
      try {
        const res = await fetch(`/api/admin/apps/${app.id}`, {
          method: "PATCH", headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ _action: "addChangelog", ...clForm, releasedAt: clForm.releasedAt }),
        });
        const entry = await res.json();
        setChangelog((prev) => [entry, ...prev]);
      } catch (error) {
        console.error("Failed to add changelog:", error);
      }
    } else {
      const fakeEntry: ChangelogEntry = {
        id: `temp-${Date.now()}`,
        version: clForm.version,
        title: clForm.title,
        description: clForm.description,
        type: clForm.type,
        releasedAt: new Date(clForm.releasedAt),
      };
      setChangelog((prev) => [fakeEntry, ...prev]);
    }

    setClForm({ version: "", title: "", description: "", type: "feature", releasedAt: new Date().toISOString().slice(0, 10) });
    setShowClForm(false);
    setClAdding(false);
  };

  const removeChangelog = async (id: string) => {
    if (!app || id.startsWith("temp-")) {
      setChangelog((prev) => prev.filter((c) => c.id !== id));
      return;
    }
    try {
      await fetch(`/api/admin/apps/${app.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ _action: "deleteChangelog", changelogId: id }),
      });
      setChangelog((prev) => prev.filter((c) => c.id !== id));
    } catch (error) {
      console.error("Failed to delete changelog:", error);
    }
  };

  const handleSave = async () => {
    if (!name.trim() || !tagline.trim() || !companyId) {
      setSaveErr("Name, tagline and company are required.");
      return;
    }
    setSaving(true);
    setSaveErr("");

    try {
      const body = {
        name: name.trim(),
        slug: slug.trim() || toSlug(name),
        tagline: tagline.trim(),
        description: description.trim(),
        fullDescription: fullDescription.trim() || null,
        problemSolved: problemSolved.trim() || null,
        businessModel: businessModel.trim() || null,
        targetUsers: targetUsers.trim() || null,
        category,
        status,
        emoji,
        accentColor,
        coverImage: coverImage.trim() || null,
        logoImage: logoImage.trim() || null,
        companyId,
        isFeatured,
        isNew,
        appUrl: appUrl.trim() || null,
        githubUrl: githubUrl.trim() || null,
        playStoreUrl: playStoreUrl.trim() || null,
        appStoreUrl: appStoreUrl.trim() || null,
        techStack,
        userCount: Number(userCount),
        launchDate: launchDate || null,
      };

      let saved: AppFull;
      if (isEdit && app) {
        const res = await fetch(`/api/admin/apps/${app.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to update app");
        saved = await res.json();
      } else {
        const res = await fetch("/api/admin/apps", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(body),
        });
        if (!res.ok) throw new Error("Failed to create app");
        const data = await res.json();
        saved = data.app;
        
        // Save pending changelog entries for new app
        for (const cl of changelog.filter((c) => c.id.startsWith("temp-"))) {
          await fetch(`/api/admin/apps/${saved.id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ 
              _action: "addChangelog", 
              version: cl.version, 
              title: cl.title, 
              description: cl.description, 
              type: cl.type, 
              releasedAt: cl.releasedAt 
            }),
          });
        }
      }

      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved({ ...saved, screenshots, changelog, techStack });
    } catch (e: any) {
      setSaveErr(e.message || "Save failed");
    }
    setSaving(false);
  };

  const SECTIONS = [
    { id: "core", label: "Core Info", count: null },
    { id: "details", label: "Details", count: null },
    { id: "links", label: "Links", count: null },
    { id: "tech", label: "Tech Stack", count: techStack.length },
    { id: "screenshots", label: "Screenshots", count: screenshots.length },
    { id: "changelog", label: "Changelog", count: changelog.length },
  ] as const;

  return (
    <div className="flex flex-col h-full overflow-hidden">
      <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-stone-100 flex-shrink-0">
        <button onClick={onCancel}
          className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back to Apps
        </button>
        <div className="flex items-center gap-2">
          {app?.appUrl && (
            <a href={app.appUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
              <ExternalLink className="w-3 h-3" />View Live
            </a>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
            {saving ? "Saving…" : savedOk ? "Saved!" : isEdit ? "Save Changes" : "Create App"}
          </button>
        </div>
      </div>

      {saveErr && (
        <div className="mx-6 mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        <div className="w-40 flex-shrink-0 border-r border-stone-100 p-3 space-y-0.5 overflow-y-auto">
          {SECTIONS.map((s) => (
            <button key={s.id} onClick={() => setSection(s.id)}
              className={`w-full flex items-center justify-between px-2.5 py-2 rounded-sm text-left text-xs font-semibold transition-colors ${
                section === s.id ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
              }`}>
              {s.label}
              {s.count !== null && s.count > 0 && (
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${section === s.id ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"}`}>
                  {s.count}
                </span>
              )}
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-y-auto p-6">
          {/* CORE INFO */}
          {section === "core" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Core Information</h2>

              <div className="flex items-end gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Emoji</label>
                  <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
                    className="w-16 text-center text-2xl border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
                <div className="flex-1">
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">App Name <span className="text-red-400">*</span></label>
                  <input value={name} onChange={(e) => setName(e.target.value)}
                    placeholder="oKadwuma, Paralel Me…"
                    className="w-full text-sm font-bold border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Accent Colour</label>
                  <div className="flex items-center gap-2 border border-stone-200 rounded-sm px-2 py-1.5 bg-white">
                    <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
                      className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent" />
                    <span className="text-[11px] font-mono text-stone-500">{accentColor}</span>
                  </div>
                </div>
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Slug</label>
                <input value={slug} onChange={(e) => { slugTouched.current = true; setSlug(e.target.value); }}
                  className="w-full text-xs font-mono border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
                  Tagline <span className="text-red-400">*</span>
                  <span className="ml-1 text-stone-300 font-normal normal-case">(one-line pitch)</span>
                </label>
                <input value={tagline} onChange={(e) => setTagline(e.target.value)}
                  placeholder="West Africa's professional jobs platform"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Short Description</label>
                <textarea value={description} onChange={(e) => setDescription(e.target.value)}
                  rows={3} placeholder="2-3 sentences for the app card…"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-y bg-white"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Company <span className="text-red-400">*</span></label>
                  <select value={companyId} onChange={(e) => setCompanyId(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                    {COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.id}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Status</label>
                  <select value={status} onChange={(e) => setStatus(e.target.value as AppStatus)}
                    className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                    {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
                  </select>
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Category</label>
                  <select value={category} onChange={(e) => setCategory(e.target.value)}
                    className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex gap-2">
                  <button onClick={() => setIsFeatured((p) => !p)}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                      isFeatured ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-500 border-stone-200"
                    }`}>
                    <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
                    {isFeatured ? "Featured" : "Not Featured"}
                  </button>
                  <button onClick={() => setIsNew((p) => !p)}
                    className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
                      isNew ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-50 text-stone-500 border-stone-200"
                    }`}>
                    {isNew ? "🆕 New" : "Not New"}
                  </button>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Users</label>
                    <input type="number" value={userCount} onChange={(e) => setUserCount(Number(e.target.value))} min={0}
                      className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
                    />
                  </div>
                  <div>
                    <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Launch Date</label>
                    <input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)}
                      className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
                    />
                  </div>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Cover Image URL</label>
                  <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
                    placeholder="https://… (Cloudinary)"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
                <div>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Logo Image URL</label>
                  <input value={logoImage} onChange={(e) => setLogoImage(e.target.value)}
                    placeholder="https://…"
                    className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
                  />
                </div>
              </div>
            </div>
          )}

          {/* DETAILS */}
          {section === "details" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">App Details</h2>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Full Description</label>
                <textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)}
                  rows={8} placeholder="Long-form description — tell the full story of this app, its context, and what makes it different…"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-3 focus:outline-none focus:border-amber-400 resize-y bg-white leading-relaxed"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
                  Problem Solved
                  <span className="ml-1 text-stone-300 font-normal normal-case">(what gap does this fill?)</span>
                </label>
                <textarea value={problemSolved} onChange={(e) => setProblemSolved(e.target.value)}
                  rows={3} placeholder="Professional hiring in West Africa relies on personal networks…"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-y bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Target Users</label>
                <input value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)}
                  placeholder="Job-seeking professionals and employers across Ghana and West Africa"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>

              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Business Model</label>
                <input value={businessModel} onChange={(e) => setBusinessModel(e.target.value)}
                  placeholder="Freemium — free for candidates, subscription tiers for employers…"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>
            </div>
          )}

          {/* LINKS */}
          {section === "links" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Links</h2>

              {[
                { label: "Live App URL", icon: Globe, value: appUrl, set: setAppUrl, placeholder: "https://okpah.com" },
                { label: "GitHub URL", icon: Github, value: githubUrl, set: setGithubUrl, placeholder: "https://github.com/iPaha1/…" },
                { label: "Google Play Store URL", icon: Play, value: playStoreUrl, set: setPlayStoreUrl, placeholder: "https://play.google.com/store/apps/…" },
                { label: "Apple App Store URL", icon: Apple, value: appStoreUrl, set: setAppStoreUrl, placeholder: "https://apps.apple.com/…" },
              ].map((field) => (
                <div key={field.label}>
                  <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">{field.label}</label>
                  <div className="flex items-center gap-2 border border-stone-200 rounded-sm px-3 py-2 focus-within:border-amber-400 bg-white">
                    <field.icon className="w-4 h-4 text-stone-300 flex-shrink-0" />
                    <input value={field.value} onChange={(e) => field.set(e.target.value)}
                      placeholder={field.placeholder}
                      className="flex-1 text-sm focus:outline-none bg-transparent"
                    />
                    {field.value && (
                      <a href={field.value} target="_blank" rel="noopener noreferrer"
                        className="text-stone-300 hover:text-stone-700 transition-colors">
                        <ExternalLink className="w-3.5 h-3.5" />
                      </a>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* TECH STACK */}
          {section === "tech" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Tech Stack</h2>

              <div className="flex gap-2">
                <select value={techCategory} onChange={(e) => setTechCategory(e.target.value)}
                  className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
                  {TECH_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
                </select>
                <input value={techInput} onChange={(e) => setTechInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
                  placeholder="Next.js 14, TypeScript, PostgreSQL…"
                  className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                />
                <button onClick={addTech}
                  className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">
                  Add
                </button>
              </div>

              {TECH_CATEGORIES.map((cat) => {
                const items = techStack.filter((t) => t.category === cat.id);
                if (items.length === 0) return null;
                return (
                  <div key={cat.id}>
                    <div className="flex items-center gap-2 mb-2">
                      <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
                      <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{cat.label}</span>
                    </div>
                    <div className="flex flex-wrap gap-1.5">
                      {items.map((t) => (
                        <span key={t.name}
                          className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-sm border"
                          style={{ color: cat.color, backgroundColor: `${cat.color}10`, borderColor: `${cat.color}30` }}>
                          {t.name}
                          <button onClick={() => removeTech(t.name)}
                            className="hover:text-red-500 transition-colors ml-1">
                            <X className="w-2.5 h-2.5" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                );
              })}

              {techStack.length === 0 && (
                <div className="text-center py-8 text-stone-300">
                  <Code2 className="w-8 h-8 mx-auto mb-2" />
                  <p className="text-sm">No tech stack added yet</p>
                </div>
              )}
            </div>
          )}

          {/* SCREENSHOTS */}
          {section === "screenshots" && (
            <div className="max-w-2xl space-y-5">
              <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Screenshots</h2>

              <div className="border border-stone-200 rounded-sm p-4 space-y-3">
                <p className="text-xs font-bold text-stone-600">Add Screenshot</p>
                <input value={ssUrlInput} onChange={(e) => setSsUrlInput(e.target.value)}
                  placeholder="Image URL (Cloudinary, etc.)…"
                  className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                />
                <div className="flex gap-2">
                  <input value={ssAltInput} onChange={(e) => setSsAltInput(e.target.value)}
                    placeholder="Alt text / description…"
                    className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                  />
                  <button
                    onClick={isEdit ? addScreenshotFn : () => {
                      if (!ssUrlInput.trim()) return;
                      const fakeId = `temp-${Date.now()}`;
                      setScreenshots((prev) => [...prev, { id: fakeId, url: ssUrlInput.trim(), alt: ssAltInput.trim() || null, order: prev.length }]);
                      setSsUrlInput("");
                      setSsAltInput("");
                    }}
                    disabled={!ssUrlInput.trim() || ssAdding}
                    className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
                  >
                    {ssAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
                    Add
                  </button>
                </div>
              </div>

              {screenshots.length === 0 ? (
                <div className="text-center py-10 text-stone-300">
                  <Smartphone className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No screenshots yet</p>
                </div>
              ) : (
                <div className="grid grid-cols-2 gap-3">
                  {screenshots.sort((a, b) => a.order - b.order).map((ss) => (
                    <div key={ss.id} className="relative group border border-stone-200 rounded-sm overflow-hidden bg-stone-50">
                      <div className="relative aspect-video">
                        <Image 
                          src={ss.url} 
                          alt={ss.alt || "Screenshot"} 
                          fill
                          className="object-cover"
                        />
                      </div>
                      <div className="p-2">
                        <p className="text-[10px] text-stone-500 truncate">{ss.alt || "No alt text"}</p>
                        <p className="text-[9px] text-stone-300 font-mono truncate">{ss.url}</p>
                      </div>
                      <button onClick={() => removeScreenshot(ss.id)}
                        className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* CHANGELOG */}
          {section === "changelog" && (
            <div className="max-w-2xl space-y-5">
              <div className="flex items-center justify-between">
                <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Changelog</h2>
                <button onClick={() => setShowClForm((p) => !p)}
                  className="flex items-center gap-1.5 text-xs font-bold text-amber-600 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-sm transition-colors">
                  <Plus className="w-3.5 h-3.5" />Add Release
                </button>
              </div>

              <AnimatePresence>
                {showClForm && (
                  <motion.div
                    initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
                    exit={{ opacity: 0, height: 0 }}
                    className="border border-amber-200 bg-amber-50/40 rounded-sm overflow-hidden"
                  >
                    <div className="p-4 space-y-3">
                      <div className="grid grid-cols-3 gap-3">
                        <div>
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Version</label>
                          <input value={clForm.version} onChange={(e) => setClForm((f) => ({ ...f, version: e.target.value }))}
                            placeholder="2.5.0"
                            className="w-full text-xs font-mono border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Type</label>
                          <select value={clForm.type} onChange={(e) => setClForm((f) => ({ ...f, type: e.target.value }))}
                            className="w-full text-xs border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400 bg-white">
                            {CHANGELOG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                          </select>
                        </div>
                        <div>
                          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Released</label>
                          <input type="date" value={clForm.releasedAt} onChange={(e) => setClForm((f) => ({ ...f, releasedAt: e.target.value }))}
                            className="w-full text-xs border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400 bg-white"
                          />
                        </div>
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Title</label>
                        <input value={clForm.title} onChange={(e) => setClForm((f) => ({ ...f, title: e.target.value }))}
                          placeholder="WhatsApp Alerts & Messaging"
                          className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Description / Notes</label>
                        <textarea value={clForm.description} onChange={(e) => setClForm((f) => ({ ...f, description: e.target.value }))}
                          rows={3} placeholder="What changed in this release…"
                          className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 resize-none bg-white"
                        />
                      </div>
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => setShowClForm(false)}
                          className="text-xs text-stone-400 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-stone-400 transition-colors">
                          Cancel
                        </button>
                        <button onClick={addChangelogFn} disabled={!clForm.version.trim() || !clForm.title.trim() || clAdding}
                          className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-1.5">
                          {clAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
                          Add Entry
                        </button>
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>

              {changelog.length === 0 ? (
                <div className="text-center py-10 text-stone-300">
                  <Clock className="w-10 h-10 mx-auto mb-2" />
                  <p className="text-sm">No changelog entries yet</p>
                </div>
              ) : (
                <div className="space-y-2">
                  {changelog.sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()).map((entry) => {
                    const typeCfg = CHANGELOG_TYPES.find((t) => t.value === entry.type) ?? CHANGELOG_TYPES[0];
                    return (
                      <div key={entry.id} className="group flex items-start gap-3 p-3 border border-stone-100 rounded-sm hover:border-stone-200 bg-white transition-colors">
                        <div className="flex-shrink-0">
                          <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm" style={{ color: typeCfg.color, backgroundColor: `${typeCfg.color}15` }}>
                            {typeCfg.label}
                          </span>
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 mb-0.5">
                            <span className="text-xs font-mono font-bold text-stone-700">v{entry.version}</span>
                            <span className="text-xs font-semibold text-stone-600">{entry.title}</span>
                          </div>
                          {entry.description && (
                            <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">{entry.description}</p>
                          )}
                          <p className="text-[10px] text-stone-300 mt-1">{fmtDate(entry.releasedAt)}</p>
                        </div>
                        <button onClick={() => removeChangelog(entry.id)}
                          className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors opacity-0 group-hover:opacity-100">
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

// ─── Stats tab ────────────────────────────────────────────────────────────────

function StatsTab({ stats }: { stats: Stats }) {
  return (
    <div className="p-6 max-w-5xl space-y-8">
      <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Portfolio Overview</h2>

      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Status Breakdown</p>
        <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
          {Object.entries(STATUS_CFG).map(([key, cfg]) => {
            const count = stats.byStatus.find((b) => b.status === key)?.count ?? 0;
            return (
              <div key={key} className="bg-white border border-stone-100 rounded-sm p-4 text-center">
                <div className="w-2.5 h-2.5 rounded-full mx-auto mb-2" style={{ backgroundColor: cfg.dot }} />
                <p className="text-2xl font-black text-stone-900">{count}</p>
                <p className="text-[11px] text-stone-400 font-semibold mt-1">{cfg.label}</p>
              </div>
            );
          })}
        </div>
      </div>

      <div>
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">By Company</p>
        <div className="grid grid-cols-3 gap-4">
          {COMPANIES.map((company) => {
            const count = stats.byCompany.find((b) => b.companyId === company.id)?.count ?? 0;
            return (
              <div key={company.id} className="bg-white border border-stone-100 rounded-sm p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-xl">{company.flag}</span>
                  <p className="text-xs font-black text-stone-800">{company.short}</p>
                </div>
                <p className="text-3xl font-black" style={{ color: company.color }}>{count}</p>
                <p className="text-[11px] text-stone-400 mt-1">app{count !== 1 ? "s" : ""}</p>
              </div>
            );
          })}
        </div>
      </div>

      {stats.topViewed.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Top Viewed Apps</p>
          <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
            {stats.topViewed.map((app, i) => (
              <div key={app.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
                <span className="text-lg font-black text-stone-200 w-7 text-right flex-shrink-0">{i + 1}</span>
                <span className="text-xl flex-shrink-0">{app.emoji}</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-bold text-stone-800 truncate">{app.name}</p>
                  <p className="text-[10px] text-stone-400">{app.company.name}</p>
                </div>
                <StatusBadge status={app.status} sm />
                <div className="text-right text-[11px] text-stone-400 flex-shrink-0 w-20">
                  <p className="font-bold text-stone-700">{app.viewCount.toLocaleString()} views</p>
                  <p>{app.userCount.toLocaleString()} users</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        {[
          { label: "Total Apps", value: stats.total, icon: AppWindow, color: "#f59e0b" },
          { label: "Live", value: stats.live, icon: Globe, color: "#10b981" },
          { label: "Total Users", value: stats.totalUsers, icon: Users, color: "#3b82f6" },
          { label: "Total Views", value: stats.totalViews, icon: Eye, color: "#8b5cf6" },
        ].map((s) => (
          <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
            <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
            <p className="text-2xl font-black text-stone-900">{s.value.toLocaleString()}</p>
            <p className="text-[11px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function AppsAdminClient({
  stats, initialApps, appTotal, appPages,
  initialTab, initialSearch, initialStatus, initialCompany,
  currentPage,
}: Props) {
  const [tab, setTab] = useState<"apps" | "editor" | "stats">(initialTab);
  const [apps, setApps] = useState<AppSummary[]>(initialApps);
  const [total, setTotal] = useState(appTotal);
  const [pages, setPages] = useState(appPages);
  const [page, setPage] = useState(currentPage);
  const [search, setSearch] = useState(initialSearch);
  const [status, setStatus] = useState(initialStatus);
  const [company, setCompany] = useState(initialCompany);
  const [sortBy, setSortBy] = useState("createdAt_desc");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<"grid" | "list">("grid");
  const [statsData, setStatsData] = useState(stats);
  const [editApp, setEditApp] = useState<AppFull | null>(null);

  const [confirm, setConfirm] = useState<{
    open: boolean; title: string; message: string; danger?: boolean;
    confirmLabel?: string; action?: () => Promise<void>;
  }>({ open: false, title: "", message: "" });
  const [confirmLoading, setConfirmLoading] = useState(false);

  const fetchApps = useCallback(async (opts?: { q?: string; st?: string; co?: string; sort?: string; pg?: number }) => {
    const q = opts?.q ?? search;
    const st = opts?.st ?? status;
    const co = opts?.co ?? company;
    const sort = opts?.sort ?? sortBy;
    const pg = opts?.pg ?? page;

    const params = new URLSearchParams({ page: String(pg), pageSize: "20" });
    if (q && q !== "") params.set("search", q);
    if (st && st !== "ALL") params.set("status", st);
    if (co && co !== "ALL") params.set("company", co);
    const [sf, sd] = sort.split("_");
    params.set("sortBy", sf);
    params.set("sortOrder", sd);

    const res = await fetch(`/api/admin/apps?${params}`);
    const data = await res.json();
    setApps(data.apps ?? []);
    setTotal(data.total ?? 0);
    setPages(data.pages ?? 1);
  }, [search, status, company, sortBy, page]);

  const openEditor = useCallback(async (app: AppSummary) => {
    const res = await fetch(`/api/admin/apps?id=${app.id}`);
    const full = await res.json();
    setEditApp(full);
    setTab("editor");
  }, []);

  const handleToggleFeatured = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/apps?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "toggleFeatured" }),
    });
    const updated = await res.json();
    setApps((prev) => prev.map((a) => ({
      ...a,
      isFeatured: a.id === id ? updated.isFeatured : (updated.isFeatured ? false : a.isFeatured),
    })));
  }, []);

  const handleDuplicate = useCallback(async (id: string) => {
    const res = await fetch(`/api/admin/apps?id=${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ _action: "duplicate" }),
    });
    const copy = await res.json();
    setApps((prev) => [{ ...copy, _count: { screenshots: 0, changelog: 0 }, changelog: [] }, ...prev]);
    setTotal((t) => t + 1);
    setStatsData((s) => ({ ...s, total: s.total + 1, inDev: s.inDev + 1 }));
  }, []);

  const handleDelete = useCallback((id: string, name: string) => {
    setConfirm({
      open: true,
      danger: true,
      title: `Delete "${name}"?`,
      message: "This app and all its screenshots and changelog entries will be permanently deleted.",
      confirmLabel: "Delete App",
      action: async () => {
        await fetch(`/api/admin/apps?id=${id}`, { method: "DELETE" });
        setApps((prev) => prev.filter((a) => a.id !== id));
        setTotal((t) => t - 1);
        setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
      },
    });
  }, []);

  const handleBulkDelete = () => {
    const ids = [...selected];
    setConfirm({
      open: true,
      danger: true,
      title: `Delete ${ids.length} app(s)?`,
      message: "All selected apps and their related data will be permanently deleted.",
      confirmLabel: "Delete All",
      action: async () => {
        await fetch("/api/admin/apps", {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ ids }),
        });
        setApps((prev) => prev.filter((a) => !ids.includes(a.id)));
        setTotal((t) => t - ids.length);
        setSelected(new Set());
      },
    });
  };

  const handleSaved = useCallback((saved: AppFull) => {
    setApps((prev) => {
      const exists = prev.find((a) => a.id === saved.id);
      const summary: AppSummary = {
        ...saved,
        _count: { screenshots: saved.screenshots?.length ?? 0, changelog: saved.changelog?.length ?? 0 },
        changelog: saved.changelog?.slice(0, 1).map((c) => ({ version: c.version, releasedAt: c.releasedAt })) ?? [],
      };
      if (exists) return prev.map((a) => a.id === saved.id ? summary : a);
      return [summary, ...prev];
    });
    if (!apps.find((a) => a.id === saved.id)) {
      setTotal((t) => t + 1);
      setStatsData((s) => ({ ...s, total: s.total + 1, inDev: s.inDev + 1 }));
    }
  }, [apps]);

  const runConfirm = async () => {
    if (!confirm.action) return;
    setConfirmLoading(true);
    await confirm.action();
    setConfirm((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  return (
    <div className="flex flex-col h-full">
      <ConfirmDialog
        open={confirm.open}
        title={confirm.title}
        message={confirm.message}
        danger={confirm.danger}
        confirmLabel={confirm.confirmLabel}
        onConfirm={runConfirm}
        onCancel={() => setConfirm((s) => ({ ...s, open: false }))}
        loading={confirmLoading}
      />

      <div className="px-6 pt-6 pb-0 border-b border-stone-100 flex-shrink-0">
        <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Apps</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.total} apps · {statsData.live} live · {statsData.beta} beta · {statsData.inDev} in dev
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setTab("stats"); }}
              className="flex items-center gap-2 text-sm font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-4 py-2.5 rounded-sm transition-colors">
              <BarChart2 className="w-4 h-4" />Stats
            </button>
            <button
              onClick={() => { setEditApp(null); setTab("editor"); }}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm">
              <Plus className="w-4 h-4" />New App
            </button>
          </div>
        </div>

        <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-7 gap-2 mb-4">
          {[
            { label: "Total", value: statsData.total, color: "#f59e0b", icon: AppWindow },
            { label: "Live", value: statsData.live, color: "#10b981", icon: Globe },
            { label: "Beta", value: statsData.beta, color: "#d97706", icon: Zap },
            { label: "In Dev", value: statsData.inDev, color: "#3b82f6", icon: Code2 },
            { label: "Coming Soon", value: statsData.comingSoon, color: "#6b7280", icon: Clock },
            { label: "Total Users", value: statsData.totalUsers, color: "#8b5cf6", icon: Users },
            { label: "Views", value: statsData.totalViews, color: "#ec4899", icon: Eye },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3">
              <s.icon className="w-3.5 h-3.5 mb-1.5" style={{ color: s.color }} />
              <p className="text-lg font-black text-stone-900">{s.value.toLocaleString()}</p>
              <p className="text-[10px] font-semibold text-stone-400">{s.label}</p>
            </div>
          ))}
        </div>

        <div className="flex items-center gap-1.5 mb-4 flex-wrap">
          <button onClick={() => { setCompany("ALL"); fetchApps({ co: "ALL" }); }}
            className={`text-[11px] font-bold px-2.5 py-1 rounded-sm border transition-colors ${company === "ALL" ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}>
            All companies
          </button>
          {COMPANIES.map((c) => (
            <button key={c.id} onClick={() => { setCompany(c.id); fetchApps({ co: c.id }); }}
              className={`text-[11px] font-bold px-2.5 py-1 rounded-sm border transition-colors ${company === c.id ? "text-white border-transparent" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}
              style={company === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}>
              {c.flag} {c.short}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-0.5">
          {[
            { id: "apps", label: "All Apps", icon: Grid3x3 },
            { id: "editor", label: editApp ? `Editing: ${editApp.name}` : "New App", icon: Pencil },
            { id: "stats", label: "Stats", icon: BarChart2 },
          ].map((t) => (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
                tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>
      </div>

      {tab === "apps" && (
        <div className="flex-1 overflow-hidden flex flex-col">
          <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-100 flex-wrap flex-shrink-0">
            <div className="relative flex-1 min-w-[180px] max-w-xs">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
              <input
                value={search}
                onChange={(e) => { setSearch(e.target.value); setPage(1); fetchApps({ q: e.target.value, pg: 1 }); }}
                placeholder="Search apps…"
                className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
              />
            </div>

            <select value={status}
              onChange={(e) => { setStatus(e.target.value); setPage(1); fetchApps({ st: e.target.value, pg: 1 }); }}
              className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
              <option value="ALL">All statuses</option>
              {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
            </select>

            <select value={sortBy}
              onChange={(e) => { setSortBy(e.target.value); setPage(1); fetchApps({ sort: e.target.value, pg: 1 }); }}
              className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
              <option value="createdAt_desc">Newest</option>
              <option value="createdAt_asc">Oldest</option>
              <option value="updatedAt_desc">Recently updated</option>
              <option value="viewCount_desc">Most viewed</option>
              <option value="userCount_desc">Most users</option>
              <option value="name_asc">Name A–Z</option>
            </select>

            <div className="flex items-center border border-stone-200 rounded-sm overflow-hidden">
              <button onClick={() => setViewMode("grid")}
                className={`p-2 transition-colors ${viewMode === "grid" ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:text-stone-700"}`}>
                <Grid3x3 className="w-3.5 h-3.5" />
              </button>
              <button onClick={() => setViewMode("list")}
                className={`p-2 transition-colors ${viewMode === "list" ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:text-stone-700"}`}>
                <List className="w-3.5 h-3.5" />
              </button>
            </div>

            {selected.size > 0 && (
              <div className="flex items-center gap-2 ml-2 pl-2 border-l border-stone-200">
                <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
                <button onClick={handleBulkDelete}
                  className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors">
                  <Trash2 className="w-3.5 h-3.5" />Delete
                </button>
                <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-700">Clear</button>
              </div>
            )}

            <span className="text-xs text-stone-400 ml-auto">{total} app{total !== 1 ? "s" : ""}</span>
          </div>

          <div className="flex-1 overflow-y-auto p-5">
            {apps.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <AppWindow className="w-10 h-10 text-stone-200 mb-3" />
                <p className="text-sm text-stone-400 font-medium">
                  {search ? `No apps match "${search}"` : "No apps yet"}
                </p>
                <button onClick={() => { setEditApp(null); setTab("editor"); }}
                  className="mt-3 text-xs text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2">
                  Add your first app
                </button>
              </div>
            ) : viewMode === "grid" ? (
              <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
                <AnimatePresence>
                  {apps.map((app) => (
                    <AppCard
                      key={app.id}
                      app={app}
                      selected={selected.has(app.id)}
                      onSelect={(id) => setSelected((prev) => {
                        const n = new Set(prev);
                        if (prev.has(id)) {
                          n.delete(id);
                        } else {
                          n.add(id);
                        }
                        return n;
                      })}
                      onEdit={openEditor}
                      onDelete={handleDelete}
                      onToggleFeatured={handleToggleFeatured}
                      onDuplicate={handleDuplicate}
                    />
                  ))}
                </AnimatePresence>
              </div>
            ) : (
              <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
                {apps.map((app) => (
                  <motion.div key={app.id} layout
                    className={`group flex items-center gap-3 px-4 py-3 border-b border-stone-50 hover:bg-stone-50/60 transition-colors ${selected.has(app.id) ? "bg-amber-50/40" : ""}`}>
                    <button onClick={() => setSelected((prev) => {
                      const n = new Set(prev);
                      if (prev.has(app.id)) {
                        n.delete(app.id);
                      } else {
                        n.add(app.id);
                      }
                      return n;
                    })}>
                      {selected.has(app.id)
                        ? <CheckSquare className="w-4 h-4 text-amber-500" />
                        : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400" />
                      }
                    </button>
                    <span className="text-xl flex-shrink-0">{app.emoji}</span>
                    <div
                      className="w-1 h-8 rounded-full flex-shrink-0"
                      style={{ backgroundColor: app.accentColor }}
                    />
                    <div className="flex-1 min-w-0">
                      <button onClick={() => openEditor(app)}
                        className="text-sm font-bold text-stone-800 hover:text-amber-600 transition-colors text-left">
                        {app.name}
                      </button>
                      <p className="text-[11px] text-stone-400 truncate">{app.tagline}</p>
                    </div>
                    <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
                      <StatusBadge status={app.status} sm />
                      <CompanyBadge companyName={app.company.name} flag={app.company.flag} sm />
                    </div>
                    <div className="hidden lg:flex items-center gap-3 text-[11px] text-stone-400 flex-shrink-0">
                      <span className="flex items-center gap-1"><Users className="w-3 h-3" />{app.userCount.toLocaleString()}</span>
                      <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{app.viewCount.toLocaleString()}</span>
                    </div>
                    <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button onClick={() => openEditor(app)}
                        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm transition-colors">
                        <Edit2 className="w-3.5 h-3.5" />
                      </button>
                      <button onClick={() => handleDelete(app.id, app.name)}
                        className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </motion.div>
                ))}
              </div>
            )}

            {pages > 1 && (
              <div className="flex items-center justify-center gap-2 py-6">
                <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchApps({ pg: page - 1 }); }}
                  className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                  ← Prev
                </button>
                <span className="text-xs text-stone-400">Page {page} of {pages}</span>
                <button disabled={page >= pages} onClick={() => { setPage(page + 1); fetchApps({ pg: page + 1 }); }}
                  className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                  Next →
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "editor" && (
        <div className="flex-1 overflow-hidden">
          <AppEditor
            app={editApp}
            onSaved={(saved) => { handleSaved(saved); setTab("apps"); }}
            onCancel={() => { setTab("apps"); setEditApp(null); }}
          />
        </div>
      )}

      {tab === "stats" && (
        <div className="flex-1 overflow-y-auto">
          <StatsTab stats={statsData} />
        </div>
      )}
    </div>
  );
}







// "use client";

// // =============================================================================
// // isaacpaha.com — Apps Admin Client
// // components/admin/apps/apps-admin-client.tsx
// //
// // Three tabs:
// //   1. Apps    — searchable card/list grid with inline actions
// //   2. Editor  — full form: core info, tech stack, links, screenshots, changelog
// //   3. Stats   — per-company breakdown, status distribution, top apps
// // =============================================================================

// import React, {
//   useState, useCallback, useRef, useEffect, 
// } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   AppWindow, Plus, Search, Edit2, Trash2, Star, StarOff,
//   Copy, Check, X, AlertCircle, Loader2, ArrowLeft,
//   Globe, Github, ExternalLink, Tag, TrendingUp, Users,
//   Eye, Heart, Save, ChevronDown, MoreHorizontal,
//   CheckSquare, Square, Smartphone, Play, Apple,
//   Code2, Database, Server, Shield, Zap, Package,
//   BarChart2, Building2, Calendar, ImagePlus, Clock, Layers, Grid3x3, List,
//   Pencil, 
// } from "lucide-react";
// import Image from "next/image";


// // ─── Types ────────────────────────────────────────────────────────────────────

// type AppStatus = "LIVE" | "BETA" | "IN_DEVELOPMENT" | "COMING_SOON" | "DEPRECATED";

// type Screenshot = { id: string; url: string; alt: string | null; order: number };
// type ChangelogEntry = {
//   id: string; version: string; title: string;
//   description: string; type: string; releasedAt: Date;
// };

// type AppSummary = {
//   id:          string;
//   name:        string;
//   slug:        string;
//   tagline:     string;
//   description: string;
//   category:    string;
//   status:      AppStatus;
//   emoji:       string;
//   accentColor: string;
//   coverImage:  string | null;
//   logoImage:   string | null;
//   isFeatured:  boolean;
//   isNew:       boolean;
//   company:     string;
//   companyFlag: string;
//   appUrl:      string | null;
//   githubUrl:   string | null;
//   techStack:   string;
//   userCount:   number;
//   viewCount:   number;
//   likeCount:   number;
//   launchDate:  Date | null;
//   createdAt:   Date;
//   updatedAt:   Date;
//   _count:      { screenshots: number; changelog: number };
//   changelog:   { version: string; releasedAt: Date }[];
// };

// type AppFull = AppSummary & {
//   fullDescription: string | null;
//   problemSolved:   string;
//   businessModel:   string | null;
//   tergetUsers:     string | null;
//   playStoreUrl:    string | null;
//   appStoreUrl:     string | null;
//   screenshots:     Screenshot[];
//   changelog:       ChangelogEntry[];
// };

// type Stats = {
//   total:      number;
//   live:       number;
//   beta:       number;
//   inDev:      number;
//   comingSoon: number;
//   deprecated: number;
//   totalUsers: number;
//   totalViews: number;
//   byCompany:  { company: string; count: number }[];
//   bystatus:   { status: AppStatus; count: number }[];
//   topViewed:  { id: string; name: string; emoji: string; status: AppStatus; company: string; userCount: number; viewCount: number; accentColor: string }[];
// };

// interface Props {
//   userId:        string;
//   stats:         Stats;
//   initialApps:   AppSummary[];
//   appTotal:      number;
//   appPages:      number;
//   initialTab:    "apps" | "editor" | "stats";
//   initialSearch: string;
//   initialStatus: string;
//   initialCompany:string;
//   initialEditId?:string;
//   currentPage:   number;
// }

// // ─── Config ───────────────────────────────────────────────────────────────────

// const STATUS_CFG: Record<AppStatus, { label: string; color: string; bg: string; border: string; dot: string }> = {
//   LIVE:           { label: "Live",           color: "#059669", bg: "#d1fae5", border: "#a7f3d0", dot: "#10b981" },
//   BETA:           { label: "Beta",           color: "#d97706", bg: "#fef3c7", border: "#fde68a", dot: "#f59e0b" },
//   IN_DEVELOPMENT: { label: "In Development", color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe", dot: "#3b82f6" },
//   COMING_SOON:    { label: "Coming Soon",    color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", dot: "#9ca3af" },
//   DEPRECATED:     { label: "Deprecated",     color: "#dc2626", bg: "#fee2e2", border: "#fecaca", dot: "#ef4444" },
// };

// const COMPANIES = [
//   { id: "iPaha Ltd",       flag: "🇬🇧", color: "#f59e0b", short: "iPaha"       },
//   { id: "iPahaStores Ltd", flag: "🇬🇧", color: "#3b82f6", short: "iPahaStores" },
//   { id: "Okpah Ltd",       flag: "🇬🇭", color: "#10b981", short: "Okpah"       },
// ];

// const CATEGORIES = [
//   "Jobs & Recruitment", "E-Commerce", "Fintech", "AI & Productivity",
//   "Education", "Logistics", "Marketplace", "SaaS", "Mobile", "Other",
// ];

// const CHANGELOG_TYPES = [
//   { value: "feature",     label: "✨ Feature",     color: "#8b5cf6" },
//   { value: "improvement", label: "⚡ Improvement",  color: "#3b82f6" },
//   { value: "fix",         label: "🐛 Bug Fix",      color: "#10b981" },
//   { value: "breaking",    label: "⚠️ Breaking",     color: "#ef4444" },
//   { value: "launch",      label: "🚀 Launch",       color: "#f59e0b" },
// ];

// const TECH_CATEGORIES = [
//   { id: "frontend", label: "Frontend", icon: Globe,    color: "#3b82f6" },
//   { id: "backend",  label: "Backend",  icon: Server,   color: "#10b981" },
//   { id: "database", label: "Database", icon: Database, color: "#f59e0b" },
//   { id: "infra",    label: "Infra",    icon: Layers,   color: "#8b5cf6" },
//   { id: "auth",     label: "Auth",     icon: Shield,   color: "#ec4899" },
//   { id: "api",      label: "API",      icon: Zap,      color: "#f97316" },
// ];

// // ─── Utilities ────────────────────────────────────────────────────────────────

// function parseTechStack(raw: string): { name: string; category: string }[] {
//   try { return JSON.parse(raw); } catch { return []; }
// }

// function toSlug(s: string): string {
//   return s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80);
// }

// function fmtDate(d: Date | string): string {
//   const date = new Date(d);
//   const days = Math.floor((Date.now() - date.getTime()) / 86400000);
//   if (days < 1) return "today";
//   if (days === 1) return "yesterday";
//   if (days < 7)  return `${days}d ago`;
//   return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "2-digit" });
// }

// // ─── Status badge ─────────────────────────────────────────────────────────────

// function StatusBadge({ status, sm }: { status: AppStatus; sm?: boolean }) {
//   const c = STATUS_CFG[status];
//   return (
//     <span
//       className={`inline-flex items-center gap-1.5 font-bold rounded-sm flex-shrink-0 ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
//       style={{ color: c.color, backgroundColor: c.bg, border: `1px solid ${c.border}` }}
//     >
//       <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: c.dot }} />
//       {c.label}
//     </span>
//   );
// }

// // ─── Company badge ────────────────────────────────────────────────────────────

// function CompanyBadge({ company, flag, sm }: { company: string; flag: string; sm?: boolean }) {
//   const cfg = COMPANIES.find((c) => c.id === company);
//   return (
//     <span
//       className={`inline-flex items-center gap-1 font-semibold rounded-sm ${sm ? "text-[10px] px-1.5 py-0.5" : "text-[11px] px-2 py-0.5"}`}
//       style={{ color: cfg?.color ?? "#6b7280", backgroundColor: `${cfg?.color ?? "#6b7280"}15` }}
//     >
//       {flag} {cfg?.short ?? company}
//     </span>
//   );
// }

// // ─── Confirm dialog ───────────────────────────────────────────────────────────

// function ConfirmDialog({
//   open, title, message, danger = false, confirmLabel = "Confirm",
//   onConfirm, onCancel, loading,
// }: {
//   open: boolean; title: string; message: string;
//   danger?: boolean; confirmLabel?: string;
//   onConfirm: () => void; onCancel: () => void; loading: boolean;
// }) {
//   return (
//     <AnimatePresence>
//       {open && (
//         <motion.div
//           initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
//           className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
//           onClick={onCancel}
//         >
//           <motion.div
//             initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
//             className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4"
//             onClick={(e) => e.stopPropagation()}
//           >
//             <div className="flex items-start gap-3 mb-5">
//               <div className={`w-8 h-8 rounded-full flex items-center justify-center flex-shrink-0 ${danger ? "bg-red-50" : "bg-amber-50"}`}>
//                 <AlertCircle className={`w-4 h-4 ${danger ? "text-red-500" : "text-amber-500"}`} />
//               </div>
//               <div>
//                 <p className="text-sm font-black text-stone-900">{title}</p>
//                 <p className="text-xs text-stone-500 mt-1 leading-relaxed">{message}</p>
//               </div>
//             </div>
//             <div className="flex gap-2 justify-end">
//               <button onClick={onCancel}
//                 className="text-xs font-semibold text-stone-500 border border-stone-200 px-4 py-2 rounded-sm hover:border-stone-400 transition-colors">
//                 Cancel
//               </button>
//               <button onClick={onConfirm} disabled={loading}
//                 className={`text-xs font-bold text-white px-4 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2 ${danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"}`}>
//                 {loading && <Loader2 className="w-3 h-3 animate-spin" />}
//                 {confirmLabel}
//               </button>
//             </div>
//           </motion.div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }

// // ─── App card (grid view) ─────────────────────────────────────────────────────

// function AppCard({
//   app, selected, onSelect, onEdit, onDelete, onToggleFeatured, onDuplicate,
// }: {
//   app: AppSummary;
//   selected: boolean;
//   onSelect: (id: string) => void;
//   onEdit: (app: AppSummary) => void;
//   onDelete: (id: string, name: string) => void;
//   onToggleFeatured: (id: string) => void;
//   onDuplicate: (id: string) => void;
// }) {
//   const [menuOpen, setMenuOpen] = useState(false);
//   const menuRef = useRef<HTMLDivElement>(null);

//   useEffect(() => {
//     const h = (e: MouseEvent) => { if (menuRef.current && !menuRef.current.contains(e.target as Node)) setMenuOpen(false); };
//     document.addEventListener("mousedown", h);
//     return () => document.removeEventListener("mousedown", h);
//   }, []);

//   const tech = parseTechStack(app.techStack).slice(0, 4);

//   return (
//     <motion.div
//       layout initial={{ opacity: 0, scale: 0.97 }} animate={{ opacity: 1, scale: 1 }}
//       exit={{ opacity: 0 }} transition={{ duration: 0.18 }}
//       className={`group relative bg-white border rounded-sm overflow-hidden transition-all hover:shadow-md ${
//         selected ? "border-amber-300 ring-1 ring-amber-200" : "border-stone-100 hover:border-stone-200"
//       }`}
//     >
//       {/* Accent bar */}
//       <div className="h-1 w-full" style={{ backgroundColor: app.accentColor }} />

//       {/* Card header */}
//       <div className="p-4 pb-3">
//         <div className="flex items-start gap-3">
//           {/* Checkbox */}
//           <button onClick={() => onSelect(app.id)} className="flex-shrink-0 mt-0.5">
//             {selected
//               ? <CheckSquare className="w-4 h-4 text-amber-500" />
//               : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400 transition-colors" />
//             }
//           </button>

//           {/* Emoji + name */}
//           <div className="flex-1 min-w-0">
//             <div className="flex items-center gap-2 mb-1 flex-wrap">
//               <span className="text-xl">{app.emoji}</span>
//               <button onClick={() => onEdit(app)}
//                 className="text-sm font-black text-stone-900 hover:text-amber-600 transition-colors text-left leading-tight">
//                 {app.name}
//               </button>
//               {app.isFeatured && (
//                 <span className="text-[9px] font-black bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
//                   Featured
//                 </span>
//               )}
//               {app.isNew && (
//                 <span className="text-[9px] font-black bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded-sm uppercase tracking-wider">
//                   New
//                 </span>
//               )}
//             </div>
//             <p className="text-[11px] text-stone-400 line-clamp-2 leading-relaxed">{app.tagline}</p>
//           </div>

//           {/* Menu */}
//           <div className="relative flex-shrink-0" ref={menuRef}>
//             <button onClick={() => setMenuOpen((p) => !p)}
//               className="w-7 h-7 flex items-center justify-center text-stone-300 hover:text-stone-600 hover:bg-stone-100 rounded-sm transition-colors">
//               <MoreHorizontal className="w-4 h-4" />
//             </button>
//             <AnimatePresence>
//               {menuOpen && (
//                 <motion.div
//                   initial={{ opacity: 0, scale: 0.95, y: -4 }} animate={{ opacity: 1, scale: 1, y: 0 }}
//                   exit={{ opacity: 0, scale: 0.95 }} transition={{ duration: 0.12 }}
//                   className="absolute right-0 top-8 z-20 w-44 bg-white border border-stone-200 rounded-sm shadow-xl overflow-hidden"
//                 >
//                   {[
//                     { label: "Edit",       icon: Edit2,   action: () => { onEdit(app); setMenuOpen(false); } },
//                     { label: "Duplicate",  icon: Copy,    action: () => { onDuplicate(app.id); setMenuOpen(false); } },
//                     { label: app.isFeatured ? "Unfeature" : "Set Featured", icon: Star, action: () => { onToggleFeatured(app.id); setMenuOpen(false); } },
//                   ].map((m) => (
//                     <button key={m.label} onClick={m.action}
//                       className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
//                       <m.icon className="w-3.5 h-3.5 text-stone-400" />{m.label}
//                     </button>
//                   ))}
//                   {app.appUrl && (
//                     <a href={app.appUrl} target="_blank" rel="noopener noreferrer"
//                       className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-stone-600 hover:bg-stone-50 transition-colors">
//                       <ExternalLink className="w-3.5 h-3.5 text-stone-400" />View Live
//                     </a>
//                   )}
//                   <div className="border-t border-stone-100" />
//                   <button onClick={() => { onDelete(app.id, app.name); setMenuOpen(false); }}
//                     className="flex w-full items-center gap-2.5 px-3 py-2 text-xs text-red-500 hover:bg-red-50 transition-colors">
//                     <Trash2 className="w-3.5 h-3.5" />Delete
//                   </button>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </div>
//       </div>

//       {/* Badges row */}
//       <div className="px-4 pb-3 flex items-center gap-1.5 flex-wrap">
//         <StatusBadge status={app.status} sm />
//         <CompanyBadge company={app.company} flag={app.companyFlag} sm />
//         <span className="text-[10px] text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">{app.category}</span>
//       </div>

//       {/* Tech stack mini-pills */}
//       {tech.length > 0 && (
//         <div className="px-4 pb-3 flex items-center gap-1 flex-wrap">
//           {tech.map((t) => (
//             <span key={t.name} className="text-[9px] font-mono text-stone-400 bg-stone-50 border border-stone-100 px-1.5 py-0.5 rounded-sm">
//               {t.name}
//             </span>
//           ))}
//           {parseTechStack(app.techStack).length > 4 && (
//             <span className="text-[9px] text-stone-300">+{parseTechStack(app.techStack).length - 4}</span>
//           )}
//         </div>
//       )}

//       {/* Stats row */}
//       <div className="px-4 pb-3 flex items-center gap-3 text-[11px] text-stone-400 border-t border-stone-50 pt-2.5">
//         <span className="flex items-center gap-1"><Users className="w-3 h-3" />{app.userCount.toLocaleString()}</span>
//         <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{app.viewCount.toLocaleString()}</span>
//         <span className="flex items-center gap-1"><Heart className="w-3 h-3" />{app.likeCount}</span>
//         <span className="ml-auto flex items-center gap-1">
//           <Package className="w-3 h-3" />{app._count.screenshots}
//           <Clock className="w-3 h-3 ml-1.5" />{app._count.changelog}
//         </span>
//       </div>

//       {/* Footer: version + date */}
//       <div className="px-4 py-2 bg-stone-50/60 border-t border-stone-100 flex items-center justify-between">
//         {app.changelog[0] ? (
//           <span className="text-[10px] text-stone-400">v{app.changelog[0].version}</span>
//         ) : (
//           <span className="text-[10px] text-stone-300">No releases</span>
//         )}
//         <span className="text-[10px] text-stone-300">{fmtDate(app.updatedAt)}</span>
//       </div>
//     </motion.div>
//   );
// }

// // ─── Editor ───────────────────────────────────────────────────────────────────

// function AppEditor({
//   app, onSaved, onCancel,
// }: {
//   app:     AppFull | null;
//   userId:  string;
//   onSaved: (saved: AppFull) => void;
//   onCancel:() => void;
// }) {
//   const isEdit = !!app;

//   // Core fields
//   const [name,            setName]            = useState(app?.name            ?? "");
//   const [slug,            setSlug]            = useState(app?.slug            ?? "");
//   const [tagline,         setTagline]         = useState(app?.tagline         ?? "");
//   const [description,     setDescription]     = useState(app?.description     ?? "");
//   const [fullDescription, setFullDescription] = useState(app?.fullDescription ?? "");
//   const [problemSolved,   setProblemSolved]   = useState(app?.problemSolved   ?? "");
//   const [businessModel,   setBusinessModel]   = useState(app?.businessModel   ?? "");
//   const [targetUsers,     setTargetUsers]     = useState(app?.tergetUsers     ?? "");
//   const [category,        setCategory]        = useState(app?.category        ?? "Other");
//   const [status,          setStatus]          = useState<AppStatus>(app?.status ?? "IN_DEVELOPMENT");
//   const [emoji,           setEmoji]           = useState(app?.emoji           ?? "📱");
//   const [accentColor,     setAccentColor]     = useState(app?.accentColor     ?? "#f59e0b");
//   const [coverImage,      setCoverImage]      = useState(app?.coverImage      ?? "");
//   const [logoImage,       setLogoImage]       = useState(app?.logoImage       ?? "");
//   const [company,         setCompany]         = useState(app?.company         ?? "iPaha Ltd");
//   const [companyFlag,     setCompanyFlag]     = useState(app?.companyFlag     ?? "🇬🇧");
//   const [isFeatured,      setIsFeatured]      = useState(app?.isFeatured      ?? false);
//   const [isNew,           setIsNew]           = useState(app?.isNew           ?? true);
//   const [appUrl,          setAppUrl]          = useState(app?.appUrl          ?? "");
//   const [githubUrl,       setGithubUrl]       = useState(app?.githubUrl       ?? "");
//   const [playStoreUrl,    setPlayStoreUrl]    = useState(app?.playStoreUrl    ?? "");
//   const [appStoreUrl,     setAppStoreUrl]     = useState(app?.appStoreUrl     ?? "");
//   const [userCount,       setUserCount]       = useState(app?.userCount       ?? 0);
//   const [launchDate,      setLaunchDate]      = useState(
//     app?.launchDate ? new Date(app.launchDate).toISOString().slice(0, 10) : ""
//   );

//   // Tech stack
//   const [techStack,    setTechStack]    = useState<{ name: string; category: string }[]>(parseTechStack(app?.techStack ?? "[]"));
//   const [techInput,    setTechInput]    = useState("");
//   const [techCategory, setTechCategory] = useState("frontend");

//   // Screenshots
//   const [screenshots,     setScreenshots]     = useState<Screenshot[]>(app?.screenshots ?? []);
//   const [ssUrlInput,      setSsUrlInput]       = useState("");
//   const [ssAltInput,      setSsAltInput]       = useState("");
//   const [ssAdding,        setSsAdding]         = useState(false);

//   // Changelog
//   const [changelog,      setChangelog]      = useState<ChangelogEntry[]>(app?.changelog ?? []);
//   const [clForm,         setClForm]         = useState({ version: "", title: "", description: "", type: "feature", releasedAt: new Date().toISOString().slice(0, 10) });
//   const [clAdding,       setClAdding]       = useState(false);
//   const [showClForm,     setShowClForm]     = useState(false);

//   // Active section
//   const [section, setSection] = useState<"core" | "details" | "links" | "tech" | "screenshots" | "changelog">("core");

//   // Save state
//   const [saving,  setSaving]  = useState(false);
//   const [saveErr, setSaveErr] = useState("");
//   const [savedOk, setSavedOk] = useState(false);

//   const slugTouched = useRef(!!app);
//   useEffect(() => {
//     if (!slugTouched.current) setSlug(toSlug(name));
//   }, [name]);

//   // Sync company flag
//   useEffect(() => {
//     const cfg = COMPANIES.find((c) => c.id === company);
//     if (cfg) setCompanyFlag(cfg.flag);
//   }, [company]);

//   const addTech = () => {
//     const t = techInput.trim();
//     if (t && !techStack.find((s) => s.name.toLowerCase() === t.toLowerCase())) {
//       setTechStack((prev) => [...prev, { name: t, category: techCategory }]);
//     }
//     setTechInput("");
//   };

//   const addScreenshotFn = async () => {
//     if (!ssUrlInput.trim() || !app) return;
//     setSsAdding(true);
//     try {
//       const res  = await fetch(`/api/admin/apps/${app.id}`, {
//         method: "PATCH", headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({ _action: "addScreenshot", url: ssUrlInput.trim(), alt: ssAltInput.trim() || null }),
//       });
//       const ss = await res.json();
//       setScreenshots((prev) => [...prev, ss]);
//       setSsUrlInput(""); setSsAltInput("");
//     } catch { /**/ }
//     setSsAdding(false);
//   };

//   const removeScreenshot = async (id: string) => {
//     if (!app) { setScreenshots((prev) => prev.filter((s) => s.id !== id)); return; }
//     await fetch(`/api/admin/apps/${app.id}`, {
//       method: "PATCH", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ _action: "deleteScreenshot", screenshotId: id }),
//     });
//     setScreenshots((prev) => prev.filter((s) => s.id !== id));
//   };

//   const addChangelogFn = async () => {
//     if (!clForm.version.trim() || !clForm.title.trim()) return;
//     setClAdding(true);

//     if (app) {
//       try {
//         const res  = await fetch(`/api/admin/apps/${app.id}`, {
//           method: "PATCH", headers: { "Content-Type": "application/json" },
//           body: JSON.stringify({ _action: "addChangelog", ...clForm, releasedAt: clForm.releasedAt || new Date().toISOString() }),
//         });
//         const entry = await res.json();
//         setChangelog((prev) => [entry, ...prev]);
//       } catch { /**/ }
//     } else {
//       // For new apps, store locally and save with the app
//       const fakeEntry: ChangelogEntry = {
//         id: `temp-${Date.now()}`, version: clForm.version, title: clForm.title,
//         description: clForm.description, type: clForm.type, releasedAt: new Date(clForm.releasedAt),
//       };
//       setChangelog((prev) => [fakeEntry, ...prev]);
//     }

//     setClForm({ version: "", title: "", description: "", type: "feature", releasedAt: new Date().toISOString().slice(0, 10) });
//     setShowClForm(false);
//     setClAdding(false);
//   };

//   const removeChangelog = async (id: string) => {
//     if (!app || id.startsWith("temp-")) { setChangelog((prev) => prev.filter((c) => c.id !== id)); return; }
//     await fetch(`/api/admin/apps/${app.id}`, {
//       method: "PATCH", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ _action: "deleteChangelog", changelogId: id }),
//     });
//     setChangelog((prev) => prev.filter((c) => c.id !== id));
//   };

//   const handleSave = async () => {
//     if (!name.trim() || !tagline.trim() || !company) { setSaveErr("Name, tagline and company are required."); return; }
//     setSaving(true); setSaveErr("");

//     try {
//       const body = {
//         name: name.trim(), slug: slug.trim() || toSlug(name),
//         tagline: tagline.trim(), description: description.trim(),
//         fullDescription: fullDescription.trim() || null,
//         problemSolved: problemSolved.trim(),
//         businessModel: businessModel.trim() || null,
//         targetUsers: targetUsers.trim() || null,
//         category, status, emoji, accentColor,
//         coverImage: coverImage.trim() || null, logoImage: logoImage.trim() || null,
//         isFeatured, isNew, company, companyFlag,
//         appUrl: appUrl.trim() || null, githubUrl: githubUrl.trim() || null,
//         playStoreUrl: playStoreUrl.trim() || null, appStoreUrl: appStoreUrl.trim() || null,
//         techStack,
//         userCount: Number(userCount),
//         launchDate: launchDate || null,
//       };

//       let saved: AppFull;
//       if (isEdit && app) {
//         const res = await fetch(`/api/admin/apps/${app.id}`, {
//           method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
//         });
//         saved = await res.json();
//       } else {
//         const res = await fetch("/api/admin/apps", {
//           method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body),
//         });
//         const data = await res.json();
//         saved = data.app;
//         // Save pending changelog entries for new app
//         for (const cl of changelog.filter((c) => c.id.startsWith("temp-"))) {
//           await fetch(`/api/admin/apps/${saved.id}`, {
//             method: "PATCH", headers: { "Content-Type": "application/json" },
//             body: JSON.stringify({ _action: "addChangelog", version: cl.version, title: cl.title, description: cl.description, type: cl.type, releasedAt: cl.releasedAt }),
//           });
//         }
//       }

//       setSavedOk(true);
//       setTimeout(() => setSavedOk(false), 2000);
//       onSaved({ ...saved, screenshots, changelog } as AppFull);
//     } catch (e: unknown) {
//       setSaveErr(e as unknown extends { message: infer M } ? M : "Save failed");
//     }
//     setSaving(false);
//   };

//   const SECTIONS = [
//     { id: "core",        label: "Core Info",    count: null },
//     { id: "details",     label: "Details",      count: null },
//     { id: "links",       label: "Links",        count: null },
//     { id: "tech",        label: "Tech Stack",   count: techStack.length },
//     { id: "screenshots", label: "Screenshots",  count: screenshots.length },
//     { id: "changelog",   label: "Changelog",    count: changelog.length },
//   ] as const;

//   return (
//     <div className="flex flex-col h-full overflow-hidden">
//       {/* Header */}
//       <div className="flex items-center justify-between gap-3 px-6 py-4 border-b border-stone-100 flex-shrink-0">
//         <button onClick={onCancel}
//           className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
//           <ArrowLeft className="w-3.5 h-3.5" />Back to Apps
//         </button>
//         <div className="flex items-center gap-2">
//           {app?.appUrl && (
//             <a href={app.appUrl} target="_blank" rel="noopener noreferrer"
//               className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
//               <ExternalLink className="w-3 h-3" />View Live
//             </a>
//           )}
//           <button onClick={handleSave} disabled={saving}
//             className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60">
//             {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Save className="w-4 h-4" />}
//             {saving ? "Saving…" : savedOk ? "Saved!" : isEdit ? "Save Changes" : "Create App"}
//           </button>
//         </div>
//       </div>

//       {saveErr && (
//         <div className="mx-6 mt-3 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm flex-shrink-0">
//           <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
//         </div>
//       )}

//       <div className="flex flex-1 overflow-hidden">
//         {/* Left nav */}
//         <div className="w-40 flex-shrink-0 border-r border-stone-100 p-3 space-y-0.5 overflow-y-auto">
//           {SECTIONS.map((s) => (
//             <button key={s.id} onClick={() => setSection(s.id)}
//               className={`w-full flex items-center justify-between px-2.5 py-2 rounded-sm text-left text-xs font-semibold transition-colors ${
//                 section === s.id ? "bg-amber-50 text-amber-700" : "text-stone-500 hover:bg-stone-50 hover:text-stone-800"
//               }`}>
//               {s.label}
//               {s.count !== null && s.count > 0 && (
//                 <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${section === s.id ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-400"}`}>
//                   {s.count}
//                 </span>
//               )}
//             </button>
//           ))}
//         </div>

//         {/* Content area */}
//         <div className="flex-1 overflow-y-auto p-6">

//           {/* ── CORE INFO ─────────────────────────────────────────────── */}
//           {section === "core" && (
//             <div className="max-w-2xl space-y-5">
//               <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Core Information</h2>

//               {/* Emoji + Name */}
//               <div className="flex items-end gap-3">
//                 <div>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Emoji</label>
//                   <input value={emoji} onChange={(e) => setEmoji(e.target.value)}
//                     className="w-16 text-center text-2xl border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                   />
//                 </div>
//                 <div className="flex-1">
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">App Name <span className="text-red-400">*</span></label>
//                   <input value={name} onChange={(e) => setName(e.target.value)}
//                     placeholder="oKadwuma, Paralel Me…"
//                     className="w-full text-sm font-bold border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Accent Colour</label>
//                   <div className="flex items-center gap-2 border border-stone-200 rounded-sm px-2 py-1.5 bg-white">
//                     <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
//                       className="w-8 h-6 rounded cursor-pointer border-0 bg-transparent" />
//                     <span className="text-[11px] font-mono text-stone-500">{accentColor}</span>
//                   </div>
//                 </div>
//               </div>

//               {/* Slug */}
//               <div>
//                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Slug</label>
//                 <input value={slug} onChange={(e) => { slugTouched.current = true; setSlug(e.target.value); }}
//                   className="w-full text-xs font-mono border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                 />
//               </div>

//               {/* Tagline */}
//               <div>
//                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
//                   Tagline <span className="text-red-400">*</span>
//                   <span className="ml-1 text-stone-300 font-normal normal-case">(one-line pitch)</span>
//                 </label>
//                 <input value={tagline} onChange={(e) => setTagline(e.target.value)}
//                   placeholder="West Africa's professional jobs platform"
//                   className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
//                 />
//               </div>

//               {/* Short description */}
//               <div>
//                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Short Description</label>
//                 <textarea value={description} onChange={(e) => setDescription(e.target.value)}
//                   rows={3} placeholder="2-3 sentences for the app card…"
//                   className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-y bg-white"
//                 />
//               </div>

//               {/* Company + Status + Category */}
//               <div className="grid grid-cols-3 gap-3">
//                 <div>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Company <span className="text-red-400">*</span></label>
//                   <select value={company} onChange={(e) => setCompany(e.target.value)}
//                     className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
//                     {COMPANIES.map((c) => <option key={c.id} value={c.id}>{c.flag} {c.id}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Status</label>
//                   <select value={status} onChange={(e) => setStatus(e.target.value as AppStatus)}
//                     className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
//                     {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
//                   </select>
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Category</label>
//                   <select value={category} onChange={(e) => setCategory(e.target.value)}
//                     className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
//                     {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
//                   </select>
//                 </div>
//               </div>

//               {/* Featured + New + User count + Launch date */}
//               <div className="grid grid-cols-2 gap-3">
//                 <div className="flex gap-2">
//                   <button onClick={() => setIsFeatured((p) => !p)}
//                     className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
//                       isFeatured ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-stone-50 text-stone-500 border-stone-200"
//                     }`}>
//                     <Star className={`w-3.5 h-3.5 ${isFeatured ? "fill-amber-400 text-amber-400" : ""}`} />
//                     {isFeatured ? "Featured" : "Not Featured"}
//                   </button>
//                   <button onClick={() => setIsNew((p) => !p)}
//                     className={`flex-1 flex items-center justify-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${
//                       isNew ? "bg-emerald-50 text-emerald-700 border-emerald-200" : "bg-stone-50 text-stone-500 border-stone-200"
//                     }`}>
//                     {isNew ? "🆕 New" : "Not New"}
//                   </button>
//                 </div>
//                 <div className="grid grid-cols-2 gap-2">
//                   <div>
//                     <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Users</label>
//                     <input type="number" value={userCount} onChange={(e) => setUserCount(Number(e.target.value))} min={0}
//                       className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                     />
//                   </div>
//                   <div>
//                     <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Launch Date</label>
//                     <input type="date" value={launchDate} onChange={(e) => setLaunchDate(e.target.value)}
//                       className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                     />
//                   </div>
//                 </div>
//               </div>

//               {/* Images */}
//               <div className="grid grid-cols-2 gap-3">
//                 <div>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Cover Image URL</label>
//                   <input value={coverImage} onChange={(e) => setCoverImage(e.target.value)}
//                     placeholder="https://… (Cloudinary)"
//                     className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                   />
//                 </div>
//                 <div>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Logo Image URL</label>
//                   <input value={logoImage} onChange={(e) => setLogoImage(e.target.value)}
//                     placeholder="https://…"
//                     className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                   />
//                 </div>
//               </div>
//             </div>
//           )}

//           {/* ── DETAILS ───────────────────────────────────────────────── */}
//           {section === "details" && (
//             <div className="max-w-2xl space-y-5">
//               <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">App Details</h2>

//               <div>
//                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Full Description</label>
//                 <textarea value={fullDescription} onChange={(e) => setFullDescription(e.target.value)}
//                   rows={8} placeholder="Long-form description — tell the full story of this app, its context, and what makes it different…"
//                   className="w-full text-sm border border-stone-200 rounded-sm px-3 py-3 focus:outline-none focus:border-amber-400 resize-y bg-white leading-relaxed"
//                 />
//               </div>

//               <div>
//                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
//                   Problem Solved
//                   <span className="ml-1 text-stone-300 font-normal normal-case">(what gap does this fill?)</span>
//                 </label>
//                 <textarea value={problemSolved} onChange={(e) => setProblemSolved(e.target.value)}
//                   rows={3} placeholder="Professional hiring in West Africa relies on personal networks…"
//                   className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 resize-y bg-white"
//                 />
//               </div>

//               <div>
//                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Target Users</label>
//                 <input value={targetUsers} onChange={(e) => setTargetUsers(e.target.value)}
//                   placeholder="Job-seeking professionals and employers across Ghana and West Africa"
//                   className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
//                 />
//               </div>

//               <div>
//                 <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Business Model</label>
//                 <input value={businessModel} onChange={(e) => setBusinessModel(e.target.value)}
//                   placeholder="Freemium — free for candidates, subscription tiers for employers…"
//                   className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2.5 focus:outline-none focus:border-amber-400 bg-white"
//                 />
//               </div>
//             </div>
//           )}

//           {/* ── LINKS ─────────────────────────────────────────────────── */}
//           {section === "links" && (
//             <div className="max-w-2xl space-y-5">
//               <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Links</h2>

//               {[
//                 { label: "Live App URL",        icon: Globe,       value: appUrl,       set: setAppUrl,       placeholder: "https://okpah.com" },
//                 { label: "GitHub URL",           icon: Github,      value: githubUrl,    set: setGithubUrl,    placeholder: "https://github.com/iPaha1/…" },
//                 { label: "Google Play Store URL",icon: Play,        value: playStoreUrl, set: setPlayStoreUrl, placeholder: "https://play.google.com/store/apps/…" },
//                 { label: "Apple App Store URL",  icon: Apple,       value: appStoreUrl,  set: setAppStoreUrl,  placeholder: "https://apps.apple.com/…" },
//               ].map((field) => (
//                 <div key={field.label}>
//                   <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">{field.label}</label>
//                   <div className="flex items-center gap-2 border border-stone-200 rounded-sm px-3 py-2 focus-within:border-amber-400 bg-white">
//                     <field.icon className="w-4 h-4 text-stone-300 flex-shrink-0" />
//                     <input value={field.value} onChange={(e) => field.set(e.target.value)}
//                       placeholder={field.placeholder}
//                       className="flex-1 text-sm focus:outline-none bg-transparent"
//                     />
//                     {field.value && (
//                       <a href={field.value} target="_blank" rel="noopener noreferrer"
//                         className="text-stone-300 hover:text-stone-700 transition-colors">
//                         <ExternalLink className="w-3.5 h-3.5" />
//                       </a>
//                     )}
//                   </div>
//                 </div>
//               ))}
//             </div>
//           )}

//           {/* ── TECH STACK ────────────────────────────────────────────── */}
//           {section === "tech" && (
//             <div className="max-w-2xl space-y-5">
//               <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Tech Stack</h2>

//               {/* Add tech */}
//               <div className="flex gap-2">
//                 <select value={techCategory} onChange={(e) => setTechCategory(e.target.value)}
//                   className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white">
//                   {TECH_CATEGORIES.map((c) => <option key={c.id} value={c.id}>{c.label}</option>)}
//                 </select>
//                 <input value={techInput} onChange={(e) => setTechInput(e.target.value)}
//                   onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
//                   placeholder="Next.js 14, TypeScript, PostgreSQL…"
//                   className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
//                 />
//                 <button onClick={addTech}
//                   className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">
//                   Add
//                 </button>
//               </div>

//               {/* Tech by category */}
//               {TECH_CATEGORIES.map((cat) => {
//                 const items = techStack.filter((t) => t.category === cat.id);
//                 if (items.length === 0) return null;
//                 return (
//                   <div key={cat.id}>
//                     <div className="flex items-center gap-2 mb-2">
//                       <cat.icon className="w-3.5 h-3.5" style={{ color: cat.color }} />
//                       <span className="text-[10px] font-black text-stone-500 uppercase tracking-wider">{cat.label}</span>
//                     </div>
//                     <div className="flex flex-wrap gap-1.5">
//                       {items.map((t) => (
//                         <span key={t.name}
//                           className="inline-flex items-center gap-1 text-xs font-mono font-semibold px-2.5 py-1 rounded-sm border"
//                           style={{ color: cat.color, backgroundColor: `${cat.color}10`, borderColor: `${cat.color}30` }}>
//                           {t.name}
//                           <button onClick={() => setTechStack((prev) => prev.filter((s) => s.name !== t.name))}
//                             className="hover:text-red-500 transition-colors ml-1">
//                             <X className="w-2.5 h-2.5" />
//                           </button>
//                         </span>
//                       ))}
//                     </div>
//                   </div>
//                 );
//               })}

//               {techStack.length === 0 && (
//                 <div className="text-center py-8 text-stone-300">
//                   <Code2 className="w-8 h-8 mx-auto mb-2" />
//                   <p className="text-sm">No tech stack added yet</p>
//                 </div>
//               )}
//             </div>
//           )}

//           {/* ── SCREENSHOTS ───────────────────────────────────────────── */}
//           {section === "screenshots" && (
//             <div className="max-w-2xl space-y-5">
//               <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Screenshots</h2>

//               {/* Add screenshot */}
//               <div className="border border-stone-200 rounded-sm p-4 space-y-3">
//                 <p className="text-xs font-bold text-stone-600">Add Screenshot</p>
//                 <input value={ssUrlInput} onChange={(e) => setSsUrlInput(e.target.value)}
//                   placeholder="Image URL (Cloudinary, etc.)…"
//                   className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
//                 />
//                 <div className="flex gap-2">
//                   <input value={ssAltInput} onChange={(e) => setSsAltInput(e.target.value)}
//                     placeholder="Alt text / description…"
//                     className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
//                   />
//                   <button
//                     onClick={isEdit ? addScreenshotFn : () => {
//                       if (!ssUrlInput.trim()) return;
//                       const fakeId = `temp-${Date.now()}`;
//                       setScreenshots((prev) => [...prev, { id: fakeId, url: ssUrlInput.trim(), alt: ssAltInput.trim() || null, order: prev.length }]);
//                       setSsUrlInput(""); setSsAltInput("");
//                     }}
//                     disabled={!ssUrlInput.trim() || ssAdding}
//                     className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors disabled:opacity-40 flex items-center gap-1.5"
//                   >
//                     {ssAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <ImagePlus className="w-3 h-3" />}
//                     Add
//                   </button>
//                 </div>
//               </div>

//               {/* Screenshots grid */}
//               {screenshots.length === 0 ? (
//                 <div className="text-center py-10 text-stone-300">
//                   <Smartphone className="w-10 h-10 mx-auto mb-2" />
//                   <p className="text-sm">No screenshots yet</p>
//                 </div>
//               ) : (
//                 <div className="grid grid-cols-2 gap-3">
//                   {screenshots.sort((a, b) => a.order - b.order).map((ss) => (
//                     <div key={ss.id} className="relative group border border-stone-200 rounded-sm overflow-hidden bg-stone-50">
//                       <Image 
//                         src={ss.url} alt={ss.alt || "Screenshot"} width={400} height={300} objectFit="cover"
//                       />
//                       <div className="p-2">
//                         <p className="text-[10px] text-stone-500 truncate">{ss.alt || "No alt text"}</p>
//                         <p className="text-[9px] text-stone-300 font-mono truncate">{ss.url}</p>
//                       </div>
//                       <button onClick={() => removeScreenshot(ss.id)}
//                         className="absolute top-1.5 right-1.5 w-6 h-6 flex items-center justify-center bg-red-500 text-white rounded-sm opacity-0 group-hover:opacity-100 transition-opacity">
//                         <X className="w-3 h-3" />
//                       </button>
//                     </div>
//                   ))}
//                 </div>
//               )}
//             </div>
//           )}

//           {/* ── CHANGELOG ─────────────────────────────────────────────── */}
//           {section === "changelog" && (
//             <div className="max-w-2xl space-y-5">
//               <div className="flex items-center justify-between">
//                 <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Changelog</h2>
//                 <button onClick={() => setShowClForm((p) => !p)}
//                   className="flex items-center gap-1.5 text-xs font-bold text-amber-600 border border-amber-200 hover:bg-amber-50 px-3 py-1.5 rounded-sm transition-colors">
//                   <Plus className="w-3.5 h-3.5" />Add Release
//                 </button>
//               </div>

//               {/* Add form */}
//               <AnimatePresence>
//                 {showClForm && (
//                   <motion.div
//                     initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: "auto" }}
//                     exit={{ opacity: 0, height: 0 }}
//                     className="border border-amber-200 bg-amber-50/40 rounded-sm overflow-hidden"
//                   >
//                     <div className="p-4 space-y-3">
//                       <div className="grid grid-cols-3 gap-3">
//                         <div>
//                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Version</label>
//                           <input value={clForm.version} onChange={(e) => setClForm((f) => ({ ...f, version: e.target.value }))}
//                             placeholder="2.5.0"
//                             className="w-full text-xs font-mono border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                           />
//                         </div>
//                         <div>
//                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Type</label>
//                           <select value={clForm.type} onChange={(e) => setClForm((f) => ({ ...f, type: e.target.value }))}
//                             className="w-full text-xs border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400 bg-white">
//                             {CHANGELOG_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
//                           </select>
//                         </div>
//                         <div>
//                           <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Released</label>
//                           <input type="date" value={clForm.releasedAt} onChange={(e) => setClForm((f) => ({ ...f, releasedAt: e.target.value }))}
//                             className="w-full text-xs border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                           />
//                         </div>
//                       </div>
//                       <div>
//                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Title</label>
//                         <input value={clForm.title} onChange={(e) => setClForm((f) => ({ ...f, title: e.target.value }))}
//                           placeholder="WhatsApp Alerts & Messaging"
//                           className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
//                         />
//                       </div>
//                       <div>
//                         <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Description / Notes</label>
//                         <textarea value={clForm.description} onChange={(e) => setClForm((f) => ({ ...f, description: e.target.value }))}
//                           rows={3} placeholder="What changed in this release…"
//                           className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 resize-none bg-white"
//                         />
//                       </div>
//                       <div className="flex gap-2 justify-end">
//                         <button onClick={() => setShowClForm(false)}
//                           className="text-xs text-stone-400 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-stone-400 transition-colors">
//                           Cancel
//                         </button>
//                         <button onClick={addChangelogFn} disabled={!clForm.version.trim() || !clForm.title.trim() || clAdding}
//                           className="text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-1.5 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-1.5">
//                           {clAdding ? <Loader2 className="w-3 h-3 animate-spin" /> : <Plus className="w-3 h-3" />}
//                           Add Entry
//                         </button>
//                       </div>
//                     </div>
//                   </motion.div>
//                 )}
//               </AnimatePresence>

//               {/* Changelog list */}
//               {changelog.length === 0 ? (
//                 <div className="text-center py-10 text-stone-300">
//                   <Clock className="w-10 h-10 mx-auto mb-2" />
//                   <p className="text-sm">No changelog entries yet</p>
//                 </div>
//               ) : (
//                 <div className="space-y-2">
//                   {changelog.sort((a, b) => new Date(b.releasedAt).getTime() - new Date(a.releasedAt).getTime()).map((entry) => {
//                     const typeCfg = CHANGELOG_TYPES.find((t) => t.value === entry.type) ?? CHANGELOG_TYPES[0];
//                     return (
//                       <div key={entry.id} className="group flex items-start gap-3 p-3 border border-stone-100 rounded-sm hover:border-stone-200 bg-white transition-colors">
//                         <div className="flex-shrink-0">
//                           <span className="text-[10px] font-black px-1.5 py-0.5 rounded-sm" style={{ color: typeCfg.color, backgroundColor: `${typeCfg.color}15` }}>
//                             {typeCfg.label}
//                           </span>
//                         </div>
//                         <div className="flex-1 min-w-0">
//                           <div className="flex items-center gap-2 mb-0.5">
//                             <span className="text-xs font-mono font-bold text-stone-700">v{entry.version}</span>
//                             <span className="text-xs font-semibold text-stone-600">{entry.title}</span>
//                           </div>
//                           {entry.description && (
//                             <p className="text-[11px] text-stone-400 leading-relaxed line-clamp-2">{entry.description}</p>
//                           )}
//                           <p className="text-[10px] text-stone-300 mt-1">{fmtDate(entry.releasedAt)}</p>
//                         </div>
//                         <button onClick={() => removeChangelog(entry.id)}
//                           className="flex-shrink-0 w-6 h-6 flex items-center justify-center text-stone-200 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors opacity-0 group-hover:opacity-100">
//                           <Trash2 className="w-3 h-3" />
//                         </button>
//                       </div>
//                     );
//                   })}
//                 </div>
//               )}
//             </div>
//           )}
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Stats tab ────────────────────────────────────────────────────────────────

// function StatsTab({ stats }: { stats: Stats }) {
//   const companyColors: Record<string, string> = {
//     "iPaha Ltd":       "#f59e0b",
//     "iPahaStores Ltd": "#3b82f6",
//     "Okpah Ltd":       "#10b981",
//   };

//   return (
//     <div className="p-6 max-w-5xl space-y-8">
//       <h2 className="text-sm font-black text-stone-700 uppercase tracking-wider">Portfolio Overview</h2>

//       {/* Status breakdown */}
//       <div>
//         <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Status Breakdown</p>
//         <div className="grid grid-cols-2 sm:grid-cols-5 gap-3">
//           {Object.entries(STATUS_CFG).map(([key, cfg]) => {
//             const count = stats.bystatus.find((b) => b.status === key)?.count ?? 0;
//             return (
//               <div key={key} className="bg-white border border-stone-100 rounded-sm p-4 text-center">
//                 <div className="w-2.5 h-2.5 rounded-full mx-auto mb-2" style={{ backgroundColor: cfg.dot }} />
//                 <p className="text-2xl font-black text-stone-900">{count}</p>
//                 <p className="text-[11px] text-stone-400 font-semibold mt-1">{cfg.label}</p>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Company breakdown */}
//       <div>
//         <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">By Company</p>
//         <div className="grid grid-cols-3 gap-4">
//           {COMPANIES.map((company) => {
//             const count = stats.byCompany.find((b) => b.company === company.id)?.count ?? 0;
//             return (
//               <div key={company.id} className="bg-white border border-stone-100 rounded-sm p-5">
//                 <div className="flex items-center gap-2 mb-3">
//                   <span className="text-xl">{company.flag}</span>
//                   <p className="text-xs font-black text-stone-800">{company.short}</p>
//                 </div>
//                 <p className="text-3xl font-black" style={{ color: company.color }}>{count}</p>
//                 <p className="text-[11px] text-stone-400 mt-1">app{count !== 1 ? "s" : ""}</p>
//               </div>
//             );
//           })}
//         </div>
//       </div>

//       {/* Top viewed */}
//       {stats.topViewed.length > 0 && (
//         <div>
//           <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Top Viewed Apps</p>
//           <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
//             {stats.topViewed.map((app, i) => (
//               <div key={app.id} className="flex items-center gap-4 px-5 py-3.5 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors">
//                 <span className="text-lg font-black text-stone-200 w-7 text-right flex-shrink-0">{i + 1}</span>
//                 <span className="text-xl flex-shrink-0">{app.emoji}</span>
//                 <div className="flex-1 min-w-0">
//                   <p className="text-sm font-bold text-stone-800 truncate">{app.name}</p>
//                   <p className="text-[10px] text-stone-400">{app.company}</p>
//                 </div>
//                 <StatusBadge status={app.status} sm />
//                 <div className="text-right text-[11px] text-stone-400 flex-shrink-0 w-20">
//                   <p className="font-bold text-stone-700">{app.viewCount.toLocaleString()} views</p>
//                   <p>{app.userCount.toLocaleString()} users</p>
//                 </div>
//               </div>
//             ))}
//           </div>
//         </div>
//       )}

//       {/* Summary stats */}
//       <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
//         {[
//           { label: "Total Apps",  value: stats.total,                icon: AppWindow, color: "#f59e0b" },
//           { label: "Live",        value: stats.live,                 icon: Globe,     color: "#10b981" },
//           { label: "Total Users", value: stats.totalUsers,           icon: Users,     color: "#3b82f6" },
//           { label: "Total Views", value: stats.totalViews,           icon: Eye,       color: "#8b5cf6" },
//         ].map((s) => (
//           <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4">
//             <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
//             <p className="text-2xl font-black text-stone-900">{s.value.toLocaleString()}</p>
//             <p className="text-[11px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
//           </div>
//         ))}
//       </div>
//     </div>
//   );
// }

// // ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

// export function AppsAdminClient({
//   userId, stats, initialApps, appTotal, appPages,
//   initialTab, initialSearch, initialStatus, initialCompany,
//   initialEditId, currentPage,
// }: Props) {
//   const [tab,       setTab]       = useState<"apps" | "editor" | "stats">(initialTab);
//   const [apps,      setApps]      = useState<AppSummary[]>(initialApps);
//   const [total,     setTotal]     = useState(appTotal);
//   const [pages,     setPages]     = useState(appPages);
//   const [page,      setPage]      = useState(currentPage);
//   const [search,    setSearch]    = useState(initialSearch);
//   const [status,    setStatus]    = useState(initialStatus);
//   const [company,   setCompany]   = useState(initialCompany);
//   const [sortBy,    setSortBy]    = useState("createdAt_desc");
//   const [selected,  setSelected]  = useState<Set<string>>(new Set());
//   const [viewMode,  setViewMode]  = useState<"grid" | "list">("grid");
//   const [statsData, setStatsData] = useState(stats);
//   const [editApp,   setEditApp]   = useState<AppFull | null>(null);

//   const [confirm, setConfirm] = useState<{
//     open: boolean; title: string; message: string; danger?: boolean;
//     confirmLabel?: string; action?: () => Promise<void>;
//   }>({ open: false, title: "", message: "" });
//   const [confirmLoading, setConfirmLoading] = useState(false);

//   const fetchApps = useCallback(async (opts?: { q?: string; st?: string; co?: string; sort?: string; pg?: number }) => {
//     const q    = opts?.q    ?? search;
//     const st   = opts?.st   ?? status;
//     const co   = opts?.co   ?? company;
//     const sort = opts?.sort ?? sortBy;
//     const pg   = opts?.pg   ?? page;

//     const params = new URLSearchParams({ page: String(pg), pageSize: "20" });
//     if (q && q !== "")    params.set("search", q);
//     if (st && st !== "ALL") params.set("status", st);
//     if (co && co !== "ALL") params.set("company", co);
//     const [sf, sd] = sort.split("_");
//     params.set("sortBy", sf); params.set("sortOrder", sd);

//     const res  = await fetch(`/api/admin/apps?${params}`);
//     const data = await res.json();
//     setApps(data.apps ?? []); setTotal(data.total ?? 0); setPages(data.pages ?? 1);
//   }, [search, status, company, sortBy, page]);

//   const openEditor = useCallback(async (app: AppSummary) => {
//     const res  = await fetch(`/api/admin/apps/${app.id}`);
//     const full = await res.json();
//     setEditApp(full);
//     setTab("editor");
//   }, []);

//   const handleToggleFeatured = useCallback(async (id: string) => {
//     const res     = await fetch(`/api/admin/apps/${id}`, {
//       method: "PATCH", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ _action: "toggleFeatured" }),
//     });
//     const updated = await res.json();
//     setApps((prev) => prev.map((a) => ({
//       ...a, isFeatured: a.id === id ? updated.isFeatured : (updated.isFeatured ? false : a.isFeatured),
//     })));
//   }, []);

//   const handleDuplicate = useCallback(async (id: string) => {
//     const res  = await fetch(`/api/admin/apps/${id}`, {
//       method: "PATCH", headers: { "Content-Type": "application/json" },
//       body: JSON.stringify({ _action: "duplicate" }),
//     });
//     const copy = await res.json();
//     setApps((prev) => [{ ...copy, _count: { screenshots: 0, changelog: 0 }, changelog: [] }, ...prev]);
//     setTotal((t) => t + 1);
//     setStatsData((s) => ({ ...s, total: s.total + 1, inDev: s.inDev + 1 }));
//   }, []);

//   const handleDelete = useCallback((id: string, name: string) => {
//     setConfirm({
//       open: true, danger: true,
//       title: `Delete "${name}"?`,
//       message: "This app and all its screenshots and changelog entries will be permanently deleted.",
//       confirmLabel: "Delete App",
//       action: async () => {
//         await fetch(`/api/admin/apps/${id}`, { method: "DELETE" });
//         setApps((prev) => prev.filter((a) => a.id !== id));
//         setTotal((t) => t - 1);
//         setSelected((prev) => { const n = new Set(prev); n.delete(id); return n; });
//       },
//     });
//   }, []);

//   const handleBulkDelete = () => {
//     const ids = [...selected];
//     setConfirm({
//       open: true, danger: true,
//       title: `Delete ${ids.length} app(s)?`,
//       message: "All selected apps and their related data will be permanently deleted.",
//       confirmLabel: "Delete All",
//       action: async () => {
//         await fetch("/api/admin/apps", {
//           method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ids }),
//         });
//         setApps((prev) => prev.filter((a) => !ids.includes(a.id)));
//         setTotal((t) => t - ids.length);
//         setSelected(new Set());
//       },
//     });
//   };

//   const handleSaved = useCallback((saved: AppFull) => {
//     setApps((prev) => {
//       const exists = prev.find((a) => a.id === saved.id);
//       const summary: AppSummary = {
//         ...saved,
//         _count:    { screenshots: saved.screenshots?.length ?? 0, changelog: saved.changelog?.length ?? 0 },
//         changelog: saved.changelog?.slice(0, 1).map((c) => ({ version: c.version, releasedAt: c.releasedAt })) ?? [],
//       };
//       if (exists) return prev.map((a) => a.id === saved.id ? summary : a);
//       return [summary, ...prev];
//     });
//     if (!apps.find((a) => a.id === saved.id)) {
//       setTotal((t) => t + 1);
//       setStatsData((s) => ({ ...s, total: s.total + 1, inDev: s.inDev + 1 }));
//     }
//   }, [apps]);

//   const runConfirm = async () => {
//     if (!confirm.action) return;
//     setConfirmLoading(true);
//     await confirm.action();
//     setConfirm((s) => ({ ...s, open: false }));
//     setConfirmLoading(false);
//   };

//   return (
//     <div className="flex flex-col h-full">
//       <ConfirmDialog
//         open={confirm.open} title={confirm.title} message={confirm.message}
//         danger={confirm.danger} confirmLabel={confirm.confirmLabel}
//         onConfirm={runConfirm} onCancel={() => setConfirm((s) => ({ ...s, open: false }))}
//         loading={confirmLoading}
//       />

//       {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
//       <div className="px-6 pt-6 pb-0 border-b border-stone-100 flex-shrink-0">
//         <div className="flex items-start justify-between gap-4 flex-wrap mb-4">
//           <div>
//             <h1 className="text-2xl font-black text-stone-900">Apps</h1>
//             <p className="text-sm text-stone-400 mt-0.5">
//               {statsData.total} apps · {statsData.live} live · {statsData.beta} beta · {statsData.inDev} in dev
//             </p>
//           </div>
//           <div className="flex items-center gap-2">
//             <button onClick={() => { setTab("stats"); }}
//               className="flex items-center gap-2 text-sm font-bold text-stone-600 bg-stone-50 hover:bg-stone-100 border border-stone-200 px-4 py-2.5 rounded-sm transition-colors">
//               <BarChart2 className="w-4 h-4" />Stats
//             </button>
//             <button
//               onClick={() => { setEditApp(null); setTab("editor"); }}
//               className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm">
//               <Plus className="w-4 h-4" />New App
//             </button>
//           </div>
//         </div>

//         {/* Stat cards */}
//         <div className="grid grid-cols-3 sm:grid-cols-4 xl:grid-cols-7 gap-2 mb-4">
//           {[
//             { label: "Total",       value: statsData.total,      color: "#f59e0b", icon: AppWindow },
//             { label: "Live",        value: statsData.live,       color: "#10b981", icon: Globe    },
//             { label: "Beta",        value: statsData.beta,       color: "#d97706", icon: Zap      },
//             { label: "In Dev",      value: statsData.inDev,      color: "#3b82f6", icon: Code2    },
//             { label: "Coming Soon", value: statsData.comingSoon, color: "#6b7280", icon: Clock    },
//             { label: "Total Users", value: statsData.totalUsers, color: "#8b5cf6", icon: Users    },
//             { label: "Views",       value: statsData.totalViews, color: "#ec4899", icon: Eye      },
//           ].map((s) => (
//             <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3">
//               <s.icon className="w-3.5 h-3.5 mb-1.5" style={{ color: s.color }} />
//               <p className="text-lg font-black text-stone-900">{s.value.toLocaleString()}</p>
//               <p className="text-[10px] font-semibold text-stone-400">{s.label}</p>
//             </div>
//           ))}
//         </div>

//         {/* Company pills */}
//         <div className="flex items-center gap-1.5 mb-4 flex-wrap">
//           <button onClick={() => { setCompany("ALL"); fetchApps({ co: "ALL" }); }}
//             className={`text-[11px] font-bold px-2.5 py-1 rounded-sm border transition-colors ${company === "ALL" ? "bg-stone-900 text-white border-stone-900" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}>
//             All companies
//           </button>
//           {COMPANIES.map((c) => (
//             <button key={c.id} onClick={() => { setCompany(c.id); fetchApps({ co: c.id }); }}
//               className={`text-[11px] font-bold px-2.5 py-1 rounded-sm border transition-colors ${company === c.id ? "text-white border-transparent" : "border-stone-200 text-stone-500 hover:border-stone-400"}`}
//               style={company === c.id ? { backgroundColor: c.color, borderColor: c.color } : {}}>
//               {c.flag} {c.short}
//             </button>
//           ))}
//         </div>

//         {/* Tabs */}
//         <div className="flex items-center gap-0.5">
//           {[
//             { id: "apps",   label: "All Apps",    icon: Grid3x3  },
//             { id: "editor", label: editApp ? `Editing: ${editApp.name}` : "New App", icon: Pencil },
//             { id: "stats",  label: "Stats",       icon: BarChart2 },
//           ].map((t) => (
//             <button key={t.id} onClick={() => setTab(t.id as any)}
//               className={`flex items-center gap-2 px-4 py-3 text-sm font-semibold border-b-2 transition-all ${
//                 tab === t.id ? "border-amber-500 text-amber-600" : "border-transparent text-stone-400 hover:text-stone-700"
//               }`}>
//               <t.icon className="w-4 h-4" />{t.label}
//             </button>
//           ))}
//         </div>
//       </div>

//       {/* ════════════════════════════════════════════════════════════════
//           TAB: ALL APPS
//       ════════════════════════════════════════════════════════════════ */}
//       {tab === "apps" && (
//         <div className="flex-1 overflow-hidden flex flex-col">
//           {/* Toolbar */}
//           <div className="flex items-center gap-2 px-5 py-3 border-b border-stone-100 flex-wrap flex-shrink-0">
//             {/* Search */}
//             <div className="relative flex-1 min-w-[180px] max-w-xs">
//               <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
//               <input
//                 value={search}
//                 onChange={(e) => { setSearch(e.target.value); setPage(1); fetchApps({ q: e.target.value, pg: 1 }); }}
//                 placeholder="Search apps…"
//                 className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
//               />
//             </div>

//             {/* Status filter */}
//             <select value={status}
//               onChange={(e) => { setStatus(e.target.value); setPage(1); fetchApps({ st: e.target.value, pg: 1 }); }}
//               className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
//               <option value="ALL">All statuses</option>
//               {Object.entries(STATUS_CFG).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
//             </select>

//             {/* Sort */}
//             <select value={sortBy}
//               onChange={(e) => { setSortBy(e.target.value); setPage(1); fetchApps({ sort: e.target.value, pg: 1 }); }}
//               className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none focus:border-amber-400">
//               <option value="createdAt_desc">Newest</option>
//               <option value="createdAt_asc">Oldest</option>
//               <option value="updatedAt_desc">Recently updated</option>
//               <option value="viewCount_desc">Most viewed</option>
//               <option value="userCount_desc">Most users</option>
//               <option value="name_asc">Name A–Z</option>
//             </select>

//             {/* View toggle */}
//             <div className="flex items-center border border-stone-200 rounded-sm overflow-hidden">
//               <button onClick={() => setViewMode("grid")}
//                 className={`p-2 transition-colors ${viewMode === "grid" ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:text-stone-700"}`}>
//                 <Grid3x3 className="w-3.5 h-3.5" />
//               </button>
//               <button onClick={() => setViewMode("list")}
//                 className={`p-2 transition-colors ${viewMode === "list" ? "bg-stone-100 text-stone-700" : "text-stone-400 hover:text-stone-700"}`}>
//                 <List className="w-3.5 h-3.5" />
//               </button>
//             </div>

//             {/* Bulk actions */}
//             {selected.size > 0 && (
//               <div className="flex items-center gap-2 ml-2 pl-2 border-l border-stone-200">
//                 <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
//                 <button onClick={handleBulkDelete}
//                   className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors">
//                   <Trash2 className="w-3.5 h-3.5" />Delete
//                 </button>
//                 <button onClick={() => setSelected(new Set())} className="text-xs text-stone-400 hover:text-stone-700">Clear</button>
//               </div>
//             )}

//             <span className="text-xs text-stone-400 ml-auto">{total} app{total !== 1 ? "s" : ""}</span>
//           </div>

//           {/* Apps grid/list */}
//           <div className="flex-1 overflow-y-auto p-5">
//             {apps.length === 0 ? (
//               <div className="flex flex-col items-center justify-center py-20 text-center">
//                 <AppWindow className="w-10 h-10 text-stone-200 mb-3" />
//                 <p className="text-sm text-stone-400 font-medium">
//                   {search ? `No apps match "${search}"` : "No apps yet"}
//                 </p>
//                 <button onClick={() => { setEditApp(null); setTab("editor"); }}
//                   className="mt-3 text-xs text-amber-600 font-semibold hover:text-amber-800 underline underline-offset-2">
//                   Add your first app
//                 </button>
//               </div>
//             ) : viewMode === "grid" ? (
//               <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
//                 <AnimatePresence>
//                   {apps.map((app) => (
//                     <AppCard
//                       key={app.id} app={app}
//                       selected={selected.has(app.id)}
//                       onSelect={(id) => setSelected((prev) => { 
//                         const n = new Set(prev); 
//                         if (prev.has(id)) { 
//                           n.delete(id); 
//                         } else { 
//                           n.add(id); 
//                         } 
//                         return n; 
//                       })}
//                       onEdit={openEditor}
//                       onDelete={handleDelete}
//                       onToggleFeatured={handleToggleFeatured}
//                       onDuplicate={handleDuplicate}
//                     />
//                   ))}
//                 </AnimatePresence>
//               </div>
//             ) : (
//               /* List view */
//               <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
//                 {apps.map((app) => (
//                   <motion.div key={app.id} layout
//                     className={`group flex items-center gap-3 px-4 py-3 border-b border-stone-50 hover:bg-stone-50/60 transition-colors ${selected.has(app.id) ? "bg-amber-50/40" : ""}`}>
//                     <button onClick={() => setSelected((prev) => { 
//                       const n = new Set(prev); 
//                       if (prev.has(app.id)) { 
//                         n.delete(app.id); 
//                       } else { 
//                         n.add(app.id); 
//                       } 
//                       return n; 
//                     })}>
//                       {selected.has(app.id)
//                         ? <CheckSquare className="w-4 h-4 text-amber-500" />
//                         : <Square className="w-4 h-4 text-stone-200 group-hover:text-stone-400" />
//                       }
//                     </button>
//                     <span className="text-xl flex-shrink-0">{app.emoji}</span>
//                     <div
//                       className="w-1 h-8 rounded-full flex-shrink-0"
//                       style={{ backgroundColor: app.accentColor }}
//                     />
//                     <div className="flex-1 min-w-0">
//                       <button onClick={() => openEditor(app)}
//                         className="text-sm font-bold text-stone-800 hover:text-amber-600 transition-colors text-left">
//                         {app.name}
//                       </button>
//                       <p className="text-[11px] text-stone-400 truncate">{app.tagline}</p>
//                     </div>
//                     <div className="hidden sm:flex items-center gap-2 flex-shrink-0">
//                       <StatusBadge status={app.status} sm />
//                       <CompanyBadge company={app.company} flag={app.companyFlag} sm />
//                     </div>
//                     <div className="hidden lg:flex items-center gap-3 text-[11px] text-stone-400 flex-shrink-0">
//                       <span className="flex items-center gap-1"><Users className="w-3 h-3" />{app.userCount.toLocaleString()}</span>
//                       <span className="flex items-center gap-1"><Eye className="w-3 h-3" />{app.viewCount.toLocaleString()}</span>
//                     </div>
//                     <div className="flex items-center gap-1 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-opacity">
//                       <button onClick={() => openEditor(app)}
//                         className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm transition-colors">
//                         <Edit2 className="w-3.5 h-3.5" />
//                       </button>
//                       <button onClick={() => handleDelete(app.id, app.name)}
//                         className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-sm transition-colors">
//                         <Trash2 className="w-3.5 h-3.5" />
//                       </button>
//                     </div>
//                   </motion.div>
//                 ))}
//               </div>
//             )}

//             {/* Pagination */}
//             {pages > 1 && (
//               <div className="flex items-center justify-center gap-2 py-6">
//                 <button disabled={page <= 1} onClick={() => { setPage(page - 1); fetchApps({ pg: page - 1 }); }}
//                   className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
//                   ← Prev
//                 </button>
//                 <span className="text-xs text-stone-400">Page {page} of {pages}</span>
//                 <button disabled={page >= pages} onClick={() => { setPage(page + 1); fetchApps({ pg: page + 1 }); }}
//                   className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
//                   Next →
//                 </button>
//               </div>
//             )}
//           </div>
//         </div>
//       )}

//       {/* ════════════════════════════════════════════════════════════════
//           TAB: EDITOR
//       ════════════════════════════════════════════════════════════════ */}
//       {tab === "editor" && (
//         <div className="flex-1 overflow-hidden">
//           <AppEditor
//             app={editApp}
//             userId={userId}
//             onSaved={(saved) => { handleSaved(saved); }}
//             onCancel={() => { setTab("apps"); setEditApp(null); }}
//           />
//         </div>
//       )}

//       {/* ════════════════════════════════════════════════════════════════
//           TAB: STATS
//       ════════════════════════════════════════════════════════════════ */}
//       {tab === "stats" && (
//         <div className="flex-1 overflow-y-auto">
//           <StatsTab stats={statsData} />
//         </div>
//       )}
//     </div>
//   );
// }
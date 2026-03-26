"use client";

// =============================================================================
// isaacpaha.com — Blog SEO Panel
// components/admin/blog/seo-panel.tsx
// =============================================================================

import React, { useState, useEffect } from "react";
import {
   AlertCircle, CheckCircle2, XCircle,
  Info, Eye, Copy, Check,  Sparkles,
  Loader2, 
} from "lucide-react";

interface SEOPanelProps {
  title:           string;
  excerpt:         string;
  content:         string;
  slug:            string;
  tags:            string[];
  metaTitle:       string;
  metaDescription: string;
  keywords:        string;
  canonicalUrl:    string;
  coverImageAlt:   string;
  onMetaChange:    (field: string, value: string) => void;
}

type SeoIssue = {
  type:    "error" | "warning" | "info" | "ok";
  label:   string;
  detail?: string;
};

function runSeoAudit(data: Omit<SEOPanelProps, "onMetaChange">): { score: number; issues: SeoIssue[] } {
  const issues: SeoIssue[] = [];
  let score = 100;

  // Title checks
  const mt = data.metaTitle || data.title;
  if (!mt) {
    issues.push({ type: "error", label: "Meta title missing", detail: "Required for SEO — add a compelling 50-60 char title." });
    score -= 20;
  } else if (mt.length < 30) {
    issues.push({ type: "warning", label: `Meta title too short (${mt.length} chars)`, detail: "Target 50-60 characters for optimal display." });
    score -= 8;
  } else if (mt.length > 65) {
    issues.push({ type: "warning", label: `Meta title too long (${mt.length} chars)`, detail: "Will be truncated in search results. Keep under 60 chars." });
    score -= 5;
  } else {
    issues.push({ type: "ok", label: `Meta title good (${mt.length} chars)` });
  }

  // Description checks
  const md = data.metaDescription || data.excerpt;
  if (!md) {
    issues.push({ type: "error", label: "Meta description missing", detail: "Appears in search results — critical for CTR." });
    score -= 15;
  } else if (md.length < 100) {
    issues.push({ type: "warning", label: `Meta description short (${md.length} chars)`, detail: "Target 150-160 characters." });
    score -= 5;
  } else if (md.length > 165) {
    issues.push({ type: "warning", label: `Meta description long (${md.length} chars)`, detail: "Will be truncated. Keep under 160 chars." });
    score -= 3;
  } else {
    issues.push({ type: "ok", label: `Meta description good (${md.length} chars)` });
  }

  // Content length
  const wc = data.content.trim().split(/\s+/).length;
  if (wc < 300) {
    issues.push({ type: "error", label: `Content too short (${wc} words)`, detail: "Minimum 600-800 words for ranking. 1000+ preferred." });
    score -= 20;
  } else if (wc < 600) {
    issues.push({ type: "warning", label: `Content thin (${wc} words)`, detail: "Consider expanding to 900+ words." });
    score -= 10;
  } else {
    issues.push({ type: "ok", label: `Content length good (${wc} words)` });
  }

  // Headings in content
  const h2Count = (data.content.match(/^## /gm) || []).length;
  if (h2Count === 0) {
    issues.push({ type: "warning", label: "No H2 headings", detail: "Use H2 (##) sections to structure content and help crawlers." });
    score -= 8;
  } else {
    issues.push({ type: "ok", label: `${h2Count} H2 section${h2Count !== 1 ? "s" : ""} found` });
  }

  // Image alt text
  if (data.content.includes("![") && !data.content.match(/!\[.+?\]/)) {
    issues.push({ type: "warning", label: "Images missing alt text", detail: "Add descriptive alt text to all images." });
    score -= 5;
  }

  // Cover image alt
  if (!data.coverImageAlt) {
    issues.push({ type: "info", label: "Cover image alt text missing", detail: "Add alt text for the cover image." });
    score -= 3;
  }

  // Tags/keywords
  if (!data.tags.length && !data.keywords) {
    issues.push({ type: "warning", label: "No tags or keywords", detail: "Add relevant tags to improve discoverability." });
    score -= 8;
  } else {
    issues.push({ type: "ok", label: `${data.tags.length} tags defined` });
  }

  // Slug check
  if (data.slug && /[A-Z\s]/.test(data.slug)) {
    issues.push({ type: "error", label: "Slug has uppercase or spaces", detail: "Slugs must be lowercase with hyphens only." });
    score -= 10;
  } else if (data.slug) {
    issues.push({ type: "ok", label: "Slug format correct" });
  }

  // Internal links  
  const linkCount = (data.content.match(/\[.+?\]\(\//g) || []).length;
  if (linkCount === 0) {
    issues.push({ type: "info", label: "No internal links", detail: "Link to related blog posts or pages to improve site structure." });
    score -= 3;
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

function ScoreRing({ score }: { score: number }) {
  const color = score >= 80 ? "#10b981" : score >= 60 ? "#f59e0b" : "#ef4444";
  const label = score >= 80 ? "Good"    : score >= 60 ? "Needs work" : "Poor";
  const r = 28; const circ = 2 * Math.PI * r;
  const dash = (score / 100) * circ;

  return (
    <div className="flex items-center gap-3">
      <div className="relative w-16 h-16">
        <svg viewBox="0 0 64 64" className="rotate-[-90deg]" width={64} height={64}>
          <circle cx={32} cy={32} r={r} fill="none" stroke="#f3f4f6" strokeWidth={5} />
          <circle cx={32} cy={32} r={r} fill="none" stroke={color} strokeWidth={5}
            strokeDasharray={`${dash} ${circ}`} strokeLinecap="round"
            style={{ transition: "stroke-dasharray 0.5s ease" }}
          />
        </svg>
        <div className="absolute inset-0 flex items-center justify-center">
          <span className="text-sm font-black" style={{ color }}>{score}</span>
        </div>
      </div>
      <div>
        <p className="text-sm font-black" style={{ color }}>{label}</p>
        <p className="text-[11px] text-stone-400">SEO Score</p>
      </div>
    </div>
  );
}

export function SeoPanel({
  title, excerpt, content, slug, tags, metaTitle, metaDescription,
  keywords, canonicalUrl, coverImageAlt, onMetaChange,
}: SEOPanelProps) {
  const [audit,    setAudit]    = useState<{ score: number; issues: SeoIssue[] } | null>(null);
  const [aiLoading, setAiLoading] = useState(false);
  const [copied,   setCopied]   = useState<string | null>(null);
  const [preview,  setPreview]  = useState<"google" | "twitter">("google");

  useEffect(() => {
    const timeout = setTimeout(() => {
      setAudit(runSeoAudit({ title, excerpt, content, slug, tags, metaTitle, metaDescription, keywords, canonicalUrl, coverImageAlt }));
    }, 500);
    return () => clearTimeout(timeout);
  }, [title, excerpt, content, slug, tags, metaTitle, metaDescription, keywords, canonicalUrl, coverImageAlt]);

  const generateWithAI = async (field: "metaTitle" | "metaDescription" | "keywords") => {
    setAiLoading(true);
    try {
      const res  = await fetch("/api/admin/blog/ai", {
        method: "POST", headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode: field === "keywords" ? "tags" : "seo",
          title, content: content.slice(0, 800),
          prompt: `Generate the ${field} only.`,
        }),
      });
      const data = await res.json();
      if (data.content) {
        // Parse out the specific field from AI response
        if (field === "metaTitle") {
          const match = data.content.match(/\*\*Meta title\*\*[:\s]+(.+?)(\n|$)/i);
          if (match) onMetaChange("metaTitle", match[1].trim().slice(0, 65));
        } else if (field === "metaDescription") {
          const match = data.content.match(/\*\*Meta description\*\*[:\s]+(.+?)(\n|$)/i);
          if (match) onMetaChange("metaDescription", match[1].trim().slice(0, 165));
        } else if (field === "keywords") {
          onMetaChange("keywords", data.content.trim());
        }
      }
    } catch {}
    setAiLoading(false);
  };

  const copyField = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 2000);
  };

  const displayTitle = metaTitle || title;
  const displayDesc  = metaDescription || excerpt;
  const siteUrl      = "https://isaacpaha.com";
  const fullUrl      = `${siteUrl}/blog/${slug}`;

  const issueIcon: Record<SeoIssue["type"], React.ElementType> = {
    error:   XCircle,
    warning: AlertCircle,
    info:    Info,
    ok:      CheckCircle2,
  };
  const issueColor: Record<SeoIssue["type"], string> = {
    error:   "text-red-500",
    warning: "text-amber-500",
    info:    "text-blue-500",
    ok:      "text-emerald-500",
  };

  return (
    <div className="space-y-5 p-5">

      {/* Score + preview toggle */}
      <div className="flex items-start justify-between gap-4">
        {audit && <ScoreRing score={audit.score} />}
        <div className="flex gap-1">
          {(["google", "twitter"] as const).map((p) => (
            <button key={p} onClick={() => setPreview(p)}
              className={`text-[11px] font-semibold px-2.5 py-1.5 rounded-sm border transition-colors capitalize ${
                preview === p ? "bg-amber-50 text-amber-700 border-amber-200" : "bg-white text-stone-500 border-stone-200"
              }`}>
              {p}
            </button>
          ))}
        </div>
      </div>

      {/* SERP preview */}
      <div className="border border-stone-200 rounded-sm overflow-hidden">
        <div className="px-3 py-2 bg-stone-50 border-b border-stone-100 flex items-center gap-2">
          <Eye className="w-3.5 h-3.5 text-stone-400" />
          <span className="text-[11px] font-bold text-stone-500 uppercase tracking-wider">
            {preview === "google" ? "Google Preview" : "Twitter Card Preview"}
          </span>
        </div>
        {preview === "google" ? (
          <div className="p-4 bg-white">
            <p className="text-xs text-emerald-700 font-medium mb-0.5 truncate">{fullUrl}</p>
            <p className="text-base font-semibold text-blue-700 hover:underline cursor-pointer leading-snug mb-1 line-clamp-1">
              {displayTitle || "Post title appears here"}
            </p>
            <p className="text-sm text-stone-500 leading-relaxed line-clamp-2">
              {displayDesc || "Meta description appears here — write a compelling 150-160 character summary that makes people want to click."}
            </p>
          </div>
        ) : (
          <div className="p-4 bg-white">
            <div className="border border-stone-200 rounded-sm overflow-hidden max-w-sm">
              <div className="h-24 bg-gradient-to-br from-amber-100 to-stone-100 flex items-center justify-center">
                <span className="text-2xl">📄</span>
              </div>
              <div className="px-3 py-2.5 border-t border-stone-100">
                <p className="text-[10px] text-stone-400 uppercase font-semibold mb-1">isaacpaha.com</p>
                <p className="text-sm font-bold text-stone-900 line-clamp-1">{displayTitle || "Post title"}</p>
                <p className="text-xs text-stone-500 mt-0.5 line-clamp-2">{displayDesc}</p>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Meta fields */}
      <div className="space-y-4">
        {[
          {
            key: "metaTitle", label: "Meta Title", placeholder: "50-60 characters",
            value: metaTitle, maxLen: 65, rows: 1, type: "input" as const,
          },
          {
            key: "metaDescription", label: "Meta Description", placeholder: "150-160 characters",
            value: metaDescription, maxLen: 165, rows: 3, type: "textarea" as const,
          },
          {
            key: "keywords", label: "Keywords", placeholder: "keyword1, keyword2, …",
            value: keywords, rows: 2, type: "textarea" as const,
          },
          {
            key: "canonicalUrl", label: "Canonical URL", placeholder: "https://isaacpaha.com/blog/…",
            value: canonicalUrl, rows: 1, type: "input" as const,
          },
        ].map((field) => (
          <div key={field.key}>
            <div className="flex items-center justify-between mb-1">
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{field.label}</label>
              <div className="flex items-center gap-1.5">
                {field.maxLen && (
                  <span className={`text-[10px] font-semibold ${
                    (field.value?.length ?? 0) > (field.maxLen) ? "text-red-500" : "text-stone-400"
                  }`}>{field.value?.length ?? 0}/{field.maxLen}</span>
                )}
                <button
                  onClick={() => generateWithAI(field.key as "metaTitle" | "metaDescription" | "keywords")}
                  disabled={aiLoading}
                  className="flex items-center gap-1 text-[10px] text-amber-600 hover:text-amber-800 transition-colors disabled:opacity-40"
                >
                  {aiLoading ? <Loader2 className="w-2.5 h-2.5 animate-spin" /> : <Sparkles className="w-2.5 h-2.5" />}
                  AI
                </button>
                {field.value && (
                  <button onClick={() => copyField(field.value!, field.key)}
                    className="text-stone-300 hover:text-stone-700 transition-colors">
                    {copied === field.key ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                  </button>
                )}
              </div>
            </div>
            {field.type === "input" ? (
              <input
                value={field.value} onChange={(e) => onMetaChange(field.key, e.target.value)}
                placeholder={field.placeholder}
                className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
              />
            ) : (
              <textarea
                value={field.value} onChange={(e) => onMetaChange(field.key, e.target.value)}
                rows={field.rows} placeholder={field.placeholder}
                className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 resize-none"
              />
            )}
          </div>
        ))}
      </div>

      {/* Issues list */}
      {audit && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">
            {audit.issues.filter((i) => i.type !== "ok").length} issues · {audit.issues.filter((i) => i.type === "ok").length} passing
          </p>
          <div className="space-y-1.5">
            {audit.issues
              .sort((a, b) => {
                const order = { error: 0, warning: 1, info: 2, ok: 3 };
                return order[a.type] - order[b.type];
              })
              .map((issue, i) => {
                const Icon = issueIcon[issue.type];
                return (
                  <div key={i} className={`flex items-start gap-2 text-[11px] px-2.5 py-2 rounded-sm ${
                    issue.type === "ok" ? "bg-emerald-50/40" :
                    issue.type === "error" ? "bg-red-50" :
                    issue.type === "warning" ? "bg-amber-50/60" : "bg-blue-50/40"
                  }`}>
                    <Icon className={`w-3.5 h-3.5 flex-shrink-0 mt-0.5 ${issueColor[issue.type]}`} />
                    <div>
                      <p className="font-semibold text-stone-700">{issue.label}</p>
                      {issue.detail && <p className="text-stone-500 mt-0.5 leading-snug">{issue.detail}</p>}
                    </div>
                  </div>
                );
              })}
          </div>
        </div>
      )}
    </div>
  );
}
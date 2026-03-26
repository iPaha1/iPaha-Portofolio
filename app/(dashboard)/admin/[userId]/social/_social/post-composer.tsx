"use client";

// =============================================================================
// isaacpaha.com — Social Post Composer
// components/admin/social/post-composer.tsx
// Rich post creation: platform selector, AI writing, char limits, preview, media
// =============================================================================

import React, { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Loader2, Check, X, AlertCircle, Save, Send,
  Eye, Image, Hash, Copy, Clock,
  Target, Layers, Zap, ArrowLeft,
   Globe,
} from "lucide-react";
import { PLATFORMS, type Platform } from "./platform-connect";

// ─── Types ────────────────────────────────────────────────────────────────────

type PostStatus = "draft" | "scheduled" | "published";

type Connection = {
  id:       string;
  platform: string;
  handle:   string | null;
  isActive: boolean;
};

interface PostComposerProps {
  connections:  Connection[];
  onSaved:      (post: any) => void;
  onCancel:     () => void;
  prefill?:     { content?: string; title?: string; platforms?: string[] };
}

// ─── AI Mode config ───────────────────────────────────────────────────────────

const AI_MODES = [
  { id: "write",     label: "Write Post",      icon: Sparkles, color: "#f59e0b", desc: "Write from scratch for this platform" },
  { id: "hook",      label: "Alternative Hooks", icon: Zap,    color: "#8b5cf6", desc: "5 different opening lines to pick from" },
  { id: "thread",    label: "Make Thread",     icon: Layers,   color: "#3b82f6", desc: "Expand into a Twitter thread" },
  { id: "hashtags",  label: "Suggest Hashtags",icon: Hash,     color: "#10b981", desc: "10-15 optimal hashtags" },
  { id: "viral",     label: "Viral Rewrite",   icon: TrendingUp, color: "#f97316", desc: "Rewrite for maximum engagement" },
  { id: "critique",  label: "AI Critique",     icon: Target,   color: "#ef4444", desc: "Honest feedback + improvements" },
  { id: "repurpose", label: "Cross-Post All",  icon: Globe,    color: "#6366f1", desc: "Generate for all selected platforms" },
] as const;

type AIMode = typeof AI_MODES[number]["id"];

// Need TrendingUp import
import { TrendingUp } from "lucide-react";

// ─── Character limit bar ──────────────────────────────────────────────────────

function CharLimit({ used, max }: { used: number; max: number }) {
  const pct  = (used / max) * 100;
  const left = max - used;
  const color = pct > 90 ? "#ef4444" : pct > 75 ? "#f59e0b" : "#10b981";
  return (
    <div className="flex items-center gap-2">
      <div className="flex-1 h-1 bg-stone-100 rounded-full overflow-hidden">
        <div
          className="h-full rounded-full transition-all duration-200"
          style={{ width: `${Math.min(100, pct)}%`, backgroundColor: color }}
        />
      </div>
      <span className="text-[11px] font-semibold" style={{ color: pct > 90 ? color : "#9ca3af" }}>
        {left < 0 ? `${Math.abs(left)} over` : `${left} left`}
      </span>
    </div>
  );
}

// ─── Platform preview ─────────────────────────────────────────────────────────

function PlatformPreview({ platform, content, handle }: { platform: Platform; content: string; handle: string }) {
  const processed = content.replace(/\n/g, "<br/>");

  return (
    <div className="border border-stone-100 rounded-sm overflow-hidden">
      {/* Platform header */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-stone-100 bg-stone-50">
        <div
          className="w-6 h-6 rounded-full flex items-center justify-center text-[11px] font-black"
          style={{ backgroundColor: platform.color, color: "white" }}
        >
          {platform.icon}
        </div>
        <span className="text-xs font-bold text-stone-600">{platform.label}</span>
        <span className="text-[10px] text-stone-400 ml-auto">Preview</span>
      </div>

      {/* Simulated post */}
      <div className="p-3 bg-white">
        {/* Profile row */}
        <div className="flex items-center gap-2 mb-2">
          <div className="w-8 h-8 rounded-full bg-amber-100 flex items-center justify-center text-xs font-black text-amber-700">IP</div>
          <div>
            <p className="text-xs font-bold text-stone-900">Isaac Paha</p>
            <p className="text-[10px] text-stone-400">@{handle || "isaacpaha"}</p>
          </div>
        </div>
        {/* Content */}
        <div
          className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap break-words"
          dangerouslySetInnerHTML={{ __html: processed }}
        />
        {/* Engagement bar */}
        <div className="flex items-center gap-4 mt-3 pt-2 border-t border-stone-50 text-[11px] text-stone-300">
          <span>💬 Reply</span>
          <span>🔁 Repost</span>
          <span>❤️ Like</span>
          <span>📊 Analytics</span>
        </div>
      </div>
    </div>
  );
}

// ─── MAIN EXPORT ─────────────────────────────────────────────────────────────

export function PostComposer({ connections, onSaved, onCancel, prefill }: PostComposerProps) {
  // Platform & content
  const [selectedPlatforms, setSelectedPlatforms] = useState<string[]>(
    prefill?.platforms ?? connections.filter((c) => c.isActive).map((c) => c.platform).slice(0, 1)
  );
  const [contentMap, setContentMap] = useState<Record<string, string>>(
    prefill?.content ? Object.fromEntries(
      (prefill.platforms ?? connections.map((c) => c.platform)).map((p) => [p, prefill.content ?? ""])
    ) : {}
  );
  const [activePlatformTab, setActivePlatformTab] = useState<string>(selectedPlatforms[0] ?? "TWITTER");
  const [mediaUrls,  setMediaUrls]  = useState<string[]>([]);
  const [mediaInput, setMediaInput] = useState("");
  const [scheduledAt, setScheduledAt] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // AI
  const [aiMode,    setAiMode]    = useState<AIMode>("write");
  const [aiPrompt,  setAiPrompt]  = useState(prefill?.title ?? "");
  const [aiLoading, setAiLoading] = useState(false);
  const [aiResult,  setAiResult]  = useState("");
  const [aiError,   setAiError]   = useState("");
  const [showAI,    setShowAI]    = useState(false);

  // Save
  const [saving,  setSaving]  = useState(false);
  const [saveErr, setSaveErr] = useState("");
  const [savedOk, setSavedOk] = useState(false);

  const activeContent     = contentMap[activePlatformTab] ?? "";
  const activePlatform    = PLATFORMS.find((p) => p.id === activePlatformTab)!;
  const activeConnection  = connections.find((c) => c.platform === activePlatformTab && c.isActive);
  const activeCharLimit   = activePlatform?.charLimit ?? 280;
  const charCount         = activeContent.length;

  const setContent = (platform: string, text: string) => {
    setContentMap((prev) => ({ ...prev, [platform]: text }));
  };

  const togglePlatform = (platformId: string) => {
    setSelectedPlatforms((prev) => {
      const next = prev.includes(platformId) ? prev.filter((p) => p !== platformId) : [...prev, platformId];
      if (!next.includes(activePlatformTab) && next.length > 0) setActivePlatformTab(next[0]);
      return next;
    });
  };

  const runAI = async () => {
    if (!aiPrompt.trim() && !activeContent.trim()) return;
    setAiLoading(true); setAiResult(""); setAiError("");
    try {
      const res  = await fetch("/api/admin/social/ai", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          mode:     aiMode,
          prompt:   aiPrompt.trim() || activeContent.slice(0, 200),
          platform: activePlatformTab,
          content:  activeContent,
        }),
      });
      const data = await res.json();
      if (!res.ok || data.error) { setAiError(data.error ?? "Generation failed"); }
      else { setAiResult(data.content ?? ""); }
    } catch { setAiError("Network error"); }
    setAiLoading(false);
  };

  const applyAIResult = (platform?: string) => {
    const target = platform ?? activePlatformTab;
    // For repurpose mode, parse platform-specific blocks
    if (aiMode === "repurpose") {
      PLATFORMS.forEach((p) => {
        const regex = new RegExp(`${p.label.toUpperCase()} POST[:\\s]*([\\s\\S]+?)(?=\\n[A-Z]+ POST|$)`, "i");
        const match = aiResult.match(regex);
        if (match?.[1] && selectedPlatforms.includes(p.id)) {
          setContent(p.id, match[1].trim());
        }
      });
    } else {
      setContent(target, aiResult);
    }
    setAiResult(""); setShowAI(false);
  };

  const handleSave = async (status: PostStatus = "draft") => {
    const postsToCreate = selectedPlatforms.filter((p) => (contentMap[p] ?? "").trim());
    if (!postsToCreate.length) { setSaveErr("Add content for at least one platform."); return; }
    setSaving(true); setSaveErr("");
    try {
      const results = await Promise.all(
        postsToCreate.map((platform) =>
          fetch("/api/admin/social/posts", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              platform,
              content:      contentMap[platform]!.trim(),
              mediaUrls:    mediaUrls.length ? mediaUrls : undefined,
              status,
              scheduledFor: status === "scheduled" && scheduledAt ? new Date(scheduledAt) : undefined,
            }),
          }).then((r) => r.json())
        )
      );
      setSavedOk(true);
      setTimeout(() => setSavedOk(false), 2000);
      onSaved(results);
    } catch (e: any) { setSaveErr(e.message ?? "Save failed"); }
    setSaving(false);
  };

  const connectedPlatforms = PLATFORMS.filter((p) => connections.some((c) => c.platform === p.id && c.isActive));

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between gap-3 px-5 py-4 border-b border-stone-100 flex-shrink-0">
        <button onClick={onCancel} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back
        </button>
        <div className="flex items-center gap-2">
          <button onClick={() => setShowPreview((p) => !p)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${showPreview ? "bg-stone-100 border-stone-300 text-stone-700" : "border-stone-200 text-stone-400 hover:border-stone-400"}`}>
            <Eye className="w-3.5 h-3.5" />Preview
          </button>
          <button onClick={() => setShowAI((p) => !p)}
            className={`flex items-center gap-1.5 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors ${showAI ? "bg-amber-50 border-amber-300 text-amber-700" : "border-stone-200 text-stone-400 hover:border-amber-400 hover:text-amber-600"}`}>
            <Sparkles className="w-3.5 h-3.5" />AI
          </button>
          <button onClick={() => handleSave("draft")} disabled={saving}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-500 border border-stone-200 hover:border-stone-400 px-3 py-2 rounded-sm transition-colors disabled:opacity-60">
            {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Save className="w-3.5 h-3.5" />}
            Save draft
          </button>
          {scheduledAt ? (
            <button onClick={() => handleSave("scheduled")} disabled={saving}
              className="flex items-center gap-2 text-sm font-bold text-white bg-blue-500 hover:bg-blue-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60">
              <Clock className="w-4 h-4" />Schedule
            </button>
          ) : (
            <button onClick={() => handleSave("published")} disabled={saving}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2 rounded-sm transition-colors disabled:opacity-60">
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : savedOk ? <Check className="w-4 h-4" /> : <Send className="w-4 h-4" />}
              {saving ? "Posting…" : savedOk ? "Posted!" : "Publish Now"}
            </button>
          )}
        </div>
      </div>

      {saveErr && (
        <div className="mx-5 mt-2 flex items-center gap-2 text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm flex-shrink-0">
          <AlertCircle className="w-3.5 h-3.5 flex-shrink-0" />{saveErr}
        </div>
      )}

      <div className="flex flex-1 overflow-hidden">
        {/* Left: composer */}
        <div className="flex-1 flex flex-col overflow-hidden min-w-0">

          {/* Platform selector */}
          <div className="px-5 pt-4 pb-3 border-b border-stone-50 flex-shrink-0">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Post to platforms</p>
            <div className="flex gap-2 flex-wrap">
              {connectedPlatforms.length === 0 ? (
                <p className="text-xs text-stone-400">No platforms connected. Go to Connections tab to connect.</p>
              ) : (
                connectedPlatforms.map((p) => {
                  const selected = selectedPlatforms.includes(p.id);
                  return (
                    <button key={p.id} onClick={() => togglePlatform(p.id)}
                      className={`flex items-center gap-1.5 text-xs font-bold px-3 py-1.5 rounded-sm border transition-colors ${
                        selected ? "border-opacity-50 text-white" : "bg-white text-stone-500 border-stone-200 hover:border-stone-400"
                      }`}
                      style={selected ? { backgroundColor: p.color, borderColor: p.color } : {}}>
                      <span className="text-sm">{p.icon}</span>{p.label}
                      {selected && <Check className="w-3 h-3 ml-0.5" />}
                    </button>
                  );
                })
              )}
            </div>
          </div>

          {/* Platform tabs (when multiple selected) */}
          {selectedPlatforms.length > 1 && (
            <div className="flex gap-0.5 px-5 pt-3 flex-shrink-0">
              {selectedPlatforms.map((pid) => {
                const p = PLATFORMS.find((x) => x.id === pid)!;
                const hasContent = !!(contentMap[pid] ?? "").trim();
                return (
                  <button key={pid} onClick={() => setActivePlatformTab(pid)}
                    className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold border-b-2 transition-all ${
                      activePlatformTab === pid ? "border-amber-500 text-amber-700" : "border-transparent text-stone-400 hover:text-stone-700"
                    }`}>
                    <span>{p.icon}</span>{p.label}
                    {hasContent && <span className="w-1.5 h-1.5 rounded-full bg-emerald-400" />}
                  </button>
                );
              })}
            </div>
          )}

          {/* Content textarea */}
          <div className="flex-1 flex flex-col overflow-hidden p-5 space-y-3">
            <div className="flex-1 flex flex-col">
              <textarea
                value={activeContent}
                onChange={(e) => setContent(activePlatformTab, e.target.value)}
                placeholder={`Write your ${activePlatform?.label ?? "social media"} post…\n\nTip: Use AI to write in Isaac's voice, generate hooks, or adapt content for this platform.`}
                className="flex-1 w-full text-sm border border-stone-200 rounded-sm px-4 py-3 focus:outline-none focus:border-amber-400 resize-none bg-white leading-relaxed min-h-[200px]"
              />
              <div className="mt-2">
                <CharLimit used={charCount} max={activeCharLimit} />
              </div>
            </div>

            {/* AI Panel (inline) */}
            <AnimatePresence>
              {showAI && (
                <motion.div initial={{ opacity: 0, y: 6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: 6 }}
                  className="border border-amber-200 bg-amber-50/40 rounded-sm overflow-hidden">
                  <div className="flex items-center justify-between px-4 py-2.5 bg-amber-50 border-b border-amber-200/50">
                    <span className="flex items-center gap-2 text-xs font-black text-amber-700"><Sparkles className="w-3.5 h-3.5" />AI Writing Assistant</span>
                    <button onClick={() => setShowAI(false)} className="text-amber-400 hover:text-amber-700"><X className="w-4 h-4" /></button>
                  </div>
                  <div className="p-4 space-y-3">
                    {/* Mode pills */}
                    <div className="flex gap-1.5 flex-wrap">
                      {AI_MODES.map((m) => (
                        <button key={m.id} onClick={() => setAiMode(m.id)}
                          className={`flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-sm border transition-colors ${
                            aiMode === m.id ? "border-amber-300 bg-amber-50 text-amber-700" : "border-stone-200 bg-white text-stone-500 hover:border-stone-300"
                          }`}>
                          <m.icon className="w-3 h-3" style={{ color: aiMode === m.id ? m.color : undefined }} />
                          {m.label}
                        </button>
                      ))}
                    </div>
                    <input value={aiPrompt} onChange={(e) => setAiPrompt(e.target.value)}
                      onKeyDown={(e) => { if (e.key === "Enter" && (e.ctrlKey || e.metaKey)) runAI(); }}
                      placeholder="Topic, notes, or context for the AI…"
                      className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                    />
                    <button onClick={runAI} disabled={aiLoading || (!aiPrompt.trim() && !activeContent.trim())}
                      className="w-full flex items-center justify-center gap-2 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 py-2 rounded-sm transition-colors disabled:opacity-50">
                      {aiLoading ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Sparkles className="w-3.5 h-3.5" />}
                      {aiLoading ? "Generating…" : `Generate: ${AI_MODES.find((m) => m.id === aiMode)?.label}`}
                    </button>
                    {aiError && <p className="text-xs text-red-600 bg-red-50 border border-red-200 px-3 py-2 rounded-sm">{aiError}</p>}
                    {aiResult && (
                      <div className="border border-stone-200 rounded-sm overflow-hidden">
                        <div className="flex items-center justify-between px-3 py-2 bg-stone-50 border-b border-stone-100">
                          <span className="text-[10px] font-bold text-stone-500">{aiResult.length} chars</span>
                          <div className="flex gap-2">
                            <button onClick={() => navigator.clipboard.writeText(aiResult)}
                              className="text-[10px] text-stone-400 hover:text-stone-700 flex items-center gap-1 transition-colors">
                              <Copy className="w-3 h-3" />Copy
                            </button>
                            <button onClick={() => setAiResult("")} className="text-stone-300 hover:text-stone-600"><X className="w-3.5 h-3.5" /></button>
                          </div>
                        </div>
                        <div className="p-3 max-h-48 overflow-y-auto">
                          <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{aiResult}</pre>
                        </div>
                        <div className="flex gap-2 px-3 py-2 border-t border-stone-100 bg-stone-50/40">
                          <button onClick={() => applyAIResult()}
                            className="flex-1 text-[11px] font-bold text-amber-700 border border-amber-200 hover:bg-amber-50 py-1.5 rounded-sm transition-colors flex items-center justify-center gap-1">
                            <Check className="w-3 h-3" />Use for {activePlatform?.label}
                          </button>
                          {aiMode === "repurpose" && (
                            <button onClick={() => applyAIResult("all")}
                              className="text-[11px] font-bold text-purple-700 border border-purple-200 hover:bg-purple-50 px-3 py-1.5 rounded-sm transition-colors">
                              Apply all
                            </button>
                          )}
                        </div>
                      </div>
                    )}
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Media URLs */}
            <div>
              <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
                Media URLs <span className="text-stone-300 font-normal normal-case">(images, from Media Library)</span>
              </label>
              <div className="flex flex-wrap gap-1.5 mb-2">
                {mediaUrls.map((url, i) => (
                  <div key={i} className="flex items-center gap-1 text-[10px] bg-stone-100 text-stone-600 px-2 py-1 rounded-sm">
                    <Image className="w-3 h-3" />
                    <span className="max-w-[120px] truncate">{url}</span>
                    <button onClick={() => setMediaUrls((p) => p.filter((_, j) => j !== i))} className="hover:text-red-500"><X className="w-2.5 h-2.5" /></button>
                  </div>
                ))}
              </div>
              <div className="flex gap-2">
                <input value={mediaInput} onChange={(e) => setMediaInput(e.target.value)}
                  onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); if (mediaInput.trim()) { setMediaUrls((p) => [...p, mediaInput.trim()]); setMediaInput(""); } } }}
                  placeholder="Paste image URL and press Enter…"
                  className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                />
                <button onClick={() => { if (mediaInput.trim()) { setMediaUrls((p) => [...p, mediaInput.trim()]); setMediaInput(""); } }}
                  className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">
                  Add
                </button>
              </div>
            </div>

            {/* Schedule */}
            <div className="flex items-center gap-3">
              <div className="flex-1">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Schedule</label>
                <input type="datetime-local" value={scheduledAt} onChange={(e) => setScheduledAt(e.target.value)}
                  className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
              {scheduledAt && (
                <button onClick={() => setScheduledAt("")}
                  className="mt-5 text-xs text-stone-400 hover:text-stone-700 transition-colors flex-shrink-0">
                  Clear
                </button>
              )}
            </div>
          </div>
        </div>

        {/* Right: preview panel */}
        <AnimatePresence>
          {showPreview && (
            <motion.div initial={{ width: 0, opacity: 0 }} animate={{ width: 320, opacity: 1 }}
              exit={{ width: 0, opacity: 0 }} transition={{ duration: 0.2 }}
              className="flex-shrink-0 border-l border-stone-100 bg-white overflow-hidden">
              <div className="w-[320px] h-full flex flex-col overflow-hidden">
                <div className="px-4 py-3 border-b border-stone-100 flex-shrink-0">
                  <p className="text-xs font-black text-stone-600">Post Preview</p>
                </div>
                <div className="flex-1 overflow-y-auto p-4 space-y-4">
                  {selectedPlatforms
                    .filter((pid) => (contentMap[pid] ?? "").trim())
                    .map((pid) => {
                      const platform = PLATFORMS.find((p) => p.id === pid)!;
                      const conn = connections.find((c) => c.platform === pid);
                      return (
                        <PlatformPreview
                          key={pid}
                          platform={platform}
                          content={contentMap[pid] ?? ""}
                          handle={conn?.handle ?? "isaacpaha"}
                        />
                      );
                    })}
                  {selectedPlatforms.every((pid) => !(contentMap[pid] ?? "").trim()) && (
                    <div className="flex flex-col items-center justify-center py-12 text-center">
                      <Eye className="w-8 h-8 text-stone-200 mb-2" />
                      <p className="text-xs text-stone-400">Write content to see preview</p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
}
"use client";

// app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-video-generation.tsx

import { useState } from "react";
import {
  Wand2, Plus, Minus, Loader2, ChevronDown, ChevronUp,
  Copy, RefreshCw, Star, Trash2, Check,
  Twitter, Linkedin, Facebook, Smartphone,
} from "lucide-react";
// import { useWeeklyGenerator, useYoutubeProfile } from "./use-youtube";
import { useSaveVideo, useWeeklyGenerator, useYoutubeProfile } from "@/hooks/youtube-studio/use-youtube";

const TONES = [
  "calm","reflective","direct","energetic",
  "storytelling","philosophical","motivational","conversational",
];
const THEMES = [
  "Life Understanding","Self-Belief","Confidence","Values",
  "Mindset","Relationships","Career","Money","Purpose",
];

type VideoTab = "script" | "delivery" | "filming" | "upload" | "social";

const VIDEO_TABS: { id: VideoTab; label: string }[] = [
  { id: "script",   label: "Script"         },
  { id: "delivery", label: "Delivery"       },
  { id: "filming",  label: "Filming"        },
  { id: "upload",   label: "Upload package" },
  { id: "social",   label: "Social posts"   },
];

interface GeneratedVideo {
  id?: string;
  title: string;
  seoTitle: string;
  hook: string;
  intro: string;
  body: string;
  perspectiveShift: string;
  closingLine: string;
  deliveryNotes?: string;
  toneNotes?: string;
  pausePoints?: string[];
  emphasisPoints?: string[];
  facialCues?: string;
  energyArc?: string;
  cameraPosition?: string;
  lightingSuggestion?: string;
  bodyLanguageTips?: string;
  setDressing?: string;
  description?: string;
  tags?: string[];
  thumbnailTextIdeas?: string[];
  thumbnailIdeas?: string[];
  category?: string;
  twitterPost?: string;
  linkedinPost?: string;
  facebookPost?: string;
  tiktokCaption?: string;
  shortsCaption?: string;
}

export default function YoutubeWeeklyGenerator({ userId }: { userId: string }) {
  const { profile }                          = useYoutubeProfile(userId);
  const { generate, loading, result, reset } = useWeeklyGenerator(userId);

  // Config
  const [videosPerWeek,   setVideosPerWeek]   = useState(3);
  const [selectedTone,    setSelectedTone]    = useState(profile?.defaultTone ?? "calm");
  const [selectedThemes,  setSelectedThemes]  = useState<string[]>(profile?.coreThemes ?? []);
  const [personalContext, setPersonalContext] = useState(profile?.creatorBio ?? "");
  const [targetAudience,  setTargetAudience]  = useState(profile?.targetAudience ?? "");

  // UI state
  const [expandedIdx, setExpandedIdx]           = useState<number | null>(null);
  const [activeTab,   setActiveTab]             = useState<Record<number, VideoTab>>({});
  const [copiedKey,   setCopiedKey]             = useState<string | null>(null);

  const videos: GeneratedVideo[] = (result?.videos ?? []) as GeneratedVideo[];

  const [savingVideoIdx, setSavingVideoIdx] = useState<number | null>(null);
  const [saveSuccess, setSaveSuccess] = useState<Record<number, boolean>>({});
  const { saveVideo, saving, savedVideoId } = useSaveVideo(userId);

  const toggleTheme = (t: string) =>
    setSelectedThemes(prev =>
      prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
    );

  const handleGenerate = async () => {
      reset();
      setExpandedIdx(null);
      await generate({
        userId,
        videosPerWeek,
        tone:           selectedTone as any,
        themes:         selectedThemes,
        personalContext,
        targetAudience,
      });
      setExpandedIdx(0);
    };

    const handleSaveToLibrary = async (video: GeneratedVideo, idx: number) => {
    setSavingVideoIdx(idx);
    
    const saveResult = await saveVideo({
      title: video.title,
      seoTitle: video.seoTitle,
      hook: video.hook,
      intro: video.intro,
      body: video.body,
      perspectiveShift: video.perspectiveShift,
      closingLine: video.closingLine,
      deliveryNotes: video.deliveryNotes,
      toneNotes: video.toneNotes,
      pausePoints: video.pausePoints,
      emphasisPoints: video.emphasisPoints,
      facialCues: video.facialCues,
      energyArc: video.energyArc,
      cameraPosition: video.cameraPosition,
      lightingSuggestion: video.lightingSuggestion,
      bodyLanguageTips: video.bodyLanguageTips,
      setDressing: video.setDressing,
      description: video.description,
      tags: video.tags,
      thumbnailTextIdeas: video.thumbnailTextIdeas || video.thumbnailIdeas,
      category: video.category,
      twitterPost: video.twitterPost,
      linkedinPost: video.linkedinPost,
      facebookPost: video.facebookPost,
      tiktokCaption: video.tiktokCaption,
      shortsCaption: video.shortsCaption,
    });

    if (saveResult.success) {
      setSaveSuccess(prev => ({ ...prev, [idx]: true }));
      setTimeout(() => {
        setSaveSuccess(prev => ({ ...prev, [idx]: false }));
      }, 3000);
    }
    
    setSavingVideoIdx(null);
  };

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const getTab  = (i: number): VideoTab  => activeTab[i] ?? "script";
  const setTab  = (i: number, t: VideoTab) =>
    setActiveTab(prev => ({ ...prev, [i]: t }));

  return (
    <div className="max-w-3xl mx-auto space-y-4">

      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-sm font-semibold text-white">Weekly Generator</h1>
          <p className="text-xs text-zinc-500 mt-0.5">
            Configure and generate a full week of video content
          </p>
        </div>
        {videos.length > 0 && (
          <button
            onClick={reset}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-xs text-zinc-500 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
          >
            <RefreshCw className="w-3 h-3" />
            Start over
          </button>
        )}
      </div>

      {/* Config panel */}
      <div className="rounded border border-zinc-800 bg-zinc-900 p-4 space-y-4">

        {/* Videos per week */}
        <div>
          <label className={LABEL}>Videos this week</label>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setVideosPerWeek(v => Math.max(1, v - 1))}
              className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <Minus className="w-3 h-3" />
            </button>
            <span className="text-sm font-semibold text-white w-4 text-center tabular-nums">
              {videosPerWeek}
            </span>
            <button
              onClick={() => setVideosPerWeek(v => Math.min(7, v + 1))}
              className="w-7 h-7 rounded bg-zinc-800 flex items-center justify-center text-zinc-400 hover:text-zinc-200 hover:bg-zinc-700 transition-colors"
            >
              <Plus className="w-3 h-3" />
            </button>
            <span className="text-xs text-zinc-600">
              video{videosPerWeek !== 1 ? "s" : ""} will be generated
            </span>
          </div>
        </div>

        {/* Tone */}
        <div>
          <label className={LABEL}>Tone</label>
          <div className="flex flex-wrap gap-1.5">
            {TONES.map(tone => (
              <button
                key={tone}
                onClick={() => setSelectedTone(tone as typeof selectedTone)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors
                  ${selectedTone === tone
                    ? "bg-zinc-200 text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
              >
                {tone}
              </button>
            ))}
          </div>
        </div>

        {/* Themes */}
        <div>
          <label className={LABEL}>Themes</label>
          <div className="flex flex-wrap gap-1.5">
            {THEMES.map(theme => (
              <button
                key={theme}
                onClick={() => toggleTheme(theme)}
                className={`px-2.5 py-1 rounded text-[11px] font-medium transition-colors
                  ${selectedThemes.includes(theme)
                    ? "bg-zinc-200 text-zinc-900"
                    : "bg-zinc-800 text-zinc-400 hover:bg-zinc-700 hover:text-zinc-200"}`}
              >
                {theme}
              </button>
            ))}
          </div>
        </div>

        {/* Context inputs */}
        <div className="grid md:grid-cols-2 gap-3">
          <div>
            <label className={LABEL}>
              Personal context
              <span className="normal-case font-normal text-zinc-600 ml-1">(optional)</span>
            </label>
            <textarea
              value={personalContext}
              onChange={e => setPersonalContext(e.target.value)}
              placeholder="e.g. I grew up in Ghana, moved to the UK at 22…"
              rows={2}
              className={`${INPUT} resize-none`}
            />
          </div>
          <div>
            <label className={LABEL}>Target audience</label>
            <input
              value={targetAudience}
              onChange={e => setTargetAudience(e.target.value)}
              placeholder="e.g. young adults, graduates, 18–35"
              className={INPUT}
            />
          </div>
        </div>

        {/* Generate button */}
        <button
          onClick={handleGenerate}
          disabled={loading || selectedThemes.length === 0}
          className="w-full py-2.5 rounded text-xs font-medium bg-white text-zinc-900 hover:bg-zinc-100 transition-colors disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
        >
          {loading ? (
            <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating {videosPerWeek} video{videosPerWeek !== 1 ? "s" : ""}…</>
          ) : (
            <><Wand2 className="w-3.5 h-3.5" /> Generate {videosPerWeek} video{videosPerWeek !== 1 ? "s" : ""}</>
          )}
        </button>

        {selectedThemes.length === 0 && !loading && (
          <p className="text-[11px] text-zinc-600 text-center -mt-2">
            Select at least one theme to generate
          </p>
        )}
      </div>

      {/* Generated videos */}
      {videos.map((video, idx) => (
        <div key={idx} className="rounded border border-zinc-800 bg-zinc-900 overflow-hidden">

          {/* Video header row */}
          <button
            onClick={() => setExpandedIdx(expandedIdx === idx ? null : idx)}
            className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-zinc-800/30 transition-colors"
          >
            <span className="text-[11px] font-semibold text-zinc-500 tabular-nums w-4 shrink-0">
              {idx + 1}
            </span>
            <div className="flex-1 min-w-0">
              <p className="text-xs font-medium text-zinc-200 truncate">{video.title}</p>
              <p className="text-[11px] text-zinc-600 mt-0.5 truncate">{video.seoTitle}</p>
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <span className="text-[10px] font-medium px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                Ready
              </span>
              {expandedIdx === idx
                ? <ChevronUp className="w-3.5 h-3.5 text-zinc-600" />
                : <ChevronDown className="w-3.5 h-3.5 text-zinc-600" />}
            </div>
          </button>

          {/* Expanded content */}
          {expandedIdx === idx && (
            <div className="border-t border-zinc-800">

              {/* Sub-tabs */}
              <div className="flex border-b border-zinc-800 overflow-x-auto">
                {VIDEO_TABS.map(tab => (
                  <button
                    key={tab.id}
                    onClick={() => setTab(idx, tab.id)}
                    className={`px-4 py-2.5 text-[11px] font-medium whitespace-nowrap border-b-2 transition-colors shrink-0
                      ${getTab(idx) === tab.id
                        ? "border-zinc-300 text-zinc-200"
                        : "border-transparent text-zinc-600 hover:text-zinc-400"}`}
                  >
                    {tab.label}
                  </button>
                ))}
              </div>

              <div className="p-4 space-y-3">

                {/* ── Script tab ── */}
                {getTab(idx) === "script" && (
                  <>
                    {[
                      { label: "Hook",               content: video.hook              },
                      { label: "Intro",              content: video.intro             },
                      { label: "Body",               content: video.body              },
                      { label: "Perspective shift",  content: video.perspectiveShift  },
                      { label: "Closing line",       content: video.closingLine       },
                    ].filter(s => s.content).map(section => (
                      <ScriptBlock
                        key={section.label}
                        label={section.label}
                        content={section.content!}
                        copyKey={`${idx}-${section.label}`}
                        copiedKey={copiedKey}
                        onCopy={copyText}
                      />
                    ))}
                  </>
                )}

                {/* ── Delivery tab ── */}
                {getTab(idx) === "delivery" && (
                  <>
                    {video.toneNotes && <ScriptBlock label="Delivery notes" content={video.toneNotes} copyKey={`${idx}-tone`} copiedKey={copiedKey} onCopy={copyText} />}
                    {video.deliveryNotes && <ScriptBlock label="Delivery notes" content={video.deliveryNotes} copyKey={`${idx}-delivery`} copiedKey={copiedKey} onCopy={copyText} />}
                    {video.facialCues && <ScriptBlock label="Facial cues" content={video.facialCues} copyKey={`${idx}-facial`} copiedKey={copiedKey} onCopy={copyText} />}
                    {video.energyArc && <ScriptBlock label="Energy arc" content={video.energyArc} copyKey={`${idx}-energy`} copiedKey={copiedKey} onCopy={copyText} />}
                    {(video.pausePoints ?? []).length > 0 && (
                      <ListBlock label="Pause points" items={video.pausePoints!} />
                    )}
                    {(video.emphasisPoints ?? []).length > 0 && (
                      <ListBlock label="Emphasis points" items={video.emphasisPoints!} />
                    )}
                  </>
                )}

                {/* ── Filming tab ── */}
                {getTab(idx) === "filming" && (
                  <>
                    {video.cameraPosition    && <ScriptBlock label="Camera position"   content={video.cameraPosition}   copyKey={`${idx}-cam`}   copiedKey={copiedKey} onCopy={copyText} />}
                    {video.lightingSuggestion && <ScriptBlock label="Lighting"         content={video.lightingSuggestion} copyKey={`${idx}-light`} copiedKey={copiedKey} onCopy={copyText} />}
                    {video.bodyLanguageTips   && <ScriptBlock label="Body language"    content={video.bodyLanguageTips}   copyKey={`${idx}-body`}  copiedKey={copiedKey} onCopy={copyText} />}
                    {video.setDressing        && <ScriptBlock label="Set dressing"     content={video.setDressing}        copyKey={`${idx}-set`}   copiedKey={copiedKey} onCopy={copyText} />}
                  </>
                )}

                {/* ── Upload package tab ── */}
                {getTab(idx) === "upload" && (
                  <>
                    <ScriptBlock label="SEO title" content={video.seoTitle} copyKey={`${idx}-seo`} copiedKey={copiedKey} onCopy={copyText} />
                    {video.description && <ScriptBlock label="Description" content={video.description} copyKey={`${idx}-desc`} copiedKey={copiedKey} onCopy={copyText} />}
                    {(video.tags ?? []).length > 0 && (
                      <div className="rounded border border-zinc-800 p-3">
                        <p className={SECTION_LABEL}>Tags</p>
                        <div className="flex flex-wrap gap-1.5 mt-1.5">
                          {(video.tags ?? []).map(tag => (
                            <span key={tag} className="text-[11px] px-2 py-0.5 rounded bg-zinc-800 text-zinc-400">
                              {tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    )}
                    {(video.thumbnailTextIdeas ?? video.thumbnailIdeas ?? []).length > 0 && (
                      <div className="rounded border border-zinc-800 p-3">
                        <p className={SECTION_LABEL}>Thumbnail ideas</p>
                        <ol className="mt-1.5 space-y-1">
                          {(video.thumbnailTextIdeas ?? video.thumbnailIdeas ?? []).map((idea, i) => (
                            <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
                              <span className="text-[11px] text-zinc-700 font-medium shrink-0 tabular-nums">{i + 1}.</span>
                              {idea}
                            </li>
                          ))}
                        </ol>
                      </div>
                    )}
                  </>
                )}

                {/* ── Social posts tab ── */}
                {getTab(idx) === "social" && (
                  <>
                    {([
                      { label: "X / Twitter",    key: "twitter",  content: video.twitterPost,   icon: Twitter    },
                      { label: "LinkedIn",        key: "linkedin", content: video.linkedinPost,  icon: Linkedin   },
                      { label: "Facebook",        key: "facebook", content: video.facebookPost,  icon: Facebook   },
                      { label: "TikTok / Shorts", key: "tiktok",  content: video.tiktokCaption, icon: Smartphone },
                    ] as const).filter(p => p.content).map(platform => {
                      const Icon = platform.icon;
                      return (
                        <div key={platform.key} className="rounded border border-zinc-800 p-3">
                          <div className="flex items-center justify-between mb-2">
                            <div className="flex items-center gap-1.5">
                              <Icon className="w-3 h-3 text-zinc-500" />
                              <p className={SECTION_LABEL}>{platform.label}</p>
                            </div>
                            <CopyButton
                              content={platform.content!}
                              copyKey={`${idx}-${platform.key}`}
                              copiedKey={copiedKey}
                              onCopy={copyText}
                            />
                          </div>
                          <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">
                            {platform.content}
                          </p>
                        </div>
                      );
                    })}
                  </>
                )}

                {/* Row actions */}
                <div className="flex items-center gap-2 pt-1 border-t border-zinc-800">
                  <button 
                    onClick={() => handleSaveToLibrary(video, idx)}
                    disabled={savingVideoIdx === idx}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] transition-colors
                      bg-zinc-800 hover:bg-zinc-700 text-zinc-300
                      disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    {savingVideoIdx === idx ? (
                      <><Loader2 className="w-3 h-3 animate-spin" /> Saving...</>
                    ) : saveSuccess[idx] ? (
                      <><Check className="w-3 h-3 text-emerald-400" /> Saved to library</>
                    ) : (
                      <><Star className="w-3 h-3" /> Save to library</>
                    )}
                  </button>
                  
                  <button
                    onClick={() => copyText(
                      [video.hook, video.intro, video.body, video.perspectiveShift, video.closingLine]
                        .filter(Boolean).join("\n\n"),
                      `${idx}-fullscript`
                    )}
                    className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded text-[11px] text-zinc-500 bg-zinc-800 hover:bg-zinc-700 hover:text-zinc-300 transition-colors"
                  >
                    {copiedKey === `${idx}-fullscript`
                      ? <><Check className="w-3 h-3" /> Copied</>
                      : <><Copy className="w-3 h-3" /> Copy full script</>
                    }
                  </button>
                </div>
              </div>
            </div>
          )}
        </div>
      ))}
    </div>
  );
}

// ─── Sub-components ───────────────────────────────────────────────────────────

function ScriptBlock({
  label, content, copyKey, copiedKey, onCopy,
}: {
  label: string;
  content: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  return (
    <div className="rounded border border-zinc-800 p-3">
      <div className="flex items-center justify-between mb-2">
        <p className={SECTION_LABEL}>{label}</p>
        <CopyButton content={content} copyKey={copyKey} copiedKey={copiedKey} onCopy={onCopy} />
      </div>
      <p className="text-xs text-zinc-400 leading-relaxed whitespace-pre-line">{content}</p>
    </div>
  );
}

function ListBlock({ label, items }: { label: string; items: string[] }) {
  return (
    <div className="rounded border border-zinc-800 p-3">
      <p className={`${SECTION_LABEL} mb-2`}>{label}</p>
      <ul className="space-y-1">
        {items.map((item, i) => (
          <li key={i} className="text-xs text-zinc-400 flex items-start gap-2">
            <span className="w-1 h-1 rounded-full bg-zinc-700 mt-1.5 shrink-0" />
            {item}
          </li>
        ))}
      </ul>
    </div>
  );
}

function CopyButton({
  content, copyKey, copiedKey, onCopy,
}: {
  content: string;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
}) {
  const copied = copiedKey === copyKey;
  return (
    <button
      onClick={() => onCopy(content, copyKey)}
      className="text-zinc-700 hover:text-zinc-400 transition-colors"
      title="Copy"
    >
      {copied ? <Check className="w-3 h-3 text-emerald-400" /> : <Copy className="w-3 h-3" />}
    </button>
  );
}

// ─── Shared constants ─────────────────────────────────────────────────────────

const INPUT        = "w-full bg-zinc-800 border border-zinc-700 rounded px-3 py-2 text-xs text-zinc-200 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors";
const LABEL        = "text-[10px] font-medium text-zinc-500 uppercase tracking-wider block mb-1.5";
const SECTION_LABEL = "text-[10px] font-medium text-zinc-500 uppercase tracking-wider";






// "use client";

// import { useState } from "react";
// import {
//   Wand2, Plus, Minus, ChevronDown, ChevronUp, Loader2,
//   CheckCircle2, Copy, Download, RefreshCw, Eye, Edit3,
//   Twitter, Linkedin, Facebook, Smartphone, Star
// } from "lucide-react";

// const TONES = ["calm","reflective","direct","energetic","storytelling","philosophical","motivational","conversational"];
// const THEMES = ["Life Understanding","Self-Belief","Confidence","Values","Mindset","Relationships","Career","Money","Purpose"];

// interface GeneratedVideo {
//   title: string;
//   seoTitle: string;
//   hook: string;
//   intro: string;
//   body: string;
//   perspectiveShift: string;
//   closingLine: string;
//   deliveryNotes: string;
//   pausePoints: string[];
//   emphasisPoints: string[];
//   facialCues: string;
//   cameraPosition: string;
//   lightingSuggestion: string;
//   bodyLanguageTips: string;
//   description: string;
//   tags: string[];
//   thumbnailIdeas: string[];
//   twitterPost: string;
//   linkedinPost: string;
//   facebookPost: string;
//   tiktokCaption: string;
// }

// export default function YoutubeWeeklyGenerator({ userId }: { userId: string }) {
//   const [videosPerWeek, setVideosPerWeek] = useState(3);
//   const [selectedTone, setSelectedTone]   = useState("calm");
//   const [selectedThemes, setSelectedThemes] = useState<string[]>(["Self-Belief","Confidence"]);
//   const [personalContext, setPersonalContext] = useState("");
//   const [targetAudience, setTargetAudience]   = useState("young adults, graduates");
//   const [isGenerating, setIsGenerating]       = useState(false);
//   const [generatedVideos, setGeneratedVideos] = useState<GeneratedVideo[]>([]);
//   const [expandedVideo, setExpandedVideo]     = useState<number | null>(null);
//   const [activeVideoTab, setActiveVideoTab]   = useState<Record<number, string>>({});
//   const [error, setError] = useState<string | null>(null);

//   const toggleTheme = (theme: string) => {
//     setSelectedThemes(prev =>
//       prev.includes(theme) ? prev.filter(t => t !== theme) : [...prev, theme]
//     );
//   };

//   const handleGenerate = async () => {
//     setIsGenerating(true);
//     setError(null);
//     setGeneratedVideos([]);
//     setExpandedVideo(null);

//     const prompt = `You are an elite YouTube content strategist and scriptwriter for a deep-thinking, talking-head YouTube channel.

// Creator Profile:
// - Channel tone: ${selectedTone}
// - Core themes: ${selectedThemes.join(", ")}
// - Target audience: ${targetAudience}
// - Personal context: ${personalContext || "A thoughtful creator focused on life philosophy and self-development"}

// Generate ${videosPerWeek} complete YouTube video packages. Return ONLY a valid JSON array (no markdown, no extra text).

// Each object must have these exact keys:
// {
//   "title": "compelling working title",
//   "seoTitle": "click-optimised YouTube title (under 60 chars)",
//   "hook": "opening 30 seconds - attention-grabbing hook (word for word)",
//   "intro": "intro paragraph (30-45 seconds)",
//   "body": "full body script with clear structure (3-5 minutes)",
//   "perspectiveShift": "the reframe or unexpected insight (30-45 seconds)",
//   "closingLine": "powerful final line that lingers",
//   "deliveryNotes": "tone, pacing, energy arc instructions",
//   "pausePoints": ["list of moments to pause for effect"],
//   "emphasisPoints": ["words/phrases to deliver with weight"],
//   "facialCues": "facial expression guidance throughout",
//   "cameraPosition": "camera setup recommendation",
//   "lightingSuggestion": "lighting setup for this video's mood",
//   "bodyLanguageTips": "body language guidance",
//   "description": "full YouTube description with timestamps, SEO hooks, and CTA",
//   "tags": ["10-15 relevant tags"],
//   "thumbnailIdeas": ["3 thumbnail text concepts"],
//   "twitterPost": "Twitter/X post to promote the video",
//   "linkedinPost": "LinkedIn post version",
//   "facebookPost": "Facebook post version",
//   "tiktokCaption": "TikTok/Shorts caption"
// }

// Important:
// - Make each video idea distinct and non-repetitive
// - Scripts should be original, thought-provoking, not generic
// - Build a narrative thread across the ${videosPerWeek} videos
// - Write as if the creator is speaking naturally, not reading
// - Hooks must be grabbing in the first 3 seconds`;

//     try {
//       const response = await fetch("https://api.anthropic.com/v1/messages", {
//         method: "POST",
//         headers: { "Content-Type": "application/json" },
//         body: JSON.stringify({
//           model: "claude-sonnet-4-20250514",
//           max_tokens: 8000,
//           messages: [{ role: "user", content: prompt }],
//         }),
//       });

//       const data = await response.json();
//       const text = data.content?.map((b: { type: string; text?: string }) => b.type === "text" ? b.text : "").join("") || "";

//       const cleaned = text.replace(/```json\n?/g, "").replace(/```\n?/g, "").trim();
//       const parsed: GeneratedVideo[] = JSON.parse(cleaned);
//       setGeneratedVideos(parsed);
//       setExpandedVideo(0);
//     } catch (err) {
//       setError("Generation failed. Please try again.");
//       console.error(err);
//     } finally {
//       setIsGenerating(false);
//     }
//   };

//   const getVideoTab = (idx: number) => activeVideoTab[idx] || "script";
//   const setVideoTab  = (idx: number, tab: string) => setActiveVideoTab(prev => ({ ...prev, [idx]: tab }));

//   const copyText = (text: string) => navigator.clipboard.writeText(text);

//   return (
//     <div className="max-w-4xl mx-auto space-y-6">

//       {/* Config Panel */}
//       <div className="rounded-2xl bg-white/3 border border-white/5 overflow-hidden">
//         <div className="px-6 py-4 border-b border-white/5 bg-gradient-to-r from-red-500/10 to-transparent">
//           <div className="flex items-center gap-2">
//             <Wand2 className="w-4 h-4 text-red-400" />
//             <h2 className="text-sm font-bold text-white">Weekly Content Generator</h2>
//             <span className="ml-auto text-xs text-white/30">AI-powered · Claude Sonnet</span>
//           </div>
//         </div>

//         <div className="p-6 space-y-6">
//           {/* Videos Per Week */}
//           <div>
//             <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-3">Videos This Week</label>
//             <div className="flex items-center gap-3">
//               <button onClick={() => setVideosPerWeek(v => Math.max(1, v - 1))} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
//                 <Minus className="w-3.5 h-3.5" />
//               </button>
//               <span className="text-2xl font-bold text-white w-8 text-center">{videosPerWeek}</span>
//               <button onClick={() => setVideosPerWeek(v => Math.min(7, v + 1))} className="w-8 h-8 rounded-lg bg-white/5 flex items-center justify-center text-white/60 hover:text-white hover:bg-white/10 transition-all">
//                 <Plus className="w-3.5 h-3.5" />
//               </button>
//               <span className="text-xs text-white/30 ml-2">videos will be generated</span>
//             </div>
//           </div>

//           {/* Tone */}
//           <div>
//             <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-3">Channel Tone</label>
//             <div className="flex flex-wrap gap-2">
//               {TONES.map(tone => (
//                 <button
//                   key={tone}
//                   onClick={() => setSelectedTone(tone)}
//                   className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
//                     ${selectedTone === tone
//                       ? "bg-gradient-to-r from-red-500 to-orange-500 text-white"
//                       : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}
//                 >
//                   {tone}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Themes */}
//           <div>
//             <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-3">Core Themes <span className="normal-case text-white/25">(select all that apply)</span></label>
//             <div className="flex flex-wrap gap-2">
//               {THEMES.map(theme => (
//                 <button
//                   key={theme}
//                   onClick={() => toggleTheme(theme)}
//                   className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
//                     ${selectedThemes.includes(theme)
//                       ? "bg-blue-500/20 text-blue-300 border border-blue-500/30"
//                       : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10 border border-transparent"}`}
//                 >
//                   {theme}
//                 </button>
//               ))}
//             </div>
//           </div>

//           {/* Context inputs */}
//           <div className="grid md:grid-cols-2 gap-4">
//             <div>
//               <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">Personal Context <span className="normal-case text-white/25">(optional)</span></label>
//               <textarea
//                 value={personalContext}
//                 onChange={e => setPersonalContext(e.target.value)}
//                 placeholder="e.g. I grew up in Ghana, struggled with self-doubt for years, now I help others..."
//                 rows={3}
//                 className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20 resize-none"
//               />
//             </div>
//             <div>
//               <label className="text-xs font-semibold text-white/60 uppercase tracking-wider block mb-2">Target Audience</label>
//               <input
//                 value={targetAudience}
//                 onChange={e => setTargetAudience(e.target.value)}
//                 placeholder="e.g. young adults, graduates, 18-35"
//                 className="w-full bg-white/5 border border-white/5 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-white/20"
//               />
//             </div>
//           </div>

//           {/* Generate Button */}
//           <button
//             onClick={handleGenerate}
//             disabled={isGenerating || selectedThemes.length === 0}
//             className="w-full py-3.5 rounded-xl bg-gradient-to-r from-red-500 to-orange-500 text-white font-bold text-sm flex items-center justify-center gap-2 hover:opacity-90 transition-opacity disabled:opacity-50 disabled:cursor-not-allowed"
//           >
//             {isGenerating ? (
//               <>
//                 <Loader2 className="w-4 h-4 animate-spin" />
//                 Generating {videosPerWeek} videos...
//               </>
//             ) : (
//               <>
//                 <Wand2 className="w-4 h-4" />
//                 Generate {videosPerWeek} Videos for This Week
//               </>
//             )}
//           </button>

//           {error && <p className="text-red-400 text-sm text-center">{error}</p>}
//         </div>
//       </div>

//       {/* Generated Videos */}
//       {generatedVideos.map((video, idx) => (
//         <div key={idx} className="rounded-2xl bg-white/3 border border-white/5 overflow-hidden">
//           {/* Video Header */}
//           <button
//             onClick={() => setExpandedVideo(expandedVideo === idx ? null : idx)}
//             className="w-full flex items-center gap-3 px-6 py-4 text-left hover:bg-white/2 transition-colors"
//           >
//             <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center text-xs font-bold text-white shrink-0">
//               {idx + 1}
//             </div>
//             <div className="flex-1 min-w-0">
//               <p className="text-sm font-bold text-white">{video.title}</p>
//               <p className="text-xs text-white/40 mt-0.5 truncate">{video.seoTitle}</p>
//             </div>
//             <div className="flex items-center gap-2">
//               <CheckCircle2 className="w-4 h-4 text-green-400" />
//               {expandedVideo === idx ? <ChevronUp className="w-4 h-4 text-white/30" /> : <ChevronDown className="w-4 h-4 text-white/30" />}
//             </div>
//           </button>

//           {expandedVideo === idx && (
//             <div className="border-t border-white/5">
//               {/* Tab Bar */}
//               <div className="flex overflow-x-auto border-b border-white/5 px-4">
//                 {[
//                   { id: "script",   label: "📝 Script",    },
//                   { id: "delivery", label: "🎤 Delivery",  },
//                   { id: "filming",  label: "🎥 Filming",   },
//                   { id: "upload",   label: "🚀 Upload Package" },
//                   { id: "social",   label: "📣 Social Posts" },
//                 ].map(tab => (
//                   <button
//                     key={tab.id}
//                     onClick={() => setVideoTab(idx, tab.id)}
//                     className={`px-4 py-3 text-xs font-medium whitespace-nowrap border-b-2 transition-all
//                       ${getVideoTab(idx) === tab.id
//                         ? "border-red-400 text-white"
//                         : "border-transparent text-white/30 hover:text-white/60"}`}
//                   >
//                     {tab.label}
//                   </button>
//                 ))}
//               </div>

//               <div className="p-6">
//                 {/* Script Tab */}
//                 {getVideoTab(idx) === "script" && (
//                   <div className="space-y-4">
//                     {[
//                       { label: "🎯 Hook", content: video.hook, color: "border-red-500/20 bg-red-500/5" },
//                       { label: "📖 Intro", content: video.intro, color: "border-blue-500/20 bg-blue-500/5" },
//                       { label: "💬 Body", content: video.body, color: "border-white/5 bg-white/3" },
//                       { label: "💡 Perspective Shift", content: video.perspectiveShift, color: "border-purple-500/20 bg-purple-500/5" },
//                       { label: "✨ Closing Line", content: video.closingLine, color: "border-orange-500/20 bg-orange-500/5" },
//                     ].map(section => (
//                       <div key={section.label} className={`rounded-xl border p-4 ${section.color}`}>
//                         <div className="flex items-center justify-between mb-2">
//                           <span className="text-xs font-bold text-white/60">{section.label}</span>
//                           <button onClick={() => copyText(section.content)} className="text-white/20 hover:text-white/60 transition-colors">
//                             <Copy className="w-3.5 h-3.5" />
//                           </button>
//                         </div>
//                         <p className="text-sm text-white/80 leading-relaxed whitespace-pre-line">{section.content}</p>
//                       </div>
//                     ))}
//                   </div>
//                 )}

//                 {/* Delivery Tab */}
//                 {getVideoTab(idx) === "delivery" && (
//                   <div className="space-y-4">
//                     <ScriptBlock label="🎙️ Delivery Notes"      content={video.deliveryNotes} />
//                     <ScriptBlock label="😐 Facial Cues"         content={video.facialCues} />
//                     <div className="grid md:grid-cols-2 gap-4">
//                       <ListBlock label="⏸ Pause Points"   items={video.pausePoints} />
//                       <ListBlock label="💥 Emphasis Points" items={video.emphasisPoints} />
//                     </div>
//                   </div>
//                 )}

//                 {/* Filming Tab */}
//                 {getVideoTab(idx) === "filming" && (
//                   <div className="space-y-4">
//                     <ScriptBlock label="📷 Camera Position"     content={video.cameraPosition} />
//                     <ScriptBlock label="💡 Lighting Suggestion"  content={video.lightingSuggestion} />
//                     <ScriptBlock label="🧍 Body Language Tips"   content={video.bodyLanguageTips} />
//                   </div>
//                 )}

//                 {/* Upload Package Tab */}
//                 {getVideoTab(idx) === "upload" && (
//                   <div className="space-y-4">
//                     <div className="rounded-xl bg-white/3 border border-white/5 p-4">
//                       <div className="flex items-center justify-between mb-2">
//                         <span className="text-xs font-bold text-white/60">🎯 SEO Title</span>
//                         <button onClick={() => copyText(video.seoTitle)} className="text-white/20 hover:text-white/60 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
//                       </div>
//                       <p className="text-sm text-white font-medium">{video.seoTitle}</p>
//                       <p className="text-xs text-white/30 mt-1">{video.seoTitle.length}/60 chars</p>
//                     </div>
//                     <ScriptBlock label="📝 Description" content={video.description} />
//                     <div className="rounded-xl bg-white/3 border border-white/5 p-4">
//                       <p className="text-xs font-bold text-white/60 mb-3">🏷️ Tags</p>
//                       <div className="flex flex-wrap gap-1.5">
//                         {video.tags.map(tag => (
//                           <span key={tag} className="text-xs px-2 py-1 bg-white/5 rounded text-white/50">{tag}</span>
//                         ))}
//                       </div>
//                     </div>
//                     <div className="rounded-xl bg-white/3 border border-white/5 p-4">
//                       <p className="text-xs font-bold text-white/60 mb-3">📌 Thumbnail Text Ideas</p>
//                       <div className="space-y-2">
//                         {video.thumbnailIdeas.map((idea, i) => (
//                           <div key={i} className="flex items-center gap-2">
//                             <span className="w-5 h-5 rounded bg-red-500/20 text-red-400 text-[10px] font-bold flex items-center justify-center shrink-0">{i+1}</span>
//                             <p className="text-sm text-white/70">{idea}</p>
//                           </div>
//                         ))}
//                       </div>
//                     </div>
//                   </div>
//                 )}

//                 {/* Social Posts Tab */}
//                 {getVideoTab(idx) === "social" && (
//                   <div className="space-y-4">
//                     {[
//                       { label: "Twitter / X",   icon: Twitter,   content: video.twitterPost,   color: "text-sky-400",    bg: "bg-sky-500/10" },
//                       { label: "LinkedIn",       icon: Linkedin,  content: video.linkedinPost,  color: "text-blue-400",   bg: "bg-blue-500/10" },
//                       { label: "Facebook",       icon: Facebook,  content: video.facebookPost,  color: "text-indigo-400", bg: "bg-indigo-500/10" },
//                       { label: "TikTok / Shorts",icon: Smartphone,content: video.tiktokCaption, color: "text-pink-400",   bg: "bg-pink-500/10" },
//                     ].map(post => {
//                       const Icon = post.icon;
//                       return (
//                         <div key={post.label} className={`rounded-xl border border-white/5 p-4 ${post.bg}`}>
//                           <div className="flex items-center justify-between mb-2">
//                             <div className="flex items-center gap-2">
//                               <Icon className={`w-4 h-4 ${post.color}`} />
//                               <span className={`text-xs font-bold ${post.color}`}>{post.label}</span>
//                             </div>
//                             <button onClick={() => copyText(post.content)} className="text-white/20 hover:text-white/60 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
//                           </div>
//                           <p className="text-sm text-white/70 leading-relaxed">{post.content}</p>
//                         </div>
//                       );
//                     })}
//                   </div>
//                 )}

//                 {/* Actions */}
//                 <div className="flex items-center gap-2 mt-6 pt-4 border-t border-white/5">
//                   <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all">
//                     <Star className="w-3.5 h-3.5" /> Save to Library
//                   </button>
//                   <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all">
//                     <RefreshCw className="w-3.5 h-3.5" /> Regenerate
//                   </button>
//                   <button className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/60 text-xs hover:bg-white/10 hover:text-white transition-all">
//                     <Edit3 className="w-3.5 h-3.5" /> Edit
//                   </button>
//                   <button className="ml-auto flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity">
//                     <Download className="w-3.5 h-3.5" /> Export Full Package
//                   </button>
//                 </div>
//               </div>
//             </div>
//           )}
//         </div>
//       ))}
//     </div>
//   );
// }

// function ScriptBlock({ label, content }: { label: string; content: string }) {
//   return (
//     <div className="rounded-xl bg-white/3 border border-white/5 p-4">
//       <div className="flex items-center justify-between mb-2">
//         <span className="text-xs font-bold text-white/60">{label}</span>
//         <button onClick={() => navigator.clipboard.writeText(content)} className="text-white/20 hover:text-white/60 transition-colors"><Copy className="w-3.5 h-3.5" /></button>
//       </div>
//       <p className="text-sm text-white/70 leading-relaxed whitespace-pre-line">{content}</p>
//     </div>
//   );
// }

// function ListBlock({ label, items }: { label: string; items: string[] }) {
//   return (
//     <div className="rounded-xl bg-white/3 border border-white/5 p-4">
//       <p className="text-xs font-bold text-white/60 mb-3">{label}</p>
//       <ul className="space-y-1.5">
//         {items.map((item, i) => (
//           <li key={i} className="flex items-start gap-2 text-sm text-white/60">
//             <span className="w-1.5 h-1.5 rounded-full bg-white/20 mt-1.5 shrink-0" />
//             {item}
//           </li>
//         ))}
//       </ul>
//     </div>
//   );
// }
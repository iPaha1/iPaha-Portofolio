"use client";

import { useState } from "react";
import {
  Lightbulb, Wand2, Loader2, Star, ArrowRight, Trash2,
  Search, RefreshCw, StickyNote
} from "lucide-react";
import { YoutubeContentIdea } from "./youtube-studio-types";
import { useIdeas, useYoutubeProfile } from "@/hooks/youtube-studio/use-youtube";
import YoutubeIdeaDevelopModal from "./youtube-studio-idea-develop-modal";
import YoutubeIdeaNoteModal from "./youtube-studio-add-note";

const DIFFICULTY_STYLE: Record<string, string> = {
  deep:   "bg-purple-500/15 text-purple-400",
  medium: "bg-blue-500/15 text-blue-400",
  easy:   "bg-green-500/15 text-green-400",
};

const EMOTION_EMOJIS: Record<string, string> = {
  empowering: "💪", confronting: "🔥", grounding: "🌱", inspiring: "✨",
  challenging: "⚡", vulnerable: "🫂", curious: "🔍", calming: "🌊",
};

const THEMES = ["Life Understanding","Self-Belief","Confidence","Values","Mindset","Relationships","Career","Money","Purpose"];

export default function YoutubeIdeasBank({ userId }: { userId: string }) {
  const { profile } = useYoutubeProfile(userId);
  const { ideas, total, loading, generating, generateIdeas, toggleSaved, deleteIdea, refetch } =
    useIdeas(userId);

  const [search, setSearch] = useState("");
  const [filterSaved, setFilterSaved] = useState<boolean | undefined>(undefined);
  const [filterDiff, setFilterDiff] = useState<string>("");
  const [showGenPanel, setShowGenPanel] = useState(false);
  const [genCount, setGenCount] = useState(10);
  const [genThemes, setGenThemes] = useState<string[]>([]);

  // Client-side filter
  const filtered = ideas.filter(idea => {
    const matchSearch = !search || idea.title.toLowerCase().includes(search.toLowerCase()) ||
      (idea.angle || "").toLowerCase().includes(search.toLowerCase());
    const matchSaved = filterSaved === undefined || idea.isSaved === filterSaved;
    const matchDiff = !filterDiff || idea.difficulty === filterDiff;
    return matchSearch && matchSaved && matchDiff;
  });

  const handleGenerate = async () => {
    let themesToUse: string[] = [];
    
    if (genThemes.length > 0) {
      themesToUse = genThemes;
    } else if (profile?.coreThemes) {
      try {
        const coreThemes = profile.coreThemes;
        const parsed = typeof coreThemes === 'string' ? JSON.parse(coreThemes) : coreThemes;
        themesToUse = Array.isArray(parsed) ? parsed : [];
      } catch (error) {
        console.error("Failed to parse coreThemes:", error);
        themesToUse = [];
      }
    }
    
    await generateIdeas({
      count: genCount,
      themes: themesToUse,
      tone: profile?.defaultTone ?? "calm",
      targetAudience: profile?.targetAudience ?? "young adults",
    });
    setShowGenPanel(false);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-base font-bold text-white">Ideas Bank</h2>
          <p className="text-xs text-white/40 mt-0.5">
            {total} idea{total !== 1 ? "s" : ""} · AI-generated and ready to develop
          </p>
        </div>
        <button
          onClick={() => setShowGenPanel(!showGenPanel)}
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
        >
          <Wand2 className="w-3.5 h-3.5" />
          Generate Ideas
        </button>
      </div>

      {/* Generation Panel */}
      {showGenPanel && (
        <div className="rounded-xl bg-white/3 border border-blue-500/20 p-5 space-y-4">
          <div className="flex items-center gap-2">
            <span className="text-sm font-semibold text-white">Generate New Ideas</span>
          </div>

          <div className="grid md:grid-cols-2 gap-4">
            <div>
              <label className={LABEL}>Number of Ideas</label>
              <div className="flex items-center gap-2">
                {[5,10,15,20].map(n => (
                  <button key={n} onClick={() => setGenCount(n)}
                    className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
                      ${genCount === n ? "bg-blue-500/30 text-blue-300 border border-blue-500/30" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className={LABEL}>Focus Themes <span className="normal-case font-normal text-white/25">(leave blank = all)</span></label>
              <div className="flex flex-wrap gap-1.5">
                {THEMES.slice(0, 6).map(t => (
                  <button key={t} onClick={() => setGenThemes(prev =>
                    prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
                  )}
                    className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all
                      ${genThemes.includes(t) ? "bg-blue-500/25 text-blue-300" : "bg-white/5 text-white/35 hover:text-white/60"}`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>
          </div>

          <div className="flex gap-2 pt-1">
            <button onClick={() => setShowGenPanel(false)}
              className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 transition-all">
              Cancel
            </button>
            <button onClick={handleGenerate} disabled={generating}
              className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
              {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Wand2 className="w-3.5 h-3.5" /> Generate {genCount} Ideas</>}
            </button>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex flex-wrap items-center gap-2">
        <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-2 flex-1 max-w-xs">
          <Search className="w-3.5 h-3.5 text-white/30" />
          <input value={search} onChange={e => setSearch(e.target.value)}
            placeholder="Search ideas..."
            className="bg-transparent text-sm text-white/70 placeholder:text-white/25 outline-none flex-1" />
        </div>

        <div className="flex items-center gap-1">
          {[
            { label: "All", value: undefined },
            { label: "⭐ Saved", value: true },
          ].map(f => (
            <button key={String(f.label)} onClick={() => setFilterSaved(f.value)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
                ${filterSaved === f.value ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              {f.label}
            </button>
          ))}
        </div>

        <div className="flex items-center gap-1">
          {["", "easy", "medium", "deep"].map(d => (
            <button key={d} onClick={() => setFilterDiff(d)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
                ${filterDiff === d ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
              {d || "Any depth"}
            </button>
          ))}
        </div>

        <button onClick={refetch} className="ml-auto text-white/30 hover:text-white transition-colors">
          <RefreshCw className="w-3.5 h-3.5" />
        </button>
      </div>

      <p className="text-xs text-white/30">{filtered.length} idea{filtered.length !== 1 ? "s" : ""}</p>

      {/* Ideas List */}
      {loading ? (
        <div className="flex items-center justify-center py-16">
          <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
        </div>
      ) : filtered.length === 0 ? (
        <div className="rounded-xl bg-white/3 border border-white/5 py-16 text-center">
          <Lightbulb className="w-10 h-10 text-white/10 mx-auto mb-3" />
          <p className="text-sm text-white/40">No ideas found</p>
          <p className="text-xs text-white/25 mt-1">Generate new ideas or adjust your filters</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map(idea => (
            <IdeaCard
              key={idea.id}
              idea={idea}
              userId={userId}
              onToggleSaved={() => toggleSaved(idea.id)}
              onDelete={() => deleteIdea(idea.id)}
              onRefetch={refetch}
            />
          ))}
        </div>
      )}

      {/* Anti-repetition note */}
      <div className="rounded-xl bg-gradient-to-r from-purple-500/8 to-blue-500/5 border border-purple-500/15 p-4 flex items-start gap-3">
        <div>
          <p className="text-xs font-semibold text-purple-300">Anti-Repetition Engine Active</p>
          <p className="text-xs text-white/40 mt-1 leading-relaxed">
            Every idea generated is checked against your topic memory. The AI ensures
            each new idea builds on past content rather than repeating it — creating a
            progressive narrative across your channel.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─── Idea Card ─────────────────────────────────────────────────────────────────

function IdeaCard({
  idea,
  userId,
  onToggleSaved,
  onDelete,
  onRefetch,
}: {
  idea: YoutubeContentIdea;
  userId: string;
  onToggleSaved: () => void;
  onDelete: () => void;
  onRefetch: () => void;
}) {
  const [expanded, setExpanded] = useState(false);
  const [showDevelopModal, setShowDevelopModal] = useState(false);
  const [showNoteModal, setShowNoteModal] = useState(false);
  const emoji = idea.targetEmotion ? (EMOTION_EMOJIS[idea.targetEmotion] ?? "💡") : "💡";

  return (
    <>
      <div className={`rounded-xl bg-white/3 border transition-all duration-200 overflow-hidden
        ${expanded ? "border-white/10" : "border-white/5 hover:border-white/8"}`}>
        {/* Main row */}
        <div className="flex items-start gap-3 p-4">
          <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-sm shrink-0 mt-0.5">
            {emoji}
          </div>

          <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
            <p className="text-sm font-semibold text-white leading-snug">{idea.title}</p>
            {idea.angle && !expanded && (
              <p className="text-xs text-white/40 mt-1 truncate">{idea.angle}</p>
            )}
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              {idea.difficulty && (
                <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${DIFFICULTY_STYLE[idea.difficulty] ?? ""}`}>
                  {idea.difficulty}
                </span>
              )}
              {idea.targetEmotion && (
                <span className="text-[9px] text-white/25 capitalize">{idea.targetEmotion}</span>
              )}
              {idea.estimatedLength && (
                <span className="text-[9px] text-white/25">~{idea.estimatedLength} min</span>
              )}
              {idea.themes?.slice(0, 2).map(t => (
                <span key={t} className="text-[9px] text-white/20">{t}</span>
              ))}
            </div>
          </div>

          {/* Actions */}
          <div className="flex items-center gap-1 shrink-0">
            <button
              onClick={onToggleSaved}
              className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
                ${idea.isSaved
                  ? "bg-yellow-500/20 text-yellow-400"
                  : "bg-white/5 text-white/25 hover:text-yellow-400 hover:bg-yellow-500/10"}`}
              title={idea.isSaved ? "Remove from saved" : "Save idea"}
            >
              <Star className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={() => setExpanded(!expanded)}
              className="w-7 h-7 rounded-lg bg-white/5 text-white/25 hover:text-green-400 hover:bg-green-500/10 flex items-center justify-center transition-all"
              title="Expand idea"
            >
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
            <button
              onClick={onDelete}
              className="w-7 h-7 rounded-lg bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
              title="Delete idea"
            >
              <Trash2 className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Expanded detail */}
        {expanded && (
          <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5 mt-1">
            {idea.angle && (
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Angle</p>
                <p className="text-sm text-white/70 leading-relaxed">{idea.angle}</p>
              </div>
            )}
            {idea.hook && (
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Hook</p>
                <p className="text-sm text-white/70 italic leading-relaxed">"{idea.hook}"</p>
              </div>
            )}
            {idea.whyNow && (
              <div>
                <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Why Now</p>
                <p className="text-sm text-white/60 leading-relaxed">{idea.whyNow}</p>
              </div>
            )}
            <div className="pt-2 flex gap-2">
              <button 
                onClick={() => setShowDevelopModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
              >
                <Wand2 className="w-3.5 h-3.5" /> Develop into Full Script
              </button>
              <button 
                onClick={() => setShowNoteModal(true)}
                className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white transition-all"
              >
                <StickyNote className="w-3.5 h-3.5" /> Add Note
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modals */}
      {showDevelopModal && (
        <YoutubeIdeaDevelopModal
          idea={idea}
          userId={userId}
          onClose={() => setShowDevelopModal(false)}
          onSuccess={(videoId) => {
            console.log("Video created:", videoId);
            onRefetch();
          }}
        />
      )}

      {showNoteModal && (
        <YoutubeIdeaNoteModal
          userId={userId}
          ideaId={idea.id}
          currentNote={idea.userNotes}
          onClose={() => setShowNoteModal(false)}
          onSaved={() => {
            onRefetch();
          }}
        />
      )}
    </>
  );
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const LABEL = "text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5";


// "use client";

// import { useState } from "react";
// import {
//   Lightbulb, Wand2, Loader2, Star, ArrowRight, Trash2,
//   Search, Filter, Zap, RefreshCw, StickyNote
// } from "lucide-react";
// import { YoutubeContentIdea } from "./youtube-studio-types";
// import { useIdeas, useYoutubeProfile } from "@/hooks/youtube-studio/use-youtube";
// import YoutubeIdeaDevelopModal from "./youtube-studio-idea-develop-modal";
// import YoutubeIdeaNoteModal from "./youtube-studio-add-note";


// const DIFFICULTY_STYLE: Record<string, string> = {
//   deep:   "bg-purple-500/15 text-purple-400",
//   medium: "bg-blue-500/15 text-blue-400",
//   easy:   "bg-green-500/15 text-green-400",
// };

// const EMOTION_EMOJIS: Record<string, string> = {
//   empowering: "💪", confronting: "🔥", grounding: "🌱", inspiring: "✨",
//   challenging: "⚡", vulnerable: "🫂", curious: "🔍", calming: "🌊",
// };

// export default function YoutubeIdeasBank({ userId }: { userId: string }) {
//   const { profile } = useYoutubeProfile(userId);
//   const { ideas, total, loading, generating, generateIdeas, toggleSaved, deleteIdea, refetch } =
//     useIdeas(userId);

//   const [search, setSearch]         = useState("");
//   const [filterSaved, setFilterSaved] = useState<boolean | undefined>(undefined);
//   const [filterDiff,  setFilterDiff]  = useState<string>("");
//   const [showGenPanel, setShowGenPanel] = useState(false);
//   const [genCount, setGenCount]       = useState(10);
//   const [genThemes, setGenThemes]     = useState<string[]>([]);
//   const [noteVideoId, setNoteVideoId] = useState<string | null>(null);

  

//   const THEMES = ["Life Understanding","Self-Belief","Confidence","Values","Mindset","Relationships","Career","Money","Purpose"];

//   // Client-side filter
//   const filtered = ideas.filter(idea => {
//     const matchSearch = !search || idea.title.toLowerCase().includes(search.toLowerCase()) ||
//       (idea.angle || "").toLowerCase().includes(search.toLowerCase());
//     const matchSaved  = filterSaved === undefined || idea.isSaved === filterSaved;
//     const matchDiff   = !filterDiff  || idea.difficulty === filterDiff;
//     return matchSearch && matchSaved && matchDiff;
//   });

  // const handleGenerate = async () => {
  //   await generateIdeas({
  //     count: genCount,
  //     themes: genThemes.length > 0 ? genThemes : (profile?.coreThemes ?? []),
  //     tone: profile?.defaultTone ?? "calm",
  //     targetAudience: profile?.targetAudience ?? "young adults",
  //   });
  //   setShowGenPanel(false);
  // };

//   return (
//     <div className="max-w-4xl mx-auto space-y-5">

//       {/* Header */}
//       <div className="flex items-center justify-between">
//         <div>
//           <h2 className="text-base font-bold text-white">Ideas Bank</h2>
//           <p className="text-xs text-white/40 mt-0.5">
//             {total} idea{total !== 1 ? "s" : ""} · AI-generated and ready to develop
//           </p>
//         </div>
//         <button
//           onClick={() => setShowGenPanel(!showGenPanel)}
//           className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
//         >
//           <Wand2 className="w-3.5 h-3.5" />
//           Generate Ideas
//         </button>
//       </div>

//       {/* Generation Panel */}
//       {showGenPanel && (
//         <div className="rounded-xl bg-white/3 border border-blue-500/20 p-5 space-y-4">
//           <div className="flex items-center gap-2">
//             <Zap className="w-4 h-4 text-blue-400" />
//             <span className="text-sm font-semibold text-white">Generate New Ideas</span>
//           </div>

//           <div className="grid md:grid-cols-2 gap-4">
//             <div>
//               <label className={LABEL}>Number of Ideas</label>
//               <div className="flex items-center gap-2">
//                 {[5,10,15,20].map(n => (
//                   <button key={n} onClick={() => setGenCount(n)}
//                     className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
//                       ${genCount === n ? "bg-blue-500/30 text-blue-300 border border-blue-500/30" : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}>
//                     {n}
//                   </button>
//                 ))}
//               </div>
//             </div>
//             <div>
//               <label className={LABEL}>Focus Themes <span className="normal-case font-normal text-white/25">(leave blank = all)</span></label>
//               <div className="flex flex-wrap gap-1.5">
//                 {THEMES.slice(0, 6).map(t => (
//                   <button key={t} onClick={() => setGenThemes(prev =>
//                     prev.includes(t) ? prev.filter(x => x !== t) : [...prev, t]
//                   )}
//                     className={`px-2.5 py-1 rounded text-[10px] font-medium transition-all
//                       ${genThemes.includes(t) ? "bg-blue-500/25 text-blue-300" : "bg-white/5 text-white/35 hover:text-white/60"}`}>
//                     {t}
//                   </button>
//                 ))}
//               </div>
//             </div>
//           </div>

//           <div className="flex gap-2 pt-1">
//             <button onClick={() => setShowGenPanel(false)}
//               className="px-4 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 transition-all">
//               Cancel
//             </button>
//             <button onClick={handleGenerate} disabled={generating}
//               className="flex items-center gap-2 px-5 py-2 rounded-lg bg-gradient-to-r from-blue-500 to-cyan-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity disabled:opacity-50">
//               {generating ? <><Loader2 className="w-3.5 h-3.5 animate-spin" /> Generating...</> : <><Wand2 className="w-3.5 h-3.5" /> Generate {genCount} Ideas</>}
//             </button>
//           </div>
//         </div>
//       )}

//       {/* Filters */}
//       <div className="flex flex-wrap items-center gap-2">
//         <div className="flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-2 flex-1 max-w-xs">
//           <Search className="w-3.5 h-3.5 text-white/30" />
//           <input value={search} onChange={e => setSearch(e.target.value)}
//             placeholder="Search ideas..."
//             className="bg-transparent text-sm text-white/70 placeholder:text-white/25 outline-none flex-1" />
//         </div>

//         {/* Saved filter */}
//         <div className="flex items-center gap-1">
//           {[
//             { label: "All",   value: undefined },
//             { label: "⭐ Saved", value: true   },
//           ].map(f => (
//             <button key={String(f.label)} onClick={() => setFilterSaved(f.value)}
//               className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all
//                 ${filterSaved === f.value ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
//               {f.label}
//             </button>
//           ))}
//         </div>

//         {/* Difficulty filter */}
//         <div className="flex items-center gap-1">
//           {["","easy","medium","deep"].map(d => (
//             <button key={d} onClick={() => setFilterDiff(d)}
//               className={`px-3 py-1.5 rounded-lg text-xs font-medium capitalize transition-all
//                 ${filterDiff === d ? "bg-white/10 text-white" : "text-white/40 hover:text-white/70"}`}>
//               {d || "Any depth"}
//             </button>
//           ))}
//         </div>

//         <button onClick={refetch} className="ml-auto text-white/30 hover:text-white transition-colors">
//           <RefreshCw className="w-3.5 h-3.5" />
//         </button>
//       </div>

//       <p className="text-xs text-white/30">{filtered.length} idea{filtered.length !== 1 ? "s" : ""}</p>

//       {/* Ideas List */}
//       {loading ? (
//         <div className="flex items-center justify-center py-16">
//           <Loader2 className="w-5 h-5 text-white/30 animate-spin" />
//         </div>
//       ) : filtered.length === 0 ? (
//         <div className="rounded-xl bg-white/3 border border-white/5 py-16 text-center">
//           <Lightbulb className="w-10 h-10 text-white/10 mx-auto mb-3" />
//           <p className="text-sm text-white/40">No ideas found</p>
//           <p className="text-xs text-white/25 mt-1">Generate new ideas or adjust your filters</p>
//         </div>
//       ) : (
//         <div className="space-y-3">
//           {filtered.map(idea => (
//             <IdeaCard
//               key={idea.id}
//               idea={idea}
//               userId={userId}
//               onToggleSaved={() => toggleSaved(idea.id)}
//               onDelete={() => deleteIdea(idea.id)}
//               onRefetch={refetch}
//             />
//           ))}
//         </div>
//       )}

//       {/* Anti-repetition note */}
//       <div className="rounded-xl bg-gradient-to-r from-purple-500/8 to-blue-500/5 border border-purple-500/15 p-4 flex items-start gap-3">
//         <Zap className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
//         <div>
//           <p className="text-xs font-semibold text-purple-300">Anti-Repetition Engine Active</p>
//           <p className="text-xs text-white/40 mt-1 leading-relaxed">
//             Every idea generated is checked against your topic memory. The AI ensures
//             each new idea builds on past content rather than repeating it — creating a
//             progressive narrative across your channel.
//           </p>
//         </div>
//       </div>
//     </div>
//   );
// }

// // ─── Idea Card ─────────────────────────────────────────────────────────────────

// function IdeaCard({
//   idea,
//   userId,
//   onToggleSaved,
//   onDelete,
//   onRefetch,
// }: {
//   idea: YoutubeContentIdea;
//   userId: string;
//   onToggleSaved: () => void;
//   onDelete: () => void;
//   onRefetch: () => void;
// }) {
//   const [expanded, setExpanded] = useState(false);
//   const [showDevelopModal, setShowDevelopModal] = useState(false);
// const [showNoteModal, setShowNoteModal] = useState(false);
//   const emoji = idea.targetEmotion ? (EMOTION_EMOJIS[idea.targetEmotion] ?? "💡") : "💡";

//   return (
//     <div className={`rounded-xl bg-white/3 border transition-all duration-200 overflow-hidden
//       ${expanded ? "border-white/10" : "border-white/5 hover:border-white/8"}`}>
//       {/* Main row */}
//       <div className="flex items-start gap-3 p-4">
//         <div className="w-8 h-8 rounded-lg bg-yellow-500/10 flex items-center justify-center text-sm shrink-0 mt-0.5">
//           {emoji}
//         </div>

//         <div className="flex-1 min-w-0 cursor-pointer" onClick={() => setExpanded(!expanded)}>
//           <p className="text-sm font-semibold text-white leading-snug">{idea.title}</p>
//           {idea.angle && !expanded && (
//             <p className="text-xs text-white/40 mt-1 truncate">{idea.angle}</p>
//           )}
//           <div className="flex items-center gap-2 mt-2 flex-wrap">
//             {idea.difficulty && (
//               <span className={`text-[9px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${DIFFICULTY_STYLE[idea.difficulty] ?? ""}`}>
//                 {idea.difficulty}
//               </span>
//             )}
//             {idea.targetEmotion && (
//               <span className="text-[9px] text-white/25 capitalize">{idea.targetEmotion}</span>
//             )}
//             {idea.estimatedLength && (
//               <span className="text-[9px] text-white/25">~{idea.estimatedLength} min</span>
//             )}
//             {idea.themes?.slice(0, 2).map(t => (
//               <span key={t} className="text-[9px] text-white/20">{t}</span>
//             ))}
//           </div>
//         </div>

//         {/* Actions */}
//         <div className="flex items-center gap-1 shrink-0">
//           <button
//             onClick={onToggleSaved}
//             className={`w-7 h-7 rounded-lg flex items-center justify-center transition-all
//               ${idea.isSaved
//                 ? "bg-yellow-500/20 text-yellow-400"
//                 : "bg-white/5 text-white/25 hover:text-yellow-400 hover:bg-yellow-500/10"}`}
//             title={idea.isSaved ? "Remove from saved" : "Save idea"}
//           >
//             <Star className="w-3.5 h-3.5" />
//           </button>
//           <button
//             onClick={() => setExpanded(!expanded)}
//             className="w-7 h-7 rounded-lg bg-white/5 text-white/25 hover:text-green-400 hover:bg-green-500/10 flex items-center justify-center transition-all"
//             title="Develop into script"
//           >
//             <ArrowRight className="w-3.5 h-3.5" />
//           </button>
//           <button
//             onClick={onDelete}
//             className="w-7 h-7 rounded-lg bg-white/5 text-white/20 hover:text-red-400 hover:bg-red-500/10 flex items-center justify-center transition-all"
//             title="Delete idea"
//           >
//             <Trash2 className="w-3.5 h-3.5" />
//           </button>
//         </div>
//       </div>

//       {/* Expanded detail */}
//       {expanded && (
//         <div className="px-4 pb-4 pt-0 space-y-3 border-t border-white/5 mt-1">
//           {idea.angle && (
//             <div>
//               <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Angle</p>
//               <p className="text-sm text-white/70 leading-relaxed">{idea.angle}</p>
//             </div>
//           )}
//           {idea.hook && (
//             <div>
//               <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Hook</p>
//               <p className="text-sm text-white/70 italic leading-relaxed">"{idea.hook}"</p>
//             </div>
//           )}
//           {idea.whyNow && (
//             <div>
//               <p className="text-[10px] font-bold text-white/40 uppercase tracking-wider mb-1">Why Now</p>
//               <p className="text-sm text-white/60 leading-relaxed">{idea.whyNow}</p>
//             </div>
//           )}
//           <div className="pt-2 flex gap-2">
//           <button 
//             onClick={() => setShowDevelopModal(true)}
//             className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-xs font-semibold hover:opacity-90 transition-opacity"
//           >
//             <Wand2 className="w-3.5 h-3.5" /> Develop into Full Script
//           </button>
//           <button 
//             onClick={() => setShowNoteModal(true)}
//             className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 text-white/50 text-xs hover:bg-white/10 hover:text-white transition-all"
//           >
//             <StickyNote className="w-3.5 h-3.5" /> Add Note
//           </button>
//         </div>

//           {/* Modals */}
//           {showDevelopModal && (
//             <YoutubeIdeaDevelopModal
//               idea={idea}
//               userId={userId}
//               onClose={() => setShowDevelopModal(false)}
//               onSuccess={(videoId) => {
//                 // Optionally mark idea as used or navigate to video
//                 console.log("Video created:", videoId);
//               }}
//             />
//           )}

//           {showNoteModal && (
//             <YoutubeIdeaNoteModal
//               ideaId={idea.id}
//               currentNote={idea.userNotes}
//               onClose={() => setShowNoteModal(false)}
//               onSaved={() => {
//                 // Refresh ideas to show the note
//                 onRefetch();
//               }}
//             />
//           )}
//         </div>
//       )}
//     </div>
//   );
// }

// // ─── Helpers ─────────────────────────────────────────────────────────────────

// const LABEL = "text-xs font-semibold text-white/50 uppercase tracking-wider block mb-1.5";
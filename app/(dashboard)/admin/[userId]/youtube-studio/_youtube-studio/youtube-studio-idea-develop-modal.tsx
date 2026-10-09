// app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-idea-develop-modal.tsx

"use client";

import { useState } from "react";
import { Loader2, Wand2, X, Save } from "lucide-react";
import { YoutubeContentIdea } from "./youtube-studio-types";
import { useGenerateVideoFromIdea } from "@/hooks/youtube-studio/use-youtube";

interface Props {
  idea: YoutubeContentIdea;
  userId: string;
  onClose: () => void;
  onSuccess: (videoId: string) => void;
}

export default function YoutubeIdeaDevelopModal({ idea, userId, onClose, onSuccess }: Props) {
  const [step, setStep] = useState<"config" | "generating" | "review">("config");
  const [generatedVideo, setGeneratedVideo] = useState<any>(null);
  const [tone, setTone] = useState("calm");
  const [videoLength, setVideoLength] = useState(8);
  const [additionalNotes, setAdditionalNotes] = useState("");
  
  const { generate, loading } = useGenerateVideoFromIdea(userId);

  const TONES = [
    "calm", "reflective", "direct", "energetic",
    "storytelling", "philosophical", "motivational", "conversational"
  ];

  const handleGenerate = async () => {
    setStep("generating");
    const result = await generate({
      ideaId: idea.id,
      title: idea.title,
      angle: idea.angle,
      hook: idea.hook,
      whyNow: idea.whyNow,
      themes: idea.themes,
      targetEmotion: idea.targetEmotion,
      tone,
      estimatedLength: videoLength,
      additionalNotes,
    });
    
    if (result.data) {
      setGeneratedVideo(result.data);
      setStep("review");
    }
  };

  const handleSave = async () => {
    // Save the video to library
    onSuccess(generatedVideo.id);
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4 overflow-y-auto">
      <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-4xl w-full max-h-[90vh] overflow-y-auto">
        
        {/* Header */}
        <div className="sticky top-0 bg-zinc-900 border-b border-white/10 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-base font-semibold text-white">Develop into Full Script</h2>
            <p className="text-xs text-white/40 mt-0.5">{idea.title}</p>
          </div>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X className="w-4 h-4 text-white/60" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6">
          {step === "config" && (
            <div className="space-y-5">
              {/* Idea Preview */}
              <div className="rounded-lg bg-white/5 border border-white/10 p-4 space-y-2">
                <p className="text-xs font-semibold text-white/40 uppercase tracking-wider">Idea Details</p>
                {idea.angle && (
                  <div>
                    <p className="text-[10px] text-white/30">Angle</p>
                    <p className="text-sm text-white/70">{idea.angle}</p>
                  </div>
                )}
                {idea.hook && (
                  <div>
                    <p className="text-[10px] text-white/30">Hook</p>
                    <p className="text-sm text-white/70 italic">"{idea.hook}"</p>
                  </div>
                )}
                {idea.whyNow && (
                  <div>
                    <p className="text-[10px] text-white/30">Why Now</p>
                    <p className="text-sm text-white/60">{idea.whyNow}</p>
                  </div>
                )}
              </div>

              {/* Configuration */}
              <div className="grid md:grid-cols-2 gap-4">
                <div>
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
                    Tone
                  </label>
                  <div className="flex flex-wrap gap-1.5">
                    {TONES.map(t => (
                      <button
                        key={t}
                        onClick={() => setTone(t)}
                        className={`px-2.5 py-1 rounded text-[11px] font-medium capitalize transition-colors
                          ${tone === t
                            ? "bg-blue-500/30 text-blue-300 border border-blue-500/30"
                            : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}
                      >
                        {t}
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
                    Estimated Length (minutes)
                  </label>
                  <div className="flex items-center gap-2">
                    {[5, 8, 10, 12, 15].map(len => (
                      <button
                        key={len}
                        onClick={() => setVideoLength(len)}
                        className={`flex-1 py-2 rounded-lg text-xs font-semibold transition-all
                          ${videoLength === len
                            ? "bg-blue-500/30 text-blue-300 border border-blue-500/30"
                            : "bg-white/5 text-white/40 hover:text-white hover:bg-white/10"}`}
                      >
                        {len} min
                      </button>
                    ))}
                  </div>
                </div>
              </div>

              <div>
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
                  Additional Notes (optional)
                </label>
                <textarea
                  value={additionalNotes}
                  onChange={(e) => setAdditionalNotes(e.target.value)}
                  placeholder="e.g., Include a personal story about... Focus more on the practical application..."
                  className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
                  rows={3}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={onClose}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm"
                >
                  Cancel
                </button>
                <button
                  onClick={handleGenerate}
                  className="flex-1 px-4 py-2 rounded-lg bg-gradient-to-r from-red-500 to-orange-500 text-white text-sm font-semibold hover:opacity-90 flex items-center justify-center gap-2"
                >
                  <Wand2 className="w-3.5 h-3.5" />
                  Generate Full Script
                </button>
              </div>
            </div>
          )}

          {step === "generating" && (
            <div className="text-center py-12">
              <Loader2 className="w-10 h-10 text-blue-400 animate-spin mx-auto mb-4" />
              <p className="text-sm font-medium text-white">Generating your script...</p>
              <p className="text-xs text-white/40 mt-1">This may take a moment</p>
            </div>
          )}

          {step === "review" && generatedVideo && (
            <div className="space-y-4">
              <div className="rounded-lg bg-green-500/10 border border-green-500/20 p-3">
                <p className="text-xs text-green-400">✓ Script generated successfully!</p>
              </div>
              
              <div className="space-y-3 max-h-[400px] overflow-y-auto">
                <PreviewSection label="Title" content={generatedVideo.title} />
                <PreviewSection label="Hook" content={generatedVideo.hook} />
                <PreviewSection label="Intro" content={generatedVideo.intro} />
                <PreviewSection label="Body" content={generatedVideo.body} isLong />
                <PreviewSection label="Perspective Shift" content={generatedVideo.perspectiveShift} />
                <PreviewSection label="Closing Line" content={generatedVideo.closingLine} />
              </div>

              <div className="flex gap-2 pt-4">
                <button
                  onClick={() => setStep("config")}
                  className="flex-1 px-4 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm"
                >
                  Back
                </button>
                <button
                  onClick={handleSave}
                  className="flex-1 px-4 py-2 rounded-lg bg-blue-500 text-white text-sm font-semibold hover:bg-blue-600 flex items-center justify-center gap-2"
                >
                  <Save className="w-3.5 h-3.5" />
                  Save to Library
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

function PreviewSection({ label, content, isLong = false }: { label: string; content?: string; isLong?: boolean }) {
  if (!content) return null;
  return (
    <div className="rounded-lg border border-white/10 p-3">
      <p className="text-[10px] font-semibold text-white/40 uppercase tracking-wider mb-1">{label}</p>
      <p className={`text-sm text-white/70 leading-relaxed ${isLong ? 'max-h-32 overflow-y-auto' : ''}`}>
        {content}
      </p>
    </div>
  );
}
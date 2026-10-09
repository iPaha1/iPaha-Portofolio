// app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-video-detail.tsx

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import {
  ArrowLeft, Save, Loader2, Copy, Check, Star, Trash2,
  Twitter, Linkedin, Facebook, Smartphone, Eye, Calendar,
  Clock, Tag, ChevronDown, ChevronUp, Edit2, X
} from "lucide-react";
import { useVideo, useSectionRegen } from "./use-youtube";

type VideoTab = "script" | "delivery" | "filming" | "upload" | "social";

const VIDEO_TABS: { id: VideoTab; label: string }[] = [
  { id: "script", label: "Script" },
  { id: "delivery", label: "Delivery" },
  { id: "filming", label: "Filming" },
  { id: "upload", label: "Upload Package" },
  { id: "social", label: "Social Posts" },
];

interface Props {
  userId: string;
  videoId: string;
  onBack: () => void;
}

export default function YoutubeVideoDetail({ userId, videoId, onBack }: Props) {
  const router = useRouter();
  const { video, loading, update } = useVideo(userId, videoId);
  const { regen, loading: regenLoading } = useSectionRegen(userId);
  
  const [activeTab, setActiveTab] = useState<VideoTab>("script");
  const [isEditing, setIsEditing] = useState(false);
  const [editedVideo, setEditedVideo] = useState<any>(null);
  const [saving, setSaving] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);
  const [regenSection, setRegenSection] = useState<string | null>(null);
  const [regenInstruction, setRegenInstruction] = useState("");
  const [showRegenModal, setShowRegenModal] = useState(false);

  useEffect(() => {
    if (video) {
      setEditedVideo(video);
    }
  }, [video]);

  const copyText = async (text: string, key: string) => {
    await navigator.clipboard.writeText(text);
    setCopiedKey(key);
    setTimeout(() => setCopiedKey(null), 1500);
  };

  const handleSave = async () => {
    if (!editedVideo) return;
    setSaving(true);
    await update(editedVideo);
    setSaving(false);
    setIsEditing(false);
  };

  const handleRegenerate = async (section: string, currentContent: string) => {
    setRegenSection(section);
    setShowRegenModal(true);
  };

  const executeRegen = async () => {
  if (!regenSection || !video) return;
  
  console.log("[executeRegen] Starting regeneration for section:", regenSection);
  
  const result = await regen({
    videoId: video.id,
    section: regenSection,
    currentContent: getSectionContent(regenSection),
    videoTitle: video.title,
    tone: video.toneNotes || "calm",
    instruction: regenInstruction || undefined,
    type: "section",
  });

  console.log("[executeRegen] Result:", result);

  if (result.data && editedVideo) {
    const newContent = result.data as string;
    console.log("[executeRegen] New content:", newContent);
    
    // Use functional update to ensure we have the latest state
    setEditedVideo((prev: any) => {
      const updated = {
        ...prev,
        [regenSection]: newContent,
      };
      
      // Update full script if needed
      if (regenSection === "hook" || regenSection === "intro" || 
          regenSection === "body" || regenSection === "perspectiveShift" || 
          regenSection === "closingLine") {
        const updatedFullScript = [
          regenSection === "hook" ? newContent : updated.hook,
          regenSection === "intro" ? newContent : updated.intro,
          regenSection === "body" ? newContent : updated.body,
          regenSection === "perspectiveShift" ? newContent : updated.perspectiveShift,
          regenSection === "closingLine" ? newContent : updated.closingLine,
        ].filter(Boolean).join("\n\n");
        updated.fullScript = updatedFullScript;
      }
      
      console.log("[executeRegen] Updated editedVideo:", updated);
      return updated;
    });
  } else {
    console.error("[executeRegen] No result.data or editedVideo missing");
  }
  
  setShowRegenModal(false);
  setRegenInstruction("");
  setRegenSection(null);
};

  const getSectionContent = (section: string): string => {
    if (!editedVideo) return "";
    switch (section) {
      case "hook": return editedVideo.hook || "";
      case "intro": return editedVideo.intro || "";
      case "body": return editedVideo.body || "";
      case "perspectiveShift": return editedVideo.perspectiveShift || "";
      case "closingLine": return editedVideo.closingLine || "";
      case "description": return editedVideo.description || "";
      default: return "";
    }
  };

  const updateField = (field: string, value: string) => {
    setEditedVideo({ ...editedVideo, [field]: value });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-16">
        <Loader2 className="w-6 h-6 text-white/30 animate-spin" />
      </div>
    );
  }

  if (!video || !editedVideo) {
    return (
      <div className="text-center py-16">
        <p className="text-white/40">Video not found</p>
        <button onClick={onBack} className="mt-4 text-sm text-blue-400 hover:text-blue-300">
          Go back
        </button>
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <button
            onClick={onBack}
            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors"
          >
            <ArrowLeft className="w-4 h-4 text-white/60" />
          </button>
          <div>
            {isEditing ? (
              <input
                value={editedVideo.title}
                onChange={(e) => updateField("title", e.target.value)}
                className="text-lg font-bold text-white bg-transparent border-b border-white/20 focus:border-blue-400 outline-none px-2 py-1"
              />
            ) : (
              <h1 className="text-lg font-bold text-white">{video.title}</h1>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className={`text-[10px] font-semibold px-2 py-0.5 rounded-full ${
                video.status === "PUBLISHED" ? "bg-green-500/15 text-green-400" :
                video.status === "READY" ? "bg-blue-500/15 text-blue-400" :
                "bg-white/5 text-white/30"
              }`}>
                {video.status}
              </span>
              {video.scheduledFor && (
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Calendar className="w-3 h-3" />
                  Scheduled: {new Date(video.scheduledFor).toLocaleDateString()}
                </span>
              )}
              {/* {video.estimatedLength && (
                <span className="text-xs text-white/40 flex items-center gap-1">
                  <Clock className="w-3 h-3" />
                  {video.estimatedLength} min
                </span>
              )} */}
            </div>
          </div>
        </div>
        
        <div className="flex items-center gap-2">
          {isEditing ? (
            <>
              <button
                onClick={() => {
                  setIsEditing(false);
                  setEditedVideo(video);
                }}
                className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/60 hover:bg-white/10"
              >
                Cancel
              </button>
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-3 py-1.5 rounded-lg text-xs bg-blue-500 text-white hover:bg-blue-600 flex items-center gap-1"
              >
                {saving ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                Save
              </button>
            </>
          ) : (
            <button
              onClick={() => setIsEditing(true)}
              className="px-3 py-1.5 rounded-lg text-xs bg-white/5 text-white/60 hover:bg-white/10 flex items-center gap-1"
            >
              <Edit2 className="w-3 h-3" />
              Edit
            </button>
          )}
          <button
            onClick={() => update({ isStarred: !video.isStarred })}
            className={`p-1.5 rounded-lg transition-colors ${
              video.isStarred ? "text-yellow-400 bg-yellow-400/10" : "text-white/30 hover:text-yellow-400 hover:bg-yellow-400/10"
            }`}
          >
            <Star className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex border-b border-white/10 overflow-x-auto">
        {VIDEO_TABS.map(tab => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2.5 text-xs font-medium whitespace-nowrap border-b-2 transition-colors
              ${activeTab === tab.id
                ? "border-blue-400 text-white"
                : "border-transparent text-white/40 hover:text-white/60"}`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {/* Script Tab */}
        {activeTab === "script" && (
          <>
            <EditableSection
              label="Hook"
              field="hook"
              value={editedVideo.hook}
              isEditing={isEditing}
              onUpdate={updateField}
              onRegenerate={() => handleRegenerate("hook", editedVideo.hook)}
              regenLoading={regenLoading && regenSection === "hook"}
              copyKey="hook"
              copiedKey={copiedKey}
              onCopy={copyText}
            />
            
            <EditableSection
              label="Intro"
              field="intro"
              value={editedVideo.intro}
              isEditing={isEditing}
              onUpdate={updateField}
              onRegenerate={() => handleRegenerate("intro", editedVideo.intro)}
              regenLoading={regenLoading && regenSection === "intro"}
              copyKey="intro"
              copiedKey={copiedKey}
              onCopy={copyText}
            />
            
            <EditableSection
              label="Body"
              field="body"
              value={editedVideo.body}
              isEditing={isEditing}
              onUpdate={updateField}
              onRegenerate={() => handleRegenerate("body", editedVideo.body)}
              regenLoading={regenLoading && regenSection === "body"}
              copyKey="body"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
              rows={12}
            />
            
            <EditableSection
              label="Perspective Shift"
              field="perspectiveShift"
              value={editedVideo.perspectiveShift}
              isEditing={isEditing}
              onUpdate={updateField}
              onRegenerate={() => handleRegenerate("perspectiveShift", editedVideo.perspectiveShift)}
              regenLoading={regenLoading && regenSection === "perspectiveShift"}
              copyKey="perspectiveShift"
              copiedKey={copiedKey}
              onCopy={copyText}
            />
            
            <EditableSection
              label="Closing Line"
              field="closingLine"
              value={editedVideo.closingLine}
              isEditing={isEditing}
              onUpdate={updateField}
              onRegenerate={() => handleRegenerate("closingLine", editedVideo.closingLine)}
              regenLoading={regenLoading && regenSection === "closingLine"}
              copyKey="closingLine"
              copiedKey={copiedKey}
              onCopy={copyText}
            />
          </>
        )}

        {/* Delivery Tab */}
        {activeTab === "delivery" && (
          <>
            <EditableSection
              label="Tone Notes"
              field="toneNotes"
              value={editedVideo.toneNotes}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="toneNotes"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
            />
            
            <EditableSection
              label="Facial Cues"
              field="facialCues"
              value={editedVideo.facialCues}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="facialCues"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
            />
            
            <EditableSection
              label="Energy Arc"
              field="energyArc"
              value={editedVideo.energyArc}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="energyArc"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
            />
            
            {editedVideo.pausePoints && (
              <div className="rounded-lg border border-white/10 p-4">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
                  Pause Points
                </label>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(editedVideo.pausePoints) ? editedVideo.pausePoints.join("\n") : editedVideo.pausePoints}
                    onChange={(e) => updateField("pausePoints", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    rows={3}
                  />
                ) : (
                  <ul className="space-y-1">
                    {(Array.isArray(editedVideo.pausePoints) ? editedVideo.pausePoints : JSON.parse(editedVideo.pausePoints || "[]")).map((point: string, i: number) => (
                      <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                        <span className="w-1 h-1 rounded-full bg-white/30 mt-2 shrink-0" />
                        {point}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        {/* Filming Tab */}
        {activeTab === "filming" && (
          <>
            <EditableSection
              label="Camera Position"
              field="cameraPosition"
              value={editedVideo.cameraPosition}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="cameraPosition"
              copiedKey={copiedKey}
              onCopy={copyText}
            />
            
            <EditableSection
              label="Lighting Suggestion"
              field="lightingSuggestion"
              value={editedVideo.lightingSuggestion}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="lightingSuggestion"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
            />
            
            <EditableSection
              label="Body Language Tips"
              field="bodyLanguageTips"
              value={editedVideo.bodyLanguageTips}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="bodyLanguageTips"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
            />
            
            <EditableSection
              label="Set Dressing"
              field="setDressing"
              value={editedVideo.setDressing}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="setDressing"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
            />
          </>
        )}

        {/* Upload Tab */}
        {activeTab === "upload" && (
          <>
            <EditableSection
              label="SEO Title"
              field="seoTitle"
              value={editedVideo.seoTitle}
              isEditing={isEditing}
              onUpdate={updateField}
              copyKey="seoTitle"
              copiedKey={copiedKey}
              onCopy={copyText}
            />
            
            <EditableSection
              label="Description"
              field="description"
              value={editedVideo.description}
              isEditing={isEditing}
              onUpdate={updateField}
              onRegenerate={() => handleRegenerate("description", editedVideo.description)}
              regenLoading={regenLoading && regenSection === "description"}
              copyKey="description"
              copiedKey={copiedKey}
              onCopy={copyText}
              textarea
              rows={8}
            />
            
            <EditableSection
              label="Tags"
              field="tags"
              value={Array.isArray(editedVideo.tags) ? editedVideo.tags.join(", ") : editedVideo.tags}
              isEditing={isEditing}
              onUpdate={(field, value) => updateField(field, value.split(",").map((t: string) => t.trim()).join(","))}
              copyKey="tags"
              copiedKey={copiedKey}
              onCopy={copyText}
            />
            
            {editedVideo.thumbnailTextIdeas && (
              <div className="rounded-lg border border-white/10 p-4">
                <label className="text-xs font-semibold text-white/40 uppercase tracking-wider block mb-2">
                  Thumbnail Ideas
                </label>
                {isEditing ? (
                  <textarea
                    value={Array.isArray(editedVideo.thumbnailTextIdeas) ? editedVideo.thumbnailTextIdeas.join("\n") : editedVideo.thumbnailTextIdeas}
                    onChange={(e) => updateField("thumbnailTextIdeas", e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    rows={4}
                  />
                ) : (
                  <ul className="space-y-1">
                    {(Array.isArray(editedVideo.thumbnailTextIdeas) ? editedVideo.thumbnailTextIdeas : JSON.parse(editedVideo.thumbnailTextIdeas || "[]")).map((idea: string, i: number) => (
                      <li key={i} className="text-sm text-white/70 flex items-start gap-2">
                        <span className="text-xs text-white/40">{i + 1}.</span>
                        {idea}
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            )}
          </>
        )}

        {/* Social Tab */}
        {activeTab === "social" && (
          <div className="space-y-4">
            {[
              { label: "X / Twitter", field: "twitterPost", icon: Twitter, key: "twitter" },
              { label: "LinkedIn", field: "linkedinPost", icon: Linkedin, key: "linkedin" },
              { label: "Facebook", field: "facebookPost", icon: Facebook, key: "facebook" },
              { label: "TikTok / Shorts", field: "tiktokCaption", icon: Smartphone, key: "tiktok" },
            ].map(platform => (
              <div key={platform.key} className="rounded-lg border border-white/10 p-4">
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <platform.icon className="w-4 h-4 text-white/40" />
                    <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
                      {platform.label}
                    </label>
                  </div>
                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => copyText(editedVideo[platform.field] || "", platform.key)}
                      className="p-1 rounded text-white/30 hover:text-white/60"
                    >
                      {copiedKey === platform.key ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
                    </button>
                  </div>
                </div>
                {isEditing ? (
                  <textarea
                    value={editedVideo[platform.field] || ""}
                    onChange={(e) => updateField(platform.field, e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
                    rows={4}
                  />
                ) : (
                  <p className="text-sm text-white/70 whitespace-pre-wrap">
                    {editedVideo[platform.field] || "Not generated"}
                  </p>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Regenerate Modal */}
      {showRegenModal && (
        <div className="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
          <div className="bg-zinc-900 rounded-xl border border-white/10 max-w-md w-full p-5">
            <h3 className="text-sm font-semibold text-white mb-2">Regenerate {regenSection}</h3>
            <p className="text-xs text-white/40 mb-3">
              Add specific instructions for the AI (optional)
            </p>
            <textarea
              value={regenInstruction}
              onChange={(e) => setRegenInstruction(e.target.value)}
              placeholder="e.g., Make it more conversational, add a personal story, shorten it..."
              className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white placeholder:text-white/20"
              rows={3}
            />
            <div className="flex gap-2 mt-4">
              <button
                onClick={() => setShowRegenModal(false)}
                className="flex-1 px-3 py-2 rounded-lg bg-white/5 text-white/60 hover:bg-white/10 text-sm"
              >
                Cancel
              </button>
              <button
                onClick={executeRegen}
                disabled={regenLoading}
                className="flex-1 px-3 py-2 rounded-lg bg-blue-500 text-white hover:bg-blue-600 text-sm flex items-center justify-center gap-2"
              >
                {regenLoading && <Loader2 className="w-3 h-3 animate-spin" />}
                Regenerate
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// Editable Section Component
function EditableSection({
  label,
  field,
  value,
  isEditing,
  onUpdate,
  onRegenerate,
  regenLoading,
  copyKey,
  copiedKey,
  onCopy,
  textarea = false,
  rows = 4,
}: {
  label: string;
  field: string;
  value: string;
  isEditing: boolean;
  onUpdate: (field: string, value: string) => void;
  onRegenerate?: () => void;
  regenLoading?: boolean;
  copyKey: string;
  copiedKey: string | null;
  onCopy: (text: string, key: string) => void;
  textarea?: boolean;
  rows?: number;
}) {
  const displayValue = value || "";
  
  return (
    <div className="rounded-lg border border-white/10 p-4">
      <div className="flex items-center justify-between mb-2">
        <label className="text-xs font-semibold text-white/40 uppercase tracking-wider">
          {label}
        </label>
        <div className="flex items-center gap-1">
          {onRegenerate && (
            <button
              onClick={onRegenerate}
              disabled={regenLoading}
              className="p-1 rounded text-white/30 hover:text-purple-400 hover:bg-purple-400/10 transition-colors"
              title="Regenerate with AI"
            >
              {regenLoading ? <Loader2 className="w-3 h-3 animate-spin" /> : <span className="text-xs">✨</span>}
            </button>
          )}
          <button
            onClick={() => onCopy(displayValue, copyKey)}
            className="p-1 rounded text-white/30 hover:text-white/60"
          >
            {copiedKey === copyKey ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
          </button>
        </div>
      </div>
      
      {isEditing ? (
        textarea ? (
          <textarea
            value={displayValue}
            onChange={(e) => onUpdate(field, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
            rows={rows}
          />
        ) : (
          <input
            type="text"
            value={displayValue}
            onChange={(e) => onUpdate(field, e.target.value)}
            className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white"
          />
        )
      ) : (
        <div className="text-sm text-white/70 whitespace-pre-wrap leading-relaxed">
          {displayValue || <span className="text-white/20 italic">Not generated</span>}
        </div>
      )}
    </div>
  );
}
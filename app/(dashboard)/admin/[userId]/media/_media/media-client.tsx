"use client";

// =============================================================================
// isaacpaha.com — Media Library Client
// components/admin/media-library/media-library-client.tsx
// =============================================================================

import React, {
  useState, useCallback, useRef,
} from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import {
  Image as ImageIcon, Film, FileText, Music, File,
  FolderOpen, Folder, Upload, Search,
  Grid3x3, List, Trash2, Copy,
  Check, X, AlertCircle, Loader2, 
  ArrowLeft, ExternalLink,
   HardDrive,  RotateCcw,
  LayoutGrid,  Plus,
  CheckSquare, Square, Play,
} from "lucide-react";
import {
  updateMediaFile, trashFiles, 
  restoreFiles, permanentlyDeleteFiles,
   emptyTrash,
} from "@/lib/actions/media-actions";


// ─── Types ────────────────────────────────────────────────────────────────────

type MediaType = "IMAGE" | "VIDEO" | "AUDIO" | "DOCUMENT" | "OTHER";

type MediaFile = {
  id:           string;
  filename:     string;
  originalName: string;
  url:          string;
  cloudinaryId: string | null;
  thumbnailUrl: string | null;
  type:         MediaType;
  mimeType:     string;
  width:        number | null;
  height:       number | null;
  duration:     number | null;
  alt:          string | null;
  caption:      string | null;
  description:  string | null;
  tags:         string | null;
  size:         number;
  folderId:     string | null;
  isDeleted:    boolean;
  deletedAt:    Date | null;
  createdAt:    Date;
  updatedAt:    Date;
  folder:       { id: string; name: string; color: string; slug: string } | null;
  _count:       { usedIn: number };
};

type Folder = {
  id:          string;
  name:        string;
  slug:        string;
  color:       string;
  description: string | null;
  parentId:    string | null;
  _count:      { files: number };
  children:    Folder[];
};

type Stats = {
  total:      number;
  totalSize:  number;
  last30d:    number;
  trashCount: number;
  byType:     { type: MediaType; count: number; size: number }[];
};

interface Props {
  userId:         string;
  stats:          Stats;
  initialFiles:   MediaFile[];
  fileTotal:      number;
  filePages:      number;
  folders:        Folder[];
  initialView:    "grid" | "list";
  initialType?:   string;
  initialFolder?: string;
  initialSearch?: string;
  currentPage:    number;
}

// ─── Constants ────────────────────────────────────────────────────────────────

const TYPE_CONFIG: Record<MediaType, {
  label: string; icon: React.ElementType; color: string; bg: string; accept: string;
}> = {
  IMAGE:    { label: "Images",    icon: ImageIcon, color: "#f59e0b", bg: "#fef3c7", accept: "image/*" },
  VIDEO:    { label: "Videos",    icon: Film,      color: "#8b5cf6", bg: "#ede9fe", accept: "video/*" },
  AUDIO:    { label: "Audio",     icon: Music,     color: "#10b981", bg: "#d1fae5", accept: "audio/*" },
  DOCUMENT: { label: "Documents", icon: FileText,  color: "#3b82f6", bg: "#dbeafe", accept: ".pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv" },
  OTHER:    { label: "Other",     icon: File,      color: "#64748b", bg: "#f1f5f9", accept: "*" },
};

const FOLDER_COLORS = [
  "#f59e0b", "#ef4444", "#10b981", "#3b82f6",
  "#8b5cf6", "#ec4899", "#f97316", "#06b6d4",
];

// ─── Utilities ────────────────────────────────────────────────────────────────

function formatBytes(bytes: number): string {
  if (bytes === 0) return "0 B";
  const k    = 1024;
  const sizes = ["B", "KB", "MB", "GB"];
  const i    = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

function formatDuration(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.round(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function fmtDate(d: Date | string): string {
  const date = new Date(d);
  const diff = Date.now() - date.getTime();
  const mins = Math.floor(diff / 60000);
  const hrs  = Math.floor(diff / 3600000);
  const days = Math.floor(diff / 86400000);
  if (mins < 1)  return "just now";
  if (mins < 60) return `${mins}m ago`;
  if (hrs  < 24) return `${hrs}h ago`;
  if (days < 7)  return `${days}d ago`;
  return date.toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function parseTags(raw: string | null): string[] {
  if (!raw) return [];
  try { return JSON.parse(raw); } catch { return []; }
}

// ─── File type icon ───────────────────────────────────────────────────────────

function FileTypeIcon({ type, className }: { type: MediaType; className?: string }) {
  const cfg  = TYPE_CONFIG[type];
  const Icon = cfg.icon;
  return <Icon className={className ?? "w-5 h-5"} style={{ color: cfg.color }} />;
}

// ─── File thumbnail ───────────────────────────────────────────────────────────

function FileThumbnail({
  file, size = "md",
}: {
  file: MediaFile; size?: "sm" | "md" | "lg";
}) {
  const [imgErr, setImgErr] = useState(false);
  const dim = size === "sm" ? 48 : size === "md" ? 80 : 160;
  const cfg  = TYPE_CONFIG[file.type];

  if (file.type === "IMAGE" && file.url && !imgErr) {
    return (
      <div
        className="relative overflow-hidden bg-stone-100 flex-shrink-0"
        style={{ width: dim, height: dim, borderRadius: 2 }}
      >
        <Image
          src={file.url}
          alt={file.alt ?? file.originalName}
          fill
          sizes={`${dim}px`}
          className="object-cover"
          onError={() => setImgErr(true)}
        />
      </div>
    );
  }

  return (
    <div
      className="flex items-center justify-center flex-shrink-0"
      style={{
        width: dim, height: dim, borderRadius: 2,
        backgroundColor: cfg.bg,
      }}
    >
      <FileTypeIcon type={file.type} className={
        size === "sm" ? "w-5 h-5" : size === "md" ? "w-7 h-7" : "w-12 h-12"
      } />
    </div>
  );
}

// ─── Grid card ────────────────────────────────────────────────────────────────

function GridCard({
  file, selected, onSelect, onOpen,
}: {
  file: MediaFile; selected: boolean;
  onSelect: (id: string, multi?: boolean) => void;
  onOpen: (file: MediaFile) => void;
}) {
  const [imgErr, setImgErr] = useState(false);
  const cfg = TYPE_CONFIG[file.type];
  const Icon = cfg.icon;

  return (
    <motion.div
      layout
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.95 }}
      transition={{ duration: 0.18 }}
      onClick={(e) => {
        if (e.ctrlKey || e.metaKey || e.shiftKey) {
          onSelect(file.id, true);
        } else {
          onOpen(file);
        }
      }}
      className={`group relative rounded-sm overflow-hidden cursor-pointer border-2 transition-all ${
        selected
          ? "border-amber-500 shadow-[0_0_0_3px_rgba(245,158,11,0.15)]"
          : "border-transparent hover:border-stone-200"
      }`}
    >
      {/* Checkbox */}
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(file.id, true); }}
        className={`absolute top-2 left-2 z-10 w-5 h-5 rounded border-2 flex items-center justify-center transition-all ${
          selected
            ? "bg-amber-500 border-amber-500"
            : "bg-white/80 border-stone-300 opacity-0 group-hover:opacity-100"
        }`}
      >
        {selected && <Check className="w-3 h-3 text-white" />}
      </button>

      {/* Usage badge */}
      {file._count.usedIn > 0 && (
        <div className="absolute top-2 right-2 z-10 bg-stone-900/70 text-white text-[9px] font-bold px-1.5 py-0.5 rounded-sm backdrop-blur-sm">
          {file._count.usedIn}×
        </div>
      )}

      {/* Thumbnail */}
      <div className="aspect-square bg-stone-50 overflow-hidden">
        {file.type === "IMAGE" && file.url && !imgErr ? (
          <Image
            src={file.url}
            alt={file.alt ?? file.originalName}
            width={200} height={200}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={() => setImgErr(true)}
          />
        ) : (
          <div
            className="w-full h-full flex flex-col items-center justify-center gap-2"
            style={{ backgroundColor: cfg.bg }}
          >
            {file.type === "VIDEO" ? (
              <div className="relative">
                <Icon className="w-10 h-10" style={{ color: cfg.color }} />
                <div className="absolute inset-0 flex items-center justify-center">
                  <Play className="w-4 h-4 text-white" />
                </div>
              </div>
            ) : (
              <Icon className="w-10 h-10" style={{ color: cfg.color }} />
            )}
            <span className="text-[10px] font-bold uppercase tracking-wider" style={{ color: cfg.color }}>
              {file.mimeType.split("/")[1]?.split(".").pop()?.toUpperCase() ?? file.type}
            </span>
          </div>
        )}
      </div>

      {/* Info strip */}
      <div className="bg-white border-t border-stone-100 px-2 py-2">
        <p className="text-xs font-semibold text-stone-700 truncate leading-tight">
          {file.originalName}
        </p>
        <p className="text-[10px] text-stone-400 mt-0.5 flex items-center gap-1.5">
          {formatBytes(file.size)}
          {file.width && file.height && (
            <><span className="text-stone-200">·</span>{file.width}×{file.height}</>
          )}
          {file.duration && (
            <><span className="text-stone-200">·</span>{formatDuration(file.duration)}</>
          )}
        </p>
      </div>
    </motion.div>
  );
}

// ─── List row ─────────────────────────────────────────────────────────────────

function ListRow({
  file, selected, onSelect, onOpen,
}: {
  file: MediaFile; selected: boolean;
  onSelect: (id: string, multi?: boolean) => void;
  onOpen: (file: MediaFile) => void;
}) {
  return (
    <motion.div
      layout
      initial={{ opacity: 0, x: -8 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: -8 }}
      transition={{ duration: 0.15 }}
      onClick={() => onOpen(file)}
      className={`group flex items-center gap-3 px-3 py-2.5 cursor-pointer rounded-sm transition-all border-l-2 ${
        selected
          ? "bg-amber-50 border-l-amber-500"
          : "hover:bg-stone-50 border-l-transparent"
      }`}
    >
      <button
        onClick={(e) => { e.stopPropagation(); onSelect(file.id, true); }}
        className="w-4 h-4 flex-shrink-0"
      >
        {selected
          ? <CheckSquare className="w-4 h-4 text-amber-500" />
          : <Square className="w-4 h-4 text-stone-300 group-hover:text-stone-400" />
        }
      </button>

      <FileThumbnail file={file} size="sm" />

      <div className="flex-1 min-w-0">
        <p className="text-sm font-semibold text-stone-800 truncate">{file.originalName}</p>
        <p className="text-[11px] text-stone-400 truncate">{file.alt ?? "No alt text"}</p>
      </div>

      <div className="hidden md:flex items-center gap-1.5 flex-shrink-0">
        <FileTypeIcon type={file.type} className="w-3.5 h-3.5" />
        <span className="text-xs text-stone-400">{TYPE_CONFIG[file.type].label}</span>
      </div>

      {file.folder && (
        <div
          className="hidden lg:flex items-center gap-1 text-xs px-2 py-0.5 rounded-sm flex-shrink-0"
          style={{ color: file.folder.color, backgroundColor: `${file.folder.color}18` }}
        >
          <Folder className="w-3 h-3" />
          {file.folder.name}
        </div>
      )}

      <div className="hidden xl:block text-xs text-stone-400 flex-shrink-0 w-20 text-right">
        {formatBytes(file.size)}
      </div>
      <div className="hidden xl:block text-xs text-stone-400 flex-shrink-0 w-20 text-right">
        {fmtDate(file.createdAt)}
      </div>
      {file._count.usedIn > 0 && (
        <div className="text-[10px] font-bold text-stone-400 flex-shrink-0">
          {file._count.usedIn}× used
        </div>
      )}
    </motion.div>
  );
}

// ─── Detail panel ─────────────────────────────────────────────────────────────

function DetailPanel({
  file, onClose, onTrash, onSave, isSaving,
}: {
  file:     MediaFile;
  onClose:  () => void;
  onTrash:  (id: string) => void;
  onSave:   (id: string, data: { alt?: string; caption?: string; description?: string; tags?: string[] }) => void;
  isSaving: boolean;
}) {
  const [alt,         setAlt]         = useState(file.alt         ?? "");
  const [caption,     setCaption]     = useState(file.caption     ?? "");
  const [description, setDescription] = useState(file.description ?? "");
  const [tagInput,    setTagInput]    = useState("");
  const [tags,        setTags]        = useState<string[]>(parseTags(file.tags));
  const [copied,      setCopied]      = useState(false);

  const dirty = alt !== (file.alt ?? "") ||
    caption !== (file.caption ?? "") ||
    description !== (file.description ?? "") ||
    JSON.stringify(tags) !== JSON.stringify(parseTags(file.tags));

  const handleCopy = () => {
    navigator.clipboard.writeText(file.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const addTag = () => {
    const t = tagInput.trim().toLowerCase();
    if (t && !tags.includes(t)) { setTags([...tags, t]); }
    setTagInput("");
  };

  return (
    <motion.div
      initial={{ opacity: 0, x: 20 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 20 }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-full bg-white border-l border-stone-100 overflow-hidden"
    >
      {/* Header */}
      <div className="flex items-center justify-between gap-2 px-4 py-3 border-b border-stone-100 flex-shrink-0">
        <button onClick={onClose} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
          <ArrowLeft className="w-3.5 h-3.5" />Back
        </button>
        <div className="flex items-center gap-1.5">
          <a href={file.url} target="_blank" rel="noopener noreferrer"
            className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm transition-colors">
            <ExternalLink className="w-3.5 h-3.5" />
          </a>
          <button onClick={handleCopy}
            className="flex items-center gap-1.5 text-xs font-semibold text-stone-600 border border-stone-200 hover:border-stone-400 px-2.5 py-1.5 rounded-sm transition-colors">
            {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            {copied ? "Copied!" : "Copy URL"}
          </button>
          <button onClick={() => onTrash(file.id)}
            className="w-7 h-7 flex items-center justify-center text-red-400 hover:bg-red-50 rounded-sm transition-colors">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto">

        {/* Preview */}
        <div className="bg-stone-50 border-b border-stone-100 p-4 flex items-center justify-center" style={{ minHeight: 160 }}>
          {file.type === "IMAGE" ? (
            <Image
              src={file.url} alt={file.alt ?? file.originalName}
              width={280} height={200}
              className="max-h-48 max-w-full object-contain rounded-sm shadow-sm"
            />
          ) : file.type === "VIDEO" ? (
            <video src={file.url} controls className="max-h-48 max-w-full rounded-sm shadow-sm" />
          ) : file.type === "AUDIO" ? (
            <div className="w-full">
              <div className="flex justify-center mb-3">
                <div className="w-16 h-16 rounded-full bg-emerald-50 flex items-center justify-center">
                  <Music className="w-8 h-8 text-emerald-500" />
                </div>
              </div>
              <audio src={file.url} controls className="w-full" />
            </div>
          ) : (
            <FileThumbnail file={file} size="lg" />
          )}
        </div>

        <div className="p-4 space-y-4">
          {/* File info */}
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">File Info</p>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: "Name",     value: file.originalName },
                { label: "Type",     value: TYPE_CONFIG[file.type].label },
                { label: "Size",     value: formatBytes(file.size) },
                { label: "MIME",     value: file.mimeType },
                ...(file.width && file.height
                  ? [{ label: "Dimensions", value: `${file.width} × ${file.height}` }]
                  : []),
                ...(file.duration
                  ? [{ label: "Duration", value: formatDuration(file.duration) }]
                  : []),
                { label: "Uploaded", value: fmtDate(file.createdAt) },
                { label: "Used in",  value: `${file._count?.usedIn ?? 0} place(s)` },
              ].map((m) => (
                <div key={m.label} className="bg-stone-50 rounded-sm p-2">
                  <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">{m.label}</p>
                  <p className="text-xs font-medium text-stone-700 truncate mt-0.5">{m.value}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Alt text */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
              Alt Text <span className="text-amber-500">*</span>
            </label>
            <input
              value={alt} onChange={(e) => setAlt(e.target.value)}
              placeholder="Describe this image for accessibility..."
              className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
            />
          </div>

          {/* Caption */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Caption</label>
            <input
              value={caption} onChange={(e) => setCaption(e.target.value)}
              placeholder="Optional caption..."
              className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white"
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Description</label>
            <textarea
              value={description} onChange={(e) => setDescription(e.target.value)}
              rows={3} placeholder="Longer description..."
              className="w-full text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white resize-none"
            />
          </div>

          {/* Tags */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Tags</label>
            <div className="flex gap-1.5 flex-wrap mb-2">
              {tags.map((tag) => (
                <span key={tag} className="inline-flex items-center gap-1 text-[10px] font-semibold bg-amber-50 text-amber-700 border border-amber-200 px-2 py-0.5 rounded-sm">
                  {tag}
                  <button onClick={() => setTags(tags.filter((t) => t !== tag))} className="hover:text-red-500 transition-colors">
                    <X className="w-2.5 h-2.5" />
                  </button>
                </span>
              ))}
            </div>
            <div className="flex gap-1.5">
              <input
                value={tagInput} onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTag(); }}}
                placeholder="Add tag..."
                className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-1.5 focus:outline-none focus:border-amber-400"
              />
              <button onClick={addTag} className="text-xs font-bold text-amber-600 border border-amber-200 px-2.5 py-1.5 rounded-sm hover:bg-amber-50 transition-colors">
                <Plus className="w-3.5 h-3.5" />
              </button>
            </div>
          </div>

          {/* URL */}
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">URL</label>
            <div className="flex gap-1.5">
              <input
                readOnly value={file.url}
                className="flex-1 text-[11px] text-stone-500 border border-stone-200 rounded-sm px-3 py-2 bg-stone-50 font-mono truncate"
              />
              <button onClick={handleCopy}
                className="w-8 h-8 flex items-center justify-center border border-stone-200 rounded-sm hover:border-amber-400 transition-colors text-stone-400 hover:text-amber-600">
                {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save footer */}
      <div className="border-t border-stone-100 px-4 py-3 flex-shrink-0">
        <button
          onClick={() => onSave(file.id, { alt, caption, description, tags })}
          disabled={!dirty || isSaving}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold bg-amber-500 hover:bg-amber-600 text-white py-2.5 rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
        >
          {isSaving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
          {isSaving ? "Saving…" : dirty ? "Save changes" : "No changes"}
        </button>
      </div>
    </motion.div>
  );
}
// ─── Upload dropzone ──────────────────────────────────────────────────────────

function UploadDropzone({
  onFilesAdded, uploading, progress, folderId,
}: {
  onFilesAdded: (files: File[], folderId?: string) => void;
  uploading:    boolean;
  progress:     { name: string; pct: number; done: boolean; error?: string }[];
  folderId?:    string;
}) {
  const [dragging, setDragging] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragging(false);
    const files = Array.from(e.dataTransfer.files);
    if (files.length) onFilesAdded(files, folderId);
  };

  return (
    <div className="space-y-3">
      <div
        onDragEnter={(e) => { e.preventDefault(); setDragging(true); }}
        onDragOver={(e) => { e.preventDefault(); setDragging(true); }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => !uploading && inputRef.current?.click()}
        className={`border-2 border-dashed rounded-sm p-8 text-center cursor-pointer transition-all ${
          dragging
            ? "border-amber-400 bg-amber-50"
            : uploading
            ? "border-stone-200 bg-stone-50 cursor-not-allowed"
            : "border-stone-200 hover:border-amber-400 hover:bg-amber-50/30"
        }`}
      >
        <input
          ref={inputRef}
          type="file"
          multiple
          accept="image/*,video/*,audio/*,.pdf,.doc,.docx,.ppt,.pptx,.xls,.xlsx,.txt,.csv"
          className="hidden"
          onChange={(e) => {
            const files = Array.from(e.target.files ?? []);
            if (files.length) onFilesAdded(files, folderId);
            e.target.value = "";
          }}
        />

        {uploading ? (
          <div className="flex flex-col items-center gap-2">
            <Loader2 className="w-8 h-8 text-amber-500 animate-spin" />
            <p className="text-sm font-semibold text-stone-600">Uploading…</p>
          </div>
        ) : (
          <>
            <div className="w-12 h-12 rounded-full bg-amber-50 border border-amber-200 flex items-center justify-center mx-auto mb-3">
              <Upload className="w-6 h-6 text-amber-500" />
            </div>
            <p className="text-sm font-bold text-stone-700 mb-1">
              {dragging ? "Drop files here" : "Drag files here or click to browse"}
            </p>
            <p className="text-xs text-stone-400">
              Images, videos, audio, PDFs · Max 50 MB per file
            </p>
          </>
        )}
      </div>

      {/* Progress list */}
      {progress.length > 0 && (
        <div className="space-y-1.5 max-h-40 overflow-y-auto">
          {progress.map((p, i) => (
            <div key={i} className="bg-stone-50 border border-stone-100 rounded-sm p-2.5">
              <div className="flex items-center justify-between gap-2 mb-1">
                <span className="text-xs font-medium text-stone-700 truncate">{p.name}</span>
                {p.error ? (
                  <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                ) : p.done ? (
                  <Check className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                ) : (
                  <span className="text-[10px] text-stone-400">{p.pct}%</span>
                )}
              </div>
              {!p.done && !p.error && (
                <div className="h-1 bg-stone-200 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-amber-400 rounded-full transition-all duration-300"
                    style={{ width: `${p.pct}%` }}
                  />
                </div>
              )}
              {p.error && <p className="text-[10px] text-red-500 mt-0.5">{p.error}</p>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Create folder modal ──────────────────────────────────────────────────────

function CreateFolderModal({
  open, onClose, onCreate,
}: {
  open:     boolean;
  onClose:  () => void;
  onCreate: (name: string, color: string, description: string) => void;
}) {
  const [name,  setName]  = useState("");
  const [desc,  setDesc]  = useState("");
  const [color, setColor] = useState(FOLDER_COLORS[0]);

  const handleCreate = () => {
    if (!name.trim()) return;
    onCreate(name.trim(), color, desc.trim());
    setName(""); setDesc(""); setColor(FOLDER_COLORS[0]);
  };

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 backdrop-blur-sm"
          onClick={onClose}
        >
          <motion.div
            initial={{ scale: 0.95, y: 8 }} animate={{ scale: 1, y: 0 }} exit={{ scale: 0.95 }}
            className="bg-white rounded-sm border border-stone-100 shadow-2xl p-6 max-w-sm w-full mx-4"
            onClick={(e) => e.stopPropagation()}
          >
            <h3 className="text-sm font-black text-stone-900 mb-4">New Folder</h3>
            <div className="space-y-3">
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Name</label>
                <input
                  value={name} onChange={(e) => setName(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleCreate()}
                  placeholder="e.g. Blog Images"
                  autoFocus
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1">Description</label>
                <input
                  value={desc} onChange={(e) => setDesc(e.target.value)}
                  placeholder="Optional description"
                  className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
                />
              </div>
              <div>
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">Colour</label>
                <div className="flex gap-2">
                  {FOLDER_COLORS.map((c) => (
                    <button
                      key={c} onClick={() => setColor(c)}
                      className={`w-6 h-6 rounded-full transition-transform ${color === c ? "scale-125 ring-2 ring-offset-1 ring-stone-400" : ""}`}
                      style={{ backgroundColor: c }}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="flex gap-2 mt-5">
              <button onClick={onClose}
                className="flex-1 text-xs font-semibold text-stone-500 border border-stone-200 py-2.5 rounded-sm hover:border-stone-400 transition-colors">
                Cancel
              </button>
              <button onClick={handleCreate} disabled={!name.trim()}
                className="flex-1 text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 py-2.5 rounded-sm transition-colors disabled:opacity-40">
                Create Folder
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

// ─── Confirm dialog ───────────────────────────────────────────────────────────

function ConfirmDialog({
  open, title, message, confirmLabel = "Confirm", danger = false,
  onConfirm, onCancel, loading,
}: {
  open: boolean; title: string; message: string;
  confirmLabel?: string; danger?: boolean;
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
            className="bg-white rounded-sm shadow-2xl border border-stone-100 p-6 max-w-sm w-full mx-4"
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
                className={`text-xs font-bold text-white px-4 py-2 rounded-sm transition-colors disabled:opacity-60 flex items-center gap-2 ${
                  danger ? "bg-red-500 hover:bg-red-600" : "bg-amber-500 hover:bg-amber-600"
                }`}
              >
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
// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — MediaLibraryClient
// ─────────────────────────────────────────────────────────────────────────────

export function MediaLibraryClient({
  stats, initialFiles, fileTotal, filePages,
  folders: initialFolders, initialView, initialType,
  initialFolder, initialSearch, currentPage,
}: Props) {
//   const [isPending, startTransition] = useTransition();

  // ── Core state ───────────────────────────────────────────────────────────
  const [files,       setFiles]       = useState<MediaFile[]>(initialFiles);
  const [folders,     setFolders]     = useState<Folder[]>(initialFolders);
  const [total,       setTotal]       = useState(fileTotal);
  const [view,        setView]        = useState<"grid" | "list">(initialView);
  const [activeType,  setActiveType]  = useState<string>(initialType ?? "ALL");
  const [activeFolder,setActiveFolder]= useState<string | undefined>(initialFolder);
  const [search,      setSearch]      = useState(initialSearch ?? "");
  const [sortBy,      setSortBy]      = useState("createdAt_desc");
  const [page,        setPage]        = useState(currentPage);
  const [activeTab,   setActiveTab]   = useState<"library" | "upload" | "trash">("library");
  const [statsData,   setStatsData]   = useState(stats);

  // ── Selection ────────────────────────────────────────────────────────────
  const [selected,  setSelected]  = useState<Set<string>>(new Set());
  const [activeFile,setActiveFile]= useState<MediaFile | null>(null);

  // ── Upload state ─────────────────────────────────────────────────────────
  const [uploading, setUploading] = useState(false);
  const [progress,  setProgress]  = useState<{ name: string; pct: number; done: boolean; error?: string }[]>([]);

  // ── Trash state ──────────────────────────────────────────────────────────
  const [trashFiles_,  setTrashFiles_]  = useState<MediaFile[]>([]);
  const [trashLoaded,  setTrashLoaded]  = useState(false);
  const [trashLoading, setTrashLoading] = useState(false);

  // ── Modals ───────────────────────────────────────────────────────────────
  const [showFolderModal,  setShowFolderModal]  = useState(false);
  const [confirmState,     setConfirmState]     = useState<{
    open: boolean; title: string; message: string; danger?: boolean;
    confirmLabel?: string; action?: () => Promise<void>;
  }>({ open: false, title: "", message: "" });
  const [confirmLoading,   setConfirmLoading]   = useState(false);
  const [isSaving,         setIsSaving]         = useState(false);

  // ── Fetch files ───────────────────────────────────────────────────────────
  const fetchFiles = useCallback(async (opts?: {
    type?: string; folder?: string; q?: string; sort?: string; pg?: number;
  }) => {
    const t  = opts?.type   ?? activeType;
    const f  = opts?.folder ?? activeFolder;
    const q  = opts?.q      ?? search;
    const s  = opts?.sort   ?? sortBy;
    const pg = opts?.pg     ?? page;

    const params = new URLSearchParams();
    if (t && t !== "ALL") params.set("type", t);
    if (f) params.set("folderId", f);
    if (q) params.set("search", q);
    const [sortField, sortDir] = s.split("_");
    params.set("sortBy", sortField);
    params.set("sortOrder", sortDir);
    params.set("page", String(pg));
    params.set("pageSize", "40");

    const res  = await fetch(`/api/admin/media/files?${params}`);
    const data = await res.json();
    setFiles(data.files ?? []);
    setTotal(data.total ?? 0);
  }, [activeType, activeFolder, search, sortBy, page]);

  // ── Upload handler ────────────────────────────────────────────────────────
  const handleUpload = useCallback(async (newFiles: File[], folderId?: string) => {
    setUploading(true);
    const initial = newFiles.map((f) => ({ name: f.name, pct: 0, done: false }));
    setProgress(initial);

    for (let i = 0; i < newFiles.length; i++) {
      const file = newFiles[i];
      const fd   = new FormData();
      fd.append("file", file);
      if (folderId) fd.append("folderId", folderId);

      // Update progress: in-progress
      setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, pct: 30 } : p));

      try {
        const res  = await fetch("/api/admin/media/upload", { method: "POST", body: fd });
        const data = await res.json();

        if (res.ok) {
          setProgress((prev) => prev.map((p, idx) => idx === i ? { ...p, pct: 100, done: true } : p));
          // Prepend the new file to the list
          setFiles((prev) => [data.file, ...prev]);
          setTotal((t) => t + 1);
        } else {
          setProgress((prev) => prev.map((p, idx) => idx === i
            ? { ...p, pct: 0, done: false, error: data.error ?? "Upload failed" }
            : p));
        }
      } catch (err: unknown) {
        console.error("Upload error:", err);
        setProgress((prev) => prev.map((p, idx) => idx === i
          ? { ...p, pct: 0, done: false, error: "Network error" }
          : p));
      }
    }

    setUploading(false);
    // Refresh stats
    setTimeout(() => fetchFiles(), 500);
  }, [fetchFiles]);

  // ── Selection helpers ─────────────────────────────────────────────────────
  const handleSelect = useCallback((id: string, multi = false) => {
    setSelected((prev) => {
      const n = new Set(multi ? prev : []);
      if (prev.has(id)) {
        n.delete(id);
      } else {
        n.add(id);
      }
      return n;
    });
  }, []);

  const handleSelectAll = () => {
    setSelected(selected.size === files.length ? new Set() : new Set(files.map((f) => f.id)));
  };

  // ── Trash selected ────────────────────────────────────────────────────────
  const handleTrash = useCallback((ids: string[]) => {
    setConfirmState({
      open:         true,
      title:        `Move ${ids.length} file(s) to trash?`,
      message:      "Files will be moved to trash and can be restored or permanently deleted.",
      confirmLabel: "Move to Trash",
      action:       async () => {
        await trashFiles(ids);
        setFiles((prev) => prev.filter((f) => !ids.includes(f.id)));
        setTotal((t) => t - ids.length);
        setSelected(new Set());
        if (activeFile && ids.includes(activeFile.id)) setActiveFile(null);
        setStatsData((s) => ({ ...s, total: s.total - ids.length, trashCount: s.trashCount + ids.length }));
      },
    });
  }, [activeFile]);

  // ── Save metadata ─────────────────────────────────────────────────────────
  const handleSave = useCallback(async (id: string, data: { alt?: string; caption?: string; description?: string; tags?: string[] }) => {
    setIsSaving(true);
    await updateMediaFile(id, data);
    setFiles((prev) => prev.map((f) => f.id === id ? { ...f, ...data, tags: JSON.stringify(data.tags ?? []) } : f));
    if (activeFile?.id === id) setActiveFile((f) => f ? { ...f, ...data, tags: JSON.stringify(data.tags ?? []) } : f);
    setIsSaving(false);
  }, [activeFile]);

  // ── Load trash ────────────────────────────────────────────────────────────
  const loadTrash = useCallback(async () => {
    if (trashLoaded) return;
    setTrashLoading(true);
    const res  = await fetch("/api/admin/media/trash");
    const data = await res.json();
    setTrashFiles_(data.files ?? []);
    setTrashLoaded(true);
    setTrashLoading(false);
  }, [trashLoaded]);

  // ── Handle tab switch ─────────────────────────────────────────────────────
  const handleTabSwitch = (tab: typeof activeTab) => {
    setActiveTab(tab);
    setActiveFile(null);
    setSelected(new Set());
    if (tab === "trash" && !trashLoaded) loadTrash();
  };

  // ── Confirm handler ───────────────────────────────────────────────────────
  const runConfirm = async () => {
    if (!confirmState.action) return;
    setConfirmLoading(true);
    await confirmState.action();
    setConfirmState((s) => ({ ...s, open: false }));
    setConfirmLoading(false);
  };

  // ── Type filter tabs ──────────────────────────────────────────────────────
  const typeTabs = [
    { id: "ALL", label: "All", count: statsData.total },
    ...Object.entries(TYPE_CONFIG).map(([type, cfg]) => ({
      id:    type,
      label: cfg.label,
      count: statsData.byType.find((b) => b.type === type)?.count ?? 0,
    })),
  ];

  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="flex flex-col h-full overflow-y-auto">

      <ConfirmDialog
        open={confirmState.open}
        title={confirmState.title}
        message={confirmState.message}
        confirmLabel={confirmState.confirmLabel}
        danger={confirmState.danger}
        onConfirm={runConfirm}
        onCancel={() => setConfirmState((s) => ({ ...s, open: false }))}
        loading={confirmLoading}
      />

      <CreateFolderModal
        open={showFolderModal}
        onClose={() => setShowFolderModal(false)}
        onCreate={async (name, color, description) => {
          const res  = await fetch("/api/admin/media/folders", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ name, color, description }),
          });
          const data = await res.json();
          if (data.folder) setFolders((prev) => [...prev, { ...data.folder, _count: { files: 0 }, children: [] }]);
          setShowFolderModal(false);
        }}
      />

      {/* ── PAGE HEADER ───────────────────────────────────────────────── */}
      <div className="px-6 pt-6 pb-4 border-b border-stone-100">
        <div className="flex items-start justify-between gap-4 flex-wrap">
          <div>
            <h1 className="text-2xl font-black text-stone-900">Media Library</h1>
            <p className="text-sm text-stone-400 mt-0.5">
              {statsData.total.toLocaleString()} files · {formatBytes(statsData.totalSize)} stored
            </p>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => { setActiveTab("upload"); setActiveFile(null); }}
              className="flex items-center gap-2 text-sm font-bold text-white bg-amber-500 hover:bg-amber-600 px-4 py-2.5 rounded-sm transition-colors shadow-sm"
            >
              <Upload className="w-4 h-4" />Upload Files
            </button>
          </div>
        </div>

        {/* ── STAT CARDS ──────────────────────────────────────────────── */}
        <div className="grid grid-cols-2 md:grid-cols-4 xl:grid-cols-5 gap-3 mt-4">
          {[
            { label: "Total Files",   value: statsData.total.toLocaleString(),     icon: LayoutGrid,  color: "#f59e0b" },
            { label: "Total Storage", value: formatBytes(statsData.totalSize),     icon: HardDrive,   color: "#3b82f6" },
            { label: "Images",        value: (statsData.byType.find(b=>b.type==="IMAGE")?.count    ?? 0).toString(), icon: ImageIcon, color: "#f59e0b" },
            { label: "Videos",        value: (statsData.byType.find(b=>b.type==="VIDEO")?.count    ?? 0).toString(), icon: Film,      color: "#8b5cf6" },
            { label: "In Trash",      value: statsData.trashCount.toString(),      icon: Trash2,      color: "#ef4444" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-3.5">
              <s.icon className="w-4 h-4 mb-2" style={{ color: s.color }} />
              <p className="text-xl font-black text-stone-900">{s.value}</p>
              <p className="text-[11px] font-semibold text-stone-400 mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>

        {/* ── TABS ────────────────────────────────────────────────────── */}
        <div className="flex items-center gap-1 mt-4">
          {(["library", "upload", "trash"] as const).map((t) => (
            <button key={t} onClick={() => handleTabSwitch(t)}
              className={`flex items-center gap-2 px-4 py-2.5 text-sm font-semibold border-b-2 capitalize transition-all ${
                activeTab === t
                  ? "border-amber-500 text-amber-600"
                  : "border-transparent text-stone-400 hover:text-stone-700"
              }`}
            >
              {t === "library" && <LayoutGrid className="w-4 h-4" />}
              {t === "upload"  && <Upload className="w-4 h-4" />}
              {t === "trash"   && <Trash2 className="w-4 h-4" />}
              {t.charAt(0).toUpperCase() + t.slice(1)}
              {t === "trash" && statsData.trashCount > 0 && (
                <span className="text-[10px] font-bold bg-red-100 text-red-600 px-1.5 py-0.5 rounded-sm">
                  {statsData.trashCount}
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* ════════════════════════════════════════════════════════════════
          TAB: UPLOAD
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "upload" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="max-w-2xl">
            <h2 className="text-sm font-black text-stone-700 mb-1">Upload files</h2>
            <p className="text-xs text-stone-400 mb-4">
              Supports images, video, audio, PDFs and office documents. Max 50 MB per file.
            </p>

            {folders.length > 0 && (
              <div className="mb-4">
                <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">
                  Upload to folder (optional)
                </label>
                <select
                  id="upload-folder"
                  className="text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white text-stone-700 w-full max-w-xs"
                  defaultValue=""
                >
                  <option value="">No folder (root)</option>
                  {folders.map((f) => (
                    <option key={f.id} value={f.id}>{f.name}</option>
                  ))}
                </select>
              </div>
            )}

            <UploadDropzone
              uploading={uploading}
              progress={progress}
              folderId={undefined}
              onFilesAdded={(files) => {
                const sel = (document.getElementById("upload-folder") as HTMLSelectElement)?.value || undefined;
                handleUpload(files, sel || undefined);
              }}
            />

            {progress.some((p) => p.done) && (
              <button
                onClick={() => { setActiveTab("library"); setProgress([]); }}
                className="mt-4 flex items-center gap-2 text-sm font-bold text-amber-600 hover:text-amber-800 underline underline-offset-2"
              >
                <LayoutGrid className="w-4 h-4" />View in Library
              </button>
            )}
          </div>
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: TRASH
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "trash" && (
        <div className="flex-1 overflow-y-auto p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-sm font-black text-stone-700">Trash</h2>
              <p className="text-xs text-stone-400 mt-0.5">{statsData.trashCount} file(s) in trash</p>
            </div>
            {trashFiles_.length > 0 && (
              <button
                onClick={() => setConfirmState({
                  open:         true,
                  title:        "Empty trash permanently?",
                  message:      `This will permanently delete all ${statsData.trashCount} trashed files from Cloudinary and the database. This cannot be undone.`,
                  danger:       true,
                  confirmLabel: "Empty Trash",
                  action:       async () => {
                    await emptyTrash();
                    setTrashFiles_([]);
                    setTrashLoaded(false);
                    setStatsData((s) => ({ ...s, trashCount: 0 }));
                  },
                })}
                className="flex items-center gap-2 text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-sm transition-colors"
              >
                <Trash2 className="w-3.5 h-3.5" />Empty Trash
              </button>
            )}
          </div>

          {trashLoading ? (
            <div className="flex items-center gap-2 text-sm text-stone-400 py-8">
              <Loader2 className="w-4 h-4 animate-spin" />Loading trash…
            </div>
          ) : trashFiles_.length === 0 ? (
            <div className="flex flex-col items-center py-16 text-center">
              <Trash2 className="w-10 h-10 text-stone-200 mb-3" />
              <p className="text-sm text-stone-400 font-medium">Trash is empty</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-6 gap-3">
              {trashFiles_.map((f) => (
                <div key={f.id} className="group relative border border-stone-100 rounded-sm overflow-hidden">
                  <div className="aspect-square bg-stone-50 flex items-center justify-center">
                    {f.type === "IMAGE" ? (
                      <Image src={f.url} alt={f.originalName} width={120} height={120} className="w-full h-full object-cover opacity-50" />
                    ) : (
                      <FileTypeIcon type={f.type} className="w-8 h-8 opacity-50" />
                    )}
                  </div>
                  <div className="p-2">
                    <p className="text-[10px] text-stone-500 truncate font-medium">{f.originalName}</p>
                    <p className="text-[9px] text-stone-300 mt-0.5">{f.deletedAt ? fmtDate(f.deletedAt) : "—"}</p>
                  </div>
                  <div className="absolute inset-0 bg-stone-900/0 group-hover:bg-stone-900/40 transition-colors flex items-center justify-center opacity-0 group-hover:opacity-100">
                    <div className="flex gap-1.5">
                      <button
                        onClick={() => {
                          restoreFiles([f.id]);
                          setTrashFiles_((prev) => prev.filter((x) => x.id !== f.id));
                          setStatsData((s) => ({ ...s, total: s.total + 1, trashCount: s.trashCount - 1 }));
                        }}
                        className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-emerald-600 hover:bg-emerald-50 transition-colors shadow"
                        title="Restore"
                      >
                        <RotateCcw className="w-3.5 h-3.5" />
                      </button>
                      <button
                        onClick={() => setConfirmState({
                          open: true,
                          title: "Permanently delete?",
                          message: `"${f.originalName}" will be removed from Cloudinary and cannot be recovered.`,
                          danger: true,
                          confirmLabel: "Delete Forever",
                          action: async () => {
                            await permanentlyDeleteFiles([f.id]);
                            setTrashFiles_((prev) => prev.filter((x) => x.id !== f.id));
                            setStatsData((s) => ({ ...s, trashCount: s.trashCount - 1 }));
                          },
                        })}
                        className="w-8 h-8 bg-white rounded-sm flex items-center justify-center text-red-500 hover:bg-red-50 transition-colors shadow"
                        title="Delete forever"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {/* ════════════════════════════════════════════════════════════════
          TAB: LIBRARY
      ════════════════════════════════════════════════════════════════ */}
      {activeTab === "library" && (
        <div className={`flex flex-1 overflow-hidden ${activeFile ? "" : ""}`}>

          {/* ── LEFT: Sidebar (folders + type filters) ──────────────── */}
          <div className="w-52 flex-shrink-0 border-r border-stone-100 overflow-y-auto bg-stone-50/50">
            <div className="p-3">

              {/* Type filters */}
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest px-2 mb-1.5 mt-1">Type</p>
              {typeTabs.map((t) => (
                <button
                  key={t.id}
                  onClick={() => {
                    setActiveType(t.id);
                    setPage(1);
                    fetchFiles({ type: t.id, pg: 1 });
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm text-left transition-colors ${
                    activeType === t.id
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-500 hover:bg-white hover:text-stone-800"
                  }`}
                >
                  <span className="text-xs font-semibold">{t.label}</span>
                  <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded-sm ${
                    activeType === t.id ? "bg-amber-200/60 text-amber-700" : "bg-stone-200 text-stone-500"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}

              {/* Folders */}
              <div className="flex items-center justify-between px-2 mt-4 mb-1.5">
                <p className="text-[9px] font-black text-stone-400 uppercase tracking-widest">Folders</p>
                <button
                  onClick={() => setShowFolderModal(true)}
                  className="w-5 h-5 flex items-center justify-center rounded-sm text-stone-400 hover:text-amber-600 hover:bg-amber-50 transition-colors"
                >
                  <Plus className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* All files */}
              <button
                onClick={() => {
                  setActiveFolder(undefined);
                  fetchFiles({ folder: undefined, pg: 1 });
                  setPage(1);
                }}
                className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm text-left transition-colors ${
                  activeFolder === undefined
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-500 hover:bg-white hover:text-stone-800"
                }`}
              >
                <span className="flex items-center gap-2 text-xs font-semibold">
                  <FolderOpen className="w-3.5 h-3.5" />All Files
                </span>
                <span className="text-[10px] font-bold bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded-sm">
                  {statsData.total}
                </span>
              </button>

              {/* Unfiled */}
              <button
                onClick={() => {
                  setActiveFolder("unfiled");
                  fetchFiles({ folder: "unfiled", pg: 1 });
                  setPage(1);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-2 rounded-sm text-left transition-colors text-xs font-semibold ${
                  activeFolder === "unfiled"
                    ? "bg-amber-50 text-amber-700"
                    : "text-stone-500 hover:bg-white hover:text-stone-800"
                }`}
              >
                <Folder className="w-3.5 h-3.5" />Unfiled
              </button>

              {/* User folders */}
              {folders.map((folder) => (
                <button
                  key={folder.id}
                  onClick={() => {
                    setActiveFolder(folder.id);
                    fetchFiles({ folder: folder.id, pg: 1 });
                    setPage(1);
                  }}
                  className={`w-full flex items-center justify-between gap-2 px-2.5 py-2 rounded-sm text-left transition-colors ${
                    activeFolder === folder.id
                      ? "bg-amber-50 text-amber-700"
                      : "text-stone-500 hover:bg-white hover:text-stone-800"
                  }`}
                >
                  <span className="flex items-center gap-2 text-xs font-semibold truncate">
                    <div className="w-2.5 h-2.5 rounded-sm flex-shrink-0" style={{ backgroundColor: folder.color }} />
                    <span className="truncate">{folder.name}</span>
                  </span>
                  <span className="text-[10px] font-bold bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded-sm flex-shrink-0">
                    {folder._count.files}
                  </span>
                </button>
              ))}
            </div>
          </div>

          {/* ── CENTER: File grid / list ─────────────────────────────── */}
          <div className="flex-1 flex flex-col overflow-hidden">

            {/* Toolbar */}
            <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-white flex-wrap">
              {/* Search */}
              <div className="relative flex-1 min-w-[180px] max-w-xs">
                <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
                <input
                  value={search}
                  onChange={(e) => {
                    setSearch(e.target.value);
                    fetchFiles({ q: e.target.value, pg: 1 });
                    setPage(1);
                  }}
                  placeholder="Search files…"
                  className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400 bg-white"
                />
              </div>

              {/* Sort */}
              <select
                value={sortBy}
                onChange={(e) => {
                  setSortBy(e.target.value);
                  fetchFiles({ sort: e.target.value, pg: 1 });
                  setPage(1);
                }}
                className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none bg-white text-stone-600"
              >
                <option value="createdAt_desc">Newest first</option>
                <option value="createdAt_asc">Oldest first</option>
                <option value="size_desc">Largest first</option>
                <option value="size_asc">Smallest first</option>
                <option value="filename_asc">Name A–Z</option>
                <option value="filename_desc">Name Z–A</option>
              </select>

              {/* Bulk actions */}
              {selected.size > 0 && (
                <>
                  <div className="flex items-center gap-1.5 ml-2 pl-2 border-l border-stone-200">
                    <span className="text-xs font-semibold text-stone-600">{selected.size} selected</span>
                    <button
                      onClick={() => handleTrash([...selected])}
                      className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-2.5 py-1.5 rounded-sm flex items-center gap-1.5 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" />Trash
                    </button>
                    <button
                      onClick={() => setSelected(new Set())}
                      className="text-xs text-stone-400 hover:text-stone-700 px-1.5 py-1.5 transition-colors"
                    >
                      Clear
                    </button>
                  </div>
                </>
              )}

              {/* View toggle */}
              <div className="flex items-center gap-0.5 border border-stone-200 rounded-sm p-0.5 ml-auto">
                <button onClick={() => setView("grid")}
                  className={`p-1.5 rounded-sm transition-colors ${view === "grid" ? "bg-amber-100 text-amber-600" : "text-stone-400 hover:text-stone-700"}`}>
                  <Grid3x3 className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setView("list")}
                  className={`p-1.5 rounded-sm transition-colors ${view === "list" ? "bg-amber-100 text-amber-600" : "text-stone-400 hover:text-stone-700"}`}>
                  <List className="w-3.5 h-3.5" />
                </button>
              </div>
            </div>

            {/* Count row */}
            <div className="flex items-center gap-3 px-4 py-2 border-b border-stone-50 bg-stone-50/50">
              <button onClick={handleSelectAll} className="text-[11px] text-stone-400 hover:text-stone-700 flex items-center gap-1.5">
                {selected.size === files.length && files.length > 0
                  ? <CheckSquare className="w-3.5 h-3.5 text-amber-500" />
                  : <Square className="w-3.5 h-3.5" />
                }
                Select all
              </button>
              <span className="text-[11px] text-stone-400">
                {total.toLocaleString()} file{total !== 1 ? "s" : ""}
                {search && <> matching <strong className="text-stone-600">&#34;{search}&#34;</strong></>}
              </span>
            </div>

            {/* File grid / list */}
            <div className="flex-1 overflow-y-auto p-4">
              {files.length === 0 ? (
                <div className="flex flex-col items-center justify-center py-20 text-center">
                  <ImageIcon className="w-10 h-10 text-stone-200 mb-3" />
                  <p className="text-sm text-stone-400 font-medium">
                    {search ? `No files match "${search}"` : "No files here yet"}
                  </p>
                  <button
                    onClick={() => setActiveTab("upload")}
                    className="mt-3 text-xs text-amber-600 hover:text-amber-800 font-semibold underline underline-offset-2"
                  >
                    Upload your first file
                  </button>
                </div>
              ) : view === "grid" ? (
                <motion.div
                  layout
                  className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 xl:grid-cols-5 2xl:grid-cols-6 gap-3"
                >
                  <AnimatePresence>
                    {files.map((f) => (
                      <GridCard
                        key={f.id}
                        file={f}
                        selected={selected.has(f.id)}
                        onSelect={handleSelect}
                        onOpen={setActiveFile}
                      />
                    ))}
                  </AnimatePresence>
                </motion.div>
              ) : (
                <div className="divide-y divide-stone-50">
                  {/* List header */}
                  <div className="hidden xl:grid grid-cols-[2fr_1fr_1fr_1fr_1fr] gap-3 px-3 py-2 text-[10px] font-black text-stone-400 uppercase tracking-wider">
                    <span>File</span><span>Type</span><span>Folder</span><span>Size</span><span>Uploaded</span>
                  </div>
                  <AnimatePresence>
                    {files.map((f) => (
                      <ListRow
                        key={f.id}
                        file={f}
                        selected={selected.has(f.id)}
                        onSelect={handleSelect}
                        onOpen={setActiveFile}
                      />
                    ))}
                  </AnimatePresence>
                </div>
              )}

              {/* Pagination */}
              {filePages > 1 && (
                <div className="flex items-center justify-center gap-2 mt-6 pb-2">
                  <button
                    disabled={page <= 1}
                    onClick={() => { setPage(page - 1); fetchFiles({ pg: page - 1 }); }}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors"
                  >
                    ← Prev
                  </button>
                  <span className="text-xs text-stone-400">
                    Page {page} of {filePages}
                  </span>
                  <button
                    disabled={page >= filePages}
                    onClick={() => { setPage(page + 1); fetchFiles({ pg: page + 1 }); }}
                    className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors"
                  >
                    Next →
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* ── RIGHT: Detail panel ──────────────────────────────────── */}
          <AnimatePresence>
            {activeFile && (
              <div className="w-72 xl:w-80 flex-shrink-0 overflow-hidden border-l border-stone-100">
                <DetailPanel
                  file={activeFile}
                  onClose={() => setActiveFile(null)}
                  onTrash={(id) => handleTrash([id])}
                  onSave={handleSave}
                  isSaving={isSaving}
                />
              </div>
            )}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
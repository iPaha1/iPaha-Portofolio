// components/debt/EvidenceUploader.tsx
"use client";

import { useRef, useState } from "react";

interface UploadResult {
  url:      string;
  publicId: string;
}

interface Props {
  onUploaded: (result: UploadResult) => void;
  label?:     string;
  existing?:  string | null;
}

export function EvidenceUploader({ onUploaded, label = "evidence", existing }: Props) {
  const inputRef             = useRef<HTMLInputElement>(null);
  const [uploading, setUploading] = useState(false);
  const [preview,   setPreview]   = useState<string | null>(existing ?? null);
  const [error,     setError]     = useState<string | null>(null);

  async function handleFile(file: File) {
    setError(null);
    setUploading(true);
    try {
      const fd = new FormData();
      fd.append("file",  file);
      fd.append("label", label);

      const res  = await fetch("/api/debt/upload", { method: "POST", body: fd });
      const data = await res.json();

      if (!res.ok) throw new Error(data.error ?? "Upload failed");

      setPreview(data.url);
      onUploaded({ url: data.url, publicId: data.publicId });
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleFile(file);
  }

  return (
    <div>
      <div
        onDrop={handleDrop}
        onDragOver={(e) => e.preventDefault()}
        onClick={() => inputRef.current?.click()}
        className="border border-dashed border-[#c9a84c]/40 rounded-lg p-4 text-center cursor-pointer
                   hover:border-[#c9a84c]/80 transition-colors bg-[#221f1c]"
      >
        {uploading ? (
          <p className="text-[#a09880] text-sm">Uploading…</p>
        ) : preview ? (
          <div className="flex items-center justify-center gap-2">
            <span className="text-green-400 text-sm">✓ File uploaded</span>
            <a
              href={preview}
              target="_blank"
              rel="noreferrer"
              onClick={(e: React.MouseEvent<HTMLAnchorElement>) => e.stopPropagation()}
              className="text-[#c9a84c] text-xs underline"
            >
              View
            </a>
          </div>
        ) : (
          <p className="text-[#a09880] text-sm">
            Drop file here or click to upload
            <br />
            <span className="text-xs opacity-60">
              Bank statement, transfer screenshot, invoice — max 20 MB
            </span>
          </p>
        )}
      </div>
      {error && <p className="text-red-400 text-xs mt-1">{error}</p>}
      <input
        ref={inputRef}
        type="file"
        className="hidden"
        accept="image/*,application/pdf,.pdf,.jpg,.jpeg,.png,.webp"
        onChange={(e) => {
          const f = e.target.files?.[0];
          if (f) handleFile(f);
        }}
      />
    </div>
  );
}
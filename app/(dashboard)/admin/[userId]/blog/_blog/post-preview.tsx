"use client";

// =============================================================================
// isaacpaha.com — Blog Post Preview
// components/admin/blog/post-preview.tsx
// Renders the markdown content as it will appear on the public blog
// =============================================================================

import React, { useState } from "react";
import { Eye, Smartphone, Monitor, Clock, Calendar, Tag } from "lucide-react";

interface PostPreviewProps {
  title:       string;
  excerpt:     string;
  content:     string;
  coverImage?: string;
  tags:        string[];
  category?:   string;
  readingTime: number;
  authorName:  string;
  publishedAt?: Date | null;
}

// ─── Markdown renderer (matches public PostContent) ───────────────────────────

const slugify = (t: string) => t.toLowerCase().replace(/[^a-z0-9\s-]/g, "").trim().replace(/\s+/g, "-");

function renderInline(text: string): string {
  return text
    .replace(/==(.+?)==/g, '<mark class="bg-amber-100 text-amber-900 px-0.5 rounded">$1</mark>')
    .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-stone-900">$1</strong>')
    .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
    .replace(/`(.+?)`/g, '<code class="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
    .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-amber-700 underline hover:text-amber-900 transition-colors">$1</a>');
}

function renderContent(content: string): React.ReactNode[] {
  const lines = content.split("\n");
  const rendered: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;
  let codeBlock: string[] = [];
  let inCode = false;
  let codeLang = "";

  const flushList = (key: string) => {
    if (!listBuffer.length) return;
    rendered.push(
      listType === "ul"
        ? <ul key={key} className="space-y-1.5 my-5 ml-4">{listBuffer}</ul>
        : <ol key={key} className="space-y-2 my-5 ml-4">{listBuffer}</ol>
    );
    listBuffer = []; listType = null;
  };

  lines.forEach((line, i) => {
    // Code block
    if (line.startsWith("```")) {
      if (!inCode) {
        flushList(`pre-code-${i}`);
        inCode = true; codeLang = line.slice(3).trim(); codeBlock = [];
        return;
      } else {
        inCode = false;
        rendered.push(
          <div key={`code-${i}`} className="my-6 rounded-sm overflow-hidden border border-stone-800">
            {codeLang && <div className="px-4 py-1.5 bg-stone-800 text-stone-400 text-[10px] font-mono border-b border-stone-700">{codeLang}</div>}
            <pre className="bg-stone-900 text-stone-100 p-5 overflow-x-auto text-sm leading-relaxed font-mono">
              <code>{codeBlock.join("\n")}</code>
            </pre>
          </div>
        );
        codeBlock = []; return;
      }
    }
    if (inCode) { codeBlock.push(line); return; }

    const isBullet   = /^- /.test(line);
    const isNumbered = /^\d+\. /.test(line);

    if (!isBullet && !isNumbered && listBuffer.length) flushList(`flush-${i}`);

    if (/^## /.test(line)) {
      const text = line.slice(3); const id = slugify(text);
      rendered.push(<h2 key={i} id={id} className="text-2xl font-black text-stone-900 mt-10 mb-4 leading-tight">{text}</h2>);
    } else if (/^### /.test(line)) {
      const text = line.slice(4); const id = slugify(text);
      rendered.push(<h3 key={i} id={id} className="text-lg font-black text-stone-900 mt-7 mb-3">{text}</h3>);
    } else if (/^# /.test(line)) {
      rendered.push(<h1 key={i} className="text-3xl font-black text-stone-900 mt-8 mb-5">{line.slice(2)}</h1>);
    } else if (/^> /.test(line)) {
      rendered.push(
        <blockquote key={i} className="border-l-4 border-amber-400 pl-5 py-1 my-5 bg-amber-50 rounded-r-sm">
          <p className="text-base text-amber-900 font-medium italic leading-relaxed"
            dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />
        </blockquote>
      );
    } else if (/^---/.test(line)) {
      rendered.push(<hr key={i} className="my-10 border-stone-200" />);
    } else if (isBullet) {
      const type = "ul";
      if (listType !== type && listBuffer.length) flushList(`change-${i}`);
      listType = type;
      listBuffer.push(
        <li key={i} className="flex items-start gap-2.5 text-base text-stone-700 leading-relaxed">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2.5" />
          <span dangerouslySetInnerHTML={{ __html: renderInline(line.slice(2)) }} />
        </li>
      );
    } else if (isNumbered) {
      const m = line.match(/^(\d+)\. (.+)$/);
      if (m) {
        const type = "ol";
        if (listType !== type && listBuffer.length) flushList(`change-${i}`);
        listType = type;
        listBuffer.push(
          <li key={i} className="flex items-start gap-3 text-base text-stone-700 leading-relaxed">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">{m[1]}</span>
            <span dangerouslySetInnerHTML={{ __html: renderInline(m[2]) }} />
          </li>
        );
      }
    } else if (!line.trim()) {
      rendered.push(<div key={i} className="h-3" />);
    } else {
      rendered.push(
        <p key={i} className="text-base md:text-lg text-stone-700 leading-relaxed"
          dangerouslySetInnerHTML={{ __html: renderInline(line) }} />
      );
    }
  });

  if (listBuffer.length) flushList("final");
  return rendered;
}

export function PostPreview({
  title, excerpt, content, coverImage, tags, category,
  readingTime, authorName, publishedAt,
}: PostPreviewProps) {
  const [viewport, setViewport] = useState<"desktop" | "mobile">("desktop");

  return (
    <div className="flex flex-col h-full overflow-hidden">
      {/* Preview toolbar */}
      <div className="flex items-center gap-2 px-4 py-2.5 border-b border-stone-100 bg-stone-50/60 flex-shrink-0">
        <Eye className="w-4 h-4 text-stone-400" />
        <span className="text-xs font-bold text-stone-500">Preview</span>
        <div className="ml-auto flex items-center gap-1">
          <button onClick={() => setViewport("desktop")}
            className={`w-7 h-7 flex items-center justify-center rounded-sm border transition-colors ${viewport === "desktop" ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-white border-stone-200 text-stone-400"}`}>
            <Monitor className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setViewport("mobile")}
            className={`w-7 h-7 flex items-center justify-center rounded-sm border transition-colors ${viewport === "mobile" ? "bg-amber-50 border-amber-200 text-amber-600" : "bg-white border-stone-200 text-stone-400"}`}>
            <Smartphone className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Preview content */}
      <div className="flex-1 overflow-y-auto bg-stone-100/40">
        <div className={`mx-auto transition-all duration-300 ${viewport === "mobile" ? "max-w-sm" : "max-w-2xl"}`}>
          <div className="bg-white min-h-full shadow-sm">
            {/* Article header */}
            <div className="px-6 md:px-10 pt-10 pb-6 bg-stone-50 border-b border-stone-100">
              {category && (
                <span className="inline-block text-[11px] font-black text-amber-700 bg-amber-100 px-2.5 py-1 rounded-sm mb-4 uppercase tracking-wider">
                  {category}
                </span>
              )}
              <h1 className="text-2xl md:text-4xl font-black text-stone-900 leading-tight mb-4">
                {title || <span className="text-stone-300">Post title appears here…</span>}
              </h1>
              {excerpt && (
                <p className="text-base text-stone-500 leading-relaxed mb-5">{excerpt}</p>
              )}
              <div className="flex items-center gap-4 text-xs text-stone-400 flex-wrap">
                <span className="font-semibold text-stone-600">{authorName}</span>
                {publishedAt && (
                  <span className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(publishedAt).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}
                  </span>
                )}
                {readingTime > 0 && (
                  <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{readingTime} min read</span>
                )}
              </div>
            </div>

            {/* Cover image */}
            {coverImage && (
              <div className="w-full aspect-video bg-stone-200 overflow-hidden">
                <img src={coverImage} alt={title} className="w-full h-full object-cover" />
              </div>
            )}

            {/* Content */}
            <div className="px-6 md:px-10 py-10 space-y-3">
              {content
                ? renderContent(content)
                : <p className="text-stone-300 text-lg">Content appears here…</p>
              }
            </div>

            {/* Tags */}
            {tags.length > 0 && (
              <div className="px-6 md:px-10 pb-10 flex flex-wrap gap-2">
                {tags.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 text-xs font-semibold text-stone-500 bg-stone-100 px-3 py-1.5 rounded-sm">
                    <Tag className="w-3 h-3" />{t}
                  </span>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
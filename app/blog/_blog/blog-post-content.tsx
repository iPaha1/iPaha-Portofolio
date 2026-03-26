"use client";

import React from "react";

interface PostContentProps {
  content: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

export const PostContent = ({ content }: PostContentProps) => {
  const lines = content.split("\n");

  const renderLine = (line: string, index: number): React.ReactNode => {
    // H2
    if (/^## /.test(line)) {
      const text = line.replace(/^## /, "");
      const id = slugify(text);
      return (
        <h2
          key={index}
          id={id}
          className="text-2xl md:text-3xl font-black text-gray-900 mt-12 mb-5 leading-tight scroll-mt-24 group"
        >
          <a href={`#${id}`} className="hover:text-amber-700 transition-colors">
            {text}
          </a>
        </h2>
      );
    }

    // H3
    if (/^### /.test(line)) {
      const text = line.replace(/^### /, "");
      const id = slugify(text);
      return (
        <h3
          key={index}
          id={id}
          className="text-xl font-black text-gray-900 mt-8 mb-4 scroll-mt-24"
        >
          {text}
        </h3>
      );
    }

    // H1
    if (/^# /.test(line)) {
      const text = line.replace(/^# /, "");
      return (
        <h1 key={index} className="text-3xl font-black text-gray-900 mt-10 mb-5">
          {text}
        </h1>
      );
    }

    // Block quote
    if (/^> /.test(line)) {
      const text = line.replace(/^> /, "");
      return (
        <blockquote
          key={index}
          className="border-l-4 border-amber-400 pl-5 py-1 my-5 bg-amber-50 rounded-r-xs"
        >
          <p className="text-base text-amber-900 font-medium italic leading-relaxed">
            {text}
          </p>
        </blockquote>
      );
    }

    // Horizontal rule
    if (/^---/.test(line)) {
      return <hr key={index} className="my-10 border-gray-200" />;
    }

    // Bullet list item
    if (/^- /.test(line)) {
      const text = line.replace(/^- /, "");
      return (
        <li key={index} className="flex items-start gap-2.5 text-base text-gray-700 leading-relaxed mb-1.5">
          <span className="w-1.5 h-1.5 rounded-full bg-amber-500 shrink-0 mt-2.5" />
          <span dangerouslySetInnerHTML={{ __html: renderInline(text) }} />
        </li>
      );
    }

    // Numbered list
    if (/^\d+\. /.test(line)) {
      const match = line.match(/^(\d+)\. (.+)$/);
      if (match) {
        return (
          <li key={index} className="flex items-start gap-3 text-base text-gray-700 leading-relaxed mb-2">
            <span className="w-6 h-6 rounded-full bg-amber-100 text-amber-700 text-xs font-black flex items-center justify-center shrink-0 mt-0.5">
              {match[1]}
            </span>
            <span dangerouslySetInnerHTML={{ __html: renderInline(match[2]) }} />
          </li>
        );
      }
    }

    // Empty line
    if (!line.trim()) {
      return <div key={index} className="h-4" />;
    }

    // Normal paragraph
    return (
      <p
        key={index}
        className="text-base md:text-lg text-gray-700 leading-relaxed mb-0"
        dangerouslySetInnerHTML={{ __html: renderInline(line) }}
      />
    );
  };

  const renderInline = (text: string): string => {
    return text
      // Bold
      .replace(/\*\*(.+?)\*\*/g, '<strong class="font-bold text-gray-900">$1</strong>')
      // Italic
      .replace(/\*(.+?)\*/g, '<em class="italic">$1</em>')
      // Inline code
      .replace(/`(.+?)`/g, '<code class="bg-amber-50 text-amber-800 border border-amber-200 px-1.5 py-0.5 rounded text-sm font-mono">$1</code>')
      // Links
      .replace(/\[(.+?)\]\((.+?)\)/g, '<a href="$2" class="text-amber-700 underline hover:text-amber-900 transition-colors" target="_blank" rel="noopener">$1</a>');
  };

  // Group list items
  const rendered: React.ReactNode[] = [];
  let listBuffer: React.ReactNode[] = [];
  let listType: "ul" | "ol" | null = null;

  lines.forEach((line, i) => {
    const isBullet = /^- /.test(line);
    const isNumbered = /^\d+\. /.test(line);

    if (isBullet || isNumbered) {
      const type = isBullet ? "ul" : "ol";
      if (listType !== type && listBuffer.length > 0) {
        rendered.push(
          listType === "ul" ? (
            <ul key={`list-${i}`} className="space-y-1 my-5 ml-2">{listBuffer}</ul>
          ) : (
            <ol key={`list-${i}`} className="space-y-2 my-5 ml-2">{listBuffer}</ol>
          )
        );
        listBuffer = [];
      }
      listType = type;
      listBuffer.push(renderLine(line, i));
    } else {
      if (listBuffer.length > 0) {
        rendered.push(
          listType === "ul" ? (
            <ul key={`list-flush-${i}`} className="space-y-1 my-5 ml-2">{listBuffer}</ul>
          ) : (
            <ol key={`list-flush-${i}`} className="space-y-2 my-5 ml-2">{listBuffer}</ol>
          )
        );
        listBuffer = [];
        listType = null;
      }
      rendered.push(renderLine(line, i));
    }
  });

  // Flush remaining list
  if (listBuffer.length > 0) {
    rendered.push(
      listType === "ul" ? (
        <ul key="list-final" className="space-y-1 my-5 ml-2">{listBuffer}</ul>
      ) : (
        <ol key="list-final-ol" className="space-y-2 my-5 ml-2">{listBuffer}</ol>
      )
    );
  }

  return (
    <div className="prose-content space-y-2 max-w-none">
      {rendered}
    </div>
  );
};
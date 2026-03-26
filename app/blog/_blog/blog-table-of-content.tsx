"use client";

import React, { useEffect, useState } from "react";
import { List } from "lucide-react";
import { cn } from "@/lib/utils";

interface Heading {
  id: string;
  text: string;
  level: number;
}

interface TableOfContentsProps {
  content: string;
}

const slugify = (text: string) =>
  text
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .trim()
    .replace(/\s+/g, "-");

const extractHeadings = (content: string): Heading[] => {
  const lines = content.split("\n");
  return lines
    .filter((line) => /^#{1,3}\s/.test(line))
    .map((line) => {
      const match = line.match(/^(#{1,3})\s+(.+)$/);
      if (!match) return null;
      const level = match[1].length;
      const text = match[2];
      return { id: slugify(text), text, level };
    })
    .filter(Boolean) as Heading[];
};

export const TableOfContents = ({ content }: TableOfContentsProps) => {
  const [activeId, setActiveId] = useState<string>("");
  const headings = extractHeadings(content);

  useEffect(() => {
    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            setActiveId(entry.target.id);
          }
        });
      },
      { rootMargin: "-20% 0px -70% 0px" }
    );

    headings.forEach(({ id }) => {
      const el = document.getElementById(id);
      if (el) observer.observe(el);
    });

    return () => observer.disconnect();
  }, [headings]);

  if (headings.length < 3) return null;

  return (
    <div className="bg-gray-50 border border-gray-200 rounded-xs p-5 mb-8">
      <div className="flex items-center gap-2 mb-4">
        <List className="w-4 h-4 text-gray-400" />
        <p className="text-xs font-semibold tracking-widest uppercase text-gray-400">
          Contents
        </p>
      </div>
      <nav>
        <ol className="space-y-2">
          {headings.map((h, i) => (
            <li key={h.id}>
              <a
                href={`#${h.id}`}
                className={cn(
                  "block text-sm leading-snug transition-colors duration-200",
                  h.level === 1
                    ? "font-semibold"
                    : h.level === 2
                    ? "pl-3 border-l-2"
                    : "pl-6",
                  activeId === h.id
                    ? "text-amber-700 border-amber-400"
                    : "text-gray-500 hover:text-gray-900 border-gray-200"
                )}
                onClick={(e) => {
                  e.preventDefault();
                  document.getElementById(h.id)?.scrollIntoView({ behavior: "smooth", block: "start" });
                }}
              >
                {h.level > 1 && (
                  <span className="text-xs text-gray-300 mr-2 font-normal">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                )}
                {h.text}
              </a>
            </li>
          ))}
        </ol>
      </nav>
    </div>
  );
};
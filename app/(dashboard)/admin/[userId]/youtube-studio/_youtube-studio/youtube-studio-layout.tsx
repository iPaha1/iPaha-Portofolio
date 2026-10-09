"use client";
import { ReactNode } from "react";

export default function YoutubeStudioLayout({ children }: { children: ReactNode }) {
  return (
    <div className="flex min-h-screen bg-[#0a0a0f] text-white font-sans">
      {children}
    </div>
  );
}
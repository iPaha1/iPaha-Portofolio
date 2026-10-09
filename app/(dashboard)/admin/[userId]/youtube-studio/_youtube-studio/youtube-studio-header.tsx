"use client";

// app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-header.tsx

import { Menu, Bell, Search, Youtube, ExternalLink } from "lucide-react";
import { YoutubeTab } from "./types";


const TAB_LABELS: Record<YoutubeTab, string> = {
  overview:   "Studio Overview",
  generator:  "Weekly Content Generator",
  library:    "Video Library",
  ideas:      "Ideas Bank",
  calendar:   "Content Calendar",
  analytics:  "Analytics Dashboard",
  settings:   "Channel Settings",
};

interface Props {
  activeTab:    YoutubeTab;
  userId:       string;
  onMenuToggle: () => void;
}

export default function YoutubeStudioHeader({ activeTab, userId, onMenuToggle }: Props) {
  return (
    <header className="h-16 shrink-0 flex items-center gap-4 px-6 border-b border-white/5 bg-[#0a0a0f]/80 backdrop-blur-sm sticky top-0 z-30">
      <button
        onClick={onMenuToggle}
        className="text-white/40 hover:text-white transition-colors lg:hidden"
      >
        <Menu className="w-5 h-5" />
      </button>

      {/* Page title */}
      <div className="flex items-center gap-2">
        <Youtube className="w-4 h-4 text-red-400" />
        <h1 className="text-sm font-semibold text-white">{TAB_LABELS[activeTab]}</h1>
      </div>

      <div className="flex-1" />

      {/* Search */}
      <div className="hidden md:flex items-center gap-2 bg-white/5 border border-white/5 rounded-lg px-3 py-1.5 w-56">
        <Search className="w-3.5 h-3.5 text-white/30" />
        <input
          type="text"
          placeholder="Search videos, ideas..."
          className="bg-transparent text-xs text-white/60 placeholder:text-white/25 outline-none flex-1"
        />
      </div>

      {/* Notifications */}
      <button className="relative text-white/40 hover:text-white transition-colors">
        <Bell className="w-4 h-4" />
        <span className="absolute -top-0.5 -right-0.5 w-2 h-2 bg-red-500 rounded-full" />
      </button>

      {/* YouTube channel link */}
      <a
        href="https://youtube.com"
        target="_blank"
        rel="noopener noreferrer"
        className="hidden sm:flex items-center gap-1.5 text-xs text-white/40 hover:text-red-400 transition-colors"
      >
        <ExternalLink className="w-3.5 h-3.5" />
        <span>Channel</span>
      </a>
    </header>
  );
}
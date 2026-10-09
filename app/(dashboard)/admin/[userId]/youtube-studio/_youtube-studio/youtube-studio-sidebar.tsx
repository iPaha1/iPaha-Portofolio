"use client";

// app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-sidebar.tsx

import {
  LayoutDashboard, Wand2, Film, Lightbulb,
  CalendarDays, BarChart3, Settings, ChevronLeft,
  Youtube, Zap,
} from "lucide-react";
import { YoutubeTab } from "./types";

const NAV_ITEMS: { id: YoutubeTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "overview",   label: "Overview",         icon: LayoutDashboard },
  { id: "generator",  label: "Weekly Generator",  icon: Wand2,        badge: "AI" },
  { id: "library",    label: "Video Library",     icon: Film },
  { id: "ideas",      label: "Ideas Bank",        icon: Lightbulb },
  { id: "calendar",   label: "Content Calendar",  icon: CalendarDays },
  { id: "analytics",  label: "Analytics",         icon: BarChart3 },
  { id: "settings",   label: "Channel Settings",  icon: Settings },
];

interface Props {
  activeTab:   YoutubeTab;
  onTabChange: (tab: YoutubeTab) => void;
  isOpen:      boolean;
  onToggle:    () => void;
}

export default function YoutubeStudioSidebar({ activeTab, onTabChange, isOpen, onToggle }: Props) {
  return (
    <aside
      className={`fixed left-0 top-0 h-full z-40 transition-all duration-300 flex flex-col
        ${isOpen ? "w-64" : "w-16"} bg-[#0d0d14] border-r border-white/5`}
    >
      {/* Logo */}
      <div className="h-16 flex items-center px-4 border-b border-white/5 shrink-0">
        <div className={`flex items-center gap-3 ${!isOpen && "justify-center w-full"}`}>
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
            <Youtube className="w-4 h-4 text-white" />
          </div>
          {isOpen && (
            <div>
              <p className="text-sm font-bold text-white leading-tight">Content Studio</p>
              <p className="text-[10px] text-white/40 leading-tight">AI-Powered Creator</p>
            </div>
          )}
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 py-4 space-y-1 px-2 overflow-y-auto">
        {NAV_ITEMS.map((item) => {
          const Icon = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg transition-all duration-150 group relative
                ${isActive
                  ? "bg-gradient-to-r from-red-500/20 to-orange-500/10 text-white border border-red-500/20"
                  : "text-white/40 hover:text-white/80 hover:bg-white/5"
                }
                ${!isOpen && "justify-center"}`}
            >
              <Icon className={`w-4 h-4 shrink-0 ${isActive ? "text-red-400" : ""}`} />

              {isOpen && (
                <>
                  <span className="text-sm font-medium">{item.label}</span>
                  {item.badge && (
                    <span className="ml-auto text-[9px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20">
                      {item.badge}
                    </span>
                  )}
                </>
              )}

              {/* Tooltip when collapsed */}
              {!isOpen && (
                <div className="absolute left-full ml-2 px-2 py-1 bg-[#1a1a2e] text-white text-xs rounded opacity-0 group-hover:opacity-100 pointer-events-none whitespace-nowrap border border-white/10 transition-opacity z-50">
                  {item.label}
                </div>
              )}
            </button>
          );
        })}
      </nav>

      {/* AI Status pill */}
      {isOpen && (
        <div className="px-3 pb-4">
          <div className="rounded-lg bg-gradient-to-br from-red-500/10 to-orange-500/5 border border-red-500/10 p-3">
            <div className="flex items-center gap-2 mb-1">
              <Zap className="w-3 h-3 text-red-400" />
              <span className="text-xs font-semibold text-red-400">AI Active</span>
            </div>
            <p className="text-[10px] text-white/40 leading-relaxed">
              Claude Sonnet powers your content generation engine
            </p>
          </div>
        </div>
      )}

      {/* Collapse toggle */}
      <button
        onClick={onToggle}
        className="h-12 flex items-center justify-center border-t border-white/5 text-white/30 hover:text-white/60 transition-colors shrink-0"
      >
        <ChevronLeft className={`w-4 h-4 transition-transform duration-300 ${!isOpen && "rotate-180"}`} />
      </button>
    </aside>
  );
}
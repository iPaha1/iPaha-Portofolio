"use client";

// youtube-studio-nav.tsx
// Sticky horizontal tab bar — lives inside the admin layout's content area,
// no fixed positioning, no z-index conflicts with the main sidebar.

import { LayoutDashboard, Wand2, Film, Lightbulb, CalendarDays, BarChart3, Settings, Youtube } from "lucide-react";
import type { YoutubeTab } from "./types";

const NAV_ITEMS: { id: YoutubeTab; label: string; icon: React.ElementType; badge?: string }[] = [
  { id: "overview",   label: "Overview",   icon: LayoutDashboard },
  { id: "generator",  label: "Generator",  icon: Wand2,        badge: "AI" },
  { id: "library",    label: "Library",    icon: Film          },
  { id: "ideas",      label: "Ideas",      icon: Lightbulb     },
  { id: "calendar",   label: "Calendar",   icon: CalendarDays  },
  { id: "analytics",  label: "Analytics",  icon: BarChart3     },
  { id: "settings",   label: "Settings",   icon: Settings      },
];

interface Props {
  activeTab:   YoutubeTab;
  onTabChange: (tab: YoutubeTab) => void;
}

export default function YoutubeStudioNav({ activeTab, onTabChange }: Props) {
  return (
    <div className="sticky top-0 z-20 bg-zinc-950 border-b border-zinc-800">
      {/* Identity row */}
      <div className="flex items-center gap-2.5 px-4 py-2.5 border-b border-zinc-800/60">
        <div className="w-6 h-6 rounded-sm bg-red-600 flex items-center justify-center shrink-0">
          <Youtube className="w-3.5 h-3.5 text-white" />
        </div>
        <span className="text-xs font-semibold text-zinc-300">Content Studio</span>
        <span className="text-zinc-700">·</span>
        <span className="text-[11px] text-zinc-600">AI-powered YouTube creator system</span>
        <div className="ml-auto flex items-center gap-1.5 px-2 py-0.5 rounded-sm border border-zinc-800 bg-zinc-900">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-500 shrink-0" />
          <span className="text-[10px] font-medium text-zinc-500">Claude AI</span>
        </div>
      </div>

      {/* Tab row */}
      <nav className="flex overflow-x-auto scrollbar-none px-1">
        {NAV_ITEMS.map(item => {
          const Icon     = item.icon;
          const isActive = activeTab === item.id;
          return (
            <button
              key={item.id}
              onClick={() => onTabChange(item.id)}
              className={`
                flex items-center gap-1.5 px-3.5 py-2.5 text-xs font-medium
                whitespace-nowrap border-b-2 transition-colors shrink-0
                ${isActive
                  ? "border-red-600 text-zinc-100"
                  : "border-transparent text-zinc-500 hover:text-zinc-300 hover:border-zinc-600"
                }
              `}
            >
              <Icon className="w-3.5 h-3.5" />
              {item.label}
              {item.badge && (
                <span className="text-[8px] font-bold px-1 py-px rounded-sm bg-red-950 text-red-400 border border-red-800 leading-none tracking-wide">
                  {item.badge}
                </span>
              )}
            </button>
          );
        })}
      </nav>
    </div>
  );
}

// "use client";

// // app/(dashboard)/admin/[userId]/youtube-studio/_youtube-studio/youtube-studio-nav.tsx
// //
// // Replaces the fixed sidebar with a sticky horizontal tab bar that lives
// // entirely within the page content area — no z-index conflicts with the
// // main admin sidebar whatsoever.

// import {
//   LayoutDashboard, Wand2, Film, Lightbulb,
//   CalendarDays, BarChart3, Settings, Youtube, Zap,
// } from "lucide-react";
// import type { YoutubeTab } from "./types";

// const NAV_ITEMS: {
//   id:     YoutubeTab;
//   label:  string;
//   icon:   React.ElementType;
//   badge?: string;
// }[] = [
//   { id: "overview",   label: "Overview",        icon: LayoutDashboard },
//   { id: "generator",  label: "Generator",        icon: Wand2,       badge: "AI" },
//   { id: "library",    label: "Library",          icon: Film },
//   { id: "ideas",      label: "Ideas",            icon: Lightbulb },
//   { id: "calendar",   label: "Calendar",         icon: CalendarDays },
//   { id: "analytics",  label: "Analytics",        icon: BarChart3 },
//   { id: "settings",   label: "Settings",         icon: Settings },
// ];

// interface Props {
//   activeTab:   YoutubeTab;
//   onTabChange: (tab: YoutubeTab) => void;
// }

// export default function YoutubeStudioNav({ activeTab, onTabChange }: Props) {
//   return (
//     // Sticky top bar — stays inside the page flow, never overlaps the admin sidebar
//     <div className="sticky top-0 z-20 bg-[#0a0a0f] border-b border-white/5">

//       {/* Studio identity row */}
//       <div className="flex items-center gap-3 px-4 pt-4 pb-3 border-b border-white/5">
//         <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-red-500 to-orange-500 flex items-center justify-center shrink-0">
//           <Youtube className="w-3.5 h-3.5 text-white" />
//         </div>
//         <div>
//           <p className="text-sm font-bold text-white leading-tight">Content Studio</p>
//           <p className="text-[10px] text-white/40 leading-none mt-0.5">AI-Powered YouTube Creator</p>
//         </div>
//         {/* AI active pill — far right */}
//         <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/10 border border-red-500/15">
//           <Zap className="w-2.5 h-2.5 text-red-400" />
//           <span className="text-[10px] font-semibold text-red-400">Claude AI Active</span>
//         </div>
//       </div>

//       {/* Tab row */}
//       <nav className="flex items-end overflow-x-auto px-2 scrollbar-none">
//         {NAV_ITEMS.map((item) => {
//           const Icon     = item.icon;
//           const isActive = activeTab === item.id;

//           return (
//             <button
//               key={item.id}
//               onClick={() => onTabChange(item.id)}
//               className={`
//                 relative flex items-center gap-2 px-4 py-3 text-xs font-medium
//                 whitespace-nowrap border-b-2 transition-all duration-150 shrink-0
//                 ${isActive
//                   ? "border-red-400 text-white"
//                   : "border-transparent text-white/40 hover:text-white/70 hover:border-white/20"
//                 }
//               `}
//             >
//               <Icon className={`w-3.5 h-3.5 ${isActive ? "text-red-400" : ""}`} />
//               {item.label}
//               {item.badge && (
//                 <span className="text-[8px] font-bold px-1.5 py-0.5 rounded bg-red-500/20 text-red-400 border border-red-500/20 leading-none">
//                   {item.badge}
//                 </span>
//               )}
//             </button>
//           );
//         })}
//       </nav>
//     </div>
//   );
// }
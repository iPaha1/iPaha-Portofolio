"use client";

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  LayoutDashboard, BarChart3, FileText, Lightbulb, Wrench,
  Clock, Mic, AppWindow, Mail, Share2, Users, Image, Settings,
  FilePlus, Upload, ExternalLink,
   PanelLeftClose, PanelLeft,
  // Developer Hub — Phase 1
  Database, Code2, Brain, Terminal, Bug, SearchCode,
  // Developer Hub — Phase 2
  BookOpen, Globe, Layers, BookMarked, Link2,
  // Developer Hub — Phase 3
  Bot, BarChart2, ArrowLeftRight, Tags,
} from "lucide-react";
import { NAV_GROUPS } from "@/lib/admin/admin-nav-config";

// ─── Icon map ─────────────────────────────────────────────────────────────────

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, BarChart3, FileText, Lightbulb, Wrench,
  Clock, Mic, AppWindow, Mail, Share2, Users, Image, Settings,
  FilePlus, Upload,
  // Developer Hub — Phase 1
  Database, Code2, Brain, Terminal, Bug, SearchCode,
  // Developer Hub — Phase 2
  BookOpen, Globe, Layers, BookMarked, Link2,
  // Developer Hub — Phase 3
  Bot, BarChart2, ArrowLeftRight, Tags,
};

function NavIcon({ name, className }: { name: string; className?: string }) {
  const Icon = ICONS[name];
  if (!Icon) return null;
  return <Icon className={className ?? "w-[18px] h-[18px]"} />;
}

// ─── Tooltip (shown in collapsed mode) ───────────────────────────────────────

function Tooltip({ children, label, visible }: {
  children: React.ReactNode;
  label: string;
  visible: boolean;
}) {
  const [show, setShow] = useState(false);
  if (!visible) return <>{children}</>;
  return (
    <div
      className="relative group"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      <AnimatePresence>
        {show && (
          <motion.div
            initial={{ opacity: 0, x: -4 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -4 }}
            transition={{ duration: 0.15 }}
            className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
          >
            <div className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-sm whitespace-nowrap border border-white/10 shadow-xl">
              {label}
              <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-900" />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// ─── Nav item ─────────────────────────────────────────────────────────────────

function NavItemRow({
  item,
  userId,
  collapsed,
  active,
}: {
  item: (typeof NAV_GROUPS)[0]["items"][0];
  userId: string;
  collapsed: boolean;
  active: boolean;
}) {
  return (
    <Tooltip label={item.label} visible={collapsed}>
      <Link
        href={item.href(userId)}
        className={`
          flex items-center gap-3 rounded-sm transition-all duration-150 group relative
          ${collapsed ? "justify-center px-0 py-2.5 mx-2" : "px-3 py-2.5 mx-2"}
          ${active
            ? "bg-amber-500/15 text-amber-400"
            : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
          }
        `}
      >
        {/* Active indicator */}
        {active && (
          <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r-full" />
        )}

        <NavIcon
          name={item.iconName}
          className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
            active ? "text-amber-400" : "text-white/35 group-hover:text-white/70"
          }`}
        />

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.span
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18, ease: "easeInOut" }}
              className="text-[13px] font-semibold whitespace-nowrap overflow-hidden"
            >
              {item.label}
            </motion.span>
          )}
        </AnimatePresence>

        {/* Badge */}
        {!collapsed && item.badge && (
          <motion.span
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
            style={{
              color: item.badgeColor ?? "#10b981",
              backgroundColor: `${item.badgeColor ?? "#10b981"}18`,
              border: `1px solid ${item.badgeColor ?? "#10b981"}30`,
            }}
          >
            {item.badge}
          </motion.span>
        )}

        {/* Collapsed badge dot */}
        {collapsed && item.badge && (
          <div
            className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
            style={{ backgroundColor: item.badgeColor ?? "#10b981" }}
          />
        )}
      </Link>
    </Tooltip>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// SIDEBAR
// ─────────────────────────────────────────────────────────────────────────────

interface AdminSidebarProps {
  userId: string;
  collapsed: boolean;
  onToggle: () => void;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
}

export function AdminSidebar({
  userId,
  collapsed,
  onToggle,
  userName = "Isaac Paha",
  userEmail = "pahaisaac@gmail.com",
  userInitials = "IP",
}: AdminSidebarProps) {
  const pathname = usePathname();

  const isActive = (href: string) =>
    pathname === href || (href !== `/admin/${userId}/dashboard` && pathname.startsWith(href));

  const sidebarW = collapsed ? 64 : 240;

  return (
    <motion.aside
      animate={{ width: sidebarW }}
      transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
      className="flex flex-col h-screen bg-[#0c0b09] border-r border-white/[0.06] overflow-hidden flex-shrink-0 relative z-30"
      style={{ width: sidebarW }}
    >
      {/* ── LOGO ────────────────────────────────────────────────────────── */}
      <div
        className={`flex items-center border-b border-white/[0.06] flex-shrink-0 ${
          collapsed ? "justify-center px-0 py-5" : "px-5 py-5 gap-3"
        }`}
        style={{ height: 64 }}
      >
        {/* Mark */}
        <div
          className="w-8 h-8 rounded flex items-center justify-center font-black text-sm flex-shrink-0"
          style={{ backgroundColor: "#f59e0b", color: "#000" }}
        >
          IP
        </div>

        <AnimatePresence initial={false}>
          {!collapsed && (
            <motion.div
              initial={{ opacity: 0, width: 0 }}
              animate={{ opacity: 1, width: "auto" }}
              exit={{ opacity: 0, width: 0 }}
              transition={{ duration: 0.18 }}
              className="overflow-hidden"
            >
              <p className="text-[13px] font-black text-white whitespace-nowrap">
                isaacpaha.com
              </p>
              <p className="text-[10px] text-white/25 whitespace-nowrap">Admin</p>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ── NAV GROUPS ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
        {NAV_GROUPS.map((group) => (
          <div key={group.id} className="mb-1">
            {/* Group label */}
            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.p
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.15 }}
                  className="text-[10px] font-black tracking-[0.2em] uppercase text-white/20 px-5 py-2 mt-2"
                >
                  {group.label}
                </motion.p>
              )}
            </AnimatePresence>

            {/* Collapsed group divider */}
            {collapsed && (
              <div className="mx-4 my-2 h-px bg-white/[0.06]" />
            )}

            {/* Items */}
            {group.items.map((item) => (
              <NavItemRow
                key={item.id}
                item={item}
                userId={userId}
                collapsed={collapsed}
                active={isActive(item.href(userId))}
              />
            ))}
          </div>
        ))}

        {/* View site link */}
        <div className={`mt-2 mb-1 ${collapsed ? "" : ""}`}>
          {collapsed && <div className="mx-4 mb-2 h-px bg-white/[0.06]" />}
          <Tooltip label="View site" visible={collapsed}>
            <a
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className={`flex items-center gap-3 rounded-sm transition-all mx-2 py-2.5 text-white/25 hover:text-white/55 hover:bg-white/[0.04] ${
                collapsed ? "justify-center px-0" : "px-3"
              }`}
            >
              <ExternalLink className="w-[18px] h-[18px] flex-shrink-0 text-white/25" />
              <AnimatePresence initial={false}>
                {!collapsed && (
                  <motion.span
                    initial={{ opacity: 0, width: 0 }}
                    animate={{ opacity: 1, width: "auto" }}
                    exit={{ opacity: 0, width: 0 }}
                    transition={{ duration: 0.18 }}
                    className="text-[13px] font-semibold whitespace-nowrap overflow-hidden"
                  >
                    View site
                  </motion.span>
                )}
              </AnimatePresence>
            </a>
          </Tooltip>
        </div>
      </div>

      {/* ── USER AREA ───────────────────────────────────────────────────── */}
      <div className="border-t border-white/[0.06] flex-shrink-0">
        <Tooltip label={userName} visible={collapsed}>
          <div
            className={`flex items-center gap-3 py-4 ${
              collapsed ? "justify-center px-0" : "px-4"
            }`}
          >
            {/* Avatar */}
            <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400 flex-shrink-0">
              {userInitials}
            </div>

            <AnimatePresence initial={false}>
              {!collapsed && (
                <motion.div
                  initial={{ opacity: 0, width: 0 }}
                  animate={{ opacity: 1, width: "auto" }}
                  exit={{ opacity: 0, width: 0 }}
                  transition={{ duration: 0.18 }}
                  className="flex-1 min-w-0 overflow-hidden"
                >
                  <p className="text-[12px] font-bold text-white/70 truncate whitespace-nowrap">
                    {userName}
                  </p>
                  <p className="text-[10px] text-white/25 truncate whitespace-nowrap">
                    {userEmail}
                  </p>
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </Tooltip>

        {/* Collapse toggle */}
        <button
          onClick={onToggle}
          className={`w-full flex items-center gap-2.5 py-3 border-t border-white/[0.05] text-white/25 hover:text-white/60 transition-colors ${
            collapsed ? "justify-center px-0" : "px-4"
          }`}
        >
          {collapsed ? (
            <PanelLeft className="w-4 h-4" />
          ) : (
            <>
              <PanelLeftClose className="w-4 h-4" />
              <span className="text-[11px] font-semibold">Collapse sidebar</span>
            </>
          )}
        </button>
      </div>
    </motion.aside>
  );
}




// "use client";

// import React, { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import { motion, AnimatePresence } from "framer-motion";
// import {
//   LayoutDashboard, BarChart3, FileText, Lightbulb, Wrench,
//   Clock, Mic, AppWindow, Mail, Share2, Users, Image, Settings,
//   FilePlus, Upload, ExternalLink,
//   PanelLeftClose, PanelLeft,
// } from "lucide-react";
// import { NAV_GROUPS } from "@/lib/admin/admin-nav-config";

// // ─── Icon map ─────────────────────────────────────────────────────────────────

// const ICONS: Record<string, React.ElementType> = {
//   LayoutDashboard, BarChart3, FileText, Lightbulb, Wrench,
//   Clock, Mic, AppWindow, Mail, Share2, Users, Image, Settings,
//   FilePlus, Upload,
// };

// function NavIcon({ name, className }: { name: string; className?: string }) {
//   const Icon = ICONS[name];
//   if (!Icon) return null;
//   return <Icon className={className ?? "w-[18px] h-[18px]"} />;
// }

// // ─── Tooltip (shown in collapsed mode) ───────────────────────────────────────

// function Tooltip({ children, label, visible }: {
//   children: React.ReactNode;
//   label: string;
//   visible: boolean;
// }) {
//   const [show, setShow] = useState(false);
//   if (!visible) return <>{children}</>;
//   return (
//     <div
//       className="relative group"
//       onMouseEnter={() => setShow(true)}
//       onMouseLeave={() => setShow(false)}
//     >
//       {children}
//       <AnimatePresence>
//         {show && (
//           <motion.div
//             initial={{ opacity: 0, x: -4 }}
//             animate={{ opacity: 1, x: 0 }}
//             exit={{ opacity: 0, x: -4 }}
//             transition={{ duration: 0.15 }}
//             className="absolute left-full ml-3 top-1/2 -translate-y-1/2 z-50 pointer-events-none"
//           >
//             <div className="bg-stone-900 text-white text-xs font-semibold px-2.5 py-1.5 rounded-sm whitespace-nowrap border border-white/10 shadow-xl">
//               {label}
//               <div className="absolute right-full top-1/2 -translate-y-1/2 border-4 border-transparent border-r-stone-900" />
//             </div>
//           </motion.div>
//         )}
//       </AnimatePresence>
//     </div>
//   );
// }

// // ─── Nav item ─────────────────────────────────────────────────────────────────

// function NavItemRow({
//   item,
//   userId,
//   collapsed,
//   active,
// }: {
//   item: (typeof NAV_GROUPS)[0]["items"][0];
//   userId: string;
//   collapsed: boolean;
//   active: boolean;
// }) {
//   return (
//     <Tooltip label={item.label} visible={collapsed}>
//       <Link
//         href={item.href(userId)}
//         className={`
//           flex items-center gap-3 rounded-sm transition-all duration-150 group relative
//           ${collapsed ? "justify-center px-0 py-2.5 mx-2" : "px-3 py-2.5 mx-2"}
//           ${active
//             ? "bg-amber-500/15 text-amber-400"
//             : "text-white/40 hover:text-white/80 hover:bg-white/[0.05]"
//           }
//         `}
//       >
//         {/* Active indicator */}
//         {active && (
//           <div className="absolute left-0 top-1/2 -translate-y-1/2 w-[3px] h-5 bg-amber-400 rounded-r-full" />
//         )}

//         <NavIcon
//           name={item.iconName}
//           className={`w-[18px] h-[18px] flex-shrink-0 transition-colors ${
//             active ? "text-amber-400" : "text-white/35 group-hover:text-white/70"
//           }`}
//         />

//         <AnimatePresence initial={false}>
//           {!collapsed && (
//             <motion.span
//               initial={{ opacity: 0, width: 0 }}
//               animate={{ opacity: 1, width: "auto" }}
//               exit={{ opacity: 0, width: 0 }}
//               transition={{ duration: 0.18, ease: "easeInOut" }}
//               className="text-[13px] font-semibold whitespace-nowrap overflow-hidden"
//             >
//               {item.label}
//             </motion.span>
//           )}
//         </AnimatePresence>

//         {/* Badge */}
//         {!collapsed && item.badge && (
//           <motion.span
//             initial={{ opacity: 0 }}
//             animate={{ opacity: 1 }}
//             className="ml-auto text-[10px] font-bold px-1.5 py-0.5 rounded-sm"
//             style={{
//               color: item.badgeColor ?? "#10b981",
//               backgroundColor: `${item.badgeColor ?? "#10b981"}18`,
//               border: `1px solid ${item.badgeColor ?? "#10b981"}30`,
//             }}
//           >
//             {item.badge}
//           </motion.span>
//         )}

//         {/* Collapsed badge dot */}
//         {collapsed && item.badge && (
//           <div
//             className="absolute top-1.5 right-1.5 w-1.5 h-1.5 rounded-full"
//             style={{ backgroundColor: item.badgeColor ?? "#10b981" }}
//           />
//         )}
//       </Link>
//     </Tooltip>
//   );
// }

// // ─────────────────────────────────────────────────────────────────────────────
// // SIDEBAR
// // ─────────────────────────────────────────────────────────────────────────────

// interface AdminSidebarProps {
//   userId: string;
//   collapsed: boolean;
//   onToggle: () => void;
//   userName?: string;
//   userEmail?: string;
//   userInitials?: string;
// }

// export function AdminSidebar({
//   userId,
//   collapsed,
//   onToggle,
//   userName = "Isaac Paha",
//   userEmail = "pahaisaac@gmail.com",
//   userInitials = "IP",
// }: AdminSidebarProps) {
//   const pathname = usePathname();

//   const isActive = (href: string) =>
//     pathname === href || (href !== `/admin/${userId}/dashboard` && pathname.startsWith(href));

//   const sidebarW = collapsed ? 64 : 240;

//   return (
//     <motion.aside
//       animate={{ width: sidebarW }}
//       transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
//       className="flex flex-col h-screen bg-[#0c0b09] border-r border-white/[0.06] overflow-hidden flex-shrink-0 relative z-30"
//       style={{ width: sidebarW }}
//     >
//       {/* ── LOGO ────────────────────────────────────────────────────────── */}
//       <div
//         className={`flex items-center border-b border-white/[0.06] flex-shrink-0 ${
//           collapsed ? "justify-center px-0 py-5" : "px-5 py-5 gap-3"
//         }`}
//         style={{ height: 64 }}
//       >
//         {/* Mark */}
//         <div
//           className="w-8 h-8 rounded flex items-center justify-center font-black text-sm flex-shrink-0"
//           style={{ backgroundColor: "#f59e0b", color: "#000" }}
//         >
//           IP
//         </div>

//         <AnimatePresence initial={false}>
//           {!collapsed && (
//             <motion.div
//               initial={{ opacity: 0, width: 0 }}
//               animate={{ opacity: 1, width: "auto" }}
//               exit={{ opacity: 0, width: 0 }}
//               transition={{ duration: 0.18 }}
//               className="overflow-hidden"
//             >
//               <p className="text-[13px] font-black text-white whitespace-nowrap">
//                 isaacpaha.com
//               </p>
//               <p className="text-[10px] text-white/25 whitespace-nowrap">Admin</p>
//             </motion.div>
//           )}
//         </AnimatePresence>
//       </div>

//       {/* ── NAV GROUPS ──────────────────────────────────────────────────── */}
//       <div className="flex-1 overflow-y-auto overflow-x-hidden py-3 scrollbar-none">
//         {NAV_GROUPS.map((group) => (
//           <div key={group.id} className="mb-1">
//             {/* Group label */}
//             <AnimatePresence initial={false}>
//               {!collapsed && (
//                 <motion.p
//                   initial={{ opacity: 0 }}
//                   animate={{ opacity: 1 }}
//                   exit={{ opacity: 0 }}
//                   transition={{ duration: 0.15 }}
//                   className="text-[10px] font-black tracking-[0.2em] uppercase text-white/20 px-5 py-2 mt-2"
//                 >
//                   {group.label}
//                 </motion.p>
//               )}
//             </AnimatePresence>

//             {/* Collapsed group divider */}
//             {collapsed && (
//               <div className="mx-4 my-2 h-px bg-white/[0.06]" />
//             )}

//             {/* Items */}
//             {group.items.map((item) => (
//               <NavItemRow
//                 key={item.id}
//                 item={item}
//                 userId={userId}
//                 collapsed={collapsed}
//                 active={isActive(item.href(userId))}
//               />
//             ))}
//           </div>
//         ))}

//         {/* View site link */}
//         <div className={`mt-2 mb-1 ${collapsed ? "" : ""}`}>
//           {collapsed && <div className="mx-4 mb-2 h-px bg-white/[0.06]" />}
//           <Tooltip label="View site" visible={collapsed}>
//             <a
//               href="/"
//               target="_blank"
//               rel="noopener noreferrer"
//               className={`flex items-center gap-3 rounded-sm transition-all mx-2 py-2.5 text-white/25 hover:text-white/55 hover:bg-white/[0.04] ${
//                 collapsed ? "justify-center px-0" : "px-3"
//               }`}
//             >
//               <ExternalLink className="w-[18px] h-[18px] flex-shrink-0 text-white/25" />
//               <AnimatePresence initial={false}>
//                 {!collapsed && (
//                   <motion.span
//                     initial={{ opacity: 0, width: 0 }}
//                     animate={{ opacity: 1, width: "auto" }}
//                     exit={{ opacity: 0, width: 0 }}
//                     transition={{ duration: 0.18 }}
//                     className="text-[13px] font-semibold whitespace-nowrap overflow-hidden"
//                   >
//                     View site
//                   </motion.span>
//                 )}
//               </AnimatePresence>
//             </a>
//           </Tooltip>
//         </div>
//       </div>

//       {/* ── USER AREA ───────────────────────────────────────────────────── */}
//       <div className="border-t border-white/[0.06] flex-shrink-0">
//         <Tooltip label={userName} visible={collapsed}>
//           <div
//             className={`flex items-center gap-3 py-4 ${
//               collapsed ? "justify-center px-0" : "px-4"
//             }`}
//           >
//             {/* Avatar */}
//             <div className="w-8 h-8 rounded-full bg-amber-500/20 border border-amber-500/30 flex items-center justify-center text-xs font-black text-amber-400 flex-shrink-0">
//               {userInitials}
//             </div>

//             <AnimatePresence initial={false}>
//               {!collapsed && (
//                 <motion.div
//                   initial={{ opacity: 0, width: 0 }}
//                   animate={{ opacity: 1, width: "auto" }}
//                   exit={{ opacity: 0, width: 0 }}
//                   transition={{ duration: 0.18 }}
//                   className="flex-1 min-w-0 overflow-hidden"
//                 >
//                   <p className="text-[12px] font-bold text-white/70 truncate whitespace-nowrap">
//                     {userName}
//                   </p>
//                   <p className="text-[10px] text-white/25 truncate whitespace-nowrap">
//                     {userEmail}
//                   </p>
//                 </motion.div>
//               )}
//             </AnimatePresence>
//           </div>
//         </Tooltip>

//         {/* Collapse toggle */}
//         <button
//           onClick={onToggle}
//           className={`w-full flex items-center gap-2.5 py-3 border-t border-white/[0.05] text-white/25 hover:text-white/60 transition-colors ${
//             collapsed ? "justify-center px-0" : "px-4"
//           }`}
//         >
//           {collapsed ? (
//             <PanelLeft className="w-4 h-4" />
//           ) : (
//             <>
//               <PanelLeftClose className="w-4 h-4" />
//               <span className="text-[11px] font-semibold">Collapse sidebar</span>
//             </>
//           )}
//         </button>
//       </div>
//     </motion.aside>
//   );
// }
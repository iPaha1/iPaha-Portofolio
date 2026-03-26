"use client";

import React, { useState, useRef, useEffect } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import {
  Search, Bell, ChevronRight, Plus, X,
  FileText, Lightbulb, Wrench, AppWindow,
   Settings,  Command,
} from "lucide-react";

// ─── Breadcrumb ───────────────────────────────────────────────────────────────

const SEGMENT_LABELS: Record<string, string> = {
  admin: "Admin",
  dashboard: "Dashboard",
  blog: "Blog",
  ideas: "Ideas Lab",
  tools: "Tools Lab",
  apps: "Apps",
  newsletter: "Newsletter",
  social: "Social Media",
  analytics: "Analytics",
  media: "Media Library",
  settings: "Settings",
  now: "Now Page",
  podcast: "Podcast",
  contacts: "Contacts",
  new: "New",
};

function Breadcrumb({ userId }: { userId: string }) {
  const pathname = usePathname();
  const segments = pathname
    .split("/")
    .filter(Boolean)
    .filter((s) => s !== userId);

  return (
    <nav className="flex items-center gap-1.5">
      {segments.map((seg, i) => {
        const isLast = i === segments.length - 1;
        const label = SEGMENT_LABELS[seg] ?? seg;
        return (
          <React.Fragment key={i}>
            {i > 0 && (
              <ChevronRight className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
            )}
            <span
              className={`text-sm font-semibold ${
                isLast ? "text-stone-800" : "text-stone-400"
              }`}
            >
              {label}
            </span>
          </React.Fragment>
        );
      })}
    </nav>
  );
}

// ─── Command palette (search) ─────────────────────────────────────────────────

const SEARCH_ITEMS = [
  { icon: FileText,   label: "New Blog Post",  href: "blog/new",     group: "Create" },
  { icon: Lightbulb,  label: "New Idea",        href: "ideas/new",    group: "Create" },
  { icon: Wrench,     label: "New Tool",         href: "tools/new",    group: "Create" },
  { icon: AppWindow,  label: "New App",          href: "apps/new",     group: "Create" },
  { icon: FileText,   label: "All Posts",        href: "blog",         group: "Navigate" },
  { icon: Lightbulb,  label: "Ideas Lab",        href: "ideas",        group: "Navigate" },
  { icon: Wrench,     label: "Tools Lab",        href: "tools",        group: "Navigate" },
  { icon: AppWindow,  label: "Apps",             href: "apps",         group: "Navigate" },
  { icon: Settings,   label: "Settings",         href: "settings",     group: "Navigate" },
];

function CommandPalette({
  userId,
  onClose,
}: {
  userId: string;
  onClose: () => void;
}) {
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  const filtered = SEARCH_ITEMS.filter((item) =>
    item.label.toLowerCase().includes(query.toLowerCase())
  );

  const groups = Array.from(new Set(filtered.map((i) => i.group)));

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-start justify-center pt-[15vh]"
      style={{ backgroundColor: "rgba(12,11,9,0.7)", backdropFilter: "blur(8px)" }}
      onClick={onClose}
    >
      <motion.div
        initial={{ opacity: 0, scale: 0.95, y: -12 }}
        animate={{ opacity: 1, scale: 1, y: 0 }}
        exit={{ opacity: 0, scale: 0.97, y: -8 }}
        transition={{ type: "spring", stiffness: 300, damping: 28 }}
        className="w-full max-w-lg bg-white rounded-sm shadow-2xl border border-stone-100 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search input */}
        <div className="flex items-center gap-3 px-4 py-3.5 border-b border-stone-100">
          <Search className="w-4 h-4 text-stone-300 flex-shrink-0" />
          <input
            ref={inputRef}
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder="Search or jump to..."
            className="flex-1 text-sm text-stone-800 placeholder:text-stone-300 focus:outline-none bg-transparent"
          />
          {query && (
            <button onClick={() => setQuery("")} className="text-stone-300 hover:text-stone-600">
              <X className="w-4 h-4" />
            </button>
          )}
          <kbd className="text-[10px] font-bold text-stone-300 border border-stone-200 rounded px-1.5 py-0.5">
            ESC
          </kbd>
        </div>

        {/* Results */}
        <div className="max-h-80 overflow-y-auto py-2">
          {filtered.length === 0 ? (
            <p className="text-center text-sm text-stone-400 py-8">No results for &#34;{query}&#34;</p>
          ) : (
            groups.map((group) => (
              <div key={group}>
                <p className="text-[10px] font-black tracking-widest uppercase text-stone-300 px-4 py-2">
                  {group}
                </p>
                {filtered
                  .filter((i) => i.group === group)
                  .map((item) => (
                    <Link
                      key={item.href}
                      href={`/admin/${userId}/${item.href}`}
                      onClick={onClose}
                      className="flex items-center gap-3 px-4 py-2.5 hover:bg-amber-50 hover:text-amber-900 text-stone-700 transition-colors group"
                    >
                      <div className="w-7 h-7 rounded bg-stone-100 group-hover:bg-amber-100 flex items-center justify-center flex-shrink-0 transition-colors">
                        <item.icon className="w-3.5 h-3.5 text-stone-500 group-hover:text-amber-600" />
                      </div>
                      <span className="text-sm font-medium">{item.label}</span>
                      <ChevronRight className="w-3.5 h-3.5 ml-auto text-stone-200 group-hover:text-amber-400" />
                    </Link>
                  ))}
              </div>
            ))
          )}
        </div>

        {/* Footer hint */}
        <div className="border-t border-stone-100 px-4 py-2.5 flex items-center gap-4">
          <span className="text-[11px] text-stone-300 flex items-center gap-1">
            <kbd className="border border-stone-200 rounded px-1 py-0.5 text-[10px] font-bold">↑↓</kbd>
            Navigate
          </span>
          <span className="text-[11px] text-stone-300 flex items-center gap-1">
            <kbd className="border border-stone-200 rounded px-1 py-0.5 text-[10px] font-bold">↵</kbd>
            Open
          </span>
        </div>
      </motion.div>
    </motion.div>
  );
}

// ─── Notification bell ────────────────────────────────────────────────────────

const MOCK_NOTIFICATIONS = [
  { id: "1", type: "comment", text: "New comment on 'The Trust Problem'", time: "2m ago", read: false },
  { id: "2", type: "like", text: "12 new likes on blog posts", time: "18m ago", read: false },
  { id: "3", type: "subscriber", text: "3 new newsletter subscribers", time: "1h ago", read: true },
  { id: "4", type: "contact", text: "New contact form submission", time: "3h ago", read: true },
];

function NotificationPanel({ onClose }: { onClose: () => void }) {
  const unread = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  return (
    <motion.div
      initial={{ opacity: 0, y: -8, scale: 0.97 }}
      animate={{ opacity: 1, y: 0, scale: 1 }}
      exit={{ opacity: 0, y: -8, scale: 0.97 }}
      transition={{ duration: 0.18, ease: [0.22, 1, 0.36, 1] }}
      className="absolute right-0 top-full mt-2 w-80 bg-white rounded-sm border border-stone-100 shadow-xl z-40 overflow-hidden"
    >
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <span className="text-sm font-black text-stone-800">Notifications</span>
        {unread > 0 && (
          <span className="text-[10px] font-bold text-amber-600 bg-amber-50 border border-amber-100 px-2 py-0.5 rounded-sm">
            {unread} new
          </span>
        )}
      </div>
      <div className="divide-y divide-stone-50 max-h-72 overflow-y-auto">
        {MOCK_NOTIFICATIONS.map((n) => (
          <div
            key={n.id}
            className={`px-4 py-3 flex items-start gap-3 hover:bg-stone-50 transition-colors cursor-pointer ${
              !n.read ? "bg-amber-50/40" : ""
            }`}
          >
            {!n.read && (
              <div className="w-1.5 h-1.5 rounded-full bg-amber-500 flex-shrink-0 mt-1.5" />
            )}
            {n.read && <div className="w-1.5 flex-shrink-0" />}
            <div className="flex-1 min-w-0">
              <p className="text-xs text-stone-700 leading-snug">{n.text}</p>
              <p className="text-[10px] text-stone-400 mt-0.5">{n.time}</p>
            </div>
          </div>
        ))}
      </div>
      <div className="border-t border-stone-100 px-4 py-2.5">
        <button className="text-xs text-amber-600 hover:text-amber-800 font-semibold transition-colors">
          Mark all as read
        </button>
      </div>
    </motion.div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TOPBAR
// ─────────────────────────────────────────────────────────────────────────────

interface AdminTopbarProps {
  userId: string;
  userName?: string;
  userInitials?: string;
}

export function AdminTopbar({
  userId,
  userName = "Isaac Paha",
  userInitials = "IP",
}: AdminTopbarProps) {
  const [searchOpen, setSearchOpen] = useState(false);
  const [notifOpen, setNotifOpen] = useState(false);
  const notifRef = useRef<HTMLDivElement>(null);
  const unreadCount = MOCK_NOTIFICATIONS.filter((n) => !n.read).length;

  // Keyboard shortcut: Cmd+K / Ctrl+K
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setSearchOpen(true);
      }
      if (e.key === "Escape") setSearchOpen(false);
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Close notif panel on outside click
  useEffect(() => {
    const handler = (e: MouseEvent) => {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  return (
    <>
      {/* Command palette */}
      <AnimatePresence>
        {searchOpen && (
          <CommandPalette userId={userId} onClose={() => setSearchOpen(false)} />
        )}
      </AnimatePresence>

      <header className="h-16 flex-shrink-0 bg-[#fafaf9] border-b border-stone-100 flex items-center justify-between px-6 z-20 relative">
        {/* Left: Breadcrumb */}
        <Breadcrumb userId={userId} />

        {/* Right: actions */}
        <div className="flex items-center gap-2">
          {/* Search trigger */}
          <button
            onClick={() => setSearchOpen(true)}
            className="flex items-center gap-2 text-stone-400 hover:text-stone-700 bg-stone-100 hover:bg-stone-150 rounded-sm px-3 py-2 text-xs font-medium transition-all group"
          >
            <Search className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Search</span>
            <span className="hidden sm:flex items-center gap-1 ml-1 text-stone-300">
              <Command className="w-3 h-3" />K
            </span>
          </button>

          {/* Quick create */}
          <Link
            href={`/admin/${userId}/blog/new`}
            className="flex items-center gap-1.5 bg-amber-500 hover:bg-amber-600 text-white text-xs font-bold px-3 py-2 rounded-sm transition-colors"
          >
            <Plus className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">Create</span>
          </Link>

          {/* Notifications */}
          <div ref={notifRef} className="relative">
            <button
              onClick={() => setNotifOpen((o) => !o)}
              className="relative w-9 h-9 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm transition-all"
            >
              <Bell className="w-4 h-4" />
              {unreadCount > 0 && (
                <span className="absolute top-1.5 right-1.5 w-2 h-2 bg-amber-500 rounded-full" />
              )}
            </button>
            <AnimatePresence>
              {notifOpen && <NotificationPanel onClose={() => setNotifOpen(false)} />}
            </AnimatePresence>
          </div>

          {/* Avatar */}
          <a
            href={`/admin/${userId}/settings`}
            className="w-9 h-9 rounded-full bg-amber-500/15 border border-amber-500/25 flex items-center justify-center text-xs font-black text-amber-600 hover:bg-amber-500/25 transition-colors"
          >
            {userInitials}
          </a>
        </div>
      </header>
    </>
  );
}
"use client";

import React, { useState, useEffect } from "react";
import { AdminSidebar } from "./admin-sidebar";
import { AdminTopbar } from "./admin-topbar";


interface AdminLayoutShellProps {
  userId: string;
  children: React.ReactNode;
  userName?: string;
  userEmail?: string;
  userInitials?: string;
}

const COLLAPSED_KEY = "admin-sidebar-collapsed";

export function AdminLayoutShell({
  userId,
  children,
  userName,
  userEmail,
  userInitials,
}: AdminLayoutShellProps) {
  const [collapsed, setCollapsed] = useState(false);
  const [mounted, setMounted] = useState(false);

  // Persist collapse state in localStorage
  useEffect(() => {
    const stored = localStorage.getItem(COLLAPSED_KEY);
    if (stored !== null) setCollapsed(stored === "true");
    setMounted(true);
  }, []);

  const toggleCollapsed = () => {
    setCollapsed((c) => {
      const next = !c;
      localStorage.setItem(COLLAPSED_KEY, String(next));
      return next;
    });
  };

  // Don't render until mounted to avoid hydration mismatch
  if (!mounted) return null;

  return (
    <div className="flex h-screen overflow-hidden bg-[#fafaf9]">
      <AdminSidebar
        userId={userId}
        collapsed={collapsed}
        onToggle={toggleCollapsed}
        userName={userName}
        userEmail={userEmail}
        userInitials={userInitials}
      />

      {/* Main content area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <AdminTopbar
          userId={userId}
          userName={userName}
          userInitials={userInitials}
        />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto overflow-x-hidden">
          {children}
        </main>
      </div>
    </div>
  );
}
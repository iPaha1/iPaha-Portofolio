"use client";

// =============================================================================
// isaacpaha.com — Tool View Tracker
// components/tools/tool-view-tracker.tsx
//
// Drop this component anywhere on a tool's page.
// It fires a single POST to /api/tools/[toolId]/view on first mount.
// Renders nothing — purely side-effect.
//
// Usage:
//   <ToolViewTracker toolId={tool.id} />
// =============================================================================

import { useEffect, useRef } from "react";

interface Props {
  toolId: string;
}

export function ToolViewTracker({ toolId }: Props) {
  const fired = useRef(false);

  useEffect(() => {
    // Guard: only fire once per mount, even in React StrictMode double-invoke
    if (fired.current) return;
    fired.current = true;

    fetch(`/api/tools/${toolId}/view`, {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      // fire-and-forget — don't await, don't block render
    }).catch(() => {
      // Silently fail — view tracking is non-critical
    });
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  return null;
}
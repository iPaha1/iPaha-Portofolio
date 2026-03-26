"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: CopyBtn
// components/admin/hub/shared/copy-btn.tsx
// =============================================================================

import React, { useState } from "react";
import { motion } from "framer-motion";
import { Copy, Check } from "lucide-react";

interface CopyBtnProps {
  text:      string;
  entryId?:  string;
  size?:     "xs" | "sm" | "md";
  label?:    string;
  className?: string;
}

export function CopyBtn({ text, entryId, size = "sm", label, className }: CopyBtnProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 1800);
    // Fire-and-forget copy count increment
    if (entryId) {
      fetch(`/api/admin/hub/${entryId}`, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({ _action: "incrementCopy" }),
      }).catch(() => {});
    }
  };

  const sizeClass =
    size === "xs" ? "text-[10px] px-1.5 py-0.5 gap-1" :
    size === "md" ? "text-sm px-3 py-2 gap-2" :
                    "text-[11px] px-2 py-1 gap-1.5";

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={handleCopy}
      className={`flex items-center font-semibold rounded-sm border transition-all flex-shrink-0 ${sizeClass} ${
        copied
          ? "bg-emerald-50 text-emerald-700 border-emerald-200"
          : "bg-stone-50 text-stone-500 border-stone-200 hover:bg-stone-100 hover:text-stone-700 hover:border-stone-300"
      } ${className ?? ""}`}
    >
      {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
      {label && <span>{copied ? "Copied!" : label}</span>}
    </motion.button>
  );
}
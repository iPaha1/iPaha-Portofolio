// Quick action buttons for common booking scenarios
"use client";

import { Phone, Users, Store, Building2 } from "lucide-react";

interface QuickActionProps {
  onSelect: (type: string) => void;
  accent: string;
}

export function QuickActions({ onSelect, accent }: QuickActionProps) {
  const actions = [
    { id: "walk_in", label: "Walk-in Client", icon: Store, color: "#10b981" },
    { id: "site_visit", label: "Site Visit", icon: Building2, color: "#3b82f6" },
    { id: "phone_call", label: "Phone Call", icon: Phone, color: "#f59e0b" },
    { id: "referral", label: "Referral", icon: Users, color: "#8b5cf6" },
  ];

  return (
    <div className="grid grid-cols-4 gap-2 mb-4">
      {actions.map((action) => {
        const Icon = action.icon;
        return (
          <button
            key={action.id}
            onClick={() => onSelect(action.id)}
            className="flex flex-col items-center gap-2 p-3 bg-white border border-stone-100 rounded-sm hover:shadow-sm transition-all"
          >
            <Icon className="w-5 h-5" style={{ color: action.color }} />
            <span className="text-[10px] font-medium text-stone-600">{action.label}</span>
          </button>
        );
      })}
    </div>
  );
}
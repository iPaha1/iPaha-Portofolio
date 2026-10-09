// _youtube-studio/ui.tsx
// Shared primitives for the YouTube Studio
// Design system: dark zinc theme, subtle borders, clean neutral palette with red-600 accent

import { type ReactNode } from "react";

// ── Status Badge ─────────────────────────────────────────────────────────────

const STATUS_MAP: Record<string, string> = {
  PUBLISHED: "bg-emerald-950 text-emerald-400 border-emerald-800",
  DRAFT: "bg-zinc-800 text-zinc-400 border-zinc-700",
  READY: "bg-sky-950 text-sky-400 border-sky-800",
  SCHEDULED: "bg-violet-950 text-violet-400 border-violet-800",
  FILMING: "bg-amber-950 text-amber-400 border-amber-800",
  EDITING: "bg-orange-950 text-orange-400 border-orange-800",
  GENERATING: "bg-blue-950 text-blue-400 border-blue-800",
  ARCHIVED: "bg-zinc-900 text-zinc-600 border-zinc-800",

  // Lowercase aliases for flexibility
  Published: "bg-emerald-950 text-emerald-400 border-emerald-800",
  Draft: "bg-zinc-800 text-zinc-400 border-zinc-700",
  Ready: "bg-sky-950 text-sky-400 border-sky-800",
  Scheduled: "bg-violet-950 text-violet-400 border-violet-800",
};

export function StatusBadge({ status }: { status: string }) {
  const cls = STATUS_MAP[status] ?? "bg-zinc-800 text-zinc-400 border-zinc-700";

  return (
    <span
      className={`inline-flex items-center px-1.5 py-0.5 rounded-sm text-[10px] font-medium border tracking-wide ${cls}`}
    >
      {status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()}
    </span>
  );
}

// ── Card ─────────────────────────────────────────────────────────────────────

export function Card({
  children,
  className = "",
  noPad = false,
}: {
  children: ReactNode;
  className?: string;
  noPad?: boolean;
}) {
  return (
    <div
      className={`rounded-sm border border-zinc-800 bg-zinc-900 ${
        noPad ? "" : "p-4"
      } ${className}`}
    >
      {children}
    </div>
  );
}

// ── Card Header ───────────────────────────────────────────────────────────────

export function CardHeader({
  title,
  action,
}: {
  title: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800">
      <span className="text-xs font-semibold text-zinc-300 uppercase tracking-wider">
        {title}
      </span>
      {action && <div className="text-xs text-zinc-500">{action}</div>}
    </div>
  );
}

// ── Stat Card ────────────────────────────────────────────────────────────────

export function StatCard({
  label,
  value,
  sub,
  icon: Icon,
}: {
  label: string;
  value: string | number;
  sub?: string;
  icon?: React.ElementType;
}) {
  return (
    <div className="rounded-sm border border-zinc-800 bg-zinc-900 p-4">
      <div className="flex items-center justify-between mb-2">
        <span className="text-[11px] font-medium text-zinc-500 uppercase tracking-wider">
          {label}
        </span>
        {Icon && <Icon className="w-3.5 h-3.5 text-zinc-600" />}
      </div>
      <p className="text-xl font-semibold text-zinc-100 tabular-nums">{value}</p>
      {sub && <p className="text-[11px] text-zinc-600 mt-1">{sub}</p>}
    </div>
  );
}

// ── Skeleton ─────────────────────────────────────────────────────────────────

export function Skeleton({ className = "" }: { className?: string }) {
  return <div className={`animate-pulse rounded-sm bg-zinc-800 ${className}`} />;
}

// ── Empty State ──────────────────────────────────────────────────────────────

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
}: {
  icon: React.ElementType;
  title: string;
  description?: string;
  action?: ReactNode;
}) {
  return (
    <div className="flex flex-col items-center justify-center py-16 px-4 text-center">
      <Icon className="w-8 h-8 text-zinc-700 mb-3" />
      <p className="text-sm font-medium text-zinc-400">{title}</p>
      {description && (
        <p className="text-xs text-zinc-600 mt-1 max-w-xs">{description}</p>
      )}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}

// ── Table Head ───────────────────────────────────────────────────────────────

export function TableHead({ cols }: { cols: string[] }) {
  return (
    <div
      className="grid px-4 py-2.5 border-b border-zinc-800 bg-zinc-900/50"
      style={{ gridTemplateColumns: `repeat(${cols.length}, minmax(0, 1fr))` }}
    >
      {cols.map((c) => (
        <span
          key={c}
          className="text-[10px] font-semibold text-zinc-600 uppercase tracking-wider"
        >
          {c}
        </span>
      ))}
    </div>
  );
}

// ── Button ───────────────────────────────────────────────────────────────────

export function Btn({
  children,
  onClick,
  variant = "default",
  size = "sm",
  disabled = false,
  className = "",
}: {
  children: ReactNode;
  onClick?: () => void;
  variant?: "default" | "primary" | "ghost" | "danger";
  size?: "xs" | "sm";
  disabled?: boolean;
  className?: string;
}) {
  const base =
    "inline-flex items-center gap-1.5 font-medium rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed";

  const sizes = {
    xs: "px-2 py-1 text-[11px]",
    sm: "px-3 py-1.5 text-xs",
  };

  const variants = {
    default:
      "bg-zinc-800 text-zinc-300 border border-zinc-700 hover:bg-zinc-700 hover:text-zinc-100",
    primary: "bg-red-600 text-white border border-red-500 hover:bg-red-500",
    ghost: "text-zinc-500 hover:text-zinc-300 hover:bg-zinc-800",
    danger: "bg-red-950 text-red-400 border border-red-800 hover:bg-red-900",
  };

  return (
    <button
      onClick={onClick}
      disabled={disabled}
      className={`${base} ${sizes[size]} ${variants[variant]} ${className}`}
    >
      {children}
    </button>
  );
}

// ── Input & Label Styles ─────────────────────────────────────────────────────

export const inputCls =
  "w-full rounded-sm border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-zinc-100 placeholder:text-zinc-600 focus:outline-none focus:border-zinc-500 transition-colors";

export const labelCls =
  "block text-[11px] font-semibold text-zinc-500 uppercase tracking-wider mb-1.5";

// ── Section Heading ──────────────────────────────────────────────────────────

export function SectionHeading({ children }: { children: ReactNode }) {
  return (
    <h2 className="text-sm font-semibold text-zinc-200 mb-4">{children}</h2>
  );
}
"use client";
// =============================================================================
// app/admin/[userId]/companies/[companySlug]/bookings/_components/bookings-client.tsx
// =============================================================================

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Calendar, Search, User, Mail, Phone, Building2,
  Clock, CheckCircle, XCircle, AlertCircle, MessageSquare,
  ChevronRight, ExternalLink, RefreshCw, Plus,
} from "lucide-react";
import { BookingDetailPanel } from "./booking-detail-panel";
import { NewBookingModal } from "./new-booking-modal";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Booking {
  id: string; clientName: string; clientEmail: string;
  clientPhone: string | null; clientCompany: string | null;
  clientMessage: string | null; serviceType: string | null;
  preferredDate: Date | null; confirmedDate: Date | null;
  status: string; location: string; meetingUrl: string | null;
  source: string | null; internalNotes: string | null;
  createdAt: Date; updatedAt: Date;
}
interface Company { id: string; slug: string; displayName: string; accentColor: string; }

interface Props {
  company:       Company;
  bookings:      Booking[];
  total:         number;
  page:          number;
  pageSize:      number;
  userId:        string;
  statusCounts:  Record<string, number>;
  initialStatus: string;
  initialSearch: string;
}

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS_CFG: Record<string, { label: string; color: string; bg: string; border: string; icon: React.ElementType }> = {
  PENDING:   { label: "Pending",   color: "#d97706", bg: "#fef3c7", border: "#fde68a", icon: Clock },
  CONFIRMED: { label: "Confirmed", color: "#059669", bg: "#d1fae5", border: "#a7f3d0", icon: CheckCircle },
  COMPLETED: { label: "Completed", color: "#2563eb", bg: "#dbeafe", border: "#bfdbfe", icon: CheckCircle },
  CANCELLED: { label: "Cancelled", color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", icon: XCircle },
  NO_SHOW:   { label: "No-show",   color: "#dc2626", bg: "#fee2e2", border: "#fecaca", icon: AlertCircle },
};

function StatusBadge({ status }: { status: string }) {
  const cfg = STATUS_CFG[status] ?? { label: status, color: "#6b7280", bg: "#f3f4f6", border: "#e5e7eb", icon: Clock };
  const Icon = cfg.icon;
  return (
    <span className="inline-flex items-center gap-1 text-[10px] font-black px-2 py-0.5 rounded-sm border"
      style={{ color: cfg.color, backgroundColor: cfg.bg, borderColor: cfg.border }}>
      <Icon className="w-2.5 h-2.5" />
      {cfg.label}
    </span>
  );
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

function fmtDateTime(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
}

// ── Detail drawer ─────────────────────────────────────────────────────────────
function BookingDrawer({ booking, onClose, accent }: { booking: Booking; onClose: () => void; accent: string }) {
  return (
    <div className="w-80 xl:w-96 flex-shrink-0 bg-white border-l border-stone-100 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100 flex-shrink-0">
        <p className="text-sm font-black text-stone-900">Booking detail</p>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm transition-colors">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Status */}
        <div className="flex items-center justify-between">
          <StatusBadge status={booking.status} />
          <span className="text-[10px] text-stone-400">#{booking.id.slice(-8)}</span>
        </div>
        {/* Client info */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Client</p>
          {[
            { icon: User,      val: booking.clientName },
            { icon: Mail,      val: booking.clientEmail },
            { icon: Phone,     val: booking.clientPhone },
            { icon: Building2, val: booking.clientCompany },
          ].filter((r) => r.val).map(({ icon: Icon, val }, i) => (
            <div key={i} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
              <span className="text-sm text-stone-700">{val}</span>
            </div>
          ))}
        </div>
        {/* Message */}
        {booking.clientMessage && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Message</p>
            <div className="bg-stone-50 rounded-sm p-3 border border-stone-100">
              <p className="text-sm text-stone-700 leading-relaxed whitespace-pre-wrap">{booking.clientMessage}</p>
            </div>
          </div>
        )}
        {/* Booking details */}
        <div className="space-y-2">
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Details</p>
          {[
            { label: "Service",    val: booking.serviceType },
            { label: "Preferred",  val: fmtDateTime(booking.preferredDate) },
            { label: "Confirmed",  val: fmtDateTime(booking.confirmedDate) },
            { label: "Location",   val: booking.location.replace("_", " ") },
            { label: "Source",     val: booking.source },
            { label: "Submitted",  val: fmtDateTime(booking.createdAt) },
          ].filter((r) => r.val && r.val !== "—").map(({ label, val }) => (
            <div key={label} className="flex items-start justify-between gap-2">
              <span className="text-xs text-stone-400 flex-shrink-0">{label}</span>
              <span className="text-xs font-semibold text-stone-700 text-right">{val}</span>
            </div>
          ))}
        </div>
        {/* Meeting link */}
        {booking.meetingUrl && (
          <a href={booking.meetingUrl} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-xs font-semibold px-3 py-2 rounded-sm border transition-colors hover:border-stone-400"
            style={{ color: accent }}>
            <ExternalLink className="w-3.5 h-3.5" />
            Open meeting link
          </a>
        )}
        {/* Internal notes */}
        {booking.internalNotes && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Internal notes</p>
            <div className="bg-amber-50 border border-amber-100 rounded-sm p-3">
              <p className="text-xs text-stone-700 leading-relaxed">{booking.internalNotes}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN ──────────────────────────────────────────────────────────────────────
export function BookingsClient({ company, bookings, total, page, pageSize, userId, statusCounts, initialStatus, initialSearch }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [search,       setSearch]       = useState(initialSearch);
  const [selected,     setSelected]     = useState<Booking | null>(null);
  const [showNewBookingModal, setShowNewBookingModal] = useState(false);
  const accent = company.accentColor;

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      v ? sp.set(k, v) : sp.delete(k);
    }
    sp.delete("page"); // Reset to page 1 on filter change
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  const allStatuses = ["ALL", "PENDING", "CONFIRMED", "COMPLETED", "CANCELLED", "NO_SHOW"];
  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="flex flex-col h-full">
      {/* ── HEADER ──────────────────────────────────────────────────────── */}
      <div className="bg-white border-b border-stone-100 px-6 pt-5 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-stone-900">Bookings</h1>
            <p className="text-sm text-stone-400 mt-0.5">{total.toLocaleString()} total · {company.displayName}</p>
          </div>
          <button 
            onClick={() => setShowNewBookingModal(true)}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm shadow-sm transition-colors"
            style={{ backgroundColor: accent }}
          >
            <Plus className="w-4 h-4" />New booking
          </button>
        </div>
        {/* Status tabs */}
        <div className="flex items-center gap-0.5 overflow-x-auto">
          {allStatuses.map((s) => {
            const count = s === "ALL" ? total : (statusCounts[s] ?? 0);
            const active = activeStatus === s;
            const cfg = STATUS_CFG[s];
            return (
              <button key={s} onClick={() => { setActiveStatus(s); navigate({ status: s === "ALL" ? "" : s }); }}
                className={`flex items-center gap-1.5 px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  active ? "border-b-2" : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
                style={active ? { borderBottomColor: accent, color: accent } : {}}>
                {s !== "ALL" && cfg && <cfg.icon className="w-3 h-3" />}
                {s === "ALL" ? "All" : STATUS_CFG[s]?.label ?? s}
                <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${active ? "bg-stone-100 text-stone-600" : "bg-stone-100 text-stone-400"}`}>
                  {count}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* ── BODY ────────────────────────────────────────────────────────── */}
      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="flex-1 flex flex-col overflow-hidden">
          {/* Toolbar */}
          <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-white flex-shrink-0">
            <div className="relative flex-1 max-w-sm">
              <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
              <input value={search}
                onChange={(e) => { setSearch(e.target.value); navigate({ search: e.target.value }); }}
                placeholder="Search name, email, company..."
                className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400" />
            </div>
            {isPending && <RefreshCw className="w-4 h-4 text-stone-400 animate-spin" />}
            <span className="text-xs text-stone-400 ml-auto">{total} result{total !== 1 ? "s" : ""}</span>
          </div>

          {/* Bookings list */}
          <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
            {bookings.length === 0 ? (
              <div className="flex flex-col items-center py-20 text-center">
                <Calendar className="w-10 h-10 text-stone-200 mb-3" />
                <p className="text-sm text-stone-400 font-medium">
                  {search ? `No bookings matching "${search}"` : "No bookings yet"}
                </p>
              </div>
            ) : (
              bookings.map((b) => (
                <button key={b.id} onClick={() => setSelected(b === selected ? null : b)}
                  className={`w-full text-left px-4 py-3.5 hover:bg-stone-50 transition-colors flex items-start gap-3 group ${selected?.id === b.id ? "bg-amber-50/50 border-l-2" : "border-l-2 border-transparent"}`}
                  style={selected?.id === b.id ? { borderLeftColor: accent } : {}}>
                  {/* Avatar */}
                  <div className="w-8 h-8 rounded-full bg-stone-100 flex items-center justify-center flex-shrink-0 text-xs font-black text-stone-500 mt-0.5">
                    {b.clientName.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-0.5">
                      <p className="text-sm font-semibold text-stone-800 truncate">{b.clientName}</p>
                      <StatusBadge status={b.status} />
                    </div>
                    <p className="text-xs text-stone-400 truncate">{b.clientEmail}</p>
                    {b.clientCompany && <p className="text-xs text-stone-400 truncate">{b.clientCompany}</p>}
                    {b.clientMessage && (
                      <p className="text-xs text-stone-400 mt-1 truncate flex items-center gap-1">
                        <MessageSquare className="w-3 h-3 flex-shrink-0" />
                        {b.clientMessage}
                      </p>
                    )}
                  </div>
                  <div className="text-right flex-shrink-0 ml-2">
                    <p className="text-xs text-stone-400">{fmtDate(b.createdAt)}</p>
                    {b.preferredDate && (
                      <p className="text-[10px] text-stone-300 mt-0.5">{fmtDate(b.preferredDate)}</p>
                    )}
                    <ChevronRight className="w-3.5 h-3.5 text-stone-300 group-hover:text-stone-500 ml-auto mt-1 transition-colors" />
                  </div>
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-stone-100 bg-white flex-shrink-0">
              <button disabled={page <= 1}
                onClick={() => navigate({ page: String(page - 1), status: activeStatus, search })}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                ← Prev
              </button>
              <span className="text-xs text-stone-400">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages}
                onClick={() => navigate({ page: String(page + 1), status: activeStatus, search })}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors">
                Next →
              </button>
            </div>
          )}
        </div>

        {/* Detail drawer */}
        {selected && (
        <BookingDetailPanel
          booking={selected}
          onClose={() => setSelected(null)}
          onUpdate={() => {
            // Refresh the page or refetch data
            window.location.reload();
          }}
          accent={accent}
        />
      )}
      {showNewBookingModal && (
      <NewBookingModal
        companyId={company.id}
        companySlug={company.slug}
        accentColor={accent}
        onClose={() => setShowNewBookingModal(false)}
        onSuccess={() => {
          // Refresh the page to show new booking
          window.location.reload();
        }}
      />
    )}
      </div>
    </div>
  );
}

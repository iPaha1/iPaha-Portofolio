"use client";
// =============================================================================
// INVOICES CLIENT
// app/admin/[userId]/companies/[companySlug]/invoices/_components/invoices-client.tsx
// =============================================================================

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import { FileText, Search, RefreshCw, Plus, XCircle, CheckCircle, Clock, AlertTriangle } from "lucide-react";
import { NewInvoiceModal } from "./new-invoice-modal";

interface LineItem { description: string; quantity: number; unitPrice: number; }
interface Invoice {
  id: string; invoiceNumber: string; clientName: string; clientEmail: string;
  status: string; subtotal: number | string; taxRate: number | string;
  taxAmount: number | string; total: number | string; currency: string;
  issuedAt: Date | null; dueAt: Date | null; paidAt: Date | null;
  lineItems: LineItem[]; notes: string | null; createdAt: Date;
}
interface Company { id: string; slug: string; displayName: string; accentColor: string; }

const INV_STATUS: Record<string, { label: string; color: string; bg: string; icon: React.ElementType }> = {
  DRAFT:     { label: "Draft",     color: "#6b7280", bg: "#f3f4f6", icon: FileText },
  SENT:      { label: "Sent",      color: "#2563eb", bg: "#dbeafe", icon: Clock },
  VIEWED:    { label: "Viewed",    color: "#7c3aed", bg: "#ede9fe", icon: Clock },
  PAID:      { label: "Paid",      color: "#059669", bg: "#d1fae5", icon: CheckCircle },
  OVERDUE:   { label: "Overdue",   color: "#dc2626", bg: "#fee2e2", icon: AlertTriangle },
  CANCELLED: { label: "Cancelled", color: "#9ca3af", bg: "#f9fafb", icon: XCircle },
};

function fmt(n: number | string) {
  return `£${Number(n).toFixed(2)}`;
}

function fmtDate(d: Date | null) {
  if (!d) return "—";
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

export function InvoicesClient({ company, invoices, total, page, pageSize, userId, statusCounts, initialStatus }: {
  company: Company; invoices: Invoice[]; total: number;
  page: number; pageSize: number; userId: string;
  statusCounts: Record<string, number>; initialStatus: string;
}) {
  const router = useRouter(); const pathname = usePathname(); const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [activeStatus, setActiveStatus] = useState(initialStatus);
  const [selected, setSelected] = useState<Invoice | null>(null);
  const [showNewInvoiceModal, setShowNewInvoiceModal] = useState(false);
  const accent = company.accentColor;
  const totalPages = Math.ceil(total / pageSize);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) { v ? sp.set(k, v) : sp.delete(k); }
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-6 pt-5 pb-0 flex-shrink-0">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h1 className="text-xl font-black text-stone-900">Invoices</h1>
            <p className="text-sm text-stone-400 mt-0.5">{total} invoices · {company.displayName}</p>
          </div>
          <button 
            onClick={() => setShowNewInvoiceModal(true)}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm shadow-sm"
            style={{ backgroundColor: accent }}
          >
            <Plus className="w-4 h-4" />New invoice
          </button>
        </div>
        {/* Status tabs */}
        <div className="flex items-center gap-0.5">
          {["ALL", "DRAFT", "SENT", "PAID", "OVERDUE"].map((s) => {
            const count = s === "ALL" ? total : (statusCounts[s] ?? 0);
            const cfg = INV_STATUS[s];
            const active = activeStatus === s;
            return (
              <button key={s} onClick={() => { setActiveStatus(s); navigate({ status: s === "ALL" ? "" : s }); }}
                className={`px-3 py-2.5 text-xs font-semibold border-b-2 whitespace-nowrap transition-all ${
                  active ? "" : "border-transparent text-stone-400 hover:text-stone-700"
                }`}
                style={active ? { borderBottomColor: accent, color: accent } : {}}>
                {s === "ALL" ? "All" : INV_STATUS[s]?.label ?? s}
                <span className="ml-1.5 text-[9px] font-black bg-stone-100 text-stone-500 px-1.5 py-0.5 rounded-sm">{count}</span>
              </button>
            );
          })}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* List */}
        <div className="flex-1 overflow-y-auto divide-y divide-stone-50">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center py-20">
              <FileText className="w-10 h-10 text-stone-200 mb-3" />
              <p className="text-sm text-stone-400">No invoices yet</p>
            </div>
          ) : invoices.map((inv) => {
            const cfg = INV_STATUS[inv.status] ?? INV_STATUS.DRAFT;
            const Icon = cfg.icon;
            const active = selected?.id === inv.id;
            return (
              <button key={inv.id} onClick={() => setSelected(active ? null : inv)}
                className={`w-full text-left px-4 py-4 hover:bg-stone-50 transition-colors flex items-center gap-4 border-l-2 ${active ? "bg-amber-50/50" : "border-transparent"}`}
                style={active ? { borderLeftColor: accent } : {}}>
                <div className="w-8 h-8 rounded-sm flex items-center justify-center flex-shrink-0"
                  style={{ backgroundColor: cfg.bg }}>
                  <Icon className="w-4 h-4" style={{ color: cfg.color }} />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-0.5">
                    <p className="text-sm font-semibold text-stone-800">{inv.invoiceNumber}</p>
                    <span className="text-[9px] font-black px-1.5 py-0.5 rounded-sm"
                      style={{ color: cfg.color, backgroundColor: cfg.bg }}>
                      {cfg.label}
                    </span>
                  </div>
                  <p className="text-xs text-stone-500">{inv.clientName} · {inv.clientEmail}</p>
                </div>
                <div className="text-right flex-shrink-0">
                  <p className="text-sm font-black text-stone-900">{fmt(inv.total)}</p>
                  <p className="text-[10px] text-stone-400 mt-0.5">
                    {inv.paidAt ? `Paid ${fmtDate(inv.paidAt)}` : inv.dueAt ? `Due ${fmtDate(inv.dueAt)}` : fmtDate(inv.createdAt)}
                  </p>
                </div>
              </button>
            );
          })}
        </div>

        {/* Detail panel */}
        {selected && (
          <div className="w-80 flex-shrink-0 bg-white border-l border-stone-100 flex flex-col overflow-hidden">
            <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
              <p className="text-sm font-black text-stone-900">{selected.invoiceNumber}</p>
              <button onClick={() => setSelected(null)} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-sm">
                <XCircle className="w-4 h-4" />
              </button>
            </div>
            <div className="flex-1 overflow-y-auto p-4 space-y-4">
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Client</p>
                <p className="text-sm font-semibold text-stone-800">{selected.clientName}</p>
                <p className="text-xs text-stone-400">{selected.clientEmail}</p>
              </div>
              <div>
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Line items</p>
                <div className="space-y-2">
                  {selected.lineItems.map((item, i) => (
                    <div key={i} className="flex justify-between gap-2">
                      <p className="text-xs text-stone-700 flex-1">{item.description}</p>
                      <p className="text-xs font-semibold text-stone-700 flex-shrink-0">
                        {item.quantity} × {fmt(item.unitPrice)}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
              <div className="border-t border-stone-100 pt-3 space-y-1">
                {[
                  { label: "Subtotal", val: fmt(selected.subtotal) },
                  { label: `Tax (${selected.taxRate}%)`, val: fmt(selected.taxAmount) },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between text-xs">
                    <span className="text-stone-400">{label}</span>
                    <span className="text-stone-700">{val}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-black pt-1 border-t border-stone-100">
                  <span>Total</span><span>{fmt(selected.total)}</span>
                </div>
              </div>
              <div className="space-y-1 text-xs">
                {[
                  { label: "Issued",  val: fmtDate(selected.issuedAt) },
                  { label: "Due",     val: fmtDate(selected.dueAt) },
                  { label: "Paid",    val: fmtDate(selected.paidAt) },
                ].map(({ label, val }) => (
                  <div key={label} className="flex justify-between">
                    <span className="text-stone-400">{label}</span>
                    <span className="text-stone-700">{val}</span>
                  </div>
                ))}
              </div>
              {selected.notes && (
                <div className="bg-stone-50 rounded-sm p-3 border border-stone-100">
                  <p className="text-xs text-stone-600">{selected.notes}</p>
                </div>
              )}
            </div>
          </div>
        )}
      </div>

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-stone-100 bg-white flex-shrink-0">
          <button disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) })}
            className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400 disabled:opacity-40">← Prev</button>
          <span className="text-xs text-stone-400">Page {page} of {totalPages}</span>
          <button disabled={page >= totalPages} onClick={() => navigate({ page: String(page + 1) })}
            className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400 disabled:opacity-40">Next →</button>
        </div>
      )}

      {showNewInvoiceModal && (
        <NewInvoiceModal
          companyId={company.id}
          companySlug={company.slug}
          accentColor={accent}
          onClose={() => setShowNewInvoiceModal(false)}
          onSuccess={() => {
            window.location.reload();
          }}
        />
      )}
    </div>
  );
}

// components/debt/DebtDashboard.tsx
"use client";

import { useCallback, useEffect, useState } from "react";
import { UserButton }                        from "@clerk/nextjs";
import { getDisplayName }                    from "@/lib/debt/constants";
import { AddEntryModal } from "./add-entry-modal";
import { DisputeModal } from "./dispute-modal";

// ── Types ────────────────────────────────────────────────────────────────────

interface DebtEntry {
  id: string; createdAt: string; createdByEmail: string;
  amountGBP: number; amountVND: number; exchangeRateAtTransfer: number;
  dateOfTransfer: string; description: string | null;
  evidenceUrl: string | null; status: "PENDING" | "CONFIRMED" | "DISPUTED";
  confirmedByEmail: string | null; confirmedAt: string | null;
  disputeNote: string | null; disputeEvidenceUrl: string | null;
}

interface RepaymentEntry {
  id: string; createdAt: string; createdByEmail: string;
  amountGBP: number; amountVND: number; exchangeRateAtRepayment: number;
  dateOfPayment: string; description: string | null;
  evidenceUrl: string | null; status: "PENDING" | "CONFIRMED" | "DISPUTED";
  confirmedByEmail: string | null; confirmedAt: string | null;
  disputeNote: string | null; disputeEvidenceUrl: string | null;
  debtEntryId: string | null;
}

interface Summary {
  totalBorrowedGBP: number; totalBorrowedVND: number;
  totalRepaidGBP:   number; totalRepaidVND:   number;
  outstandingGBP:   number; outstandingVND:   number;
  pendingCount:     number; disputedCount:    number;
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function fmtGBP(n: number)  { return `£${n.toLocaleString("en-GB", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`; }
function fmtVND(n: number)  { return `₫${Math.round(n).toLocaleString("en-GB")}`; }
function fmtDate(s: string) { return new Date(s).toLocaleDateString("en-GB", { day: "2-digit", month: "short", year: "numeric" }); }

const STATUS_STYLES: Record<string, string> = {
  PENDING:   "bg-amber-400/15  text-amber-300  border border-amber-400/30",
  CONFIRMED: "bg-green-400/15  text-green-300  border border-green-400/30",
  DISPUTED:  "bg-red-400/15    text-red-300    border border-red-400/30",
};

// ── Main component ─────────────────────────────────────────────────────────

export function DebtDashboard({ currentUserEmail }: { currentUserEmail: string }) {
  const [entries,    setEntries]    = useState<DebtEntry[]>([]);
  const [repayments, setRepayments] = useState<RepaymentEntry[]>([]);
  const [summary,    setSummary]    = useState<Summary | null>(null);
  const [loading,    setLoading]    = useState(true);

  const [modal,    setModal]    = useState<"debt" | "repayment" | null>(null);
  const [dispute,  setDispute]  = useState<{ id: string; type: "debt" | "repayment" } | null>(null);
  const [tab,      setTab]      = useState<"all" | "debt" | "repayments" | "disputed">("all");
  const [explainer, setExplainer] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    const [eRes, rRes, sRes] = await Promise.all([
      fetch("/api/debt/entries"),
      fetch("/api/debt/repayments"),
      fetch("/api/debt/summary"),
    ]);
    const [eData, rData, sData] = await Promise.all([eRes.json(), rRes.json(), sRes.json()]);
    setEntries(eData.entries   ?? []);
    setRepayments(rData.repayments ?? []);
    setSummary(sData.summary   ?? null);
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  async function handleConfirm(id: string, type: "debt" | "repayment") {
    const endpoint = type === "debt" ? `/api/debt/entries/${id}` : `/api/debt/repayments/${id}`;
    await fetch(endpoint, {
      method:  "PATCH",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ action: "confirm" }),
    });
    load();
  }

  const confirmedEntries = entries
    .filter((e) => e.status === "CONFIRMED")
    .map((e) => ({
      id:              e.id,
      description:     e.description ?? "",
      amountGBP:       e.amountGBP,
      dateOfTransfer:  e.dateOfTransfer,
    }));

  // Items the other party logged, awaiting current user's confirmation
  const pendingForMe = [
    ...entries.filter(
      (e) => e.status === "PENDING" && e.createdByEmail !== currentUserEmail
    ).map((e) => ({ ...e, _type: "debt" as const })),
    ...repayments.filter(
      (r) => r.status === "PENDING" && r.createdByEmail !== currentUserEmail
    ).map((r) => ({ ...r, _type: "repayment" as const })),
  ];

  // Full ledger filtered by tab
  type LedgerItem =
    | (DebtEntry      & { _type: "debt" })
    | (RepaymentEntry & { _type: "repayment" });

  const allItems: LedgerItem[] = [
    ...entries.map((e) => ({ ...e, _type: "debt" as const })),
    ...repayments.map((r) => ({ ...r, _type: "repayment" as const })),
  ].sort(
    (a, b) =>
      new Date(
        a._type === "debt" ? a.dateOfTransfer : (a as RepaymentEntry).dateOfPayment
      ).getTime() -
      new Date(
        b._type === "debt" ? b.dateOfTransfer : (b as RepaymentEntry).dateOfPayment
      ).getTime()
  ).reverse();

  const filteredItems = allItems.filter((item) => {
    if (tab === "all")       return true;
    if (tab === "debt")      return item._type === "debt";
    if (tab === "repayments") return item._type === "repayment";
    if (tab === "disputed")  return item.status === "DISPUTED";
    return true;
  });

  // ── Render ─────────────────────────────────────────────────────────────────

  return (
    <>
      <link
        href="https://fonts.googleapis.com/css2?family=Cormorant+Garamond:wght@400;600;700&family=JetBrains+Mono:wght@400;500&display=swap"
        rel="stylesheet"
      />

      <div className="min-h-screen bg-[#1a1714] text-[#f5f0e8]"
           style={{ backgroundImage: "url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='4' height='4'%3E%3Crect width='4' height='4' fill='%231a1714'/%3E%3Ccircle cx='1' cy='1' r='0.5' fill='%23ffffff' opacity='0.015'/%3E%3C/svg%3E\")" }}>

        {/* ── Header ───────────────────────────────────────────────────── */}
        <header className="border-b border-[#2e2a25] bg-[#1a1714]/95 sticky top-0 z-40 backdrop-blur-sm">
          <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
            <div>
              <h1 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 700 }}
                  className="text-2xl text-[#c9a84c] tracking-wide">
                Debt Repayment Ledger
              </h1>
              <p className="text-xs text-[#5a5248] mt-0.5 tracking-widest uppercase">
                Isaac Paha · Fokanta — Private Record
              </p>
            </div>
            <div className="flex items-center gap-3">
              <span className="text-xs text-[#5a5248] hidden sm:block">
                {getDisplayName(currentUserEmail)}
              </span>
              <UserButton />
            </div>
          </div>
        </header>

        <main className="max-w-5xl mx-auto px-6 py-8 space-y-8">

          {/* ── Summary Banner ──────────────────────────────────────────── */}
          {loading ? (
            <div className="h-40 rounded-2xl bg-[#1e1b18] border border-[#2e2a25] animate-pulse" />
          ) : summary && (
            <div className="rounded-2xl border border-[#c9a84c]/20 bg-gradient-to-br from-[#1e1b18] to-[#221f1c] p-6">
              <div className="grid grid-cols-2 md:grid-cols-4 gap-6">
                {[
                  { label: "Total Borrowed",  gbp: summary.totalBorrowedGBP, vnd: summary.totalBorrowedVND,  color: "#a09880" },
                  { label: "Total Repaid",    gbp: summary.totalRepaidGBP,   vnd: summary.totalRepaidVND,    color: "#6aaa8a" },
                  { label: "Outstanding",     gbp: summary.outstandingGBP,   vnd: summary.outstandingVND,    color: "#c9a84c", large: true },
                  { label: "Pending / Disputed", gbp: null, vnd: null,
                    custom: `${summary.pendingCount} pending · ${summary.disputedCount} disputed`, color: "#a09880" },
                ].map(({ label, gbp, vnd, color, large, custom }) => (
                  <div key={label}>
                    <p className="text-xs uppercase tracking-widest mb-2" style={{ color: "#5a5248" }}>{label}</p>
                    {custom ? (
                      <p className="text-sm" style={{ color }}>{custom}</p>
                    ) : (
                      <>
                        <p style={{ fontFamily: "'JetBrains Mono', monospace", color, fontSize: large ? "1.5rem" : "1.1rem", fontWeight: 500 }}>
                          {fmtGBP(gbp!)}
                        </p>
                        <p className="text-xs mt-1" style={{ color: "#5a5248", fontFamily: "'JetBrains Mono', monospace" }}>
                          {fmtVND(vnd!)}
                        </p>
                      </>
                    )}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ── Action Buttons ───────────────────────────────────────────── */}
          <div className="flex flex-wrap gap-3">
            <button
              onClick={() => setModal("debt")}
              className="px-5 py-2.5 rounded-xl bg-[#c9a84c] text-[#1a1714] font-semibold text-sm
                         hover:bg-[#d4b55e] transition-colors"
            >
              + Log Borrowed Amount
            </button>
            <button
              onClick={() => setModal("repayment")}
              className="px-5 py-2.5 rounded-xl bg-[#2e2a25] border border-[#3a3530] text-[#c9a84c]
                         font-semibold text-sm hover:bg-[#3a3530] transition-colors"
            >
              + Log Repayment
            </button>
            <button
              onClick={() => setExplainer(!explainer)}
              className="px-5 py-2.5 rounded-xl bg-transparent border border-[#3a3530] text-[#5a5248]
                         text-sm hover:border-[#5a5248] transition-colors ml-auto"
            >
              {explainer ? "Hide" : "Show"} Exchange Rate Agreement
            </button>
          </div>

          {/* ── Exchange Rate Explainer ─────────────────────────────────── */}
          {explainer && (
            <div className="rounded-2xl border border-[#3a3530] bg-[#1e1b18] p-6 space-y-3">
              <h3 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                  className="text-lg text-[#c9a84c]">
                Exchange Rate Agreement — How It Works
              </h3>
              <div className="text-sm text-[#a09880] space-y-2 leading-relaxed">
                <p>
                  Fokanta lent Isaac money in <strong className="text-[#f5f0e8]">British Pounds (£ GBP)</strong>,
                  and each transfer was recorded in both GBP and the equivalent <strong className="text-[#f5f0e8]">Vietnamese Dong (₫ VND)</strong> at the exchange rate that day.
                </p>
                <p>
                  The agreement is: <strong className="text-[#f5f0e8]">Fokanta must never receive less VND purchasing power than he gave.</strong>
                </p>
                <div className="bg-[#221f1c] rounded-xl p-4 space-y-2 border border-[#3a3530]">
                  <p className="text-xs text-[#5a5248] uppercase tracking-widest font-medium">Example</p>
                  <p>Fokanta lent <span className="text-[#c9a84c]">£5,000</span> when the rate was <span className="text-[#c9a84c]">₫31,500/£</span> → that was <span className="text-[#c9a84c]">₫157,500,000</span>.</p>
                  <p><strong className="text-[#f5f0e8]">If the rate has fallen</strong> to ₫28,000/£ at repayment: £5,000 × ₫28,000 = ₫140,000,000 — less than original. Isaac still pays the full <span className="text-[#c9a84c]">£5,000 GBP</span>, which is the agreed amount.</p>
                  <p><strong className="text-[#f5f0e8]">If the rate has risen</strong> to ₫35,000/£: £5,000 × ₫35,000 = ₫175,000,000 — more than original. Isaac pays <span className="text-[#c9a84c]">£5,000 GBP</span> and Fokanta receives a favourable VND equivalent.</p>
                </div>
                <p className="text-xs text-[#5a5248]">
                  In short: repayments are always denominated in GBP. The VND column is displayed for transparency and to verify the agreement is being honoured.
                </p>
              </div>
            </div>
          )}

          {/* ── Pending Confirmations ────────────────────────────────────── */}
          {pendingForMe.length > 0 && (
            <div>
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                  className="text-xl text-[#f5f0e8] mb-4">
                Awaiting Your Confirmation
              </h2>
              <div className="space-y-3">
                {pendingForMe.map((item) => {
                  const isDebt     = item._type === "debt";
                  const dateStr    = isDebt
                    ? fmtDate((item as DebtEntry).dateOfTransfer)
                    : fmtDate((item as RepaymentEntry).dateOfPayment);
                  const typeLabel  = isDebt ? "Debt entry" : "Repayment";
                  const bgColor    = isDebt ? "border-[#c9a84c]/20" : "border-green-500/20";

                  return (
                    <div key={item.id}
                         className={`rounded-xl border ${bgColor} bg-[#1e1b18] p-4 flex flex-col sm:flex-row sm:items-center gap-4`}>
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-1">
                          <span className="text-xs uppercase tracking-widest text-[#5a5248]">{typeLabel}</span>
                          <span className="text-xs text-[#5a5248]">·</span>
                          <span className="text-xs text-[#5a5248]">
                            logged by {getDisplayName(item.createdByEmail)} · {dateStr}
                          </span>
                        </div>
                        <div className="flex items-baseline gap-3">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                className="text-[#c9a84c] text-lg font-medium">
                            {fmtGBP(item.amountGBP)}
                          </span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                className="text-xs text-[#5a5248]">
                            {fmtVND(item.amountVND)}
                          </span>
                          <span className="text-xs text-[#5a5248]">
                            @ ₫{Number(item._type === "debt"
                              ? (item as DebtEntry).exchangeRateAtTransfer
                              : (item as RepaymentEntry).exchangeRateAtRepayment
                            ).toLocaleString()}/£
                          </span>
                        </div>
                        {item.description && (
                          <p className="text-sm text-[#a09880] mt-1">{item.description}</p>
                        )}
                        {item.evidenceUrl && (
                          <a href={item.evidenceUrl} target="_blank" rel="noreferrer"
                             className="text-xs text-[#c9a84c] underline mt-1 inline-block">
                            View evidence
                          </a>
                        )}
                      </div>
                      <div className="flex gap-2 shrink-0">
                        <button
                          onClick={() => handleConfirm(item.id, item._type)}
                          className="px-4 py-2 rounded-lg bg-green-500/20 border border-green-500/30
                                     text-green-300 text-sm hover:bg-green-500/30 transition-colors"
                        >
                          Confirm ✓
                        </button>
                        <button
                          onClick={() => setDispute({ id: item.id, type: item._type })}
                          className="px-4 py-2 rounded-lg bg-red-500/10 border border-red-500/20
                                     text-red-300 text-sm hover:bg-red-500/20 transition-colors"
                        >
                          Dispute
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* ── Full Ledger ──────────────────────────────────────────────── */}
          <div>
            <div className="flex items-center justify-between mb-4">
              <h2 style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
                  className="text-xl text-[#f5f0e8]">
                Full Ledger
              </h2>
              <div className="flex gap-1">
                {(["all", "debt", "repayments", "disputed"] as const).map((t) => (
                  <button key={t} onClick={() => setTab(t)}
                          className={`px-3 py-1 rounded-lg text-xs capitalize transition-colors ${
                            tab === t
                              ? "bg-[#c9a84c]/20 text-[#c9a84c] border border-[#c9a84c]/30"
                              : "text-[#5a5248] hover:text-[#a09880]"
                          }`}>
                    {t}
                  </button>
                ))}
              </div>
            </div>

            {loading ? (
              <div className="space-y-2">
                {[1, 2, 3].map((i) => (
                  <div key={i} className="h-16 rounded-xl bg-[#1e1b18] animate-pulse" />
                ))}
              </div>
            ) : filteredItems.length === 0 ? (
              <div className="text-center py-16 text-[#3a3530]">
                <p className="text-4xl mb-3">📒</p>
                <p>No entries yet. Start by logging a borrowed amount above.</p>
              </div>
            ) : (
              <div className="space-y-2">
                {filteredItems.map((item) => {
                  const isDebt  = item._type === "debt";
                  const dateStr = isDebt
                    ? fmtDate((item as DebtEntry).dateOfTransfer)
                    : fmtDate((item as RepaymentEntry).dateOfPayment);
                  const rate    = isDebt
                    ? (item as DebtEntry).exchangeRateAtTransfer
                    : (item as RepaymentEntry).exchangeRateAtRepayment;

                  return (
                    <div key={item.id}
                         className="rounded-xl border border-[#2e2a25] bg-[#1e1b18] px-5 py-4
                                    hover:border-[#3a3530] transition-colors">
                      <div className="flex flex-col sm:flex-row sm:items-center gap-3">
                        {/* Type badge */}
                        <span className={`shrink-0 text-xs px-2 py-0.5 rounded-full font-medium ${
                          isDebt
                            ? "bg-[#c9a84c]/15 text-[#c9a84c] border border-[#c9a84c]/25"
                            : "bg-green-400/15 text-green-300 border border-green-400/25"
                        }`}>
                          {isDebt ? "Borrowed" : "Repayment"}
                        </span>

                        {/* Date */}
                        <span className="text-xs text-[#5a5248] shrink-0">{dateStr}</span>

                        {/* Amounts */}
                        <div className="flex items-baseline gap-2 flex-1">
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                className="text-[#f5f0e8] font-medium">
                            {fmtGBP(item.amountGBP)}
                          </span>
                          <span style={{ fontFamily: "'JetBrains Mono', monospace" }}
                                className="text-xs text-[#5a5248]">
                            {fmtVND(item.amountVND)}
                          </span>
                          <span className="text-xs text-[#3a3530]">
                            @ ₫{Number(rate).toLocaleString()}/£
                          </span>
                        </div>

                        {/* Description */}
                        {item.description && (
                          <span className="text-xs text-[#a09880] truncate max-w-[180px]">
                            {item.description}
                          </span>
                        )}

                        {/* Status */}
                        <span className={`text-xs px-2 py-0.5 rounded-full shrink-0 ${STATUS_STYLES[item.status]}`}>
                          {item.status.toLowerCase()}
                        </span>

                        {/* By */}
                        <span className="text-xs text-[#3a3530] shrink-0">
                          by {getDisplayName(item.createdByEmail)}
                        </span>

                        {/* Evidence link */}
                        {item.evidenceUrl && (
                          <a href={item.evidenceUrl} target="_blank" rel="noreferrer"
                             className="text-xs text-[#c9a84c]/70 hover:text-[#c9a84c] underline shrink-0">
                            Evidence
                          </a>
                        )}
                      </div>

                      {/* Dispute info */}
                      {item.status === "DISPUTED" && item.disputeNote && (
                        <div className="mt-3 text-xs text-red-300 bg-red-400/10 rounded-lg px-3 py-2 border border-red-400/20">
                          <strong>Dispute:</strong> {item.disputeNote}
                          {item.disputeEvidenceUrl && (
                            <a href={item.disputeEvidenceUrl} target="_blank" rel="noreferrer"
                               className="ml-2 underline">
                              Counter-evidence
                            </a>
                          )}
                        </div>
                      )}

                      {/* Confirmed info */}
                      {item.status === "CONFIRMED" && item.confirmedByEmail && (
                        <p className="mt-1.5 text-xs text-[#3a3530]">
                          Confirmed by {getDisplayName(item.confirmedByEmail)}
                          {item.confirmedAt ? ` on ${fmtDate(item.confirmedAt)}` : ""}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>

          {/* ── Footer ─────────────────────────────────────────────────── */}
          <footer className="border-t border-[#2e2a25] pt-6 pb-8 text-center">
            <p className="text-xs text-[#3a3530] leading-relaxed">
              This page is a private record between{" "}
              <span className="text-[#5a5248]">Isaac Paha</span> and{" "}
              <span className="text-[#5a5248]">Fokanta</span>. All entries require
              confirmation from the other party before being counted in the balance.
              This record is intended to prevent any misunderstanding or confusion.
            </p>
            <p className="text-xs text-[#2e2a25] mt-2">
              Last updated: {new Date().toLocaleDateString("en-GB", { day: "2-digit", month: "long", year: "numeric" })}
            </p>
          </footer>

        </main>
      </div>

      {/* ── Modals ───────────────────────────────────────────────────────── */}
      {modal && (
        <AddEntryModal
          mode={modal}
          confirmedEntries={confirmedEntries}
          onSuccess={load}
          onClose={() => setModal(null)}
        />
      )}

      {dispute && (
        <DisputeModal
          entryId={dispute.id}
          entryType={dispute.type}
          onSuccess={load}
          onClose={() => setDispute(null)}
        />
      )}
    </>
  );
}
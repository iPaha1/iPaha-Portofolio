// components/debt/AddEntryModal.tsx
"use client";

import { useState }          from "react";
import { EvidenceUploader } from "./evidence-uploader";


type Mode = "debt" | "repayment";

interface Props {
  mode:              Mode;
  confirmedEntries?: { id: string; description: string; amountGBP: number; dateOfTransfer: string }[];
  onSuccess:         () => void;
  onClose:           () => void;
}

export function AddEntryModal({ mode, confirmedEntries = [], onSuccess, onClose }: Props) {
  const [amountGBP,    setAmountGBP]    = useState("");
  const [amountVND,    setAmountVND]    = useState("");
  const [rate,         setRate]         = useState("");
  const [date,         setDate]         = useState("");
  const [description,  setDescription]  = useState("");
  const [evidenceUrl,  setEvidenceUrl]  = useState<string | null>(null);
  const [evidencePid,  setEvidencePid]  = useState<string | null>(null);
  const [linkDebt,     setLinkDebt]     = useState<"total" | "specific">("total");
  const [debtEntryId,  setDebtEntryId]  = useState<string>("");
  const [submitting,   setSubmitting]   = useState(false);
  const [error,        setError]        = useState<string | null>(null);

  // Auto-calculate VND when GBP and rate are entered
  function handleGBPOrRate(gbp: string, r: string) {
    if (gbp && r) {
      const calc = (parseFloat(gbp) * parseFloat(r)).toFixed(0);
      setAmountVND(calc);
    }
  }

  async function handleSubmit() {
    setError(null);
    if (!amountGBP || !amountVND || !rate || !date) {
      setError("Please fill in all required fields.");
      return;
    }
    setSubmitting(true);

    const endpoint = mode === "debt" ? "/api/debt/entries" : "/api/debt/repayments";
    const payload =
      mode === "debt"
        ? {
            amountGBP,
            amountVND,
            exchangeRateAtTransfer: rate,
            dateOfTransfer: date,
            description,
            evidenceUrl,
            evidencePublicId: evidencePid,
          }
        : {
            amountGBP,
            amountVND,
            exchangeRateAtRepayment: rate,
            dateOfPayment: date,
            description,
            evidenceUrl,
            evidencePublicId: evidencePid,
            debtEntryId: linkDebt === "specific" && debtEntryId ? debtEntryId : null,
          };

    try {
      const res = await fetch(endpoint, {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify(payload),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Something went wrong");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Submission failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full bg-[#221f1c] border border-[#3a3530] rounded-lg px-3 py-2 text-[#f5f0e8] " +
    "text-sm focus:outline-none focus:border-[#c9a84c]/60 placeholder-[#5a5248]";

  const labelCls = "block text-xs text-[#a09880] mb-1 font-medium tracking-wide uppercase";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1b18] border border-[#3a3530] rounded-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-[#3a3530]">
          <h2
            className="text-xl text-[#f5f0e8]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            {mode === "debt" ? "Log Borrowed Amount" : "Log Repayment"}
          </h2>
          <button
            onClick={onClose}
            className="text-[#5a5248] hover:text-[#f5f0e8] text-2xl leading-none transition-colors"
          >
            ×
          </button>
        </div>

        {/* Body */}
        <div className="p-6 space-y-4">
          {/* Amounts row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className={labelCls}>Amount (£ GBP) *</label>
              <input
                type="number"
                min="0"
                step="0.01"
                placeholder="e.g. 500.00"
                value={amountGBP}
                onChange={(e) => {
                  setAmountGBP(e.target.value);
                  handleGBPOrRate(e.target.value, rate);
                }}
                className={inputCls}
              />
            </div>
            <div>
              <label className={labelCls}>Exchange Rate (₫ per £1) *</label>
              <input
                type="number"
                min="0"
                step="1"
                placeholder="e.g. 31500"
                value={rate}
                onChange={(e) => {
                  setRate(e.target.value);
                  handleGBPOrRate(amountGBP, e.target.value);
                }}
                className={inputCls}
              />
            </div>
          </div>

          <div>
            <label className={labelCls}>Amount in ₫ VND * (auto-calculated, editable)</label>
            <input
              type="number"
              min="0"
              step="1"
              placeholder="Auto-filled when GBP × rate entered"
              value={amountVND}
              onChange={(e) => setAmountVND(e.target.value)}
              className={inputCls}
            />
            <p className="text-xs text-[#5a5248] mt-1">
              Auto-calculated from GBP × rate. You can override if needed.
            </p>
          </div>

          <div>
            <label className={labelCls}>
              {mode === "debt" ? "Date of Transfer *" : "Date of Payment *"}
            </label>
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
              className={inputCls}
            />
          </div>

          <div>
            <label className={labelCls}>Description / Notes</label>
            <textarea
              rows={2}
              placeholder={
                mode === "debt"
                  ? "e.g. Bank transfer for rent, March 2024"
                  : "e.g. Partial repayment via Wise"
              }
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className={inputCls + " resize-none"}
            />
          </div>

          {/* Repayment link option */}
          {mode === "repayment" && confirmedEntries.length > 0 && (
            <div>
              <label className={labelCls}>Apply this repayment to</label>
              <div className="flex gap-3 mb-2">
                {(["total", "specific"] as const).map((opt) => (
                  <label
                    key={opt}
                    className="flex items-center gap-2 cursor-pointer text-sm text-[#a09880]"
                  >
                    <input
                      type="radio"
                      name="linkDebt"
                      value={opt}
                      checked={linkDebt === opt}
                      onChange={() => setLinkDebt(opt)}
                      className="accent-[#c9a84c]"
                    />
                    {opt === "total" ? "Overall balance" : "A specific debt entry"}
                  </label>
                ))}
              </div>
              {linkDebt === "specific" && (
                <select
                  value={debtEntryId}
                  onChange={(e) => setDebtEntryId(e.target.value)}
                  className={inputCls}
                >
                  <option value="">Select a debt entry…</option>
                  {confirmedEntries.map((e) => (
                    <option key={e.id} value={e.id}>
                      £{e.amountGBP.toLocaleString()} —{" "}
                      {e.description ?? "No description"} (
                      {new Date(e.dateOfTransfer).toLocaleDateString("en-GB")})
                    </option>
                  ))}
                </select>
              )}
            </div>
          )}

          {/* Evidence upload */}
          <div>
            <label className={labelCls}>Evidence (optional)</label>
            <EvidenceUploader
              label={mode === "debt" ? "debt-entry" : "repayment"}
              onUploaded={({ url, publicId }: { url: string; publicId: string | null }) => {
                setEvidenceUrl(url);
                setEvidencePid(publicId);
              }}
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>

        {/* Footer */}
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#3a3530] text-[#a09880]
                       hover:border-[#5a5248] transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg bg-[#c9a84c] text-[#1a1714] font-semibold text-sm
                       hover:bg-[#d4b55e] transition-colors disabled:opacity-50"
          >
            {submitting ? "Saving…" : "Submit Entry"}
          </button>
        </div>
      </div>
    </div>
  );
}
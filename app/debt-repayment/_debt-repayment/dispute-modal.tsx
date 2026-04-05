// components/debt/DisputeModal.tsx
"use client";

import { useState }         from "react";
import { EvidenceUploader } from "./evidence-uploader";


interface Props {
  entryId:   string;
  entryType: "debt" | "repayment";
  onSuccess: () => void;
  onClose:   () => void;
}

export function DisputeModal({ entryId, entryType, onSuccess, onClose }: Props) {
  const [note,        setNote]        = useState("");
  const [evidenceUrl, setEvidenceUrl] = useState<string | null>(null);
  const [evidencePid, setEvidencePid] = useState<string | null>(null);
  const [submitting,  setSubmitting]  = useState(false);
  const [error,       setError]       = useState<string | null>(null);

  async function handleSubmit() {
    setError(null);
    setSubmitting(true);
    const endpoint =
      entryType === "debt"
        ? `/api/debt/entries/${entryId}`
        : `/api/debt/repayments/${entryId}`;

    try {
      const res = await fetch(endpoint, {
        method:  "PATCH",
        headers: { "Content-Type": "application/json" },
        body:    JSON.stringify({
          action:                 "dispute",
          disputeNote:            note || null,
          disputeEvidenceUrl:     evidenceUrl,
          disputeEvidencePublicId: evidencePid,
        }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Failed to dispute");
      onSuccess();
      onClose();
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : "Failed");
    } finally {
      setSubmitting(false);
    }
  }

  const inputCls =
    "w-full bg-[#221f1c] border border-[#3a3530] rounded-lg px-3 py-2 text-[#f5f0e8] " +
    "text-sm focus:outline-none focus:border-[#c9a84c]/60 placeholder-[#5a5248]";

  return (
    <div className="fixed inset-0 bg-black/70 flex items-center justify-center z-50 p-4">
      <div className="bg-[#1e1b18] border border-[#e24b4a]/30 rounded-2xl w-full max-w-md shadow-2xl">
        <div className="flex items-center justify-between p-6 border-b border-[#3a3530]">
          <h2
            className="text-xl text-[#f5f0e8]"
            style={{ fontFamily: "'Cormorant Garamond', serif", fontWeight: 600 }}
          >
            Raise a Dispute
          </h2>
          <button onClick={onClose} className="text-[#5a5248] hover:text-[#f5f0e8] text-2xl">×</button>
        </div>
        <div className="p-6 space-y-4">
          <p className="text-sm text-[#a09880]">
            Explain why you disagree with this entry. You can also upload counter-evidence.
            Both of you will see this note.
          </p>
          <div>
            <label className="block text-xs text-[#a09880] mb-1 uppercase tracking-wide font-medium">
              Dispute Note (optional)
            </label>
            <textarea
              rows={3}
              value={note}
              onChange={(e) => setNote(e.target.value)}
              placeholder="e.g. The amount transferred was £300, not £500. See attached."
              className={inputCls + " resize-none"}
            />
          </div>
          <div>
            <label className="block text-xs text-[#a09880] mb-1 uppercase tracking-wide font-medium">
              Counter-evidence (optional)
            </label>
            <EvidenceUploader
              label="dispute-evidence"
              onUploaded={({ url, publicId }) => {
                setEvidenceUrl(url);
                setEvidencePid(publicId);
              }}
            />
          </div>
          {error && (
            <p className="text-red-400 text-sm bg-red-400/10 rounded-lg px-3 py-2">{error}</p>
          )}
        </div>
        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-lg border border-[#3a3530] text-[#a09880] hover:border-[#5a5248] transition-colors text-sm"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={submitting}
            className="flex-1 py-2.5 rounded-lg bg-[#e24b4a]/80 text-white font-semibold text-sm hover:bg-[#e24b4a] transition-colors disabled:opacity-50"
          >
            {submitting ? "Submitting…" : "Submit Dispute"}
          </button>
        </div>
      </div>
    </div>
  );
}
"use client";

// =============================================================================
// isaacpaha.com — QR Code Generator: User Dashboard
// app/tools/qr-code-generator/_components/qr-dashboard.tsx
//
// Signed-in user's QR workspace:
//   - All saved QR codes with preview thumbnails
//   - Scan analytics per QR (total scans, last scanned)
//   - Re-download / copy
//   - Rename / delete
//   - Dynamic QR: edit destination URL
// =============================================================================

import React, { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence }                  from "framer-motion";
import {
  Download, Trash2, Loader2, Check, Copy, RefreshCw, Edit2,
  BarChart2, Globe, Wifi, User, Mail, Phone, CreditCard,
  MessageSquare, X, Save, Eye, Link, AlertCircle,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

interface SavedQR {
  id:          string;
  label:       string;
  type:        string;
  content:     string;
  designJson?: string | null;
  isDynamic:   boolean;
  dynamicId?:  string | null;
  destination?: string | null;
  isPublic:    boolean;
  totalScans:  number;
  createdAt:   string;
  _count:      { scans: number };
}

// ─── Utilities ────────────────────────────────────────────────────────────────

function fmtDate(d: string): string {
  return new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });
}

const TYPE_ICONS: Record<string, React.ElementType> = {
  url: Globe, linkedin: Link, instagram: Link, twitter: Link,
  vcard: User, email: Mail, sms: MessageSquare, phone: Phone,
  wifi: Wifi, payment: CreditCard, text: MessageSquare,
};

const TYPE_COLOURS: Record<string, string> = {
  url: "#6366f1", linkedin: "#0a66c2", instagram: "#e1306c", twitter: "#000000",
  vcard: "#10b981", email: "#f59e0b", sms: "#8b5cf6", phone: "#06b6d4",
  wifi: "#3b82f6", payment: "#10b981", text: "#9ca3af",
};

// Inline SVG renderer (simplified — renders a basic preview from saved design JSON)
function QRPreviewThumb({ svgContent }: { svgContent: string | null }) {
  if (!svgContent) return (
    <div className="w-full h-full bg-stone-100 flex items-center justify-center text-stone-300 text-2xl">⬛</div>
  );
  return (
    <div dangerouslySetInnerHTML={{ __html: svgContent }}
      className="w-full h-full flex items-center justify-center overflow-hidden"
      style={{ maxWidth: "100%", maxHeight: "100%" }}
    />
  );
}

// ─── QR Card ─────────────────────────────────────────────────────────────────

function QRCard({ qr, onDelete, onRename, onDestinationUpdate }: {
  qr:                   SavedQR;
  onDelete:             (id: string) => void;
  onRename:             (id: string, label: string) => void;
  onDestinationUpdate:  (id: string, dest: string) => void;
}) {
  const [editing,    setEditing]    = useState(false);
  const [newLabel,   setNewLabel]   = useState(qr.label);
  const [newDest,    setNewDest]    = useState(qr.destination ?? qr.content);
  const [editingDest, setEditingDest] = useState(false);
  const [deleting,   setDeleting]   = useState(false);
  const [copied,     setCopied]     = useState(false);
  const [saving,     setSaving]     = useState(false);

  const Icon  = TYPE_ICONS[qr.type]  ?? Globe;
  const color = TYPE_COLOURS[qr.type] ?? "#6366f1";
  const scans = qr._count?.scans ?? qr.totalScans ?? 0;

  const handleDelete = async () => {
    setDeleting(true);
    await fetch(`/api/tools/qr/save?id=${qr.id}`, { method: "DELETE" });
    onDelete(qr.id);
  };

  const handleRename = async () => {
    setSaving(true);
    await fetch(`/api/tools/qr/save?id=${qr.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: newLabel }),
    });
    onRename(qr.id, newLabel);
    setEditing(false);
    setSaving(false);
  };

  const handleUpdateDest = async () => {
    setSaving(true);
    await fetch(`/api/tools/qr/save?id=${qr.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ destination: newDest }),
    });
    onDestinationUpdate(qr.id, newDest);
    setEditingDest(false);
    setSaving(false);
  };

  const copyContent = () => {
    navigator.clipboard.writeText(qr.destination ?? qr.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <motion.div layout initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }}
      className="bg-white border border-stone-100 rounded-sm overflow-hidden hover:border-stone-200 hover:shadow-sm transition-all">

      <div className="flex items-start gap-4 p-4">
        {/* QR preview thumbnail */}
        <div className="w-16 h-16 flex-shrink-0 border border-stone-100 rounded-sm overflow-hidden bg-stone-50 flex items-center justify-center">
          <Icon className="w-6 h-6" style={{ color }} />
        </div>

        {/* Info */}
        <div className="flex-1 min-w-0">
          {/* Label row */}
          {editing ? (
            <div className="flex items-center gap-2 mb-1">
              <input value={newLabel} onChange={(e) => setNewLabel(e.target.value)}
                className="flex-1 text-sm border border-indigo-300 rounded-sm px-2 py-1 focus:outline-none"
                onKeyDown={(e) => e.key === "Enter" && handleRename()}
                autoFocus
              />
              <button onClick={handleRename} disabled={saving}
                className="text-emerald-600 hover:text-emerald-800 flex-shrink-0">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Check className="w-4 h-4" />}
              </button>
              <button onClick={() => { setEditing(false); setNewLabel(qr.label); }} className="text-stone-400 hover:text-stone-700 flex-shrink-0">
                <X className="w-4 h-4" />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 mb-1">
              <p className="text-sm font-bold text-stone-900 truncate">{qr.label}</p>
              <button onClick={() => setEditing(true)} className="text-stone-300 hover:text-stone-600 flex-shrink-0">
                <Edit2 className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="flex items-center gap-2 flex-wrap text-[10px] text-stone-400 mb-2">
            <span className="font-bold uppercase" style={{ color }}>{qr.type}</span>
            <span>·</span>
            <span>{fmtDate(qr.createdAt)}</span>
            {qr.isDynamic && <span className="bg-indigo-50 text-indigo-600 font-bold px-1.5 py-0.5 rounded-sm">Dynamic</span>}
            {scans > 0 && (
              <span className="flex items-center gap-1 text-emerald-600 font-bold">
                <BarChart2 className="w-3 h-3" />{scans} scan{scans !== 1 ? "s" : ""}
              </span>
            )}
          </div>

          {/* Content / destination */}
          <p className="text-xs text-stone-400 truncate max-w-[200px]">{qr.destination ?? qr.content}</p>

          {/* Dynamic QR destination editor */}
          {qr.isDynamic && (
            <div className="mt-2">
              {editingDest ? (
                <div className="flex items-center gap-2">
                  <input value={newDest} onChange={(e) => setNewDest(e.target.value)}
                    className="flex-1 text-xs border border-indigo-300 rounded-sm px-2 py-1 focus:outline-none"
                    placeholder="New destination URL…"
                  />
                  <button onClick={handleUpdateDest} disabled={saving}
                    className="text-emerald-600 hover:text-emerald-800">
                    {saving ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                  </button>
                  <button onClick={() => setEditingDest(false)} className="text-stone-400"><X className="w-3.5 h-3.5" /></button>
                </div>
              ) : (
                <button onClick={() => setEditingDest(true)}
                  className="text-[10px] font-bold text-indigo-600 hover:text-indigo-800 flex items-center gap-1 transition-colors">
                  <Edit2 className="w-3 h-3" />Edit destination URL
                </button>
              )}
            </div>
          )}
        </div>

        {/* Actions */}
        <div className="flex flex-col gap-1.5 flex-shrink-0">
          <button onClick={copyContent}
            className="w-8 h-8 flex items-center justify-center text-stone-300 hover:text-indigo-600 border border-stone-200 hover:border-indigo-300 rounded-sm transition-colors">
            {copied ? <Check className="w-3.5 h-3.5 text-emerald-500" /> : <Copy className="w-3.5 h-3.5" />}
          </button>
          <button onClick={handleDelete} disabled={deleting}
            className="w-8 h-8 flex items-center justify-center text-stone-200 hover:text-red-500 border border-stone-200 hover:border-red-300 rounded-sm transition-colors">
            {deleting ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Trash2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
    </motion.div>
  );
}

// ─── MAIN DASHBOARD ───────────────────────────────────────────────────────────

export function QRDashboard() {
  const [qrCodes, setQrCodes] = useState<SavedQR[]>([]);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const res  = await fetch("/api/tools/qr/save");
      const data = await res.json();
      setQrCodes(data.qrCodes ?? []);
    } catch {}
    setLoading(false);
  }, []);

  useEffect(() => { load(); }, [load]);

  const totalScans = qrCodes.reduce((s, q) => s + (q._count?.scans ?? 0), 0);

  const handleDelete         = (id: string)                 => setQrCodes(p => p.filter(q => q.id !== id));
  const handleRename         = (id: string, label: string)  => setQrCodes(p => p.map(q => q.id === id ? { ...q, label } : q));
  const handleDestUpdate     = (id: string, dest: string)   => setQrCodes(p => p.map(q => q.id === id ? { ...q, destination: dest } : q));

  if (loading) return (
    <div className="flex items-center justify-center py-16">
      <Loader2 className="w-6 h-6 animate-spin text-stone-300" />
    </div>
  );

  return (
    <div className="space-y-5">
      {/* Stats header */}
      {qrCodes.length > 0 && (
        <div className="grid grid-cols-3 gap-3">
          {[
            { label: "QR Codes",   value: qrCodes.length,                          color: "#6366f1" },
            { label: "Total Scans",value: totalScans,                               color: "#10b981" },
            { label: "Dynamic",    value: qrCodes.filter(q => q.isDynamic).length, color: "#f59e0b" },
          ].map((s) => (
            <div key={s.label} className="bg-white border border-stone-100 rounded-sm p-4 text-center">
              <p className="text-2xl font-black" style={{ color: s.color }}>{s.value}</p>
              <p className="text-[11px] text-stone-400 font-semibold mt-0.5">{s.label}</p>
            </div>
          ))}
        </div>
      )}

      {/* Controls */}
      {qrCodes.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-xs text-stone-400">{qrCodes.length} saved QR code{qrCodes.length !== 1 ? "s" : ""}</p>
          <button onClick={load} className="flex items-center gap-1.5 text-xs text-stone-400 hover:text-stone-700 transition-colors">
            <RefreshCw className="w-3.5 h-3.5" />Refresh
          </button>
        </div>
      )}

      {/* Empty state */}
      {qrCodes.length === 0 && (
        <div className="flex flex-col items-center justify-center py-16 text-center bg-stone-50 border border-dashed border-stone-200 rounded-sm">
          <div className="w-16 h-16 rounded-sm bg-indigo-50 border-2 border-dashed border-indigo-200 flex items-center justify-center mb-5 text-3xl">
            ⬛
          </div>
          <h3 className="text-base font-black text-stone-900 mb-2">No saved QR codes yet</h3>
          <p className="text-sm text-stone-500 max-w-xs leading-relaxed">
            Create a QR code on the main tab and click <span className="font-bold">Save</span> to keep it here. You can save up to 50 QR codes.
          </p>
        </div>
      )}

      {/* QR code list */}
      {qrCodes.length > 0 && (
        <div className="space-y-2">
          <AnimatePresence>
            {qrCodes.map((qr) => (
              <QRCard key={qr.id} qr={qr}
                onDelete={handleDelete}
                onRename={handleRename}
                onDestinationUpdate={handleDestUpdate}
              />
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  );
}
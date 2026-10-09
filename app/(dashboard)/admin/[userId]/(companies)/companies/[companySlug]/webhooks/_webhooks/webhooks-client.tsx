"use client";
// =============================================================================
// app/admin/[userId]/companies/[companySlug]/webhooks/_components/webhooks-client.tsx
// =============================================================================

import React, { useState } from "react";
import {
  Webhook, Plus, CheckCircle, XCircle, AlertCircle,
  RefreshCw, Trash2, ToggleLeft, ToggleRight, Copy, Check,
  Shield, ChevronDown, ChevronUp,
} from "lucide-react";

interface Delivery { id: string; status: string; responseStatus: number | null; createdAt: Date; attemptCount: number; }
interface Endpoint {
  id: string; url: string; description: string | null; events: string[];
  isActive: boolean; totalDeliveries: number; totalFailures: number;
  lastDeliveryAt: Date | null; signingSecret: string;
  deliveries: Delivery[]; _count: { deliveries: number };
}
interface Company { id: string; slug: string; displayName: string; accentColor: string; }
interface Props { company: Company; endpoints: Endpoint[]; userId: string; }

const ALL_EVENTS = [
  "booking.created", "booking.updated", "booking.cancelled",
  "contact.created", "contact.updated",
  "invoice.created", "invoice.paid", "invoice.overdue",
  "form.submitted",
];

function EventPill({ event }: { event: string }) {
  const [resource, action] = event.split(".");
  const colors: Record<string, string> = {
    booking: "#2563eb", contact: "#7c3aed", invoice: "#059669", form: "#d97706"
  };
  const color = colors[resource] ?? "#6b7280";
  return (
    <span className="text-[9px] font-bold px-1.5 py-0.5 rounded-sm"
      style={{ color, backgroundColor: `${color}15`, border: `1px solid ${color}25` }}>
      {event}
    </span>
  );
}

function DeliveryDot({ status }: { status: string }) {
  const cls = status === "DELIVERED" ? "bg-emerald-400" :
              status === "RETRYING"  ? "bg-amber-400" :
              status === "ABANDONED" ? "bg-red-400" : "bg-stone-300";
  return <span className={`inline-block w-2 h-2 rounded-full flex-shrink-0 ${cls}`} />;
}

function EndpointRow({ endpoint, accent }: { endpoint: Endpoint; accent: string }) {
  const [expanded, setExpanded] = useState(false);
  const [copied,   setCopied]   = useState(false);

  function copySecret() {
    navigator.clipboard.writeText(endpoint.signingSecret);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      {/* Main row */}
      <div className="px-4 py-4 flex items-start gap-3">
        <div className={`w-2 h-2 rounded-full flex-shrink-0 mt-2 ${endpoint.isActive ? "bg-emerald-400" : "bg-stone-300"}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1 flex-wrap">
            <p className="text-sm font-semibold text-stone-800 truncate">{endpoint.url}</p>
            {!endpoint.isActive && (
              <span className="text-[9px] font-black text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">PAUSED</span>
            )}
          </div>
          {endpoint.description && (
            <p className="text-xs text-stone-400 mb-2">{endpoint.description}</p>
          )}
          <div className="flex flex-wrap gap-1">
            {endpoint.events.map((e) => <EventPill key={e} event={e} />)}
          </div>
          <div className="flex items-center gap-3 mt-2 text-[11px] text-stone-400">
            <span>{endpoint._count.deliveries} deliveries</span>
            {endpoint.totalFailures > 0 && (
              <span className="text-red-500">{endpoint.totalFailures} failures</span>
            )}
            {endpoint.lastDeliveryAt && (
              <span>Last: {new Date(endpoint.lastDeliveryAt).toLocaleDateString("en-GB")}</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-1 flex-shrink-0">
          <button onClick={() => setExpanded((v) => !v)}
            className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 hover:bg-stone-100 rounded-sm">
            {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>

      {/* Expanded: secret + recent deliveries */}
      {expanded && (
        <div className="border-t border-stone-100 px-4 py-3 space-y-3 bg-stone-50/40">
          {/* Signing secret (masked) */}
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Signing secret</p>
            <div className="flex items-center gap-2">
              <code className="flex-1 text-[10px] font-mono text-stone-500 bg-white border border-stone-200 rounded-sm px-2.5 py-1.5 truncate">
                {endpoint.signingSecret.slice(0, 12)}{"•".repeat(20)}
              </code>
              <button onClick={copySecret}
                className="flex items-center gap-1 text-[10px] font-bold text-stone-500 border border-stone-200 bg-white px-2 py-1.5 rounded-sm hover:border-stone-400">
                {copied ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
                {copied ? "Copied" : "Copy"}
              </button>
            </div>
          </div>
          {/* Recent deliveries */}
          {endpoint.deliveries.length > 0 && (
            <div>
              <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Recent deliveries</p>
              <div className="space-y-1">
                {endpoint.deliveries.map((d) => (
                  <div key={d.id} className="flex items-center gap-2 text-[11px]">
                    <DeliveryDot status={d.status} />
                    <span className={`font-semibold ${
                      d.status === "DELIVERED" ? "text-emerald-700" :
                      d.status === "RETRYING"  ? "text-amber-700"   :
                      d.status === "ABANDONED" ? "text-red-600"     : "text-stone-500"
                    }`}>{d.status}</span>
                    {d.responseStatus && <span className="text-stone-400">HTTP {d.responseStatus}</span>}
                    <span className="text-stone-400 ml-auto">
                      {new Date(d.createdAt).toLocaleString("en-GB", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export function WebhooksClient({ company, endpoints, userId }: Props) {
  const [showNew,  setShowNew]  = useState(false);
  const [url,      setUrl]      = useState("");
  const [desc,     setDesc]     = useState("");
  const [events,   setEvents]   = useState<string[]>([]);
  const [loading,  setLoading]  = useState(false);
  const [newSecret, setNewSecret] = useState<string | null>(null);
  const [copied,   setCopied]   = useState(false);
  const accent = company.accentColor;

  function toggleEvent(e: string) {
    setEvents((prev) => prev.includes(e) ? prev.filter((x) => x !== e) : [...prev, e]);
  }

  async function handleCreate() {
    if (!url || events.length === 0) return;
    setLoading(true);
    try {
      const res  = await fetch(`/api/v1/companies/${company.slug}/webhooks`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ url, description: desc, events }),
      });
      const data = await res.json();
      if (data.success) {
        setNewSecret(data.data.signingSecret);
        setShowNew(false);
      }
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-stone-900">Webhooks</h2>
          <p className="text-sm text-stone-400 mt-0.5">{endpoints.length} endpoint{endpoints.length !== 1 ? "s" : ""} · {company.displayName}</p>
        </div>
        <button onClick={() => setShowNew((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm shadow-sm"
          style={{ backgroundColor: accent }}>
          <Plus className="w-4 h-4" />{showNew ? "Cancel" : "New endpoint"}
        </button>
      </div>

      {/* New secret display */}
      {newSecret && (
        <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4">
          <p className="text-sm font-black text-emerald-900 mb-1">Webhook registered</p>
          <p className="text-xs text-emerald-700 mb-3">Save this signing secret — it won't be shown again.</p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs font-mono bg-white border border-emerald-200 rounded-sm px-3 py-2 text-stone-700 truncate">{newSecret}</code>
            <button onClick={() => { navigator.clipboard.writeText(newSecret); setCopied(true); setTimeout(() => setCopied(false), 2000); }}
              className="text-xs font-bold text-white bg-emerald-600 px-3 py-2 rounded-sm hover:bg-emerald-700 transition-colors flex items-center gap-1">
              {copied ? <Check className="w-3 h-3" /> : <Copy className="w-3 h-3" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
          <button onClick={() => setNewSecret(null)} className="mt-2 text-xs text-emerald-700 underline underline-offset-2">Dismiss</button>
        </div>
      )}

      {/* Info box */}
      <div className="flex items-start gap-3 bg-blue-50 border border-blue-200 rounded-sm px-4 py-3">
        <Shield className="w-4 h-4 text-blue-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-blue-800 leading-relaxed">
          Verify webhook signatures using HMAC-SHA256 with your signing secret.
          See <code className="bg-blue-100 px-1 rounded">API_REFERENCE.md → Webhooks</code> for the verification code snippet.
        </p>
      </div>

      {/* Create form */}
      {showNew && (
        <div className="bg-white border border-stone-100 rounded-sm p-4 space-y-4">
          <p className="text-sm font-black text-stone-900">New webhook endpoint</p>
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">URL (HTTPS required) *</label>
            <input value={url} onChange={(e) => setUrl(e.target.value)}
              placeholder="https://www.ipaha.co.uk/api/webhooks/isaacpaha"
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 font-mono" />
          </div>
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">Description</label>
            <input value={desc} onChange={(e) => setDesc(e.target.value)}
              placeholder="Production booking notifications"
              className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400" />
          </div>
          <div>
            <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">Events *</label>
            <div className="flex flex-wrap gap-2">
              {ALL_EVENTS.map((e) => (
                <button key={e} onClick={() => toggleEvent(e)}
                  className={`text-[10px] font-bold px-2 py-1 rounded-sm border transition-all ${
                    events.includes(e) ? "text-white border-transparent" : "text-stone-500 border-stone-200 hover:border-stone-400"
                  }`}
                  style={events.includes(e) ? { backgroundColor: accent } : {}}>
                  {e}
                </button>
              ))}
            </div>
          </div>
          <button onClick={handleCreate} disabled={!url || events.length === 0 || loading}
            className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-sm disabled:opacity-40"
            style={{ backgroundColor: accent }}>
            {loading ? <RefreshCw className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
            {loading ? "Creating..." : "Register endpoint"}
          </button>
        </div>
      )}

      {/* Endpoints list */}
      {endpoints.length === 0 && !showNew ? (
        <div className="bg-white border border-stone-100 rounded-sm py-16 text-center">
          <Webhook className="w-10 h-10 text-stone-200 mx-auto mb-3" />
          <p className="text-sm text-stone-400">No webhook endpoints yet.</p>
          <button onClick={() => setShowNew(true)} className="mt-2 text-xs font-semibold underline underline-offset-2" style={{ color: accent }}>
            Register your first endpoint
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {endpoints.map((ep) => <EndpointRow key={ep.id} endpoint={ep} accent={accent} />)}
        </div>
      )}
    </div>
  );
}


"use client";
// =============================================================================
// app/admin/[userId]/companies/[companySlug]/api-keys/api-keys-client.tsx
// Full API key management interface
// Shows masked keys, scopes, usage, rotation, revocation
// =============================================================================

import React, { useState } from "react";
import {
  Key, Plus, Copy, Check, RefreshCw, Trash2,
  AlertCircle, Eye, EyeOff, Shield, Clock, Activity,
} from "lucide-react";
import {
  createCompanyApiKey,
  rotateCompanyApiKey,
  revokeCompanyApiKey,
} from "@/lib/actions/company-actions";
import { SCOPES } from "@/lib/api/types";

const ALL_SCOPES = Object.values(SCOPES);

interface ApiKey {
  id: string; name: string; maskedKey: string; scopes: string[];
  isActive: boolean; lastUsedAt: Date | null; totalRequests: bigint;
  expiresAt: Date | null; revokedAt: Date | null;
}

interface Props {
  companyId:   string;
  companySlug: string;
  initialKeys: ApiKey[];
  accent:      string;
}

// ── Newly created key display (shown once) ────────────────────────────────────
function NewKeyDisplay({ rawKey, onDismiss }: { rawKey: string; onDismiss: () => void }) {
  const [copied, setCopied] = useState(false);
  const [revealed, setRevealed] = useState(false);

  function copy() {
    navigator.clipboard.writeText(rawKey);
    setCopied(true);
    setTimeout(() => setCopied(false), 3000);
  }

  return (
    <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-4 mb-4">
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-sm bg-emerald-100 flex items-center justify-center flex-shrink-0">
          <Key className="w-4 h-4 text-emerald-600" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-black text-emerald-900 mb-1">API key created</p>
          <p className="text-xs text-emerald-700 mb-3">
            Copy this key now — it will not be shown again.
          </p>
          <div className="flex items-center gap-2">
            <code className="flex-1 text-xs bg-white border border-emerald-200 rounded-sm px-3 py-2 font-mono text-stone-700 truncate">
              {revealed ? rawKey : "•".repeat(Math.min(rawKey.length, 48))}
            </code>
            <button
              onClick={() => setRevealed((v) => !v)}
              className="w-8 h-8 flex items-center justify-center text-stone-500 hover:text-stone-800 border border-stone-200 rounded-sm bg-white"
            >
              {revealed ? <EyeOff className="w-3.5 h-3.5" /> : <Eye className="w-3.5 h-3.5" />}
            </button>
            <button
              onClick={copy}
              className="flex items-center gap-1.5 text-xs font-bold text-white bg-emerald-600 hover:bg-emerald-700 px-3 py-2 rounded-sm transition-colors"
            >
              {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
              {copied ? "Copied!" : "Copy"}
            </button>
          </div>
        </div>
      </div>
      <button
        onClick={onDismiss}
        className="mt-3 text-xs text-emerald-700 hover:text-emerald-900 underline underline-offset-2"
      >
        I've saved the key — dismiss
      </button>
    </div>
  );
}

// ── Create key form ────────────────────────────────────────────────────────────
function CreateKeyForm({
  companyId, companySlug, accent, onCreated,
}: {
  companyId: string; companySlug: string; accent: string;
  onCreated: (rawKey: string, name: string) => void;
}) {
  const [name,           setName]           = useState("");
  const [scopes,         setScopes]         = useState<string[]>(["bookings:read","bookings:write","contacts:read","forms:write"]);
  const [expiresInDays,  setExpiresInDays]  = useState<string>("");
  const [allowedDomains, setAllowedDomains] = useState("");
  const [loading,        setLoading]        = useState(false);
  const [error,          setError]          = useState("");

  function toggleScope(scope: string) {
    setScopes((prev) =>
      prev.includes(scope) ? prev.filter((s) => s !== scope) : [...prev, scope]
    );
  }

  async function handleCreate() {
    if (!name.trim()) { setError("Name is required"); return; }
    if (scopes.length === 0) { setError("Select at least one scope"); return; }

    setLoading(true);
    setError("");

    try {
      const expiresAt = expiresInDays
        ? new Date(Date.now() + parseInt(expiresInDays) * 86400000)
        : undefined;

      const domains = allowedDomains
        .split(",")
        .map((d) => d.trim())
        .filter(Boolean);

      const result = await createCompanyApiKey({
        companyId,
        companySlug,
        name: name.trim(),
        scopes: scopes as never[],
        expiresAt,
        allowedDomains: domains.length > 0 ? domains : undefined,
      });

      onCreated(result.rawKey, name);
      setName(""); setScopes([]); setExpiresInDays(""); setAllowedDomains("");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create key");
    } finally {
      setLoading(false);
    }
  }

  // Group scopes by resource
  const scopeGroups: Record<string, string[]> = {};
  for (const scope of ALL_SCOPES) {
    const [resource] = scope.split(":");
    if (!scopeGroups[resource]) scopeGroups[resource] = [];
    scopeGroups[resource].push(scope);
  }

  return (
    <div className="bg-white border border-stone-100 rounded-sm p-5">
      <p className="text-sm font-black text-stone-900 mb-4">New API key</p>

      {error && (
        <div className="flex items-center gap-2 bg-red-50 border border-red-200 rounded-sm px-3 py-2 mb-4">
          <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
          <p className="text-xs text-red-700">{error}</p>
        </div>
      )}

      <div className="space-y-4">
        {/* Name */}
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
            Key name *
          </label>
          <input
            value={name} onChange={(e) => setName(e.target.value)}
            placeholder="e.g. Production — ipaha.co.uk"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
          />
        </div>

        {/* Scopes */}
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-2">
            Permissions *
          </label>
          <div className="grid grid-cols-2 gap-x-4 gap-y-1">
            {Object.entries(scopeGroups).map(([resource, resourceScopes]) => (
              <div key={resource} className="mb-2">
                <p className="text-[10px] font-black text-stone-300 uppercase tracking-wider mb-1">
                  {resource}
                </p>
                {resourceScopes.map((scope) => (
                  <label key={scope} className="flex items-center gap-2 cursor-pointer py-0.5">
                    <input
                      type="checkbox"
                      checked={scopes.includes(scope)}
                      onChange={() => toggleScope(scope)}
                      className="w-3.5 h-3.5 rounded-sm accent-amber-500"
                    />
                    <span className="text-xs text-stone-600 font-mono">{scope}</span>
                  </label>
                ))}
              </div>
            ))}
          </div>
        </div>

        {/* Allowed domains */}
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
            Allowed origins (comma-separated, optional)
          </label>
          <input
            value={allowedDomains}
            onChange={(e) => setAllowedDomains(e.target.value)}
            placeholder="https://www.ipaha.co.uk, https://staging.ipaha.co.uk"
            className="w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 font-mono"
          />
          <p className="text-[11px] text-stone-400 mt-1">
            Leave blank to allow all origins. In production, always restrict to your domain.
          </p>
        </div>

        {/* Expiry */}
        <div>
          <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">
            Expires in (days, optional)
          </label>
          <select
            value={expiresInDays}
            onChange={(e) => setExpiresInDays(e.target.value)}
            className="text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white text-stone-600"
          >
            <option value="">Never expires</option>
            <option value="30">30 days</option>
            <option value="90">90 days</option>
            <option value="180">180 days</option>
            <option value="365">1 year</option>
          </select>
        </div>

        <button
          onClick={handleCreate}
          disabled={loading || !name.trim() || scopes.length === 0}
          className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white py-2.5 rounded-sm transition-colors disabled:opacity-40"
          style={{ backgroundColor: accent }}
        >
          {loading ? (
            <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <Plus className="w-4 h-4" />
          )}
          {loading ? "Creating..." : "Create API key"}
        </button>
      </div>
    </div>
  );
}

// ── Key row ───────────────────────────────────────────────────────────────────
function KeyRow({
  apiKey, companySlug, accent,
  onRotated, onRevoked,
}: {
  apiKey: ApiKey; companySlug: string; accent: string;
  onRotated: (newRawKey: string, name: string) => void;
  onRevoked: (id: string) => void;
}) {
  const [loading, setLoading] = useState<"rotate" | "revoke" | null>(null);
  const [confirm, setConfirm] = useState<"rotate" | "revoke" | null>(null);

  async function handleRotate() {
    setLoading("rotate");
    try {
      const result = await rotateCompanyApiKey(apiKey.id, companySlug);
      onRotated(result.rawKey, apiKey.name);
      setConfirm(null);
    } finally { setLoading(null); }
  }

  async function handleRevoke() {
    setLoading("revoke");
    try {
      await revokeCompanyApiKey(apiKey.id, companySlug, "Manually revoked from dashboard");
      onRevoked(apiKey.id);
      setConfirm(null);
    } finally { setLoading(null); }
  }

  return (
    <div className={`border-b border-stone-50 last:border-0 px-4 py-4 ${!apiKey.isActive ? "opacity-50" : ""}`}>
      <div className="flex items-start justify-between gap-3">
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <p className="text-sm font-semibold text-stone-800">{apiKey.name}</p>
            {apiKey.isActive ? (
              <span className="text-[9px] font-black text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
                ACTIVE
              </span>
            ) : (
              <span className="text-[9px] font-black text-stone-400 bg-stone-100 px-1.5 py-0.5 rounded-sm">
                REVOKED
              </span>
            )}
            {apiKey.expiresAt && (
              <span className="flex items-center gap-1 text-[9px] font-semibold text-amber-700 bg-amber-50 px-1.5 py-0.5 rounded-sm border border-amber-200">
                <Clock className="w-2.5 h-2.5" />
                Expires {new Date(apiKey.expiresAt).toLocaleDateString("en-GB")}
              </span>
            )}
          </div>
          <p className="text-xs font-mono text-stone-400 mt-1">{apiKey.maskedKey}</p>
          <div className="flex flex-wrap gap-1 mt-2">
            {apiKey.scopes.map((s) => (
              <span key={s} className="text-[9px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-sm">
                {s}
              </span>
            ))}
          </div>
          <div className="flex items-center gap-3 mt-2">
            <span className="flex items-center gap-1 text-[11px] text-stone-400">
              <Activity className="w-3 h-3" />
              {Number(apiKey.totalRequests).toLocaleString()} requests
            </span>
            {apiKey.lastUsedAt && (
              <span className="text-[11px] text-stone-400">
                Last used {new Date(apiKey.lastUsedAt).toLocaleDateString("en-GB")}
              </span>
            )}
          </div>
        </div>

        {apiKey.isActive && (
          <div className="flex items-center gap-1 flex-shrink-0">
            {confirm === "rotate" ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-stone-600">Rotate key?</span>
                <button onClick={handleRotate} disabled={loading === "rotate"}
                  className="text-xs font-bold text-amber-700 border border-amber-200 bg-amber-50 px-2 py-1 rounded-sm hover:bg-amber-100 transition-colors">
                  {loading === "rotate" ? "..." : "Confirm"}
                </button>
                <button onClick={() => setConfirm(null)} className="text-xs text-stone-400 hover:text-stone-700">Cancel</button>
              </div>
            ) : confirm === "revoke" ? (
              <div className="flex items-center gap-1.5">
                <span className="text-xs text-red-600 font-semibold">Revoke permanently?</span>
                <button onClick={handleRevoke} disabled={loading === "revoke"}
                  className="text-xs font-bold text-white bg-red-500 hover:bg-red-600 px-2 py-1 rounded-sm transition-colors">
                  {loading === "revoke" ? "..." : "Revoke"}
                </button>
                <button onClick={() => setConfirm(null)} className="text-xs text-stone-400 hover:text-stone-700">Cancel</button>
              </div>
            ) : (
              <>
                <button onClick={() => setConfirm("rotate")}
                  className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-amber-600 hover:bg-amber-50 rounded-sm border border-transparent hover:border-amber-200 transition-all"
                  title="Rotate key">
                  <RefreshCw className="w-3.5 h-3.5" />
                </button>
                <button onClick={() => setConfirm("revoke")}
                  className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-red-500 hover:bg-red-50 rounded-sm border border-transparent hover:border-red-200 transition-all"
                  title="Revoke key">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// ── MAIN EXPORT ───────────────────────────────────────────────────────────────
export function ApiKeysClient({ companyId, companySlug, initialKeys, accent }: Props) {
  const [keys,     setKeys]     = useState<ApiKey[]>(initialKeys);
  const [newKey,   setNewKey]   = useState<{ raw: string; name: string } | null>(null);
  const [showForm, setShowForm] = useState(false);

  function handleKeyCreated(rawKey: string, name: string) {
    setNewKey({ raw: rawKey, name });
    setShowForm(false);
  }

  function handleRotated(rawKey: string, name: string) {
    setNewKey({ raw: rawKey, name: `${name} (rotated)` });
  }

  function handleRevoked(id: string) {
    setKeys((prev) => prev.map((k) =>
      k.id === id ? { ...k, isActive: false, revokedAt: new Date() } : k
    ));
  }

  return (
    <div className="p-6 space-y-4 max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-stone-900">API Keys</h2>
          <p className="text-sm text-stone-400 mt-0.5">
            {keys.filter((k) => k.isActive).length} active key
            {keys.filter((k) => k.isActive).length !== 1 ? "s" : ""}
          </p>
        </div>
        <button
          onClick={() => setShowForm((v) => !v)}
          className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm transition-colors shadow-sm"
          style={{ backgroundColor: accent }}
        >
          <Plus className="w-4 h-4" />
          {showForm ? "Cancel" : "New key"}
        </button>
      </div>

      {/* Security notice */}
      <div className="flex items-start gap-3 bg-amber-50 border border-amber-200 rounded-sm px-4 py-3">
        <Shield className="w-4 h-4 text-amber-600 flex-shrink-0 mt-0.5" />
        <p className="text-xs text-amber-800 leading-relaxed">
          API keys are shown <strong>once</strong> at creation. Store them immediately in your
          environment variables. Never commit them to source code or expose them client-side.
        </p>
      </div>

      {/* New key display */}
      {newKey && (
        <NewKeyDisplay
          rawKey={newKey.raw}
          onDismiss={() => setNewKey(null)}
        />
      )}

      {/* Create form */}
      {showForm && (
        <CreateKeyForm
          companyId={companyId}
          companySlug={companySlug}
          accent={accent}
          onCreated={handleKeyCreated}
        />
      )}

      {/* Keys list */}
      <div className="bg-white border border-stone-100 rounded-sm">
        {keys.length === 0 ? (
          <div className="py-12 text-center">
            <Key className="w-8 h-8 text-stone-200 mx-auto mb-2" />
            <p className="text-sm text-stone-400">No API keys yet.</p>
          </div>
        ) : (
          keys.map((key) => (
            <KeyRow
              key={key.id}
              apiKey={key}
              companySlug={companySlug}
              accent={accent}
              onRotated={handleRotated}
              onRevoked={handleRevoked}
            />
          ))
        )}
      </div>
    </div>
  );
}

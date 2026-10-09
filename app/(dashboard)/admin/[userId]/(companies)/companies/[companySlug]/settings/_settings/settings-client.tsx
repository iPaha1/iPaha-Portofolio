"use client";
// =============================================================================
// app/admin/[userId]/companies/[companySlug]/settings/_components/settings-client.tsx
// =============================================================================

import React, { useState } from "react";
import { Settings, Save, Globe, Palette, Mail, Building2, CheckCircle, AlertCircle } from "lucide-react";

interface Company {
  id: string; slug: string; legalName: string; displayName: string;
  primaryDomain: string | null; contactEmail: string | null;
  accentColor: string; planTier: string; isActive: boolean;
  allowedDomains: string | null; registrationNo: string | null;
  city: string | null; postcode: string | null; country: string;
}

export function SettingsClient({ company, userId }: { company: Company; userId: string }) {
  const [displayName,  setDisplayName]  = useState(company.displayName ?? "");
  const [contactEmail, setContactEmail] = useState(company.contactEmail ?? "");
  const [primaryDomain,setPrimaryDomain]= useState(company.primaryDomain ?? "");
  const [allowedDomains,setAllowedDomains] = useState(
    company.allowedDomains ? (JSON.parse(company.allowedDomains) as string[]).join(", ") : ""
  );
  const [accentColor,  setAccentColor]  = useState(company.accentColor);
  const [saving,       setSaving]       = useState(false);
  const [saved,        setSaved]        = useState(false);
  const [error,        setError]        = useState("");

  async function handleSave() {
    setSaving(true); setError("");
    try {
      const res = await fetch(`/api/admin/companies/${company.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          displayName,
          contactEmail,
          primaryDomain,
          allowedDomains: allowedDomains.split(",").map((d) => d.trim()).filter(Boolean),
          accentColor,
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError("Failed to save changes. Please try again.");
    } finally {
      setSaving(false);
    }
  }

  const accent = accentColor;

  const Section = ({ title, icon: Icon, children }: { title: string; icon: React.ElementType; children: React.ReactNode }) => (
    <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-stone-100 bg-stone-50/40">
        <Icon className="w-4 h-4 text-stone-400" />
        <p className="text-sm font-black text-stone-700">{title}</p>
      </div>
      <div className="p-4 space-y-4">{children}</div>
    </div>
  );

  const Field = ({ label, note, children }: { label: string; note?: string; children: React.ReactNode }) => (
    <div>
      <label className="text-[10px] font-black text-stone-400 uppercase tracking-wider block mb-1.5">{label}</label>
      {children}
      {note && <p className="text-[11px] text-stone-400 mt-1">{note}</p>}
    </div>
  );

  const inputCls = "w-full text-sm border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 bg-white";

  return (
    <div className="p-6 space-y-5 max-w-2xl">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-black text-stone-900">Settings</h2>
          <p className="text-sm text-stone-400 mt-0.5">{company.legalName}</p>
        </div>
        <div className="flex items-center gap-2">
          {saved && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700">
              <CheckCircle className="w-3.5 h-3.5" />Saved
            </span>
          )}
          {error && (
            <span className="flex items-center gap-1.5 text-xs font-semibold text-red-600">
              <AlertCircle className="w-3.5 h-3.5" />{error}
            </span>
          )}
          <button onClick={handleSave} disabled={saving}
            className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm disabled:opacity-60"
            style={{ backgroundColor: accent }}>
            <Save className="w-4 h-4" />
            {saving ? "Saving..." : "Save changes"}
          </button>
        </div>
      </div>

      {/* Company info (read-only) */}
      <Section title="Company identity" icon={Building2}>
        <div className="grid grid-cols-2 gap-3">
          {[
            { label: "Legal name",     val: company.legalName },
            { label: "Slug",           val: company.slug },
            { label: "Reg. number",    val: company.registrationNo ?? "—" },
            { label: "Plan",           val: company.planTier },
          ].map(({ label, val }) => (
            <div key={label} className="bg-stone-50 rounded-sm p-2.5">
              <p className="text-[9px] font-black text-stone-400 uppercase tracking-wider">{label}</p>
              <p className="text-sm font-semibold text-stone-700 mt-0.5">{val}</p>
            </div>
          ))}
        </div>
        <p className="text-[11px] text-stone-400">
          Legal name and slug are set at company creation. Contact support to change them.
        </p>
      </Section>

      {/* Display settings */}
      <Section title="Display" icon={Palette}>
        <Field label="Display name" note="Shown in the admin sidebar and dashboard header.">
          <input value={displayName} onChange={(e) => setDisplayName(e.target.value)}
            placeholder="iPaha" className={inputCls} />
        </Field>
        <Field label="Accent colour" note="Used in the company dashboard UI.">
          <div className="flex items-center gap-3">
            <input type="color" value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
              className="w-10 h-10 rounded-sm border border-stone-200 cursor-pointer p-0.5" />
            <input value={accentColor} onChange={(e) => setAccentColor(e.target.value)}
              placeholder="#f59e0b" className={`${inputCls} font-mono w-36`} />
            <div className="w-8 h-8 rounded-sm border border-stone-200" style={{ backgroundColor: accentColor }} />
          </div>
        </Field>
      </Section>

      {/* Domains */}
      <Section title="Domains & CORS" icon={Globe}>
        <Field label="Primary domain" note="The main public-facing website URL for this company.">
          <input value={primaryDomain} onChange={(e) => setPrimaryDomain(e.target.value)}
            placeholder="https://www.ipaha.co.uk" className={`${inputCls} font-mono`} />
        </Field>
        <Field
          label="Allowed CORS origins"
          note="Comma-separated list of origins allowed to make API requests. New API keys default to these. Leave blank to allow all (not recommended for production).">
          <textarea value={allowedDomains} onChange={(e) => setAllowedDomains(e.target.value)}
            rows={2} placeholder="https://www.ipaha.co.uk, https://staging.ipaha.co.uk"
            className={`${inputCls} resize-none font-mono`} />
        </Field>
      </Section>

      {/* Contact */}
      <Section title="Contact" icon={Mail}>
        <Field label="Contact email" note="Used for system notifications.">
          <input type="email" value={contactEmail} onChange={(e) => setContactEmail(e.target.value)}
            placeholder="hello@ipaha.co.uk" className={inputCls} />
        </Field>
      </Section>

      {/* Danger zone */}
      <div className="bg-white border border-red-100 rounded-sm overflow-hidden">
        <div className="flex items-center gap-2 px-4 py-3 border-b border-red-100 bg-red-50/40">
          <AlertCircle className="w-4 h-4 text-red-400" />
          <p className="text-sm font-black text-red-700">Danger zone</p>
        </div>
        <div className="p-4">
          <p className="text-xs text-stone-500 mb-3">
            These actions are irreversible. Deactivating a company will revoke all its API keys and immediately
            break any live integrations.
          </p>
          <button className="text-xs font-bold text-red-600 border border-red-200 hover:bg-red-50 px-3 py-2 rounded-sm transition-colors">
            Deactivate company
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";
// =============================================================================
// app/admin/[userId]/companies/[companySlug]/contacts/_components/contacts-client.tsx
// =============================================================================

import React, { useState, useTransition } from "react";
import { useRouter, usePathname, useSearchParams } from "next/navigation";
import {
  Users, Search, Mail, Phone, Building2,
  Tag, Plus, RefreshCw, XCircle, ExternalLink,
} from "lucide-react";

interface Contact {
  id: string; firstName: string; lastName: string | null;
  email: string; phone: string | null; company: string | null;
  jobTitle: string | null; notes: string | null;
  tags: string[]; source: string | null; isActive: boolean;
  createdAt: Date; updatedAt: Date;
}
interface Company { id: string; slug: string; displayName: string; accentColor: string; }
interface Props {
  company: Company; contacts: Contact[]; total: number;
  page: number; pageSize: number; userId: string;
  initialSearch: string;
}

function ContactDrawer({ contact, onClose, accent }: { contact: Contact; onClose: () => void; accent: string }) {
  return (
    <div className="w-80 flex-shrink-0 bg-white border-l border-stone-100 flex flex-col overflow-hidden">
      <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
        <p className="text-sm font-black text-stone-900">Contact</p>
        <button onClick={onClose} className="w-7 h-7 flex items-center justify-center text-stone-400 hover:text-stone-700 rounded-sm">
          <XCircle className="w-4 h-4" />
        </button>
      </div>
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {/* Avatar + name */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-full bg-stone-100 flex items-center justify-center text-sm font-black text-stone-600 flex-shrink-0"
            style={{ backgroundColor: `${accent}18`, color: accent }}>
            {contact.firstName[0]}{contact.lastName?.[0] ?? ""}
          </div>
          <div>
            <p className="text-base font-black text-stone-900">
              {contact.firstName} {contact.lastName ?? ""}
            </p>
            {contact.jobTitle && <p className="text-xs text-stone-400">{contact.jobTitle}</p>}
            {contact.company  && <p className="text-xs text-stone-400">{contact.company}</p>}
          </div>
        </div>
        {/* Contact info */}
        <div className="space-y-2">
          {[
            { icon: Mail,      val: contact.email,   href: `mailto:${contact.email}` },
            { icon: Phone,     val: contact.phone,   href: contact.phone ? `tel:${contact.phone}` : undefined },
            { icon: Building2, val: contact.company, href: undefined },
          ].filter((r) => r.val).map(({ icon: Icon, val, href }, i) => (
            <div key={i} className="flex items-center gap-2">
              <Icon className="w-3.5 h-3.5 text-stone-300 flex-shrink-0" />
              {href ? (
                <a href={href} className="text-sm text-stone-700 hover:underline">{val}</a>
              ) : (
                <span className="text-sm text-stone-700">{val}</span>
              )}
            </div>
          ))}
        </div>
        {/* Tags */}
        {contact.tags.length > 0 && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Tags</p>
            <div className="flex flex-wrap gap-1">
              {contact.tags.map((t) => (
                <span key={t} className="text-[10px] font-bold text-stone-600 bg-stone-100 px-2 py-0.5 rounded-sm">
                  {t}
                </span>
              ))}
            </div>
          </div>
        )}
        {/* Notes */}
        {contact.notes && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Notes</p>
            <div className="bg-stone-50 rounded-sm p-3 border border-stone-100">
              <p className="text-xs text-stone-700 leading-relaxed">{contact.notes}</p>
            </div>
          </div>
        )}
        {/* Meta */}
        <div className="text-xs text-stone-400 space-y-1">
          {contact.source && <p>Source: {contact.source}</p>}
          <p>Added: {new Date(contact.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" })}</p>
        </div>
      </div>
    </div>
  );
}

export function ContactsClient({ company, contacts, total, page, pageSize, userId, initialSearch }: Props) {
  const router       = useRouter();
  const pathname     = usePathname();
  const searchParams = useSearchParams();
  const [isPending, startTransition] = useTransition();
  const [search,   setSearch]   = useState(initialSearch);
  const [selected, setSelected] = useState<Contact | null>(null);
  const accent = company.accentColor;
  const totalPages = Math.ceil(total / pageSize);

  function navigate(params: Record<string, string>) {
    const sp = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(params)) {
      v ? sp.set(k, v) : sp.delete(k);
    }
    sp.delete("page");
    startTransition(() => router.push(`${pathname}?${sp.toString()}`));
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="bg-white border-b border-stone-100 px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div>
          <h1 className="text-xl font-black text-stone-900">Contacts</h1>
          <p className="text-sm text-stone-400 mt-0.5">{total.toLocaleString()} contacts · {company.displayName}</p>
        </div>
        <button className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm shadow-sm"
          style={{ backgroundColor: accent }}>
          <Plus className="w-4 h-4" />Add contact
        </button>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Main */}
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
          </div>

          {/* Table */}
          <div className="flex-1 overflow-y-auto">
            {/* Table header */}
            <div className="hidden md:grid grid-cols-[2fr_2fr_1fr_1fr_100px] gap-4 px-4 py-2.5 bg-stone-50 border-b border-stone-100 sticky top-0">
              {["Name", "Email", "Company", "Tags", "Added"].map((h) => (
                <p key={h} className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{h}</p>
              ))}
            </div>

            {contacts.length === 0 ? (
              <div className="flex flex-col items-center py-20">
                <Users className="w-10 h-10 text-stone-200 mb-3" />
                <p className="text-sm text-stone-400">{search ? `No contacts matching "${search}"` : "No contacts yet"}</p>
              </div>
            ) : (
              contacts.map((c) => (
                <button key={c.id} onClick={() => setSelected(c === selected ? null : c)}
                  className={`w-full text-left grid grid-cols-1 md:grid-cols-[2fr_2fr_1fr_1fr_100px] gap-4 px-4 py-3 border-b border-stone-50 hover:bg-stone-50 transition-colors items-center border-l-2 ${
                    selected?.id === c.id ? "bg-amber-50/50" : "border-transparent"
                  }`}
                  style={selected?.id === c.id ? { borderLeftColor: accent } : {}}>
                  {/* Name */}
                  <div className="flex items-center gap-2">
                    <div className="w-7 h-7 rounded-full flex items-center justify-center text-[10px] font-black flex-shrink-0"
                      style={{ backgroundColor: `${accent}18`, color: accent }}>
                      {c.firstName[0]}{c.lastName?.[0] ?? ""}
                    </div>
                    <div>
                      <p className="text-sm font-semibold text-stone-800">{c.firstName} {c.lastName ?? ""}</p>
                      {c.jobTitle && <p className="text-xs text-stone-400">{c.jobTitle}</p>}
                    </div>
                  </div>
                  {/* Email */}
                  <p className="text-xs text-stone-500 truncate flex items-center gap-1">
                    <Mail className="w-3 h-3 text-stone-300 flex-shrink-0" />{c.email}
                  </p>
                  {/* Company */}
                  <p className="text-xs text-stone-400 truncate">{c.company ?? "—"}</p>
                  {/* Tags */}
                  <div className="flex gap-1 flex-wrap">
                    {c.tags.slice(0, 2).map((t) => (
                      <span key={t} className="text-[9px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-sm">{t}</span>
                    ))}
                    {c.tags.length > 2 && <span className="text-[9px] text-stone-300">+{c.tags.length - 2}</span>}
                  </div>
                  {/* Date */}
                  <p className="text-xs text-stone-400">
                    {new Date(c.createdAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                  </p>
                </button>
              ))
            )}
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex items-center justify-center gap-2 px-4 py-3 border-t border-stone-100 bg-white flex-shrink-0">
              <button disabled={page <= 1} onClick={() => navigate({ page: String(page - 1) })}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400 disabled:opacity-40">← Prev</button>
              <span className="text-xs text-stone-400">Page {page} of {totalPages}</span>
              <button disabled={page >= totalPages} onClick={() => navigate({ page: String(page + 1) })}
                className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-1.5 rounded-sm hover:border-amber-400 disabled:opacity-40">Next →</button>
            </div>
          )}
        </div>

        {/* Drawer */}
        {selected && <ContactDrawer contact={selected} onClose={() => setSelected(null)} accent={accent} />}
      </div>
    </div>
  );
}

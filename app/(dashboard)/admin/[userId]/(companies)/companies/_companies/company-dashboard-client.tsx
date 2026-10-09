"use client";
// =============================================================================
// app/admin/_companies/company-dashboard-client.tsx
// UPDATED: Now accepts children prop so it works as a layout wrapper.
// The sidebar stays persistent across all sub-pages.
// =============================================================================

import React, { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard, Calendar, Users, FileText, Globe,
  Key, Terminal, Settings, Package, ShoppingCart,
  Boxes, Truck, BarChart3, AlertCircle, CheckCircle,
  ArrowUpRight, Activity, RefreshCw,
} from "lucide-react";

// Lucide doesn't export Webhook by name in older versions — use a fallback
let Webhook: React.ElementType;
try {
  // eslint-disable-next-line @typescript-eslint/no-var-requires
  Webhook = require("lucide-react").Webhook ?? Globe;
} catch {
  Webhook = Globe;
}

const ICONS: Record<string, React.ElementType> = {
  LayoutDashboard, Calendar, Users, FileText, Globe,
  Key, Webhook, Terminal, Settings, Package, ShoppingCart,
  Boxes, Truck, BarChart3,
};

function NavIcon({ name }: { name: string }) {
  const Icon = ICONS[name] ?? Globe;
  return <Icon className="w-4 h-4 flex-shrink-0" />;
}

interface NavItem   { id: string; label: string; iconName: string; href: string; badge?: string; badgeColor?: string; }
interface NavGroup  { id: string; label: string; items: NavItem[]; }
interface DashboardConfig { nav: NavGroup[]; modules: string[]; settings: Record<string, unknown>; }
interface Company {
  id: string; displayName: string; legalName: string; slug: string;
  logoUrl: string | null; accentColor: string; primaryDomain: string | null;
  isActive: boolean; planTier: string;
}
interface ApiKey {
  id: string; name: string; keyPrefix: string; lastFourChars: string;
  maskedKey: string; scopes: string[]; isActive: boolean;
  lastUsedAt: Date | null; totalRequests: bigint;
}
interface Stats {
  bookings: { total: number; new: number; pending: number };
  contacts: { total: number };
  invoices: { total: number; paid: number };
  api:      { requests: number; errors: number; errorRate: number };
}

interface Props {
  company:         Company;
  stats:           Stats;
  apiKeys:         ApiKey[];
  dashboardConfig: DashboardConfig;
  userId:          string;
  children?:       React.ReactNode;  // ← Added for layout usage
}

export function CompanyDashboardClient({
  company, stats, apiKeys, dashboardConfig, userId, children,
}: Props) {
  const pathname = usePathname();
  const accent   = company.accentColor;
  const baseRoute = `/admin/${userId}/companies/${company.slug}`;

  const navGroups = dashboardConfig.nav.map((group) => ({
    ...group,
    items: group.items.map((item) => ({
      ...item,
      fullHref: `${baseRoute}/${item.href.replace(/^\//, "")}`,
    })),
  }));

  // If children are provided, render layout mode (sidebar + children)
  // Otherwise render overview mode (sidebar + stats grid)
  const isLayoutMode = Boolean(children);

  return (
    <div className="flex h-full">
      {/* ── SIDEBAR ───────────────────────────────────────────────────── */}
      <aside className="w-56 flex-shrink-0 bg-white border-r border-stone-100 flex flex-col h-full overflow-hidden">
        {/* Company header */}
        <div className="px-4 py-4 border-b border-stone-100 flex items-center gap-3 flex-shrink-0">
          {company.logoUrl ? (
            <img src={company.logoUrl} alt={company.displayName}
              className="w-8 h-8 rounded-sm object-contain flex-shrink-0" />
          ) : (
            <div className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-black flex-shrink-0"
              style={{ backgroundColor: accent, color: "#fff" }}>
              {company.displayName.slice(0, 2).toUpperCase()}
            </div>
          )}
          <div className="min-w-0">
            <p className="text-sm font-black text-stone-900 truncate">{company.displayName}</p>
            <p className="text-[10px] text-stone-400 truncate">{company.planTier}</p>
          </div>
        </div>

        {/* Nav */}
        <nav className="flex-1 overflow-y-auto py-2">
          {/* Overview link */}
          <Link href={baseRoute}
            className={`flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-sm text-sm transition-colors mb-1 border-l-2 ${
              pathname === baseRoute
                ? "font-semibold border-l-2"
                : "text-stone-500 hover:text-stone-800 hover:bg-stone-50 font-medium border-transparent"
            }`}
            style={pathname === baseRoute ? { color: accent, backgroundColor: `${accent}12`, borderLeftColor: accent } : {}}>
            <LayoutDashboard className="w-4 h-4 flex-shrink-0" />
            <span>Overview</span>
          </Link>

          {navGroups.map((group) => (
            <div key={group.id} className="mb-1">
              <p className="text-[9px] font-black tracking-widest uppercase text-stone-300 px-4 py-2 mt-1">
                {group.label}
              </p>
              {group.items.map((item) => {
                const active = pathname === item.fullHref ||
                  (item.fullHref !== baseRoute && pathname.startsWith(item.fullHref));
                return (
                  <Link key={item.id} href={item.fullHref}
                    className={`flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-sm text-sm transition-colors border-l-2 ${
                      active
                        ? "font-semibold"
                        : "text-stone-500 hover:text-stone-800 hover:bg-stone-50 font-medium border-transparent"
                    }`}
                    style={active ? { color: accent, backgroundColor: `${accent}12`, borderLeftColor: accent } : {}}>
                    <NavIcon name={item.iconName} />
                    <span className="truncate">{item.label}</span>
                    {item.badge && !active && (
                      <span className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-sm"
                        style={{ color: item.badgeColor ?? "#10b981", backgroundColor: `${item.badgeColor ?? "#10b981"}18` }}>
                        {item.badge}
                      </span>
                    )}
                  </Link>
                );
              })}
            </div>
          ))}
        </nav>

        {/* Visit site */}
        {company.primaryDomain && (
          <div className="border-t border-stone-100 p-3 flex-shrink-0">
            <a href={company.primaryDomain} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-700 px-2 py-1.5 rounded-sm hover:bg-stone-50 transition-colors">
              <ArrowUpRight className="w-3.5 h-3.5" />
              {company.primaryDomain.replace(/https?:\/\//, "")}
            </a>
          </div>
        )}
      </aside>

      {/* ── MAIN CONTENT ────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto bg-stone-50/40 flex flex-col min-h-0">
        {isLayoutMode ? (
          // Layout mode: render children (the actual page content)
          <>{children}</>
        ) : (
          // Overview mode: render stats dashboard
          <>
            <div className="bg-white border-b border-stone-100 px-6 py-4 flex-shrink-0">
              <div className="flex items-center justify-between">
                <div>
                  <h1 className="text-xl font-black text-stone-900">{company.legalName}</h1>
                  <p className="text-sm text-stone-400 mt-0.5 flex items-center gap-1.5">
                    {company.isActive
                      ? <><CheckCircle className="w-3.5 h-3.5 text-emerald-500" />Active · {company.planTier} plan</>
                      : <><AlertCircle className="w-3.5 h-3.5 text-red-400" />Inactive</>
                    }
                  </p>
                </div>
                <Link href={`${baseRoute}/api-keys`}
                  className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm shadow-sm"
                  style={{ backgroundColor: accent }}>
                  <Key className="w-4 h-4" />Manage API keys
                </Link>
              </div>
            </div>

            <div className="p-6 space-y-6">
              {/* Stats */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
                {[
                  { label: "Pending bookings", value: stats.bookings.pending, sub: `${stats.bookings.new} new this month`, icon: Calendar, color: accent },
                  { label: "Contacts",          value: stats.contacts.total,  icon: Users,    color: "#8b5cf6" },
                  { label: "Invoices paid",      value: stats.invoices.paid,   sub: `of ${stats.invoices.total} total`, icon: FileText, color: "#10b981" },
                  { label: "API requests (30d)", value: stats.api.requests.toLocaleString(), sub: `${stats.api.errorRate}% error rate`, icon: Activity, color: stats.api.errorRate > 5 ? "#ef4444" : "#3b82f6" },
                ].map(({ label, value, sub, icon: Icon, color }) => (
                  <div key={label} className="bg-white border border-stone-100 rounded-sm p-4">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">{label}</p>
                        <p className="text-2xl font-black text-stone-900">{value}</p>
                        {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
                      </div>
                      <div className="w-9 h-9 rounded-sm flex items-center justify-center" style={{ backgroundColor: `${color}18` }}>
                        <Icon className="w-4 h-4" style={{ color }} />
                      </div>
                    </div>
                  </div>
                ))}
              </div>

              {/* API keys preview */}
              <div className="bg-white border border-stone-100 rounded-sm">
                <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
                  <p className="text-sm font-black text-stone-900">API Keys</p>
                  <Link href={`${baseRoute}/api-keys`}
                    className="text-xs font-semibold text-stone-500 hover:text-stone-800 flex items-center gap-1">
                    Manage <ArrowUpRight className="w-3 h-3" />
                  </Link>
                </div>
                {apiKeys.length === 0 ? (
                  <div className="px-4 py-8 text-center">
                    <Key className="w-8 h-8 text-stone-200 mx-auto mb-2" />
                    <p className="text-sm text-stone-400">No API keys yet.</p>
                    <Link href={`${baseRoute}/api-keys`}
                      className="mt-2 inline-block text-xs font-semibold underline underline-offset-2" style={{ color: accent }}>
                      Generate your first key
                    </Link>
                  </div>
                ) : apiKeys.slice(0, 4).map((k) => (
                  <div key={k.id} className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0">
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-stone-800">{k.name}</p>
                      <p className="text-xs font-mono text-stone-400">{k.maskedKey}</p>
                    </div>
                    <span className={`text-[9px] font-black px-1.5 py-0.5 rounded-sm ${k.isActive ? "text-emerald-700 bg-emerald-50" : "text-stone-400 bg-stone-100"}`}>
                      {k.isActive ? "ACTIVE" : "REVOKED"}
                    </span>
                  </div>
                ))}
              </div>

              {/* Quick links */}
              <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
                {[
                  { label: "Bookings",     href: `${baseRoute}/bookings`,  icon: Calendar },
                  { label: "Contacts",     href: `${baseRoute}/contacts`,  icon: Users },
                  { label: "Invoices",     href: `${baseRoute}/invoices`,  icon: FileText },
                  { label: "Request logs", href: `${baseRoute}/logs`,      icon: Terminal },
                  { label: "Webhooks",     href: `${baseRoute}/webhooks`,  icon: RefreshCw },
                  { label: "Settings",     href: `${baseRoute}/settings`,  icon: Settings },
                ].map((link) => (
                  <Link key={link.href} href={link.href}
                    className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all">
                    <link.icon className="w-4 h-4 text-stone-400" />{link.label}
                  </Link>
                ))}
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}





// "use client";
// // =============================================================================
// // app/admin/[userId]/companies/[companySlug]/_components/company-dashboard-client.tsx
// // Dynamic per-company admin dashboard
// // Renders nav, stats, and content based on DB-stored config
// // =============================================================================

// import React, { useState } from "react";
// import Link from "next/link";
// import { usePathname } from "next/navigation";
// import {
//   LayoutDashboard, Calendar, Users, FileText, Globe,
//   Key, Webhook, Terminal, Settings, Package, ShoppingCart,
//   Boxes, Truck, BarChart3, AlertCircle, CheckCircle,
//   ArrowUpRight, Activity, RefreshCw,
// } from "lucide-react";

// // ── Icon registry — add more as you add nav items ────────────────────────────
// const ICONS: Record<string, React.ElementType> = {
//   LayoutDashboard, Calendar, Users, FileText, Globe,
//   Key, Terminal, Settings, Package, ShoppingCart,
//   Boxes, Truck, BarChart3, Webhook: Webhook ?? Globe,
// };

// function NavIcon({ name }: { name: string }) {
//   const Icon = ICONS[name] ?? Globe;
//   return <Icon className="w-4 h-4 flex-shrink-0" />;
// }

// // ── Types ─────────────────────────────────────────────────────────────────────
// interface NavItem {
//   id: string; label: string; iconName: string; href: string;
//   badge?: string; badgeColor?: string;
// }
// interface NavGroup { id: string; label: string; items: NavItem[]; }
// interface DashboardConfig { nav: NavGroup[]; modules: string[]; settings: Record<string, unknown>; }
// interface Company {
//   id: string; displayName: string; legalName: string; slug: string;
//   logoUrl: string | null; accentColor: string; primaryDomain: string | null;
//   isActive: boolean; planTier: string;
// }
// interface ApiKey {
//   id: string; name: string; keyPrefix: string; lastFourChars: string;
//   maskedKey: string; scopes: string[]; isActive: boolean;
//   lastUsedAt: Date | null; totalRequests: bigint;
// }
// interface Stats {
//   bookings: { total: number; new: number; pending: number };
//   contacts: { total: number };
//   invoices: { total: number; paid: number };
//   api:      { requests: number; errors: number; errorRate: number };
// }

// interface Props {
//   company:         Company;
//   stats:           Stats;
//   apiKeys:         ApiKey[];
//   dashboardConfig: DashboardConfig;
//   userId:          string;
// }

// // ── Stat card ─────────────────────────────────────────────────────────────────
// function StatCard({
//   label, value, sub, icon: Icon, color,
// }: {
//   label: string; value: string | number; sub?: string;
//   icon: React.ElementType; color: string;
// }) {
//   return (
//     <div className="bg-white border border-stone-100 rounded-sm p-4">
//       <div className="flex items-start justify-between">
//         <div>
//           <p className="text-xs font-semibold text-stone-400 uppercase tracking-wider mb-1">
//             {label}
//           </p>
//           <p className="text-2xl font-black text-stone-900">{value}</p>
//           {sub && <p className="text-xs text-stone-400 mt-1">{sub}</p>}
//         </div>
//         <div
//           className="w-9 h-9 rounded-sm flex items-center justify-center flex-shrink-0"
//           style={{ backgroundColor: `${color}18` }}
//         >
//           <Icon className="w-4.5 h-4.5" style={{ color }} />
//         </div>
//       </div>
//     </div>
//   );
// }

// // ── API Key row ───────────────────────────────────────────────────────────────
// function ApiKeyRow({ apiKey }: { apiKey: ApiKey }) {
//   const [copied, setCopied] = useState(false);

//   return (
//     <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-50 last:border-0">
//       <div className="flex-1 min-w-0">
//         <div className="flex items-center gap-2">
//           <p className="text-sm font-semibold text-stone-800">{apiKey.name}</p>
//           {apiKey.isActive ? (
//             <span className="text-[10px] font-bold text-emerald-700 bg-emerald-50 border border-emerald-200 px-1.5 py-0.5 rounded-sm">
//               Active
//             </span>
//           ) : (
//             <span className="text-[10px] font-bold text-stone-400 bg-stone-100 border border-stone-200 px-1.5 py-0.5 rounded-sm">
//               Inactive
//             </span>
//           )}
//         </div>
//         <p className="text-xs font-mono text-stone-400 mt-0.5">{apiKey.maskedKey}</p>
//       </div>
//       <div className="hidden md:block text-xs text-stone-400 text-right">
//         <p className="font-semibold">{Number(apiKey.totalRequests).toLocaleString()} req</p>
//         <p>{apiKey.lastUsedAt
//           ? new Date(apiKey.lastUsedAt).toLocaleDateString("en-GB", { day: "numeric", month: "short" })
//           : "Never used"
//         }</p>
//       </div>
//       <div className="flex items-center gap-1">
//         {apiKey.scopes.slice(0, 2).map((s) => (
//           <span key={s} className="text-[9px] font-bold text-stone-500 bg-stone-100 px-1.5 py-0.5 rounded-sm">
//             {s}
//           </span>
//         ))}
//         {apiKey.scopes.length > 2 && (
//           <span className="text-[9px] font-bold text-stone-400">
//             +{apiKey.scopes.length - 2}
//           </span>
//         )}
//       </div>
//     </div>
//   );
// }

// // ── MAIN COMPONENT ────────────────────────────────────────────────────────────
// export function CompanyDashboardClient({
//   company, stats, apiKeys, dashboardConfig, userId,
// }: Props) {
//   const pathname  = usePathname();
//   const [section, setSection] = useState("overview");
//   const accent    = company.accentColor;

//   const baseRoute = `/admin/${userId}/companies/${company.slug}`;

//   // Build nav items from DB config, resolving hrefs
//   const navGroups = dashboardConfig.nav.map((group) => ({
//     ...group,
//     items: group.items.map((item) => ({
//       ...item,
//       fullHref: `${baseRoute}/${item.href.replace(/^\//, "")}`,
//     })),
//   }));

//   return (
//     <div className="flex h-full">
//       {/* ── SIDEBAR ─────────────────────────────────────────────────────── */}
//       <aside className="w-56 flex-shrink-0 bg-white border-r border-stone-100 flex flex-col h-full overflow-hidden">
//         {/* Company header */}
//         <div className="px-4 py-4 border-b border-stone-100 flex items-center gap-3">
//           {company.logoUrl ? (
//             <img src={company.logoUrl} alt={company.displayName}
//               className="w-8 h-8 rounded-sm object-contain flex-shrink-0" />
//           ) : (
//             <div
//               className="w-8 h-8 rounded-sm flex items-center justify-center text-xs font-black flex-shrink-0"
//               style={{ backgroundColor: accent, color: "#fff" }}
//             >
//               {company.displayName.slice(0, 2).toUpperCase()}
//             </div>
//           )}
//           <div className="min-w-0">
//             <p className="text-sm font-black text-stone-900 truncate">{company.displayName}</p>
//             <p className="text-[10px] text-stone-400 truncate">{company.planTier}</p>
//           </div>
//         </div>

//         {/* Nav groups */}
//         <nav className="flex-1 overflow-y-auto py-2">
//           {navGroups.map((group) => (
//             <div key={group.id} className="mb-1">
//               <p className="text-[9px] font-black tracking-widest uppercase text-stone-300 px-4 py-2 mt-1">
//                 {group.label}
//               </p>
//               {group.items.map((item) => {
//                 const active = pathname === item.fullHref ||
//                   (item.fullHref !== baseRoute && pathname.startsWith(item.fullHref));
//                 return (
//                   <Link
//                     key={item.id}
//                     href={item.fullHref}
//                     className={`flex items-center gap-2.5 mx-2 px-2.5 py-2 rounded-sm text-sm transition-colors ${
//                       active
//                         ? "font-semibold"
//                         : "text-stone-500 hover:text-stone-800 hover:bg-stone-50 font-medium"
//                     }`}
//                     style={active ? { color: accent, backgroundColor: `${accent}12` } : {}}
//                   >
//                     {active && (
//                       <div
//                         className="absolute left-0 w-[3px] h-5 rounded-r-full"
//                         style={{ backgroundColor: accent }}
//                       />
//                     )}
//                     <NavIcon name={item.iconName} />
//                     <span className="truncate">{item.label}</span>
//                     {item.badge && (
//                       <span
//                         className="ml-auto text-[9px] font-black px-1.5 py-0.5 rounded-sm"
//                         style={{
//                           color:           item.badgeColor ?? "#10b981",
//                           backgroundColor: `${item.badgeColor ?? "#10b981"}18`,
//                         }}
//                       >
//                         {item.badge}
//                       </span>
//                     )}
//                   </Link>
//                 );
//               })}
//             </div>
//           ))}
//         </nav>

//         {/* Company site link */}
//         {company.primaryDomain && (
//           <div className="border-t border-stone-100 p-3">
//             <a
//               href={company.primaryDomain}
//               target="_blank"
//               rel="noopener noreferrer"
//               className="flex items-center gap-2 text-xs text-stone-400 hover:text-stone-700 transition-colors px-2 py-1.5 rounded-sm hover:bg-stone-50"
//             >
//               <ArrowUpRight className="w-3.5 h-3.5" />
//               Visit {company.primaryDomain.replace(/https?:\/\//, "")}
//             </a>
//           </div>
//         )}
//       </aside>

//       {/* ── MAIN CONTENT ─────────────────────────────────────────────────── */}
//       <div className="flex-1 overflow-y-auto bg-stone-50/40">
//         {/* Page header */}
//         <div className="bg-white border-b border-stone-100 px-6 py-4">
//           <div className="flex items-center justify-between gap-4">
//             <div>
//               <h1 className="text-xl font-black text-stone-900">{company.legalName}</h1>
//               <p className="text-sm text-stone-400 mt-0.5">
//                 {company.isActive ? (
//                   <span className="flex items-center gap-1.5">
//                     <CheckCircle className="w-3.5 h-3.5 text-emerald-500" />
//                     Active · {company.planTier} plan
//                   </span>
//                 ) : (
//                   <span className="flex items-center gap-1.5 text-red-500">
//                     <AlertCircle className="w-3.5 h-3.5" />
//                     Inactive
//                   </span>
//                 )}
//               </p>
//             </div>
//             <div className="flex items-center gap-2">
//               <Link
//                 href={`${baseRoute}/api-keys/new`}
//                 className="flex items-center gap-2 text-sm font-bold text-white px-4 py-2.5 rounded-sm transition-colors shadow-sm"
//                 style={{ backgroundColor: accent }}
//               >
//                 <Key className="w-4 h-4" />
//                 New API Key
//               </Link>
//             </div>
//           </div>
//         </div>

//         <div className="p-6 space-y-6">
//           {/* ── STATS GRID ──────────────────────────────────────────────── */}
//           <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
//             <StatCard
//               label="Pending bookings" value={stats.bookings.pending}
//               sub={`${stats.bookings.new} new this month`}
//               icon={Calendar} color={accent}
//             />
//             <StatCard
//               label="Contacts" value={stats.contacts.total}
//               icon={Users} color="#8b5cf6"
//             />
//             <StatCard
//               label="Invoices paid" value={stats.invoices.paid}
//               sub={`of ${stats.invoices.total} total`}
//               icon={FileText} color="#10b981"
//             />
//             <StatCard
//               label="API requests (30d)" value={stats.api.requests.toLocaleString()}
//               sub={`${stats.api.errorRate}% error rate`}
//               icon={Activity}
//               color={stats.api.errorRate > 5 ? "#ef4444" : "#3b82f6"}
//             />
//           </div>

//           {/* ── API KEYS ─────────────────────────────────────────────────── */}
//           <div className="bg-white border border-stone-100 rounded-sm">
//             <div className="flex items-center justify-between px-4 py-3 border-b border-stone-100">
//               <div>
//                 <p className="text-sm font-black text-stone-900">API Keys</p>
//                 <p className="text-xs text-stone-400 mt-0.5">
//                   {apiKeys.filter((k) => k.isActive).length} active key
//                   {apiKeys.filter((k) => k.isActive).length !== 1 ? "s" : ""}
//                 </p>
//               </div>
//               <Link
//                 href={`${baseRoute}/api-keys`}
//                 className="text-xs font-semibold text-stone-500 hover:text-stone-800 transition-colors flex items-center gap-1"
//               >
//                 Manage <ArrowUpRight className="w-3 h-3" />
//               </Link>
//             </div>

//             {apiKeys.length === 0 ? (
//               <div className="px-4 py-8 text-center">
//                 <Key className="w-8 h-8 text-stone-200 mx-auto mb-2" />
//                 <p className="text-sm text-stone-400">No API keys yet.</p>
//                 <Link
//                   href={`${baseRoute}/api-keys/new`}
//                   className="mt-2 inline-block text-xs font-semibold underline underline-offset-2"
//                   style={{ color: accent }}
//                 >
//                   Generate your first key
//                 </Link>
//               </div>
//             ) : (
//               apiKeys.slice(0, 5).map((key) => (
//                 <ApiKeyRow key={key.id} apiKey={key} />
//               ))
//             )}
//           </div>

//           {/* ── QUICK LINKS ──────────────────────────────────────────────── */}
//           <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
//             {[
//               { label: "View bookings",  href: `${baseRoute}/bookings`,  icon: Calendar },
//               { label: "View contacts",  href: `${baseRoute}/contacts`,  icon: Users },
//               { label: "View invoices",  href: `${baseRoute}/invoices`,  icon: FileText },
//               { label: "Request logs",   href: `${baseRoute}/logs`,      icon: Terminal },
//               { label: "Webhooks",       href: `${baseRoute}/webhooks`,  icon: RefreshCw },
//               { label: "Settings",       href: `${baseRoute}/settings`,  icon: Settings },
//             ].map((link) => (
//               <Link
//                 key={link.href}
//                 href={link.href}
//                 className="flex items-center gap-3 bg-white border border-stone-100 rounded-sm px-4 py-3 text-sm font-semibold text-stone-600 hover:text-stone-900 hover:border-stone-300 transition-all"
//               >
//                 <link.icon className="w-4 h-4 text-stone-400" />
//                 {link.label}
//               </Link>
//             ))}
//           </div>
//         </div>
//       </div>
//     </div>
//   );
// }

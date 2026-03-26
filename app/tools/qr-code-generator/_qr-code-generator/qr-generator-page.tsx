

"use client";

// =============================================================================
// isaacpaha.com — QR Code Generator — Page Shell
// app/tools/qr-code-generator/_components/qr-generator-page.tsx
// =============================================================================

import React, { useState }    from "react";
import Link                    from "next/link";
import { motion }              from "framer-motion";
import {
  ArrowLeft, Star, Users, Clock, Share2, Check, ChevronRight,
  MessageSquare, BookOpen, Zap, Info, ArrowRight, Download,
  Sparkles, TrendingUp, Lock, Globe, Wifi, User, Shield,
} from "lucide-react";
import { QRCodeTool }             from "./qr-tool";
import { QRDashboard }            from "./qr-dashboard";
import { TOOL_CATEGORIES, TOOLS } from "@/lib/data/tools-data";
import { ToolCard } from "../../_tools/tools-card";

// ─── Tool data ────────────────────────────────────────────────────────────────

const TOOL = TOOLS.find((t) => t.slug === "qr-code-generator")!;

const HOW_IT_WORKS = [
  {
    step: "01",
    title: "Choose your QR type",
    desc:  "Pick from 10 types: website URL, LinkedIn profile, Instagram, vCard contact, email, SMS, phone, WiFi, payment link, or plain text.",
  },
  {
    step: "02",
    title: "Enter your content",
    desc:  "Fill in the details for your QR type. For a vCard, enter your name, company, phone, and email. For WiFi, enter your network name and password.",
  },
  {
    step: "03",
    title: "Customise the design",
    desc:  "Switch to the Design tab to change colours, dot shapes, corner styles, add a CTA frame, and embed your logo. Use AI Design for instant suggestions.",
  },
  {
    step: "04",
    title: "Preview live, then download",
    desc:  "The QR updates in real time as you edit. Download as PNG for digital use, or SVG for print (business cards, posters, banners — no quality loss).",
  },
  {
    step: "05",
    title: "Save & manage (signed-in users)",
    desc:  "Sign in to save all your QR codes to your personal workspace. Name them, edit dynamic QR destinations, and track total scans.",
  },
];

const REVIEWS = [
  {
    name: "Daniel R.", role: "Freelance Designer",  avatar: "DR", rating: 5, date: "1 week ago",
    body:  "Finally a QR tool that doesn't look like it was built in 2009. The gradient + dots combination looks genuinely professional. SVG export is flawless for print.",
  },
  {
    name: "Aisha K.", role: "Marketing Manager",    avatar: "AK", rating: 5, date: "2 weeks ago",
    body:  "Used this to create branded QR codes for our event posters. The AI design feature matched our brand colours perfectly first try. Saved us at least 30 minutes.",
  },
  {
    name: "Tom W.",   role: "Software Engineer",    avatar: "TW", rating: 5, date: "3 weeks ago",
    body:  "The vCard QR is brilliant. I added it to my email signature and now people can save my contact details instantly without typing anything. Simple but so useful.",
  },
  {
    name: "Priya S.", role: "Restaurant Owner",     avatar: "PS", rating: 4, date: "1 month ago",
    body:  "Created a WiFi QR code for customers — they love it. The 'Scan to connect' frame text makes it self-explanatory. Would love even more frame design options.",
  },
];

function ReadingProgress() {
  const [width, setWidth] = React.useState(0);
  React.useEffect(() => {
    const h = () => {
      const el = document.documentElement;
      setWidth(Math.min(100, Math.max(0, el.scrollTop / (el.scrollHeight - el.clientHeight) * 100)));
    };
    window.addEventListener("scroll", h, { passive: true });
    return () => window.removeEventListener("scroll", h);
  }, []);
  return <div className="fixed top-0 left-0 right-0 z-50 h-0.5"><div className="h-full bg-indigo-500 transition-[width] duration-100" style={{ width: `${width}%` }} /></div>;
}

function StarRow({ rating }: { rating: number }) {
  return <div className="flex gap-0.5">{[1,2,3,4,5].map(s => <Star key={s} className={`w-3.5 h-3.5 ${s<=rating?"text-amber-400 fill-amber-400":"text-gray-200"}`} />)}</div>;
}

interface QRGeneratorPageProps {
  isSignedIn: boolean;
}

export function QRGeneratorPage({ isSignedIn }: QRGeneratorPageProps) {
  const [activeTab, setActiveTab] = useState<"tool" | "workspace" | "guide" | "reviews">("tool");
  const [copied,    setCopied]    = useState(false);

  const category = TOOL_CATEGORIES.find(c => c.name === TOOL?.category);
  const related  = TOOLS.filter(t => t.category === TOOL?.category && t.slug !== TOOL?.slug && t.status !== "COMING_SOON").slice(0, 3);

  if (!TOOL) return null;

  const TABS = [
    { id: "tool",      label: "Create QR Code", icon: Zap           },
    ...(isSignedIn ? [{ id: "workspace", label: "My QR Codes", icon: TrendingUp }] : []),
    { id: "guide",     label: "How It Works",   icon: BookOpen      },
    { id: "reviews",   label: "Reviews",        icon: MessageSquare },
  ] as const;

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div className="min-h-screen bg-white text-gray-900">
      <ReadingProgress />

      <div className="fixed inset-0 pointer-events-none opacity-[0.025]"
        style={{ backgroundImage: "linear-gradient(to right, #000 1px, transparent 1px), linear-gradient(to bottom, #000 1px, transparent 1px)", backgroundSize: "48px 48px" }}
      />
      <div className="fixed top-24 right-1/4 w-[600px] h-[600px] rounded-full blur-3xl opacity-[0.04] pointer-events-none bg-indigo-400" />

      <div className="relative z-10 max-w-6xl mx-auto px-4 pt-24 pb-20">

        {/* Breadcrumbs */}
        <nav className="flex items-center gap-1.5 text-xs text-gray-400 mb-8">
          {[{ label: "Home", href: "/" }, { label: "Tools", href: "/tools" }, { label: TOOL.name, href: "#" }].map((bc, i) => (
            <React.Fragment key={bc.label}>
              {i > 0 && <ChevronRight className="w-3 h-3 text-gray-300" />}
              {bc.href === "#" ? <span className="text-gray-600 font-medium">{bc.label}</span>
                : <Link href={bc.href} className="hover:text-gray-700 transition-colors">{bc.label}</Link>}
            </React.Fragment>
          ))}
        </nav>

        {/* Hero */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start mb-10">
          <div className="lg:col-span-2">
            <div className="flex items-center gap-3 mb-5">
              <div className="w-16 h-16 rounded-xs border-2 flex items-center justify-center text-4xl shrink-0"
                style={{ backgroundColor: "#6366f110", borderColor: "#6366f130" }}>⬛</div>
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-1">
                  <span className="text-xs font-semibold" style={{ color: category?.color }}>{category?.icon} {TOOL.category}</span>
                  <span className="flex items-center gap-1.5 text-xs font-semibold px-2.5 py-1 rounded-xs border bg-indigo-50 border-indigo-200 text-indigo-700">
                    <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 animate-pulse" />Live
                  </span>
                  <span className="text-[9px] font-black tracking-widest uppercase bg-indigo-500 text-white px-2 py-0.5 rounded-xs">NEW</span>
                </div>
                <h1 className="text-3xl md:text-4xl font-black text-gray-900 leading-tight">{TOOL.name}</h1>
              </div>
            </div>

            <p className="text-lg text-gray-600 mb-5 leading-relaxed">{TOOL.description}</p>

            <div className="flex flex-wrap items-center gap-5 text-sm text-gray-500 mb-5">
              <span className="flex items-center gap-1.5"><Users className="w-4 h-4 text-indigo-400" />Free forever</span>
              <span className="flex items-center gap-1.5"><Clock className="w-4 h-4 text-gray-300" />{TOOL.buildTime}</span>
              <span className="flex items-center gap-1.5 text-green-600 font-semibold"><span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />No account needed</span>
            </div>

            <div className="flex flex-wrap gap-2 mb-6">
              {TOOL.features.map((f) => (
                <span key={f} className="inline-flex items-center gap-1.5 text-xs text-gray-600 bg-gray-50 border border-gray-100 px-3 py-1.5 rounded-xs">
                  <Check className="w-3 h-3 text-indigo-400" />{f}
                </span>
              ))}
            </div>

            <div className="flex items-center gap-3 flex-wrap">
              <button onClick={() => setActiveTab("tool")}
                className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-5 py-3 rounded-xs transition-colors shadow-sm">
                <Zap className="w-4 h-4" />Create QR Code
              </button>
              {isSignedIn && (
                <button onClick={() => setActiveTab("workspace")}
                  className="flex items-center gap-2 text-sm font-semibold text-indigo-700 border border-indigo-300 hover:bg-indigo-50 px-5 py-3 rounded-xs transition-colors">
                  <TrendingUp className="w-4 h-4" />My QR Codes
                </button>
              )}
              <button onClick={handleShare}
                className="flex items-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 px-4 py-3 rounded-xs transition-colors">
                {copied ? <Check className="w-4 h-4 text-green-500" /> : <Share2 className="w-4 h-4" />}
                {copied ? "Copied!" : "Share"}
              </button>
            </div>
          </div>

          {/* Right sidebar card */}
          <div className="hidden lg:block">
            {isSignedIn ? (
              <div className="bg-indigo-50 border border-indigo-200 rounded-xs p-5">
                <p className="text-xs font-black text-indigo-600 uppercase tracking-wider mb-4">Your workspace</p>
                <p className="text-sm text-indigo-800 mb-4 leading-relaxed">
                  Sign in once and all your QR codes are saved. Come back and re-download, edit destinations, or track scans.
                </p>
                <button onClick={() => setActiveTab("workspace")}
                  className="w-full text-sm font-bold text-indigo-700 border border-indigo-300 hover:bg-indigo-100 py-2.5 rounded-xs transition-colors">
                  Open My QR Codes →
                </button>
              </div>
            ) : (
              <div className="bg-gray-50 border border-gray-100 rounded-xs p-5">
                <Lock className="w-6 h-6 text-gray-400 mb-3" />
                <p className="text-sm font-bold text-gray-800 mb-1">Save your QR codes</p>
                <p className="text-xs text-gray-500 leading-relaxed mb-4">
                  Sign in to save up to 50 QR codes, edit dynamic destinations, and track scan analytics.
                </p>
                <a href="/sign-in?redirect_url=/tools/qr-code-generator"
                  className="w-full flex items-center justify-center gap-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 py-2.5 rounded-xs transition-colors">
                  Sign in — it's free
                </a>
              </div>
            )}
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-0.5 border-b border-gray-100 mb-8 overflow-x-auto">
          {TABS.map((t) => (
            <button key={t.id} onClick={() => setActiveTab(t.id as any)}
              className={`flex items-center gap-2 px-5 py-3 text-sm font-semibold border-b-2 transition-all whitespace-nowrap ${
                activeTab === t.id ? "border-indigo-500 text-indigo-600" : "border-transparent text-gray-400 hover:text-gray-700"
              }`}>
              <t.icon className="w-4 h-4" />{t.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
          <div className="lg:col-span-2">

            {/* TOOL */}
            {activeTab === "tool" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                <div className="bg-white border border-gray-100 rounded-xs overflow-hidden shadow-sm">
                  <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100" style={{ backgroundColor: "#6366f106" }}>
                    <div className="flex items-center gap-3">
                      <span className="text-xl">⬛</span>
                      <div>
                        <p className="text-sm font-bold text-gray-900">{TOOL.name}</p>
                        <p className="text-xs text-gray-400">{TOOL.tagline}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-green-600 bg-green-50 border border-green-100 px-3 py-1.5 rounded-xs">
                      <span className="w-1.5 h-1.5 rounded-full bg-green-500 animate-pulse" />Live
                    </div>
                  </div>
                  <div className="p-6 md:p-8">
                    <QRCodeTool isSignedIn={isSignedIn} />
                  </div>
                </div>
                <div className="flex items-start gap-3 mt-5 bg-amber-50 border border-amber-100 rounded-xs px-4 py-3.5">
                  <Info className="w-4 h-4 text-amber-500 mt-0.5 shrink-0" />
                  <p className="text-xs text-amber-800 leading-relaxed">
                    QR codes are generated client-side using your data. Your content is not permanently stored unless you click Save. Always test QR codes by scanning before printing.
                  </p>
                </div>
              </motion.div>
            )}

            {/* WORKSPACE */}
            {activeTab === "workspace" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {isSignedIn
                  ? <QRDashboard />
                  : (
                    <div className="flex flex-col items-center justify-center py-20 text-center bg-gray-50 border border-gray-100 rounded-xs">
                      <Lock className="w-10 h-10 text-gray-300 mb-4" />
                      <h3 className="text-lg font-black text-gray-900 mb-2">Sign in to save your QR codes</h3>
                      <p className="text-sm text-gray-500 max-w-xs mb-5 leading-relaxed">
                        Save up to 50 QR codes, edit dynamic destinations, and see scan analytics.
                      </p>
                      <a href="/sign-in?redirect_url=/tools/qr-code-generator"
                        className="flex items-center gap-2 text-sm font-bold text-white bg-indigo-500 hover:bg-indigo-600 px-5 py-3 rounded-xs transition-colors">
                        Sign in — it's free
                      </a>
                    </div>
                  )
                }
              </motion.div>
            )}

            {/* GUIDE */}
            {activeTab === "guide" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-0">
                <h2 className="text-2xl font-black text-gray-900 mb-8">How to create a beautiful QR code</h2>
                {HOW_IT_WORKS.map((step, i) => (
                  <div key={step.step} className="flex gap-6 pb-10 relative">
                    {i < HOW_IT_WORKS.length - 1 && <div className="absolute left-5 top-10 bottom-0 w-px bg-gray-100" />}
                    <div className="w-10 h-10 rounded-xs font-black text-sm flex items-center justify-center flex-shrink-0 relative z-10"
                      style={{ backgroundColor: "#6366f110", color: "#6366f1" }}>
                      {step.step}
                    </div>
                    <div>
                      <h3 className="text-base font-bold text-gray-900 mb-1">{step.title}</h3>
                      <p className="text-sm text-gray-600 leading-relaxed">{step.desc}</p>
                    </div>
                  </div>
                ))}
                <div className="bg-indigo-50 border border-indigo-100 rounded-xs p-6">
                  <h3 className="text-base font-bold text-indigo-900 mb-3">💡 QR Code best practices</h3>
                  <ul className="space-y-2">
                    {[
                      "Always scan and test your QR code on multiple devices before printing at scale.",
                      "Use SVG format for print — it scales to any size without quality loss.",
                      "Minimum print size: 2cm × 2cm for reliable scanning. Larger is better.",
                      "High contrast (dark on light) scans faster than custom colours. Test it.",
                      "Add a CTA frame so people know what the QR code does — never make them guess.",
                      "Dynamic QR codes are worth it for anything that might change (URLs, menus, links).",
                    ].map((tip) => (
                      <li key={tip} className="flex items-start gap-2 text-sm text-indigo-800">
                        <Check className="w-4 h-4 text-indigo-400 mt-0.5 flex-shrink-0" />{tip}
                      </li>
                    ))}
                  </ul>
                </div>
              </motion.div>
            )}

            {/* REVIEWS */}
            {activeTab === "reviews" && (
              <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
                <div className="flex items-center justify-between">
                  <h2 className="text-2xl font-black text-gray-900">Reviews</h2>
                </div>
                {REVIEWS.map((r) => (
                  <div key={r.name} className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="w-9 h-9 rounded-full bg-indigo-100 flex items-center justify-center text-xs font-bold text-indigo-700">{r.avatar}</div>
                        <div>
                          <p className="text-sm font-bold text-gray-900">{r.name}</p>
                          <p className="text-xs text-gray-400">{r.role}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <StarRow rating={r.rating} />
                        <p className="text-xs text-gray-400 mt-1">{r.date}</p>
                      </div>
                    </div>
                    <p className="text-sm text-gray-700 leading-relaxed">{r.body}</p>
                  </div>
                ))}
              </motion.div>
            )}
          </div>

          {/* Sidebar */}
          <aside className="lg:col-span-1">
            <div className="lg:sticky lg:top-36 space-y-5">
              <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">Quick Jump</p>
                {TABS.map((t) => (
                  <button key={t.id} onClick={() => setActiveTab(t.id as any)}
                    className={`w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xs text-sm transition-all mb-1 ${
                      activeTab === t.id ? "bg-gray-900 text-white font-semibold" : "text-gray-600 hover:bg-gray-50 hover:text-gray-900"
                    }`}>
                    <t.icon className="w-4 h-4" />{t.label}
                  </button>
                ))}
              </div>

              <div className="bg-indigo-50 border border-indigo-100 rounded-xs p-5">
                <p className="text-xs font-semibold tracking-widest uppercase text-indigo-400 mb-4">Why QR codes work</p>
                {[
                  { icon: Globe,   text: "Instant access — no typing, no friction",         color: "#6366f1" },
                  { icon: Shield,  text: "Works offline once printed",                        color: "#10b981" },
                  { icon: Sparkles,text: "Branded QR codes get 80% more scans than plain ones", color: "#f59e0b" },
                ].map((s) => (
                  <div key={s.text} className="flex items-start gap-2.5 mb-3 last:mb-0">
                    <s.icon className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: s.color }} />
                    <p className="text-xs text-indigo-800 leading-relaxed">{s.text}</p>
                  </div>
                ))}
              </div>

              {related.length > 0 && (
                <div className="bg-white border border-gray-100 rounded-xs p-5 shadow-sm">
                  <p className="text-xs font-semibold tracking-widest uppercase text-gray-400 mb-4">More Tools</p>
                  <div className="space-y-3">
                    {related.map((t) => (
                      <Link key={t.id} href={`/tools/${t.slug}`} className="group flex items-center gap-3 py-1.5">
                        <span className="text-xl shrink-0">{t.icon}</span>
                        <div className="min-w-0">
                          <p className="text-sm font-medium text-gray-700 group-hover:text-gray-900 truncate">{t.name}</p>
                          <p className="text-xs text-gray-400 truncate">{t.tagline}</p>
                        </div>
                        <ArrowRight className="w-3.5 h-3.5 text-gray-300 group-hover:text-gray-600 transition-all shrink-0" />
                      </Link>
                    ))}
                  </div>
                </div>
              )}

              <Link href="/tools" className="group w-full flex items-center justify-center gap-2 text-sm text-gray-500 hover:text-gray-900 border border-gray-200 hover:border-gray-400 py-3 rounded-xs transition-all">
                <ArrowLeft className="w-4 h-4 group-hover:-translate-x-0.5 transition-transform" />All Tools
              </Link>
            </div>
          </aside>
        </div>

        {/* Related tools */}
        {related.length > 0 && (
          <div className="mt-20 pt-12 border-t border-gray-100">
            <div className="flex items-center justify-between mb-8">
              <h2 className="text-2xl font-black text-gray-900">More Tools</h2>
              <Link href="/tools" className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-900">
                See all <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {related.map((t) => <ToolCard key={t.id} tool={t} />)}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
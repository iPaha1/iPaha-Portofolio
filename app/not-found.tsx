// =============================================================================
// app/not-found.tsx
// Deep space signal loss — route constellation star map
// isaacpaha.com · #08080f · amber · Sora
// Server component — no "use client" needed
// =============================================================================

import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "404 — Lost in Space | Isaac Paha",
  description: "This page doesn't exist. Navigate back to a known destination.",
};

const DESTINATIONS = [
  { href: "/",           label: "Home",        emoji: "🏠", desc: "Start here"                  },
  { href: "/blog",       label: "Blog",         emoji: "✍️", desc: "Essays & long reads"          },
  { href: "/now",        label: "Now",          emoji: "⚡", desc: "What I'm doing right now"    },
  { href: "/apps",       label: "Apps",         emoji: "🚀", desc: "Products I'm building"       },
  { href: "/tools",      label: "Tools",        emoji: "🔧", desc: "Free tools for everyone"     },
  { href: "/games",      label: "Games",        emoji: "🎮", desc: "Play & earn tokens"          },
  { href: "/ideas",      label: "Ideas",        emoji: "💡", desc: "Concepts & experiments"      },
  { href: "/ask-isaac",  label: "Ask Isaac",    emoji: "🧠", desc: "Question me anything"       },
  { href: "/newsletter", label: "Newsletter",   emoji: "📬", desc: "Letters worth reading"      },
  { href: "/podcast",    label: "Podcast",      emoji: "🎙️", desc: "Conversations on air"       },
  { href: "/contact",    label: "Contact",      emoji: "💬", desc: "Let's talk"                 },
  { href: "/about",      label: "About",        emoji: "👤", desc: "Who is Isaac Paha"          },
];

export default function NotFound() {
  return (
    <div
      className="fixed inset-0 overflow-hidden"
      style={{ background: "#08080f", fontFamily: "'Sora', system-ui, sans-serif" }}
    >
      {/* ── Ambient grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.014) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.014) 1px, transparent 1px)",
          backgroundSize: "72px 72px",
        }}
      />

      {/* ── Top amber hairline ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px] z-20"
        style={{ background: "linear-gradient(90deg, transparent, #f59e0b 30%, #f59e0b50 100%)" }}
      />

      {/* ── Deep-space nebula orbs ── */}
      <div className="absolute pointer-events-none" style={{
        top: "5%", left: "10%", width: 560, height: 560,
        background: "radial-gradient(circle, rgba(245,158,11,0.055) 0%, transparent 65%)",
        filter: "blur(70px)", animation: "drift1 20s ease-in-out infinite",
      }} />
      <div className="absolute pointer-events-none" style={{
        bottom: "8%", right: "5%", width: 420, height: 420,
        background: "radial-gradient(circle, rgba(99,102,241,0.05) 0%, transparent 65%)",
        filter: "blur(55px)", animation: "drift2 25s ease-in-out infinite",
      }} />

      {/* ── Star field ── */}
      <svg className="absolute inset-0 w-full h-full pointer-events-none" style={{ opacity: 0.4 }} aria-hidden="true">
        {[
          [8,7],[19,14],[33,5],[51,11],[68,18],[82,8],[94,22],[4,29],
          [16,38],[29,26],[47,34],[63,21],[78,31],[92,15],[6,51],[22,47],
          [38,58],[55,43],[72,55],[89,40],[12,68],[26,74],[43,62],[58,71],
          [75,65],[91,60],[3,82],[18,88],[35,79],[52,84],[69,77],[86,91],
          [97,74],[10,95],[25,93],[41,98],[57,89],[73,96],[88,86],[15,17],
          [30,22],[46,9],[62,25],[79,13],[96,29],[20,53],[36,48],[53,57],
          [70,50],[87,44],[5,67],[21,72],[38,81],[55,76],[71,83],[88,70],
        ].map(([cx, cy], i) => (
          <circle key={i} cx={`${cx}%`} cy={`${cy}%`}
            r={i % 7 === 0 ? "1.3" : i % 3 === 0 ? "0.9" : "0.6"}
            fill={i % 9 === 0 ? "#f59e0b" : i % 5 === 0 ? "#818cf8" : "white"}
            style={{ animation: `twinkle ${2.4 + (i % 5) * 0.6}s ease-in-out ${(i % 7) * 0.35}s infinite` }}
          />
        ))}
      </svg>

      {/* ── Radar sweep (centred, faint) ── */}
      <svg
        className="absolute pointer-events-none"
        style={{ top: "50%", left: "50%", width: 520, height: 520,
          transform: "translate(-50%, -55%)", opacity: 0.07 }}
        viewBox="0 0 520 520" aria-hidden="true"
      >
        <defs>
          <radialGradient id="radarFade" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0.3" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0" />
          </radialGradient>
          <linearGradient id="sweep" x1="0" y1="0" x2="1" y2="0">
            <stop offset="0%" stopColor="#f59e0b" stopOpacity="0" />
            <stop offset="100%" stopColor="#f59e0b" stopOpacity="0.5" />
          </linearGradient>
        </defs>
        {[240, 175, 110, 55].map((r, i) => (
          <circle key={r} cx="260" cy="260" r={r} fill="none"
            stroke="#f59e0b" strokeWidth="0.7" opacity={0.3 - i * 0.06} />
        ))}
        <line x1="260" y1="20"  x2="260" y2="500" stroke="#f59e0b" strokeWidth="0.5" opacity="0.25" />
        <line x1="20"  y1="260" x2="500" y2="260" stroke="#f59e0b" strokeWidth="0.5" opacity="0.25" />
        <line x1="90"  y1="90"  x2="430" y2="430" stroke="#f59e0b" strokeWidth="0.4" opacity="0.15" />
        <line x1="430" y1="90"  x2="90"  y2="430" stroke="#f59e0b" strokeWidth="0.4" opacity="0.15" />
        <path d="M260,260 L260,20 A240,240 0 0,1 500,260 Z"
          fill="url(#sweep)"
          style={{ transformOrigin: "260px 260px", animation: "radarSpin 4s linear infinite" }} />
        <circle cx="260" cy="260" r="240" fill="url(#radarFade)" />
      </svg>

      {/* ── Layout ── */}
      <div className="relative z-10 flex h-full overflow-hidden">

        {/* Left panel */}
        <div className="flex flex-col justify-center px-8 md:px-16 py-12 w-full md:w-[420px] flex-shrink-0">

          {/* Signal badge */}
          <div className="flex items-center gap-3 mb-10" style={{ animation: "slideRight 0.6s 0.1s both" }}>
            <div className="relative">
              <div className="w-2 h-2 rounded-full" style={{ background: "#ef4444", boxShadow: "0 0 8px #ef4444" }} />
              <div className="absolute inset-0 w-2 h-2 rounded-full" style={{ background: "#ef4444", animation: "ping 1.6s ease-out infinite" }} />
            </div>
            <span className="font-mono text-[10px] font-bold tracking-[0.3em] uppercase" style={{ color: "#ef4444" }}>
              Signal lost · route undefined
            </span>
          </div>

          {/* Giant 404 — typographic sculpture */}
          <div className="relative mb-6 leading-none select-none" style={{ animation: "slideRight 0.7s 0.18s both" }} aria-label="404">
            <div className="font-black" style={{
              fontSize: "clamp(88px, 14vw, 160px)",
              letterSpacing: "-0.06em",
              lineHeight: 0.88,
              WebkitTextStroke: "1px rgba(245,158,11,0.15)",
              color: "transparent",
              position: "relative",
            }}>
              {/* Outline layer */}
              <span style={{ WebkitTextStroke: "1.5px rgba(255,255,255,0.06)", color: "transparent" }}>404</span>
            </div>
            {/* Overlay amber digits */}
            <div className="absolute inset-0 font-black" style={{
              fontSize: "clamp(88px, 14vw, 160px)",
              letterSpacing: "-0.06em",
              lineHeight: 0.88,
              color: "rgba(255,255,255,0.07)",
            }}>
              <span style={{ color: "#f59e0b" }}>4</span>
              <span>0</span>
              <span style={{ color: "#f59e0b" }}>4</span>
            </div>
          </div>

          <h1 className="font-black mb-3" style={{
            fontSize: "clamp(20px,3vw,28px)",
            letterSpacing: "-0.035em",
            color: "rgba(255,255,255,0.88)",
            animation: "slideRight 0.6s 0.26s both",
          }}>
            Lost in space.
          </h1>

          <p className="text-sm leading-relaxed mb-8 max-w-xs" style={{
            color: "rgba(255,255,255,0.38)",
            fontFamily: "Georgia, serif",
            animation: "slideRight 0.6s 0.32s both",
          }}>
            This page drifted out of orbit — it doesn&apos;t exist, moved,
            or never launched. Pick a known destination from the map.
          </p>

          {/* CTA row */}
          <div className="flex items-center gap-3 flex-wrap" style={{ animation: "slideRight 0.6s 0.38s both" }}>
            <Link href="/"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xs font-black text-sm text-black transition-all"
              style={{ background: "#f59e0b", boxShadow: "0 0 28px rgba(245,158,11,0.3)", letterSpacing: "-0.01em" }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Return to base
            </Link>
            <Link href="/blog"
              className="inline-flex items-center gap-2 px-4 py-2.5 rounded-xs font-bold text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
              Read the blog
            </Link>
          </div>
        </div>

        {/* Right: destination grid — desktop only */}
        <div className="hidden md:flex flex-col justify-center flex-1 pr-12 py-12" style={{ animation: "fadeIn 0.8s 0.5s both" }}>
          <p className="text-[10px] font-black tracking-[0.28em] uppercase mb-5" style={{ color: "rgba(255,255,255,0.18)" }}>
            Known destinations
          </p>
          <div className="grid grid-cols-2 gap-2 max-w-lg">
            {DESTINATIONS.map((d, i) => (
              <Link key={d.href} href={d.href}
                className="group flex items-center gap-3 px-3.5 py-3 rounded-xs transition-all duration-200"
                style={{
                  background: "rgba(255,255,255,0.025)",
                  border: "1px solid rgba(255,255,255,0.055)",
                  animation: `fadeUp 0.45s ${0.55 + i * 0.04}s both`,
                  textDecoration: "none",
                }}
              >
                {/* Radar blip */}
                <div className="w-1.5 h-1.5 rounded-full flex-shrink-0 transition-all duration-200"
                  style={{ background: "rgba(245,158,11,0.3)" }} />

                <span className="text-base flex-shrink-0">{d.emoji}</span>

                <div className="flex-1 min-w-0">
                  <p className="text-xs font-black truncate transition-colors duration-200"
                    style={{ color: "rgba(255,255,255,0.68)", letterSpacing: "-0.01em" }}>
                    {d.label}
                  </p>
                  <p className="text-[10px] truncate" style={{ color: "rgba(255,255,255,0.22)" }}>
                    {d.desc}
                  </p>
                </div>

                <svg className="w-3 h-3 flex-shrink-0 opacity-0 group-hover:opacity-100 transition-all duration-200 -translate-x-1 group-hover:translate-x-0"
                  viewBox="0 0 24 24" fill="none" stroke="#f59e0b" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                  <path d="M5 12h14M12 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Mobile quick nav ── */}
      <div className="md:hidden absolute bottom-0 left-0 right-0 px-5 pb-6" style={{ animation: "slideUp 0.6s 0.5s both" }}>
        <div className="rounded-xs overflow-hidden" style={{
          background: "rgba(8,8,15,0.97)",
          border: "1px solid rgba(255,255,255,0.07)",
          backdropFilter: "blur(16px)",
        }}>
          <div className="px-4 py-2 flex items-center gap-2" style={{ borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
            <div className="w-1.5 h-1.5 rounded-full" style={{ background: "#f59e0b", boxShadow: "0 0 5px #f59e0b" }} />
            <span className="text-[9px] font-black tracking-[0.22em] uppercase" style={{ color: "rgba(255,255,255,0.25)" }}>Navigate</span>
          </div>
          <div className="grid grid-cols-4 gap-px" style={{ background: "rgba(255,255,255,0.04)" }}>
            {DESTINATIONS.slice(0, 8).map(d => (
              <Link key={d.href} href={d.href}
                className="flex flex-col items-center gap-1 py-3 px-1 transition-all"
                style={{ background: "#08080f", textDecoration: "none" }}>
                <span className="text-xl">{d.emoji}</span>
                <span className="text-[9px] font-bold" style={{ color: "rgba(255,255,255,0.4)" }}>{d.label}</span>
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Wordmark ── */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 font-mono text-[9px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,255,255,0.08)", animation: "fadeIn 1s 1.2s both" }}>
        isaacpaha.com
      </p>

      <style>{`
        @keyframes drift1 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(28px,-22px)} }
        @keyframes drift2 { 0%,100%{transform:translate(0,0)} 50%{transform:translate(-22px,28px)} }
        @keyframes twinkle { 0%,100%{opacity:.35} 50%{opacity:.95} }
        @keyframes radarSpin { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes ping { 0%{transform:scale(1);opacity:.7} 100%{transform:scale(3.5);opacity:0} }
        @keyframes slideRight { from{opacity:0;transform:translateX(-22px)} to{opacity:1;transform:translateX(0)} }
        @keyframes slideUp    { from{opacity:0;transform:translateY(18px)}  to{opacity:1;transform:translateY(0)} }
        @keyframes fadeIn     { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp     { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        a.group:hover { background:rgba(245,158,11,0.07)!important; border-color:rgba(245,158,11,0.22)!important; }
        a.group:hover p:first-of-type { color:#f59e0b!important; }
        a.group:hover .w-1\\.5 { background:#f59e0b!important; box-shadow:0 0 7px #f59e0b!important; }
      `}</style>
    </div>
  );
}
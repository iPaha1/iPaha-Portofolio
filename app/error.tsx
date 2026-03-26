// =============================================================================
// app/error.tsx
// Amber circuit-burn — live system diagnostic recovery
// isaacpaha.com · #08080f · amber · Sora
// MUST be "use client" — Next.js requirement for error boundaries
// =============================================================================
"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";

interface ErrorProps {
  error: Error & { digest?: string };
  reset: () => void;
}

const DIAG_STEPS = [
  { msg: "Capturing fault trace…",       icon: "◈" },
  { msg: "Isolating error boundary…",    icon: "◈" },
  { msg: "Scanning component tree…",     icon: "◈" },
  { msg: "Saving state snapshot…",       icon: "◈" },
  { msg: "Clearing corrupted cache…",    icon: "◈" },
  { msg: "Preparing recovery payload…",  icon: "◈" },
];

export default function Error({ error, reset }: ErrorProps) {
  const [step,       setStep]       = useState(0);
  const [ready,      setReady]      = useState(false);
  const [retrying,   setRetrying]   = useState(false);
  const [showDetail, setShowDetail] = useState(false);
  const [mounted,    setMounted]    = useState(false);

  useEffect(() => { setMounted(true); }, []);

  // Walk through diagnostic steps
  useEffect(() => {
    if (step < DIAG_STEPS.length) {
      const t = setTimeout(() => setStep(s => s + 1), 420);
      return () => clearTimeout(t);
    } else {
      const t = setTimeout(() => setReady(true), 300);
      return () => clearTimeout(t);
    }
  }, [step]);

  const handleRetry = useCallback(() => {
    setRetrying(true);
    setReady(false);
    setStep(0);
    setTimeout(() => {
      reset();
    }, 1000);
  }, [reset]);

  if (!mounted) return null;

  return (
    <div
      className="fixed inset-0 overflow-hidden flex flex-col"
      style={{ background: "#08080f", fontFamily: "'Sora', system-ui, sans-serif" }}
    >
      {/* ── Ambient grid ── */}
      <div className="absolute inset-0 pointer-events-none" style={{
        backgroundImage:
          "linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px)," +
          "linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)",
        backgroundSize: "64px 64px",
      }} />

      {/* ── Red fault hairline ── */}
      <div className="absolute top-0 left-0 right-0 h-[2px] z-20" style={{
        background: "linear-gradient(90deg, transparent, #ef4444 20%, #f59e0b 60%, transparent 100%)",
        animation: "hairlinePulse 2.4s ease-in-out infinite",
      }} />

      {/* ── Error glow corona ── */}
      <div className="absolute top-0 left-0 right-0 pointer-events-none" style={{
        height: 300,
        background: "radial-gradient(ellipse at 50% 0%, rgba(239,68,68,0.08) 0%, transparent 68%)",
      }} />
      <div className="absolute bottom-0 right-0 pointer-events-none" style={{
        width: 380, height: 380,
        background: "radial-gradient(circle, rgba(245,158,11,0.045) 0%, transparent 65%)",
        filter: "blur(50px)",
      }} />

      {/* ── Circuit board SVG — top right ── */}
      <svg
        className="absolute top-0 right-0 pointer-events-none"
        style={{ opacity: 0.06, animation: "fadeIn 1.2s 0.3s both" }}
        width="380" height="380" viewBox="0 0 380 380" aria-hidden="true"
      >
        {/* Horizontal traces */}
        {[30,70,110,150,190,230,270,310].map(y => (
          <line key={`h${y}`} x1="0" y1={y} x2={340 + Math.sin(y * 0.05) * 15} y2={y}
            stroke="#f59e0b" strokeWidth="0.8" strokeDasharray={`${6 + (y % 4)} ${10 + (y % 6)}`} />
        ))}
        {/* Vertical traces */}
        {[50,110,170,230,290,350].map(x => (
          <line key={`v${x}`} x1={x} y1="0" x2={x} y2={280 + Math.cos(x * 0.04) * 12}
            stroke="#f59e0b" strokeWidth="0.7" strokeDasharray={`${5 + (x % 5)} 12`} />
        ))}
        {/* Junctions */}
        {[[50,30],[110,70],[170,110],[230,150],[290,190],[50,190],[170,230],[290,270],[110,30],[350,110]].map(([x,y], i) => (
          <rect key={i} x={x-3} y={y-3} width="6" height="6" fill="#f59e0b" opacity="0.7" rx="1" />
        ))}
        {/* Burn node — short-circuit point */}
        <circle cx="200" cy="140" r="22" fill="none" stroke="#ef4444" strokeWidth="1.5" opacity="0.9"
          style={{ animation: "burnPulse 1.8s ease-in-out infinite" }} />
        <circle cx="200" cy="140" r="11" fill="rgba(239,68,68,0.15)" />
        <circle cx="200" cy="140" r="4"  fill="#ef4444" opacity="0.8" />
        <line x1="186" y1="126" x2="214" y2="154" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
        <line x1="214" y1="126" x2="186" y2="154" stroke="#ef4444" strokeWidth="1.8" strokeLinecap="round" />
        {/* Arc sparks */}
        {[[-18,-18],[20,-16],[22,16],[-16,20]].map(([dx,dy],i) => (
          <circle key={i} cx={200+dx} cy={140+dy} r="1.5" fill="#f59e0b"
            style={{ animation: `spark ${0.9 + i * 0.2}s ease-in-out ${i * 0.15}s infinite` }} />
        ))}
      </svg>

      {/* ── Main ── */}
      <div className="relative z-10 flex flex-col md:flex-row items-center justify-center flex-1 gap-10 px-6 py-12">

        {/* Left: identity + actions */}
        <div className="flex flex-col items-start max-w-sm w-full">

          {/* Fault badge */}
          <div className="flex items-center gap-2.5 mb-8" style={{ animation: "slideRight 0.55s 0.05s both" }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-xs"
              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)" }}>
              <div className="w-1.5 h-1.5 rounded-full" style={{
                background: "#ef4444", boxShadow: "0 0 7px #ef4444",
                animation: "blink 1.1s ease-in-out infinite",
              }} />
              <span className="font-mono text-[10px] font-bold tracking-[0.25em] uppercase" style={{ color: "#ef4444" }}>
                System Fault
              </span>
            </div>
            {error.digest && (
              <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.16)" }}>
                #{error.digest.slice(0, 8).toUpperCase()}
              </span>
            )}
          </div>

          {/* Fault icon */}
          <div className="relative mb-6" style={{ animation: "slideRight 0.55s 0.12s both" }}>
            <svg width="72" height="72" viewBox="0 0 72 72" fill="none" aria-hidden="true">
              <circle cx="36" cy="36" r="32" stroke="rgba(239,68,68,0.12)" strokeWidth="1.5" />
              <circle cx="36" cy="36" r="32" stroke="#ef4444" strokeWidth="1.5"
                strokeDasharray="201" strokeDashoffset="50"
                style={{ animation: "spinRing 9s linear infinite", transformOrigin: "36px 36px" }} />
              <circle cx="36" cy="36" r="22" stroke="rgba(245,158,11,0.12)" strokeWidth="1" />
              <path d="M36 19 L51 44 H21 Z"
                fill="rgba(239,68,68,0.1)" stroke="#ef4444" strokeWidth="1.5" strokeLinejoin="round" />
              <line x1="36" y1="26" x2="36" y2="36" stroke="#ef4444" strokeWidth="2" strokeLinecap="round" />
              <circle cx="36" cy="41" r="1.8" fill="#ef4444" />
            </svg>
          </div>

          <h1 className="font-black mb-2.5" style={{
            fontSize: "clamp(26px,4.5vw,40px)",
            letterSpacing: "-0.04em",
            color: "rgba(255,255,255,0.9)",
            animation: "slideRight 0.55s 0.2s both",
          }}>
            Something broke.
          </h1>

          <p className="text-sm leading-relaxed mb-8" style={{
            color: "rgba(255,255,255,0.38)",
            fontFamily: "Georgia, serif",
            maxWidth: 300,
            animation: "slideRight 0.55s 0.26s both",
          }}>
            An unexpected fault occurred. The system has isolated the error and is
            ready to recover. Try again or return home.
          </p>

          {/* Action buttons */}
          <div className="flex items-center gap-3 flex-wrap" style={{ animation: "slideRight 0.55s 0.32s both" }}>
            <button
              onClick={handleRetry}
              disabled={retrying || !ready}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xs font-black text-sm text-black transition-all disabled:opacity-50"
              style={{
                background: ready && !retrying ? "#f59e0b" : "#92400e",
                boxShadow: ready && !retrying ? "0 0 28px rgba(245,158,11,0.32)" : "none",
                letterSpacing: "-0.01em",
              }}
            >
              {retrying ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(0,0,0,0.25)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="black" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Restarting…
                </>
              ) : !ready ? (
                <>
                  <svg className="w-3.5 h-3.5 animate-spin" viewBox="0 0 24 24" fill="none">
                    <circle cx="12" cy="12" r="10" stroke="rgba(255,255,255,0.15)" strokeWidth="3" />
                    <path d="M12 2a10 10 0 0 1 10 10" stroke="white" strokeWidth="3" strokeLinecap="round" />
                  </svg>
                  Diagnosing…
                </>
              ) : (
                <>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="black" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
                    <path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8" />
                    <path d="M3 3v5h5" />
                  </svg>
                  Try Again
                </>
              )}
            </button>

            <Link href="/"
              className="flex items-center gap-2 px-4 py-2.5 rounded-xs font-bold text-sm transition-all"
              style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", color: "rgba(255,255,255,0.45)" }}>
              <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" /><polyline points="9 22 9 12 15 12 15 22" />
              </svg>
              Go home
            </Link>
          </div>
        </div>

        {/* Right: diagnostic terminal */}
        <div className="w-full max-w-sm" style={{ animation: "fadeUp 0.6s 0.35s both" }}>
          <div className="rounded-xs overflow-hidden" style={{
            background: "rgba(0,0,0,0.5)",
            border: "1px solid rgba(255,255,255,0.07)",
            boxShadow: "0 24px 60px rgba(0,0,0,0.6)",
          }}>
            {/* Terminal header */}
            <div className="flex items-center justify-between px-4 py-2.5" style={{
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: "rgba(255,255,255,0.02)",
            }}>
              <div className="flex items-center gap-2">
                <div className="flex gap-1.5">
                  {["#ef4444","#f59e0b","#22c55e"].map(c => (
                    <div key={c} className="w-2.5 h-2.5 rounded-full" style={{ background: c, opacity: 0.65 }} />
                  ))}
                </div>
                <span className="font-mono text-[10px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  fault-recovery.sh
                </span>
              </div>
              <div className="flex items-center gap-1.5">
                <div className="w-1.5 h-1.5 rounded-full" style={{
                  background: ready ? "#22c55e" : "#f59e0b",
                  boxShadow: `0 0 5px ${ready ? "#22c55e" : "#f59e0b"}`,
                  transition: "all 0.4s",
                }} />
                <span className="font-mono text-[9px]" style={{ color: "rgba(255,255,255,0.2)" }}>
                  {ready ? "READY" : "RUNNING"}
                </span>
              </div>
            </div>

            {/* Terminal body */}
            <div className="p-4 space-y-2 font-mono text-[11px] min-h-[220px]">
              {/* Boot line */}
              <div className="flex items-center gap-2 mb-1" style={{ opacity: 0.4 }}>
                <span style={{ color: "#f59e0b" }}>$</span>
                <span style={{ color: "rgba(255,255,255,0.5)" }}>./fault-recovery.sh --auto</span>
              </div>

              {DIAG_STEPS.map((s, i) => (
                <div key={i} className="flex items-center gap-2.5 transition-opacity duration-300"
                  style={{ opacity: i < step ? 1 : 0 }}>
                  <span style={{ color: i < step - 1 ? "#22c55e" : "#f59e0b", fontSize: 10 }}>
                    {i < step - 1 ? "✓" : s.icon}
                  </span>
                  <span style={{ color: i < step - 1 ? "rgba(255,255,255,0.45)" : "rgba(255,255,255,0.75)" }}>
                    {s.msg}
                  </span>
                  {i === step - 1 && !ready && (
                    <span style={{ color: "rgba(255,255,255,0.3)", animation: "blink 0.7s infinite" }}>█</span>
                  )}
                </div>
              ))}

              {ready && (
                <div style={{ animation: "fadeUp 0.35s both", marginTop: 4 }}>
                  <div className="flex items-center gap-2 mb-1.5">
                    <span style={{ color: "#22c55e" }}>✓</span>
                    <span style={{ color: "rgba(255,255,255,0.7)" }}>System ready. Safe to retry.</span>
                  </div>

                  {error.message && (
                    <div className="mt-3">
                      <button
                        onClick={() => setShowDetail(d => !d)}
                        className="flex items-center gap-1.5 transition-opacity"
                        style={{ color: "rgba(255,255,255,0.28)", fontSize: 10, opacity: 0.7 }}
                      >
                        <span style={{ color: "#f59e0b" }}>{showDetail ? "▾" : "▸"}</span>
                        {showDetail ? "hide" : "show"} error detail
                      </button>

                      {showDetail && (
                        <div className="mt-2 p-3 rounded-xs break-all leading-relaxed text-[10px]"
                          style={{
                            background: "rgba(239,68,68,0.07)",
                            border: "1px solid rgba(239,68,68,0.18)",
                            color: "rgba(255,160,160,0.7)",
                            animation: "fadeUp 0.25s both",
                          }}>
                          {error.message}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Quick links row */}
          <div className="flex gap-2 mt-3">
            {[
              { href: "/blog",  label: "Blog"  },
              { href: "/tools", label: "Tools" },
              { href: "/games", label: "Games" },
            ].map(l => (
              <Link key={l.href} href={l.href}
                className="flex-1 text-center py-2 rounded-xs text-[10px] font-bold transition-all"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", color: "rgba(255,255,255,0.3)" }}>
                {l.label}
              </Link>
            ))}
          </div>
        </div>
      </div>

      {/* ── Wordmark ── */}
      <p className="absolute bottom-4 left-1/2 -translate-x-1/2 z-10 font-mono text-[9px] tracking-[0.3em] uppercase"
        style={{ color: "rgba(255,255,255,0.08)", animation: "fadeIn 1s 1s both" }}>
        isaacpaha.com
      </p>

      <style>{`
        @keyframes fadeIn       { from{opacity:0} to{opacity:1} }
        @keyframes fadeUp       { from{opacity:0;transform:translateY(10px)} to{opacity:1;transform:translateY(0)} }
        @keyframes slideRight   { from{opacity:0;transform:translateX(-18px)} to{opacity:1;transform:translateX(0)} }
        @keyframes blink        { 0%,100%{opacity:1} 50%{opacity:0} }
        @keyframes spinRing     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
        @keyframes hairlinePulse{ 0%,100%{opacity:1} 50%{opacity:0.5} }
        @keyframes burnPulse    { 0%,100%{opacity:.9;r:22px} 50%{opacity:.4;r:26px} }
        @keyframes spark        { 0%,100%{opacity:1;transform:scale(1)} 50%{opacity:0;transform:scale(2.5)} }
        a:hover { background:rgba(245,158,11,0.07)!important; color:rgba(255,255,255,0.75)!important; border-color:rgba(245,158,11,0.2)!important; }
      `}</style>
    </div>
  );
}
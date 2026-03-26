// =============================================================================
// app/loading.tsx
// Orbital gyroscope ignition — three rings at different inclinations
// isaacpaha.com · #08080f · amber · Sora
// Pure CSS animations — zero JS, zero layout shift, server-renderable
// =============================================================================

export default function Loading() {
  return (
    <div
      className="fixed inset-0 flex flex-col items-center justify-center overflow-hidden"
      style={{ background: "#08080f", fontFamily: "'Sora', system-ui, sans-serif" }}
    >
      {/* ── Ambient grid ── */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(rgba(255,255,255,0.013) 1px, transparent 1px)," +
            "linear-gradient(90deg, rgba(255,255,255,0.013) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* ── Top amber hairline ── */}
      <div
        className="absolute top-0 left-0 right-0 h-[2px]"
        style={{
          background: "linear-gradient(90deg, transparent, #f59e0b 30%, #f59e0b50 100%)",
          animation: "hairline 2s ease-in-out infinite",
        }}
      />

      {/* ── Outer glow corona ── */}
      <div
        className="absolute pointer-events-none"
        style={{
          width: 600, height: 600,
          background: "radial-gradient(circle, rgba(245,158,11,0.06) 0%, transparent 65%)",
          filter: "blur(60px)",
          animation: "breathe 3.5s ease-in-out infinite",
        }}
      />

      {/* ── Orbital orrery ── */}
      <div
        className="relative flex items-center justify-center"
        style={{ width: 220, height: 220, marginBottom: 48 }}
      >
        {/* ─ Ring 1: equatorial plane ─ */}
        <div
          className="absolute"
          style={{
            width: 200, height: 200,
            border: "1.5px solid rgba(245,158,11,0.18)",
            borderRadius: "50%",
            animation: "orbitEq 3.2s linear infinite",
          }}
        >
          {/* Traveller dot */}
          <div
            className="absolute"
            style={{
              width: 8, height: 8,
              background: "#f59e0b",
              borderRadius: "50%",
              top: -4, left: "50%", marginLeft: -4,
              boxShadow: "0 0 14px #f59e0b, 0 0 28px rgba(245,158,11,0.4)",
            }}
          />
        </div>

        {/* ─ Ring 2: tilted 55° ─ */}
        <div
          className="absolute"
          style={{
            width: 148, height: 148,
            border: "1.5px solid rgba(99,102,241,0.22)",
            borderRadius: "50%",
            transform: "rotateX(55deg)",
            animation: "orbitTilt1 2.1s linear infinite reverse",
          }}
        >
          <div
            className="absolute"
            style={{
              width: 6, height: 6,
              background: "#818cf8",
              borderRadius: "50%",
              top: -3, left: "50%", marginLeft: -3,
              boxShadow: "0 0 10px #818cf8, 0 0 20px rgba(129,140,248,0.35)",
            }}
          />
        </div>

        {/* ─ Ring 3: tilted -40° on other axis ─ */}
        <div
          className="absolute"
          style={{
            width: 108, height: 108,
            border: "1.5px solid rgba(16,185,129,0.2)",
            borderRadius: "50%",
            transform: "rotateY(60deg) rotateX(-20deg)",
            animation: "orbitTilt2 1.55s linear infinite",
          }}
        >
          <div
            className="absolute"
            style={{
              width: 5, height: 5,
              background: "#10b981",
              borderRadius: "50%",
              top: -2.5, left: "50%", marginLeft: -2.5,
              boxShadow: "0 0 8px #10b981, 0 0 16px rgba(16,185,129,0.3)",
            }}
          />
        </div>

        {/* ─ Core amber sphere ─ */}
        <div
          className="absolute"
          style={{
            width: 28, height: 28,
            borderRadius: "50%",
            background: "radial-gradient(circle at 35% 30%, #fbbf24, #f59e0b, #d97706)",
            boxShadow: "0 0 20px rgba(245,158,11,0.6), 0 0 40px rgba(245,158,11,0.25), inset 0 0 8px rgba(255,255,255,0.15)",
            animation: "corePulse 2.4s ease-in-out infinite",
          }}
        />

        {/* ─ Core ring halo ─ */}
        <div
          className="absolute"
          style={{
            width: 44, height: 44,
            border: "1px solid rgba(245,158,11,0.25)",
            borderRadius: "50%",
            animation: "halo 2.4s ease-in-out infinite",
          }}
        />
        <div
          className="absolute"
          style={{
            width: 60, height: 60,
            border: "0.5px solid rgba(245,158,11,0.1)",
            borderRadius: "50%",
            animation: "halo 2.4s ease-in-out infinite 0.3s",
          }}
        />
      </div>

      {/* ── Status text ── */}
      <div className="flex flex-col items-center gap-3" style={{ animation: "fadeIn 0.8s 0.2s both" }}>
        {/* Initialising ticker */}
        <div className="flex items-center gap-2.5">
          <div
            className="w-1.5 h-1.5 rounded-full"
            style={{ background: "#f59e0b", boxShadow: "0 0 7px #f59e0b", animation: "blink 1.2s ease-in-out infinite" }}
          />
          <span
            className="font-mono text-[10px] tracking-[0.28em] uppercase"
            style={{ color: "rgba(255,255,255,0.35)" }}
          >
            Initialising
          </span>
          {/* Three animated dots */}
          <span style={{ color: "#f59e0b", fontSize: 12, letterSpacing: 2, lineHeight: 1 }}>
            <span style={{ animation: "dotPop 1.4s ease-in-out 0s infinite" }}>·</span>
            <span style={{ animation: "dotPop 1.4s ease-in-out 0.2s infinite" }}>·</span>
            <span style={{ animation: "dotPop 1.4s ease-in-out 0.4s infinite" }}>·</span>
          </span>
        </div>

        {/* Rotating status words */}
        <div className="relative overflow-hidden" style={{ height: 20, width: 220 }}>
          {[
            "Loading components",
            "Fetching your data",
            "Preparing the view",
            "Almost ready",
          ].map((msg, i) => (
            <div
              key={msg}
              className="absolute inset-0 flex items-center justify-center"
              style={{
                fontFamily: "Georgia, serif",
                fontSize: 12,
                color: "rgba(255,255,255,0.25)",
                fontStyle: "italic",
                animation: `wordCycle 5.6s ease-in-out ${i * 1.4}s infinite`,
              }}
            >
              {msg}
            </div>
          ))}
        </div>
      </div>

      {/* ── Progress bar ── */}
      <div
        className="absolute bottom-0 left-0 right-0 h-[1.5px]"
        style={{ background: "rgba(255,255,255,0.04)", animation: "fadeIn 0.5s both" }}
      >
        <div
          className="h-full"
          style={{
            background: "linear-gradient(90deg, transparent, #f59e0b, #f59e0b80)",
            animation: "loadBar 2.2s ease-in-out infinite",
            transformOrigin: "left center",
          }}
        />
      </div>

      {/* ── Wordmark ── */}
      <p
        className="absolute bottom-4 font-mono text-[9px] tracking-[0.32em] uppercase"
        style={{ color: "rgba(255,255,255,0.08)" }}
      >
        isaacpaha.com
      </p>

      <style>{`
        @keyframes orbitEq {
          from { transform: rotate(0deg); }
          to   { transform: rotate(360deg); }
        }
        @keyframes orbitTilt1 {
          from { transform: rotateX(55deg) rotate(0deg); }
          to   { transform: rotateX(55deg) rotate(360deg); }
        }
        @keyframes orbitTilt2 {
          from { transform: rotateY(60deg) rotateX(-20deg) rotate(0deg); }
          to   { transform: rotateY(60deg) rotateX(-20deg) rotate(360deg); }
        }
        @keyframes corePulse {
          0%,100% { transform: scale(1);    box-shadow: 0 0 20px rgba(245,158,11,.6), 0 0 40px rgba(245,158,11,.25); }
          50%     { transform: scale(1.12); box-shadow: 0 0 32px rgba(245,158,11,.8), 0 0 64px rgba(245,158,11,.35); }
        }
        @keyframes halo {
          0%,100% { opacity: .25; transform: scale(1); }
          50%     { opacity: .5;  transform: scale(1.08); }
        }
        @keyframes breathe {
          0%,100% { opacity: .6; transform: scale(1); }
          50%     { opacity: 1;  transform: scale(1.06); }
        }
        @keyframes hairline {
          0%,100% { opacity: .8; }
          50%     { opacity: .35; }
        }
        @keyframes blink {
          0%,100% { opacity: 1; }
          50%     { opacity: .2; }
        }
        @keyframes dotPop {
          0%,80%,100% { opacity: .2; transform: translateY(0); }
          40%         { opacity: 1;  transform: translateY(-3px); }
        }
        @keyframes loadBar {
          0%   { width: 0%;   opacity: 0; }
          10%  { opacity: 1; }
          75%  { width: 85%;  opacity: 1; }
          95%  { width: 100%; opacity: .5; }
          100% { width: 0%;   opacity: 0; }
        }
        @keyframes wordCycle {
          0%,5%          { opacity: 0; transform: translateY(8px); }
          15%,70%        { opacity: 1; transform: translateY(0); }
          80%,100%       { opacity: 0; transform: translateY(-8px); }
        }
        @keyframes fadeIn {
          from { opacity: 0; }
          to   { opacity: 1; }
        }
      `}</style>
    </div>
  );
}
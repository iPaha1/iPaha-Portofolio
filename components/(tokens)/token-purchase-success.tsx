"use client";

// =============================================================================
// isaacpaha.com — Token Purchase Success Banner
// components/(tokens)/token-purchase-success.tsx
//
// Add this to your /tools page (app/tools/page.tsx or the tools page component).
// It reads `?token_success=1&tokens=12000` from the URL, shows the celebration
// banner for 6 seconds, then cleans up the URL.
//
// Usage:
//   import { TokenPurchaseSuccess } from "@/components/(tokens)/token-purchase-success";
//   // Inside your tools page JSX:
//   <TokenPurchaseSuccess />
// =============================================================================

import React, { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";

// Confetti particle (pure CSS, no library needed)
function ConfettiParticle({ i }: { i: number }) {
  const colors   = ["#f59e0b", "#6366f1", "#10b981", "#ec4899", "#0ea5e9", "#f97316"];
  const color    = colors[i % colors.length];
  const left     = `${5 + (i * 37) % 90}%`;
  const delay    = `${(i * 0.15) % 1.2}s`;
  const duration = `${0.8 + (i * 0.13) % 0.7}s`;
  const size     = 6 + (i % 4) * 2;
  const shape    = i % 3 === 0 ? "50%" : i % 3 === 1 ? "2px" : "0%";

  return (
    <div
      className="absolute top-0 pointer-events-none"
      style={{
        left,
        width:           size,
        height:          size,
        backgroundColor: color,
        borderRadius:    shape,
        animation:       `confetti-fall ${duration} ${delay} ease-in forwards`,
      }}
    />
  );
}

export function TokenPurchaseSuccess() {
  const searchParams = useSearchParams();
  const router       = useRouter();
  const pathname     = usePathname();

  const [visible, setVisible] = useState(false);
  const [tokens,  setTokens]  = useState(0);
  const [counter, setCounter] = useState(0);

  useEffect(() => {
    const success    = searchParams.get("token_success");
    const tokenParam = searchParams.get("tokens");

    if (success !== "1" || !tokenParam) return;

    const amount = parseInt(tokenParam, 10);
    if (isNaN(amount) || amount <= 0) return;

    setTokens(amount);
    setVisible(true);

    // Animate counter up
    const steps    = 40;
    const stepVal  = amount / steps;
    let   step     = 0;
    const timer    = setInterval(() => {
      step++;
      setCounter(Math.min(Math.round(stepVal * step), amount));
      if (step >= steps) clearInterval(timer);
    }, 35);

    // Clean URL after 6s, hide after 7s
    const urlTimer  = setTimeout(() => {
      const params = new URLSearchParams(searchParams.toString());
      params.delete("token_success");
      params.delete("tokens");
      const newUrl = params.toString() ? `${pathname}?${params}` : pathname;
      router.replace(newUrl, { scroll: false });
    }, 6000);

    const hideTimer = setTimeout(() => setVisible(false), 7000);

    return () => {
      clearInterval(timer);
      clearTimeout(urlTimer);
      clearTimeout(hideTimer);
    };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [searchParams]);

  return (
    <>
      {/* Inject confetti keyframes once */}
      <style>{`
        @keyframes confetti-fall {
          0%   { transform: translateY(-20px) rotate(0deg);   opacity: 1; }
          100% { transform: translateY(120px) rotate(720deg); opacity: 0; }
        }
      `}</style>

      <AnimatePresence>
        {visible && (
          <motion.div
            initial={{ opacity: 0, y: -80, scale: 0.9 }}
            animate={{ opacity: 1, y: 0,   scale: 1    }}
            exit={{    opacity: 0, y: -40, scale: 0.95  }}
            transition={{ type: "spring", damping: 20, stiffness: 280 }}
            className="fixed top-5 left-1/2 -translate-x-1/2 z-[9999] w-full max-w-sm pointer-events-none"
            style={{ fontFamily: "Sora, sans-serif" }}
          >
            <div
              className="relative mx-4 rounded-sm overflow-hidden shadow-2xl pointer-events-auto"
              style={{
                backgroundColor: "#0e0e12",
                border:          "1px solid rgba(245,158,11,0.3)",
              }}
            >
              {/* Confetti layer */}
              <div className="absolute inset-0 overflow-hidden pointer-events-none">
                {Array.from({ length: 18 }).map((_, i) => (
                  <ConfettiParticle key={i} i={i} />
                ))}
              </div>

              {/* Amber glow top */}
              <div
                className="absolute top-0 left-0 right-0 h-0.5"
                style={{ background: "linear-gradient(90deg, transparent, #f59e0b, transparent)" }}
              />

              <div className="relative px-6 py-5 flex items-center gap-4">
                {/* Coin icon with pulse */}
                <div className="relative flex-shrink-0">
                  <motion.div
                    animate={{ scale: [1, 1.15, 1], rotate: [0, -8, 8, 0] }}
                    transition={{ duration: 0.6, delay: 0.2 }}
                    className="text-4xl"
                  >
                    🪙
                  </motion.div>
                  <motion.div
                    animate={{ scale: [1, 2.5], opacity: [0.5, 0] }}
                    transition={{ duration: 0.8, delay: 0.1 }}
                    className="absolute inset-0 rounded-full border-2 border-amber-400"
                  />
                </div>

                <div className="flex-1 min-w-0">
                  <p className="text-[10px] font-black uppercase tracking-widest text-amber-400 mb-0.5">
                    Payment successful
                  </p>
                  <div className="flex items-baseline gap-2">
                    <motion.p
                      key={counter}
                      className="text-2xl font-black text-white tabular-nums"
                    >
                      {counter.toLocaleString()}
                    </motion.p>
                    <span className="text-amber-400 font-black text-base">tokens added</span>
                  </div>
                  <p className="text-[11px] text-white/40 mt-0.5">
                    Ready to use across all tools instantly
                  </p>
                </div>

                {/* Close */}
                <button
                  onClick={() => setVisible(false)}
                  className="flex-shrink-0 text-white/20 hover:text-white/60 transition-colors text-lg leading-none"
                >
                  ✕
                </button>
              </div>

              {/* Progress bar (drains over 6s) */}
              <motion.div
                initial={{ width: "100%" }}
                animate={{ width: "0%"   }}
                transition={{ duration: 6, ease: "linear" }}
                className="h-0.5"
                style={{ backgroundColor: "#f59e0b" }}
              />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}
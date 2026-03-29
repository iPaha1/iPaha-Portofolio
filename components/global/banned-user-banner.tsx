// components/banned-user-banner.tsx
"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Shield, X, AlertTriangle, Lock } from "lucide-react";

export function BannedUserBanner() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check URL for gameBan parameter
    const params = new URLSearchParams(window.location.search);
    if (params.get("gameBan") === "true") {
      setIsVisible(true);
      // Clean URL without refreshing the page
      const newUrl = window.location.pathname + window.location.hash;
      window.history.replaceState({}, "", newUrl);
    }
  }, []);

  const handleDismiss = () => {
    setIsVisible(false);
  };

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ y: -100, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          exit={{ y: -100, opacity: 0 }}
          transition={{ type: "spring", damping: 20, stiffness: 300 }}
          className="fixed top-4 left-1/2 -translate-x-1/2 z-[9999] w-[90vw] max-w-md"
        >
          <div
            className="relative overflow-hidden rounded-xs"
            style={{
              background: "linear-gradient(135deg, rgba(15,15,25,0.98), rgba(10,10,20,0.98))",
              border: "1px solid rgba(239,68,68,0.3)",
              boxShadow: "0 20px 35px -10px rgba(0,0,0,0.5), 0 0 0 1px rgba(239,68,68,0.1), 0 0 20px rgba(239,68,68,0.1)",
              backdropFilter: "blur(12px)",
            }}
          >
            {/* Top red accent line */}
            <div className="absolute top-0 left-0 right-0 h-[2px] bg-gradient-to-r from-red-500 via-red-600 to-transparent" />

            {/* Subtle red glow */}
            <div
              className="absolute inset-0 pointer-events-none"
              style={{
                background: "radial-gradient(circle at 0% 0%, rgba(239,68,68,0.08), transparent 70%)",
              }}
            />

            <div className="relative p-4 flex items-start gap-3">
              {/* Icon container */}
              <div
                className="flex-shrink-0 w-10 h-10 rounded-xs flex items-center justify-center"
                style={{
                  background: "rgba(239,68,68,0.12)",
                  border: "1px solid rgba(239,68,68,0.25)",
                  boxShadow: "0 0 12px rgba(239,68,68,0.2)",
                }}
              >
                <Shield className="w-5 h-5 text-red-400" />
              </div>

              {/* Content */}
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <h3 className="text-sm font-black text-white" style={{ letterSpacing: "-0.02em" }}>
                    Account Restricted
                  </h3>
                  <span
                    className="text-[9px] font-black px-1.5 py-0.5 rounded-xs"
                    style={{
                      background: "rgba(239,68,68,0.15)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.25)",
                    }}
                  >
                    Banned
                  </span>
                </div>
                <p className="text-xs text-white/45 leading-relaxed">
                  Your access to games has been restricted due to violation of our{" "}
                  <button
                    onClick={() => window.open("/games-terms", "_blank")}
                    className="text-red-400 hover:text-red-300 transition-colors underline underline-offset-2"
                  >
                    terms of service
                  </button>
                  .
                </p>
                <div className="mt-2.5 flex items-center gap-3">
                  <a
                    href="/contact"
                    className="text-[10px] font-bold px-2 py-1 rounded-xs transition-all hover:scale-105"
                    style={{
                      background: "rgba(239,68,68,0.1)",
                      color: "#f87171",
                      border: "1px solid rgba(239,68,68,0.2)",
                    }}
                  >
                    Contact Support
                  </a>
                  <span className="text-[9px] text-white/25 flex items-center gap-1">
                    <Lock className="w-2.5 h-2.5" />
                    Appeal available
                  </span>
                </div>
              </div>

              {/* Dismiss button */}
              <button
                onClick={handleDismiss}
                className="flex-shrink-0 w-6 h-6 rounded-xs flex items-center justify-center transition-all hover:scale-105"
                style={{
                  background: "rgba(255,255,255,0.05)",
                  border: "1px solid rgba(255,255,255,0.1)",
                }}
              >
                <X className="w-3 h-3 text-white/40" />
              </button>
            </div>

            {/* Subtle animated pulse at bottom */}
            <motion.div
              animate={{ opacity: [0.3, 0.6, 0.3] }}
              transition={{ repeat: Infinity, duration: 2 }}
              className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-red-500/30 to-transparent"
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
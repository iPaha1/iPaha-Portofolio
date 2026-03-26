// =============================================================================
// TOKEN NOTIFICATION — Premium Redesign
// components/(gamification)/token-notification.tsx
// =============================================================================
 
"use client";
 
import React, { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Zap } from "lucide-react";
 
interface TokenNotificationProps {
  amount: number;
  reason: string;
}
 
export function TokenNotification({ amount, reason }: TokenNotificationProps) {
  const [visible, setVisible] = useState(true);
 
  useEffect(() => {
    const t = setTimeout(() => setVisible(false), 3200);
    return () => clearTimeout(t);
  }, []);
 
  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 16, x: 0 }}
          animate={{ opacity: 1, y: 0, x: 0 }}
          exit={{ opacity: 0, y: 8, scale: 0.96 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="fixed bottom-8 left-6 z-[200]"
          style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
        >
          <div
            className="flex items-center gap-3 px-4 py-3 rounded-xs"
            style={{
              background: "rgba(10,10,14,0.95)",
              border: "1px solid rgba(245,158,11,0.25)",
              boxShadow: "0 0 40px rgba(245,158,11,0.15), 0 20px 40px rgba(0,0,0,0.5)",
            }}
          >
            {/* Top amber hairline */}
            <div
              className="absolute top-0 left-0 right-0 h-[1.5px] rounded-t-xs"
              style={{ background: "linear-gradient(90deg, #f59e0b, transparent)" }}
            />
 
            <div
              className="w-8 h-8 rounded-xs flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(245,158,11,0.15)", border: "1px solid rgba(245,158,11,0.3)" }}
            >
              <Zap className="w-4 h-4 text-amber-400" />
            </div>
 
            <div>
              <p className="text-white font-black text-sm leading-none" style={{ letterSpacing: "-0.02em" }}>
                +{amount} tokens
              </p>
              <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.35)" }}>
                {reason}
              </p>
            </div>
 
            {/* Dismiss progress bar */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] rounded-b-xs"
              style={{ background: "#f59e0b" }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 3.2, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
 
 




// // =============================================================================
// // TOKEN NOTIFICATION
// // components/game/TokenNotification.tsx
// // =============================================================================

// "use client";

// import React, { useEffect } from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { Coins, Sparkles } from "lucide-react";

// interface TokenNotificationProps {
//   amount: number;
//   reason: string;
// }

// export function TokenNotification({ amount, reason }: TokenNotificationProps) {
//   const [visible, setVisible] = React.useState(true);

//   useEffect(() => {
//     const timer = setTimeout(() => setVisible(false), 3000);
//     return () => clearTimeout(timer);
//   }, []);

//   if (!visible) return null;

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0, y: 50, x: -50 }}
//         animate={{ opacity: 1, y: 0, x: 0 }}
//         exit={{ opacity: 0, y: 50, x: -50 }}
//         className="fixed bottom-24 left-6 z-[150]"
//       >
//         <div className="relative">
//           {/* Glass Effect */}
//           <div className="absolute inset-0 bg-gradient-to-r from-green-500/20 to-emerald-500/20 rounded-lg blur" />
//           <div className="relative flex items-center gap-3 bg-gradient-to-r from-green-500 to-emerald-500 rounded-lg px-4 py-3 shadow-lg">
//             <div className="w-8 h-8 rounded-full bg-white/20 flex items-center justify-center">
//               <Coins className="w-4 h-4 text-white" />
//             </div>
//             <div>
//               <p className="text-white font-bold text-sm">+{amount} tokens</p>
//               <p className="text-white/70 text-xs">{reason}</p>
//             </div>
//             <Sparkles className="w-4 h-4 text-yellow-300 animate-pulse" />
//           </div>
//         </div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }
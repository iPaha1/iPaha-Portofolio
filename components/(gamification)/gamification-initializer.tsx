// =============================================================================
// GAMIFICATION INITIALIZER — Premium Redesign
// components/(gamification)/gamification-initializer.tsx
// =============================================================================

"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@clerk/nextjs";
import { motion, AnimatePresence } from "framer-motion";
import { Zap, Gift, X } from "lucide-react";

export function GamificationInitializer() {
  const { isSignedIn, isLoaded } = useUser();
  const [initialized, setInitialized] = useState(false);
  const [toast, setToast] = useState<{ amount: number; visible: boolean } | null>(null);

  useEffect(() => {
    if (!isLoaded || !isSignedIn || initialized) return;

    const run = async () => {
      try {
        const res = await fetch("/api/game/init");
        const data = await res.json();

        if (data.success && data.initialized && data.wallet?.balance >= 100) {
          setToast({ amount: data.wallet.balance, visible: true });
          setTimeout(() => setToast(t => t ? { ...t, visible: false } : null), 5000);
        }
      } catch {
        // silent fail
      } finally {
        setInitialized(true);
      }
    };

    run();
  }, [isLoaded, isSignedIn, initialized]);

  return (
    <AnimatePresence>
      {toast?.visible && (
        <motion.div
          initial={{ opacity: 0, y: 12 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 8, scale: 0.97 }}
          transition={{ type: "spring", damping: 22, stiffness: 300 }}
          className="fixed bottom-8 left-6 z-[200]"
          style={{ fontFamily: "'Sora', system-ui, sans-serif" }}
        >
          <div
            className="relative flex items-start gap-3 px-4 py-3.5 rounded-xs max-w-xs"
            style={{
              background: "rgba(10,10,14,0.97)",
              border: "1px solid rgba(99,102,241,0.3)",
              boxShadow: "0 0 40px rgba(99,102,241,0.15), 0 24px 48px rgba(0,0,0,0.6)",
            }}
          >
            <div className="absolute top-0 left-0 right-0 h-[2px] rounded-t-xs"
              style={{ background: "linear-gradient(90deg, #6366f1, #8b5cf6, transparent)" }} />

            <div
              className="w-9 h-9 rounded-xs flex items-center justify-center flex-shrink-0"
              style={{ background: "rgba(99,102,241,0.15)", border: "1px solid rgba(99,102,241,0.25)" }}
            >
              <Zap className="w-4 h-4 text-indigo-400" />
            </div>

            <div className="flex-1">
              <p className="text-white font-black text-sm leading-tight" style={{ letterSpacing: "-0.02em" }}>
                Welcome — {toast.amount} tokens
              </p>
              <p className="text-[11px] mt-1" style={{ color: "rgba(255,255,255,0.35)" }}>
                <Gift className="w-3 h-3 inline mr-1 text-indigo-400" />
                Free starter tokens to begin. Play games to earn more.
              </p>
            </div>

            <button
              onClick={() => setToast(t => t ? { ...t, visible: false } : null)}
              className="text-white/25 hover:text-white/60 transition-colors flex-shrink-0"
            >
              <X className="w-3.5 h-3.5" />
            </button>

            {/* Auto-dismiss progress */}
            <motion.div
              className="absolute bottom-0 left-0 h-[2px] rounded-b-xs"
              style={{ background: "#6366f1" }}
              initial={{ width: "100%" }}
              animate={{ width: "0%" }}
              transition={{ duration: 5, ease: "linear" }}
            />
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}






// // =============================================================================
// // GAMIFICATION INITIALIZER - Auto-initialize on user login
// // components/game/GamificationInitializer.tsx
// // =============================================================================

// "use client";

// import React, { useEffect, useState } from "react";
// import { useUser } from "@clerk/nextjs";
// import { motion, AnimatePresence } from "framer-motion";
// import { Sparkles, Gift, Coins, Check, X } from "lucide-react";

// export function GamificationInitializer() {
//   const { user, isSignedIn, isLoaded } = useUser();
//   const [initialized, setInitialized] = useState(false);
//   const [showToast, setShowToast] = useState(false);
//   const [toastMessage, setToastMessage] = useState("");
//   const [tokenAmount, setTokenAmount] = useState(0);

//   useEffect(() => {
//     if (!isLoaded || !isSignedIn || initialized) return;

//     const initializeGamification = async () => {
//       try {
//         const response = await fetch("/api/game/init", {
//           method: "GET",
//           headers: { "Content-Type": "application/json" },
//         });
        
//         const data = await response.json();
        
//         if (data.success && data.initialized) {
//           setTokenAmount(data.wallet?.balance || 100);
//           setToastMessage(data.message || "🎉 Welcome to the Gamification System!");
//           setShowToast(true);
          
//           // Hide toast after 5 seconds
//           setTimeout(() => setShowToast(false), 5000);
//         }
        
//         setInitialized(true);
//       } catch (error) {
//         console.error("Failed to initialize gamification:", error);
//         setInitialized(true);
//       }
//     };
    
//     initializeGamification();
//   }, [isLoaded, isSignedIn, initialized]);

//   return (
//     <AnimatePresence>
//       {showToast && (
//         <motion.div
//           initial={{ opacity: 0, x: -50, y: 0 }}
//           animate={{ opacity: 1, x: 0, y: 0 }}
//           exit={{ opacity: 0, x: -50, y: 0 }}
//           className="fixed bottom-24 left-6 z-[500]"
//         >
//           <div className="relative">
//             {/* Glass Effect */}
//             <div className="absolute inset-0 bg-gradient-to-r from-purple-500/20 to-pink-500/20 rounded-lg blur" />
//             <div className="relative bg-gradient-to-r from-purple-600 to-pink-600 rounded-lg shadow-2xl overflow-hidden">
//               <div className="absolute inset-0 bg-black/20" />
//               <div className="relative px-5 py-4 flex items-center gap-4">
//                 <div className="w-10 h-10 rounded-full bg-white/20 flex items-center justify-center">
//                   {tokenAmount > 0 ? (
//                     <Coins className="w-5 h-5 text-yellow-300" />
//                   ) : (
//                     <Sparkles className="w-5 h-5 text-white" />
//                   )}
//                 </div>
//                 <div>
//                   <p className="text-white font-bold text-sm">{toastMessage}</p>
//                   {tokenAmount > 0 && (
//                     <p className="text-white/80 text-xs flex items-center gap-1 mt-1">
//                       <Gift className="w-3 h-3" />
//                       You received <span className="font-bold">{tokenAmount}</span> free tokens!
//                     </p>
//                   )}
//                 </div>
//                 <button
//                   onClick={() => setShowToast(false)}
//                   className="text-white/60 hover:text-white transition-colors ml-2"
//                 >
//                   <X className="w-4 h-4" />
//                 </button>
//               </div>
//             </div>
//           </div>
//         </motion.div>
//       )}
//     </AnimatePresence>
//   );
// }
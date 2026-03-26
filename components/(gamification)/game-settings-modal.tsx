
// =============================================================================
// GAME SETTINGS MODAL — Premium Redesign
// components/(gamification)/game-settings-modal.tsx
// =============================================================================
 
"use client";
 
import { motion, AnimatePresence } from "framer-motion";
import { X, Volume2, VolumeX, Bell, BellOff, Gamepad2, Info } from "lucide-react";
 
interface GameSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: {
    gameEnabled: boolean;
    soundEnabled: boolean;
    notificationsEnabled: boolean;
    minGameDelay?: number;
  };
  onUpdate: (updates: Partial<GameSettingsModalProps["settings"]>) => void;
}
 
function Toggle({
  value,
  onChange,
  accent = "#f59e0b",
}: {
  value: boolean;
  onChange: () => void;
  accent?: string;
}) {
  return (
    <button
      onClick={onChange}
      className="relative w-10 h-5 rounded-full transition-all flex-shrink-0"
      style={{
        background: value ? accent : "rgba(255,255,255,0.1)",
        boxShadow: value ? `0 0 12px ${accent}50` : "none",
      }}
    >
      <motion.div
        animate={{ x: value ? 20 : 2 }}
        transition={{ type: "spring", damping: 20, stiffness: 300 }}
        className="absolute top-0.5 w-4 h-4 rounded-full bg-white"
        style={{ boxShadow: "0 1px 4px rgba(0,0,0,0.3)" }}
      />
    </button>
  );
}
 
function SettingRow({
  icon: Icon,
  label,
  description,
  value,
  onChange,
  accent,
  iconColor,
}: {
  icon: React.ElementType;
  label: string;
  description: string;
  value: boolean;
  onChange: () => void;
  accent?: string;
  iconColor: string;
}) {
  return (
    <div
      className="flex items-start gap-3 p-3.5 rounded-xs"
      style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
    >
      <div
        className="w-8 h-8 rounded-xs flex items-center justify-center flex-shrink-0 mt-0.5"
        style={{ background: `${iconColor}15`, border: `1px solid ${iconColor}25` }}
      >
        <Icon className="w-3.5 h-3.5" style={{ color: iconColor }} />
      </div>
      <div className="flex-1 min-w-0">
        <p className="text-white text-sm font-bold">{label}</p>
        <p className="text-[11px] mt-0.5" style={{ color: "rgba(255,255,255,0.3)" }}>
          {description}
        </p>
      </div>
      <Toggle value={value} onChange={onChange} accent={accent} />
    </div>
  );
}
 
const DELAY_OPTIONS = [
  { value: "", label: "Random (2–5 min)" },
  { value: "1", label: "1 min minimum" },
  { value: "3", label: "3 min minimum" },
  { value: "5", label: "5 min minimum" },
  { value: "10", label: "10 min minimum" },
];
 
export function GameSettingsModal({ isOpen, onClose, settings, onUpdate }: GameSettingsModalProps) {
  return (
    <AnimatePresence>
      {isOpen && (
        <>
          {/* Backdrop */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 z-[300]"
            style={{ background: "rgba(0,0,0,0.6)", backdropFilter: "blur(4px)" }}
          />
 
          {/* Modal */}
          <motion.div
            initial={{ opacity: 0, scale: 0.94, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.94, y: 20 }}
            transition={{ type: "spring", damping: 26, stiffness: 320 }}
            onClick={e => e.stopPropagation()}
            className="fixed z-[301] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-full max-w-sm rounded-xs overflow-hidden"
            style={{
              background: "rgba(10,10,14,0.98)",
              border: "1px solid rgba(255,255,255,0.08)",
              boxShadow: "0 40px 80px rgba(0,0,0,0.8)",
              fontFamily: "'Sora', system-ui, sans-serif",
            }}
          >
            {/* Amber hairline */}
            <div className="h-[2px] bg-gradient-to-r from-amber-500 via-amber-400/60 to-transparent" />
 
            {/* Header */}
            <div className="px-5 pt-5 pb-4 flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div
                  className="w-9 h-9 rounded-xs flex items-center justify-center"
                  style={{ background: "rgba(245,158,11,0.12)", border: "1px solid rgba(245,158,11,0.2)" }}
                >
                  <Gamepad2 className="w-4 h-4 text-amber-400" />
                </div>
                <div>
                  <h2 className="text-white font-black text-base" style={{ letterSpacing: "-0.02em" }}>
                    Game Settings
                  </h2>
                  <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.3)" }}>
                    Customise your experience
                  </p>
                </div>
              </div>
              <button
                onClick={onClose}
                className="w-7 h-7 rounded-xs flex items-center justify-center transition-colors"
                style={{ color: "rgba(255,255,255,0.3)", background: "rgba(255,255,255,0.05)" }}
                onMouseEnter={e => (e.currentTarget.style.color = "white")}
                onMouseLeave={e => (e.currentTarget.style.color = "rgba(255,255,255,0.3)")}
              >
                <X className="w-3.5 h-3.5" />
              </button>
            </div>
 
            <div className="px-5 pb-5 space-y-3">
              <SettingRow
                icon={Gamepad2}
                label="Enable Games"
                description={settings.gameEnabled ? "Random games will appear while you browse." : "Games are paused. Re-enable anytime."}
                value={settings.gameEnabled}
                onChange={() => onUpdate({ gameEnabled: !settings.gameEnabled })}
                accent="#f59e0b"
                iconColor="#f59e0b"
              />
 
              <SettingRow
                icon={settings.soundEnabled ? Volume2 : VolumeX}
                label="Sound Effects"
                description="Audio feedback when collecting tokens and completing games."
                value={settings.soundEnabled}
                onChange={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
                accent="#10b981"
                iconColor="#10b981"
              />
 
              <SettingRow
                icon={settings.notificationsEnabled ? Bell : BellOff}
                label="Flash Alerts"
                description="Get toast notifications when rare flash events start."
                value={settings.notificationsEnabled}
                onChange={() => onUpdate({ notificationsEnabled: !settings.notificationsEnabled })}
                accent="#6366f1"
                iconColor="#6366f1"
              />
 
              {/* Frequency select */}
              <div
                className="p-3.5 rounded-xs space-y-2"
                style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.05)" }}
              >
                <p className="text-white text-sm font-bold">Game Frequency</p>
                <select
                  value={settings.minGameDelay?.toString() ?? ""}
                  onChange={e => onUpdate({ minGameDelay: e.target.value ? parseInt(e.target.value) : undefined })}
                  className="w-full px-3 py-2 rounded-xs text-sm outline-none"
                  style={{
                    background: "rgba(255,255,255,0.06)",
                    border: "1px solid rgba(255,255,255,0.1)",
                    color: "white",
                  }}
                >
                  {DELAY_OPTIONS.map(o => (
                    <option key={o.label} value={o.value} className="bg-gray-900">
                      {o.label}
                    </option>
                  ))}
                </select>
              </div>
 
              {/* Info banner */}
              <div
                className="flex items-start gap-3 p-3.5 rounded-xs"
                style={{ background: "rgba(99,102,241,0.08)", border: "1px solid rgba(99,102,241,0.2)" }}
              >
                <Info className="w-4 h-4 text-indigo-400 flex-shrink-0 mt-0.5" />
                <p className="text-[11px]" style={{ color: "rgba(255,255,255,0.45)" }}>
                  Tokens unlock premium tools, exclusive features, and more. They never expire.
                </p>
              </div>
 
              {/* Done button */}
              <button
                onClick={onClose}
                className="w-full py-3 rounded-xs text-sm font-black text-black transition-all"
                style={{
                  background: "#f59e0b",
                  boxShadow: "0 0 24px rgba(245,158,11,0.3)",
                }}
                onMouseEnter={e => (e.currentTarget.style.background = "#fbbf24")}
                onMouseLeave={e => (e.currentTarget.style.background = "#f59e0b")}
              >
                Save & Close
              </button>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}
 





// // =============================================================================
// // GAME SETTINGS MODAL
// // components/game/GameSettingsModal.tsx
// // =============================================================================

// "use client";

// import React from "react";
// import { motion, AnimatePresence } from "framer-motion";
// import { X, Volume2, VolumeX, Bell, BellOff, Gamepad2, AlertCircle } from "lucide-react";

// interface GameSettingsModalProps {
//   isOpen: boolean;
//   onClose: () => void;
//   settings: {
//     gameEnabled: boolean;
//     soundEnabled: boolean;
//     notificationsEnabled: boolean;
//     minGameDelay?: number;
//   };
//   // onUpdate: (settings: Partial<typeof settings>) => void;
//     onUpdate: (updates: Partial<GameSettingsModalProps["settings"]>) => void;

// }

// export function GameSettingsModal({ isOpen, onClose, settings, onUpdate }: GameSettingsModalProps) {
//   if (!isOpen) return null;

//   const delays = [
//     { value: undefined, label: "Default (random 2-5 min)" },
//     { value: 1, label: "At least 1 minute between games" },
//     { value: 3, label: "At least 3 minutes between games" },
//     { value: 5, label: "At least 5 minutes between games" },
//     { value: 10, label: "At least 10 minutes between games" },
//   ];

//   return (
//     <AnimatePresence>
//       <motion.div
//         initial={{ opacity: 0 }}
//         animate={{ opacity: 1 }}
//         exit={{ opacity: 0 }}
//         className="fixed inset-0 bg-black/50 backdrop-blur-sm z-[200] flex items-center justify-center p-4"
//         onClick={onClose}
//       >
//         <motion.div
//           initial={{ scale: 0.9, opacity: 0 }}
//           animate={{ scale: 1, opacity: 1 }}
//           exit={{ scale: 0.9, opacity: 0 }}
//           className="relative bg-gradient-to-br from-gray-900 to-gray-800 rounded-2xl max-w-md w-full p-6 shadow-2xl border border-white/10"
//           onClick={e => e.stopPropagation()}
//         >
//           {/* Header */}
//           <div className="flex items-center justify-between mb-6">
//             <div className="flex items-center gap-3">
//               <div className="w-10 h-10 rounded-full bg-gradient-to-br from-purple-500 to-pink-500 flex items-center justify-center">
//                 <Gamepad2 className="w-5 h-5 text-white" />
//               </div>
//               <h2 className="text-xl font-bold text-white">Game Settings</h2>
//             </div>
//             <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
//               <X className="w-5 h-5" />
//             </button>
//           </div>

//           {/* Game Toggle */}
//           <div className="mb-6 p-4 bg-white/5 rounded-lg">
//             <div className="flex items-center justify-between mb-2">
//               <div className="flex items-center gap-2">
//                 <Gamepad2 className="w-4 h-4 text-purple-400" />
//                 <span className="text-white font-medium">Enable Games</span>
//               </div>
//               <button
//                 onClick={() => onUpdate({ gameEnabled: !settings.gameEnabled })}
//                 className={`relative w-12 h-6 rounded-full transition-colors ${
//                   settings.gameEnabled ? "bg-purple-500" : "bg-gray-600"
//                 }`}
//               >
//                 <div
//                   className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
//                     settings.gameEnabled ? "left-7" : "left-1"
//                   }`}
//                 />
//               </button>
//             </div>
//             <p className="text-xs text-gray-400">
//               {settings.gameEnabled 
//                 ? "Games will appear randomly while you use the site" 
//                 : "No games will appear. You can re-enable anytime."}
//             </p>
//           </div>

//           {/* Sound Toggle */}
//           <div className="mb-6 p-4 bg-white/5 rounded-lg">
//             <div className="flex items-center justify-between mb-2">
//               <div className="flex items-center gap-2">
//                 {settings.soundEnabled ? (
//                   <Volume2 className="w-4 h-4 text-emerald-400" />
//                 ) : (
//                   <VolumeX className="w-4 h-4 text-gray-400" />
//                 )}
//                 <span className="text-white font-medium">Sound Effects</span>
//               </div>
//               <button
//                 onClick={() => onUpdate({ soundEnabled: !settings.soundEnabled })}
//                 className={`relative w-12 h-6 rounded-full transition-colors ${
//                   settings.soundEnabled ? "bg-emerald-500" : "bg-gray-600"
//                 }`}
//               >
//                 <div
//                   className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
//                     settings.soundEnabled ? "left-7" : "left-1"
//                   }`}
//                 />
//               </button>
//             </div>
//             <p className="text-xs text-gray-400">Play sounds when you collect tokens or complete games</p>
//           </div>

//           {/* Notifications Toggle */}
//           <div className="mb-6 p-4 bg-white/5 rounded-lg">
//             <div className="flex items-center justify-between mb-2">
//               <div className="flex items-center gap-2">
//                 {settings.notificationsEnabled ? (
//                   <Bell className="w-4 h-4 text-blue-400" />
//                 ) : (
//                   <BellOff className="w-4 h-4 text-gray-400" />
//                 )}
//                 <span className="text-white font-medium">Notifications</span>
//               </div>
//               <button
//                 onClick={() => onUpdate({ notificationsEnabled: !settings.notificationsEnabled })}
//                 className={`relative w-12 h-6 rounded-full transition-colors ${
//                   settings.notificationsEnabled ? "bg-blue-500" : "bg-gray-600"
//                 }`}
//               >
//                 <div
//                   className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
//                     settings.notificationsEnabled ? "left-7" : "left-1"
//                   }`}
//                 />
//               </button>
//             </div>
//             <p className="text-xs text-gray-400">Get notified when flash events appear</p>
//           </div>

//           {/* Game Frequency */}
//           <div className="mb-6 p-4 bg-white/5 rounded-lg">
//             <label className="block text-white font-medium mb-2">Game Frequency</label>
//             <select
//               value={settings.minGameDelay?.toString() || ""}
//               onChange={(e) => {
//                 const value = e.target.value;
//                 onUpdate({ minGameDelay: value ? parseInt(value) : undefined });
//               }}
//               className="w-full bg-white/10 border border-white/20 rounded-lg px-3 py-2 text-white text-sm focus:outline-none focus:border-purple-500"
//             >
//               {delays.map(d => (
//                 <option key={d.label} value={d.value || ""} className="bg-gray-800">
//                   {d.label}
//                 </option>
//               ))}
//             </select>
//           </div>

//           {/* Info Box */}
//           <div className="p-4 bg-purple-500/10 border border-purple-500/30 rounded-lg">
//             <div className="flex items-start gap-2">
//               <AlertCircle className="w-4 h-4 text-purple-400 flex-shrink-0 mt-0.5" />
//               <div>
//                 <p className="text-xs text-purple-300 font-medium">Why play?</p>
//                 <p className="text-xs text-purple-200/70 mt-1">
//                   Earn tokens that unlock exclusive features, premium tools, and special content. 
//                   The more you engage, the more you earn. Tokens never expire.
//                 </p>
//               </div>
//             </div>
//           </div>

//           {/* Close Button */}
//           <button
//             onClick={onClose}
//             className="mt-6 w-full py-3 bg-gradient-to-r from-purple-500 to-pink-500 text-white font-semibold rounded-lg hover:opacity-90 transition-opacity"
//           >
//             Done
//           </button>
//         </motion.div>
//       </motion.div>
//     </AnimatePresence>
//   );
// }
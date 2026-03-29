// =============================================================================
// GAMES TERMS POPUP
// components/games/games-terms-popup.tsx
//
// "use client" — client component only.
//
// Changes from previous version:
//   • Accepts `initialAccepted` prop from the server layout (DB-backed)
//   • On ACCEPT  → calls POST /api/game/terms to set isGameTermsAccepted = true
//   • On DECLINE → does NOT close the popup. Shows an inline warning instead:
//                  "You must accept the terms to play any games."
//   • Accepts `children` so it works as a provider wrapper in layout.tsx
//   • Also exposes useGamesTerms().open() for manual triggering
// =============================================================================
"use client";

import React, {
  useState,
  useEffect,
  useCallback,
  createContext,
  useContext,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { useUser } from "@clerk/nextjs";
import {
  Heart,
  Shield,
  AlertTriangle,
  Coins,
  ExternalLink,
  Check,
  ChevronRight,
  Sparkles,
  Scale,
  Ban,
  X,
  LogIn,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface GamesTermsCtxType {
  open:     () => void;
  accepted: boolean;
}

const GamesTermsCtx = createContext<GamesTermsCtxType>({
  open:     () => {},
  accepted: false,
});

export function useGamesTerms(): GamesTermsCtxType {
  return useContext(GamesTermsCtx);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Used as a fast client-side cache to avoid showing the popup on navigation
// between /games pages for users who already accepted in this session.
const SESSION_KEY = "games_terms_session_ok";

// ─────────────────────────────────────────────────────────────────────────────
// KEY POINTS
// ─────────────────────────────────────────────────────────────────────────────

const KEY_POINTS = [
  {
    icon:  Heart,
    color: "#f59e0b",
    title: "Pure Entertainment",
    body:  "This platform was created with a pure heart — to entertain, challenge minds, and bring joy to people across the world. Every game was built as an expression of creativity. There is no intent to cause financial harm or distress.",
  },
  {
    icon:  Coins,
    color: "#a855f7",
    title: "Tokens Are Virtual",
    body:  "Tokens have no guaranteed real-world monetary value. Any cash-out feature is a goodwill reward — not a financial obligation. Token balances may be reset or adjusted at any time.",
  },
  {
    icon:  AlertTriangle,
    color: "#ef4444",
    title: "No Liability",
    body:  "Isaac Paha and iPaha Ltd accept no responsibility for token loss, game unavailability, technical errors, or any indirect consequences arising from use of these games.",
  },
  {
    icon:  Shield,
    color: "#06b6d4",
    title: "Fair Play",
    body:  "Cheating, exploiting bugs, or using bots will result in immediate account suspension. Anti-cheat systems are active at all times across all games.",
  },
  {
    icon:  Scale,
    color: "#10b981",
    title: "Jurisdiction & Age",
    body:  "Governed by the laws of England & Wales. By playing, you confirm you are of legal age in your jurisdiction to participate in skill-based entertainment.",
  },
] as const;

// ─────────────────────────────────────────────────────────────────────────────
// INNER MODAL
// ─────────────────────────────────────────────────────────────────────────────

interface ModalProps {
  onAccept:  () => Promise<void>;
  onDecline: () => void;
}

function TermsModal({ onAccept, onDecline }: ModalProps) {
  const [checked,      setChecked]      = useState(false);
  const [activeIdx,    setActiveIdx]    = useState<number | null>(null);
  const [accepting,    setAccepting]    = useState(false);
  const [declined,     setDeclined]     = useState(false);   // shows inline warning
  const [acceptError,  setAcceptError]  = useState<string | null>(null);
  const { isSignedIn } = useUser();

  // const handleAccept = async () => {
  //   if (!checked || accepting) return;
  //   setAccepting(true);
  //   setAcceptError(null);
  //   try {
  //     await onAccept();
  //   } catch {
  //     setAcceptError("Something went wrong. Please try again.");
  //     setAccepting(false);
  //   }
  // };

  const handleAccept = async () => {
  if (!checked || accepting) return;
  
  // Check if user is signed in via Clerk
  
  setAccepting(true);
  setAcceptError(null);
  
  try {
    await onAccept();
  } catch (error: any) {
    // Build error message with sign-in CTA if not signed in
    let errorMessage = "Something went wrong. Please try again.";
    
    if (!isSignedIn) {
      errorMessage = "You need to be signed in to accept the game terms.";
    } else if (error?.message?.includes("authentication") || error?.message?.includes("unauthorized")) {
      errorMessage = "Your session may have expired. Please sign in again.";
    }
    
    setAcceptError(errorMessage);
    setAccepting(false);
  }
};


  const handleDecline = () => {
    // Never close — reveal the inline warning instead
    setDeclined(true);
    onDecline();   // parent may handle side-effects (e.g. analytics) but popup stays open
  };

  const clearDeclined = () => setDeclined(false);

  return (
    <>
      {/* ── Backdrop — clicking does nothing, must choose ── */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        transition={{ duration: 0.22 }}
        className="fixed inset-0 z-[800]"
        style={{ background: "rgba(0,0,0,0.84)", backdropFilter: "blur(4px)" }}
      />

      {/* ── Modal ── */}
      <motion.div
        initial={{ opacity: 0, scale: 0.93, y: 20 }}
        animate={{ opacity: 1,  scale: 1,   y: 0  }}
        exit={{
          opacity: 0, scale: 0.95, y: 14,
          transition: { duration: 0.18, ease: "easeIn" },
        }}
        transition={{ type: "spring", damping: 22, stiffness: 260 }}
        className="fixed inset-0 z-[801] flex items-center justify-center p-4"
        style={{ pointerEvents: "none" }}
      >
        <div
          style={{
            pointerEvents:  "auto",
            width:          "100%",
            maxWidth:       492,
            maxHeight:      "92dvh",
            display:        "flex",
            flexDirection:  "column",
            borderRadius:   4,
            background:     "linear-gradient(155deg,#09090f 0%,#0e0618 50%,#060d18 100%)",
            border:         "1px solid rgba(245,158,11,0.22)",
            boxShadow:      "0 0 0 1px rgba(245,158,11,0.07),0 24px 80px rgba(0,0,0,0.9),0 0 70px rgba(245,158,11,0.05)",
            fontFamily:     "'Sora',system-ui,sans-serif",
            overflow:       "hidden",
          }}
        >
          {/* ── Rainbow hairline ── */}
          <div style={{
            height:     2.5,
            flexShrink: 0,
            background: "linear-gradient(90deg,#f59e0b,#a855f7 50%,#06b6d4)",
          }} />

          {/* ── Header ── */}
          <div style={{
            padding:      "18px 22px 14px",
            borderBottom: "1px solid rgba(255,255,255,0.06)",
            flexShrink:   0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 4, flexShrink: 0,
                background:  "radial-gradient(circle at 35% 35%,rgba(245,158,11,0.22),rgba(245,158,11,0.06))",
                border:      "1px solid rgba(245,158,11,0.28)",
                display:     "flex", alignItems: "center", justifyContent: "center",
                boxShadow:   "0 0 16px rgba(245,158,11,0.18)",
              }}>
                <Heart style={{ width: 19, height: 19, color: "#f59e0b" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <h2 style={{
                    fontSize: "1rem", fontWeight: 900, color: "#fff",
                    letterSpacing: "-0.03em", margin: 0,
                  }}>
                    Before You Play
                  </h2>
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: "0.18em",
                    textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                    background: "rgba(245,158,11,0.12)",
                    color:      "#f59e0b",
                    border:     "1px solid rgba(245,158,11,0.24)",
                  }}>
                    Required
                  </span>
                </div>
                <p style={{
                  fontSize: 11, color: "rgba(255,255,255,0.38)",
                  margin: 0, lineHeight: 1.4,
                }}>
                  Read and accept the terms to unlock all games.
                </p>
              </div>
            </div>
          </div>

          {/* ── Heart message ── */}
          <div style={{
            margin:     "14px 22px 0",
            padding:    "11px 13px",
            borderRadius: 4,
            background: "rgba(245,158,11,0.055)",
            border:     "1px solid rgba(245,158,11,0.14)",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <Sparkles style={{ width: 13, height: 13, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.55)", margin: 0, lineHeight: 1.65 }}>
                This platform was created with a{" "}
                <strong style={{ color: "#f59e0b" }}>pure heart</strong> — to entertain,
                challenge minds, and bring joy to people across the world. It is entirely for{" "}
                <strong style={{ color: "#fff" }}>fun and entertainment</strong>. There is no
                intent to cause financial harm or distress.
              </p>
            </div>
          </div>

          {/* ── Scrollable key points ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "13px 22px 0", minHeight: 0 }}>
            <p style={{
              fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "rgba(255,255,255,0.2)",
              margin: "0 0 9px 0",
            }}>
              Key Points — click to expand
            </p>

            <div style={{ display: "flex", flexDirection: "column", gap: 5 }}>
              {KEY_POINTS.map((pt, i) => {
                const Icon   = pt.icon;
                const isOpen = activeIdx === i;
                return (
                  <div
                    key={i}
                    onClick={() => setActiveIdx(isOpen ? null : i)}
                    style={{
                      borderRadius: 4,
                      background:   isOpen ? `${pt.color}0d` : "rgba(255,255,255,0.024)",
                      border:       `1px solid ${isOpen ? `${pt.color}2e` : "rgba(255,255,255,0.07)"}`,
                      cursor:       "pointer",
                      overflow:     "hidden",
                      transition:   "background 0.14s,border-color 0.14s",
                    }}
                  >
                    <div style={{
                      display: "flex", alignItems: "center", gap: 10, padding: "9px 11px",
                    }}>
                      <div style={{
                        width: 27, height: 27, borderRadius: 4, flexShrink: 0,
                        display: "flex", alignItems: "center", justifyContent: "center",
                        background: `${pt.color}18`, border: `1px solid ${pt.color}26`,
                      }}>
                        <Icon style={{ width: 12, height: 12, color: pt.color }} />
                      </div>
                      <span style={{
                        flex: 1, fontSize: 12, fontWeight: 800,
                        color: "#fff", letterSpacing: "-0.01em",
                      }}>
                        {pt.title}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.16 }}>
                        <ChevronRight style={{ width: 12, height: 12, color: "rgba(255,255,255,0.28)" }} />
                      </motion.div>
                    </div>
                    <AnimatePresence>
                      {isOpen && (
                        <motion.div
                          initial={{ height: 0, opacity: 0 }}
                          animate={{ height: "auto", opacity: 1 }}
                          exit={{ height: 0, opacity: 0 }}
                          transition={{ duration: 0.16 }}
                          style={{ overflow: "hidden" }}>
                          <p style={{
                            padding: "0 11px 11px 48px", fontSize: 11,
                            lineHeight: 1.65, color: "rgba(255,255,255,0.48)", margin: 0,
                          }}>
                            {pt.body}
                          </p>
                        </motion.div>
                      )}
                    </AnimatePresence>
                  </div>
                );
              })}
            </div>

            {/* Full terms link */}
            <div style={{
              margin: "13px 0 15px", padding: "9px 11px", borderRadius: 4,
              background: "rgba(99,102,241,0.06)", border: "1px solid rgba(99,102,241,0.18)",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}>
              <p style={{ fontSize: 11, color: "rgba(255,255,255,0.42)", margin: 0, lineHeight: 1.5 }}>
                These are highlights only. Read the full legally binding terms before playing.
              </p>
              <Link
                href="/games-terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                  fontSize: 10, fontWeight: 800, color: "#6366f1", textDecoration: "none",
                  padding: "5px 9px", borderRadius: 4,
                  background: "rgba(99,102,241,0.12)", border: "1px solid rgba(99,102,241,0.26)",
                  whiteSpace: "nowrap",
                }}>
                Full Terms <ExternalLink style={{ width: 9, height: 9 }} />
              </Link>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: "13px 22px 18px",
            borderTop: "1px solid rgba(255,255,255,0.06)",
            flexShrink: 0,
          }}>
            {/* Checkbox */}
            <div
              style={{
                display: "flex", alignItems: "flex-start", gap: 9,
                marginBottom: 13, cursor: "pointer",
              }}
              onClick={() => { setChecked(c => !c); if (declined) clearDeclined(); }}
            >
              <div style={{
                width: 17, height: 17, borderRadius: 4, flexShrink: 0, marginTop: 1,
                border:     `2px solid ${checked ? "#f59e0b" : "rgba(255,255,255,0.22)"}`,
                background: checked ? "rgba(245,158,11,0.18)" : "transparent",
                display:    "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.14s",
                boxShadow:  checked ? "0 0 9px rgba(245,158,11,0.3)" : "none",
              }}>
                {checked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 360 }}>
                    <Check style={{ width: 9, height: 9, color: "#f59e0b" }} />
                  </motion.div>
                )}
              </div>
              <p style={{
                fontSize: 11, color: "rgba(255,255,255,0.42)",
                lineHeight: 1.55, userSelect: "none", margin: 0,
              }}>
                I understand this platform is for entertainment only and I accept the{" "}
                <Link
                  href="/games-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ color: "#f59e0b", textDecoration: "underline", textUnderlineOffset: 2 }}>
                  full terms
                </Link>.
              </p>
            </div>

            {/* ── Decline warning (replaces dismiss) ── */}
            <AnimatePresence>
              {declined && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: "hidden" }}>
                  <div style={{
                    borderRadius: 4,
                    background:   "rgba(239,68,68,0.08)",
                    border:       "1px solid rgba(239,68,68,0.28)",
                    padding:      "10px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <Ban style={{ width: 14, height: 14, color: "#f87171", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 12, fontWeight: 800, color: "#fca5a5",
                          margin: "0 0 3px 0", letterSpacing: "-0.01em",
                        }}>
                          You must accept the terms to play
                        </p>
                        <p style={{
                          fontSize: 11, color: "rgba(255,255,255,0.42)",
                          margin: 0, lineHeight: 1.55,
                        }}>
                          Access to all games — including solo games, multiplayer, and Token Rush —
                          requires acceptance of the game terms. These terms exist to protect both
                          you and us. Please tick the box above and click{" "}
                          <strong style={{ color: "#fff" }}>I Understand — Let&apos;s Play</strong> to continue.
                        </p>
                        <button
                          onClick={clearDeclined}
                          style={{
                            display:    "flex",
                            alignItems: "center",
                            gap:        4,
                            marginTop:  8,
                            fontSize:   10,
                            fontWeight: 700,
                            color:      "rgba(255,255,255,0.35)",
                            background: "none",
                            border:     "none",
                            cursor:     "pointer",
                            padding:    0,
                            fontFamily: "'Sora',system-ui,sans-serif",
                          }}>
                          <X style={{ width: 10, height: 10 }} /> Dismiss this message
                        </button>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>

            {/* Accept error */}
            <AnimatePresence>
  {acceptError && (
    <motion.div
      initial={{ opacity: 0, height: 0, marginBottom: 0 }}
      animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
      exit={{ opacity: 0, height: 0, marginBottom: 0 }}
      transition={{ duration: 0.22 }}
      style={{ overflow: "hidden" }}
    >
      <div style={{
        borderRadius: 4,
        background: "rgba(239,68,68,0.08)",
        border: "1px solid rgba(239,68,68,0.28)",
        padding: "10px 12px",
      }}>
        <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
          <AlertTriangle style={{ width: 14, height: 14, color: "#f87171", flexShrink: 0, marginTop: 1 }} />
          <div style={{ flex: 1 }}>
            <p style={{
              fontSize: 12,
              fontWeight: 800,
              color: "#fca5a5",
              margin: "0 0 6px 0",
              letterSpacing: "-0.01em",
            }}>
              {acceptError.includes("signed in") ? "Authentication Required" : "Action Failed"}
            </p>
            <p style={{
              fontSize: 11,
              color: "rgba(255,255,255,0.45)",
              margin: 0,
              lineHeight: 1.55,
            }}>
              {acceptError}
            </p>
            
            {/* Sign-in button if error indicates auth issue */}
            {acceptError.includes("signed in") && (
              <motion.a
                href={`/sign-in?redirectUrl=${encodeURIComponent(window.location.href)}`}
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  marginTop: 10,
                  padding: "6px 14px",
                  borderRadius: 4,
                  fontSize: 11,
                  fontWeight: 800,
                  color: "#fff",
                  background: "linear-gradient(135deg, #f59e0b, #d97706)",
                  textDecoration: "none",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.2s ease",
                }}
              >
                <LogIn style={{ width: 12, height: 12 }} />
                Sign In to Continue
                <ChevronRight style={{ width: 10, height: 10 }} />
              </motion.a>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  )}
</AnimatePresence>
            {/* <AnimatePresence>
              {acceptError && (
                <motion.div
                  initial={{ opacity: 0, height: 0, marginBottom: 0 }}
                  animate={{ opacity: 1, height: "auto", marginBottom: 12 }}
                  exit={{ opacity: 0, height: 0, marginBottom: 0 }}
                  transition={{ duration: 0.22 }}
                  style={{ overflow: "hidden" }}>
                  <div style={{
                    borderRadius: 4,
                    background:   "rgba(239,68,68,0.08)",
                    border:       "1px solid rgba(239,68,68,0.28)",
                    padding:      "10px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: "#f87171", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 12, fontWeight: 800, color: "#fca5a5",
                          margin: "0 0 3px 0", letterSpacing: "-0.01em",
                        }}>
                          {acceptError}
                        </p>
                        <p style={{
                          fontSize: 11, color: "rgba(255,255,255,0.42)",
                          margin: 0, lineHeight: 1.55,
                        }}>
                          Please try again. If the issue persists, contact support.
                        </p>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>   */}

            {/* Buttons */}
            <div style={{ display: "flex", gap: 9 }}>
              {/* Decline — stays visible but triggers warning */}
              <button
                onClick={handleDecline}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 4,
                  fontSize: 11, fontWeight: 700,
                  color:      declined ? "rgba(239,68,68,0.6)" : "rgba(255,255,255,0.32)",
                  background: declined ? "rgba(239,68,68,0.06)" : "rgba(255,255,255,0.04)",
                  border:     `1px solid ${declined ? "rgba(239,68,68,0.22)" : "rgba(255,255,255,0.08)"}`,
                  cursor:     "pointer",
                  fontFamily: "'Sora',system-ui,sans-serif",
                  transition: "all 0.18s",
                }}>
                Decline
              </button>

              {/* Accept */}
              <motion.button
                whileHover={checked && !accepting ? { scale: 1.02 } : {}}
                whileTap={checked && !accepting ? { scale: 0.97 } : {}}
                onClick={handleAccept}
                style={{
                  flex:         2,
                  padding:      "9px 0",
                  borderRadius: 4,
                  fontSize:     11,
                  fontWeight:   900,
                  color:        checked ? "#fff" : "rgba(255,255,255,0.28)",
                  background:   checked
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : "rgba(255,255,255,0.05)",
                  border:       "none",
                  cursor:       checked && !accepting ? "pointer" : "not-allowed",
                  opacity:      checked ? 1 : 0.5,
                  boxShadow:    checked ? "0 0 22px rgba(245,158,11,0.38)" : "none",
                  display:      "flex",
                  alignItems:   "center",
                  justifyContent: "center",
                  gap:          6,
                  transition:   "all 0.18s",
                  position:     "relative",
                  overflow:     "hidden",
                  fontFamily:   "'Sora',system-ui,sans-serif",
                }}>
                {/* Shimmer sweep */}
                {checked && !accepting && (
                  <motion.div
                    animate={{ x: ["-110%", "210%"] }}
                    transition={{
                      repeat: Infinity, duration: 1.8,
                      ease: "easeInOut", repeatDelay: 2.2,
                    }}
                    style={{
                      position: "absolute", inset: 0, pointerEvents: "none",
                      background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.14),transparent)",
                    }}
                  />
                )}

                {accepting ? (
                  <div style={{
                    width: 13, height: 13, borderRadius: "50%",
                    border: "2px solid rgba(255,255,255,0.25)",
                    borderTopColor: "#fff",
                    animation: "spin 0.7s linear infinite",
                    position: "relative", zIndex: 1,
                  }} />
                ) : (
                  <>
                    <Sparkles style={{ width: 12, height: 12, position: "relative", zIndex: 1 }} />
                    <span style={{ position: "relative", zIndex: 1 }}>
                      I Understand — Let&apos;s Play
                    </span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Micro hint below buttons when checkbox not yet ticked */}
            {!checked && !declined && (
              <p style={{
                fontSize: 9.5, color: "rgba(255,255,255,0.22)",
                textAlign: "center", margin: "8px 0 0 0",
              }}>
                Tick the checkbox above to enable the accept button
              </p>
            )}

            <p style={{
              fontSize: 9, color: "rgba(255,255,255,0.15)",
              textAlign: "center", margin: "8px 0 0 0",
            }}>
              isaacpaha.com · iPaha Ltd · England & Wales
            </p>
          </div>
        </div>
      </motion.div>

      {/* Spin keyframe */}
      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — GamesTermsPopup
// ─────────────────────────────────────────────────────────────────────────────

export interface GamesTermsPopupProps {
  /**
   * Passed from the server layout after checking isGameTermsAccepted in DB.
   * If true the popup never shows. Defaults to false (show popup).
   */
  initialAccepted?: boolean;
  children?:        React.ReactNode;
}

export function GamesTermsPopup({
  initialAccepted = false,
  children,
}: GamesTermsPopupProps) {
  const [accepted, setAccepted] = useState(initialAccepted);
  const [show,     setShow]     = useState(false);

  // Decide whether to show the popup
  useEffect(() => {
    if (initialAccepted) {
      // User already accepted in DB — never show
      setAccepted(true);
      setShow(false);
      return;
    }

    // Check session-level cache so navigating between /games pages doesn't re-flash
    try {
      const ok = sessionStorage.getItem(SESSION_KEY);
      if (ok === "1") {
        setAccepted(true);
        setShow(false);
        return;
      }
    } catch { /* ok */ }

    // Not accepted — show after a short delay so the page renders first
    const t = setTimeout(() => setShow(true), 550);
    return () => clearTimeout(t);
  }, [initialAccepted]);

  // ── Accept: call API → set DB flag → close popup ─────────────────────────
  const handleAccept = useCallback(async () => {
    const res = await fetch("/api/game/terms", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ accepted: true }),
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    // Cache in sessionStorage so navigating between game pages doesn't re-show
    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ok */ }

    setAccepted(true);
    setShow(false);
  }, []);

  // ── Decline: log / analytics hook — popup stays visible ──────────────────
  const handleDecline = useCallback(() => {
    // Intentionally does NOT close the popup.
    // The TermsModal handles showing the inline "must accept" warning.
    // This callback is a hook for any analytics you want to fire on decline.
  }, []);

  // ── Manual open (e.g. "View Terms" button in footer) ─────────────────────
  const openManually = useCallback(() => setShow(true), []);

  return (
    <GamesTermsCtx.Provider value={{ open: openManually, accepted }}>
      {children}
      <AnimatePresence>
        {show && (
          <TermsModal onAccept={handleAccept} onDecline={handleDecline} />
        )}
      </AnimatePresence>
    </GamesTermsCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER BUTTON — for footers, nav links, etc.
// ─────────────────────────────────────────────────────────────────────────────

export function GamesTermsTrigger({ label = "Game Terms" }: { label?: string }) {
  const { open } = useGamesTerms();
  return (
    <button
      onClick={open}
      style={{
        fontSize:            11,
        fontWeight:          700,
        color:               "rgba(255,255,255,0.35)",
        background:          "none",
        border:              "none",
        cursor:              "pointer",
        textDecoration:      "underline",
        textUnderlineOffset: 2,
        padding:             0,
        fontFamily:          "'Sora',system-ui,sans-serif",
      }}>
      {label}
    </button>
  );
}
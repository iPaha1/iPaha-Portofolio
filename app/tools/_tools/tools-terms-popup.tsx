// =============================================================================
// TOOLS TERMS POPUP
// components/tools/tools-terms-popup.tsx
//
// "use client" — client component only.
//
// Accepts `initialAccepted` prop from the server layout (DB-backed)
// On ACCEPT  → calls POST /api/tools/terms to set isToolsTermsAccepted = true
// On DECLINE → does NOT close the popup. Shows an inline warning instead:
//              "You must accept the terms to use any tools."
// Accepts `children` so it works as a provider wrapper in layout.tsx
// Also exposes useToolsTerms().open() for manual triggering
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
  Wrench,
  Shield,
  AlertTriangle,
  Sparkles,
  ExternalLink,
  Check,
  ChevronRight,
  Scale,
  Ban,
  X,
  LogIn,
  Zap,
  Cpu,
  Lock,
  Eye,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// CONTEXT
// ─────────────────────────────────────────────────────────────────────────────

interface ToolsTermsCtxType {
  open:     () => void;
  accepted: boolean;
}

const ToolsTermsCtx = createContext<ToolsTermsCtxType>({
  open:     () => {},
  accepted: false,
});

export function useToolsTerms(): ToolsTermsCtxType {
  return useContext(ToolsTermsCtx);
}

// ─────────────────────────────────────────────────────────────────────────────
// CONSTANTS
// ─────────────────────────────────────────────────────────────────────────────

// Used as a fast client-side cache to avoid showing the popup on navigation
// between /tools pages for users who already accepted in this session.
const SESSION_KEY = "tools_terms_session_ok";

// ─────────────────────────────────────────────────────────────────────────────
// KEY POINTS
// ─────────────────────────────────────────────────────────────────────────────

const KEY_POINTS = [
  {
    icon:  Wrench,
    color: "#f59e0b",
    title: "AI Tools for Real Tasks",
    body:  "These tools are built to help you get things done — career moves, writing, learning, and life admin. They're powered by AI that's designed to be helpful, not perfect. Always verify critical outputs.",
  },
  {
    icon:  Cpu,
    color: "#a855f7",
    title: "Token-Powered Access",
    body:  "Most tools are free to try. Premium tools require a small token balance to keep the AI fast, honest, and sustainable. Tokens have no real-world monetary value and are not a currency or investment.",
  },
  {
    icon:  Shield,
    color: "#10b981",
    title: "Data Privacy",
    body:  "Your inputs are processed to generate outputs, but we don't sell your data. Inputs may be stored to improve tool quality and for moderation purposes. Sensitive personal information should not be submitted.",
  },
//   {
//     icon:  AlertTriangle,
//     color: "#ef4444",
//     title: "No Guarantees",
//     body:  "AI outputs may contain errors, biases, or inaccuracies. Tools are provided 'as is' for informational and entertainment purposes. Always use professional judgment for important decisions.",
//   },
//   {
//     icon:  Eye,
//     color: "#06b6d4",
//     title: "Usage Limits",
//     body:  "Rate limits apply to ensure fair access for all users. Excessive automated usage, scraping, or abuse will result in throttling or account suspension. Tools are meant for human use.",
//   },
//   {
//     icon:  Scale,
//     color: "#6366f1",
//     title: "Jurisdiction & Age",
//     body:  "Governed by the laws of England & Wales. By using these tools, you confirm you are at least 13 years of age (or the age of digital consent in your jurisdiction).",
//   },
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
  const [declined,     setDeclined]     = useState(false);
  const [acceptError,  setAcceptError]  = useState<string | null>(null);
  const { isSignedIn } = useUser();

  const handleAccept = async () => {
    if (!checked || accepting) return;

    setAccepting(true);
    setAcceptError(null);

    try {
      await onAccept();
    } catch (error: any) {
      let errorMessage = "Something went wrong. Please try again.";

      if (!isSignedIn) {
        errorMessage = "You need to be signed in to accept the tools terms.";
      } else if (error?.message?.includes("authentication") || error?.message?.includes("unauthorized")) {
        errorMessage = "Your session may have expired. Please sign in again.";
      }

      setAcceptError(errorMessage);
      setAccepting(false);
    }
  };

  const handleDecline = () => {
    setDeclined(true);
    onDecline();
  };

  const clearDeclined = () => setDeclined(false);

  return (
    <>
      {/* ── Backdrop ── */}
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
        animate={{ opacity: 1, scale: 1, y: 0 }}
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
            background:     "#fafaf9",
            border:         "1px solid #e7e5e4",
            boxShadow:      "0 0 0 1px rgba(0,0,0,0.02),0 24px 80px rgba(0,0,0,0.25)",
            fontFamily:     "'Sora',system-ui,sans-serif",
            overflow:       "hidden",
          }}
        >
          {/* ── Amber hairline ── */}
          <div style={{
            height:     2.5,
            flexShrink: 0,
            background: "linear-gradient(90deg,#f59e0b,#fbbf24 50%,#fcd34d)",
          }} />

          {/* ── Header ── */}
          <div style={{
            padding:      "18px 22px 14px",
            borderBottom: "1px solid #e7e5e4",
            flexShrink:   0,
          }}>
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{
                width: 42, height: 42, borderRadius: 4, flexShrink: 0,
                background:  "#fef3c7",
                border:      "1px solid #fde68a",
                display:     "flex", alignItems: "center", justifyContent: "center",
              }}>
                <Zap style={{ width: 19, height: 19, color: "#f59e0b" }} />
              </div>
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 3 }}>
                  <h2 style={{
                    fontSize: "1rem", fontWeight: 900, color: "#1c1917",
                    letterSpacing: "-0.03em", margin: 0,
                  }}>
                    Before You Use These Tools
                  </h2>
                  <span style={{
                    fontSize: 8, fontWeight: 900, letterSpacing: "0.18em",
                    textTransform: "uppercase", padding: "2px 7px", borderRadius: 4,
                    background: "#fef3c7",
                    color:      "#d97706",
                    border:     "1px solid #fed7aa",
                  }}>
                    Required
                  </span>
                </div>
                <p style={{
                  fontSize: 11, color: "#78716c",
                  margin: 0, lineHeight: 1.4,
                }}>
                  Read and accept the terms to unlock all tools.
                </p>
              </div>
            </div>
          </div>

          {/* ── Heart message ── */}
          <div style={{
            margin:     "14px 22px 0",
            padding:    "11px 13px",
            borderRadius: 4,
            background: "#fffbeb",
            border:     "1px solid #fde68a",
            flexShrink: 0,
          }}>
            <div style={{ display: "flex", gap: 9, alignItems: "flex-start" }}>
              <Sparkles style={{ width: 13, height: 13, color: "#f59e0b", flexShrink: 0, marginTop: 1 }} />
              <p style={{ fontSize: 11, color: "#78716c", margin: 0, lineHeight: 1.65 }}>
                These tools were built to{" "}
                <strong style={{ color: "#d97706" }}>actually help you get things done</strong>
                {" "}— career moves, writing, learning, and life admin. Most are free. Premium
                tools use tokens to keep the AI fast and honest. No hidden agendas, just tools
                that work.
              </p>
            </div>
          </div>

          {/* ── Scrollable key points ── */}
          <div style={{ flex: 1, overflowY: "auto", padding: "13px 22px 0", minHeight: 0 }}>
            <p style={{
              fontSize: 9, fontWeight: 900, letterSpacing: "0.2em",
              textTransform: "uppercase", color: "#d6d3d1",
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
                      background:   isOpen ? `${pt.color}0d` : "#ffffff",
                      border:       `1px solid ${isOpen ? `${pt.color}2e` : "#e7e5e4"}`,
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
                        color: "#292524", letterSpacing: "-0.01em",
                      }}>
                        {pt.title}
                      </span>
                      <motion.div
                        animate={{ rotate: isOpen ? 90 : 0 }}
                        transition={{ duration: 0.16 }}>
                        <ChevronRight style={{ width: 12, height: 12, color: "#a8a29e" }} />
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
                            lineHeight: 1.65, color: "#78716c", margin: 0,
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
              background: "#f5f5f4", border: "1px solid #e7e5e4",
              display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10,
            }}>
              <p style={{ fontSize: 11, color: "#78716c", margin: 0, lineHeight: 1.5 }}>
                These are highlights only. Read the full legally binding terms before using.
              </p>
              <Link
                href="/tools-terms"
                target="_blank"
                rel="noopener noreferrer"
                onClick={e => e.stopPropagation()}
                style={{
                  display: "flex", alignItems: "center", gap: 5, flexShrink: 0,
                  fontSize: 10, fontWeight: 800, color: "#d97706", textDecoration: "none",
                  padding: "5px 9px", borderRadius: 4,
                  background: "#fef3c7", border: "1px solid #fed7aa",
                  whiteSpace: "nowrap",
                }}>
                Full Terms <ExternalLink style={{ width: 9, height: 9 }} />
              </Link>
            </div>
          </div>

          {/* ── Footer ── */}
          <div style={{
            padding: "13px 22px 18px",
            borderTop: "1px solid #e7e5e4",
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
                border:     `2px solid ${checked ? "#f59e0b" : "#d6d3d1"}`,
                background: checked ? "#fef3c7" : "transparent",
                display:    "flex", alignItems: "center", justifyContent: "center",
                transition: "all 0.14s",
              }}>
                {checked && (
                  <motion.div
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ type: "spring", damping: 12, stiffness: 360 }}>
                    <Check style={{ width: 9, height: 9, color: "#d97706" }} />
                  </motion.div>
                )}
              </div>
              <p style={{
                fontSize: 11, color: "#78716c",
                lineHeight: 1.55, userSelect: "none", margin: 0,
              }}>
                I understand these tools are for informational purposes and I accept the{" "}
                <Link
                  href="/tools-terms"
                  target="_blank"
                  rel="noopener noreferrer"
                  onClick={e => e.stopPropagation()}
                  style={{ color: "#d97706", textDecoration: "underline", textUnderlineOffset: 2 }}>
                  full terms
                </Link>.
              </p>
            </div>

            {/* ── Decline warning ── */}
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
                    background:   "#fef2f2",
                    border:       "1px solid #fecaca",
                    padding:      "10px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <Ban style={{ width: 14, height: 14, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 12, fontWeight: 800, color: "#dc2626",
                          margin: "0 0 3px 0", letterSpacing: "-0.01em",
                        }}>
                          You must accept the terms to use these tools
                        </p>
                        <p style={{
                          fontSize: 11, color: "#78716c",
                          margin: 0, lineHeight: 1.55,
                        }}>
                          Access to all tools — including free and premium features —
                          requires acceptance of the tools terms. Please tick the box
                          above and click{" "}
                          <strong style={{ color: "#292524" }}>I Understand — Let&apos;s Go</strong> to continue.
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
                            color:      "#a8a29e",
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
                    background: "#fef2f2",
                    border: "1px solid #fecaca",
                    padding: "10px 12px",
                  }}>
                    <div style={{ display: "flex", alignItems: "flex-start", gap: 9 }}>
                      <AlertTriangle style={{ width: 14, height: 14, color: "#ef4444", flexShrink: 0, marginTop: 1 }} />
                      <div style={{ flex: 1 }}>
                        <p style={{
                          fontSize: 12,
                          fontWeight: 800,
                          color: "#dc2626",
                          margin: "0 0 6px 0",
                          letterSpacing: "-0.01em",
                        }}>
                          {acceptError.includes("signed in") ? "Authentication Required" : "Action Failed"}
                        </p>
                        <p style={{
                          fontSize: 11,
                          color: "#78716c",
                          margin: 0,
                          lineHeight: 1.55,
                        }}>
                          {acceptError}
                        </p>
                        
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

            {/* Buttons */}
            <div style={{ display: "flex", gap: 9 }}>
              <button
                onClick={handleDecline}
                style={{
                  flex: 1, padding: "9px 0", borderRadius: 4,
                  fontSize: 11, fontWeight: 700,
                  color:      declined ? "#ef4444" : "#a8a29e",
                  background: declined ? "#fef2f2" : "#f5f5f4",
                  border:     `1px solid ${declined ? "#fecaca" : "#e7e5e4"}`,
                  cursor:     "pointer",
                  fontFamily: "'Sora',system-ui,sans-serif",
                  transition: "all 0.18s",
                }}>
                Decline
              </button>

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
                  color:        checked ? "#fff" : "#a8a29e",
                  background:   checked
                    ? "linear-gradient(135deg,#f59e0b,#d97706)"
                    : "#f5f5f4",
                  border:       "none",
                  cursor:       checked && !accepting ? "pointer" : "not-allowed",
                  opacity:      checked ? 1 : 0.6,
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
                {checked && !accepting && (
                  <motion.div
                    animate={{ x: ["-110%", "210%"] }}
                    transition={{
                      repeat: Infinity, duration: 1.8,
                      ease: "easeInOut", repeatDelay: 2.2,
                    }}
                    style={{
                      position: "absolute", inset: 0, pointerEvents: "none",
                      background: "linear-gradient(90deg,transparent,rgba(255,255,255,0.2),transparent)",
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
                    <Zap style={{ width: 12, height: 12, position: "relative", zIndex: 1 }} />
                    <span style={{ position: "relative", zIndex: 1 }}>
                      I Understand — Let&apos;s Go
                    </span>
                  </>
                )}
              </motion.button>
            </div>

            {/* Micro hint */}
            {!checked && !declined && (
              <p style={{
                fontSize: 9.5, color: "#d6d3d1",
                textAlign: "center", margin: "8px 0 0 0",
              }}>
                Tick the checkbox above to enable the accept button
              </p>
            )}

            <p style={{
              fontSize: 9, color: "#e7e5e4",
              textAlign: "center", margin: "8px 0 0 0",
            }}>
              isaacpaha.com · iPaha Ltd · England & Wales
            </p>
          </div>
        </div>
      </motion.div>

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN EXPORT — ToolsTermsPopup
// ─────────────────────────────────────────────────────────────────────────────

export interface ToolsTermsPopupProps {
  initialAccepted?: boolean;
  children?:        React.ReactNode;
}

export function ToolsTermsPopup({
  initialAccepted = false,
  children,
}: ToolsTermsPopupProps) {
  const [accepted, setAccepted] = useState(initialAccepted);
  const [show,     setShow]     = useState(false);

  useEffect(() => {
    if (initialAccepted) {
      setAccepted(true);
      setShow(false);
      return;
    }

    try {
      const ok = sessionStorage.getItem(SESSION_KEY);
      if (ok === "1") {
        setAccepted(true);
        setShow(false);
        return;
      }
    } catch { /* ok */ }

    const t = setTimeout(() => setShow(true), 550);
    return () => clearTimeout(t);
  }, [initialAccepted]);

  const handleAccept = useCallback(async () => {
    const res = await fetch("/api/tools/terms", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({ accepted: true }),
    });

    if (!res.ok) {
      throw new Error("Server error");
    }

    try { sessionStorage.setItem(SESSION_KEY, "1"); } catch { /* ok */ }

    setAccepted(true);
    setShow(false);
  }, []);

  const handleDecline = useCallback(() => {}, []);

  const openManually = useCallback(() => setShow(true), []);

  return (
    <ToolsTermsCtx.Provider value={{ open: openManually, accepted }}>
      {children}
      <AnimatePresence>
        {show && (
          <TermsModal onAccept={handleAccept} onDecline={handleDecline} />
        )}
      </AnimatePresence>
    </ToolsTermsCtx.Provider>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// TRIGGER BUTTON
// ─────────────────────────────────────────────────────────────────────────────

export function ToolsTermsTrigger({ label = "Tools Terms" }: { label?: string }) {
  const { open } = useToolsTerms();
  return (
    <button
      onClick={open}
      style={{
        fontSize:            11,
        fontWeight:          700,
        color:               "#a8a29e",
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
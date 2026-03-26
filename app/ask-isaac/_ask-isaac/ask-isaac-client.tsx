"use client";

import React, { useState, useRef, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Send, Loader2, Copy, Check, Download, 
  Sparkles, MessageSquare, RotateCcw,
  Flame, BookOpen, Zap, ChevronRight,
} from "lucide-react";
import {
  TOPICS, SUGGESTED_QUESTIONS, POPULAR_QUESTIONS, ISAAC_SYSTEM_PROMPT,
  type TopicId,
} from "@/lib/data/ask-isaac-data";
import { cn } from "@/lib/utils";

// ── Types ─────────────────────────────────────────────────────────────────────
interface Message {
  id: string;
  role: "user" | "assistant";
  content: string;
  timestamp: Date;
  topic?: TopicId;
}

// ── Helpers ───────────────────────────────────────────────────────────────────
function uid() {
  return Math.random().toString(36).slice(2, 10);
}

function formatTime(d: Date) {
  return d.toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" });
}

// ── Isaac Avatar ──────────────────────────────────────────────────────────────
function IsaacAvatar({ thinking = false, size = "md" }: { thinking?: boolean; size?: "sm" | "md" }) {
  const s = size === "sm" ? "w-7 h-7 text-base" : "w-9 h-9 text-xl";
  return (
    <div className={cn(
      "rounded-full flex items-center justify-center flex-shrink-0 border relative overflow-hidden",
      s,
      "bg-amber-500/15 border-amber-500/30"
    )}>
      <span className="relative z-10">{thinking ? "🤔" : "👤"}</span>
      {thinking && (
        <motion.div
          className="absolute inset-0 bg-amber-500/10 rounded-full"
          animate={{ scale: [1, 1.3, 1], opacity: [0.5, 0, 0.5] }}
          transition={{ repeat: Infinity, duration: 1.6 }}
        />
      )}
    </div>
  );
}

// ── Thinking animation ────────────────────────────────────────────────────────
function ThinkingDots() {
  return (
    <div className="flex items-center gap-1.5 py-1">
      {[0, 0.2, 0.4].map((delay, i) => (
        <motion.div
          key={i}
          className="w-1.5 h-1.5 rounded-full bg-amber-400/60"
          animate={{ opacity: [0.3, 1, 0.3], y: [0, -3, 0] }}
          transition={{ repeat: Infinity, duration: 1.2, delay }}
        />
      ))}
    </div>
  );
}

// ── Message renderer ──────────────────────────────────────────────────────────
function MessageBubble({ message, onCopy }: { message: Message; onCopy: (text: string) => void }) {
  const [copied, setCopied] = useState(false);
  const isUser = message.role === "user";

  const handleCopy = () => {
    onCopy(message.content);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Simple markdown-ish renderer
  const renderContent = (text: string) => {
    const lines = text.split("\n");
    return lines.map((line, i) => {
      if (/^\*\*(.+?)\*\*/.test(line) && line.trim().startsWith("**")) {
        const clean = line.replace(/\*\*/g, "");
        return <p key={i} className="font-bold text-white/90 mt-3 mb-1">{clean}</p>;
      }
      if (/^- /.test(line)) {
        return (
          <div key={i} className="flex items-start gap-2 my-1">
            <span className="text-amber-400/60 mt-1.5 text-xs">▸</span>
            <span dangerouslySetInnerHTML={{ __html: line.replace(/^- /, "").replace(/\*\*(.+?)\*\*/g, "<strong>$1</strong>") }} />
          </div>
        );
      }
      if (!line.trim()) return <div key={i} className="h-3" />;
      return (
        <p
          key={i}
          className="leading-relaxed"
          dangerouslySetInnerHTML={{
            __html: line
              .replace(/\*\*(.+?)\*\*/g, "<strong class='text-white/90 font-semibold'>$1</strong>")
              .replace(/\*(.+?)\*/g, "<em>$1</em>")
              .replace(/`(.+?)`/g, "<code class='bg-white/8 border border-white/10 px-1.5 py-0.5 rounded text-xs font-mono text-amber-300'>$1</code>"),
          }}
        />
      );
    });
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35, ease: [0.22, 1, 0.36, 1] }}
      className={cn("flex gap-3 group", isUser ? "flex-row-reverse" : "flex-row")}
    >
      {!isUser && <IsaacAvatar size="sm" />}

      <div className={cn("flex flex-col gap-1.5 max-w-[82%]", isUser && "items-end")}>
        <div
          className={cn(
            "rounded-2xl px-4 py-3 text-sm leading-relaxed",
            isUser
              ? "bg-amber-500/20 border border-amber-500/30 text-white/85 rounded-tr-sm"
              : "bg-white/[0.04] border border-white/[0.08] text-white/70 rounded-tl-sm"
          )}
        >
          {isUser ? (
            <p>{message.content}</p>
          ) : (
            <div className="space-y-0.5">{renderContent(message.content)}</div>
          )}
        </div>

        {/* Actions row */}
        <div className={cn(
          "flex items-center gap-2 opacity-0 group-hover:opacity-100 transition-opacity duration-200",
          isUser ? "flex-row-reverse" : "flex-row"
        )}>
          <span className="text-[10px] text-white/20">{formatTime(message.timestamp)}</span>
          {!isUser && (
            <button
              onClick={handleCopy}
              className="flex items-center gap-1 text-[10px] text-white/25 hover:text-white/60 transition-colors"
            >
              {copied
                ? <><Check className="w-3 h-3 text-emerald-400" /><span className="text-emerald-400">Copied</span></>
                : <><Copy className="w-3 h-3" />Copy</>
              }
            </button>
          )}
        </div>
      </div>

      {isUser && (
        <div className="w-7 h-7 rounded-full bg-white/8 border border-white/10 flex items-center justify-center text-xs flex-shrink-0">
          You
        </div>
      )}
    </motion.div>
  );
}

// ── Sidebar ───────────────────────────────────────────────────────────────────
function AskSidebar({
  activeTopic,
  onTopic,
  onQuestion,
}: {
  activeTopic: TopicId;
  onTopic: (t: TopicId) => void;
  onQuestion: (q: string) => void;
}) {
  const topicColor = TOPICS.find(t => t.id === activeTopic)?.color ?? "#f59e0b";

  const filtered = activeTopic === "all"
    ? SUGGESTED_QUESTIONS
    : SUGGESTED_QUESTIONS.filter(q => q.topic === activeTopic);

  const display = filtered.slice(0, 6);

  return (
    <div className="flex flex-col gap-5">
      {/* Isaac profile card */}
      <div
        className="rounded-xl border border-white/[0.07] overflow-hidden"
        style={{ background: "linear-gradient(135deg, rgba(245,158,11,0.06), transparent)" }}
      >
        <div className="absolute inset-0 opacity-[0.03] pointer-events-none"
          style={{
            backgroundImage: "radial-gradient(circle at 2px 2px, white 1px, transparent 0)",
            backgroundSize: "24px 24px"
          }}
        />
        <div className="relative z-10 p-5">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-12 h-12 rounded-full bg-amber-500/20 border-2 border-amber-500/40 flex items-center justify-center text-2xl">
              👤
            </div>
            <div>
              <p className="text-sm font-black text-white">Isaac Paha</p>
              <p className="text-xs text-amber-400/70">Founder · Builder · Thinker</p>
            </div>
            <div className="ml-auto flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-400 animate-pulse" />
              <span className="text-[10px] text-emerald-400 font-semibold">Online</span>
            </div>
          </div>
          <p className="text-xs text-white/35 leading-relaxed">
            Ask me anything about startups, Africa, technology, building products, or just life. I&apos;ll give you the honest answer, not the polished one.
          </p>
          <div className="flex flex-wrap gap-1.5 mt-3">
            {["iPaha Ltd", "Okpah", "iPahaStores"].map(c => (
              <span key={c} className="text-[10px] text-white/30 bg-white/[0.04] border border-white/[0.06] px-2 py-0.5 rounded">
                {c}
              </span>
            ))}
          </div>
        </div>
      </div>

      {/* Topic filter */}
      <div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/25 mb-3">Ask about</p>
        <div className="flex flex-wrap gap-1.5">
          {TOPICS.map(t => (
            <button
              key={t.id}
              onClick={() => onTopic(t.id)}
              className={cn(
                "flex items-center gap-1.5 text-[11px] font-semibold px-2.5 py-1.5 rounded border transition-all duration-200",
                activeTopic === t.id
                  ? "text-white border-amber-500/40"
                  : "text-white/35 border-white/[0.06] hover:text-white/60 hover:border-white/12"
              )}
              style={activeTopic === t.id ? { backgroundColor: `${t.color}15`, borderColor: `${t.color}40`, color: t.color } : {}}
            >
              <span>{t.icon}</span>
              {t.label}
            </button>
          ))}
        </div>
      </div>

      {/* Suggested questions */}
      <div>
        <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/25 mb-3">
          Suggested questions
        </p>
        <div className="space-y-2">
          {display.map(q => (
            <button
              key={q.id}
              onClick={() => onQuestion(q.text)}
              className="w-full text-left group flex items-start gap-2.5 p-3 rounded-lg border border-white/[0.05] hover:border-white/[0.12] bg-white/[0.02] hover:bg-white/[0.04] transition-all duration-200"
            >
              <span className="text-xs mt-0.5 flex-shrink-0" style={{ color: topicColor }}>→</span>
              <span className="text-xs text-white/45 group-hover:text-white/70 leading-snug transition-colors">
                {q.text}
              </span>
            </button>
          ))}
        </div>
      </div>

      {/* Popular questions */}
      <div>
        <div className="flex items-center gap-2 mb-3">
          <Flame className="w-3.5 h-3.5 text-orange-400" />
          <p className="text-[10px] font-bold tracking-[0.2em] uppercase text-white/25">Most asked</p>
        </div>
        <div className="space-y-1.5">
          {POPULAR_QUESTIONS.slice(0, 5).map((q, i) => (
            <button
              key={i}
              onClick={() => onQuestion(q.text)}
              className="w-full text-left flex items-center justify-between gap-2 py-2 border-b border-white/[0.04] last:border-0 group"
            >
              <span className="text-xs text-white/35 group-hover:text-white/60 transition-colors leading-snug flex-1">
                {q.text}
              </span>
              <span className="text-[10px] text-white/20 flex-shrink-0">{q.asks}</span>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────────────
// MAIN COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

const WELCOME_MESSAGE: Message = {
  id: "welcome",
  role: "assistant",
  content: `Hey — I'm Isaac. Ask me anything.\n\nI'm most useful if you ask specific questions about what I've actually built, how I think about startups, Africa, technology, education, or just life. I'll give you direct answers from lived experience, not polished consultant-speak.\n\nWhat's on your mind?`,
  timestamp: new Date(),
};

export function AskIsaacClient() {
  const [messages, setMessages] = useState<Message[]>([WELCOME_MESSAGE]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [activeTopic, setActiveTopic] = useState<TopicId>("all");
  const [sessionAsks, setSessionAsks] = useState(0);
  const [showSidebar, setShowSidebar] = useState(true);
  const [globalCopied, setGlobalCopied] = useState(false);

  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);
  const MAX_ASKS = 20;

  const conversationHistory = messages
    .filter(m => m.id !== "welcome")
    .map(m => ({ role: m.role, content: m.content }));

  // Auto-scroll
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  // Auto-resize textarea
  const handleInputChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    e.target.style.height = "auto";
    e.target.style.height = Math.min(e.target.scrollHeight, 120) + "px";
  };

  const sendMessage = useCallback(async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || isLoading || sessionAsks >= MAX_ASKS) return;

    const userMsg: Message = {
      id: uid(),
      role: "user",
      content: q,
      timestamp: new Date(),
      topic: activeTopic !== "all" ? activeTopic : undefined,
    };

    setMessages(prev => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    setSessionAsks(n => n + 1);

    // Reset textarea height
    if (inputRef.current) {
      inputRef.current.style.height = "auto";
    }

    const assistantId = uid();
    let accumulated = "";

    // Placeholder message for streaming
    setMessages(prev => [...prev, {
      id: assistantId,
      role: "assistant",
      content: "",
      timestamp: new Date(),
    }]);

    try {
      const response = await fetch("/api/anthropic/messages", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          model: "claude-sonnet-4-20250514",
          max_tokens: 1000,
          system: ISAAC_SYSTEM_PROMPT,
          messages: [
            ...conversationHistory.slice(-10), // keep last 10 for context
            { role: "user", content: q },
          ],
        }),
      });

      const data = await response.json();
      const text = data.content?.[0]?.text ?? "I'm having trouble connecting right now. Try again in a moment.";
      accumulated = text;

      // Simulate character-by-character streaming for UX feel
      let i = 0;
      const chunkSize = 4;
      const interval = setInterval(() => {
        i = Math.min(i + chunkSize, accumulated.length);
        setMessages(prev => prev.map(m =>
          m.id === assistantId
            ? { ...m, content: accumulated.slice(0, i) }
            : m
        ));
        if (i >= accumulated.length) {
          clearInterval(interval);
          setIsLoading(false);
        }
      }, 12);

    } catch {
      setMessages(prev => prev.map(m =>
        m.id === assistantId
          ? { ...m, content: "Something went wrong. Please try again." }
          : m
      ));
      setIsLoading(false);
    }
  }, [input, isLoading, sessionAsks, activeTopic, conversationHistory]);

  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleSuggestedQuestion = (q: string) => {
    setInput(q);
    inputRef.current?.focus();
  };

  const clearConversation = () => {
    setMessages([WELCOME_MESSAGE]);
    setSessionAsks(0);
  };

  const downloadTranscript = () => {
    const text = messages
      .map(m => `[${m.role === "user" ? "You" : "Isaac"}] ${formatTime(m.timestamp)}\n${m.content}`)
      .join("\n\n---\n\n");
    const blob = new Blob([`Ask Isaac — Session Transcript\n${"=".repeat(40)}\n\n${text}`], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `ask-isaac-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
  };

  const copyAll = () => {
    const text = messages
      .filter(m => m.id !== "welcome")
      .map(m => `${m.role === "user" ? "Q" : "Isaac"}: ${m.content}`)
      .join("\n\n");
    navigator.clipboard.writeText(text);
    setGlobalCopied(true);
    setTimeout(() => setGlobalCopied(false), 2000);
  };

  const remainingAsks = MAX_ASKS - sessionAsks;
  const progressPct = (sessionAsks / MAX_ASKS) * 100;

  return (
    <div className="min-h-screen bg-[#070709] text-white flex flex-col">

      {/* ── Ambient background ── */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[800px] rounded-full bg-amber-500/[0.025] blur-[160px]" />
        <div className="absolute bottom-0 left-1/4 w-[400px] h-[400px] rounded-full bg-violet-500/[0.02] blur-[120px]" />
        <div
          className="absolute inset-0 opacity-[0.3]"
          style={{
            backgroundImage:
              "linear-gradient(rgba(255,255,255,0.018) 1px, transparent 1px)," +
              "linear-gradient(90deg, rgba(255,255,255,0.018) 1px, transparent 1px)",
            backgroundSize: "56px 56px",
          }}
        />
      </div>

      {/* ── Top bar ── */}
      <div className="fixed top-16 left-0 right-0 z-30 border-b border-white/[0.06] bg-[#070709]/95 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-4 h-12 flex items-center justify-between gap-4">
          {/* Left: title */}
          <div className="flex items-center gap-3">
            <div className="w-6 h-6 rounded bg-amber-500/20 border border-amber-500/30 flex items-center justify-center">
              <Sparkles className="w-3 h-3 text-amber-400" />
            </div>
            <span className="text-sm font-bold text-white/80">Ask Isaac</span>
            <span className="hidden md:flex items-center gap-1 text-xs text-white/20">
              <ChevronRight className="w-3 h-3" />
              AI-powered · speaks from experience
            </span>
          </div>

          {/* Right: session info + actions */}
          <div className="flex items-center gap-3">
            {/* Session progress */}
            <div className="hidden md:flex items-center gap-2">
              <div className="w-24 h-1 bg-white/[0.06] rounded-full overflow-hidden">
                <div
                  className="h-full rounded-full transition-all duration-500"
                  style={{
                    width: `${progressPct}%`,
                    backgroundColor: progressPct > 80 ? "#f97316" : "#f59e0b",
                  }}
                />
              </div>
              <span className="text-[10px] text-white/25">
                {remainingAsks} ask{remainingAsks !== 1 ? "s" : ""} left
              </span>
            </div>

            {/* Message count */}
            {messages.length > 1 && (
              <span className="flex items-center gap-1.5 text-[11px] text-white/25">
                <MessageSquare className="w-3 h-3" />
                {messages.filter(m => m.id !== "welcome").length} messages
              </span>
            )}

            {/* Actions */}
            {messages.length > 1 && (
              <>
                <button
                  onClick={copyAll}
                  className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white border border-white/[0.07] hover:border-white/15 px-2.5 py-1.5 rounded transition-all"
                >
                  {globalCopied ? <><Check className="w-3 h-3 text-emerald-400" />Copied</> : <><Copy className="w-3 h-3" />Copy</>}
                </button>
                <button
                  onClick={downloadTranscript}
                  className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-white border border-white/[0.07] hover:border-white/15 px-2.5 py-1.5 rounded transition-all"
                >
                  <Download className="w-3 h-3" />
                  <span className="hidden md:inline">Transcript</span>
                </button>
                <button
                  onClick={clearConversation}
                  className="flex items-center gap-1.5 text-[11px] text-white/30 hover:text-red-400 border border-white/[0.07] hover:border-red-400/25 px-2.5 py-1.5 rounded transition-all"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span className="hidden md:inline">Clear</span>
                </button>
              </>
            )}

            {/* Sidebar toggle (mobile) */}
            <button
              onClick={() => setShowSidebar(s => !s)}
              className="lg:hidden flex items-center gap-1 text-[11px] text-white/30 hover:text-white border border-white/[0.07] px-2.5 py-1.5 rounded transition-all"
            >
              <BookOpen className="w-3 h-3" />
              Help
            </button>
          </div>
        </div>
      </div>

      {/* ── Main layout ── */}
      <div className="relative z-10 max-w-7xl mx-auto px-4 pt-28 pb-6 flex gap-6 flex-1 min-h-screen">

        {/* ── Sidebar ── */}
        <AnimatePresence>
          {(showSidebar) && (
            <motion.aside
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: -20 }}
              transition={{ duration: 0.3 }}
              className="hidden lg:block w-72 xl:w-80 flex-shrink-0"
            >
              <div className="sticky top-28 max-h-[calc(100vh-8rem)] overflow-y-auto pr-1 scrollbar-none">
                <AskSidebar
                  activeTopic={activeTopic}
                  onTopic={setActiveTopic}
                  onQuestion={handleSuggestedQuestion}
                />
              </div>
            </motion.aside>
          )}
        </AnimatePresence>

        {/* ── Chat panel ── */}
        <div className="flex-1 flex flex-col min-w-0">
          {/* Chat window */}
          <div
            className="flex-1 rounded-2xl border border-white/[0.07] overflow-hidden flex flex-col"
            style={{
              background: "linear-gradient(180deg, rgba(255,255,255,0.015) 0%, transparent 100%)",
              minHeight: "calc(100vh - 14rem)",
            }}
          >
            {/* Messages */}
            <div className="flex-1 overflow-y-auto px-4 md:px-6 py-6 space-y-5 scrollbar-none">
              {messages.map(m => (
                <MessageBubble
                  key={m.id}
                  message={m}
                  onCopy={text => navigator.clipboard.writeText(text)}
                />
              ))}

              {/* Thinking indicator */}
              {isLoading && (
                <motion.div
                  initial={{ opacity: 0, y: 8 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex gap-3"
                >
                  <IsaacAvatar thinking size="sm" />
                  <div className="bg-white/[0.04] border border-white/[0.08] rounded-2xl rounded-tl-sm px-4 py-3">
                    <ThinkingDots />
                  </div>
                </motion.div>
              )}

              <div ref={bottomRef} />
            </div>

            {/* Divider */}
            <div className="border-t border-white/[0.06]" />

            {/* Input area */}
            <div className="p-4 md:p-5">
              {/* Rate limit warning */}
              {remainingAsks <= 3 && (
                <motion.div
                  initial={{ opacity: 0, y: 4 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="flex items-center gap-2 text-xs text-orange-400 bg-orange-400/8 border border-orange-400/20 rounded-lg px-3 py-2 mb-3"
                >
                  <Zap className="w-3.5 h-3.5 shrink-0" />
                  {remainingAsks === 0
                    ? "You've reached the session limit. Refresh to start a new conversation."
                    : `${remainingAsks} question${remainingAsks !== 1 ? "s" : ""} remaining in this session.`
                  }
                </motion.div>
              )}

              <div className="flex gap-3 items-end">
                <IsaacAvatar size="sm" />

                <div className="flex-1 relative">
                  <textarea
                    ref={inputRef}
                    value={input}
                    onChange={handleInputChange}
                    onKeyDown={handleKeyDown}
                    placeholder="Ask Isaac anything…"
                    rows={1}
                    disabled={isLoading || sessionAsks >= MAX_ASKS}
                    className={cn(
                      "w-full resize-none bg-white/[0.04] border border-white/[0.09] rounded-xl px-4 py-3 pr-12 text-sm text-white placeholder:text-white/20",
                      "focus:outline-none focus:border-amber-500/40 focus:bg-white/[0.06]",
                      "transition-all duration-200 leading-relaxed",
                      "disabled:opacity-40 disabled:cursor-not-allowed",
                      "max-h-[120px] scrollbar-none"
                    )}
                    style={{ minHeight: "46px" }}
                  />
                  {/* Send button */}
                  <button
                    onClick={() => sendMessage()}
                    disabled={!input.trim() || isLoading || sessionAsks >= MAX_ASKS}
                    className={cn(
                      "absolute right-2 bottom-2 w-8 h-8 rounded-lg flex items-center justify-center transition-all duration-200",
                      input.trim() && !isLoading && sessionAsks < MAX_ASKS
                        ? "bg-amber-500 hover:bg-amber-400 text-white"
                        : "bg-white/[0.04] text-white/20 cursor-not-allowed"
                    )}
                  >
                    {isLoading
                      ? <Loader2 className="w-3.5 h-3.5 animate-spin" />
                      : <Send className="w-3.5 h-3.5" />
                    }
                  </button>
                </div>
              </div>

              <p className="text-[10px] text-white/15 mt-2 pl-10 flex items-center gap-2">
                <span>↵ Enter to send · Shift+Enter for new line</span>
                <span>·</span>
                <span>Powered by Claude</span>
              </p>
            </div>
          </div>

          {/* Quick suggestion chips (below chat on mobile) */}
          <div className="mt-4 flex flex-wrap gap-2 lg:hidden">
            {SUGGESTED_QUESTIONS
              .filter(q => activeTopic === "all" || q.topic === activeTopic)
              .slice(0, 4)
              .map(q => (
                <button
                  key={q.id}
                  onClick={() => handleSuggestedQuestion(q.text)}
                  className="text-xs text-white/35 hover:text-white/70 border border-white/[0.07] hover:border-white/15 bg-white/[0.02] hover:bg-white/[0.05] px-3 py-2 rounded-lg transition-all leading-snug text-left"
                >
                  {q.text.length > 55 ? q.text.slice(0, 52) + "…" : q.text}
                </button>
              ))}
          </div>
        </div>
      </div>
    </div>
  );
}
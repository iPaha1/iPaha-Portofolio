"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: AI Knowledge Assistant
// components/admin/hub/ai/hub-assistant.tsx
//
// Conversational AI that searches your knowledge base and answers
// questions using stored entries as context. Features:
//   - Multi-turn conversation with history
//   - Cited sources from your KB (snippets, notes, playbooks, etc.)
//   - Character-by-character streaming simulation
//   - Conversation list + new chat
//   - "Use entry" buttons to open entries from citations
// =============================================================================

import React, {
  useState, useRef, useEffect, useCallback,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  Sparkles, Send, Plus, Trash2, Copy, Check,
  Loader2, MessageSquare, Bot,
  RotateCcw, ExternalLink, 
} from "lucide-react";
import { TAB_CFG, fmtDate, type HubType } from "../_shared/hub-types";


// ─── Types ────────────────────────────────────────────────────────────────────

type MessageSource = {
  id:    string;
  title: string;
  type:  HubType;
};

type HubMessage = {
  id:        string;
  role:      "user" | "assistant";
  content:   string;
  sources?:  MessageSource[];
  timestamp: string;
};

type Conversation = {
  id:        string;
  title:     string | null;
  messages:  HubMessage[];
  createdAt: string;
  updatedAt: string;
};

// ─── Source chip ──────────────────────────────────────────────────────────────

function SourceChip({ source, onOpen }: { source: MessageSource; onOpen: (id: string) => void }) {
  const cfg = Object.values(TAB_CFG).find((c) => c.type === source.type);
  return (
    <button
      onClick={() => onOpen(source.id)}
      className="inline-flex items-center gap-1.5 text-[10px] font-semibold px-2 py-1 rounded-sm border transition-colors hover:opacity-80"
      style={{
        color:           cfg?.color ?? "#6b7280",
        backgroundColor: `${cfg?.color ?? "#6b7280"}12`,
        borderColor:     `${cfg?.color ?? "#6b7280"}30`,
      }}
    >
      {cfg && <cfg.icon className="w-2.5 h-2.5" />}
      {source.title.length > 40 ? source.title.slice(0, 40) + "…" : source.title}
      <ExternalLink className="w-2.5 h-2.5 opacity-50" />
    </button>
  );
}

// ─── Message bubble ───────────────────────────────────────────────────────────

function MessageBubble({
  message, onOpenSource,
}: {
  message: HubMessage;
  onOpenSource: (id: string) => void;
}) {
  const isUser = message.role === "user";
  const [copiedMsg, setCopiedMsg] = useState(false);

  const copyMsg = () => {
    navigator.clipboard.writeText(message.content);
    setCopiedMsg(true);
    setTimeout(() => setCopiedMsg(false), 1500);
  };

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.2 }}
      className={`flex gap-3 ${isUser ? "flex-row-reverse" : ""}`}
    >
      {/* Avatar */}
      <div className={`w-7 h-7 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5 ${
        isUser ? "bg-amber-500" : "bg-stone-800"
      }`}>
        {isUser
          ? <span className="text-white text-[11px] font-black">IP</span>
          : <Bot className="w-4 h-4 text-white" />
        }
      </div>

      {/* Content */}
      <div className={`flex-1 max-w-[85%] ${isUser ? "items-end" : "items-start"} flex flex-col gap-1.5`}>
        <div className={`rounded-sm px-3.5 py-2.5 text-sm leading-relaxed ${
          isUser
            ? "bg-amber-500 text-white rounded-tr-none"
            : "bg-white border border-stone-100 text-stone-700 rounded-tl-none shadow-sm"
        }`}>
          <pre className="whitespace-pre-wrap font-sans text-sm leading-relaxed">{message.content}</pre>
        </div>

        {/* Sources */}
        {message.sources && message.sources.length > 0 && (
          <div className="flex flex-wrap gap-1.5">
            <span className="text-[10px] text-stone-400 self-center">From your KB:</span>
            {message.sources.map((s) => (
              <SourceChip key={s.id} source={s} onOpen={onOpenSource} />
            ))}
          </div>
        )}

        {/* Timestamp + copy */}
        <div className={`flex items-center gap-2 ${isUser ? "flex-row-reverse" : ""}`}>
          <span className="text-[9px] text-stone-300">
            {new Date(message.timestamp).toLocaleTimeString("en-GB", { hour: "2-digit", minute: "2-digit" })}
          </span>
          {!isUser && (
            <button onClick={copyMsg}
              className="text-[10px] text-stone-300 hover:text-stone-600 flex items-center gap-1 transition-colors">
              {copiedMsg ? <Check className="w-3 h-3 text-emerald-500" /> : <Copy className="w-3 h-3" />}
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}

// ─── Typing indicator ─────────────────────────────────────────────────────────

function TypingIndicator() {
  return (
    <div className="flex gap-3">
      <div className="w-7 h-7 rounded-full bg-stone-800 flex items-center justify-center flex-shrink-0">
        <Bot className="w-4 h-4 text-white" />
      </div>
      <div className="bg-white border border-stone-100 rounded-sm rounded-tl-none px-3.5 py-3 shadow-sm">
        <div className="flex gap-1 items-center">
          {[0, 1, 2].map((i) => (
            <motion.div key={i} className="w-1.5 h-1.5 bg-stone-400 rounded-full"
              animate={{ y: [0, -4, 0] }}
              transition={{ duration: 0.6, repeat: Infinity, delay: i * 0.15 }}
            />
          ))}
        </div>
      </div>
    </div>
  );
}

// ─── Conversation list item ───────────────────────────────────────────────────

function ConvItem({
  conv, active, onSelect, onDelete,
}: {
  conv: Conversation; active: boolean;
  onSelect: () => void; onDelete: () => void;
}) {
  const firstMsg = conv.messages.find((m) => m.role === "user");
  return (
    <div className={`group flex items-center gap-2 px-3 py-2.5 rounded-sm cursor-pointer transition-colors ${
      active ? "bg-amber-50 text-amber-700" : "hover:bg-stone-50 text-stone-600"
    }`}>
      <button onClick={onSelect} className="flex-1 min-w-0 text-left">
        <p className="text-xs font-semibold truncate">
          {conv.title ?? firstMsg?.content.slice(0, 40) ?? "New conversation"}
        </p>
        <p className="text-[10px] text-stone-400 mt-0.5">{fmtDate(conv.updatedAt)}</p>
      </button>
      <button onClick={(e) => { e.stopPropagation(); onDelete(); }}
        className="opacity-0 group-hover:opacity-100 text-stone-300 hover:text-red-500 transition-all flex-shrink-0">
        <Trash2 className="w-3.5 h-3.5" />
      </button>
    </div>
  );
}

// ─── EXAMPLE QUESTIONS ───────────────────────────────────────────────────────

const EXAMPLE_QUESTIONS = [
  "How do I deploy a Next.js app with Prisma?",
  "Show me Prisma query patterns I've saved",
  "What Git commands do I use for rebasing?",
  "How did I solve that Vercel build error?",
  "Give me a code review prompt",
  "What notes do I have on system design?",
  "Show me my Docker commands",
  "What's the Stripe API endpoint for creating a payment?",
];

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────

interface HubAssistantProps {
  onOpenEntry: (id: string) => void;
}

export function HubAssistant({ onOpenEntry }: HubAssistantProps) {
  const [conversations, setConversations]     = useState<Conversation[]>([]);
  const [activeConvId,  setActiveConvId]      = useState<string | null>(null);
  const [messages,      setMessages]          = useState<HubMessage[]>([]);
  const [input,         setInput]             = useState("");
  const [loading,       setLoading]           = useState(false);
  const [convLoading,   setConvLoading]       = useState(true);
  const [sidebarOpen,   setSidebarOpen]       = useState(true);
  const bottomRef = useRef<HTMLDivElement>(null);
  const inputRef  = useRef<HTMLTextAreaElement>(null);

  // Load conversation list
  const loadConversations = useCallback(async () => {
    setConvLoading(true);
    try {
      const res  = await fetch("/api/admin/hub/conversations");
      const data = await res.json();
      setConversations(data.conversations ?? []);
    } catch {}
    setConvLoading(false);
  }, []);

  useEffect(() => { loadConversations(); }, [loadConversations]);

  // Scroll to bottom on new messages
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  // Select conversation
  const selectConv = (conv: Conversation) => {
    setActiveConvId(conv.id);
    setMessages(conv.messages);
  };

  // New conversation
  const newConv = () => {
    setActiveConvId(null);
    setMessages([]);
    inputRef.current?.focus();
  };

  // Delete conversation
  const deleteConv = async (id: string) => {
    await fetch(`/api/admin/hub/conversations/${id}`, { method: "DELETE" });
    setConversations((p) => p.filter((c) => c.id !== id));
    if (activeConvId === id) newConv();
  };

  // Send message
  const send = async (text?: string) => {
    const q = (text ?? input).trim();
    if (!q || loading) return;
    setInput("");

    const userMsg: HubMessage = {
      id:        crypto.randomUUID(),
      role:      "user",
      content:   q,
      timestamp: new Date().toISOString(),
    };

    const nextMessages = [...messages, userMsg];
    setMessages(nextMessages);
    setLoading(true);

    try {
      const res = await fetch("/api/admin/hub/assistant", {
        method:  "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message:        q,
          conversationId: activeConvId,
          history:        messages.slice(-8), // last 8 for context
        }),
      });

      const data = await res.json();

      const assistantMsg: HubMessage = {
        id:        crypto.randomUUID(),
        role:      "assistant",
        content:   data.answer ?? "I couldn't generate a response. Please try again.",
        sources:   data.sources ?? [],
        timestamp: new Date().toISOString(),
      };

      const finalMessages = [...nextMessages, assistantMsg];
      setMessages(finalMessages);

      // Update or create conversation
      if (data.conversationId) {
        setActiveConvId(data.conversationId);
        setConversations((prev) => {
          const exists = prev.find((c) => c.id === data.conversationId);
          if (exists) {
            return prev.map((c) => c.id === data.conversationId
              ? { ...c, messages: finalMessages, updatedAt: new Date().toISOString(), title: data.title ?? c.title }
              : c
            );
          }
          return [{
            id: data.conversationId,
            title: data.title ?? null,
            messages: finalMessages,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString(),
          }, ...prev];
        });
      }
    } catch {
      setMessages([...nextMessages, {
        id:        crypto.randomUUID(),
        role:      "assistant",
        content:   "Sorry, I had trouble connecting. Please try again.",
        timestamp: new Date().toISOString(),
      }]);
    }
    setLoading(false);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      send();
    }
  };

  const isNewChat = messages.length === 0;

  return (
    <div className="flex h-full overflow-hidden">
      {/* ── Conversation sidebar ──────────────────────────────────────── */}
      <AnimatePresence>
        {sidebarOpen && (
          <motion.div
            initial={{ width: 0 }} animate={{ width: 224 }} exit={{ width: 0 }}
            transition={{ duration: 0.2 }}
            className="flex-shrink-0 border-r border-stone-100 bg-stone-50/40 flex flex-col overflow-hidden"
          >
            <div className="p-3 flex-shrink-0">
              <button onClick={newConv}
                className="flex items-center gap-2 w-full text-xs font-bold text-white bg-amber-500 hover:bg-amber-600 px-3 py-2.5 rounded-sm transition-colors">
                <Plus className="w-3.5 h-3.5" />New conversation
              </button>
            </div>
            <div className="flex-1 overflow-y-auto px-2 pb-3 space-y-0.5">
              {convLoading && (
                <div className="flex items-center justify-center py-6">
                  <Loader2 className="w-4 h-4 text-stone-300 animate-spin" />
                </div>
              )}
              {!convLoading && conversations.length === 0 && (
                <p className="text-[11px] text-stone-400 text-center px-3 py-4">No conversations yet</p>
              )}
              {conversations.map((conv) => (
                <ConvItem key={conv.id} conv={conv}
                  active={conv.id === activeConvId}
                  onSelect={() => selectConv(conv)}
                  onDelete={() => deleteConv(conv.id)}
                />
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ── Main chat area ───────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex items-center gap-3 px-4 py-3 border-b border-stone-100 flex-shrink-0 bg-white">
          <button onClick={() => setSidebarOpen((p) => !p)}
            className="text-stone-400 hover:text-stone-700 transition-colors">
            <MessageSquare className="w-4 h-4" />
          </button>
          <div className="flex items-center gap-2">
            <div className="w-5 h-5 bg-stone-800 rounded-full flex items-center justify-center">
              <Bot className="w-3 h-3 text-white" />
            </div>
            <div>
              <p className="text-xs font-black text-stone-800">Hub AI Assistant</p>
              <p className="text-[10px] text-stone-400">Searches your knowledge base to answer questions</p>
            </div>
          </div>
          {!isNewChat && (
            <button onClick={newConv}
              className="ml-auto flex items-center gap-1.5 text-[11px] text-stone-400 hover:text-stone-700 border border-stone-200 px-2.5 py-1.5 rounded-sm transition-colors">
              <RotateCcw className="w-3 h-3" />New chat
            </button>
          )}
        </div>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto px-4 py-5 space-y-5">
          {isNewChat ? (
            /* Empty state */
            <div className="flex flex-col items-center justify-center min-h-[60%] text-center py-8">
              <div className="w-16 h-16 bg-stone-800 rounded-full flex items-center justify-center mb-5">
                <Bot className="w-8 h-8 text-white" />
              </div>
              <h3 className="text-base font-black text-stone-800 mb-1">Ask your knowledge base</h3>
              <p className="text-sm text-stone-400 max-w-sm mb-8 leading-relaxed">
                I search through all your stored snippets, notes, playbooks, errors, and more to answer your questions.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-w-lg">
                {EXAMPLE_QUESTIONS.map((q) => (
                  <button key={q} onClick={() => send(q)}
                    className="flex items-center gap-2 text-left text-xs text-stone-600 border border-stone-200 hover:border-amber-300 hover:bg-amber-50/50 hover:text-amber-700 px-3 py-2.5 rounded-sm transition-colors group">
                    <Sparkles className="w-3 h-3 text-stone-300 group-hover:text-amber-400 flex-shrink-0 transition-colors" />
                    {q}
                  </button>
                ))}
              </div>
            </div>
          ) : (
            messages.map((msg) => (
              <MessageBubble key={msg.id} message={msg} onOpenSource={onOpenEntry} />
            ))
          )}
          {loading && <TypingIndicator />}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="px-4 py-3 border-t border-stone-100 flex-shrink-0 bg-white">
          <div className="flex items-end gap-2 bg-stone-50 border border-stone-200 rounded-sm focus-within:border-amber-400 transition-colors px-3 py-2.5">
            <textarea
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKeyDown}
              rows={1}
              disabled={loading}
              placeholder="Ask about your knowledge base… (Enter to send, Shift+Enter for newline)"
              className="flex-1 text-sm bg-transparent border-0 focus:outline-none resize-none leading-relaxed placeholder:text-stone-400 disabled:opacity-50"
              style={{ maxHeight: "120px" }}
            />
            <button
              onClick={() => send()}
              disabled={!input.trim() || loading}
              className="flex-shrink-0 w-8 h-8 flex items-center justify-center bg-amber-500 hover:bg-amber-600 text-white rounded-sm transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {loading
                ? <Loader2 className="w-4 h-4 animate-spin" />
                : <Send className="w-4 h-4" />
              }
            </button>
          </div>
          <p className="text-[10px] text-stone-300 mt-1.5 text-center">
            AI searches your stored knowledge — not the web. Accuracy depends on what you&apos;ve saved.
          </p>
        </div>
      </div>
    </div>
  );
}
"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Type-Specific Editors
// components/admin/hub/editors/type-editors.tsx
//
// Exports one editor per HubType. Each receives { payload, setPayload }
// from EditorShell and renders only its type-specific fields.
// =============================================================================

import React, { useState } from "react";
import { Plus, Trash2, GripVertical, ExternalLink } from "lucide-react";
import {
  EditorField, EditorInput, EditorTextarea, EditorSelect,
} from "./editor-shell";
import { TagInput, FlagButtons, CategoryChips } from "../_shared/ui-atoms";
import {
  LANGUAGES, LANG_LABELS, SUGGESTED_CATEGORIES, parseJson, type HubLanguage, type PlaybookStep, type ResourceType,
  type HttpMethod,
} from "../_shared/hub-types";
import type { EditorPayload } from "./editor-shell";

// ─── Shared inner-editor props ────────────────────────────────────────────────

export interface TypeEditorProps {
  payload:    EditorPayload;
  setPayload: React.Dispatch<React.SetStateAction<EditorPayload>>;
}

// Helper: update a single field
function field<K extends keyof EditorPayload>(
  setPayload: TypeEditorProps["setPayload"],
  key: K,
  value: EditorPayload[K]
) {
  setPayload((p) => ({ ...p, [key]: value }));
}

// ─── Universal fields (title, description, category, tags, flags) ─────────────

function UniversalFields({ payload, setPayload, type }: TypeEditorProps & { type: string }) {
  const cats = SUGGESTED_CATEGORIES[payload.type] ?? [];
  const tags = parseJson<string[]>(payload.tags, []);

  return (
    <>
      {/* Title */}
      <EditorField label="Title" required>
        <EditorInput
          value={payload.title}
          onChange={(v) => field(setPayload, "title", v)}
          placeholder="Give it a clear, searchable title…"
        />
      </EditorField>

      {/* Category */}
      <EditorField label="Category">
        <EditorInput
          value={payload.category ?? ""}
          onChange={(v) => field(setPayload, "category", v || null)}
          placeholder="e.g. Git, React, System Design…"
          list={`cats-${type}`}
        />
        <datalist id={`cats-${type}`}>
          {cats.map((c) => <option key={c} value={c} />)}
        </datalist>
        <CategoryChips
          suggestions={cats}
          current={payload.category ?? ""}
          onSelect={(c) => field(setPayload, "category", c)}
        />
      </EditorField>

      {/* Description */}
      <EditorField label="Description" hint="(optional — improves search)">
        <EditorTextarea
          value={payload.description ?? ""}
          onChange={(v) => field(setPayload, "description", v || null)}
          rows={2}
          placeholder="Brief note about when/why to use this…"
        />
      </EditorField>

      {/* Tags */}
      <EditorField label="Tags">
        <TagInput
          tags={tags}
          onChange={(t) => field(setPayload, "tags", JSON.stringify(t))}
        />
      </EditorField>

      {/* Flags */}
      <FlagButtons
        isFavourite={payload.isFavourite}
        isPinned={payload.isPinned}
        onToggleFav={() => setPayload((p) => ({ ...p, isFavourite: !p.isFavourite }))}
        onTogglePin={() => setPayload((p) => ({ ...p, isPinned:    !p.isPinned }))}
      />
    </>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// SNIPPET EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

export function SnippetEditor({ payload, setPayload }: TypeEditorProps) {
  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="snippet" />

      <div className="grid grid-cols-2 gap-3">
        <EditorField label="Language">
          <EditorSelect
            value={payload.language ?? "PLAINTEXT"}
            onChange={(v) => field(setPayload, "language", v as HubLanguage)}
          >
            {LANGUAGES.map((l) => <option key={l} value={l}>{LANG_LABELS[l]}</option>)}
          </EditorSelect>
        </EditorField>
        <EditorField label="Framework / Library">
          <EditorInput
            value={payload.framework ?? ""}
            onChange={(v) => field(setPayload, "framework", v || null)}
            placeholder="Next.js, React, Express…"
          />
        </EditorField>
      </div>

      <EditorField label="Code" required hint="(main content — syntax highlighted)">
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={16}
          mono dark
          placeholder="// Paste your code snippet here…"
        />
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PROMPT EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

const AI_MODELS = [
  "Claude Sonnet 4", "Claude Opus 4", "Claude Haiku", "GPT-4o",
  "GPT-4 Turbo", "Gemini 1.5 Pro", "Llama 3", "Mistral Large", "Other",
];

export function PromptEditor({ payload, setPayload }: TypeEditorProps) {
  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="prompt" />

      <EditorField label="AI Model">
        <EditorSelect
          value={payload.aiModel ?? ""}
          onChange={(v) => field(setPayload, "aiModel", v || null)}
        >
          <option value="">— select model —</option>
          {AI_MODELS.map((m) => <option key={m} value={m}>{m}</option>)}
        </EditorSelect>
      </EditorField>

      <EditorField label="Prompt Text" required>
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={12}
          placeholder="You are a senior TypeScript developer reviewing a pull request…"
        />
      </EditorField>

      <EditorField label="Example Output" hint="(optional — paste a sample AI response)">
        <EditorTextarea
          value={payload.exampleOutput ?? ""}
          onChange={(v) => field(setPayload, "exampleOutput", v || null)}
          rows={8}
          placeholder="Paste a representative response this prompt produced…"
        />
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// COMMAND EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

export function CommandEditor({ payload, setPayload }: TypeEditorProps) {
  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="command" />

      <EditorField label="Command" required hint="(one or more terminal lines)">
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={6}
          mono dark
          placeholder="git rebase -i HEAD~3"
        />
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// ERROR EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

export function ErrorEditor({ payload, setPayload }: TypeEditorProps) {
  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="error" />

      <EditorField label="Technology / Stack">
        <EditorInput
          value={payload.technology ?? ""}
          onChange={(v) => field(setPayload, "technology", v || null)}
          placeholder="e.g. Next.js 14, Prisma 5, Node 20"
        />
      </EditorField>

      <EditorField label="Raw Error Message" hint="(paste the exact error/stack trace)">
        <EditorTextarea
          value={payload.errorMessage ?? ""}
          onChange={(v) => field(setPayload, "errorMessage", v || null)}
          rows={5} mono dark
          placeholder="Error: PrismaClientKnownRequestError: ..."
        />
      </EditorField>

      <EditorField label="Problem Description" required>
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={5}
          placeholder="Describe what caused the error, the context, and any key details…"
        />
      </EditorField>

      <EditorField label="Solution / Fix" required>
        <EditorTextarea
          value={payload.solution ?? ""}
          onChange={(v) => field(setPayload, "solution", v || null)}
          rows={10}
          placeholder={"Step-by-step fix:\n1. ...\n2. ...\n\nCode changes needed:\n```\n// ...\n```"}
        />
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// NOTE EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

const DIFFICULTIES = ["Beginner", "Intermediate", "Advanced", "Expert"];

export function NoteEditor({ payload, setPayload }: TypeEditorProps) {
  const refs = parseJson<string[]>(payload.references, []);
  const [refInput, setRefInput] = useState("");

  const addRef = () => {
    const r = refInput.trim();
    if (r && !refs.includes(r)) {
      field(setPayload, "references", JSON.stringify([...refs, r]));
    }
    setRefInput("");
  };

  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="note" />

      <EditorField label="Difficulty Level">
        <EditorSelect
          value={payload.difficulty ?? ""}
          onChange={(v) => field(setPayload, "difficulty", v || null)}
        >
          <option value="">— select level —</option>
          {DIFFICULTIES.map((d) => <option key={d} value={d}>{d}</option>)}
        </EditorSelect>
      </EditorField>

      <EditorField label="Notes" required hint="(your learning notes, observations, insights)">
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={18}
          placeholder={"## Key Concepts\n\n- ...\n\n## How it works\n\n...\n\n## Example\n\n```\n// ...\n```"}
        />
      </EditorField>

      <EditorField label="References / Links">
        <div className="space-y-1.5 mb-2">
          {refs.map((r, i) => (
            <div key={i} className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-2 rounded-sm">
              <a href={r} target="_blank" rel="noopener noreferrer"
                className="flex-1 text-xs text-blue-600 hover:underline truncate">{r}</a>
              <button onClick={() => field(setPayload, "references", JSON.stringify(refs.filter((_, j) => j !== i)))}
                className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={refInput} onChange={(e) => setRefInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addRef(); } }}
            placeholder="https://docs.example.com/... then press Enter"
            className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400 font-mono"
          />
          <button onClick={addRef}
            className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">
            Add
          </button>
        </div>
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// API EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

const HTTP_METHODS: HttpMethod[] = ["GET", "POST", "PUT", "PATCH", "DELETE", "HEAD", "OPTIONS"];
const AUTH_TYPES = ["Bearer Token", "API Key (Header)", "API Key (Query)", "Basic Auth", "OAuth 2.0", "None"];

export function ApiEditor({ payload, setPayload }: TypeEditorProps) {
  const headers = parseJson<Record<string, string>>(payload.apiHeaders, {});
  const [hKey, setHKey] = useState("");
  const [hVal, setHVal] = useState("");

  const addHeader = () => {
    if (hKey.trim()) {
      field(setPayload, "apiHeaders", JSON.stringify({ ...headers, [hKey.trim()]: hVal.trim() }));
      setHKey(""); setHVal("");
    }
  };

  const removeHeader = (k: string) => {
    const next = { ...headers };
    delete next[k];
    field(setPayload, "apiHeaders", Object.keys(next).length ? JSON.stringify(next) : null);
  };

  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="api" />

      <div className="grid grid-cols-3 gap-3">
        <EditorField label="HTTP Method">
          <EditorSelect
            value={payload.httpMethod ?? "GET"}
            onChange={(v) => field(setPayload, "httpMethod", v)}
          >
            {HTTP_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
          </EditorSelect>
        </EditorField>
        <div className="col-span-2">
          <EditorField label="Endpoint URL" required>
            <EditorInput
              value={payload.endpointUrl ?? ""}
              onChange={(v) => field(setPayload, "endpointUrl", v || null)}
              placeholder="https://api.example.com/v1/resource"
              mono
            />
          </EditorField>
        </div>
      </div>

      <EditorField label="Authentication">
        <EditorSelect
          value={payload.authType ?? ""}
          onChange={(v) => field(setPayload, "authType", v || null)}
        >
          <option value="">— select auth type —</option>
          {AUTH_TYPES.map((a) => <option key={a} value={a}>{a}</option>)}
        </EditorSelect>
      </EditorField>

      {/* Headers */}
      <EditorField label="Request Headers">
        <div className="space-y-1.5 mb-2">
          {Object.entries(headers).map(([k, v]) => (
            <div key={k} className="flex items-center gap-2 bg-stone-50 border border-stone-200 px-3 py-2 rounded-sm">
              <span className="text-xs font-mono text-stone-600 font-bold">{k}:</span>
              <span className="text-xs font-mono text-stone-500 flex-1">{v}</span>
              <button onClick={() => removeHeader(k)} className="text-stone-300 hover:text-red-500 transition-colors">
                <Trash2 className="w-3 h-3" />
              </button>
            </div>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={hKey} onChange={(e) => setHKey(e.target.value)}
            placeholder="Header-Name"
            className="w-36 text-xs font-mono border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400"
          />
          <input value={hVal} onChange={(e) => setHVal(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addHeader(); } }}
            placeholder="value or {{variable}}"
            className="flex-1 text-xs font-mono border border-stone-200 rounded-sm px-2 py-2 focus:outline-none focus:border-amber-400"
          />
          <button onClick={addHeader}
            className="text-xs font-bold text-amber-600 border border-amber-200 px-3 py-2 rounded-sm hover:bg-amber-50 transition-colors">
            Add
          </button>
        </div>
      </EditorField>

      <EditorField label="Description / Notes" required>
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={4}
          placeholder="What this endpoint does, quirks, rate limits, notes…"
        />
      </EditorField>

      <div className="grid grid-cols-2 gap-3">
        <EditorField label="Request Example">
          <EditorTextarea
            value={payload.requestExample ?? ""}
            onChange={(v) => field(setPayload, "requestExample", v || null)}
            rows={8} mono dark
            placeholder={'{\n  "key": "value"\n}'}
          />
        </EditorField>
        <EditorField label="Response Example">
          <EditorTextarea
            value={payload.responseExample ?? ""}
            onChange={(v) => field(setPayload, "responseExample", v || null)}
            rows={8} mono dark
            placeholder={'{\n  "id": "abc",\n  "status": "ok"\n}'}
          />
        </EditorField>
      </div>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PATTERN EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

export function PatternEditor({ payload, setPayload }: TypeEditorProps) {
  const relatedTech = parseJson<string[]>(payload.relatedTech, []);
  const [techInput, setTechInput] = useState("");

  const addTech = () => {
    const t = techInput.trim();
    if (t && !relatedTech.includes(t)) {
      field(setPayload, "relatedTech", JSON.stringify([...relatedTech, t]));
    }
    setTechInput("");
  };

  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="pattern" />

      <EditorField label="Overview / Description" required>
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={8}
          placeholder="Describe the architecture pattern, how it works, and the core principles behind it…"
        />
      </EditorField>

      <div className="grid grid-cols-2 gap-3">
        <EditorField label="Advantages">
          <EditorTextarea
            value={payload.advantages ?? ""}
            onChange={(v) => field(setPayload, "advantages", v || null)}
            rows={6}
            placeholder={"- Scales horizontally\n- Independent deployments\n- Technology agnostic"}
          />
        </EditorField>
        <EditorField label="Disadvantages">
          <EditorTextarea
            value={payload.disadvantages ?? ""}
            onChange={(v) => field(setPayload, "disadvantages", v || null)}
            rows={6}
            placeholder={"- Operational complexity\n- Network overhead\n- Distributed tracing harder"}
          />
        </EditorField>
      </div>

      <EditorField label="Example Use Cases">
        <EditorTextarea
          value={payload.useCases ?? ""}
          onChange={(v) => field(setPayload, "useCases", v || null)}
          rows={5}
          placeholder={"- Large e-commerce platform with separate services\n- SaaS with tenant isolation\n- High-traffic APIs"}
        />
      </EditorField>

      <EditorField label="Related Technologies">
        <div className="flex flex-wrap gap-1.5 mb-2">
          {relatedTech.map((t) => (
            <span key={t} className="inline-flex items-center gap-1 text-[11px] font-semibold bg-indigo-50 text-indigo-700 px-2.5 py-1 rounded-sm">
              {t}
              <button onClick={() => field(setPayload, "relatedTech", JSON.stringify(relatedTech.filter((x) => x !== t)))}
                className="hover:text-red-500 transition-colors"><Trash2 className="w-2.5 h-2.5" /></button>
            </span>
          ))}
        </div>
        <div className="flex gap-2">
          <input value={techInput} onChange={(e) => setTechInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); addTech(); } }}
            placeholder="Docker, Kubernetes, GraphQL…"
            className="flex-1 text-xs border border-stone-200 rounded-sm px-3 py-2 focus:outline-none focus:border-amber-400"
          />
          <button onClick={addTech}
            className="text-xs font-bold text-indigo-600 border border-indigo-200 px-3 py-2 rounded-sm hover:bg-indigo-50 transition-colors">
            Add
          </button>
        </div>
      </EditorField>

      <EditorField label="Diagram URL" hint="(optional — Cloudinary or external image)">
        <EditorInput
          value={payload.diagramUrl ?? ""}
          onChange={(v) => field(setPayload, "diagramUrl", v || null)}
          placeholder="https://…"
        />
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// TEMPLATE EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

const TEMPLATE_TYPES = [
  "README", "API Documentation", "Bug Report", "PR Template",
  "Architecture Decision Record", "Startup Pitch", "Project Brief",
  "Changelog", "Onboarding", "Post-Mortem", "Other",
];

export function TemplateEditor({ payload, setPayload }: TypeEditorProps) {
  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="template" />

      <EditorField label="Template Type">
        <EditorSelect
          value={payload.templateType ?? ""}
          onChange={(v) => field(setPayload, "templateType", v || null)}
        >
          <option value="">— select type —</option>
          {TEMPLATE_TYPES.map((t) => <option key={t} value={t}>{t}</option>)}
        </EditorSelect>
      </EditorField>

      <EditorField label="Template Content" required
        hint="(use {{VARIABLE}} for placeholders)">
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={24}
          mono
          placeholder={"# {{PROJECT_NAME}}\n\n## Overview\n\n{{DESCRIPTION}}\n\n## Installation\n\n```bash\nnpm install\n```\n\n## Usage\n\n..."}
        />
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// PLAYBOOK EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

export function PlaybookEditor({ payload, setPayload }: TypeEditorProps) {
  const steps = parseJson<PlaybookStep[]>(payload.steps, []);

  const addStep = () => {
    const newStep: PlaybookStep = {
      order:       steps.length + 1,
      title:       "",
      description: "",
      command:     "",
      note:        "",
    };
    field(setPayload, "steps", JSON.stringify([...steps, newStep]));
  };

  const updateStep = (index: number, partial: Partial<PlaybookStep>) => {
    const updated = steps.map((s, i) => i === index ? { ...s, ...partial } : s);
    field(setPayload, "steps", JSON.stringify(updated));
  };

  const removeStep = (index: number) => {
    const updated = steps
      .filter((_, i) => i !== index)
      .map((s, i) => ({ ...s, order: i + 1 }));
    field(setPayload, "steps", JSON.stringify(updated));
  };

  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="playbook" />

      <div className="grid grid-cols-2 gap-3">
        <EditorField label="Overview" required hint="(what this playbook achieves)">
          <EditorTextarea
            value={payload.content}
            onChange={(v) => field(setPayload, "content", v)}
            rows={3}
            placeholder="Step-by-step guide to deploying a Next.js app on Vercel with Prisma…"
          />
        </EditorField>
        <EditorField label="Estimated Time">
          <EditorInput
            value={payload.estimatedTime ?? ""}
            onChange={(v) => field(setPayload, "estimatedTime", v || null)}
            placeholder="~30 min, 1-2 hours…"
          />
        </EditorField>
      </div>

      {/* Steps */}
      <EditorField label="Steps">
        <div className="space-y-3 mb-3">
          {steps.map((step, i) => (
            <div key={i}
              className="border border-stone-200 rounded-sm overflow-hidden bg-stone-50">
              {/* Step header */}
              <div className="flex items-center gap-2 px-3 py-2 bg-stone-100 border-b border-stone-200">
                <GripVertical className="w-3.5 h-3.5 text-stone-400" />
                <span className="text-[10px] font-black text-stone-500 uppercase tracking-wide">
                  Step {step.order}
                </span>
                <input
                  value={step.title}
                  onChange={(e) => updateStep(i, { title: e.target.value })}
                  placeholder="Step title…"
                  className="flex-1 text-xs font-bold bg-transparent border-0 focus:outline-none text-stone-700"
                />
                <button onClick={() => removeStep(i)}
                  className="text-stone-300 hover:text-red-500 transition-colors flex-shrink-0">
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>
              {/* Step body */}
              <div className="p-3 space-y-2">
                <textarea
                  value={step.description}
                  onChange={(e) => updateStep(i, { description: e.target.value })}
                  rows={2}
                  placeholder="What to do in this step…"
                  className="w-full text-xs border border-stone-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 resize-none bg-white"
                />
                <input
                  value={step.command ?? ""}
                  onChange={(e) => updateStep(i, { command: e.target.value })}
                  placeholder="$ command (optional)"
                  className="w-full text-xs font-mono border border-stone-700 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-stone-900 text-stone-200"
                />
                <input
                  value={step.note ?? ""}
                  onChange={(e) => updateStep(i, { note: e.target.value })}
                  placeholder="⚠️ Note or warning (optional)"
                  className="w-full text-xs border border-amber-200 rounded-sm px-2.5 py-2 focus:outline-none focus:border-amber-400 bg-amber-50 text-amber-800 placeholder:text-amber-400"
                />
              </div>
            </div>
          ))}
        </div>
        <button onClick={addStep}
          className="flex items-center gap-2 text-xs font-bold text-stone-500 border border-dashed border-stone-300 px-4 py-3 rounded-sm hover:border-amber-400 hover:text-amber-600 transition-colors w-full justify-center">
          <Plus className="w-4 h-4" />Add Step
        </button>
      </EditorField>
    </div>
  );
}

// ═══════════════════════════════════════════════════════════════════════════════
// RESOURCE EDITOR
// ═══════════════════════════════════════════════════════════════════════════════

const RESOURCE_TYPES: ResourceType[] = [
  "DOCUMENTATION", "COURSE", "ARTICLE", "VIDEO", "TOOL", "BOOK", "PODCAST", "OTHER",
];

const RESOURCE_LABELS: Record<ResourceType, string> = {
  DOCUMENTATION: "📖 Documentation",
  COURSE:        "🎓 Course",
  ARTICLE:       "📝 Article",
  VIDEO:         "🎬 Video",
  TOOL:          "🔧 Tool",
  BOOK:          "📚 Book",
  PODCAST:       "🎙️ Podcast",
  OTHER:         "🔗 Other",
};

export function ResourceEditor({ payload, setPayload }: TypeEditorProps) {
  return (
    <div className="p-5 space-y-4">
      <UniversalFields payload={payload} setPayload={setPayload} type="resource" />

      <EditorField label="Resource Type">
        <EditorSelect
          value={payload.resourceType ?? ""}
          onChange={(v) => field(setPayload, "resourceType", v || null)}
        >
          <option value="">— select type —</option>
          {RESOURCE_TYPES.map((t) => <option key={t} value={t}>{RESOURCE_LABELS[t]}</option>)}
        </EditorSelect>
      </EditorField>

      <EditorField label="URL" required>
        <div className="flex gap-2">
          <EditorInput
            value={payload.resourceUrl ?? ""}
            onChange={(v) => field(setPayload, "resourceUrl", v || null)}
            placeholder="https://…"
            mono
          />
          {payload.resourceUrl && (
            <a href={payload.resourceUrl} target="_blank" rel="noopener noreferrer"
              className="flex items-center gap-1.5 text-xs text-blue-600 border border-blue-200 hover:bg-blue-50 px-3 py-2 rounded-sm transition-colors flex-shrink-0">
              <ExternalLink className="w-3.5 h-3.5" />Test
            </a>
          )}
        </div>
      </EditorField>

      <EditorField label="Author / Creator">
        <EditorInput
          value={payload.author ?? ""}
          onChange={(v) => field(setPayload, "author", v || null)}
          placeholder="Author name, company, or channel…"
        />
      </EditorField>

      <EditorField label="Description / Notes" required>
        <EditorTextarea
          value={payload.content}
          onChange={(v) => field(setPayload, "content", v)}
          rows={6}
          placeholder="What you'll learn, why it's valuable, and any notes on when to use it…"
        />
      </EditorField>

      <EditorField label="Rating">
        <div className="flex items-center gap-2">
          {[1, 2, 3, 4, 5].map((n) => (
            <button key={n} onClick={() => field(setPayload, "rating", n)}
              className={`text-2xl transition-transform hover:scale-110 ${
                (payload.rating ?? 0) >= n ? "opacity-100" : "opacity-25"
              }`}>
              ⭐
            </button>
          ))}
          {payload.rating && (
            <button onClick={() => field(setPayload, "rating", null)}
              className="text-xs text-stone-400 hover:text-stone-700 ml-2 transition-colors">
              Clear
            </button>
          )}
        </div>
      </EditorField>
    </div>
  );
}

// ─── Editor dispatcher ────────────────────────────────────────────────────────

// import type { HubType } from "../shared/hub-types";

export function TypeEditor({ payload, setPayload }: TypeEditorProps) {
  switch (payload.type) {
    case "SNIPPET":  return <SnippetEditor  payload={payload} setPayload={setPayload} />;
    case "PROMPT":   return <PromptEditor   payload={payload} setPayload={setPayload} />;
    case "COMMAND":  return <CommandEditor  payload={payload} setPayload={setPayload} />;
    case "ERROR":    return <ErrorEditor    payload={payload} setPayload={setPayload} />;
    case "NOTE":     return <NoteEditor     payload={payload} setPayload={setPayload} />;
    case "API":      return <ApiEditor      payload={payload} setPayload={setPayload} />;
    case "PATTERN":  return <PatternEditor  payload={payload} setPayload={setPayload} />;
    case "TEMPLATE": return <TemplateEditor payload={payload} setPayload={setPayload} />;
    case "PLAYBOOK": return <PlaybookEditor payload={payload} setPayload={setPayload} />;
    case "RESOURCE": return <ResourceEditor payload={payload} setPayload={setPayload} />;
    default:         return null;
  }
}
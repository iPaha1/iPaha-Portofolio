"use client";

// =============================================================================
// isaacpaha.com — Developer Hub: Card Body Components
// components/admin/hub/cards/card-bodies.tsx
//
// Each component renders the EXPANDED content of an entry card.
// The card header/shell is handled by EntryCard in entry-card.tsx.
// =============================================================================

import React, { useState } from "react";
import {
  ExternalLink, Sparkles, Check, 
} from "lucide-react";
import { CodeBlock } from "../_shared/code-block";
import { CopyBtn } from "../_shared/copy-button";
import { ProseBlock, FieldRow } from "../_shared/ui-atoms";
import {
  HTTP_METHOD_COLOR, RESOURCE_TYPE_CFG,
  parseJson, type HubEntry, type PlaybookStep, type ResourceType,
} from "../_shared/hub-types";

// ─── Snippet body ─────────────────────────────────────────────────────────────

export function SnippetBody({ entry }: { entry: HubEntry }) {
  return (
    <div className="space-y-2">
      {entry.framework && (
        <p className="text-[10px] text-stone-400">
          Framework: <span className="font-semibold text-stone-600">{entry.framework}</span>
        </p>
      )}
      <CodeBlock
        code={entry.content}
        language={entry.language ?? undefined}
        maxLines={20}
        entryId={entry.id}
      />
    </div>
  );
}

// ─── Prompt body ──────────────────────────────────────────────────────────────

export function PromptBody({ entry }: { entry: HubEntry }) {
  const [showOutput, setShowOutput] = useState(false);
  return (
    <div className="space-y-3">
      {entry.aiModel && (
        <div className="flex items-center gap-1.5 text-[11px] text-purple-600 bg-purple-50 border border-purple-200 px-3 py-1.5 rounded-sm w-fit">
          <Sparkles className="w-3 h-3" />
          <span className="font-semibold">{entry.aiModel}</span>
        </div>
      )}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Prompt</span>
          <CopyBtn text={entry.content} entryId={entry.id} size="xs" label="Copy prompt" />
        </div>
        <ProseBlock content={entry.content} />
      </div>
      {entry.exampleOutput && (
        <div>
          <button onClick={() => setShowOutput((p) => !p)}
            className="flex items-center gap-1.5 text-[10px] font-bold text-purple-600 hover:text-purple-800 transition-colors mb-2">
            <Sparkles className="w-3 h-3" />
            {showOutput ? "Hide" : "Show"} example output
          </button>
          {showOutput && (
            <div className="bg-purple-50 border border-purple-200 rounded-sm p-3">
              <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">
                {entry.exampleOutput}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ─── Command body ─────────────────────────────────────────────────────────────

export function CommandBody({ entry }: { entry: HubEntry }) {
  return (
    <CodeBlock
      code={entry.content}
      language="BASH"
      maxLines={10}
      entryId={entry.id}
    />
  );
}

// ─── Error body ───────────────────────────────────────────────────────────────

export function ErrorBody({ entry }: { entry: HubEntry }) {
  return (
    <div className="space-y-3">
      {entry.technology && (
        <span className="text-[10px] font-semibold bg-red-50 text-red-500 border border-red-200 px-2 py-0.5 rounded-sm">
          {entry.technology}
        </span>
      )}
      {entry.errorMessage && (
        <div>
          <p className="text-[10px] font-black text-red-400 uppercase tracking-wider mb-1.5">Error Message</p>
          <CodeBlock code={entry.errorMessage} language="BASH" maxLines={6} />
        </div>
      )}
      {entry.content && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Problem Description</p>
          <ProseBlock content={entry.content} />
        </div>
      )}
      {entry.solution && (
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <p className="text-[10px] font-black text-emerald-600 uppercase tracking-wider">Solution</p>
            <CopyBtn text={entry.solution} entryId={entry.id} size="xs" label="Copy fix" />
          </div>
          <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3">
            <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{entry.solution}</pre>
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Note body ────────────────────────────────────────────────────────────────

export function NoteBody({ entry }: { entry: HubEntry }) {
  const refs = parseJson<string[]>(entry.references, []);
  return (
    <div className="space-y-3">
      {entry.difficulty && (
        <span className={`text-[10px] font-bold px-2 py-0.5 rounded-sm ${
          entry.difficulty === "Beginner"     ? "bg-emerald-50 text-emerald-700" :
          entry.difficulty === "Intermediate" ? "bg-amber-50 text-amber-700" :
          entry.difficulty === "Advanced"     ? "bg-orange-50 text-orange-700" :
          "bg-red-50 text-red-700"
        }`}>
          {entry.difficulty}
        </span>
      )}
      <ProseBlock content={entry.content} />
      {refs.length > 0 && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">References</p>
          <div className="space-y-1">
            {refs.map((r, i) => (
              <a key={i} href={r} target="_blank" rel="noopener noreferrer"
                className="flex items-center gap-2 text-xs text-blue-600 hover:underline bg-blue-50 border border-blue-200 px-3 py-2 rounded-sm">
                <ExternalLink className="w-3 h-3 flex-shrink-0" />
                <span className="truncate">{r}</span>
              </a>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── API body ─────────────────────────────────────────────────────────────────

export function ApiBody({ entry }: { entry: HubEntry }) {
  const headers = parseJson<Record<string, string>>(entry.apiHeaders, {});
  const method  = (entry.httpMethod ?? "GET") as string;
  const methodColor = HTTP_METHOD_COLOR[method] ?? "#6b7280";

  return (
    <div className="space-y-3">
      {/* Endpoint */}
      {entry.endpointUrl && (
        <div className="flex items-center gap-2 bg-stone-950 border border-stone-700 rounded-sm px-3 py-2.5">
          <span className="text-xs font-black px-2 py-0.5 rounded-sm flex-shrink-0"
            style={{ color: methodColor, backgroundColor: `${methodColor}22` }}>
            {method}
          </span>
          <span className="text-xs font-mono text-stone-300 flex-1 truncate">{entry.endpointUrl}</span>
          <CopyBtn text={entry.endpointUrl} size="xs" />
        </div>
      )}

      {/* Auth + meta */}
      <div className="grid grid-cols-2 gap-2">
        {entry.authType && (
          <FieldRow label="Auth" value={entry.authType} />
        )}
      </div>

      {/* Description */}
      {entry.content && <ProseBlock content={entry.content} />}

      {/* Headers */}
      {Object.keys(headers).length > 0 && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Headers</p>
          <div className="bg-stone-950 border border-stone-700 rounded-sm p-3 space-y-1">
            {Object.entries(headers).map(([k, v]) => (
              <div key={k} className="flex items-center gap-2 text-[11px] font-mono">
                <span className="text-blue-400 font-bold">{k}:</span>
                <span className="text-stone-400">{v}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Request / Response */}
      <div className="grid grid-cols-2 gap-3">
        {entry.requestExample && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Request</p>
            <CodeBlock code={entry.requestExample} language="JSON" maxLines={8} entryId={entry.id} />
          </div>
        )}
        {entry.responseExample && (
          <div>
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Response</p>
            <CodeBlock code={entry.responseExample} language="JSON" maxLines={8} />
          </div>
        )}
      </div>
    </div>
  );
}

// ─── Pattern body ─────────────────────────────────────────────────────────────

export function PatternBody({ entry }: { entry: HubEntry }) {
  const relatedTech = parseJson<string[]>(entry.relatedTech, []);

  return (
    <div className="space-y-3">
      {entry.diagramUrl && (
        <img src={entry.diagramUrl} alt={`${entry.title} diagram`}
          className="w-full max-h-64 object-contain border border-stone-200 rounded-sm bg-stone-50 p-2"
        />
      )}
      <ProseBlock content={entry.content} />
      {(entry.advantages || entry.disadvantages) && (
        <div className="grid grid-cols-2 gap-3">
          {entry.advantages && (
            <div className="bg-emerald-50 border border-emerald-200 rounded-sm p-3">
              <p className="text-[10px] font-black text-emerald-700 uppercase tracking-wider mb-2">✓ Advantages</p>
              <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{entry.advantages}</pre>
            </div>
          )}
          {entry.disadvantages && (
            <div className="bg-red-50 border border-red-200 rounded-sm p-3">
              <p className="text-[10px] font-black text-red-600 uppercase tracking-wider mb-2">✗ Disadvantages</p>
              <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-sans">{entry.disadvantages}</pre>
            </div>
          )}
        </div>
      )}
      {entry.useCases && (
        <div>
          <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-1.5">Use Cases</p>
          <ProseBlock content={entry.useCases} />
        </div>
      )}
      {relatedTech.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {relatedTech.map((t) => (
            <span key={t} className="text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded-sm border border-indigo-200">
              {t}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Template body ────────────────────────────────────────────────────────────

export function TemplateBody({ entry }: { entry: HubEntry }) {
  return (
    <div className="space-y-2">
      {entry.templateType && (
        <span className="text-[10px] font-bold bg-orange-50 text-orange-700 border border-orange-200 px-2 py-0.5 rounded-sm">
          {entry.templateType}
        </span>
      )}
      <div className="flex items-center justify-between mb-1">
        <span className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Template</span>
        <CopyBtn text={entry.content} entryId={entry.id} size="xs" label="Copy template" />
      </div>
      <div className="bg-stone-50 border border-stone-200 rounded-sm p-4 max-h-96 overflow-y-auto">
        <pre className="text-xs text-stone-700 whitespace-pre-wrap leading-relaxed font-mono">{entry.content}</pre>
      </div>
    </div>
  );
}

// ─── Playbook body ────────────────────────────────────────────────────────────

export function PlaybookBody({ entry }: { entry: HubEntry }) {
  const steps = parseJson<PlaybookStep[]>(entry.steps, []);
  const [completedSteps, setCompletedSteps] = useState<Set<number>>(new Set());

  const toggleStep = (order: number) => {
    setCompletedSteps((prev) => {
      const next = new Set(prev);
      if (prev.has(order)) {
        next.delete(order);
      } else {
        next.add(order);
      }
      return next;
    });
  };

  return (
    <div className="space-y-3">
      {entry.content && <ProseBlock content={entry.content} />}
      {entry.estimatedTime && (
        <div className="flex items-center gap-1.5 text-[11px] text-stone-500 bg-stone-100 px-3 py-1.5 rounded-sm w-fit">
          <span>⏱</span> Estimated: <span className="font-semibold">{entry.estimatedTime}</span>
        </div>
      )}
      {steps.length > 0 && (
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider">Steps</p>
            <span className="text-[10px] text-stone-400">
              {completedSteps.size}/{steps.length} complete
            </span>
          </div>
          {/* Progress bar */}
          <div className="h-1 bg-stone-100 rounded-full mb-3 overflow-hidden">
            <div
              className="h-full bg-emerald-400 rounded-full transition-all duration-300"
              style={{ width: `${steps.length > 0 ? (completedSteps.size / steps.length) * 100 : 0}%` }}
            />
          </div>
          <div className="space-y-2">
            {steps.map((step) => {
              const done = completedSteps.has(step.order);
              return (
                <div key={step.order}
                  className={`border rounded-sm overflow-hidden transition-all ${
                    done ? "border-emerald-200 bg-emerald-50/40" : "border-stone-200 bg-white"
                  }`}>
                  <button
                    onClick={() => toggleStep(step.order)}
                    className="flex items-center gap-3 px-3 py-2.5 w-full text-left hover:bg-stone-50/60 transition-colors"
                  >
                    <span className={`w-5 h-5 rounded-full border-2 flex items-center justify-center flex-shrink-0 transition-colors ${
                      done ? "border-emerald-500 bg-emerald-500" : "border-stone-300"
                    }`}>
                      {done && <Check className="w-3 h-3 text-white" />}
                    </span>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-[10px] font-black text-stone-400">Step {step.order}</span>
                        <span className={`text-xs font-bold ${done ? "text-stone-400 line-through" : "text-stone-700"}`}>
                          {step.title}
                        </span>
                      </div>
                      {step.description && (
                        <p className="text-[11px] text-stone-500 mt-0.5 leading-snug">{step.description}</p>
                      )}
                    </div>
                  </button>
                  {(step.command || step.note) && (
                    <div className="px-3 pb-2.5 space-y-1.5 border-t border-stone-100">
                      {step.command && (
                        <div className="flex items-center gap-2 bg-stone-950 rounded-sm px-3 py-2 mt-2">
                          <span className="text-emerald-400 font-mono text-xs">$</span>
                          <code className="text-stone-200 text-xs font-mono flex-1">{step.command}</code>
                          <CopyBtn text={step.command} size="xs" />
                        </div>
                      )}
                      {step.note && (
                        <div className="flex items-start gap-2 bg-amber-50 border border-amber-200 rounded-sm px-3 py-2">
                          <span className="text-amber-500 text-xs flex-shrink-0">⚠️</span>
                          <span className="text-xs text-amber-800 leading-snug">{step.note}</span>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}
    </div>
  );
}

// ─── Resource body ────────────────────────────────────────────────────────────

export function ResourceBody({ entry }: { entry: HubEntry }) {
  const resType = (entry.resourceType ?? "OTHER") as ResourceType;
  const typeCfg = RESOURCE_TYPE_CFG[resType];

  return (
    <div className="space-y-3">
      <div className="flex items-center gap-3 flex-wrap">
        {entry.resourceType && (
          <span className="text-[11px] font-bold bg-lime-50 text-lime-700 border border-lime-200 px-2 py-0.5 rounded-sm">
            {typeCfg?.emoji} {typeCfg?.label}
          </span>
        )}
        {entry.author && (
          <span className="text-[11px] text-stone-500">by <strong>{entry.author}</strong></span>
        )}
        {entry.rating && (
          <span className="text-[11px]">
            {"⭐".repeat(entry.rating)}
            <span className="text-stone-400 ml-1 text-[10px]">({entry.rating}/5)</span>
          </span>
        )}
      </div>

      {entry.resourceUrl && (
        <a href={entry.resourceUrl} target="_blank" rel="noopener noreferrer"
          className="flex items-center gap-2 bg-blue-50 border border-blue-200 hover:bg-blue-100 transition-colors px-4 py-3 rounded-sm group">
          <ExternalLink className="w-4 h-4 text-blue-500 flex-shrink-0" />
          <span className="text-sm font-semibold text-blue-700 group-hover:underline truncate">
            {entry.resourceUrl}
          </span>
        </a>
      )}

      {entry.content && <ProseBlock content={entry.content} />}
    </div>
  );
}

// ─── Card body dispatcher ─────────────────────────────────────────────────────

export function CardBody({ entry }: { entry: HubEntry }) {
  switch (entry.type) {
    case "SNIPPET":  return <SnippetBody  entry={entry} />;
    case "PROMPT":   return <PromptBody   entry={entry} />;
    case "COMMAND":  return <CommandBody  entry={entry} />;
    case "ERROR":    return <ErrorBody    entry={entry} />;
    case "NOTE":     return <NoteBody     entry={entry} />;
    case "API":      return <ApiBody      entry={entry} />;
    case "PATTERN":  return <PatternBody  entry={entry} />;
    case "TEMPLATE": return <TemplateBody entry={entry} />;
    case "PLAYBOOK": return <PlaybookBody entry={entry} />;
    case "RESOURCE": return <ResourceBody entry={entry} />;
    default:         return null;
  }
}
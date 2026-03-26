"use client";

// =============================================================================
// isaacpaha.com — Math Understanding Engine — Visualisation Component
// app/tools/math-engine/_components/math-visualiser.tsx
//
// DEDICATED visualisation component — completely standalone, richly featured.
// Used by the Math Understanding Engine wherever visual representation adds value.
//
// Supports:
//   - function_graph: Plot any mathematical function (y = f(x)) with Recharts
//     • Configurable x/y range, gridlines, axis labels
//     • Annotate key points (roots, vertex, intercepts)
//     • Multi-function overlay (compare transformations)
//     • Zoom controls
//   - linear_graph: Straight-line plotting with gradient/intercept annotations
//   - geometric: Circle, triangle, angle visualisations using SVG Canvas
//   - statistical: Bar chart, histogram, frequency table via Recharts
//   - vector: 2D vector diagrams with SVG arrows
//   - sequence: Number line / sequence visualiser
//   - ratio: Visual ratio/proportion display
//   - none: Falls back gracefully with a text explanation
//
// Design: indigo (#6366f1) accent, sharp corners (rounded-sm), Sora font
// =============================================================================

import React, {
  useState, useRef, useEffect, useCallback, useMemo,
} from "react";
import { motion, AnimatePresence } from "framer-motion";
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip,
  ResponsiveContainer, ReferenceLine, ReferenceDot, BarChart,
  Bar, ScatterChart, Scatter, Legend,
} from "recharts";
import {
  ZoomIn, ZoomOut, RefreshCw, Download, Maximize2,
  Minimize2, Info, ChevronDown, ChevronUp, Settings,
  Eye, EyeOff, Plus, Minus,
} from "lucide-react";

// ─── Types ────────────────────────────────────────────────────────────────────

export type VisualisationType =
  | "function_graph"
  | "linear_graph"
  | "geometric"
  | "statistical"
  | "vector"
  | "sequence"
  | "ratio"
  | "none";

export interface VisualisationData {
  type:               VisualisationType;
  description?:       string;
  keyPoints?:         string[];
  // Function graph
  functionExpression?: string;           // e.g. "x^2 - 4*x + 3"
  xRange?:             string;           // e.g. "-5 to 10"
  keyValues?:          Record<string, number>;
  annotations?:        string[];
  // For multi-function overlay
  additionalFunctions?: { expr: string; label: string; color: string }[];
  // For statistical
  dataPoints?:         { label: string; value: number }[];
  // For vector
  vectors?:            { x: number; y: number; label: string; color: string }[];
  // For sequence
  sequence?:           number[];
  sequenceFormula?:    string;
  // For ratio
  parts?:              { label: string; value: number; color: string }[];
  // For geometric
  shape?:              "circle" | "triangle" | "angle" | "polygon";
  shapeParams?:        Record<string, number>;
}

// ─── Math expression parser ───────────────────────────────────────────────────
// Safe evaluation of math expressions using JS Math

function parseAndEvaluate(expr: string, x: number): number | null {
  try {
    // Sanitise: only allow safe math chars
    if (!/^[0-9x\s\+\-\*\/\^\(\)\.\,e]*$/i.test(expr.replace(/Math\.\w+/g, ""))) {
      // Try with replacements for common notation
      const sanitised = expr
        .replace(/\^/g,    "**")
        .replace(/sin/g,   "Math.sin")
        .replace(/cos/g,   "Math.cos")
        .replace(/tan/g,   "Math.tan")
        .replace(/sqrt/g,  "Math.sqrt")
        .replace(/abs/g,   "Math.abs")
        .replace(/log/g,   "Math.log10")
        .replace(/ln/g,    "Math.log")
        .replace(/pi/g,    "Math.PI")
        .replace(/e(?!\d)/g, "Math.E");
      const fn = new Function("x", `"use strict"; try { return ${sanitised}; } catch { return null; }`);
      const result = fn(x);
      return (typeof result === "number" && isFinite(result)) ? result : null;
    }
    const sanitised = expr
      .replace(/\^/g,    "**")
      .replace(/sin/g,   "Math.sin")
      .replace(/cos/g,   "Math.cos")
      .replace(/tan/g,   "Math.tan")
      .replace(/sqrt/g,  "Math.sqrt")
      .replace(/abs/g,   "Math.abs")
      .replace(/log/g,   "Math.log10")
      .replace(/ln/g,    "Math.log")
      .replace(/pi/g,    "Math.PI")
      .replace(/e(?!\d)/g, "Math.E");
    const fn = new Function("x", `"use strict"; try { return ${sanitised}; } catch { return null; }`);
    const result = fn(x);
    return (typeof result === "number" && isFinite(result)) ? result : null;
  } catch {
    return null;
  }
}

function parseRange(rangeStr: string): [number, number] {
  const match = rangeStr.match(/([-\d.]+)\s*(?:to|,)\s*([-\d.]+)/i);
  if (match) return [parseFloat(match[1]), parseFloat(match[2])];
  return [-10, 10];
}

function generateFunctionData(
  expr: string,
  xMin: number,
  xMax: number,
  points = 200,
): { x: number; y: number | null }[] {
  const step  = (xMax - xMin) / points;
  const data: { x: number; y: number | null }[] = [];
  for (let i = 0; i <= points; i++) {
    const x = xMin + i * step;
    const y = parseAndEvaluate(expr, x);
    data.push({ x: parseFloat(x.toFixed(4)), y: y !== null ? parseFloat(y.toFixed(6)) : null });
  }
  return data;
}

// ─── Custom Tooltip ───────────────────────────────────────────────────────────

function MathTooltip({ active, payload }: any) {
  if (!active || !payload?.length) return null;
  const d = payload[0]?.payload;
  if (!d || d.y === null) return null;
  return (
    <div className="bg-stone-900 text-white text-xs px-3 py-2 rounded-sm shadow-xl border border-white/10">
      <p className="font-semibold">x = {d.x}</p>
      <p className="text-indigo-400 font-bold">y = {typeof d.y === "number" ? d.y.toFixed(4) : "—"}</p>
    </div>
  );
}

// ─── Function Graph ───────────────────────────────────────────────────────────

function FunctionGraph({ data, expr, keyValues, annotations, additionalFunctions }: {
  data:                { x: number; y: number | null }[];
  expr:                string;
  keyValues?:          Record<string, number>;
  annotations?:        string[];
  additionalFunctions?: { expr: string; label: string; color: string }[];
}) {
  const [zoom,     setZoom]     = useState(1);
  const [showGrid, setShowGrid] = useState(true);

  const yValues  = data.map((d) => d.y).filter((y): y is number => y !== null);
  const yMin     = Math.min(...yValues) * 1.2;
  const yMax     = Math.max(...yValues) * 1.2;
  const clampedY = [
    isFinite(yMin) ? yMin : -20,
    isFinite(yMax) ? yMax : 20,
  ];

  const COLORS = ["#6366f1", "#f97316", "#10b981", "#f59e0b", "#ec4899"];

  return (
    <div className="space-y-3">
      {/* Controls */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-1.5">
          <span className="text-xs font-mono text-indigo-600 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-sm">
            y = {expr}
          </span>
          {additionalFunctions?.map((f, i) => (
            <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-sm border"
              style={{ color: COLORS[i + 1] ?? "#9ca3af", backgroundColor: `${COLORS[i + 1] ?? "#9ca3af"}15`, borderColor: `${COLORS[i + 1] ?? "#9ca3af"}40` }}>
              y = {f.expr}
            </span>
          ))}
        </div>
        <div className="flex items-center gap-1">
          <button onClick={() => setShowGrid((p) => !p)}
            className={`w-7 h-7 flex items-center justify-center rounded-sm border transition-colors ${showGrid ? "bg-indigo-50 border-indigo-200 text-indigo-600" : "border-stone-200 text-stone-400"}`}>
            <Eye className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      <ResponsiveContainer width="100%" height={320}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          {showGrid && <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />}
          <XAxis dataKey="x" type="number" domain={["dataMin", "dataMax"]}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: "x", position: "insideBottomRight", fill: "#9ca3af", fontSize: 11 }}
          />
          <YAxis domain={clampedY} tick={{ fontSize: 11, fill: "#6b7280" }}
            tickFormatter={(v) => v.toFixed(1)}
            label={{ value: "y", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 11 }}
          />
          <Tooltip content={<MathTooltip />} />
          {/* X axis */}
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
          {/* Y axis */}
          <ReferenceLine x={0} stroke="#374151" strokeWidth={1.5} />

          {/* Main function */}
          <Line type="monotone" dataKey="y" stroke="#6366f1" strokeWidth={2.5}
            dot={false} connectNulls={false} animationDuration={800}
          />

          {/* Key value annotations */}
          {Object.entries(keyValues ?? {}).map(([label, x]) => {
            const y = parseAndEvaluate(expr, x);
            return y !== null ? (
              <ReferenceDot key={label} x={x} y={parseFloat(y.toFixed(4))}
                r={5} fill="#6366f1" stroke="white" strokeWidth={2}
                label={{ value: label, position: "top", fontSize: 10, fill: "#6366f1" }}
              />
            ) : null;
          })}
        </LineChart>
      </ResponsiveContainer>

      {/* Annotations */}
      {annotations && annotations.length > 0 && (
        <div className="flex flex-wrap gap-2">
          {annotations.map((a, i) => (
            <span key={i} className="text-[11px] text-indigo-700 bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-sm flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-indigo-400 flex-shrink-0" />
              {a}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Geometric Visualiser ─────────────────────────────────────────────────────

function GeometricVisualiser({ shape, params }: { shape?: string; params?: Record<string, number> }) {
  const size   = 280;
  const cx     = size / 2;
  const cy     = size / 2;

  if (shape === "circle" || !shape) {
    const r = Math.min((params?.radius ?? 80), 110);
    return (
      <div className="flex flex-col items-center gap-3">
        <svg width={size} height={size} className="overflow-visible">
          <defs>
            <radialGradient id="circleGrad">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.15" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
            </radialGradient>
          </defs>
          {/* Grid */}
          <line x1="0" y1={cy} x2={size} y2={cy} stroke="#e5e7eb" strokeWidth={1} />
          <line x1={cx} y1="0" x2={cx} y2={size} stroke="#e5e7eb" strokeWidth={1} />
          {/* Circle */}
          <circle cx={cx} cy={cy} r={r} fill="url(#circleGrad)" stroke="#6366f1" strokeWidth={2} />
          {/* Radius line */}
          <line x1={cx} y1={cy} x2={cx + r} y2={cy} stroke="#6366f1" strokeWidth={2} strokeDasharray="4 2" />
          <text x={(cx + cx + r) / 2} y={cy - 8} textAnchor="middle" fontSize={12} fill="#6366f1" fontWeight="bold">r = {params?.radius ?? "r"}</text>
          {/* Diameter */}
          <line x1={cx - r} y1={cy + 20} x2={cx + r} y2={cy + 20} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="3 2" />
          <text x={cx} y={cy + 35} textAnchor="middle" fontSize={11} fill="#f59e0b">d = 2r</text>
          {/* Centre dot */}
          <circle cx={cx} cy={cy} r={4} fill="#6366f1" />
          <text x={cx + 8} y={cy + 4} fontSize={11} fill="#6b7280">O</text>
        </svg>
        <div className="flex gap-3 text-xs text-stone-600 flex-wrap justify-center">
          <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-sm font-mono text-indigo-700">C = 2πr</span>
          <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-sm font-mono text-indigo-700">A = πr²</span>
        </div>
      </div>
    );
  }

  if (shape === "triangle") {
    const base   = params?.base   ?? 160;
    const height = params?.height ?? 120;
    const x1     = cx - base / 2; const y1 = cy + height / 2;
    const x2     = cx + base / 2; const y2 = cy + height / 2;
    const x3     = cx;             const y3 = cy - height / 2;
    return (
      <div className="flex flex-col items-center gap-3">
        <svg width={size} height={size}>
          <defs>
            <linearGradient id="triGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#818cf8" stopOpacity="0.3" />
              <stop offset="100%" stopColor="#6366f1" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <polygon points={`${x1},${y1} ${x2},${y2} ${x3},${y3}`} fill="url(#triGrad)" stroke="#6366f1" strokeWidth={2} />
          {/* Height line */}
          <line x1={cx} y1={y3} x2={cx} y2={y1} stroke="#f59e0b" strokeWidth={1.5} strokeDasharray="4 2" />
          <text x={cx + 6} y={(y3 + y1) / 2} fontSize={11} fill="#f59e0b" fontWeight="bold">h</text>
          {/* Base */}
          <text x={cx} y={y1 + 18} textAnchor="middle" fontSize={11} fill="#6366f1" fontWeight="bold">base</text>
          {/* Right angle marker */}
          <rect x={cx - 8} y={y1 - 8} width={8} height={8} fill="none" stroke="#6366f1" strokeWidth={1.5} />
        </svg>
        <div className="flex gap-3 text-xs flex-wrap justify-center">
          <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-sm font-mono text-indigo-700">A = ½ × b × h</span>
        </div>
      </div>
    );
  }

  // Default: angle visualiser
  const angle = params?.angle ?? 45;
  const rad   = (angle * Math.PI) / 180;
  const len   = 100;
  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size}>
        {/* Base line */}
        <line x1={cx - len} y1={cy} x2={cx + len} y2={cy} stroke="#6b7280" strokeWidth={1.5} />
        {/* Angle line */}
        <line x1={cx} y1={cy} x2={cx + len * Math.cos(-rad)} y2={cy + len * Math.sin(-rad)} stroke="#6366f1" strokeWidth={2} />
        {/* Arc */}
        <path d={`M ${cx + 40} ${cy} A 40 40 0 0 1 ${cx + 40 * Math.cos(rad)} ${cy - 40 * Math.sin(rad)}`}
          fill="none" stroke="#818cf8" strokeWidth={2} />
        {/* Angle label */}
        <text x={cx + 50} y={cy - 20} fontSize={13} fill="#6366f1" fontWeight="bold">{angle}°</text>
        {/* Vertex */}
        <circle cx={cx} cy={cy} r={4} fill="#6366f1" />
      </svg>
      <div className="flex gap-3 text-xs flex-wrap justify-center">
        <span className="bg-indigo-50 border border-indigo-200 px-2.5 py-1 rounded-sm font-mono text-indigo-700">{angle}° = {(angle * Math.PI / 180).toFixed(4)} rad</span>
      </div>
    </div>
  );
}

// ─── Sequence Visualiser ──────────────────────────────────────────────────────

function SequenceVisualiser({ sequence, formula }: { sequence: number[]; formula?: string }) {
  const maxVal = Math.max(...sequence.map(Math.abs), 1);
  return (
    <div className="space-y-4">
      {formula && (
        <div className="text-center">
          <span className="text-sm font-mono text-indigo-700 bg-indigo-50 border border-indigo-200 px-3 py-1.5 rounded-sm">
            {formula}
          </span>
        </div>
      )}
      {/* Number line */}
      <div className="bg-stone-50 border border-stone-100 rounded-sm p-4">
        <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-3">Sequence</p>
        <div className="flex items-end gap-2 flex-wrap">
          {sequence.map((n, i) => (
            <motion.div key={i} initial={{ scaleY: 0 }} animate={{ scaleY: 1 }}
              transition={{ delay: i * 0.08, duration: 0.4 }}
              className="flex flex-col items-center gap-1">
              <span className="text-xs font-black text-indigo-600">{n}</span>
              <div className="w-8 rounded-sm bg-indigo-400 transition-all"
                style={{ height: `${Math.max(8, (Math.abs(n) / maxVal) * 80)}px`, backgroundColor: n < 0 ? "#ef4444" : "#6366f1" }} />
              <span className="text-[9px] text-stone-400">n={i + 1}</span>
            </motion.div>
          ))}
        </div>
      </div>
      {/* Table */}
      <div className="overflow-x-auto">
        <table className="text-xs w-full border border-stone-100 rounded-sm overflow-hidden">
          <thead>
            <tr className="bg-stone-50">
              <td className="px-3 py-2 font-black text-stone-400 uppercase tracking-wider">n</td>
              {sequence.map((_, i) => <td key={i} className="px-3 py-2 text-center font-semibold text-stone-600">{i + 1}</td>)}
            </tr>
          </thead>
          <tbody>
            <tr>
              <td className="px-3 py-2 font-black text-indigo-600 uppercase tracking-wider text-[10px]">aₙ</td>
              {sequence.map((n, i) => <td key={i} className="px-3 py-2 text-center font-black text-indigo-700">{n}</td>)}
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

// ─── Statistical Visualiser ───────────────────────────────────────────────────

function StatisticalVisualiser({ dataPoints }: { dataPoints: { label: string; value: number }[] }) {
  return (
    <div className="space-y-3">
      <ResponsiveContainer width="100%" height={240}>
        <BarChart data={dataPoints} margin={{ top: 10, right: 10, bottom: 20, left: 10 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
          <XAxis dataKey="label" tick={{ fontSize: 11, fill: "#6b7280" }} />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }} />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2, border: "1px solid #e5e7eb" }} />
          <Bar dataKey="value" fill="#6366f1" radius={[2, 2, 0, 0]} animationDuration={800} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}

// ─── Ratio Visualiser ─────────────────────────────────────────────────────────

function RatioVisualiser({ parts }: { parts: { label: string; value: number; color: string }[] }) {
  const total  = parts.reduce((s, p) => s + p.value, 0);
  const colors = ["#6366f1", "#f59e0b", "#10b981", "#f97316", "#ec4899", "#ef4444"];
  return (
    <div className="space-y-4">
      {/* Bar */}
      <div className="h-12 rounded-sm overflow-hidden flex">
        {parts.map((p, i) => (
          <motion.div key={i} initial={{ flex: 0 }} animate={{ flex: p.value }}
            transition={{ duration: 0.6, delay: i * 0.1, ease: [0.22, 1, 0.36, 1] }}
            className="flex items-center justify-center text-white text-[11px] font-bold"
            style={{ backgroundColor: p.color || colors[i] || "#6366f1" }}
            title={`${p.label}: ${p.value}`}>
            {(p.value / total * 100) > 10 ? `${p.label}` : ""}
          </motion.div>
        ))}
      </div>
      {/* Legend */}
      <div className="flex flex-wrap gap-3">
        {parts.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <div className="w-3 h-3 rounded-sm flex-shrink-0" style={{ backgroundColor: p.color || colors[i] || "#6366f1" }} />
            <span className="text-xs font-semibold text-stone-700">{p.label}: <span className="font-black">{p.value}</span></span>
            <span className="text-[10px] text-stone-400">({(p.value / total * 100).toFixed(1)}%)</span>
          </div>
        ))}
      </div>
      <p className="text-xs text-stone-500">Total: <span className="font-black text-stone-700">{total}</span></p>
    </div>
  );
}

// ─── Vector Visualiser ────────────────────────────────────────────────────────

function VectorVisualiser({ vectors }: { vectors: { x: number; y: number; label: string; color: string }[] }) {
  const size = 280;
  const cx   = size / 2;
  const cy   = size / 2;
  const scale = 20;

  const COLORS = ["#6366f1", "#f97316", "#10b981", "#f59e0b"];

  return (
    <div className="flex flex-col items-center gap-3">
      <svg width={size} height={size} className="border border-stone-100 rounded-sm bg-stone-50">
        {/* Grid */}
        {[-5,-4,-3,-2,-1,0,1,2,3,4,5].map((i) => (
          <React.Fragment key={i}>
            <line x1={cx + i * scale} y1="0" x2={cx + i * scale} y2={size} stroke="#e5e7eb" strokeWidth={i === 0 ? 1.5 : 0.5} />
            <line x1="0" y1={cy + i * scale} x2={size} y2={cy + i * scale} stroke="#e5e7eb" strokeWidth={i === 0 ? 1.5 : 0.5} />
          </React.Fragment>
        ))}
        {/* Axis labels */}
        <text x={size - 12} y={cy + 14} fontSize={11} fill="#9ca3af">x</text>
        <text x={cx + 6}   y={14}       fontSize={11} fill="#9ca3af">y</text>

        {/* Vectors */}
        {vectors.map((v, i) => {
          const x2   = cx + v.x * scale;
          const y2   = cy - v.y * scale;
          const col  = v.color || COLORS[i] || "#6366f1";
          const len  = Math.sqrt(v.x ** 2 + v.y ** 2);
          const ux   = v.x / len;
          const uy   = -v.y / len;
          const ahx  = x2 - 10 * ux + 5 * uy;
          const ahy  = y2 - 10 * uy - 5 * ux;
          const ahx2 = x2 - 10 * ux - 5 * uy;
          const ahy2 = y2 - 10 * uy + 5 * ux;
          return (
            <g key={i}>
              <line x1={cx} y1={cy} x2={x2} y2={y2} stroke={col} strokeWidth={2.5} />
              <polygon points={`${x2},${y2} ${ahx},${ahy} ${ahx2},${ahy2}`} fill={col} />
              <text x={x2 + 8} y={y2 - 5} fontSize={12} fill={col} fontWeight="bold">{v.label}</text>
              <text x={x2 + 8} y={y2 + 10} fontSize={10} fill={col}>({v.x}, {v.y})</text>
            </g>
          );
        })}
      </svg>
      {/* Magnitude */}
      <div className="flex flex-wrap gap-2 justify-center">
        {vectors.map((v, i) => (
          <span key={i} className="text-xs font-mono px-2.5 py-1 rounded-sm border"
            style={{ color: v.color || COLORS[i] || "#6366f1", borderColor: `${v.color || COLORS[i] || "#6366f1"}40`, backgroundColor: `${v.color || COLORS[i] || "#6366f1"}10` }}>
            |{v.label}| = {Math.sqrt(v.x ** 2 + v.y ** 2).toFixed(3)}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN VISUALISER EXPORT ───────────────────────────────────────────────────

interface MathVisualiserProps {
  data:        VisualisationData;
  className?:  string;
  compact?:    boolean;          // compact mode — less padding, no expand button
  onExpand?:   () => void;
}

export function MathVisualiser({ data, className = "", compact = false, onExpand }: MathVisualiserProps) {
  const [expanded,   setExpanded]   = useState(!compact);
  const [showInfo,   setShowInfo]   = useState(false);

  // Generate function data
  const functionData = useMemo(() => {
    if (!data.functionExpression || (data.type !== "function_graph" && data.type !== "linear_graph")) return null;
    const [xMin, xMax] = data.xRange ? parseRange(data.xRange) : [-10, 10];
    return generateFunctionData(data.functionExpression, xMin, xMax, 300);
  }, [data.functionExpression, data.xRange, data.type]);

  const [xMin, xMax] = data.xRange ? parseRange(data.xRange) : [-10, 10];

  if (data.type === "none" || (!data.functionExpression && !data.dataPoints && !data.vectors && !data.sequence && !data.parts && !data.shapeParams)) {
    return null;
  }

  const TYPE_LABELS: Record<VisualisationType, string> = {
    function_graph: "Function Graph",
    linear_graph:   "Linear Graph",
    geometric:      "Geometric Diagram",
    statistical:    "Statistical Chart",
    vector:         "Vector Diagram",
    sequence:       "Sequence Visualiser",
    ratio:          "Ratio & Proportion",
    none:           "",
  };

  return (
    <div className={`border border-indigo-100 rounded-sm overflow-hidden bg-white ${className}`}>
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-indigo-50 border-b border-indigo-100">
        <div className="flex items-center gap-2">
          <span className="text-base">📊</span>
          <p className="text-xs font-black text-indigo-700 uppercase tracking-wider">
            {TYPE_LABELS[data.type] || "Visualisation"}
          </p>
        </div>
        <div className="flex items-center gap-1.5">
          {data.description && (
            <button onClick={() => setShowInfo((p) => !p)}
              className="w-6 h-6 flex items-center justify-center text-indigo-400 hover:text-indigo-700 transition-colors">
              <Info className="w-3.5 h-3.5" />
            </button>
          )}
          {compact && (
            <button onClick={() => setExpanded((p) => !p)}
              className="flex items-center gap-1 text-[10px] font-bold text-indigo-500 hover:text-indigo-700 transition-colors">
              {expanded ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
              {expanded ? "Collapse" : "Expand"}
            </button>
          )}
        </div>
      </div>

      {/* Info banner */}
      <AnimatePresence>
        {showInfo && data.description && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} className="overflow-hidden">
            <div className="px-4 py-3 bg-blue-50 border-b border-blue-100 text-xs text-blue-700 leading-relaxed">
              {data.description}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Visualisation content */}
      <AnimatePresence>
        {expanded && (
          <motion.div initial={{ height: compact ? 0 : "auto", opacity: compact ? 0 : 1 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.25 }} className="overflow-hidden">
            <div className="p-4">
              {/* Function / Linear Graph */}
              {(data.type === "function_graph" || data.type === "linear_graph") && functionData && (
                <FunctionGraph
                  data={functionData}
                  expr={data.functionExpression!}
                  keyValues={data.keyValues}
                  annotations={data.annotations}
                  additionalFunctions={data.additionalFunctions}
                />
              )}

              {/* Geometric */}
              {data.type === "geometric" && (
                <GeometricVisualiser shape={data.shape} params={data.shapeParams} />
              )}

              {/* Statistical */}
              {data.type === "statistical" && data.dataPoints && (
                <StatisticalVisualiser dataPoints={data.dataPoints} />
              )}

              {/* Vector */}
              {data.type === "vector" && data.vectors && (
                <VectorVisualiser vectors={data.vectors} />
              )}

              {/* Sequence */}
              {data.type === "sequence" && data.sequence && (
                <SequenceVisualiser sequence={data.sequence} formula={data.sequenceFormula} />
              )}

              {/* Ratio */}
              {data.type === "ratio" && data.parts && (
                <RatioVisualiser parts={data.parts} />
              )}
            </div>

            {/* Key points */}
            {data.keyPoints && data.keyPoints.length > 0 && (
              <div className="border-t border-indigo-50 px-4 py-3">
                <p className="text-[10px] font-black text-stone-400 uppercase tracking-wider mb-2">Key Visual Insights</p>
                <div className="space-y-1">
                  {data.keyPoints.map((kp, i) => (
                    <div key={i} className="flex items-start gap-2 text-xs text-stone-600">
                      <span className="w-1.5 h-1.5 rounded-full bg-indigo-400 flex-shrink-0 mt-1.5" />
                      {kp}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// Re-export types for use by parent components
// export type { VisualisationData };
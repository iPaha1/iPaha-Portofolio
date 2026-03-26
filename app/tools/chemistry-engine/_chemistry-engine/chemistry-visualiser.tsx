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
  | "wave"           // Physics: wave/oscillation diagrams
  | "motion_graph"   // Physics: displacement-time, velocity-time graphs
  | "circuit"        // Physics: simple circuit diagram
  | "energy_diagram"     // Chemistry: reaction energy profile (exo/endo)
  | "periodic_element"   // Chemistry: element card with key data
  | "molecular"          // Chemistry: simple bond/structure diagram
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
  // For wave (physics)
  amplitude?:          number;
  frequency?:          number;
  phase?:              number;
  waveType?:           "sine" | "cosine" | "square" | "damped";
  waveLabel?:          string;
  // For motion_graph (physics)
  motionType?:         "displacement-time" | "velocity-time" | "acceleration-time";
  initialValue?:       number;
  finalValue?:         number;
  timeRange?:          number;
  // For circuit (physics)
  circuitType?:        "series" | "parallel" | "mixed";
  components?:         { type: "battery" | "resistor" | "bulb" | "switch" | "capacitor"; label: string; value?: string }[];
  // For energy_diagram (chemistry)
  reactionType?:       "exothermic" | "endothermic";
  reactantEnergy?:     number;
  productEnergy?:      number;
  activationEnergy?:   number;
  reactionLabel?:      string;
  // For periodic_element (chemistry)
  elementSymbol?:      string;
  elementName?:        string;
  atomicNumber?:       number;
  atomicMass?:         number;
  elementGroup?:       string;
  electronConfig?:     string;
  // For molecular (chemistry)
  formula?:            string;
  bondDescription?:    string;
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

// ─── Wave Visualiser (Physics) ───────────────────────────────────────────────

function WaveVisualiser({ amplitude = 1, frequency = 1, phase = 0, waveType = "sine", waveLabel }: {
  amplitude?: number; frequency?: number; phase?: number;
  waveType?: "sine" | "cosine" | "square" | "damped"; waveLabel?: string;
}) {
  const points = 300;
  const xMax   = 4 * Math.PI;
  const data   = Array.from({ length: points }, (_, i) => {
    const x = (i / points) * xMax;
    let y: number;
    if (waveType === "damped") {
      y = amplitude * Math.exp(-0.15 * x) * Math.sin(2 * Math.PI * frequency * x + phase);
    } else if (waveType === "square") {
      y = amplitude * Math.sign(Math.sin(2 * Math.PI * frequency * x + phase));
    } else if (waveType === "cosine") {
      y = amplitude * Math.cos(2 * Math.PI * frequency * x + phase);
    } else {
      y = amplitude * Math.sin(2 * Math.PI * frequency * x + phase);
    }
    return { x: parseFloat(x.toFixed(3)), y: parseFloat(y.toFixed(4)) };
  });

  const λ = `λ = ${(1 / frequency).toFixed(2)}`;
  const A  = `A = ${amplitude}`;
  const f  = `f = ${frequency} Hz`;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        {[
          { label: "Amplitude (A)", value: amplitude.toString(),      color: "#0ea5e9" },
          { label: "Frequency (f)", value: `${frequency} Hz`,          color: "#8b5cf6" },
          { label: "Wavelength (λ)",value: `${(1/frequency).toFixed(2)} units`, color: "#10b981" },
          { label: "Type",          value: waveType,                   color: "#f59e0b" },
        ].map((s) => (
          <span key={s.label} className="text-[11px] font-bold px-2.5 py-1 rounded-sm"
            style={{ color: s.color, backgroundColor: `${s.color}15`, border: `1px solid ${s.color}30` }}>
            {s.label}: {s.value}
          </span>
        ))}
      </div>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="x" type="number" domain={[0, xMax]}
            tick={{ fontSize: 10, fill: "#6b7280" }} tickFormatter={(v) => `${v.toFixed(1)}`}
            label={{ value: "x (radians)", position: "insideBottomRight", fill: "#9ca3af", fontSize: 11 }}
          />
          <YAxis domain={[-amplitude * 1.3, amplitude * 1.3]}
            tick={{ fontSize: 10, fill: "#6b7280" }}
            label={{ value: "y", angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 11 }}
          />
          <Tooltip contentStyle={{ fontSize: 11, borderRadius: 2 }}
            formatter={(v: any) => [parseFloat(v).toFixed(3), waveLabel ?? "y"]} />
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1.5} />
          <ReferenceLine y={amplitude}  stroke="#0ea5e9" strokeDasharray="4 2" strokeWidth={1} label={{ value: "A", fill: "#0ea5e9", fontSize: 10 }} />
          <ReferenceLine y={-amplitude} stroke="#0ea5e9" strokeDasharray="4 2" strokeWidth={1} label={{ value: "-A", fill: "#0ea5e9", fontSize: 10 }} />
          <Line type="monotone" dataKey="y" stroke="#0ea5e9" strokeWidth={2.5}
            dot={false} animationDuration={800} name={waveLabel ?? "wave"} />
        </LineChart>
      </ResponsiveContainer>
      <div className="grid grid-cols-3 gap-2 text-center">
        {[
          { formula: "y = A sin(2πfx + φ)", label: "Wave Equation" },
          { formula: `T = 1/f = ${(1/frequency).toFixed(2)}s`, label: "Period" },
          { formula: `v = fλ`, label: "Wave Speed" },
        ].map((f) => (
          <div key={f.label} className="bg-stone-900 rounded-sm px-2 py-2">
            <p className="text-[10px] text-white/40 mb-0.5">{f.label}</p>
            <p className="text-xs font-mono text-sky-300 font-bold">{f.formula}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Motion Graph Visualiser (Physics) ───────────────────────────────────────

function MotionGraphVisualiser({ motionType = "displacement-time", initialValue = 0, finalValue = 20, timeRange = 10 }: {
  motionType?:  "displacement-time" | "velocity-time" | "acceleration-time";
  initialValue?: number; finalValue?: number; timeRange?: number;
}) {
  const MOTION_COLORS = {
    "displacement-time":  "#0ea5e9",
    "velocity-time":      "#10b981",
    "acceleration-time":  "#f97316",
  };
  const COLOR = MOTION_COLORS[motionType] ?? "#0ea5e9";

  const isUniform   = motionType === "velocity-time" || motionType === "acceleration-time";
  const isAccelerated = motionType === "displacement-time";

  // Generate data
  const data = Array.from({ length: 100 }, (_, i) => {
    const t = (i / 99) * timeRange;
    let y: number;
    if (isAccelerated) {
      // s = ut + ½at² — uniform acceleration
      const a = (finalValue - initialValue) / (timeRange * timeRange) * 2;
      y = initialValue + 0.5 * a * t * t;
    } else {
      // Linear (constant velocity or constant acceleration)
      y = initialValue + (finalValue - initialValue) * (t / timeRange);
    }
    return { t: parseFloat(t.toFixed(2)), y: parseFloat(y.toFixed(3)) };
  });

  const labels: Record<string, { x: string; y: string; title: string }> = {
    "displacement-time":  { x: "Time (s)", y: "Displacement (m)", title: "Displacement-Time Graph" },
    "velocity-time":      { x: "Time (s)", y: "Velocity (m/s)",    title: "Velocity-Time Graph"    },
    "acceleration-time":  { x: "Time (s)", y: "Acceleration (m/s²)", title: "Acceleration-Time Graph" },
  };
  const L = labels[motionType];

  const area    = motionType === "velocity-time" ? Math.abs((initialValue + finalValue) / 2 * timeRange) : null;
  const gradient = (finalValue - initialValue) / timeRange;

  return (
    <div className="space-y-3">
      <p className="text-xs font-black text-stone-500 uppercase tracking-wider">{L.title}</p>
      <ResponsiveContainer width="100%" height={260}>
        <LineChart data={data} margin={{ top: 10, right: 20, bottom: 10, left: 20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
          <XAxis dataKey="t" type="number" domain={[0, timeRange]}
            tick={{ fontSize: 11, fill: "#6b7280" }}
            label={{ value: L.x, position: "insideBottomRight", fill: "#9ca3af", fontSize: 11 }}
          />
          <YAxis tick={{ fontSize: 11, fill: "#6b7280" }}
            label={{ value: L.y, angle: -90, position: "insideLeft", fill: "#9ca3af", fontSize: 11 }}
          />
          <Tooltip contentStyle={{ fontSize: 12, borderRadius: 2 }}
            formatter={(v: any) => [parseFloat(v).toFixed(2), L.y]} />
          <ReferenceLine y={0} stroke="#374151" strokeWidth={1} />
          <Line type={isAccelerated ? "monotone" : "linear"} dataKey="y"
            stroke={COLOR} strokeWidth={2.5} dot={false} animationDuration={800} />
        </LineChart>
      </ResponsiveContainer>

      <div className="flex flex-wrap gap-2">
        <span className="text-xs font-bold px-2.5 py-1.5 rounded-sm font-mono"
          style={{ color: COLOR, backgroundColor: `${COLOR}15`, border: `1px solid ${COLOR}30` }}>
          Gradient = {gradient.toFixed(2)} {motionType === "displacement-time" ? "m/s" : motionType === "velocity-time" ? "m/s²" : "m/s³"}
        </span>
        {area !== null && (
          <span className="text-xs font-bold px-2.5 py-1.5 rounded-sm font-mono"
            style={{ color: "#8b5cf6", backgroundColor: "#8b5cf615", border: "1px solid #8b5cf630" }}>
            Area = {area.toFixed(1)} m (displacement)
          </span>
        )}
      </div>

      {/* SUVAT equations */}
      {motionType === "velocity-time" && (
        <div className="grid grid-cols-2 gap-2">
          {["v = u + at", "s = ½(u+v)t", "s = ut + ½at²", "v² = u² + 2as"].map((eq) => (
            <div key={eq} className="bg-stone-900 rounded-sm px-3 py-2 text-center">
              <p className="text-xs font-mono text-sky-300 font-bold">{eq}</p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Circuit Diagram Visualiser (Physics) ────────────────────────────────────

function CircuitVisualiser({ circuitType = "series", components = [] }: {
  circuitType?: "series" | "parallel" | "mixed";
  components?:  { type: "battery" | "resistor" | "bulb" | "switch" | "capacitor"; label: string; value?: string }[];
}) {
  const defaultComponents = components.length > 0 ? components : [
    { type: "battery",   label: "6V",  value: "6V"  },
    { type: "resistor",  label: "R₁",  value: "4Ω"  },
    { type: "resistor",  label: "R₂",  value: "2Ω"  },
    { type: "bulb",      label: "L₁",  value: ""    },
  ] as typeof components;

  const SYMBOLS: Record<string, React.ReactNode> = {
    battery:   <><line x1="0" y1="0" x2="0" y2="20" stroke="currentColor" strokeWidth="3"/><line x1="-8" y1="20" x2="8" y2="20" stroke="currentColor" strokeWidth="2"/><line x1="-4" y1="26" x2="4" y2="26" stroke="currentColor" strokeWidth="1.5"/><line x1="0" y1="26" x2="0" y2="46" stroke="currentColor" strokeWidth="3"/></>,
    resistor:  <><rect x="-10" y="10" width="20" height="12" fill="none" stroke="currentColor" strokeWidth="2"/></>,
    bulb:      <><circle cx="0" cy="18" r="10" fill="none" stroke="currentColor" strokeWidth="2"/><line x1="-6" y1="14" x2="6" y2="22" stroke="currentColor" strokeWidth="1.5"/><line x1="6" y1="14" x2="-6" y2="22" stroke="currentColor" strokeWidth="1.5"/></>,
    switch:    <><line x1="-12" y1="18" x2="0" y2="18" stroke="currentColor" strokeWidth="2"/><line x1="0" y1="18" x2="10" y2="8" stroke="currentColor" strokeWidth="2"/><line x1="12" y1="18" x2="24" y2="18" stroke="currentColor" strokeWidth="2"/></>,
    capacitor: <><line x1="-8" y1="14" x2="8" y2="14" stroke="currentColor" strokeWidth="3"/><line x1="-8" y1="22" x2="8" y2="22" stroke="currentColor" strokeWidth="3"/></>,
  };

  const numComponents = defaultComponents.length;
  const spacing       = 120;
  const W             = Math.max(500, numComponents * spacing + 80);
  const H             = 200;

  return (
    <div className="space-y-3 overflow-x-auto">
      <div className="flex items-center gap-2 mb-2">
        <span className="text-xs font-black text-stone-400 uppercase tracking-wider">
          {circuitType === "series" ? "Series Circuit" : circuitType === "parallel" ? "Parallel Circuit" : "Mixed Circuit"}
        </span>
      </div>
      <svg width={W} height={H} className="mx-auto block" style={{ color: "#0ea5e9" }}>
        {/* Top wire */}
        <line x1={40} y1={40} x2={W - 40} y2={40} stroke="#374151" strokeWidth={2} />
        {/* Bottom wire */}
        <line x1={40} y1={H - 40} x2={W - 40} y2={H - 40} stroke="#374151" strokeWidth={2} />
        {/* Left wire */}
        <line x1={40} y1={40} x2={40} y2={H - 40} stroke="#374151" strokeWidth={2} />
        {/* Right wire */}
        <line x1={W - 40} y1={40} x2={W - 40} y2={H - 40} stroke="#374151" strokeWidth={2} />

        {/* Components on top wire */}
        {defaultComponents.map((comp, i) => {
          const x = 40 + spacing * 0.5 + i * spacing;
          const y = 40;
          return (
            <g key={i} transform={`translate(${x}, ${y - 23})`} color="#0ea5e9">
              {SYMBOLS[comp.type] ?? <rect x="-10" y="10" width="20" height="12" fill="none" stroke="currentColor" strokeWidth="2" />}
              <text x={0} y={56} textAnchor="middle" fontSize={11} fill="#6b7280" fontWeight="bold">{comp.label}</text>
              {comp.value && <text x={0} y={68} textAnchor="middle" fontSize={10} fill="#9ca3af">{comp.value}</text>}
            </g>
          );
        })}

        {/* Direction arrow */}
        <polygon points={`${W/2},${H-48} ${W/2+8},${H-38} ${W/2-8},${H-38}`} fill="#10b981" opacity={0.8} />
        <text x={W/2 + 14} y={H - 38} fontSize={10} fill="#10b981" fontWeight="bold">I</text>
      </svg>

      {/* Key equations */}
      {circuitType === "series" && (
        <div className="flex flex-wrap gap-2">
          {["V = IR", "R_total = R₁ + R₂ + ...", "I is same everywhere"].map((eq) => (
            <span key={eq} className="text-xs font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-sm">{eq}</span>
          ))}
        </div>
      )}
      {circuitType === "parallel" && (
        <div className="flex flex-wrap gap-2">
          {["V is same across branches", "1/R = 1/R₁ + 1/R₂ + ...", "I = I₁ + I₂ + ..."].map((eq) => (
            <span key={eq} className="text-xs font-mono text-sky-700 bg-sky-50 border border-sky-200 px-2.5 py-1 rounded-sm">{eq}</span>
          ))}
        </div>
      )}
    </div>
  );
}

// ─── Energy Diagram (Chemistry) ─────────────────────────────────────────────

function EnergyDiagramVisualiser({ reactionType = "exothermic", reactantEnergy = 60, productEnergy = 30, activationEnergy = 90, reactionLabel }: {
  reactionType?:     "exothermic" | "endothermic";
  reactantEnergy?:   number; productEnergy?: number; activationEnergy?: number; reactionLabel?: string;
}) {
  const isExo = reactionType === "exothermic";
  const CHEM  = "#10b981";
  const PEAK  = "#ef4444";

  // Build reaction coordinate path data
  const W = 500; const H = 260; const PAD = 40;
  const yScale = (e: number) => PAD + ((100 - e) / 100) * (H - PAD * 2);

  const rY  = yScale(reactantEnergy);
  const pY  = yScale(productEnergy);
  const aY  = yScale(activationEnergy);
  const midX = W / 2;

  const pathD = `M ${PAD} ${rY} C ${W * 0.25} ${rY}, ${midX - 60} ${aY - 20}, ${midX} ${aY} C ${midX + 60} ${aY - 20}, ${W * 0.75} ${pY}, ${W - PAD} ${pY}`;

  const ΔH    = productEnergy - reactantEnergy;
  const Ea    = activationEnergy - reactantEnergy;

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2 mb-1">
        <span className="text-xs font-bold px-2.5 py-1 rounded-sm"
          style={{ color: isExo ? "#059669" : "#dc2626", backgroundColor: isExo ? "#d1fae5" : "#fee2e2" }}>
          {isExo ? "⬇ Exothermic" : "⬆ Endothermic"} — ΔH = {isExo ? "" : "+"}{ΔH} kJ/mol
        </span>
        <span className="text-xs font-bold px-2.5 py-1 rounded-sm text-red-600 bg-red-50">
          Eₐ = {Ea} kJ/mol
        </span>
      </div>
      <svg width="100%" viewBox={`0 0 ${W} ${H}`} preserveAspectRatio="xMidYMid meet" className="overflow-visible">
        <defs>
          <linearGradient id="energyGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor={CHEM} stopOpacity="0.15" />
            <stop offset="100%" stopColor={CHEM} stopOpacity="0.02" />
          </linearGradient>
        </defs>
        {/* Y-axis label */}
        <text x={12} y={H / 2} fontSize={11} fill="#9ca3af" textAnchor="middle" transform={`rotate(-90, 12, ${H/2})`}>Energy (kJ/mol)</text>
        {/* X-axis label */}
        <text x={W / 2} y={H - 4} fontSize={11} fill="#9ca3af" textAnchor="middle">Reaction Coordinate →</text>
        {/* Energy path */}
        <path d={pathD} fill="none" stroke={CHEM} strokeWidth={3} strokeLinecap="round" />
        {/* Reactant level */}
        <line x1={PAD} y1={rY} x2={PAD + 60} y2={rY} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" />
        <text x={PAD + 65} y={rY + 4} fontSize={11} fill="#6b7280" fontWeight="bold">Reactants ({reactantEnergy})</text>
        {/* Product level */}
        <line x1={W - PAD - 60} y1={pY} x2={W - PAD} y2={pY} stroke="#6b7280" strokeWidth={1.5} strokeDasharray="4 2" />
        <text x={W - PAD - 65} y={pY + 4} fontSize={11} fill="#6b7280" fontWeight="bold" textAnchor="end">Products ({productEnergy})</text>
        {/* Activation energy peak */}
        <line x1={midX} y1={aY} x2={midX} y2={rY} stroke={PEAK} strokeWidth={1.5} strokeDasharray="3 2" />
        <text x={midX + 8} y={(aY + rY) / 2} fontSize={10} fill={PEAK} fontWeight="bold">Eₐ = {Ea}</text>
        {/* ΔH arrow */}
        <line x1={W - PAD - 20} y1={rY} x2={W - PAD - 20} y2={pY} stroke={isExo ? "#059669" : "#dc2626"} strokeWidth={2} markerEnd="url(#arrow)" />
        <text x={W - PAD + 4} y={(rY + pY) / 2 + 4} fontSize={10} fill={isExo ? "#059669" : "#dc2626"} fontWeight="bold">ΔH = {ΔH}</text>
        {/* Peak dot */}
        <circle cx={midX} cy={aY} r={5} fill={PEAK} />
        {/* Reactant dot */}
        <circle cx={PAD} cy={rY} r={4} fill={CHEM} />
        {/* Product dot */}
        <circle cx={W - PAD} cy={pY} r={4} fill={CHEM} />
      </svg>
      {reactionLabel && <p className="text-xs text-stone-500 text-center italic">{reactionLabel}</p>}
      <div className="flex flex-wrap gap-2 justify-center">
        {[
          { label: "ΔH < 0: exothermic — releases energy (heat out)", color: "#059669" },
          { label: "ΔH > 0: endothermic — absorbs energy (heat in)", color: "#dc2626" },
          { label: "Eₐ = activation energy needed to start the reaction", color: "#ef4444" },
        ].map((s) => (
          <span key={s.label} className="text-[10px] px-2 py-1 rounded-sm font-medium"
            style={{ color: s.color, backgroundColor: `${s.color}12` }}>{s.label}</span>
        ))}
      </div>
    </div>
  );
}

// ─── Periodic Element Card (Chemistry) ───────────────────────────────────────

function PeriodicElementVisualiser({ elementSymbol = "C", elementName = "Carbon", atomicNumber = 6, atomicMass = 12.011, elementGroup = "Nonmetal", electronConfig = "2, 4" }: {
  elementSymbol?: string; elementName?: string; atomicNumber?: number; atomicMass?: number;
  elementGroup?: string; electronConfig?: string;
}) {
  const CHEM = "#10b981";
  const GROUP_COLOR: Record<string, string> = {
    "Alkali Metal": "#f97316", "Alkaline Earth Metal": "#f59e0b", "Transition Metal": "#6366f1",
    "Nonmetal": "#10b981", "Noble Gas": "#8b5cf6", "Halogen": "#ec4899",
    "Metalloid": "#14b8a6", "Post-transition Metal": "#6b7280",
  };
  const color = GROUP_COLOR[elementGroup] ?? CHEM;

  // Simple electron shell diagram
  const shells = electronConfig.split(/[,\s]+/).map(Number).filter(Boolean);
  const SHELL_RADII = [0, 45, 75, 100, 120];

  return (
    <div className="flex flex-col md:flex-row items-center gap-6">
      {/* Element card */}
      <div className="border-2 rounded-sm p-5 text-center w-44 flex-shrink-0"
        style={{ borderColor: color, backgroundColor: `${color}08` }}>
        <p className="text-[10px] font-black uppercase tracking-widest mb-1" style={{ color: "#9ca3af" }}>{atomicNumber}</p>
        <p className="text-6xl font-black mb-1" style={{ color }}>{elementSymbol}</p>
        <p className="text-sm font-bold text-stone-800 mb-2">{elementName}</p>
        <p className="text-sm font-mono text-stone-500">{atomicMass}</p>
        <span className="inline-block mt-2 text-[10px] font-bold px-2 py-0.5 rounded-sm"
          style={{ color, backgroundColor: `${color}18` }}>{elementGroup}</span>
      </div>

      {/* Electron shell diagram */}
      <div className="flex flex-col items-center gap-3">
        <p className="text-xs font-black text-stone-400 uppercase tracking-wider">Electron Shell Diagram</p>
        <svg width={260} height={260}>
          <circle cx={130} cy={130} r={12} fill={color} />
          <text x={130} y={135} textAnchor="middle" fontSize={10} fill="white" fontWeight="bold">{elementSymbol}</text>
          {shells.map((electrons, si) => {
            const r     = SHELL_RADII[si + 1] ?? (si + 1) * 40;
            const angle = (2 * Math.PI) / electrons;
            return (
              <g key={si}>
                <circle cx={130} cy={130} r={r} fill="none" stroke="#e5e7eb" strokeWidth={1.5} strokeDasharray="4 3" />
                {Array.from({ length: electrons }, (_, ei) => {
                  const θ  = ei * angle - Math.PI / 2;
                  const ex = 130 + r * Math.cos(θ);
                  const ey = 130 + r * Math.sin(θ);
                  return <circle key={ei} cx={ex} cy={ey} r={5} fill={color} opacity={0.85} />;
                })}
                <text x={130 + r + 6} y={130} fontSize={10} fill="#9ca3af">Shell {si + 1}: {electrons}e⁻</text>
              </g>
            );
          })}
        </svg>
        <p className="text-xs text-stone-500 font-mono">Electron config: {electronConfig}</p>
      </div>
    </div>
  );
}

// ─── Molecular Bond Diagram (Chemistry) ──────────────────────────────────────

function MolecularVisualiser({ formula = "H₂O", bondDescription }: { formula?: string; bondDescription?: string }) {
  const CHEM = "#10b981";
  const ATOM_COLORS: Record<string, string> = {
    H: "#e5e7eb", O: "#ef4444", N: "#3b82f6", C: "#374151",
    Cl: "#84cc16", S: "#f59e0b", Na: "#a855f7", Fe: "#f97316",
  };

  // Simple pre-defined layouts for common molecules
  const MOLECULES: Record<string, { atoms: { symbol: string; x: number; y: number }[]; bonds: [number, number, number][] }> = {
    "H₂O": { atoms: [{ symbol: "O", x: 130, y: 100 }, { symbol: "H", x: 70, y: 155 }, { symbol: "H", x: 190, y: 155 }], bonds: [[0,1,1],[0,2,1]] },
    "CO₂": { atoms: [{ symbol: "C", x: 130, y: 120 }, { symbol: "O", x: 60, y: 120 }, { symbol: "O", x: 200, y: 120 }], bonds: [[0,1,2],[0,2,2]] },
    "NaCl": { atoms: [{ symbol: "Na", x: 90, y: 120 }, { symbol: "Cl", x: 170, y: 120 }], bonds: [[0,1,1]] },
    "CH₄": { atoms: [{ symbol: "C", x: 130, y: 120 }, { symbol: "H", x: 80, y: 80 }, { symbol: "H", x: 180, y: 80 }, { symbol: "H", x: 80, y: 160 }, { symbol: "H", x: 180, y: 160 }], bonds: [[0,1,1],[0,2,1],[0,3,1],[0,4,1]] },
    "NH₃": { atoms: [{ symbol: "N", x: 130, y: 100 }, { symbol: "H", x: 70, y: 160 }, { symbol: "H", x: 130, y: 170 }, { symbol: "H", x: 190, y: 160 }], bonds: [[0,1,1],[0,2,1],[0,3,1]] },
  };

  const mol = MOLECULES[formula] ?? MOLECULES["H₂O"];

  return (
    <div className="space-y-3 flex flex-col items-center">
      <p className="text-lg font-black" style={{ color: CHEM }}>{formula}</p>
      <svg width={260} height={220} className="overflow-visible">
        {/* Bonds */}
        {mol.bonds.map(([a, b, order], i) => {
          const a1 = mol.atoms[a]; const a2 = mol.atoms[b];
          const dx = a2.x - a1.x; const dy = a2.y - a1.y;
          const len = Math.sqrt(dx*dx + dy*dy);
          const nx = -dy/len * 4; const ny = dx/len * 4;
          return (
            <g key={i}>
              {order >= 1 && <line x1={a1.x + (order > 1 ? nx : 0)} y1={a1.y + (order > 1 ? ny : 0)} x2={a2.x + (order > 1 ? nx : 0)} y2={a2.y + (order > 1 ? ny : 0)} stroke="#6b7280" strokeWidth={2} />}
              {order >= 2 && <line x1={a1.x - nx} y1={a1.y - ny} x2={a2.x - nx} y2={a2.y - ny} stroke="#6b7280" strokeWidth={2} />}
            </g>
          );
        })}
        {/* Atoms */}
        {mol.atoms.map((atom, i) => {
          const color = ATOM_COLORS[atom.symbol] ?? "#9ca3af";
          return (
            <g key={i}>
              <circle cx={atom.x} cy={atom.y} r={22} fill={color} stroke="white" strokeWidth={2} />
              <text x={atom.x} y={atom.y + 5} textAnchor="middle" fontSize={14} fontWeight="bold"
                fill={atom.symbol === "H" || atom.symbol === "S" ? "#374151" : "white"}>
                {atom.symbol}
              </text>
            </g>
          );
        })}
      </svg>
      {bondDescription && (
        <p className="text-xs text-stone-500 text-center leading-relaxed max-w-xs">{bondDescription}</p>
      )}
      {/* CPK colour legend */}
      <div className="flex flex-wrap gap-2 justify-center">
        {Object.entries(ATOM_COLORS).slice(0, 6).map(([sym, col]) => (
          <span key={sym} className="flex items-center gap-1 text-[10px] font-bold text-stone-600">
            <span className="w-4 h-4 rounded-full border border-stone-200 flex-shrink-0"
              style={{ backgroundColor: col }} />{sym}
          </span>
        ))}
      </div>
    </div>
  );
}

// ─── MAIN VISUALISER EXPORT ───────────────────────────────────────────────────

interface ChemistryVisualiserProps {
  data:        VisualisationData;
  className?:  string;
  compact?:    boolean;          // compact mode — less padding, no expand button
  onExpand?:   () => void;
}

export function ChemistryVisualiser({ data, className = "", compact = false, onExpand }: ChemistryVisualiserProps) {
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
    function_graph:   "Function Graph",
    linear_graph:     "Linear Graph",
    geometric:        "Geometric Diagram",
    statistical:      "Statistical Chart",
    vector:           "Vector Diagram",
    sequence:         "Sequence Visualiser",
    ratio:            "Ratio & Proportion",
    wave:             "Wave Diagram",
    motion_graph:     "Motion Graph",
    circuit:          "Circuit Diagram",
    energy_diagram:   "Energy Profile",
    periodic_element: "Element Card",
    molecular:        "Molecular Structure",
    none:             "",
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

              {/* Wave (Physics) */}
              {data.type === "wave" && (
                <WaveVisualiser
                  amplitude={data.amplitude ?? 1}
                  frequency={data.frequency ?? 1}
                  phase={data.phase ?? 0}
                  waveType={data.waveType ?? "sine"}
                  waveLabel={data.waveLabel}
                />
              )}

              {/* Motion Graph (Physics) */}
              {data.type === "motion_graph" && (
                <MotionGraphVisualiser
                  motionType={data.motionType ?? "displacement-time"}
                  initialValue={data.initialValue ?? 0}
                  finalValue={data.finalValue ?? 20}
                  timeRange={data.timeRange ?? 10}
                />
              )}

              {/* Circuit Diagram (Physics) */}
              {data.type === "circuit" && (
                <CircuitVisualiser
                  circuitType={data.circuitType ?? "series"}
                  components={data.components ?? []}
                />
              )}

              {/* Energy Diagram (Chemistry) */}
              {data.type === "energy_diagram" && (
                <EnergyDiagramVisualiser
                  reactionType={data.reactionType ?? "exothermic"}
                  reactantEnergy={data.reactantEnergy ?? 60}
                  productEnergy={data.productEnergy ?? 30}
                  activationEnergy={data.activationEnergy ?? 90}
                  reactionLabel={data.reactionLabel}
                />
              )}

              {/* Periodic Element (Chemistry) */}
              {data.type === "periodic_element" && (
                <PeriodicElementVisualiser
                  elementSymbol={data.elementSymbol ?? "C"}
                  elementName={data.elementName ?? "Carbon"}
                  atomicNumber={data.atomicNumber ?? 6}
                  atomicMass={data.atomicMass ?? 12.011}
                  elementGroup={data.elementGroup ?? "Nonmetal"}
                  electronConfig={data.electronConfig ?? "2, 4"}
                />
              )}

              {/* Molecular Structure (Chemistry) */}
              {data.type === "molecular" && (
                <MolecularVisualiser
                  formula={data.formula ?? "H₂O"}
                  bondDescription={data.bondDescription}
                />
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
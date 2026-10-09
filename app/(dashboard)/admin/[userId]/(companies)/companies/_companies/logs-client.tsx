"use client";
// =============================================================================
// app/admin/[userId]/companies/[companySlug]/logs/_components/logs-client.tsx
// API request log viewer — shows all inbound API requests with filtering
// =============================================================================

import React, { useState, useCallback } from "react";
import {
  Search, RefreshCw, CheckCircle, AlertCircle,
  Clock, ArrowDownUp,
} from "lucide-react";

interface LogEntry {
  id:         string;
  requestId:  string;
  method:     string;
  path:       string;
  statusCode: number;
  responseMs: number;
  ipAddress:  string | null;
  origin:     string | null;
  errorCode:  string | null;
  createdAt:  Date;
}

interface Props {
  companyId:    string;
  initialLogs:  LogEntry[];
  total:        number;
}

function methodColor(method: string) {
  const colors: Record<string, string> = {
    GET:    "text-blue-700 bg-blue-50 border-blue-200",
    POST:   "text-emerald-700 bg-emerald-50 border-emerald-200",
    PATCH:  "text-amber-700 bg-amber-50 border-amber-200",
    PUT:    "text-amber-700 bg-amber-50 border-amber-200",
    DELETE: "text-red-700 bg-red-50 border-red-200",
  };
  return colors[method] ?? "text-stone-600 bg-stone-100 border-stone-200";
}

function statusColor(code: number) {
  if (code < 300) return "text-emerald-700";
  if (code < 400) return "text-blue-600";
  if (code < 500) return "text-amber-600";
  return "text-red-600";
}

function fmtMs(ms: number) {
  if (ms < 1000) return `${ms}ms`;
  return `${(ms / 1000).toFixed(1)}s`;
}

function fmtTime(d: Date) {
  return new Date(d).toLocaleString("en-GB", {
    day: "2-digit", month: "short",
    hour: "2-digit", minute: "2-digit", second: "2-digit",
  });
}

export function LogsClient({ companyId, initialLogs, total }: Props) {
  const [logs,    setLogs]    = useState<LogEntry[]>(initialLogs);
  const [search,  setSearch]  = useState("");
  const [method,  setMethod]  = useState("ALL");
  const [status,  setStatus]  = useState("ALL");
  const [loading, setLoading] = useState(false);
  const [page,    setPage]    = useState(1);

  const fetchLogs = useCallback(async (opts?: {
    q?: string; method?: string; status?: string; pg?: number;
  }) => {
    setLoading(true);
    const params = new URLSearchParams({
      companyId,
      page:   String(opts?.pg ?? page),
      search: opts?.q ?? search,
    });
    if ((opts?.method ?? method) !== "ALL") params.set("method", opts?.method ?? method);
    if ((opts?.status ?? status) !== "ALL") params.set("status", opts?.status ?? status);

    const res  = await fetch(`/api/admin/logs?${params}`);
    const data = await res.json();
    setLogs(data.logs ?? []);
    setLoading(false);
  }, [companyId, page, search, method, status]);

  return (
    <div className="p-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-lg font-black text-stone-900">Request Logs</h2>
          <p className="text-sm text-stone-400 mt-0.5">{total.toLocaleString()} total requests</p>
        </div>
        <button
          onClick={() => fetchLogs()}
          className="flex items-center gap-2 text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-stone-400 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${loading ? "animate-spin" : ""}`} />
          Refresh
        </button>
      </div>

      {/* Filters */}
      <div className="flex items-center gap-2 mb-4 flex-wrap">
        <div className="relative flex-1 min-w-[200px] max-w-xs">
          <Search className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-stone-300 pointer-events-none" />
          <input
            value={search}
            onChange={(e) => {
              setSearch(e.target.value);
              fetchLogs({ q: e.target.value, pg: 1 });
              setPage(1);
            }}
            placeholder="Search path, IP, request ID..."
            className="w-full pl-8 pr-3 py-2 text-xs border border-stone-200 rounded-sm focus:outline-none focus:border-amber-400"
          />
        </div>
        <select
          value={method}
          onChange={(e) => { setMethod(e.target.value); fetchLogs({ method: e.target.value, pg: 1 }); }}
          className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none"
        >
          <option value="ALL">All methods</option>
          {["GET","POST","PATCH","DELETE"].map((m) => (
            <option key={m} value={m}>{m}</option>
          ))}
        </select>
        <select
          value={status}
          onChange={(e) => { setStatus(e.target.value); fetchLogs({ status: e.target.value, pg: 1 }); }}
          className="text-xs border border-stone-200 rounded-sm px-2.5 py-2 bg-white text-stone-600 focus:outline-none"
        >
          <option value="ALL">All statuses</option>
          <option value="2xx">2xx Success</option>
          <option value="4xx">4xx Client error</option>
          <option value="5xx">5xx Server error</option>
        </select>
      </div>

      {/* Table */}
      <div className="bg-white border border-stone-100 rounded-sm overflow-hidden">
        {/* Header */}
        <div className="hidden md:grid grid-cols-[80px_1fr_80px_80px_120px_100px] gap-3 px-4 py-2.5 bg-stone-50 border-b border-stone-100">
          {["Method","Path","Status","Time","IP","Timestamp"].map((h) => (
            <p key={h} className="text-[10px] font-black text-stone-400 uppercase tracking-wider">{h}</p>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-12 gap-2 text-stone-400">
            <RefreshCw className="w-4 h-4 animate-spin" />
            <span className="text-sm">Loading...</span>
          </div>
        ) : logs.length === 0 ? (
          <div className="py-12 text-center">
            <ArrowDownUp className="w-8 h-8 text-stone-200 mx-auto mb-2" />
            <p className="text-sm text-stone-400">No requests found</p>
          </div>
        ) : (
          logs.map((log) => (
            <div
              key={log.id}
              className="grid grid-cols-1 md:grid-cols-[80px_1fr_80px_80px_120px_100px] gap-3 px-4 py-3 border-b border-stone-50 last:border-0 hover:bg-stone-50/50 transition-colors"
            >
              {/* Method */}
              <div>
                <span className={`text-[10px] font-black px-1.5 py-0.5 rounded-sm border ${methodColor(log.method)}`}>
                  {log.method}
                </span>
              </div>

              {/* Path */}
              <p className="text-xs font-mono text-stone-700 truncate" title={log.path}>
                {log.path.replace(/\/api\/v1\/companies\/[^/]+/, "")}
              </p>

              {/* Status */}
              <div className="flex items-center gap-1">
                {log.statusCode < 400
                  ? <CheckCircle className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0" />
                  : <AlertCircle className="w-3.5 h-3.5 text-red-500 flex-shrink-0" />
                }
                <span className={`text-xs font-bold ${statusColor(log.statusCode)}`}>
                  {log.statusCode}
                </span>
              </div>

              {/* Response time */}
              <div className="flex items-center gap-1">
                <Clock className="w-3 h-3 text-stone-300 flex-shrink-0" />
                <span className={`text-xs font-semibold ${
                  log.responseMs > 1000 ? "text-red-500" :
                  log.responseMs > 500  ? "text-amber-500" :
                  "text-stone-500"
                }`}>
                  {fmtMs(log.responseMs)}
                </span>
              </div>

              {/* IP */}
              <p className="text-xs font-mono text-stone-400 truncate">
                {log.ipAddress ?? "—"}
              </p>

              {/* Timestamp */}
              <p className="text-[11px] text-stone-400">
                {fmtTime(log.createdAt)}
              </p>

              {/* Error code if present */}
              {log.errorCode && (
                <div className="col-span-full">
                  <span className="text-[10px] font-bold text-red-600 bg-red-50 border border-red-200 px-2 py-0.5 rounded-sm">
                    {log.errorCode}
                  </span>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {/* Pagination */}
      {total > 50 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            disabled={page <= 1}
            onClick={() => { const p = page - 1; setPage(p); fetchLogs({ pg: p }); }}
            className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors"
          >
            ← Prev
          </button>
          <span className="text-xs text-stone-400">Page {page}</span>
          <button
            disabled={page * 50 >= total}
            onClick={() => { const p = page + 1; setPage(p); fetchLogs({ pg: p }); }}
            className="text-xs font-semibold text-stone-500 border border-stone-200 px-3 py-2 rounded-sm hover:border-amber-400 disabled:opacity-40 transition-colors"
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
}

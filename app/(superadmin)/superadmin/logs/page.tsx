"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { ChevronDown, ChevronUp, Trash2, RefreshCw } from "lucide-react";

interface AppLog {
  id: string;
  level: string;
  message: string;
  path: string | null;
  method: string | null;
  status: number | null;
  duration: number | null;
  userId: string | null;
  schoolId: string | null;
  requestId: string | null;
  stack: string | null;
  meta: Record<string, unknown> | null;
  createdAt: string;
}

interface PageData {
  logs: AppLog[];
  total: number;
  page: number;
  pages: number;
}

const LEVEL_VARIANT: Record<string, "destructive" | "warning" | "info" | "secondary"> = {
  error: "destructive",
  warn: "warning",
  info: "info",
  debug: "secondary",
};

export default function LogsPage() {
  const [data, setData] = useState<PageData | null>(null);
  const [loading, setLoading] = useState(true);
  const [level, setLevel] = useState("");
  const [path, setPath] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [page, setPage] = useState(1);
  const [expanded, setExpanded] = useState<Set<string>>(new Set());
  const [pruning, setPruning] = useState(false);

  const fetchLogs = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ page: String(page), limit: "50" });
    if (level) params.set("level", level);
    if (path) params.set("path", path);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    const res = await fetch(`/api/superadmin/logs?${params}`);
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, [page, level, path, fromDate, toDate]);

  useEffect(() => { fetchLogs(); }, [fetchLogs]);

  function toggleExpand(id: string) {
    setExpanded((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  }

  async function pruneOld(days: number) {
    if (!confirm(`Delete logs older than ${days} days?`)) return;
    setPruning(true);
    const res = await fetch(`/api/superadmin/logs?olderThanDays=${days}`, { method: "DELETE" });
    if (res.ok) {
      const j = await res.json();
      alert(`Deleted ${j.deleted} log entries.`);
      fetchLogs();
    }
    setPruning(false);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Application Logs</h1>
          <p className="text-sm text-muted-foreground">Structured runtime logs from the application</p>
        </div>
        <div className="flex items-center gap-2">
          <span className="text-xs text-muted-foreground">Prune older than:</span>
          {[7, 30, 90].map((d) => (
            <Button key={d} variant="outline" size="sm" onClick={() => pruneOld(d)} disabled={pruning}>
              <Trash2 className="h-3.5 w-3.5 mr-1" />{d}d
            </Button>
          ))}
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="pt-4">
          <div className="flex flex-wrap gap-3">
            <select
              value={level}
              onChange={(e) => { setLevel(e.target.value); setPage(1); }}
              aria-label="Filter by level"
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
            >
              <option value="">All Levels</option>
              <option value="error">Error</option>
              <option value="warn">Warning</option>
              <option value="info">Info</option>
              <option value="debug">Debug</option>
            </select>
            <input
              value={path}
              onChange={(e) => { setPath(e.target.value); setPage(1); }}
              placeholder="Filter by path…"
              className="border rounded-md px-3 py-1.5 text-sm bg-background w-48"
            />
            <input
              type="date"
              value={fromDate}
              onChange={(e) => { setFromDate(e.target.value); setPage(1); }}
              aria-label="From date"
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
            />
            <input
              type="date"
              value={toDate}
              onChange={(e) => { setToDate(e.target.value); setPage(1); }}
              aria-label="To date"
              className="border rounded-md px-3 py-1.5 text-sm bg-background"
            />
            <Button variant="outline" size="sm" onClick={fetchLogs}>
              <RefreshCw className="h-3.5 w-3.5 mr-1.5" /> Refresh
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Time</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Level</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Message</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Path</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Status</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">ms</th>
                  <th className="px-4 py-3" />
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {loading ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">Loading…</td></tr>
                ) : data?.logs.length === 0 ? (
                  <tr><td colSpan={7} className="text-center py-12 text-muted-foreground">No logs found.</td></tr>
                ) : data?.logs.map((log) => {
                  const isExpanded = expanded.has(log.id);
                  const hasDetail = !!(log.stack || log.meta || log.requestId || log.userId);
                  return (
                    <>
                      <tr key={log.id} className="hover:bg-muted/30">
                        <td className="px-4 py-2 text-xs text-muted-foreground whitespace-nowrap">
                          {new Date(log.createdAt).toLocaleString()}
                        </td>
                        <td className="px-4 py-2">
                          <Badge variant={LEVEL_VARIANT[log.level] ?? "secondary"}>{log.level}</Badge>
                        </td>
                        <td className="px-4 py-2 max-w-xs">
                          <p className="truncate">{log.message}</p>
                        </td>
                        <td className="px-4 py-2 text-muted-foreground font-mono text-xs">
                          {log.method && <span className="mr-1 text-blue-500">{log.method}</span>}
                          {log.path ?? "—"}
                        </td>
                        <td className="px-4 py-2 text-right">
                          {log.status ? (
                            <span className={log.status >= 400 ? "text-destructive font-medium" : "text-muted-foreground"}>{log.status}</span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2 text-right text-muted-foreground">{log.duration ?? "—"}</td>
                        <td className="px-4 py-2 text-right">
                          {hasDetail && (
                            <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => toggleExpand(log.id)} aria-label="Toggle detail">
                              {isExpanded ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
                            </Button>
                          )}
                        </td>
                      </tr>
                      {isExpanded && (
                        <tr key={`${log.id}-detail`} className="bg-muted/20">
                          <td colSpan={7} className="px-4 py-3">
                            <div className="space-y-2 text-xs">
                              {log.requestId && <p className="text-muted-foreground">Request ID: <span className="font-mono">{log.requestId}</span></p>}
                              {log.userId && <p className="text-muted-foreground">User ID: <span className="font-mono">{log.userId}</span></p>}
                              {log.schoolId && <p className="text-muted-foreground">School ID: <span className="font-mono">{log.schoolId}</span></p>}
                              {log.meta && (
                                <div>
                                  <p className="text-muted-foreground mb-1">Meta:</p>
                                  <pre className="bg-background border rounded p-2 overflow-x-auto">{JSON.stringify(log.meta, null, 2)}</pre>
                                </div>
                              )}
                              {log.stack && (
                                <div>
                                  <p className="text-muted-foreground mb-1">Stack trace:</p>
                                  <pre className="bg-background border rounded p-2 overflow-x-auto text-destructive font-mono whitespace-pre-wrap">{log.stack}</pre>
                                </div>
                              )}
                            </div>
                          </td>
                        </tr>
                      )}
                    </>
                  );
                })}
              </tbody>
            </table>
          </div>

          {data && data.pages > 1 && (
            <div className="flex items-center justify-between px-4 py-3 border-t">
              <p className="text-sm text-muted-foreground">{data.total} entries</p>
              <div className="flex items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>Prev</Button>
                <span className="text-sm">Page {page} / {data.pages}</span>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(data.pages, p + 1))} disabled={page === data.pages}>Next</Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

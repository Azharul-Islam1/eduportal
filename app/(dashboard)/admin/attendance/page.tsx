"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import {
  Loader2, Search, Download, PenLine, X, ChevronDown,
  CheckCircle2, Users, BarChart3, ClipboardList,
} from "lucide-react";
import { formatDate } from "@/lib/utils";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
type Status = typeof STATUSES[number];

const statusColor: Record<string, string> = {
  PRESENT: "bg-green-100 text-green-700",
  ABSENT: "bg-red-100 text-red-600",
  LATE: "bg-yellow-100 text-yellow-700",
  EXCUSED: "bg-blue-100 text-blue-700",
};

interface ClassItem { id: string; name: string; section: string }
interface AttendanceRecord {
  id: string;
  date: string;
  status: Status;
  period: number;
  remarks: string | null;
  student: { studentId?: string; user: { name: string }; class: { name: string; section: string } };
  audits?: AuditEntry[];
}
interface AuditEntry {
  id: string;
  oldStatus: string;
  newStatus: string;
  reason: string;
  changedAt: string;
  changedBy: string;
}
interface SummaryRow {
  studentId: string;
  studentName: string;
  class: string;
  PRESENT: number;
  ABSENT: number;
  LATE: number;
  EXCUSED: number;
  total: number;
  percentage: number;
}

type Tab = "records" | "summary";

export default function AttendancePage() {
  const [tab, setTab] = useState<Tab>("records");
  const [classes, setClasses] = useState<ClassItem[]>([]);

  // Records tab state
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loadingRec, setLoadingRec] = useState(false);

  // Override dialog state
  const [overrideRec, setOverrideRec] = useState<AttendanceRecord | null>(null);
  const [overrideStatus, setOverrideStatus] = useState<Status>("PRESENT");
  const [overrideReason, setOverrideReason] = useState("");
  const [saving, setSaving] = useState(false);
  const [savedId, setSavedId] = useState<string | null>(null);

  // Audit history state
  const [auditRecId, setAuditRecId] = useState<string | null>(null);
  const [audits, setAudits] = useState<AuditEntry[]>([]);
  const [loadingAudit, setLoadingAudit] = useState(false);

  // Summary tab state
  const [summaryClassId, setSummaryClassId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [summary, setSummary] = useState<SummaryRow[]>([]);
  const [loadingSummary, setLoadingSummary] = useState(false);

  // Export state
  const [exporting, setExporting] = useState(false);

  useEffect(() => { fetch("/api/classes").then((r) => r.json()).then(setClasses); }, []);

  const fetchRecords = useCallback(async () => {
    setLoadingRec(true);
    const params = new URLSearchParams({ date });
    if (classId) params.set("classId", classId);
    const res = await fetch(`/api/attendance?${params}`);
    const data = await res.json();
    setRecords(Array.isArray(data) ? data : []);
    setLoadingRec(false);
  }, [date, classId]);

  useEffect(() => { if (tab === "records") fetchRecords(); }, [tab, fetchRecords]);

  const fetchSummary = useCallback(async () => {
    setLoadingSummary(true);
    const params = new URLSearchParams();
    if (summaryClassId) params.set("classId", summaryClassId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    const res = await fetch(`/api/attendance/summary?${params}`);
    setSummary(await res.json());
    setLoadingSummary(false);
  }, [summaryClassId, fromDate, toDate]);

  useEffect(() => { if (tab === "summary") fetchSummary(); }, [tab, fetchSummary]);

  function openOverride(rec: AttendanceRecord) {
    setOverrideRec(rec);
    setOverrideStatus(rec.status);
    setOverrideReason("");
  }

  async function submitOverride() {
    if (!overrideRec || !overrideReason.trim()) return;
    setSaving(true);
    await fetch(`/api/attendance/${overrideRec.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: overrideStatus, reason: overrideReason.trim() }),
    });
    setSaving(false);
    setSavedId(overrideRec.id);
    setOverrideRec(null);
    fetchRecords();
    setTimeout(() => setSavedId(null), 2000);
  }

  async function toggleAudit(recId: string) {
    if (auditRecId === recId) { setAuditRecId(null); return; }
    setAuditRecId(recId);
    setLoadingAudit(true);
    const res = await fetch(`/api/attendance/${recId}`);
    const data = await res.json();
    setAudits(data.audits ?? []);
    setLoadingAudit(false);
  }

  async function handleExport() {
    setExporting(true);
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    if (date) { params.set("fromDate", date); params.set("toDate", date); }
    const res = await fetch(`/api/attendance/export?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_${date}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  async function handleExportSummary() {
    setExporting(true);
    const params = new URLSearchParams();
    if (summaryClassId) params.set("classId", summaryClassId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    const res = await fetch(`/api/attendance/export?${params}`);
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `attendance_summary_export.csv`;
    a.click();
    URL.revokeObjectURL(url);
    setExporting(false);
  }

  const counts = records.reduce((acc, r) => {
    acc[r.status] = (acc[r.status] ?? 0) + 1;
    return acc;
  }, {} as Record<string, number>);

  return (
    <div>
      <Header title="Attendance" />
      <div className="p-6 space-y-5">

        {/* Top action row */}
        <div className="flex flex-wrap gap-3 items-center justify-between">
          <div className="flex gap-1 p-1 bg-gray-100 rounded-xl">
            {(["records", "summary"] as Tab[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setTab(t)}
                className={`px-4 py-1.5 rounded-lg text-sm font-medium transition capitalize ${tab === t ? "bg-white shadow text-gray-900" : "text-gray-500 hover:text-gray-700"}`}
              >
                {t === "records" ? <span className="flex items-center gap-1.5"><ClipboardList className="w-3.5 h-3.5" />Records</span>
                  : <span className="flex items-center gap-1.5"><BarChart3 className="w-3.5 h-3.5" />Summary</span>}
              </button>
            ))}
          </div>
          <Link href="/admin/attendance/mark" className="btn-primary text-sm flex items-center gap-1.5">
            <PenLine className="w-4 h-4" /> Mark Attendance
          </Link>
        </div>

        {/* ── RECORDS TAB ── */}
        {tab === "records" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="label text-xs mb-1" htmlFor="att-class">Class</label>
                  <select id="att-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="input min-w-44">
                    <option value="">All classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs mb-1" htmlFor="att-date">Date</label>
                  <input id="att-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
                </div>
                <button
                  type="button"
                  onClick={handleExport}
                  disabled={exporting}
                  className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export CSV
                </button>
              </div>
            </div>

            {/* Status summary chips */}
            {Object.keys(counts).length > 0 && (
              <div className="flex flex-wrap gap-2">
                {STATUSES.filter((s) => counts[s]).map((s) => (
                  <span key={s} className={`badge ${statusColor[s]}`}>{s}: {counts[s]}</span>
                ))}
                <span className="badge bg-gray-100 text-gray-600">Total: {records.length}</span>
              </div>
            )}

            {/* Records table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      {["Student", "Class", "Period", "Status", "Remarks", "Actions"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingRec && (
                      <tr><td colSpan={6} className="py-10 text-center">
                        <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                      </td></tr>
                    )}
                    {!loadingRec && records.length === 0 && (
                      <tr><td colSpan={6} className="py-10 text-center text-gray-400">
                        <Users className="w-8 h-8 mx-auto mb-2 opacity-30" />
                        No attendance records for this date.
                      </td></tr>
                    )}
                    {records.map((r) => (
                      <>
                        <tr key={r.id} className={`hover:bg-gray-50 ${savedId === r.id ? "bg-green-50" : ""}`}>
                          <td className="px-4 py-3">
                            <p className="font-medium text-gray-800">{r.student.user.name}</p>
                            <p className="text-xs text-gray-400 font-mono">{r.student.studentId ?? ""}</p>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs">{r.student.class.name} {r.student.class.section}</td>
                          <td className="px-4 py-3 text-gray-500">{r.period === 0 ? "Daily" : `P${r.period}`}</td>
                          <td className="px-4 py-3">
                            <span className={`badge ${statusColor[r.status] ?? "bg-gray-100"}`}>{r.status}</span>
                          </td>
                          <td className="px-4 py-3 text-gray-500 text-xs max-w-32 truncate">{r.remarks ?? "—"}</td>
                          <td className="px-4 py-3">
                            <div className="flex gap-1.5 items-center">
                              <button
                                type="button"
                                onClick={() => openOverride(r)}
                                className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition"
                                title="Edit / Override"
                              >
                                <PenLine className="w-3.5 h-3.5" />
                              </button>
                              <button
                                type="button"
                                onClick={() => toggleAudit(r.id)}
                                className={`p-1.5 rounded hover:bg-gray-100 transition text-xs font-medium flex items-center gap-0.5 ${auditRecId === r.id ? "text-blue-600" : "text-gray-400 hover:text-gray-600"}`}
                                title="View edit history"
                              >
                                <ChevronDown className={`w-3.5 h-3.5 transition-transform ${auditRecId === r.id ? "rotate-180" : ""}`} />
                              </button>
                            </div>
                          </td>
                        </tr>
                        {/* Audit history inline */}
                        {auditRecId === r.id && (
                          <tr key={`${r.id}-audit`} className="bg-gray-50">
                            <td colSpan={6} className="px-6 py-3">
                              {loadingAudit ? (
                                <Loader2 className="w-4 h-4 animate-spin text-gray-400" />
                              ) : audits.length === 0 ? (
                                <p className="text-xs text-gray-400">No edit history for this record.</p>
                              ) : (
                                <div className="space-y-1.5">
                                  <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-1">Edit History</p>
                                  {audits.map((a) => (
                                    <div key={a.id} className="flex flex-wrap gap-3 text-xs text-gray-600">
                                      <span className="text-gray-400">{new Date(a.changedAt).toLocaleString()}</span>
                                      <span className={`badge ${statusColor[a.oldStatus] ?? "bg-gray-100"}`}>{a.oldStatus}</span>
                                      <span className="text-gray-400">→</span>
                                      <span className={`badge ${statusColor[a.newStatus] ?? "bg-gray-100"}`}>{a.newStatus}</span>
                                      <span className="text-gray-500 italic">"{a.reason}"</span>
                                    </div>
                                  ))}
                                </div>
                              )}
                            </td>
                          </tr>
                        )}
                      </>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}

        {/* ── SUMMARY TAB ── */}
        {tab === "summary" && (
          <div className="space-y-4">
            {/* Filters */}
            <div className="card p-4">
              <div className="flex flex-wrap gap-3 items-end">
                <div>
                  <label className="label text-xs mb-1" htmlFor="sum-class">Class</label>
                  <select id="sum-class" value={summaryClassId} onChange={(e) => setSummaryClassId(e.target.value)} className="input min-w-44">
                    <option value="">All classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label text-xs mb-1" htmlFor="sum-from">From</label>
                  <input id="sum-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" />
                </div>
                <div>
                  <label className="label text-xs mb-1" htmlFor="sum-to">To</label>
                  <input id="sum-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" />
                </div>
                <button type="button" onClick={fetchSummary} className="btn-secondary text-sm">Apply</button>
                <button
                  type="button"
                  onClick={handleExportSummary}
                  disabled={exporting}
                  className="btn-secondary flex items-center gap-1.5 text-sm"
                >
                  {exporting ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
                  Export CSV
                </button>
              </div>
            </div>

            {/* Summary table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      {["Student", "Class", "Present", "Absent", "Late", "Excused", "Total", "Attendance %"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loadingSummary && (
                      <tr><td colSpan={8} className="py-10 text-center">
                        <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                      </td></tr>
                    )}
                    {!loadingSummary && summary.length === 0 && (
                      <tr><td colSpan={8} className="py-10 text-center text-gray-400">
                        No data. Apply filters and try again.
                      </td></tr>
                    )}
                    {summary.map((row) => (
                      <tr key={row.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 font-medium text-gray-800">{row.studentName}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{row.class}</td>
                        <td className="px-4 py-3 text-green-700 font-medium">{row.PRESENT}</td>
                        <td className="px-4 py-3 text-red-600 font-medium">{row.ABSENT}</td>
                        <td className="px-4 py-3 text-yellow-700 font-medium">{row.LATE}</td>
                        <td className="px-4 py-3 text-blue-700 font-medium">{row.EXCUSED}</td>
                        <td className="px-4 py-3 text-gray-600">{row.total}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${row.percentage >= 75 ? "bg-green-100 text-green-700" : row.percentage >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                            {row.percentage}%
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* ── Override Dialog ── */}
      {overrideRec && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <div>
                <h2 className="text-base font-semibold text-gray-900">Override Attendance</h2>
                <p className="text-sm text-gray-500 mt-0.5">{overrideRec.student.user.name} — {formatDate(overrideRec.date)}</p>
              </div>
              <button type="button" onClick={() => setOverrideRec(null)} aria-label="Close dialog" className="p-1.5 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <div className="px-6 py-5 space-y-4">
              <div>
                <label className="label text-xs mb-2 block">New Status</label>
                <div className="flex gap-2 flex-wrap">
                  {STATUSES.map((s) => (
                    <button
                      key={s}
                      type="button"
                      onClick={() => setOverrideStatus(s)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium border transition ${overrideStatus === s ? "border-blue-500 bg-blue-50 text-blue-700" : "border-gray-200 text-gray-500 hover:border-gray-300"}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
                <p className="text-xs text-gray-400 mt-1">Current: <span className={`badge ${statusColor[overrideRec.status]}`}>{overrideRec.status}</span></p>
              </div>
              <div>
                <label className="label text-xs mb-1 block" htmlFor="override-reason">Reason <span className="text-red-400">*</span></label>
                <textarea
                  id="override-reason"
                  rows={3}
                  value={overrideReason}
                  onChange={(e) => setOverrideReason(e.target.value)}
                  className="input resize-none"
                  placeholder="Explain why this record is being changed…"
                />
              </div>
            </div>
            <div className="px-6 pb-5 flex justify-end gap-2">
              <button type="button" onClick={() => setOverrideRec(null)} className="btn-secondary text-sm">Cancel</button>
              <button
                type="button"
                onClick={submitOverride}
                disabled={saving || !overrideReason.trim() || overrideStatus === overrideRec.status}
                className="btn-primary text-sm flex items-center gap-1.5"
              >
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
                Save Override
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

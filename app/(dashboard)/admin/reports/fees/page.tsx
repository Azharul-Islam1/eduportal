"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, Download } from "lucide-react";
import {
  LineChart, Line, BarChart, Bar, XAxis, YAxis, Tooltip, Legend,
  ResponsiveContainer, CartesianGrid,
} from "recharts";

interface ClassOption { id: string; name: string; section: string }
interface Summary { totalBilled: number; totalCollected: number; outstanding: number; overdueCount: number }
interface MonthlyRow { month: string; billed: number; collected: number }
interface ClassDueRow { className: string; outstanding: number }
interface DefaulterRow {
  studentName: string; className: string; invoiceNo: string;
  totalBilled: number; totalPaid: number; outstanding: number; status: string;
}

const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"];

export default function FeesReportPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [paymentMode, setPaymentMode] = useState("");
  const [summary, setSummary] = useState<Summary>({ totalBilled: 0, totalCollected: 0, outstanding: 0, overdueCount: 0 });
  const [monthly, setMonthly] = useState<MonthlyRow[]>([]);
  const [classDues, setClassDues] = useState<ClassDueRow[]>([]);
  const [defaulters, setDefaulters] = useState<DefaulterRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/classes").then((r) => r.json()).then(setClasses);
  }, []);

  const fetchReport = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (classId) params.set("classId", classId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (paymentMode) params.set("paymentMode", paymentMode);
    const res = await fetch(`/api/reports/fees?${params}`);
    const data = await res.json();
    setSummary(data.summary ?? { totalBilled: 0, totalCollected: 0, outstanding: 0, overdueCount: 0 });
    setMonthly(data.monthlyCollection ?? []);
    setClassDues(data.classDues ?? []);
    setDefaulters(data.defaulters ?? []);
    setLoading(false);
  }, [classId, fromDate, toDate, paymentMode]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function exportCsv() {
    const params = new URLSearchParams({ format: "csv" });
    if (classId) params.set("classId", classId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    if (paymentMode) params.set("paymentMode", paymentMode);
    window.open(`/api/reports/fees?${params}`, "_blank");
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div>
      <Header title="Fee Collection Report" />
      <div className="p-6 space-y-5">
        <Link href="/admin/reports" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label text-xs mb-1" htmlFor="fee-class">Class</label>
              <select id="fee-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="input min-w-44">
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs mb-1" htmlFor="fee-from">From</label>
              <input id="fee-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label text-xs mb-1" htmlFor="fee-to">To</label>
              <input id="fee-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label text-xs mb-1" htmlFor="fee-mode">Payment Mode</label>
              <select id="fee-mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="input">
                <option value="">All modes</option>
                {PAYMENT_MODES.map((m) => <option key={m} value={m}>{m}</option>)}
              </select>
            </div>
            <button type="button" onClick={fetchReport} className="btn-secondary text-sm">Apply</button>
            <button type="button" onClick={exportCsv} className="btn-secondary text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total Billed", value: fmt(summary.totalBilled), color: "text-gray-800" },
            { label: "Collected", value: fmt(summary.totalCollected), color: "text-green-700" },
            { label: "Outstanding", value: fmt(summary.outstanding), color: "text-red-600" },
            { label: "Overdue Invoices", value: summary.overdueCount, color: "text-orange-600" },
          ].map((c) => (
            <div key={c.label} className="card p-4">
              <p className={`text-xl font-bold ${c.color}`}>{c.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Charts row */}
        {mounted && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {monthly.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Collection</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <LineChart data={monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Legend />
                    <Line type="monotone" dataKey="billed" name="Billed" stroke="#94a3b8" strokeWidth={2} dot={false} />
                    <Line type="monotone" dataKey="collected" name="Collected" stroke="#22c55e" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            )}
            {classDues.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Outstanding by Class</h3>
                <ResponsiveContainer width="100%" height={240}>
                  <BarChart data={classDues} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="className" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip formatter={(v: number) => fmt(v)} />
                    <Bar dataKey="outstanding" name="Outstanding" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>
        )}

        {/* Defaulters table */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="text-sm font-semibold text-gray-700">Defaulters ({defaulters.length})</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {["Student", "Class", "Invoice", "Billed", "Paid", "Outstanding", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={7} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                {!loading && defaulters.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No outstanding dues found.</td></tr>}
                {defaulters.map((d, i) => (
                  <tr key={i} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{d.studentName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{d.className}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{d.invoiceNo}</td>
                    <td className="px-4 py-3 text-gray-700">{fmt(d.totalBilled)}</td>
                    <td className="px-4 py-3 text-green-700">{fmt(d.totalPaid)}</td>
                    <td className="px-4 py-3 font-semibold text-red-600">{fmt(d.outstanding)}</td>
                    <td className="px-4 py-3">
                      <span className={`badge text-xs ${d.status === "OVERDUE" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>{d.status}</span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, useMemo } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, ChevronLeft, AlertCircle, DollarSign, Users, TrendingDown } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface DueRow {
  studentId: string; studentName: string; class: string;
  totalDue: number; paid: number; balance: number; invoiceCount: number;
  lastPayment: string | null; overdueSince: string | null;
}
interface Summary {
  totalCollected: number; totalOutstanding: number; overdueCount: number; overdueAmount: number;
}

export default function DuesDashboardPage() {
  const [rows, setRows] = useState<DueRow[]>([]);
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [sortBy, setSortBy] = useState<"balance" | "overdue">("balance");
  const [academicYear, setAcademicYear] = useState("2025-2026");

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [duesRes, sumRes] = await Promise.all([
        fetch(`/api/fees/dues?academicYear=${academicYear}`),
        fetch(`/api/fees/summary?academicYear=${academicYear}`),
      ]);
      setRows(await duesRes.json());
      setSummary(await sumRes.json());
      setLoading(false);
    }
    load();
  }, [academicYear]);

  const filtered = useMemo(() => {
    const q = search.toLowerCase();
    const data = q ? rows.filter((r) => r.studentName.toLowerCase().includes(q) || r.class.toLowerCase().includes(q)) : rows;
    return [...data].sort((a, b) =>
      sortBy === "balance" ? b.balance - a.balance :
        (a.overdueSince ?? "z").localeCompare(b.overdueSince ?? "z")
    );
  }, [rows, search, sortBy]);

  return (
    <div>
      <Header title="Dues Dashboard" />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Finance
          </Link>
        </div>

        {/* Summary cards */}
        {summary && (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { label: "Total Outstanding", value: summary.totalOutstanding, icon: DollarSign, color: "bg-yellow-100 text-yellow-600" },
              { label: "Total Collected", value: summary.totalCollected, icon: TrendingDown, color: "bg-green-100 text-green-600" },
              { label: "Overdue Amount", value: summary.overdueAmount, icon: AlertCircle, color: "bg-red-100 text-red-600" },
              { label: "Students with Dues", value: rows.length, icon: Users, color: "bg-blue-100 text-blue-600", isCurrency: false },
            ].map((c) => (
              <div key={c.label} className="card p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${c.color}`}><c.icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="font-bold text-gray-900">{c.isCurrency === false ? c.value : formatCurrency(c.value as number)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Filters */}
        <div className="flex flex-wrap gap-3 items-center">
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search student / class…" className="input max-w-xs" />
          <select value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="input max-w-[150px]" aria-label="Academic year">
            <option>2024-2025</option>
            <option>2025-2026</option>
          </select>
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(["balance", "overdue"] as const).map((s) => (
              <button key={s} type="button" onClick={() => setSortBy(s)} className={`px-3 py-1 rounded-md text-xs font-medium capitalize transition ${sortBy === s ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>
                Sort by {s}
              </button>
            ))}
          </div>
          <Link href="/admin/fees/payments/new" className="btn-primary ml-auto text-sm">+ Record Payment</Link>
        </div>

        {/* Table */}
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : filtered.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">No outstanding dues found.</div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {["Student", "Class", "Invoices", "Total Due", "Paid", "Balance", "Last Payment", "Overdue Since", ""].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filtered.map((r) => (
                  <tr key={r.studentId} className={`hover:bg-gray-50 ${r.overdueSince ? "bg-red-50/30" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{r.studentName}</td>
                    <td className="px-4 py-3 text-gray-600">{r.class}</td>
                    <td className="px-4 py-3 text-gray-500 text-center">{r.invoiceCount}</td>
                    <td className="px-4 py-3 font-medium text-gray-700">{formatCurrency(r.totalDue)}</td>
                    <td className="px-4 py-3 text-green-600">{formatCurrency(r.paid)}</td>
                    <td className="px-4 py-3 font-bold text-red-600">{formatCurrency(r.balance)}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.lastPayment ? formatDate(r.lastPayment) : "Never"}</td>
                    <td className="px-4 py-3 text-xs">
                      {r.overdueSince
                        ? <span className="bg-red-100 text-red-600 px-1.5 py-0.5 rounded">{formatDate(r.overdueSince)}</span>
                        : <span className="text-gray-400">—</span>}
                    </td>
                    <td className="px-4 py-3">
                      <Link href={`/admin/fees/payments/new`} className="text-xs text-blue-600 hover:underline">Pay</Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

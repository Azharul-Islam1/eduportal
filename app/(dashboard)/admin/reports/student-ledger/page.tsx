"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, Search, Printer, TrendingUp, DollarSign, UserCheck } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface StudentOption { id: string; studentId: string; user: { name: string }; class: { name: string; section: string } }

interface LedgerData {
  student: { name: string; email: string; admissionNo: string; className: string; rollNumber: string | null; avatar: string | null };
  fees: {
    invoices: { id: string; invoiceNo: string; totalAmount: number; paidAmount: number; status: string; dueDate: string; period: string; payments: { receiptNumber: string; amount: number; paymentDate: string; paymentMode: string }[] }[];
    totalBilled: number; totalPaid: number; balance: number;
  };
  attendance: {
    monthly: { month: string; PRESENT: number; ABSENT: number; LATE: number; total: number; percentage: number }[];
    summary: { total: number; present: number; absent: number; percentage: number };
  };
  results: { examName: string; academicYear: string; subject: string; maxMarks: number; obtained: number | null; isAbsent: boolean; isDraft: boolean; percentage: number | null }[];
}

export default function StudentLedgerPage() {
  const [query, setQuery] = useState("");
  const [options, setOptions] = useState<StudentOption[]>([]);
  const [searching, setSearching] = useState(false);
  const [selected, setSelected] = useState<StudentOption | null>(null);
  const [showDropdown, setShowDropdown] = useState(false);
  const [ledger, setLedger] = useState<LedgerData | null>(null);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => { setMounted(true); }, []);

  useEffect(() => {
    if (!query || query.length < 2) { setOptions([]); setShowDropdown(false); return; }
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/students?search=${encodeURIComponent(query)}`);
      const data = await res.json();
      setOptions(data.students ?? data ?? []);
      setShowDropdown(true);
      setSearching(false);
    }, 350);
  }, [query]);

  const loadLedger = useCallback(async (studentId: string) => {
    setLoading(true);
    const res = await fetch(`/api/reports/student-ledger?studentId=${studentId}`);
    setLedger(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { if (selected) loadLedger(selected.id); }, [selected, loadLedger]);

  function selectStudent(s: StudentOption) {
    setSelected(s);
    setQuery(s.user.name);
    setShowDropdown(false);
  }

  function handlePrint() {
    const prev = document.title;
    document.title = `Ledger_${ledger?.student.name ?? "student"}`;
    window.print();
    document.title = prev;
  }

  const fmt = (n: number) => `₹${n.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #ledger-content, #ledger-content * { visibility: visible !important; }
          #ledger-content { position: fixed !important; top: 0; left: 0; width: 100%; padding: 20px; }
          .no-print { display: none !important; }
        }
      `}</style>
      <Header title="Student Ledger" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3 no-print">
          <Link href="/admin/reports" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Reports
          </Link>
          {ledger && (
            <button type="button" onClick={handlePrint} className="btn-primary flex items-center gap-1.5 text-sm">
              <Printer className="w-4 h-4" /> Print / PDF
            </button>
          )}
        </div>

        {/* Student search */}
        <div className="card p-4 no-print">
          <label className="label text-xs mb-1" htmlFor="student-search">Search Student</label>
          <div className="relative max-w-md">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                id="student-search"
                type="text"
                value={query}
                onChange={(e) => { setQuery(e.target.value); setSelected(null); }}
                className="input pl-9"
                placeholder="Type student name or admission no…"
                autoComplete="off"
              />
              {searching && <Loader2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 animate-spin text-gray-400" />}
            </div>
            {showDropdown && options.length > 0 && (
              <div className="absolute z-20 w-full mt-1 bg-white border border-gray-200 rounded-xl shadow-lg max-h-52 overflow-y-auto">
                {options.map((s) => (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm"
                  >
                    <span className="font-medium text-gray-800">{s.user.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{s.studentId} · {s.class.name} {s.class.section}</span>
                  </button>
                ))}
              </div>
            )}
          </div>
        </div>

        {!selected && !loading && (
          <div className="card p-12 text-center text-gray-400">
            <Search className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Search and select a student to view their complete ledger.</p>
          </div>
        )}

        {loading && <div className="flex justify-center py-16"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>}

        {ledger && !loading && (
          <div id="ledger-content" className="space-y-5">
            {/* Student info */}
            <div className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-14 h-14 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xl font-bold shrink-0">
                  {ledger.student.name[0]}
                </div>
                <div>
                  <h2 className="text-lg font-semibold text-gray-900">{ledger.student.name}</h2>
                  <p className="text-sm text-gray-500">{ledger.student.className} · Admission No: <span className="font-mono">{ledger.student.admissionNo}</span></p>
                  {ledger.student.rollNumber && <p className="text-xs text-gray-400">Roll No: {ledger.student.rollNumber}</p>}
                </div>
              </div>
            </div>

            {/* Summary row */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div className="card p-4 flex gap-3 items-center">
                <DollarSign className="w-8 h-8 text-green-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Fee Balance</p>
                  <p className={`text-xl font-bold ${ledger.fees.balance > 0 ? "text-red-600" : "text-green-700"}`}>{fmt(ledger.fees.balance)}</p>
                  <p className="text-xs text-gray-400">{fmt(ledger.fees.totalPaid)} paid of {fmt(ledger.fees.totalBilled)}</p>
                </div>
              </div>
              <div className="card p-4 flex gap-3 items-center">
                <UserCheck className="w-8 h-8 text-blue-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Attendance</p>
                  <p className={`text-xl font-bold ${ledger.attendance.summary.percentage >= 75 ? "text-green-700" : "text-red-600"}`}>{ledger.attendance.summary.percentage}%</p>
                  <p className="text-xs text-gray-400">{ledger.attendance.summary.present} present / {ledger.attendance.summary.total} days</p>
                </div>
              </div>
              <div className="card p-4 flex gap-3 items-center">
                <TrendingUp className="w-8 h-8 text-purple-500 shrink-0" />
                <div>
                  <p className="text-sm font-semibold text-gray-700">Exams Taken</p>
                  <p className="text-xl font-bold text-gray-800">{ledger.results.length}</p>
                  <p className="text-xs text-gray-400">{ledger.results.filter((r) => !r.isDraft).length} finalised</p>
                </div>
              </div>
            </div>

            {/* Monthly attendance chart */}
            {mounted && ledger.attendance.monthly.length > 0 && (
              <div className="card p-5">
                <h3 className="text-sm font-semibold text-gray-700 mb-4">Monthly Attendance</h3>
                <ResponsiveContainer width="100%" height={200}>
                  <BarChart data={ledger.attendance.monthly} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                    <XAxis dataKey="month" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Bar dataKey="PRESENT" name="Present" stackId="a" fill="#22c55e" />
                    <Bar dataKey="LATE" name="Late" stackId="a" fill="#facc15" />
                    <Bar dataKey="ABSENT" name="Absent" stackId="a" fill="#ef4444" radius={[4, 4, 0, 0]} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            )}

            {/* Exam results */}
            {ledger.results.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Exam Results</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      {["Exam", "Subject", "Obtained", "Max", "%", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledger.results.map((r, i) => (
                      <tr key={i} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-medium text-gray-800">{r.examName}</td>
                        <td className="px-4 py-2.5 text-gray-600">{r.subject}</td>
                        <td className="px-4 py-2.5 text-gray-700">{r.isAbsent ? "AB" : (r.obtained ?? "—")}</td>
                        <td className="px-4 py-2.5 text-gray-400">{r.maxMarks}</td>
                        <td className="px-4 py-2.5">
                          {r.percentage != null ? (
                            <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.percentage >= 40 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                              {r.percentage}%
                            </span>
                          ) : "—"}
                        </td>
                        <td className="px-4 py-2.5">
                          <span className={`badge text-xs ${r.isDraft ? "bg-yellow-100 text-yellow-700" : "bg-green-100 text-green-700"}`}>
                            {r.isDraft ? "Draft" : "Final"}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Fee history */}
            {ledger.fees.invoices.length > 0 && (
              <div className="card overflow-hidden">
                <div className="px-4 py-3 border-b border-gray-100">
                  <h3 className="text-sm font-semibold text-gray-700">Fee History</h3>
                </div>
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      {["Invoice", "Period", "Billed", "Paid", "Balance", "Status"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {ledger.fees.invoices.map((inv) => (
                      <tr key={inv.id} className="hover:bg-gray-50">
                        <td className="px-4 py-2.5 font-mono text-xs text-gray-600">{inv.invoiceNo}</td>
                        <td className="px-4 py-2.5 text-gray-600 capitalize">{inv.period}</td>
                        <td className="px-4 py-2.5 text-gray-700">{fmt(inv.totalAmount)}</td>
                        <td className="px-4 py-2.5 text-green-700">{fmt(inv.paidAmount)}</td>
                        <td className="px-4 py-2.5 font-medium text-red-600">{fmt(inv.totalAmount - inv.paidAmount)}</td>
                        <td className="px-4 py-2.5">
                          <span className={`badge text-xs ${inv.status === "PAID" ? "bg-green-100 text-green-700" : inv.status === "OVERDUE" ? "bg-red-100 text-red-600" : "bg-yellow-100 text-yellow-700"}`}>{inv.status}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

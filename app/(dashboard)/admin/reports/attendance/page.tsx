"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, Download } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
} from "recharts";

interface ClassOption { id: string; name: string; section: string }
interface StudentRow {
  studentId: string; studentName: string; className: string;
  PRESENT: number; ABSENT: number; LATE: number; EXCUSED: number;
  total: number; percentage: number;
}
interface ClassChartRow { className: string; percentage: number; students: number }

export default function AttendanceReportPage() {
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [fromDate, setFromDate] = useState("");
  const [toDate, setToDate] = useState("");
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [classChart, setClassChart] = useState<ClassChartRow[]>([]);
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
    const res = await fetch(`/api/reports/attendance?${params}`);
    const data = await res.json();
    setStudents(data.students ?? []);
    setClassChart(data.classChart ?? []);
    setLoading(false);
  }, [classId, fromDate, toDate]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function exportCsv() {
    const params = new URLSearchParams({ format: "csv" });
    if (classId) params.set("classId", classId);
    if (fromDate) params.set("fromDate", fromDate);
    if (toDate) params.set("toDate", toDate);
    window.open(`/api/reports/attendance?${params}`, "_blank");
  }

  const avg = students.length > 0 ? Math.round(students.reduce((s, r) => s + r.percentage, 0) / students.length) : 0;
  const below75 = students.filter((r) => r.percentage < 75).length;

  return (
    <div>
      <Header title="Attendance Report" />
      <div className="p-6 space-y-5">
        <Link href="/admin/reports" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>

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
              <label className="label text-xs mb-1" htmlFor="att-from">From</label>
              <input id="att-from" type="date" value={fromDate} onChange={(e) => setFromDate(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label text-xs mb-1" htmlFor="att-to">To</label>
              <input id="att-to" type="date" value={toDate} onChange={(e) => setToDate(e.target.value)} className="input" />
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
            { label: "Total Students", value: students.length },
            { label: "Average Attendance", value: `${avg}%` },
            { label: "Below 75%", value: below75 },
            { label: "Classes", value: classChart.length },
          ].map((c) => (
            <div key={c.label} className="card p-4">
              <p className="text-xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Bar chart */}
        {mounted && classChart.length > 0 && (
          <div className="card p-5">
            <h3 className="text-sm font-semibold text-gray-700 mb-4">Class-wise Average Attendance %</h3>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={classChart} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                <XAxis dataKey="className" tick={{ fontSize: 11 }} />
                <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} unit="%" />
                <Tooltip formatter={(v: number) => [`${v}%`, "Attendance"]} />
                <Bar dataKey="percentage" name="Attendance %" fill="#3b82f6" radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}

        {/* Student table */}
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
                {loading && <tr><td colSpan={8} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                {!loading && students.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">No data. Adjust filters and try again.</td></tr>}
                {students.map((s) => (
                  <tr key={s.studentId} className={`hover:bg-gray-50 ${s.percentage < 75 ? "bg-red-50/40" : ""}`}>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.studentName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.className}</td>
                    <td className="px-4 py-3 text-green-700 font-medium">{s.PRESENT}</td>
                    <td className="px-4 py-3 text-red-600 font-medium">{s.ABSENT}</td>
                    <td className="px-4 py-3 text-yellow-700 font-medium">{s.LATE}</td>
                    <td className="px-4 py-3 text-blue-700 font-medium">{s.EXCUSED}</td>
                    <td className="px-4 py-3 text-gray-600">{s.total}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${s.percentage >= 75 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {s.percentage}%
                      </span>
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

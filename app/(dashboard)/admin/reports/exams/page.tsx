"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, Download, Trophy } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer, CartesianGrid,
  PieChart, Pie, Cell,
} from "recharts";

interface ExamOption { id: string; name: string; academicYear: string }
interface ClassOption { id: string; name: string; section: string }
interface Summary { total: number; pass: number; fail: number; avgPct: number; topperName: string | null; topperPct: number | null }
interface SubjectAvg { subject: string; average: number; count: number }
interface GradeItem { grade: string; count: number }
interface ResultRow {
  rank: number; studentId: string; name: string; className: string;
  totalObtained: number; totalMax: number; percentage: number; grade: string;
}

const GRADE_COLORS: Record<string, string> = {
  "A+": "#22c55e", A: "#4ade80", "B+": "#3b82f6", B: "#60a5fa",
  C: "#facc15", D: "#f97316", F: "#ef4444",
};

export default function ExamReportPage() {
  const [exams, setExams] = useState<ExamOption[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [examId, setExamId] = useState("");
  const [classId, setClassId] = useState("");
  const [summary, setSummary] = useState<Summary | null>(null);
  const [subjectAverages, setSubjectAverages] = useState<SubjectAvg[]>([]);
  const [gradeDistribution, setGradeDistribution] = useState<GradeItem[]>([]);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    Promise.all([
      fetch("/api/reports/exams").then((r) => r.json()),
      fetch("/api/classes").then((r) => r.json()),
    ]).then(([examData, classData]) => {
      setExams(examData.exams ?? []);
      setClasses(classData);
    });
  }, []);

  const fetchReport = useCallback(async () => {
    if (!examId) return;
    setLoading(true);
    const params = new URLSearchParams({ examId });
    if (classId) params.set("classId", classId);
    const res = await fetch(`/api/reports/exams?${params}`);
    const data = await res.json();
    setSummary(data.summary ?? null);
    setSubjectAverages(data.subjectAverages ?? []);
    setGradeDistribution(data.gradeDistribution ?? []);
    setRows(data.rows ?? []);
    setLoading(false);
  }, [examId, classId]);

  useEffect(() => { fetchReport(); }, [fetchReport]);

  function exportCsv() {
    if (!examId) return;
    const params = new URLSearchParams({ examId, format: "csv" });
    if (classId) params.set("classId", classId);
    window.open(`/api/reports/exams?${params}`, "_blank");
  }

  return (
    <div>
      <Header title="Exam Performance Report" />
      <div className="p-6 space-y-5">
        <Link href="/admin/reports" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Reports
        </Link>

        {/* Filters */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-end">
            <div>
              <label className="label text-xs mb-1" htmlFor="ex-exam">Exam *</label>
              <select id="ex-exam" value={examId} onChange={(e) => setExamId(e.target.value)} className="input min-w-52">
                <option value="">Select exam…</option>
                {exams.map((e) => <option key={e.id} value={e.id}>{e.name} ({e.academicYear})</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs mb-1" htmlFor="ex-class">Class</label>
              <select id="ex-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="input min-w-44">
                <option value="">All classes</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
              </select>
            </div>
            <button type="button" onClick={fetchReport} disabled={!examId} className="btn-secondary text-sm">Apply</button>
            <button type="button" onClick={exportCsv} disabled={!examId} className="btn-secondary text-sm flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Export CSV
            </button>
          </div>
        </div>

        {!examId && (
          <div className="card p-12 text-center text-gray-400">
            <Trophy className="w-10 h-10 mx-auto mb-3 opacity-30" />
            <p>Select an exam to view performance report.</p>
          </div>
        )}

        {examId && summary && (
          <>
            {/* Summary cards */}
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
              {[
                { label: "Students", value: summary.total },
                { label: "Pass", value: summary.pass },
                { label: "Fail", value: summary.fail },
                { label: "Class Average", value: `${summary.avgPct}%` },
                { label: "Pass Rate", value: summary.total > 0 ? `${Math.round((summary.pass / summary.total) * 100)}%` : "—" },
                { label: "Topper", value: summary.topperName ?? "—" },
              ].map((c) => (
                <div key={c.label} className="card p-3">
                  <p className="text-lg font-bold text-gray-800 truncate" title={String(c.value)}>{c.value}</p>
                  <p className="text-xs text-gray-400 mt-0.5">{c.label}</p>
                </div>
              ))}
            </div>

            {/* Charts */}
            {mounted && (
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
                {subjectAverages.length > 0 && (
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Subject-wise Average %</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <BarChart data={subjectAverages} margin={{ top: 5, right: 20, left: 0, bottom: 5 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#f3f4f6" />
                        <XAxis dataKey="subject" tick={{ fontSize: 10 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10 }} unit="%" />
                        <Tooltip formatter={(v: number) => [`${v}%`, "Average"]} />
                        <Bar dataKey="average" name="Average %" fill="#8b5cf6" radius={[4, 4, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                )}
                {gradeDistribution.length > 0 && (
                  <div className="card p-5">
                    <h3 className="text-sm font-semibold text-gray-700 mb-4">Grade Distribution</h3>
                    <ResponsiveContainer width="100%" height={240}>
                      <PieChart>
                        <Pie data={gradeDistribution} dataKey="count" nameKey="grade" cx="50%" cy="50%" outerRadius={90} label={({ grade, percent }) => `${grade} ${(percent * 100).toFixed(0)}%`} labelLine={false}>
                          {gradeDistribution.map((entry, index) => (
                            <Cell key={index} fill={GRADE_COLORS[entry.grade] ?? "#94a3b8"} />
                          ))}
                        </Pie>
                        <Tooltip formatter={(v: number, name: string) => [v, name]} />
                        <Legend />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                )}
              </div>
            )}

            {/* Results table */}
            <div className="card overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                    <tr>
                      {["Rank", "Student", "Class", "Total", "Percentage", "Grade"].map((h) => (
                        <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {loading && <tr><td colSpan={6} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                    {!loading && rows.length === 0 && <tr><td colSpan={6} className="py-8 text-center text-gray-400">No marks entered for this exam yet.</td></tr>}
                    {rows.map((r) => (
                      <tr key={r.studentId} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-gray-400 font-medium">#{r.rank}</td>
                        <td className="px-4 py-3 font-medium text-gray-800">{r.name}</td>
                        <td className="px-4 py-3 text-gray-500 text-xs">{r.className}</td>
                        <td className="px-4 py-3 text-gray-700">{r.totalObtained}/{r.totalMax}</td>
                        <td className="px-4 py-3">
                          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.percentage >= 75 ? "bg-green-100 text-green-700" : r.percentage >= 40 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                            {r.percentage}%
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          <span className="badge text-xs font-bold" style={{ backgroundColor: `${GRADE_COLORS[r.grade]}22`, color: GRADE_COLORS[r.grade] ?? "#374151" }}>{r.grade}</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, Globe, GlobeLock, FileText } from "lucide-react";

const GRADE_STYLE: Record<string, string> = {
  "A+": "bg-green-100 text-green-800",
  A: "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  B: "bg-blue-100 text-blue-600",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-orange-100 text-orange-700",
  F: "bg-red-100 text-red-700",
};

interface ResultRow {
  studentId: string;
  studentName: string;
  classId: string;
  className: string;
  subjectMarks: Record<string, { obtained: number | null; max: number; passing: number; isAbsent: boolean }>;
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  rank: number;
  allEntered: boolean;
}

interface SubjectCol { id: string; name: string }
interface ClassOption { id: string; name: string; section: string }

export default function ExamResultsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const [examName, setExamName] = useState("");
  const [examStatus, setExamStatus] = useState("");
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [subjects, setSubjects] = useState<SubjectCol[]>([]);
  const [rows, setRows] = useState<ResultRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [publishing, setPublishing] = useState(false);

  useEffect(() => {
    const loadMeta = async () => {
      const [examRes, classRes] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch("/api/classes"),
      ]);
      const examData = await examRes.json();
      setExamName(examData.name ?? "");
      setExamStatus(examData.status ?? "");
      setClasses(await classRes.json());
    };
    loadMeta();
  }, [examId]);

  useEffect(() => {
    const loadResults = async () => {
      setLoading(true);
      const params = classId ? `?classId=${classId}` : "";
      const res = await fetch(`/api/exams/${examId}/results${params}`);
      const data = await res.json();
      setSubjects(data.subjects ?? []);
      setRows(data.rows ?? []);
      setLoading(false);
    };
    loadResults();
  }, [examId, classId]);

  async function togglePublish() {
    const msg = examStatus === "PUBLISHED"
      ? "Unpublish results?"
      : "Publish results? Students will be able to see them.";
    if (!confirm(msg)) return;
    setPublishing(true);
    const res = await fetch(`/api/exams/${examId}/publish`, { method: "POST" });
    const updated = await res.json();
    setExamStatus(updated.status);
    setPublishing(false);
  }

  return (
    <div>
      <Header title="Results" />
      <div className="p-6 space-y-5">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href={`/admin/exams/${examId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> {examName}
          </Link>
          <button
            type="button"
            onClick={togglePublish}
            disabled={publishing}
            className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium transition ${examStatus === "PUBLISHED" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
          >
            {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : examStatus === "PUBLISHED" ? <GlobeLock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
            {examStatus === "PUBLISHED" ? "Unpublish" : "Publish Results"}
          </button>
        </div>

        {/* Class filter */}
        <div className="flex gap-3 items-end">
          <div>
            <label className="label text-xs mb-1" htmlFor="res-class">Filter by Class</label>
            <select id="res-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="input min-w-44">
              <option value="">All classes</option>
              {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
            </select>
          </div>
        </div>

        {/* Results table */}
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium sticky left-0 bg-gray-50">#</th>
                  <th className="px-4 py-3 text-left font-medium sticky left-8 bg-gray-50">Student</th>
                  <th className="px-4 py-3 text-left font-medium">Class</th>
                  {subjects.map((s) => (
                    <th key={s.id} className="px-3 py-3 text-center font-medium min-w-20">{s.name}</th>
                  ))}
                  <th className="px-4 py-3 text-center font-medium">Total</th>
                  <th className="px-4 py-3 text-center font-medium">%</th>
                  <th className="px-4 py-3 text-center font-medium">Grade</th>
                  <th className="px-4 py-3 text-center font-medium">Rank</th>
                  <th className="px-4 py-3 text-center font-medium">Card</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr><td colSpan={9 + subjects.length} className="py-10 text-center">
                    <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                  </td></tr>
                )}
                {!loading && rows.length === 0 && (
                  <tr><td colSpan={9 + subjects.length} className="py-10 text-center text-gray-400">
                    No marks entered yet. Enter marks via the Papers page.
                  </td></tr>
                )}
                {rows.map((r) => (
                  <tr key={r.studentId} className="hover:bg-gray-50">
                    <td className="px-4 py-3 text-gray-400 text-xs sticky left-0 bg-white">{r.rank}</td>
                    <td className="px-4 py-3 font-medium text-gray-800 sticky left-8 bg-white">{r.studentName}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{r.className}</td>
                    {subjects.map((s) => {
                      const sm = r.subjectMarks[s.id];
                      if (!sm) return <td key={s.id} className="px-3 py-3 text-center text-gray-300">—</td>;
                      const isFail = !sm.isAbsent && sm.obtained !== null && sm.obtained < sm.passing;
                      return (
                        <td key={s.id} className={`px-3 py-3 text-center text-xs font-medium ${isFail ? "text-red-600" : "text-gray-700"}`}>
                          {sm.isAbsent ? <span className="text-gray-400">AB</span> : sm.obtained ?? "—"}
                          <span className="text-gray-300">/{sm.max}</span>
                        </td>
                      );
                    })}
                    <td className="px-4 py-3 text-center font-medium text-gray-800">{r.totalObtained}/{r.totalMax}</td>
                    <td className="px-4 py-3 text-center">
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${r.percentage >= 75 ? "bg-green-100 text-green-700" : r.percentage >= 50 ? "bg-yellow-100 text-yellow-700" : "bg-red-100 text-red-600"}`}>
                        {r.percentage}%
                      </span>
                    </td>
                    <td className="px-4 py-3 text-center">
                      <span className={`badge ${GRADE_STYLE[r.grade] ?? "bg-gray-100 text-gray-600"}`}>{r.grade}</span>
                    </td>
                    <td className="px-4 py-3 text-center font-bold text-gray-700">#{r.rank}</td>
                    <td className="px-4 py-3 text-center">
                      <Link
                        href={`/admin/exams/${examId}/results/${r.studentId}`}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 inline-flex"
                        title="View result card"
                      >
                        <FileText className="w-3.5 h-3.5" />
                      </Link>
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

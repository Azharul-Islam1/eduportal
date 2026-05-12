"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, Save, CheckCircle2, AlertTriangle } from "lucide-react";

interface StudentMark {
  studentId: string;
  name: string;
  marksObtained: string;
  isAbsent: boolean;
}

interface PaperData {
  id: string;
  maxMarks: number;
  passingMarks: number;
  subject: { name: string; code: string };
  class: { id: string; name: string; section: string; students: { id: string; studentId: string; user: { name: string } }[] };
  marks: { studentId: string; marksObtained: number | null; isAbsent: boolean; isDraft: boolean }[];
}

export default function MarksEntryPage({ params }: { params: Promise<{ id: string; paperId: string }> }) {
  const { id: examId, paperId } = use(params);
  const [paper, setPaper] = useState<PaperData | null>(null);
  const [rows, setRows] = useState<StudentMark[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [savedAs, setSavedAs] = useState<"draft" | "final" | null>(null);
  const [examName, setExamName] = useState("");

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [paperRes, examRes] = await Promise.all([
        fetch(`/api/exams/${examId}/marks/${paperId}`),
        fetch(`/api/exams/${examId}`),
      ]);
      const paperData: PaperData = await paperRes.json();
      const examData = await examRes.json();
      setExamName(examData.name ?? "");
      setPaper(paperData);

      const markMap = new Map(paperData.marks.map((m) => [m.studentId, m]));
      setRows(
        paperData.class.students.map((s) => {
          const existing = markMap.get(s.id);
          return {
            studentId: s.id,
            name: s.user.name,
            marksObtained: existing?.marksObtained != null ? String(existing.marksObtained) : "",
            isAbsent: existing?.isAbsent ?? false,
          };
        })
      );
      setLoading(false);
    };
    load();
  }, [examId, paperId]);

  function updateRow(studentId: string, field: keyof StudentMark, value: string | boolean) {
    setRows((prev) =>
      prev.map((r) => r.studentId === studentId ? { ...r, [field]: value } : r)
    );
    setSavedAs(null);
  }

  function validate(row: StudentMark): string | null {
    if (row.isAbsent) return null;
    if (row.marksObtained === "") return null;
    const v = parseFloat(row.marksObtained);
    if (isNaN(v)) return "Invalid";
    if (v < 0 || v > (paper?.maxMarks ?? 100)) return `0–${paper?.maxMarks}`;
    return null;
  }

  async function save(isDraft: boolean) {
    setSaving(true);
    const marks = rows.map((r) => ({
      studentId: r.studentId,
      marksObtained: r.isAbsent ? null : (r.marksObtained !== "" ? parseFloat(r.marksObtained) : null),
      isAbsent: r.isAbsent,
    }));
    await fetch(`/api/exams/${examId}/marks/${paperId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ marks, isDraft }),
    });
    setSaving(false);
    setSavedAs(isDraft ? "draft" : "final");
    setTimeout(() => setSavedAs(null), 2500);
  }

  if (loading) return (
    <div>
      <Header title="Marks Entry" />
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
    </div>
  );

  if (!paper) return <div className="p-6 text-gray-400">Paper not found.</div>;

  const hasErrors = rows.some((r) => validate(r) !== null);

  return (
    <div>
      <Header title="Marks Entry" />
      <div className="p-6 space-y-5">
        <Link href={`/admin/exams/${examId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> {examName}
        </Link>

        {/* Paper info */}
        <div className="card p-4 flex flex-wrap gap-4">
          <div>
            <p className="text-xs text-gray-400">Subject</p>
            <p className="font-semibold text-gray-800">{paper.subject.name} <span className="text-xs text-gray-400 font-mono">({paper.subject.code})</span></p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Class</p>
            <p className="font-semibold text-gray-800">{paper.class.name} {paper.class.section}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Max Marks</p>
            <p className="font-semibold text-gray-800">{paper.maxMarks}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Passing Marks</p>
            <p className="font-semibold text-gray-800">{paper.passingMarks}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Students</p>
            <p className="font-semibold text-gray-800">{rows.length}</p>
          </div>
        </div>

        {/* Actions */}
        <div className="flex gap-2 items-center justify-end">
          {savedAs && (
            <span className="flex items-center gap-1 text-sm text-green-600">
              <CheckCircle2 className="w-4 h-4" />
              {savedAs === "draft" ? "Saved as draft" : "Marks submitted"}
            </span>
          )}
          <button type="button" onClick={() => save(true)} disabled={saving || hasErrors} className="btn-secondary text-sm flex items-center gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
            Save Draft
          </button>
          <button type="button" onClick={() => save(false)} disabled={saving || hasErrors} className="btn-primary text-sm flex items-center gap-1.5">
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <CheckCircle2 className="w-4 h-4" />}
            Submit Final
          </button>
        </div>

        {/* Marks table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                <th className="px-4 py-3 text-left font-medium w-8">#</th>
                <th className="px-4 py-3 text-left font-medium">Student</th>
                <th className="px-4 py-3 text-center font-medium w-28">Absent</th>
                <th className="px-4 py-3 text-left font-medium w-40">Marks <span className="normal-case text-gray-400">(0–{paper.maxMarks})</span></th>
                <th className="px-4 py-3 text-left font-medium w-20">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {rows.map((row, i) => {
                const err = validate(row);
                const marks = parseFloat(row.marksObtained);
                const isFail = !row.isAbsent && !isNaN(marks) && row.marksObtained !== "" && marks < paper.passingMarks;
                return (
                  <tr key={row.studentId} className={`${isFail ? "bg-red-50/60" : ""} ${row.isAbsent ? "opacity-60" : ""}`}>
                    <td className="px-4 py-2.5 text-gray-400 text-xs">{i + 1}</td>
                    <td className="px-4 py-2.5 font-medium text-gray-800">{row.name}</td>
                    <td className="px-4 py-2.5 text-center">
                      <input
                        type="checkbox"
                        checked={row.isAbsent}
                        onChange={(e) => updateRow(row.studentId, "isAbsent", e.target.checked)}
                        className="w-4 h-4 rounded accent-red-500"
                      />
                    </td>
                    <td className="px-4 py-2.5">
                      <input
                        type="number"
                        min="0"
                        max={paper.maxMarks}
                        step="0.5"
                        value={row.marksObtained}
                        onChange={(e) => updateRow(row.studentId, "marksObtained", e.target.value)}
                        disabled={row.isAbsent}
                        className={`input w-28 py-1 text-sm ${err ? "border-red-400 bg-red-50" : ""}`}
                        placeholder="—"
                      />
                      {err && <p className="text-xs text-red-500 mt-0.5">{err}</p>}
                    </td>
                    <td className="px-4 py-2.5">
                      {row.isAbsent ? (
                        <span className="badge bg-gray-100 text-gray-500">Absent</span>
                      ) : row.marksObtained === "" ? (
                        <span className="badge bg-gray-100 text-gray-400">—</span>
                      ) : isFail ? (
                        <span className="badge bg-red-100 text-red-600 flex items-center gap-0.5">
                          <AlertTriangle className="w-3 h-3" /> Fail
                        </span>
                      ) : (
                        <span className="badge bg-green-100 text-green-700">Pass</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

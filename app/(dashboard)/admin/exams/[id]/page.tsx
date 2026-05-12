"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, BookOpen, PenLine, BarChart3, Globe, GlobeLock } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
};

interface Paper {
  id: string;
  maxMarks: number;
  passingMarks: number;
  subject: { name: string; code: string };
  class: { name: string; section: string };
  _count: { marks: number };
}

interface ExamDetail {
  id: string;
  name: string;
  academicYear: string;
  startDate: string | null;
  endDate: string | null;
  weightage: number;
  status: "DRAFT" | "ACTIVE" | "PUBLISHED";
  publishedAt: string | null;
  papers: Paper[];
  _count: { papers: number };
}

export default function ExamDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [exam, setExam] = useState<ExamDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [publishing, setPublishing] = useState(false);

  const fetchExam = async () => {
    setLoading(true);
    const res = await fetch(`/api/exams/${id}`);
    setExam(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchExam(); }, [id]);

  async function togglePublish() {
    if (!exam) return;
    const msg = exam.status === "PUBLISHED"
      ? "Unpublish results? Students will no longer see them."
      : "Publish results? All students will be able to see them.";
    if (!confirm(msg)) return;
    setPublishing(true);
    await fetch(`/api/exams/${id}/publish`, { method: "POST" });
    setPublishing(false);
    fetchExam();
  }

  if (loading) return (
    <div>
      <Header title="Exam" />
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
    </div>
  );

  if (!exam) return <div className="p-6 text-gray-400">Exam not found.</div>;

  return (
    <div>
      <Header title={exam.name} />
      <div className="p-6 space-y-6">
        {/* Breadcrumb */}
        <Link href="/admin/exams" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> Examinations
        </Link>

        {/* Exam info card */}
        <div className="card p-5">
          <div className="flex flex-wrap items-start justify-between gap-3">
            <div>
              <div className="flex items-center gap-2 mb-1">
                <h2 className="text-lg font-semibold text-gray-900">{exam.name}</h2>
                <span className={`badge ${STATUS_STYLE[exam.status]}`}>{exam.status}</span>
              </div>
              <p className="text-sm text-gray-500">
                {exam.academicYear}
                {exam.startDate && ` · ${new Date(exam.startDate).toLocaleDateString()}`}
                {exam.endDate && ` → ${new Date(exam.endDate).toLocaleDateString()}`}
                {` · ${exam.weightage}% weightage`}
              </p>
            </div>
            <button
              type="button"
              onClick={togglePublish}
              disabled={publishing}
              className={`flex items-center gap-1.5 text-sm px-4 py-2 rounded-xl font-medium transition ${exam.status === "PUBLISHED" ? "bg-yellow-100 text-yellow-700 hover:bg-yellow-200" : "bg-green-100 text-green-700 hover:bg-green-200"}`}
            >
              {publishing ? <Loader2 className="w-4 h-4 animate-spin" /> : exam.status === "PUBLISHED" ? <GlobeLock className="w-4 h-4" /> : <Globe className="w-4 h-4" />}
              {exam.status === "PUBLISHED" ? "Unpublish" : "Publish Results"}
            </button>
          </div>
        </div>

        {/* Action tiles */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <Link
            href={`/admin/exams/${id}/papers`}
            className="card p-5 hover:border-blue-200 hover:shadow-sm transition group"
          >
            <BookOpen className="w-8 h-8 text-blue-500 mb-3" />
            <h3 className="font-semibold text-gray-800 group-hover:text-blue-600">Papers Config</h3>
            <p className="text-xs text-gray-500 mt-1">{exam._count.papers} paper(s) configured. Set subjects, max marks, passing marks.</p>
          </Link>
          <Link
            href={`/admin/exams/${id}/results`}
            className="card p-5 hover:border-purple-200 hover:shadow-sm transition group"
          >
            <BarChart3 className="w-8 h-8 text-purple-500 mb-3" />
            <h3 className="font-semibold text-gray-800 group-hover:text-purple-600">Results</h3>
            <p className="text-xs text-gray-500 mt-1">View aggregated results, grades, ranks, and result cards.</p>
          </Link>
          <div className="card p-5 bg-gray-50">
            <PenLine className="w-8 h-8 text-gray-300 mb-3" />
            <h3 className="font-semibold text-gray-400">Marks Entry</h3>
            <p className="text-xs text-gray-400 mt-1">Select a paper below to enter student marks.</p>
          </div>
        </div>

        {/* Papers list */}
        {exam.papers.length > 0 && (
          <div>
            <h3 className="text-sm font-semibold text-gray-700 mb-3">Papers — click to enter marks</h3>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>
                    {["Subject", "Class", "Max Marks", "Pass Marks", "Entered", ""].map((h) => (
                      <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {exam.papers.map((p) => (
                    <tr key={p.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{p.subject.name}</td>
                      <td className="px-4 py-3 text-gray-500">{p.class.name} {p.class.section}</td>
                      <td className="px-4 py-3 text-gray-500">{p.maxMarks}</td>
                      <td className="px-4 py-3 text-gray-500">{p.passingMarks}</td>
                      <td className="px-4 py-3">
                        <span className={`badge ${p._count.marks > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                          {p._count.marks} entered
                        </span>
                      </td>
                      <td className="px-4 py-3">
                        <Link
                          href={`/admin/exams/${id}/marks/${p.id}`}
                          className="text-xs text-blue-600 hover:underline font-medium"
                        >
                          Enter Marks →
                        </Link>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

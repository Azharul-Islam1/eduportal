"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { Plus, Loader2, X, ChevronRight, FileText, BookOpen, BarChart3, Eye } from "lucide-react";

const STATUS_STYLE: Record<string, string> = {
  DRAFT: "bg-gray-100 text-gray-600",
  ACTIVE: "bg-blue-100 text-blue-700",
  PUBLISHED: "bg-green-100 text-green-700",
};

interface ExamItem {
  id: string;
  name: string;
  academicYear: string;
  startDate: string | null;
  endDate: string | null;
  weightage: number;
  status: "DRAFT" | "ACTIVE" | "PUBLISHED";
  _count: { papers: number };
}

const defaultForm = { name: "", academicYear: "2025-2026", startDate: "", endDate: "", weightage: "100" };

export default function ExamsPage() {
  const [exams, setExams] = useState<ExamItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(defaultForm);

  const fetchExams = async () => {
    setLoading(true);
    const res = await fetch("/api/exams");
    setExams(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchExams(); }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/exams", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, weightage: parseFloat(form.weightage) }),
    });
    setSaving(false);
    setShowModal(false);
    setForm(defaultForm);
    fetchExams();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this exam and all its papers/marks? This cannot be undone.")) return;
    await fetch(`/api/exams/${id}`, { method: "DELETE" });
    fetchExams();
  }

  const draft = exams.filter((e) => e.status === "DRAFT").length;
  const active = exams.filter((e) => e.status === "ACTIVE").length;
  const published = exams.filter((e) => e.status === "PUBLISHED").length;

  return (
    <div>
      <Header title="Examinations" />
      <div className="p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {[
            { label: "Total", value: exams.length, color: "bg-gray-50" },
            { label: "Draft", value: draft, color: "bg-gray-50" },
            { label: "Active", value: active, color: "bg-blue-50" },
            { label: "Published", value: published, color: "bg-green-50" },
          ].map((c) => (
            <div key={c.label} className={`card p-4 ${c.color}`}>
              <p className="text-2xl font-bold text-gray-800">{c.value}</p>
              <p className="text-xs text-gray-500 mt-0.5">{c.label}</p>
            </div>
          ))}
        </div>

        {/* Header row */}
        <div className="flex items-center justify-between">
          <p className="text-sm text-gray-500">{exams.length} exam(s)</p>
          <button type="button" onClick={() => setShowModal(true)} className="btn-primary flex items-center gap-1.5">
            <Plus className="w-4 h-4" /> New Exam
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {["Exam Name", "Academic Year", "Dates", "Weightage", "Papers", "Status", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="py-10 text-center">
                  <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                </td></tr>
              )}
              {!loading && exams.length === 0 && (
                <tr><td colSpan={7} className="py-10 text-center text-gray-400">
                  No exams yet. Create one to get started.
                </td></tr>
              )}
              {exams.map((ex) => (
                <tr key={ex.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{ex.name}</td>
                  <td className="px-4 py-3 text-gray-500">{ex.academicYear}</td>
                  <td className="px-4 py-3 text-gray-500 text-xs">
                    {ex.startDate ? new Date(ex.startDate).toLocaleDateString() : "—"}
                    {ex.endDate ? ` → ${new Date(ex.endDate).toLocaleDateString()}` : ""}
                  </td>
                  <td className="px-4 py-3 text-gray-500">{ex.weightage}%</td>
                  <td className="px-4 py-3">
                    <span className="badge bg-gray-100 text-gray-600">{ex._count.papers} papers</span>
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${STATUS_STYLE[ex.status] ?? "bg-gray-100"}`}>{ex.status}</span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex items-center gap-1">
                      <Link
                        href={`/admin/exams/${ex.id}`}
                        className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600 transition"
                        title="Open exam"
                      >
                        <ChevronRight className="w-4 h-4" />
                      </Link>
                      <button
                        type="button"
                        onClick={() => handleDelete(ex.id)}
                        className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 transition"
                        title="Delete exam"
                      >
                        <X className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Create modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="bg-white rounded-2xl shadow-xl w-full max-w-md">
            <div className="flex items-center justify-between px-6 pt-5 pb-4 border-b border-gray-100">
              <h2 className="text-base font-semibold text-gray-900">New Exam</h2>
              <button type="button" onClick={() => setShowModal(false)} aria-label="Close dialog" className="p-1.5 rounded hover:bg-gray-100">
                <X className="w-4 h-4 text-gray-400" />
              </button>
            </div>
            <form onSubmit={handleCreate} className="px-6 py-5 space-y-3">
              <div>
                <label className="label text-xs mb-1" htmlFor="exam-name">Exam Name *</label>
                <input id="exam-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Mid-Term 2026" required />
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label text-xs mb-1" htmlFor="exam-year">Academic Year</label>
                  <input id="exam-year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label text-xs mb-1" htmlFor="exam-weight">Weightage (%)</label>
                  <input id="exam-weight" type="number" min="1" max="100" value={form.weightage} onChange={(e) => setForm({ ...form, weightage: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label text-xs mb-1" htmlFor="exam-start">Start Date</label>
                  <input id="exam-start" type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label text-xs mb-1" htmlFor="exam-end">End Date</label>
                  <input id="exam-end" type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-2 pt-1">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create Exam"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

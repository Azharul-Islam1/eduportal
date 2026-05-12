"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Plus, Loader2, X, Pencil, Check } from "lucide-react";

interface ClassOption { id: string; name: string; section: string }
interface SubjectOption { id: string; name: string; code: string }
interface Paper {
  id: string;
  maxMarks: number;
  passingMarks: number;
  subject: { id: string; name: string; code: string };
  class: { id: string; name: string; section: string };
  _count: { marks: number };
}

export default function ExamPapersPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: examId } = use(params);
  const [papers, setPapers] = useState<Paper[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [allSubjects, setAllSubjects] = useState<SubjectOption[]>([]);
  const [classSubjects, setClassSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [examName, setExamName] = useState("");

  const [form, setForm] = useState({ classId: "", subjectId: "", maxMarks: "100", passingMarks: "40" });
  const [saving, setSaving] = useState(false);

  // Inline edit state
  const [editId, setEditId] = useState<string | null>(null);
  const [editVals, setEditVals] = useState({ maxMarks: "", passingMarks: "" });
  const [savingEdit, setSavingEdit] = useState(false);

  const fetchPapers = async () => {
    setLoading(true);
    const [examRes, papersRes] = await Promise.all([
      fetch(`/api/exams/${examId}`),
      fetch(`/api/exams/${examId}/papers`),
    ]);
    const examData = await examRes.json();
    setExamName(examData.name ?? "");
    setPapers(await papersRes.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchPapers();
    Promise.all([
      fetch("/api/classes").then((r) => r.json()),
      fetch("/api/subjects").then((r) => r.json()),
    ]).then(([cls, subs]) => { setClasses(cls); setAllSubjects(subs); });
  }, [examId]);

  // When class changes, filter subjects via class-subject mapping
  useEffect(() => {
    if (!form.classId) { setClassSubjects([]); return; }
    fetch(`/api/class-subjects?classId=${form.classId}`)
      .then((r) => r.json())
      .then((data: { subjectId: string }[]) => {
        const ids = new Set(data.map((d) => d.subjectId));
        setClassSubjects(allSubjects.filter((s) => ids.has(s.id)));
      });
  }, [form.classId, allSubjects]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch(`/api/exams/${examId}/papers`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, maxMarks: parseFloat(form.maxMarks), passingMarks: parseFloat(form.passingMarks) }),
    });
    setSaving(false);
    setForm({ classId: "", subjectId: "", maxMarks: "100", passingMarks: "40" });
    fetchPapers();
  }

  async function handleDelete(paperId: string) {
    await fetch(`/api/exams/${examId}/papers/${paperId}`, { method: "DELETE" });
    fetchPapers();
  }

  function startEdit(p: Paper) {
    setEditId(p.id);
    setEditVals({ maxMarks: String(p.maxMarks), passingMarks: String(p.passingMarks) });
  }

  async function saveEdit(paperId: string) {
    setSavingEdit(true);
    await fetch(`/api/exams/${examId}/papers/${paperId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ maxMarks: parseFloat(editVals.maxMarks), passingMarks: parseFloat(editVals.passingMarks) }),
    });
    setSavingEdit(false);
    setEditId(null);
    fetchPapers();
  }

  return (
    <div>
      <Header title="Papers Config" />
      <div className="p-6 space-y-5">
        <Link href={`/admin/exams/${examId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
          <ChevronLeft className="w-4 h-4" /> {examName || "Exam"}
        </Link>

        {/* Add paper form */}
        <div className="card p-5">
          <h3 className="text-sm font-semibold text-gray-700 mb-3">Add Paper</h3>
          <form onSubmit={handleAdd}>
            <div className="flex flex-wrap gap-3 items-end">
              <div>
                <label className="label text-xs mb-1" htmlFor="paper-class">Class *</label>
                <select id="paper-class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value, subjectId: "" })} className="input min-w-40" required>
                  <option value="">Select class…</option>
                  {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs mb-1" htmlFor="paper-subject">Subject *</label>
                <select id="paper-subject" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input min-w-40" required disabled={!form.classId}>
                  <option value="">Select subject…</option>
                  {classSubjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label text-xs mb-1" htmlFor="paper-max">Max Marks</label>
                <input id="paper-max" type="number" min="1" value={form.maxMarks} onChange={(e) => setForm({ ...form, maxMarks: e.target.value })} className="input w-24" />
              </div>
              <div>
                <label className="label text-xs mb-1" htmlFor="paper-pass">Pass Marks</label>
                <input id="paper-pass" type="number" min="0" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} className="input w-24" />
              </div>
              <button type="submit" disabled={saving} className="btn-primary flex items-center gap-1.5">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
                Add
              </button>
            </div>
          </form>
        </div>

        {/* Papers table */}
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>
                {["Subject", "Code", "Class", "Max Marks", "Pass Marks", "Marks Entered", ""].map((h) => (
                  <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {loading && (
                <tr><td colSpan={7} className="py-10 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>
              )}
              {!loading && papers.length === 0 && (
                <tr><td colSpan={7} className="py-8 text-center text-gray-400">No papers yet. Add one above.</td></tr>
              )}
              {papers.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.subject.name}</td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-400">{p.subject.code}</td>
                  <td className="px-4 py-3 text-gray-500">{p.class.name} {p.class.section}</td>
                  <td className="px-4 py-3">
                    {editId === p.id ? (
                      <input type="number" value={editVals.maxMarks} onChange={(e) => setEditVals({ ...editVals, maxMarks: e.target.value })} className="input w-20 py-0.5 text-xs" />
                    ) : p.maxMarks}
                  </td>
                  <td className="px-4 py-3">
                    {editId === p.id ? (
                      <input type="number" value={editVals.passingMarks} onChange={(e) => setEditVals({ ...editVals, passingMarks: e.target.value })} className="input w-20 py-0.5 text-xs" />
                    ) : p.passingMarks}
                  </td>
                  <td className="px-4 py-3">
                    <span className={`badge ${p._count.marks > 0 ? "bg-green-100 text-green-700" : "bg-gray-100 text-gray-500"}`}>
                      {p._count.marks}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-1">
                      {editId === p.id ? (
                        <button type="button" onClick={() => saveEdit(p.id)} disabled={savingEdit} className="p-1.5 rounded hover:bg-green-50 text-green-600" title="Save">
                          {savingEdit ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : <Check className="w-3.5 h-3.5" />}
                        </button>
                      ) : (
                        <button type="button" onClick={() => startEdit(p)} className="p-1.5 rounded hover:bg-gray-100 text-gray-400 hover:text-blue-600" title="Edit marks">
                          <Pencil className="w-3.5 h-3.5" />
                        </button>
                      )}
                      <button type="button" onClick={() => handleDelete(p.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500" title="Delete paper">
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
    </div>
  );
}

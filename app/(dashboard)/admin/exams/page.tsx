"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Exam {
  id: string; name: string; type: string; date: string; totalMarks: number; passingMarks: number;
  class: { name: string; section: string };
  subject: { name: string };
  teacher: { user: { name: string } };
  _count: { results: number };
}
interface ClassOption { id: string; name: string; section: string }
interface SubjectOption { id: string; name: string }
interface TeacherOption { id: string; user: { name: string } }

export default function ExamsPage() {
  const [exams, setExams] = useState<Exam[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [teachers, setTeachers] = useState<TeacherOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", type: "MIDTERM", classId: "", subjectId: "", teacherId: "", date: "", totalMarks: "100", passingMarks: "40" });

  const fetchExams = async () => {
    setLoading(true);
    const res = await fetch("/api/exams");
    setExams(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchExams();
    Promise.all([fetch("/api/classes").then((r) => r.json()), fetch("/api/subjects").then((r) => r.json()), fetch("/api/teachers").then((r) => r.json())])
      .then(([cls, subs, tchs]) => { setClasses(cls); setSubjects(subs); setTeachers(tchs); });
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/exams", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, totalMarks: parseInt(form.totalMarks), passingMarks: parseInt(form.passingMarks) }) });
    setSaving(false);
    setShowModal(false);
    fetchExams();
  }

  const typeColors: Record<string, string> = { MIDTERM: "bg-blue-100 text-blue-700", FINAL: "bg-purple-100 text-purple-700", QUIZ: "bg-green-100 text-green-700", ASSIGNMENT: "bg-orange-100 text-orange-700", PRACTICAL: "bg-red-100 text-red-700" };

  return (
    <div>
      <Header title="Examinations" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{exams.length} exams scheduled</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Schedule Exam</button>
        </div>
        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{["Exam Name", "Type", "Class", "Subject", "Teacher", "Date", "Marks", "Results"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={8} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                {!loading && exams.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">No exams scheduled yet.</td></tr>}
                {exams.map((e) => (
                  <tr key={e.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{e.name}</td>
                    <td className="px-4 py-3"><span className={`badge ${typeColors[e.type] ?? "bg-gray-100 text-gray-600"}`}>{e.type}</span></td>
                    <td className="px-4 py-3 text-gray-600">{e.class.name} {e.class.section}</td>
                    <td className="px-4 py-3 text-gray-600">{e.subject.name}</td>
                    <td className="px-4 py-3 text-gray-600">{e.teacher.user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(e.date)}</td>
                    <td className="px-4 py-3 text-gray-600">{e.totalMarks} / Pass:{e.passingMarks}</td>
                    <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-600">{e._count.results} entered</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Schedule Exam</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Exam Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required /></div>
                <div>
                  <label className="label">Type</label>
                  <select value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                    {["MIDTERM", "FINAL", "QUIZ", "ASSIGNMENT", "PRACTICAL"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Date *</label><input type="date" value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="input" required /></div>
                <div>
                  <label className="label">Class *</label>
                  <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input" required>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.section})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input" required>
                    <option value="">Select subject</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Teacher *</label>
                  <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input" required>
                    <option value="">Select teacher</option>
                    {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Total Marks</label><input type="number" value={form.totalMarks} onChange={(e) => setForm({ ...form, totalMarks: e.target.value })} className="input" /></div>
                <div><label className="label">Passing Marks</label><input type="number" value={form.passingMarks} onChange={(e) => setForm({ ...form, passingMarks: e.target.value })} className="input" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Schedule"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

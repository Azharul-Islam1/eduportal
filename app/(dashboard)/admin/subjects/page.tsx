"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, BookOpen } from "lucide-react";

interface Subject { id: string; name: string; code: string; teacher: { user: { name: string } } | null }
interface Teacher { id: string; user: { name: string } }

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", code: "", teacherId: "" });

  const fetchSubjects = async () => {
    setLoading(true);
    const res = await fetch("/api/subjects");
    setSubjects(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchSubjects();
    fetch("/api/teachers").then((r) => r.json()).then(setTeachers);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/subjects", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", code: "", teacherId: "" });
    fetchSubjects();
  }

  return (
    <div>
      <Header title="Subjects" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{subjects.length} subjects</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {["Code", "Subject Name", "Assigned Teacher", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-purple-600">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2"><BookOpen className="w-4 h-4 text-gray-400" />{s.name}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.teacher?.user.name ?? <span className="text-gray-400 italic">Unassigned</span>}</td>
                    <td className="px-4 py-3"><button className="text-xs text-blue-600 hover:underline">Edit</button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Subject</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Subject Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required /></div>
              <div><label className="label">Subject Code *</label><input value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" placeholder="e.g. MATH101" required /></div>
              <div>
                <label className="label">Assign Teacher</label>
                <select value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input">
                  <option value="">Unassigned</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                </select>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Subject"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

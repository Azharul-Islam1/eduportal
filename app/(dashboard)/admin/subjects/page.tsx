"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, BookOpen, Pencil, Trash2 } from "lucide-react";

interface Subject {
  id: string; name: string; code: string; type: string; isElective: boolean;
  teacher: { user: { name: string } } | null;
}
interface Teacher { id: string; user: { name: string } }

const emptyForm = { name: "", code: "", teacherId: "", type: "THEORY", isElective: false };

const typeColor = { THEORY: "bg-blue-100 text-blue-700", PRACTICAL: "bg-orange-100 text-orange-700", LAB: "bg-purple-100 text-purple-700" } as Record<string, string>;

export default function SubjectsPage() {
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Subject | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

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

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(s: Subject) {
    setEditing(s);
    setForm({ name: s.name, code: s.code, teacherId: s.teacher ? "" : "", type: s.type, isElective: s.isElective });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await fetch(`/api/subjects/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/subjects", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setSaving(false); setShowModal(false); fetchSubjects();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this subject?")) return;
    await fetch(`/api/subjects/${id}`, { method: "DELETE" });
    fetchSubjects();
  }

  return (
    <div>
      <Header title="Subjects" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{subjects.length} subjects</p>
          <button type="button" onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Subject</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {["Code", "Subject Name", "Type", "Teacher", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {subjects.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-purple-600">{s.code}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">
                      <div className="flex items-center gap-2">
                        <BookOpen className="w-4 h-4 text-gray-400" />
                        {s.name}
                        {s.isElective && <span className="text-xs bg-yellow-100 text-yellow-700 px-1.5 py-0.5 rounded">Elective</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${typeColor[s.type] ?? "bg-gray-100 text-gray-600"}`}>
                        {s.type}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600">
                      {s.teacher?.user.name ?? <span className="text-gray-400 italic">Unassigned</span>}
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" aria-label="Edit subject" onClick={() => openEdit(s)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                          <Pencil className="w-4 h-4" />
                        </button>
                        <button type="button" aria-label="Delete subject" onClick={() => handleDelete(s.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                          <Trash2 className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
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
              <h2 className="text-lg font-semibold">{editing ? "Edit" : "Add"} Subject</h2>
              <button type="button" aria-label="Close" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label" htmlFor="subj-name">Subject Name *</label>
                <input id="subj-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label" htmlFor="subj-code">Subject Code *</label>
                <input id="subj-code" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })} className="input" placeholder="e.g. MATH101" required />
              </div>
              <div>
                <label className="label" htmlFor="subj-type">Type</label>
                <select id="subj-type" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })} className="input">
                  <option value="THEORY">Theory</option>
                  <option value="PRACTICAL">Practical</option>
                  <option value="LAB">Lab</option>
                </select>
              </div>
              <div>
                <label className="label" htmlFor="subj-teacher">Assign Teacher</label>
                <select id="subj-teacher" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input">
                  <option value="">Unassigned</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                </select>
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isElective} onChange={(e) => setForm({ ...form, isElective: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Elective subject</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save" : "Add Subject"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

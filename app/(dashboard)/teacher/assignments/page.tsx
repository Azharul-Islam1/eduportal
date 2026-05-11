"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, FileText } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Assignment { id: string; title: string; description: string | null; dueDate: string; class: { name: string }; subject: { name: string }; _count: { submissions: number } }
interface ClassOption { id: string; name: string }
interface SubjectOption { id: string; name: string }

export default function TeacherAssignmentsPage() {
  const { data: session } = useSession();
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [subjects, setSubjects] = useState<SubjectOption[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", description: "", classId: "", subjectId: "", dueDate: "" });

  const fetchAssignments = async () => {
    setLoading(true);
    // Fetch all assignments (teacher-specific filter can be added via API)
    const res = await fetch("/api/exams"); // reuse exams list style; we need a proper assignments endpoint
    setLoading(false);
  };

  useEffect(() => {
    Promise.all([fetch("/api/classes").then((r) => r.json()), fetch("/api/subjects").then((r) => r.json())])
      .then(([cls, subs]) => { setClasses(cls); setSubjects(subs); });
    setLoading(false);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/assignments", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", description: "", classId: "", subjectId: "", dueDate: "" });
  }

  return (
    <div>
      <Header title="Assignments" />
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">Manage and grade assignments</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Create Assignment</button>
        </div>

        <div className="card p-8 text-center text-gray-400">
          <FileText className="w-10 h-10 mx-auto mb-2 opacity-40" />
          <p>Assignments you create will appear here.</p>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Create Assignment</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required /></div>
              <div><label className="label">Description</label><textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input h-24 resize-none" /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Class *</label>
                  <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input" required>
                    <option value="">Select</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Subject *</label>
                  <select value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input" required>
                    <option value="">Select</option>
                    {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                  </select>
                </div>
                <div className="col-span-2"><label className="label">Due Date *</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" required /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Create"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

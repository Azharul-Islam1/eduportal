"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, Users, BookOpen, Pencil, Trash2, ChevronLeft, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ClassLevel {
  id: string; name: string; description: string | null;
  sections: Section[];
}
interface Section {
  id: string; name: string; section: string; capacity: number; academicYear: string;
  _count: { students: number };
}

const emptyForm = { name: "", section: "A", capacity: "40", academicYear: "2025-2026" };

export default function ClassLevelDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [level, setLevel] = useState<ClassLevel | null>(null);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<Section | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchLevel = async () => {
    setLoading(true);
    const res = await fetch(`/api/class-levels/${id}`);
    setLevel(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchLevel(); }, [id]);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(s: Section) {
    setEditing(s);
    setForm({ name: s.name, section: s.section, capacity: String(s.capacity), academicYear: s.academicYear });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, capacity: parseInt(form.capacity), classLevelId: id };
    if (editing) {
      await fetch(`/api/classes/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/classes", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    }
    setSaving(false); setShowModal(false); fetchLevel();
  }

  async function handleDelete(sectionId: string) {
    if (!confirm("Delete this section?")) return;
    await fetch(`/api/classes/${sectionId}`, { method: "DELETE" });
    fetchLevel();
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>;
  if (!level) return <div className="p-6 text-red-500">Class level not found.</div>;

  return (
    <div>
      <Header title={level.name} />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/admin/classes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Classes
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">{level.name}</span>
        </div>

        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{level.sections.length} section{level.sections.length !== 1 ? "s" : ""}</p>
          <div className="flex gap-2">
            <Link href={`/admin/classes/${id}/subjects`} className="btn-secondary flex items-center gap-1">
              <BookOpen className="w-4 h-4" /> Manage Subjects
            </Link>
            <button type="button" onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Section</button>
          </div>
        </div>

        {level.sections.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No sections yet. Add a section to this class.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {level.sections.map((s) => (
              <div key={s.id} className="card p-5 hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-green-100 flex items-center justify-center font-bold text-green-700">
                    {s.section}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button type="button" aria-label="Edit section" onClick={() => openEdit(s)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" aria-label="Delete section" onClick={() => handleDelete(s.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800">{s.name} — Section {s.section}</h3>
                <p className="text-xs text-gray-500 mt-0.5">{s.academicYear}</p>
                <div className="mt-3">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{s._count.students} students</span>
                    <span>Cap: {s.capacity}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-green-500"
                      style={{ width: `${Math.min(100, (s._count.students / s.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
                <Link href={`/admin/timetable/${s.id}`} className="flex items-center gap-0.5 text-xs text-blue-600 hover:underline font-medium mt-3">
                  View Timetable <ChevronRight className="w-3 h-3" />
                </Link>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? "Edit" : "Add"} Section</h2>
              <button type="button" aria-label="Close" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label" htmlFor="sec-name">Class Name *</label>
                <input id="sec-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder={`e.g. ${level.name}`} required />
              </div>
              <div>
                <label className="label" htmlFor="sec-section">Section *</label>
                <input id="sec-section" value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="input" placeholder="A" required />
              </div>
              <div>
                <label className="label" htmlFor="sec-capacity">Capacity</label>
                <input id="sec-capacity" type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input" min="1" />
              </div>
              <div>
                <label className="label" htmlFor="sec-year">Academic Year</label>
                <input id="sec-year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className="input" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save" : "Add Section"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

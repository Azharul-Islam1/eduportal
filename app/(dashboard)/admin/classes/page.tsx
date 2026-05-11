"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Users, Loader2, X } from "lucide-react";

interface Class {
  id: string; name: string; section: string; capacity: number; academicYear: string;
  _count: { students: number };
}

export default function ClassesPage() {
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", section: "A", capacity: "40", academicYear: "2025-2026" });

  const fetchClasses = async () => {
    setLoading(true);
    const res = await fetch("/api/classes");
    setClasses(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchClasses(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/classes", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ ...form, capacity: parseInt(form.capacity) }) });
    setSaving(false);
    setShowModal(false);
    setForm({ name: "", section: "A", capacity: "40", academicYear: "2025-2026" });
    fetchClasses();
  }

  return (
    <div>
      <Header title="Classes" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{classes.length} classes configured</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Class</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {classes.map((c) => (
              <div key={c.id} className="card p-5 hover:shadow-md transition">
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h3 className="font-semibold text-gray-800">{c.name}</h3>
                    <p className="text-xs text-gray-500">Section {c.section} · {c.academicYear}</p>
                  </div>
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center">
                    <Users className="w-5 h-5 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4">
                  <div className="flex justify-between text-xs text-gray-500 mb-1">
                    <span>{c._count.students} students</span>
                    <span>Capacity: {c.capacity}</span>
                  </div>
                  <div className="h-1.5 rounded-full bg-gray-100 overflow-hidden">
                    <div
                      className="h-full rounded-full bg-blue-500"
                      style={{ width: `${Math.min(100, (c._count.students / c.capacity) * 100)}%` }}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add Class</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Class Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Class 10" required /></div>
              <div><label className="label">Section</label><input value={form.section} onChange={(e) => setForm({ ...form, section: e.target.value })} className="input" /></div>
              <div><label className="label">Capacity</label><input type="number" value={form.capacity} onChange={(e) => setForm({ ...form, capacity: e.target.value })} className="input" /></div>
              <div><label className="label">Academic Year</label><input value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className="input" /></div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Class"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

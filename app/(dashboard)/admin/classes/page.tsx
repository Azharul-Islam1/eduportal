"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, Users, Layers, Pencil, Trash2, ChevronRight } from "lucide-react";
import Link from "next/link";

interface ClassLevel {
  id: string; name: string; order: number; description: string | null;
  _count: { sections: number };
}

const emptyForm = { name: "", order: "0", description: "" };

export default function ClassesPage() {
  const [levels, setLevels] = useState<ClassLevel[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<ClassLevel | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchLevels = async () => {
    setLoading(true);
    const res = await fetch("/api/class-levels");
    setLevels(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchLevels(); }, []);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(l: ClassLevel) {
    setEditing(l);
    setForm({ name: l.name, order: String(l.order), description: l.description ?? "" });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { name: form.name, order: parseInt(form.order), description: form.description || null };
    if (editing) {
      await fetch(`/api/class-levels/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    } else {
      await fetch("/api/class-levels", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload),
      });
    }
    setSaving(false); setShowModal(false); fetchLevels();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this class level? All sections under it will be unlinked.")) return;
    await fetch(`/api/class-levels/${id}`, { method: "DELETE" });
    fetchLevels();
  }

  return (
    <div>
      <Header title="Classes" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{levels.length} class levels</p>
          <button type="button" onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Class</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : levels.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Layers className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No classes yet. Add a class to get started.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
            {levels.map((l) => (
              <div key={l.id} className="card p-5 hover:shadow-md transition group">
                <div className="flex items-start justify-between mb-3">
                  <div className="w-10 h-10 rounded-xl bg-blue-100 flex items-center justify-center font-bold text-blue-700 text-sm">
                    {l.order > 0 ? l.order : l.name.slice(0, 2).toUpperCase()}
                  </div>
                  <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition">
                    <button type="button" aria-label="Edit class" onClick={() => openEdit(l)} className="p-1 text-gray-400 hover:text-gray-600 rounded">
                      <Pencil className="w-3.5 h-3.5" />
                    </button>
                    <button type="button" aria-label="Delete class" onClick={() => handleDelete(l.id)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                </div>
                <h3 className="font-semibold text-gray-800 mb-1">{l.name}</h3>
                {l.description && <p className="text-xs text-gray-500 mb-3">{l.description}</p>}
                <div className="flex items-center justify-between mt-3">
                  <span className="flex items-center gap-1 text-xs text-gray-500">
                    <Users className="w-3.5 h-3.5" />
                    {l._count.sections} section{l._count.sections !== 1 ? "s" : ""}
                  </span>
                  <Link href={`/admin/classes/${l.id}`} className="flex items-center gap-0.5 text-xs text-blue-600 hover:underline font-medium">
                    Manage <ChevronRight className="w-3 h-3" />
                  </Link>
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
              <h2 className="text-lg font-semibold">{editing ? "Edit" : "Add"} Class</h2>
              <button type="button" aria-label="Close" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Class Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Class 10" required />
              </div>
              <div>
                <label className="label" htmlFor="class-order">Display Order</label>
                <input id="class-order" type="number" value={form.order} onChange={(e) => setForm({ ...form, order: e.target.value })} className="input" min="0" />
              </div>
              <div>
                <label className="label">Description</label>
                <input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" placeholder="Optional note" />
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save" : "Add Class"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

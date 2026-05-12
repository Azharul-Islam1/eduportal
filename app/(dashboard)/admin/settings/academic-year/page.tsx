"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, CheckCircle2, Calendar, Pencil, Trash2 } from "lucide-react";

interface AcademicYear {
  id: string; name: string; startDate: string; endDate: string; isCurrent: boolean;
}

const emptyForm = { name: "", startDate: "", endDate: "", isCurrent: false };

export default function AcademicYearPage() {
  const [years, setYears] = useState<AcademicYear[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<AcademicYear | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);

  const fetchYears = async () => {
    setLoading(true);
    const res = await fetch("/api/academic-years");
    setYears(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchYears(); }, []);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(y: AcademicYear) {
    setEditing(y);
    setForm({
      name: y.name,
      startDate: y.startDate.split("T")[0],
      endDate: y.endDate.split("T")[0],
      isCurrent: y.isCurrent,
    });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    if (editing) {
      await fetch(`/api/academic-years/${editing.id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    } else {
      await fetch("/api/academic-years", {
        method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form),
      });
    }
    setSaving(false); setShowModal(false); fetchYears();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this academic year?")) return;
    await fetch(`/api/academic-years/${id}`, { method: "DELETE" });
    fetchYears();
  }

  async function setCurrent(y: AcademicYear) {
    await fetch(`/api/academic-years/${y.id}`, {
      method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ isCurrent: true }),
    });
    fetchYears();
  }

  return (
    <div>
      <Header title="Academic Years" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{years.length} academic years</p>
          <button onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Year</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : years.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <Calendar className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No academic years yet. Add one to get started.</p>
          </div>
        ) : (
          <div className="space-y-3">
            {years.map((y) => (
              <div key={y.id} className={`card p-5 flex items-center justify-between ${y.isCurrent ? "border-l-4 border-blue-500" : ""}`}>
                <div className="flex items-center gap-4">
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center ${y.isCurrent ? "bg-blue-100" : "bg-gray-100"}`}>
                    <Calendar className={`w-5 h-5 ${y.isCurrent ? "text-blue-600" : "text-gray-400"}`} />
                  </div>
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-gray-800">{y.name}</h3>
                      {y.isCurrent && (
                        <span className="inline-flex items-center gap-1 text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
                          <CheckCircle2 className="w-3 h-3" /> Current
                        </span>
                      )}
                    </div>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {new Date(y.startDate).toLocaleDateString()} → {new Date(y.endDate).toLocaleDateString()}
                    </p>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  {!y.isCurrent && (
                    <button onClick={() => setCurrent(y)} className="text-xs text-blue-600 hover:underline">Set Current</button>
                  )}
                  <button onClick={() => openEdit(y)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded">
                    <Pencil className="w-4 h-4" />
                  </button>
                  <button onClick={() => handleDelete(y.id)} className="p-1.5 text-gray-400 hover:text-red-500 rounded">
                    <Trash2 className="w-4 h-4" />
                  </button>
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
              <h2 className="text-lg font-semibold">{editing ? "Edit" : "Add"} Academic Year</h2>
              <button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div>
                <label className="label">Year Name *</label>
                <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. 2025-2026" required />
              </div>
              <div>
                <label className="label">Start Date *</label>
                <input type="date" value={form.startDate} onChange={(e) => setForm({ ...form, startDate: e.target.value })} className="input" required />
              </div>
              <div>
                <label className="label">End Date *</label>
                <input type="date" value={form.endDate} onChange={(e) => setForm({ ...form, endDate: e.target.value })} className="input" required />
              </div>
              <label className="flex items-center gap-2 cursor-pointer">
                <input type="checkbox" checked={form.isCurrent} onChange={(e) => setForm({ ...form, isCurrent: e.target.checked })} className="rounded" />
                <span className="text-sm text-gray-700">Set as current year</span>
              </label>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save" : "Add Year"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Search, Loader2, X } from "lucide-react";

interface Teacher {
  id: string;
  employeeId: string;
  department: string | null;
  qualification: string | null;
  user: { name: string; email: string; phone: string | null; isActive: boolean };
  subjects: { id: string; name: string }[];
  _count: { assignments: number; exams: number };
}

export default function TeachersPage() {
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", department: "", qualification: "", password: "" });

  const fetchTeachers = useCallback(async () => {
    setLoading(true);
    const res = await fetch(`/api/teachers?search=${search}`);
    const data = await res.json();
    setTeachers(data);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    const t = setTimeout(fetchTeachers, 300);
    return () => clearTimeout(t);
  }, [fetchTeachers]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, password: form.password?.trim() || undefined };
    const res = await fetch("/api/teachers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setShowModal(false); setForm({ name: "", email: "", phone: "", department: "", qualification: "", password: "" }); fetchTeachers(); }
  }

  return (
    <div>
      <Header title="Teachers" />
      <div className="p-6">
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none flex-1" />
          </div>
          <button onClick={() => setShowModal(true)} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Add Teacher
          </button>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {["Employee ID", "Name", "Department", "Qualification", "Subjects", "Assignments", "Status"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                {!loading && teachers.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No teachers found.</td></tr>}
                {teachers.map((t) => (
                  <tr key={t.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-mono text-xs text-green-600">{t.employeeId}</td>
                    <td className="px-4 py-3">
                      <div className="font-medium text-gray-800">{t.user.name}</div>
                      <div className="text-xs text-gray-500">{t.user.email}</div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t.department ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600 text-xs">{t.qualification ?? "—"}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1">
                        {t.subjects.slice(0, 2).map((s) => (
                          <span key={s.id} className="badge bg-blue-50 text-blue-700">{s.name}</span>
                        ))}
                        {t.subjects.length > 2 && <span className="badge bg-gray-100 text-gray-600">+{t.subjects.length - 2}</span>}
                      </div>
                    </td>
                    <td className="px-4 py-3 text-gray-600">{t._count.assignments}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${t.user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {t.user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Teacher</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div><label className="label">Full Name *</label><input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required /></div>
                <div><label className="label">Email *</label><input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required /></div>
                <div><label className="label">Password</label><input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="Leave blank for default password" /></div>
                <div className="col-span-2 text-xs text-gray-500">Leave empty to assign the default password <strong>password123</strong>. Otherwise enter a password of at least 6 characters.</div>
                <div><label className="label">Phone</label><input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" /></div>
                <div><label className="label">Department</label><input value={form.department} onChange={(e) => setForm({ ...form, department: e.target.value })} className="input" /></div>
                <div className="col-span-2"><label className="label">Qualification</label><input value={form.qualification} onChange={(e) => setForm({ ...form, qualification: e.target.value })} className="input" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Teacher"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

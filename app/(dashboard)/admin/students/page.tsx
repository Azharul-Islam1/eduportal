"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Search, Pencil, Trash2, Loader2, X } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Student {
  id: string;
  studentId: string;
  rollNumber: string | null;
  gender: string | null;
  user: { name: string; email: string; phone: string | null; isActive: boolean };
  class: { id: string; name: string; section: string };
}

interface ClassOption { id: string; name: string; section: string }

export default function StudentsPage() {
  const [students, setStudents] = useState<Student[]>([]);
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [classFilter, setClassFilter] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ name: "", email: "", phone: "", classId: "", rollNumber: "", gender: "", password: "" });

  const fetchStudents = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams({ search, ...(classFilter ? { classId: classFilter } : {}) });
    const res = await fetch(`/api/students?${params}`);
    const data = await res.json();
    setStudents(data.students ?? []);
    setTotal(data.total ?? 0);
    setLoading(false);
  }, [search, classFilter]);

  useEffect(() => {
    fetch("/api/classes").then((r) => r.json()).then(setClasses);
  }, []);

  useEffect(() => {
    const t = setTimeout(fetchStudents, 300);
    return () => clearTimeout(t);
  }, [fetchStudents]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, password: form.password?.trim() || undefined };
    const res = await fetch("/api/students", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    setSaving(false);
    if (res.ok) { setShowModal(false); setForm({ name: "", email: "", phone: "", classId: "", rollNumber: "", gender: "", password: "" }); fetchStudents(); }
  }

  async function handleDeactivate(id: string) {
    if (!confirm("Deactivate this student?")) return;
    await fetch(`/api/students/${id}`, { method: "DELETE" });
    fetchStudents();
  }

  return (
    <div>
      <Header title="Students" />
      <div className="p-6">
        {/* Toolbar */}
        <div className="flex flex-wrap items-center gap-3 mb-5">
          <div className="flex items-center gap-2 rounded-lg border border-gray-200 bg-white px-3 py-2 flex-1 min-w-48">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input placeholder="Search by name..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none flex-1 min-w-0" />
          </div>
          <select value={classFilter} onChange={(e) => setClassFilter(e.target.value)} className="input w-40">
            <option value="">All Classes</option>
            {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
          </select>
          <button onClick={() => setShowModal(true)} className="btn-primary shrink-0">
            <Plus className="w-4 h-4" /> Add Student
          </button>
        </div>

        {/* Table */}
        <div className="card overflow-hidden">
          <div className="px-5 py-3 border-b border-gray-100 flex items-center justify-between">
            <span className="text-sm font-medium text-gray-600">{total} students total</span>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {["Student ID", "Name", "Class", "Roll No", "Gender", "Email", "Status", "Actions"].map((h) => (
                    <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-500"><Loader2 className="w-5 h-5 animate-spin inline" /></td></tr>
                )}
                {!loading && students.length === 0 && (
                  <tr><td colSpan={8} className="py-8 text-center text-gray-400">No students found.</td></tr>
                )}
                {students.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50 transition">
                    <td className="px-4 py-3 font-mono text-xs text-blue-600">{s.studentId}</td>
                    <td className="px-4 py-3 font-medium text-gray-800">{s.user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{s.class.name} {s.class.section}</td>
                    <td className="px-4 py-3 text-gray-600">{s.rollNumber ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-600">{s.gender ?? "—"}</td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.user.email}</td>
                    <td className="px-4 py-3">
                      <span className={`badge ${s.user.isActive ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                        {s.user.isActive ? "Active" : "Inactive"}
                      </span>
                    </td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-1">
                        <button className="p-1.5 rounded hover:bg-gray-100 text-gray-500 hover:text-blue-600"><Pencil className="w-3.5 h-3.5" /></button>
                        <button onClick={() => handleDeactivate(s.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-500 hover:text-red-600"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Add Student Modal */}
      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">Add New Student</h2>
              <button onClick={() => setShowModal(false)} className="p-1 rounded hover:bg-gray-100"><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Full Name *</label>
                  <input value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">Email *</label>
                  <input type="email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label">Password</label>
                  <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} className="input" placeholder="Leave blank for default password" />
                  <p className="text-xs text-gray-500 mt-1">Leave empty to assign the default password <strong>password123</strong>.</p>
                </div>
                <div>
                  <label className="label">Phone</label>
                  <input value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Class *</label>
                  <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input" required>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} ({c.section})</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Roll Number</label>
                  <input value={form.rollNumber} onChange={(e) => setForm({ ...form, rollNumber: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label">Gender</label>
                  <select value={form.gender} onChange={(e) => setForm({ ...form, gender: e.target.value })} className="input">
                    <option value="">Select</option>
                    <option>Male</option><option>Female</option><option>Other</option>
                  </select>
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Student"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

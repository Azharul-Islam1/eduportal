"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, Pencil, Trash2, ChevronLeft } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface FeeStructure {
  id: string; name: string | null; feeType: string; amount: number;
  academicYear: string; frequency: string; dueDate: string | null; description: string | null;
  class: { name: string; section: string } | null;
  _count: { payments: number };
}
interface Class { id: string; name: string; section: string }

const FEE_TYPES = ["TUITION", "EXAM", "LIBRARY", "TRANSPORT", "HOSTEL", "OTHER"];
const FREQUENCIES = ["MONTHLY", "TERM", "ANNUAL", "ONE_TIME"];
const emptyForm = { name: "", classId: "", feeType: "TUITION", amount: "", academicYear: "2025-2026", frequency: "ANNUAL", dueDate: "", description: "" };

const freqColor: Record<string, string> = { MONTHLY: "bg-blue-100 text-blue-700", TERM: "bg-purple-100 text-purple-700", ANNUAL: "bg-green-100 text-green-700", ONE_TIME: "bg-orange-100 text-orange-700" };

export default function FeeStructuresPage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [classes, setClasses] = useState<Class[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editing, setEditing] = useState<FeeStructure | null>(null);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState(emptyForm);
  const [filterYear, setFilterYear] = useState("2025-2026");

  const fetchStructures = async () => {
    setLoading(true);
    const res = await fetch(`/api/fees/structures?academicYear=${filterYear}`);
    setStructures(await res.json());
    setLoading(false);
  };

  useEffect(() => {
    fetchStructures();
    fetch("/api/classes").then((r) => r.json()).then(setClasses);
  }, [filterYear]);

  function openAdd() { setEditing(null); setForm(emptyForm); setShowModal(true); }
  function openEdit(s: FeeStructure) {
    setEditing(s);
    setForm({ name: s.name ?? "", classId: "", feeType: s.feeType, amount: String(s.amount), academicYear: s.academicYear, frequency: s.frequency, dueDate: s.dueDate ? s.dueDate.split("T")[0] : "", description: s.description ?? "" });
    setShowModal(true);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    const payload = { ...form, amount: parseFloat(form.amount) };
    if (editing) {
      await fetch(`/api/fees/structures/${editing.id}`, { method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    } else {
      await fetch("/api/fees/structures", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
    }
    setSaving(false); setShowModal(false); fetchStructures();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this fee structure?")) return;
    await fetch(`/api/fees/structures/${id}`, { method: "DELETE" });
    fetchStructures();
  }

  const totalAnnual = structures.reduce((s, f) => s + f.amount, 0);

  return (
    <div>
      <Header title="Fee Structures" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/admin/finance" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Finance
          </Link>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-3 mb-5">
          <div className="flex items-center gap-3">
            <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input max-w-[150px]" aria-label="Filter academic year">
              <option>2024-2025</option>
              <option>2025-2026</option>
              <option>2026-2027</option>
            </select>
            <p className="text-sm text-gray-500">{structures.length} structures · {formatCurrency(totalAnnual)} total</p>
          </div>
          <button type="button" onClick={openAdd} className="btn-primary"><Plus className="w-4 h-4" /> Add Fee</button>
        </div>

        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : structures.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <p>No fee structures for {filterYear}. Add one to get started.</p>
          </div>
        ) : (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{["Name / Type", "Class", "Amount", "Frequency", "Due Date", "Year", ""].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {structures.map((s) => (
                  <tr key={s.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3">
                      <p className="font-medium text-gray-800">{s.name ?? s.feeType}</p>
                      {s.name && <p className="text-xs text-gray-400">{s.feeType}</p>}
                    </td>
                    <td className="px-4 py-3 text-gray-600">{s.class ? `${s.class.name} ${s.class.section}` : <span className="text-gray-400 italic">All classes</span>}</td>
                    <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(s.amount)}</td>
                    <td className="px-4 py-3">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${freqColor[s.frequency] ?? "bg-gray-100 text-gray-600"}`}>{s.frequency}</span>
                    </td>
                    <td className="px-4 py-3 text-gray-500 text-xs">{s.dueDate ? new Date(s.dueDate).toLocaleDateString() : "—"}</td>
                    <td className="px-4 py-3 text-gray-500">{s.academicYear}</td>
                    <td className="px-4 py-3">
                      <div className="flex gap-2">
                        <button type="button" aria-label="Edit" onClick={() => openEdit(s)} className="p-1 text-gray-400 hover:text-gray-600 rounded"><Pencil className="w-4 h-4" /></button>
                        <button type="button" aria-label="Delete" onClick={() => handleDelete(s.id)} className="p-1 text-gray-400 hover:text-red-500 rounded"><Trash2 className="w-4 h-4" /></button>
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
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{editing ? "Edit" : "Add"} Fee Structure</h2>
              <button type="button" aria-label="Close" onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2">
                  <label className="label" htmlFor="fs-name">Fee Name</label>
                  <input id="fs-name" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} className="input" placeholder="e.g. Monthly Tuition" />
                </div>
                <div>
                  <label className="label" htmlFor="fs-type">Fee Type *</label>
                  <select id="fs-type" value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} className="input">
                    {FEE_TYPES.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="fs-freq">Frequency</label>
                  <select id="fs-freq" value={form.frequency} onChange={(e) => setForm({ ...form, frequency: e.target.value })} className="input">
                    {FREQUENCIES.map((f) => <option key={f}>{f}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="fs-class">Applies To</label>
                  <select id="fs-class" value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input">
                    <option value="">All Classes</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name} {c.section}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label" htmlFor="fs-amount">Amount *</label>
                  <input id="fs-amount" type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" required />
                </div>
                <div>
                  <label className="label" htmlFor="fs-year">Academic Year</label>
                  <input id="fs-year" value={form.academicYear} onChange={(e) => setForm({ ...form, academicYear: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="fs-due">Due Date</label>
                  <input id="fs-due" type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" />
                </div>
                <div className="col-span-2">
                  <label className="label" htmlFor="fs-desc">Description</label>
                  <input id="fs-desc" value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : editing ? "Save" : "Create"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

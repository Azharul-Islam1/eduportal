"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, DollarSign, TrendingUp, AlertCircle, CheckCircle } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

interface FeeStructure {
  id: string; feeType: string; amount: number; academicYear: string; dueDate: string | null; description: string | null;
  class: { name: string; section: string };
  _count: { payments: number };
}
interface Payment {
  id: string; paidAmount: number; paidDate: string; status: string; transactionId: string | null;
  student: { user: { name: string } };
  feeStructure: { feeType: string; class: { name: string } };
}

export default function FinancePage() {
  const [structures, setStructures] = useState<FeeStructure[]>([]);
  const [payments, setPayments] = useState<Payment[]>([]);
  const [classes, setClasses] = useState<{ id: string; name: string }[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<"overview" | "structures" | "payments">("overview");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ classId: "", feeType: "TUITION", amount: "", academicYear: "2025-2026", dueDate: "", description: "" });

  const fetchData = async () => {
    setLoading(true);
    const [str, pay, cls] = await Promise.all([
      fetch("/api/fees?type=structure").then((r) => r.json()),
      fetch("/api/fees").then((r) => r.json()),
      fetch("/api/classes").then((r) => r.json()),
    ]);
    setStructures(str);
    setPayments(pay);
    setClasses(cls);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/fees", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "create_structure", ...form, amount: parseFloat(form.amount) }) });
    setSaving(false);
    setShowModal(false);
    fetchData();
  }

  const totalCollected = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.paidAmount, 0);

  const statusColor: Record<string, string> = { PAID: "bg-green-100 text-green-700", PENDING: "bg-yellow-100 text-yellow-700", OVERDUE: "bg-red-100 text-red-600", PARTIAL: "bg-blue-100 text-blue-700" };

  return (
    <div>
      <Header title="Finance & Fees" />
      <div className="p-6 space-y-5">
        {/* Summary cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-green-100"><CheckCircle className="w-5 h-5 text-green-600" /></div>
            <div><p className="text-xs text-gray-500">Collected</p><p className="font-bold text-gray-900">{formatCurrency(totalCollected)}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-yellow-100"><AlertCircle className="w-5 h-5 text-yellow-600" /></div>
            <div><p className="text-xs text-gray-500">Pending</p><p className="font-bold text-gray-900">{formatCurrency(totalPending)}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-blue-100"><DollarSign className="w-5 h-5 text-blue-600" /></div>
            <div><p className="text-xs text-gray-500">Fee Structures</p><p className="font-bold text-gray-900">{structures.length}</p></div>
          </div>
          <div className="card p-4 flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-purple-100"><TrendingUp className="w-5 h-5 text-purple-600" /></div>
            <div><p className="text-xs text-gray-500">Total Payments</p><p className="font-bold text-gray-900">{payments.length}</p></div>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 bg-gray-100 p-1 rounded-lg w-fit">
          {(["overview", "structures", "payments"] as const).map((t) => (
            <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500 hover:text-gray-700"}`}>{t}</button>
          ))}
        </div>

        {tab === "structures" && (
          <div>
            <div className="flex justify-end mb-3">
              <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Fee Structure</button>
            </div>
            <div className="card overflow-hidden">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                  <tr>{["Class", "Fee Type", "Amount", "Academic Year", "Due Date", "Payments"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {loading && <tr><td colSpan={6} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                  {structures.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium">{s.class.name} {s.class.section}</td>
                      <td className="px-4 py-3"><span className="badge bg-blue-50 text-blue-700">{s.feeType}</span></td>
                      <td className="px-4 py-3 font-semibold text-green-700">{formatCurrency(s.amount)}</td>
                      <td className="px-4 py-3 text-gray-600">{s.academicYear}</td>
                      <td className="px-4 py-3 text-gray-600">{s.dueDate ? formatDate(s.dueDate) : "—"}</td>
                      <td className="px-4 py-3 text-gray-600">{s._count.payments}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {tab === "payments" && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{["Student", "Fee Type", "Class", "Amount", "Date", "Status", "Transaction"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                {!loading && payments.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No payment records yet.</td></tr>}
                {payments.map((p) => (
                  <tr key={p.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{p.student.user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{p.feeStructure.feeType}</td>
                    <td className="px-4 py-3 text-gray-600">{p.feeStructure.class.name}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(p.paidAmount)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(p.paidDate)}</td>
                    <td className="px-4 py-3"><span className={`badge ${statusColor[p.status] ?? "bg-gray-100"}`}>{p.status}</span></td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.transactionId ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "overview" && (
          <div className="card p-6">
            <h3 className="font-semibold text-gray-700 mb-4">Fee Collection Overview</h3>
            <div className="space-y-3">
              {structures.slice(0, 6).map((s) => {
                const paid = payments.filter((p) => p.feeStructure.feeType === s.feeType && p.status === "PAID").reduce((sum, p) => sum + p.paidAmount, 0);
                const target = s.amount * 40;
                const pct = Math.min(100, (paid / (target || 1)) * 100);
                return (
                  <div key={s.id}>
                    <div className="flex justify-between text-sm mb-1">
                      <span className="font-medium text-gray-700">{s.feeType} — {s.class.name}</span>
                      <span className="text-gray-500">{formatCurrency(paid)}</span>
                    </div>
                    <div className="h-2 rounded-full bg-gray-100"><div className="h-full rounded-full bg-green-500 transition-all" style={{ width: `${pct}%` }} /></div>
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-md p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Add Fee Structure</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Class *</label>
                  <select value={form.classId} onChange={(e) => setForm({ ...form, classId: e.target.value })} className="input" required>
                    <option value="">Select class</option>
                    {classes.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div>
                  <label className="label">Fee Type</label>
                  <select value={form.feeType} onChange={(e) => setForm({ ...form, feeType: e.target.value })} className="input">
                    {["TUITION", "EXAM", "LIBRARY", "TRANSPORT", "HOSTEL", "OTHER"].map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
                <div><label className="label">Amount *</label><input type="number" value={form.amount} onChange={(e) => setForm({ ...form, amount: e.target.value })} className="input" required /></div>
                <div><label className="label">Due Date</label><input type="date" value={form.dueDate} onChange={(e) => setForm({ ...form, dueDate: e.target.value })} className="input" /></div>
                <div className="col-span-2"><label className="label">Description</label><input value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })} className="input" /></div>
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

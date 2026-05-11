"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Loader2, X, Bell, Trash2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Notice { id: string; title: string; content: string; targetRole: string | null; expiryDate: string | null; createdAt: string; author: { name: string } }

export default function NoticesPage() {
  const [notices, setNotices] = useState<Notice[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", content: "", targetRole: "", expiryDate: "" });

  const fetchNotices = async () => {
    setLoading(true);
    const res = await fetch("/api/notices");
    setNotices(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchNotices(); }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/notices", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(form) });
    setSaving(false);
    setShowModal(false);
    setForm({ title: "", content: "", targetRole: "", expiryDate: "" });
    fetchNotices();
  }

  async function handleDelete(id: string) {
    if (!confirm("Archive this notice?")) return;
    await fetch("/api/notices", { method: "DELETE", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ id }) });
    fetchNotices();
  }

  const roleColor: Record<string, string> = { ADMIN: "bg-red-50 text-red-600", TEACHER: "bg-green-50 text-green-700", STUDENT: "bg-blue-50 text-blue-700", PARENT: "bg-orange-50 text-orange-700" };

  return (
    <div>
      <Header title="Notices" />
      <div className="p-6 space-y-5">
        <div className="flex justify-between items-center">
          <p className="text-sm text-gray-500">{notices.length} active notices</p>
          <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Post Notice</button>
        </div>

        {loading ? <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div> : (
          <div className="space-y-3">
            {notices.length === 0 && <div className="card p-8 text-center text-gray-400">No notices yet. Post one!</div>}
            {notices.map((n) => (
              <div key={n.id} className="card p-5">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-start gap-3 flex-1">
                    <div className="p-2 rounded-lg bg-blue-50 shrink-0"><Bell className="w-4 h-4 text-blue-600" /></div>
                    <div className="flex-1">
                      <div className="flex items-center gap-2 flex-wrap mb-1">
                        <h3 className="font-semibold text-gray-800">{n.title}</h3>
                        <span className={`badge ${n.targetRole ? (roleColor[n.targetRole] ?? "bg-gray-100") : "bg-gray-100 text-gray-600"}`}>
                          {n.targetRole ?? "All"}
                        </span>
                      </div>
                      <p className="text-sm text-gray-600 line-clamp-2">{n.content}</p>
                      <p className="text-xs text-gray-400 mt-2">By {n.author.name} · {formatDate(n.createdAt)} {n.expiryDate ? `· Expires ${formatDate(n.expiryDate)}` : ""}</p>
                    </div>
                  </div>
                  <button onClick={() => handleDelete(n.id)} className="p-1.5 rounded hover:bg-red-50 text-gray-400 hover:text-red-500 shrink-0"><Trash2 className="w-4 h-4" /></button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-lg p-6">
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Post Notice</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div><label className="label">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required /></div>
              <div><label className="label">Content *</label><textarea value={form.content} onChange={(e) => setForm({ ...form, content: e.target.value })} className="input h-28 resize-none" required /></div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label">Target Audience</label>
                  <select value={form.targetRole} onChange={(e) => setForm({ ...form, targetRole: e.target.value })} className="input">
                    <option value="">All</option>
                    <option value="STUDENT">Students</option>
                    <option value="TEACHER">Teachers</option>
                    <option value="PARENT">Parents</option>
                  </select>
                </div>
                <div><label className="label">Expiry Date</label><input type="date" value={form.expiryDate} onChange={(e) => setForm({ ...form, expiryDate: e.target.value })} className="input" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Post"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

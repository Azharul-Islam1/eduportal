"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Plus, Search, Loader2, X, Library, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface Book { id: string; title: string; author: string; isbn: string; quantity: number; available: number; publishYear: number | null; category: { name: string }; _count: { issues: number } }
interface BookIssue { id: string; issueDate: string; dueDate: string; returnDate: string | null; status: string; fine: number | null; book: { title: string; author: string }; student: { user: { name: string } } }
interface Category { id: string; name: string }

export default function LibraryPage() {
  const [books, setBooks] = useState<Book[]>([]);
  const [issues, setIssues] = useState<BookIssue[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [tab, setTab] = useState<"books" | "issues">("books");
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ title: "", author: "", isbn: "", categoryId: "", quantity: "1", publishYear: "", publisher: "", location: "" });

  const fetchData = async () => {
    setLoading(true);
    const [bks, iss, cats] = await Promise.all([
      fetch(`/api/books?search=${search}`).then((r) => r.json()),
      fetch("/api/books?type=issues").then((r) => r.json()),
      fetch("/api/books?type=categories").then((r) => r.json()),
    ]);
    setBooks(bks); setIssues(iss); setCategories(cats);
    setLoading(false);
  };

  useEffect(() => { const t = setTimeout(fetchData, 300); return () => clearTimeout(t); }, [search]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "add_book", ...form, quantity: parseInt(form.quantity), publishYear: form.publishYear ? parseInt(form.publishYear) : undefined }) });
    setSaving(false);
    setShowModal(false);
    fetchData();
  }

  async function handleReturn(issueId: string) {
    await fetch("/api/books", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ action: "return_book", issueId }) });
    fetchData();
  }

  const statusColor: Record<string, string> = { ISSUED: "bg-blue-100 text-blue-700", RETURNED: "bg-green-100 text-green-700", OVERDUE: "bg-red-100 text-red-600" };

  return (
    <div>
      <Header title="Library" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-blue-100"><Library className="w-5 h-5 text-blue-600" /></div><div><p className="text-xs text-gray-500">Total Books</p><p className="font-bold">{books.reduce((s, b) => s + b.quantity, 0)}</p></div></div>
          <div className="card p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-green-100"><BookOpen className="w-5 h-5 text-green-600" /></div><div><p className="text-xs text-gray-500">Available</p><p className="font-bold">{books.reduce((s, b) => s + b.available, 0)}</p></div></div>
          <div className="card p-4 flex items-center gap-3"><div className="p-2 rounded-xl bg-orange-100"><BookOpen className="w-5 h-5 text-orange-600" /></div><div><p className="text-xs text-gray-500">Issued</p><p className="font-bold">{issues.filter((i) => i.status === "ISSUED").length}</p></div></div>
        </div>

        <div className="flex items-center gap-3 justify-between">
          <div className="flex gap-1 bg-gray-100 p-1 rounded-lg">
            {(["books", "issues"] as const).map((t) => (
              <button key={t} onClick={() => setTab(t)} className={`px-4 py-1.5 rounded-md text-sm font-medium capitalize transition ${tab === t ? "bg-white shadow-sm text-gray-900" : "text-gray-500"}`}>{t}</button>
            ))}
          </div>
          {tab === "books" && (
            <div className="flex gap-3">
              <div className="flex items-center gap-2 rounded-lg border bg-white px-3 py-2">
                <Search className="w-4 h-4 text-gray-400" />
                <input placeholder="Search books..." value={search} onChange={(e) => setSearch(e.target.value)} className="text-sm outline-none w-48" />
              </div>
              <button onClick={() => setShowModal(true)} className="btn-primary"><Plus className="w-4 h-4" /> Add Book</button>
            </div>
          )}
        </div>

        {tab === "books" && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{["Title", "Author", "ISBN", "Category", "Qty", "Available", "Issues"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={7} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                {books.map((b) => (
                  <tr key={b.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{b.title}</td>
                    <td className="px-4 py-3 text-gray-600">{b.author}</td>
                    <td className="px-4 py-3 font-mono text-xs text-gray-500">{b.isbn}</td>
                    <td className="px-4 py-3"><span className="badge bg-purple-50 text-purple-700">{b.category.name}</span></td>
                    <td className="px-4 py-3 text-gray-600">{b.quantity}</td>
                    <td className="px-4 py-3"><span className={`font-semibold ${b.available > 0 ? "text-green-600" : "text-red-500"}`}>{b.available}</span></td>
                    <td className="px-4 py-3 text-gray-500">{b._count.issues}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {tab === "issues" && (
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{["Student", "Book", "Issue Date", "Due Date", "Return Date", "Status", "Fine", "Action"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {issues.map((i) => (
                  <tr key={i.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium">{i.student.user.name}</td>
                    <td className="px-4 py-3 text-gray-700">{i.book.title}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(i.issueDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(i.dueDate)}</td>
                    <td className="px-4 py-3 text-gray-600">{i.returnDate ? formatDate(i.returnDate) : "—"}</td>
                    <td className="px-4 py-3"><span className={`badge ${statusColor[i.status] ?? "bg-gray-100"}`}>{i.status}</span></td>
                    <td className="px-4 py-3 text-gray-600">{i.fine ? `$${i.fine}` : "—"}</td>
                    <td className="px-4 py-3">
                      {i.status === "ISSUED" && (
                        <button onClick={() => handleReturn(i.id)} className="text-xs text-blue-600 hover:underline">Return</button>
                      )}
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
            <div className="flex items-center justify-between mb-4"><h2 className="text-lg font-semibold">Add Book</h2><button onClick={() => setShowModal(false)}><X className="w-5 h-5" /></button></div>
            <form onSubmit={handleSubmit} className="space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="col-span-2"><label className="label">Title *</label><input value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })} className="input" required /></div>
                <div><label className="label">Author *</label><input value={form.author} onChange={(e) => setForm({ ...form, author: e.target.value })} className="input" required /></div>
                <div><label className="label">ISBN *</label><input value={form.isbn} onChange={(e) => setForm({ ...form, isbn: e.target.value })} className="input" required /></div>
                <div>
                  <label className="label">Category *</label>
                  <select value={form.categoryId} onChange={(e) => setForm({ ...form, categoryId: e.target.value })} className="input" required>
                    <option value="">Select</option>
                    {categories.map((c) => <option key={c.id} value={c.id}>{c.name}</option>)}
                  </select>
                </div>
                <div><label className="label">Quantity</label><input type="number" value={form.quantity} onChange={(e) => setForm({ ...form, quantity: e.target.value })} className="input" /></div>
                <div><label className="label">Publisher</label><input value={form.publisher} onChange={(e) => setForm({ ...form, publisher: e.target.value })} className="input" /></div>
                <div><label className="label">Location/Shelf</label><input value={form.location} onChange={(e) => setForm({ ...form, location: e.target.value })} className="input" /></div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setShowModal(false)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">{saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Add Book"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

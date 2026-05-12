"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, ChevronLeft, Search, CheckCircle } from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatCurrency, formatDate } from "@/lib/utils";

interface Invoice {
  id: string; invoiceNo: string; period: string; totalAmount: number; paidAmount: number;
  status: string; dueDate: string;
  items: { name: string; feeType: string; amount: number }[];
  class: { name: string; section: string };
}
interface StudentResult {
  id: string; studentId: string;
  user: { name: string };
  class: { name: string; section: string };
}

const PAYMENT_MODES = ["CASH", "UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"];
const statusColor: Record<string, string> = { PENDING: "bg-yellow-100 text-yellow-700", PARTIAL: "bg-blue-100 text-blue-700", OVERDUE: "bg-red-100 text-red-600", PAID: "bg-green-100 text-green-700" };

export default function RecordPaymentPage() {
  const router = useRouter();
  const [search, setSearch] = useState("");
  const [students, setStudents] = useState<StudentResult[]>([]);
  const [searching, setSearching] = useState(false);
  const [selectedStudent, setSelectedStudent] = useState<StudentResult | null>(null);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loadingInvoices, setLoadingInvoices] = useState(false);
  const [selectedInvoice, setSelectedInvoice] = useState<Invoice | null>(null);
  const [amount, setAmount] = useState("");
  const [paymentMode, setPaymentMode] = useState("CASH");
  const [reference, setReference] = useState("");
  const [paymentDate, setPaymentDate] = useState(new Date().toISOString().split("T")[0]);
  const [remarks, setRemarks] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (search.length < 2) { setStudents([]); return; }
    const timer = setTimeout(async () => {
      setSearching(true);
      const res = await fetch(`/api/students?search=${encodeURIComponent(search)}&limit=10`);
      const data = await res.json();
      setStudents(Array.isArray(data) ? data : data.students ?? []);
      setSearching(false);
    }, 300);
    return () => clearTimeout(timer);
  }, [search]);

  async function selectStudent(s: StudentResult) {
    setSelectedStudent(s);
    setStudents([]);
    setSearch("");
    setSelectedInvoice(null);
    setLoadingInvoices(true);
    const res = await fetch(`/api/fees/invoices?studentId=${s.id}`);
    const data: Invoice[] = await res.json();
    setInvoices(data.filter((inv) => inv.status !== "PAID"));
    setLoadingInvoices(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedInvoice) return;
    setSaving(true);
    const res = await fetch("/api/fees/payments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ invoiceId: selectedInvoice.id, amount: parseFloat(amount), paymentMode, reference, paymentDate, remarks }),
    });
    if (res.ok) {
      const payment = await res.json();
      router.push(`/admin/fees/payments/${payment.id}`);
    }
    setSaving(false);
  }

  const balance = selectedInvoice ? selectedInvoice.totalAmount - selectedInvoice.paidAmount : 0;

  return (
    <div>
      <Header title="Record Payment" />
      <div className="p-6 max-w-2xl">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/admin/finance" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Finance
          </Link>
        </div>

        <div className="space-y-5">
          {/* Step 1: Find student */}
          <div className="card p-5">
            <h3 className="font-semibold text-gray-700 mb-3">Step 1 — Find Student</h3>
            <div className="relative">
              <Search className="absolute left-3 top-2.5 w-4 h-4 text-gray-400" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name or admission no…"
                className="input pl-9"
              />
              {searching && <Loader2 className="absolute right-3 top-2.5 w-4 h-4 animate-spin text-gray-400" />}
            </div>
            {students.length > 0 && (
              <div className="mt-1 border border-gray-200 rounded-xl overflow-hidden">
                {students.map((s) => (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => selectStudent(s)}
                    className="w-full text-left px-4 py-2.5 hover:bg-gray-50 text-sm border-b border-gray-100 last:border-0"
                  >
                    <span className="font-medium text-gray-800">{s.user.name}</span>
                    <span className="text-gray-400 ml-2 text-xs">{s.studentId} · {s.class.name} {s.class.section}</span>
                  </button>
                ))}
              </div>
            )}
            {selectedStudent && (
              <div className="mt-3 flex items-center gap-3 bg-blue-50 border border-blue-200 rounded-xl px-4 py-3">
                <CheckCircle className="w-5 h-5 text-blue-600 shrink-0" />
                <div>
                  <p className="font-medium text-blue-800">{selectedStudent.user.name}</p>
                  <p className="text-xs text-blue-600">{selectedStudent.studentId} · {selectedStudent.class.name} {selectedStudent.class.section}</p>
                </div>
                <button type="button" onClick={() => { setSelectedStudent(null); setInvoices([]); setSelectedInvoice(null); }} className="ml-auto text-xs text-blue-500 hover:underline">Change</button>
              </div>
            )}
          </div>

          {/* Step 2: Select invoice */}
          {selectedStudent && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 mb-3">Step 2 — Select Invoice</h3>
              {loadingInvoices ? (
                <div className="flex justify-center py-4"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>
              ) : invoices.length === 0 ? (
                <p className="text-sm text-gray-400 py-2">No pending invoices for this student.</p>
              ) : (
                <div className="space-y-2">
                  {invoices.map((inv) => (
                    <button
                      type="button"
                      key={inv.id}
                      onClick={() => { setSelectedInvoice(inv); setAmount(String(inv.totalAmount - inv.paidAmount)); }}
                      className={`w-full text-left rounded-xl border-2 px-4 py-3 transition ${selectedInvoice?.id === inv.id ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"}`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="font-medium text-gray-800">{inv.invoiceNo} — {inv.period}</p>
                          <p className="text-xs text-gray-500 mt-0.5">Due: {formatDate(inv.dueDate)} · {inv.class.name} {inv.class.section}</p>
                        </div>
                        <div className="text-right">
                          <p className="font-semibold text-gray-800">{formatCurrency(inv.totalAmount)}</p>
                          {inv.paidAmount > 0 && <p className="text-xs text-gray-500">Paid: {formatCurrency(inv.paidAmount)}</p>}
                          <span className={`text-xs px-2 py-0.5 rounded-full ${statusColor[inv.status] ?? ""}`}>{inv.status}</span>
                        </div>
                      </div>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Step 3: Payment details */}
          {selectedInvoice && (
            <div className="card p-5">
              <h3 className="font-semibold text-gray-700 mb-3">Step 3 — Payment Details</h3>
              <div className="bg-gray-50 rounded-xl p-4 mb-4 space-y-1">
                <p className="text-sm font-medium text-gray-700">{selectedInvoice.invoiceNo} · {selectedInvoice.period}</p>
                {(selectedInvoice.items as { name: string; amount: number }[]).map((it, i) => (
                  <div key={i} className="flex justify-between text-xs text-gray-500">
                    <span>{it.name}</span><span>{formatCurrency(it.amount)}</span>
                  </div>
                ))}
                <div className="flex justify-between text-sm font-semibold text-gray-700 border-t border-gray-200 pt-1 mt-1">
                  <span>Balance Due</span><span className="text-red-600">{formatCurrency(balance)}</span>
                </div>
              </div>
              <form onSubmit={handleSubmit} className="space-y-3">
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="label" htmlFor="pay-amount">Amount Received *</label>
                    <input id="pay-amount" type="number" step="0.01" value={amount} onChange={(e) => setAmount(e.target.value)} className="input" max={balance} required />
                  </div>
                  <div>
                    <label className="label" htmlFor="pay-mode">Payment Mode</label>
                    <select id="pay-mode" value={paymentMode} onChange={(e) => setPaymentMode(e.target.value)} className="input">
                      {PAYMENT_MODES.map((m) => <option key={m}>{m}</option>)}
                    </select>
                  </div>
                  {["UPI", "BANK_TRANSFER", "CHEQUE", "ONLINE"].includes(paymentMode) && (
                    <div className="col-span-2">
                      <label className="label" htmlFor="pay-ref">Reference / Transaction No</label>
                      <input id="pay-ref" value={reference} onChange={(e) => setReference(e.target.value)} className="input" placeholder="UTR / cheque no / transaction ID" />
                    </div>
                  )}
                  <div>
                    <label className="label" htmlFor="pay-date">Payment Date</label>
                    <input id="pay-date" type="date" value={paymentDate} onChange={(e) => setPaymentDate(e.target.value)} className="input" />
                  </div>
                  <div>
                    <label className="label" htmlFor="pay-remarks">Remarks</label>
                    <input id="pay-remarks" value={remarks} onChange={(e) => setRemarks(e.target.value)} className="input" />
                  </div>
                </div>
                <div className="flex gap-3 pt-2">
                  <Link href="/admin/finance" className="btn-secondary flex-1 text-center">Cancel</Link>
                  <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Record & Get Receipt"}
                  </button>
                </div>
              </form>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

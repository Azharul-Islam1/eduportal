"use client";

import { useState, useEffect } from "react";
import { Loader2, Receipt, CreditCard } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface InvoiceItem { name: string; feeType: string; amount: number }
interface Payment { id: string; receiptNumber: string; amount: number; paymentDate: string; paymentMode: string }
interface Invoice {
  id: string; invoiceNo: string; period: string; totalAmount: number; paidAmount: number;
  status: string; dueDate: string; academicYear: string;
  items: InvoiceItem[];
  class: { name: string; section: string };
  payments: Payment[];
}

const statusColor: Record<string, string> = {
  PENDING: "bg-yellow-100 text-yellow-700",
  PARTIAL: "bg-blue-100 text-blue-700",
  OVERDUE: "bg-red-100 text-red-600",
  PAID: "bg-green-100 text-green-700",
};

export default function StudentFeeLedger({ studentId }: { studentId: string }) {
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterYear, setFilterYear] = useState("2025-2026");

  useEffect(() => {
    setLoading(true);
    fetch(`/api/fees/invoices?studentId=${studentId}&academicYear=${filterYear}`)
      .then((r) => r.json())
      .then(setInvoices)
      .finally(() => setLoading(false));
  }, [studentId, filterYear]);

  const totalCharged = invoices.reduce((s, i) => s + i.totalAmount, 0);
  const totalPaid = invoices.reduce((s, i) => s + i.paidAmount, 0);
  const balance = totalCharged - totalPaid;

  if (loading) return <div className="flex justify-center py-10"><Loader2 className="w-5 h-5 animate-spin text-gray-400" /></div>;

  return (
    <div className="space-y-4">
      {/* Summary header */}
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex gap-4">
          <div className="text-center">
            <p className="text-xs text-gray-500">Total Charged</p>
            <p className="font-bold text-gray-800">{formatCurrency(totalCharged)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Paid</p>
            <p className="font-bold text-green-600">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="text-center">
            <p className="text-xs text-gray-500">Balance</p>
            <p className={`font-bold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>{formatCurrency(balance)}</p>
          </div>
        </div>
        <div className="flex items-center gap-2">
          <select value={filterYear} onChange={(e) => setFilterYear(e.target.value)} className="input max-w-[140px] text-sm" aria-label="Academic year">
            <option>2024-2025</option>
            <option>2025-2026</option>
          </select>
          <Link href="/admin/fees/payments/new" className="btn-primary text-sm">+ Record Payment</Link>
        </div>
      </div>

      {invoices.length === 0 ? (
        <div className="rounded-xl border-2 border-dashed border-gray-200 p-10 text-center text-gray-400">
          <Receipt className="w-8 h-8 mx-auto mb-2 opacity-40" />
          <p className="text-sm">No invoices for {filterYear}.</p>
          <Link href="/admin/fees/generate" className="text-xs text-blue-600 hover:underline mt-1 block">Generate invoices →</Link>
        </div>
      ) : (
        <div className="space-y-3">
          {invoices.map((inv) => (
            <div key={inv.id} className="rounded-xl border border-gray-200 overflow-hidden">
              {/* Invoice header row */}
              <div className="flex items-center justify-between px-4 py-3 bg-gray-50">
                <div className="flex items-center gap-3">
                  <Receipt className="w-4 h-4 text-gray-400" />
                  <div>
                    <span className="font-medium text-gray-800 text-sm">{inv.invoiceNo}</span>
                    <span className="text-gray-400 text-xs ml-2">{inv.period}</span>
                  </div>
                  <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${statusColor[inv.status] ?? "bg-gray-100"}`}>{inv.status}</span>
                </div>
                <div className="text-right text-sm">
                  <p className="font-semibold text-gray-800">{formatCurrency(inv.totalAmount)}</p>
                  <p className="text-xs text-gray-400">Due {formatDate(inv.dueDate)}</p>
                </div>
              </div>

              {/* Fee items */}
              <div className="px-4 py-2 divide-y divide-gray-100">
                {inv.items.map((it, i) => (
                  <div key={i} className="flex justify-between py-1.5 text-xs text-gray-600">
                    <span>{it.name}</span><span>{formatCurrency(it.amount)}</span>
                  </div>
                ))}
              </div>

              {/* Payments on this invoice */}
              {inv.payments.length > 0 && (
                <div className="border-t border-gray-100 px-4 py-2 bg-green-50/40">
                  <p className="text-xs text-gray-400 mb-1 font-medium">Payments</p>
                  {inv.payments.map((p) => (
                    <div key={p.id} className="flex items-center justify-between py-1 text-xs text-gray-600">
                      <div className="flex items-center gap-2">
                        <CreditCard className="w-3 h-3 text-green-500" />
                        <Link href={`/admin/fees/payments/${p.id}`} className="text-blue-600 hover:underline">{p.receiptNumber}</Link>
                        <span className="text-gray-400">{formatDate(p.paymentDate)} · {p.paymentMode}</span>
                      </div>
                      <span className="font-medium text-green-700">{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                  {inv.paidAmount < inv.totalAmount && (
                    <p className="text-xs text-red-500 mt-1">Balance: {formatCurrency(inv.totalAmount - inv.paidAmount)}</p>
                  )}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

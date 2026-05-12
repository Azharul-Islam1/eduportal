"use client";

import { useState, useEffect, use } from "react";
import { Loader2, Printer, ArrowLeft, Download } from "lucide-react";
import Link from "next/link";
import { formatCurrency, formatDate } from "@/lib/utils";

interface PaymentDetail {
  id: string; receiptNumber: string; amount: number; paymentMode: string;
  reference: string | null; paymentDate: string; remarks: string | null;
  invoice: {
    invoiceNo: string; period: string; totalAmount: number; paidAmount: number;
    status: string; dueDate: string; academicYear: string;
    items: { name: string; feeType: string; amount: number }[];
    class: { name: string; section: string };
    student: {
      user: { name: string; email: string; phone: string | null };
      class: { name: string; section: string };
    };
    payments: { id: string; receiptNumber: string; amount: number; paymentDate: string; paymentMode: string }[];
  };
  school: { name: string; address: string | null; phone: string | null; email: string | null } | null;
}

export default function PaymentDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = use(params);
  const [payment, setPayment] = useState<PaymentDetail | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`/api/fees/payments/${id}`).then((r) => r.json()).then(setPayment).finally(() => setLoading(false));
  }, [id]);

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>;
  if (!payment) return <div className="p-6 text-red-500">Payment not found.</div>;

  const { invoice, school } = payment;
  const balance = invoice.totalAmount - invoice.paidAmount;

  return (
    <>
      {/* Print styles injected inline */}
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #receipt, #receipt * { visibility: visible !important; }
          #receipt { position: fixed !important; top: 0; left: 0; width: 100%; }
          .no-print { display: none !important; }
        }
      `}</style>

      <div className="p-6">
        {/* Toolbar - hidden when printing */}
        <div className="no-print flex items-center justify-between mb-5">
          <Link href="/admin/finance" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ArrowLeft className="w-4 h-4" /> Finance
          </Link>
          <div className="flex gap-2">
            <button type="button" onClick={() => window.print()} className="btn-secondary flex items-center gap-1.5">
              <Printer className="w-4 h-4" /> Print
            </button>
            <button type="button" onClick={() => { document.title = payment.receiptNumber; window.print(); }} className="btn-primary flex items-center gap-1.5">
              <Download className="w-4 h-4" /> Download PDF
            </button>
          </div>
        </div>

        {/* Receipt */}
        <div id="receipt" className="max-w-2xl mx-auto">
          <div className="card p-8 border border-gray-200">
            {/* Header */}
            <div className="text-center border-b border-gray-200 pb-5 mb-5">
              <h1 className="text-2xl font-bold text-gray-900">{school?.name ?? "School Name"}</h1>
              {school?.address && <p className="text-sm text-gray-500 mt-0.5">{school.address}</p>}
              <div className="flex justify-center gap-4 text-xs text-gray-400 mt-1">
                {school?.phone && <span>Tel: {school.phone}</span>}
                {school?.email && <span>Email: {school.email}</span>}
              </div>
            </div>

            {/* Receipt title + meta */}
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-bold text-gray-800 uppercase tracking-wide">Fee Receipt</h2>
                <p className="text-sm text-gray-500 mt-0.5">Invoice: {invoice.invoiceNo}</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-bold text-blue-700">{payment.receiptNumber}</p>
                <p className="text-sm text-gray-500 mt-0.5">{formatDate(payment.paymentDate)}</p>
              </div>
            </div>

            {/* Student details */}
            <div className="bg-gray-50 rounded-xl p-4 mb-5 grid grid-cols-2 gap-2 text-sm">
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Student Name</p>
                <p className="font-semibold text-gray-800">{invoice.student.user.name}</p>
              </div>
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Class</p>
                <p className="font-semibold text-gray-800">{invoice.class.name} — Sec {invoice.class.section}</p>
              </div>
              {invoice.student.user.phone && (
                <div>
                  <p className="text-xs text-gray-400 uppercase tracking-wide">Phone</p>
                  <p className="text-gray-700">{invoice.student.user.phone}</p>
                </div>
              )}
              <div>
                <p className="text-xs text-gray-400 uppercase tracking-wide">Period</p>
                <p className="text-gray-700">{invoice.period} · {invoice.academicYear}</p>
              </div>
            </div>

            {/* Fee breakdown */}
            <table className="w-full text-sm mb-5">
              <thead>
                <tr className="bg-gray-100 text-xs uppercase text-gray-500">
                  <th className="px-3 py-2 text-left font-medium">Description</th>
                  <th className="px-3 py-2 text-right font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {(invoice.items as { name: string; amount: number }[]).map((it, i) => (
                  <tr key={i}>
                    <td className="px-3 py-2 text-gray-700">{it.name}</td>
                    <td className="px-3 py-2 text-right text-gray-700">{formatCurrency(it.amount)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="border-t-2 border-gray-200">
                  <td className="px-3 py-2 font-semibold text-gray-700">Total Invoice</td>
                  <td className="px-3 py-2 text-right font-semibold text-gray-800">{formatCurrency(invoice.totalAmount)}</td>
                </tr>
              </tfoot>
            </table>

            {/* Payment summary */}
            <div className="bg-blue-50 border border-blue-100 rounded-xl p-4 mb-5">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div>
                  <p className="text-xs text-gray-400">Amount Paid (This Transaction)</p>
                  <p className="text-xl font-bold text-blue-700">{formatCurrency(payment.amount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Payment Mode</p>
                  <p className="font-semibold text-gray-800">{payment.paymentMode.replace("_", " ")}</p>
                  {payment.reference && <p className="text-xs text-gray-500 mt-0.5">Ref: {payment.reference}</p>}
                </div>
                <div>
                  <p className="text-xs text-gray-400">Total Paid (All Transactions)</p>
                  <p className="font-semibold text-green-700">{formatCurrency(invoice.paidAmount)}</p>
                </div>
                <div>
                  <p className="text-xs text-gray-400">Balance Due</p>
                  <p className={`font-semibold ${balance > 0 ? "text-red-600" : "text-green-600"}`}>
                    {balance > 0 ? formatCurrency(balance) : "Fully Paid ✓"}
                  </p>
                </div>
              </div>
            </div>

            {/* Payment history (all payments on this invoice) */}
            {invoice.payments.length > 1 && (
              <div className="mb-5">
                <p className="text-xs font-semibold text-gray-500 uppercase mb-2">Payment History</p>
                <div className="space-y-1">
                  {invoice.payments.map((p) => (
                    <div key={p.id} className={`flex justify-between text-xs px-3 py-1.5 rounded ${p.id === payment.id ? "bg-blue-50 font-medium" : "text-gray-500"}`}>
                      <span>{p.receiptNumber} · {formatDate(p.paymentDate)} · {p.paymentMode}</span>
                      <span>{formatCurrency(p.amount)}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Footer */}
            <div className="border-t border-gray-200 pt-4 flex justify-between items-end text-xs text-gray-400">
              <div>
                <p>Due Date: {formatDate(invoice.dueDate)}</p>
                {payment.remarks && <p className="mt-0.5">Note: {payment.remarks}</p>}
              </div>
              <div className="text-right">
                <div className="h-8 border-b border-gray-300 w-32 mb-1" />
                <p>Authorized Signature</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </>
  );
}

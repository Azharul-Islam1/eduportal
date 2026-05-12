"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { DollarSign, TrendingUp, AlertCircle, CheckCircle, ArrowRight, Loader2, ClipboardList, Receipt, Users } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface Summary {
  totalInvoiced: number; totalCollected: number; totalOutstanding: number;
  overdueCount: number; overdueAmount: number; totalPayments: number;
}

export default function FinancePage() {
  const [summary, setSummary] = useState<Summary | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/fees/summary").then((r) => r.json()).then(setSummary).finally(() => setLoading(false));
  }, []);

  const cards = [
    { label: "Total Collected", value: summary?.totalCollected ?? 0, icon: CheckCircle, color: "bg-green-100 text-green-600" },
    { label: "Outstanding", value: summary?.totalOutstanding ?? 0, icon: AlertCircle, color: "bg-yellow-100 text-yellow-600" },
    { label: "Overdue Amount", value: summary?.overdueAmount ?? 0, icon: TrendingUp, color: "bg-red-100 text-red-600" },
    { label: "Total Invoiced", value: summary?.totalInvoiced ?? 0, icon: DollarSign, color: "bg-blue-100 text-blue-600" },
  ];

  const quickLinks = [
    { label: "Fee Structures", desc: "Define tuition, transport, exam fees", href: "/admin/fees/structures", icon: ClipboardList, color: "bg-purple-50 border-purple-200" },
    { label: "Generate Invoices", desc: "Batch-create invoices for a period", href: "/admin/fees/generate", icon: DollarSign, color: "bg-blue-50 border-blue-200" },
    { label: "Record Payment", desc: "Log a student payment & get receipt", href: "/admin/fees/payments/new", icon: Receipt, color: "bg-green-50 border-green-200" },
    { label: "Dues Dashboard", desc: "Students with pending or overdue fees", href: "/admin/fees/dues", icon: Users, color: "bg-red-50 border-red-200" },
  ];

  return (
    <div>
      <Header title="Finance & Fees" />
      <div className="p-6 space-y-6">
        {loading ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : (
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            {cards.map((c) => (
              <div key={c.label} className="card p-4 flex items-center gap-3">
                <div className={`p-2.5 rounded-xl ${c.color}`}><c.icon className="w-5 h-5" /></div>
                <div>
                  <p className="text-xs text-gray-500">{c.label}</p>
                  <p className="font-bold text-gray-900 text-sm">{formatCurrency(c.value)}</p>
                </div>
              </div>
            ))}
          </div>
        )}

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {quickLinks.map((l) => (
            <Link key={l.href} href={l.href} className={`card border-2 ${l.color} p-5 hover:shadow-md transition group`}>
              <div className="flex items-start justify-between">
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <l.icon className="w-5 h-5 text-gray-600" />
                    <h3 className="font-semibold text-gray-800">{l.label}</h3>
                  </div>
                  <p className="text-sm text-gray-500">{l.desc}</p>
                </div>
                <ArrowRight className="w-4 h-4 text-gray-400 group-hover:translate-x-1 transition-transform mt-1" />
              </div>
            </Link>
          ))}
        </div>

        <div className="text-center">
          <p className="text-xs text-gray-400">
            Total payments recorded: {summary?.totalPayments ?? 0} · Overdue invoices: {summary?.overdueCount ?? 0}
          </p>
        </div>
      </div>
    </div>
  );
}

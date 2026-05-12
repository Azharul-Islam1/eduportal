"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, ChevronLeft, Eye, Zap, CheckCircle } from "lucide-react";
import Link from "next/link";
import { formatCurrency } from "@/lib/utils";

interface ClassItem { id: string; name: string; section: string }
interface PreviewRow { studentId: string; studentName: string; class: string; items: { name: string; feeType: string; amount: number }[]; total: number }

const MONTHS = ["April", "May", "June", "July", "August", "September", "October", "November", "December", "January", "February", "March"];
const TERMS = ["Term 1", "Term 2", "Term 3"];

export default function GenerateInvoicesPage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [selectedClasses, setSelectedClasses] = useState<string[]>([]);
  const [periodType, setPeriodType] = useState<"MONTHLY" | "TERM" | "ANNUAL">("MONTHLY");
  const [month, setMonth] = useState("April");
  const [term, setTerm] = useState("Term 1");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [dueDate, setDueDate] = useState("");
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [previewing, setPreviewing] = useState(false);
  const [generating, setGenerating] = useState(false);
  const [result, setResult] = useState<{ created: number; skipped: number } | null>(null);

  useEffect(() => { fetch("/api/classes").then((r) => r.json()).then(setClasses); }, []);

  function getPeriod() {
    if (periodType === "MONTHLY") return `${month} ${academicYear.split("-")[0]}`;
    if (periodType === "TERM") return `${term} ${academicYear}`;
    return `Annual ${academicYear}`;
  }

  function toggleClass(id: string) {
    setSelectedClasses((prev) => prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]);
    setPreview([]); setResult(null);
  }

  async function handlePreview() {
    setPreviewing(true);
    setResult(null);
    const res = await fetch("/api/fees/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classIds: selectedClasses, period: getPeriod(), academicYear, dueDate: dueDate || new Date().toISOString(), preview: true }),
    });
    setPreview(await res.json());
    setPreviewing(false);
  }

  async function handleGenerate() {
    if (!dueDate) { alert("Please set a due date before generating."); return; }
    if (!confirm(`Generate ${preview.length} invoices for "${getPeriod()}"?`)) return;
    setGenerating(true);
    const res = await fetch("/api/fees/invoices", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classIds: selectedClasses, period: getPeriod(), academicYear, dueDate, preview: false }),
    });
    setResult(await res.json());
    setPreview([]);
    setGenerating(false);
  }

  const grandTotal = preview.reduce((s, r) => s + r.total, 0);

  return (
    <div>
      <Header title="Generate Invoices" />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Link href="/admin/finance" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Finance
          </Link>
        </div>

        {result && (
          <div className="card border-2 border-green-300 bg-green-50 p-5 flex items-center gap-4">
            <CheckCircle className="w-8 h-8 text-green-600 shrink-0" />
            <div>
              <p className="font-semibold text-green-800">Invoices generated successfully</p>
              <p className="text-sm text-green-700 mt-0.5">{result.created} created · {result.skipped} skipped (duplicates)</p>
            </div>
            <Link href="/admin/fees/dues" className="ml-auto btn-secondary text-sm">View Dues →</Link>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
          {/* Configuration panel */}
          <div className="lg:col-span-1 space-y-4">
            <div className="card p-5 space-y-4">
              <h3 className="font-semibold text-gray-700">Configuration</h3>

              <div>
                <label className="label" htmlFor="gen-year">Academic Year</label>
                <input id="gen-year" value={academicYear} onChange={(e) => { setAcademicYear(e.target.value); setPreview([]); }} className="input" />
              </div>

              <div>
                <label className="label" htmlFor="gen-ptype">Period Type</label>
                <select id="gen-ptype" value={periodType} onChange={(e) => { setPeriodType(e.target.value as never); setPreview([]); }} className="input">
                  <option value="MONTHLY">Monthly</option>
                  <option value="TERM">Term</option>
                  <option value="ANNUAL">Annual</option>
                </select>
              </div>

              {periodType === "MONTHLY" && (
                <div>
                  <label className="label" htmlFor="gen-month">Month</label>
                  <select id="gen-month" value={month} onChange={(e) => { setMonth(e.target.value); setPreview([]); }} className="input">
                    {MONTHS.map((m) => <option key={m}>{m}</option>)}
                  </select>
                </div>
              )}
              {periodType === "TERM" && (
                <div>
                  <label className="label" htmlFor="gen-term">Term</label>
                  <select id="gen-term" value={term} onChange={(e) => { setTerm(e.target.value); setPreview([]); }} className="input">
                    {TERMS.map((t) => <option key={t}>{t}</option>)}
                  </select>
                </div>
              )}

              <div>
                <label className="label" htmlFor="gen-due">Due Date *</label>
                <input id="gen-due" type="date" value={dueDate} onChange={(e) => setDueDate(e.target.value)} className="input" />
              </div>

              <div>
                <p className="label mb-2">Select Classes</p>
                <div className="space-y-1.5 max-h-48 overflow-y-auto">
                  <label className="flex items-center gap-2 text-sm cursor-pointer py-1">
                    <input type="checkbox" checked={selectedClasses.length === 0} onChange={() => { setSelectedClasses([]); setPreview([]); }} className="rounded" />
                    <span className="font-medium text-gray-700">All Classes</span>
                  </label>
                  {classes.map((c) => (
                    <label key={c.id} className="flex items-center gap-2 text-sm cursor-pointer py-1">
                      <input type="checkbox" checked={selectedClasses.includes(c.id)} onChange={() => toggleClass(c.id)} className="rounded" />
                      {c.name} {c.section}
                    </label>
                  ))}
                </div>
              </div>

              <div className="space-y-2 pt-1">
                <p className="text-xs text-gray-500">Period: <span className="font-medium text-gray-700">{getPeriod()}</span></p>
                <button type="button" onClick={handlePreview} disabled={previewing} className="btn-secondary w-full justify-center">
                  {previewing ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Eye className="w-4 h-4" /> Preview</>}
                </button>
              </div>
            </div>
          </div>

          {/* Preview panel */}
          <div className="lg:col-span-2">
            <div className="card overflow-hidden">
              <div className="px-4 py-3 border-b border-gray-100 flex justify-between items-center">
                <h3 className="font-medium text-gray-700">
                  Preview {preview.length > 0 ? `— ${preview.length} students · ${formatCurrency(grandTotal)}` : ""}
                </h3>
                {preview.length > 0 && (
                  <button type="button" onClick={handleGenerate} disabled={generating} className="btn-primary text-sm">
                    {generating ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Zap className="w-4 h-4" /> Generate {preview.length} Invoices</>}
                  </button>
                )}
              </div>
              {preview.length === 0 ? (
                <div className="py-16 text-center text-gray-400 text-sm">
                  Configure period & classes, then click Preview.
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Student</th>
                        <th className="px-4 py-3 text-left font-medium">Class</th>
                        <th className="px-4 py-3 text-left font-medium">Fee Items</th>
                        <th className="px-4 py-3 text-right font-medium">Total</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {preview.map((r) => (
                        <tr key={r.studentId} className="hover:bg-gray-50">
                          <td className="px-4 py-3 font-medium text-gray-800">{r.studentName}</td>
                          <td className="px-4 py-3 text-gray-500">{r.class}</td>
                          <td className="px-4 py-3">
                            <div className="flex flex-wrap gap-1">
                              {r.items.map((it, i) => (
                                <span key={i} className="text-xs bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">{it.name}: {formatCurrency(it.amount)}</span>
                              ))}
                            </div>
                          </td>
                          <td className="px-4 py-3 text-right font-semibold text-green-700">{formatCurrency(r.total)}</td>
                        </tr>
                      ))}
                    </tbody>
                    <tfoot className="bg-gray-50">
                      <tr>
                        <td colSpan={3} className="px-4 py-3 text-xs font-semibold text-gray-600 text-right">Grand Total:</td>
                        <td className="px-4 py-3 text-right font-bold text-green-700">{formatCurrency(grandTotal)}</td>
                      </tr>
                    </tfoot>
                  </table>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function StudentFeesPage() {
  const session = await getServerSession(authOptions);
  const student = await db.student.findUnique({ where: { userId: session!.user.id } });

  const payments = student ? await db.feePayment.findMany({
    where: { studentId: student.id },
    include: { feeStructure: { include: { class: true } } },
    orderBy: { createdAt: "desc" },
  }) : [];

  const totalPaid = payments.filter((p) => p.status === "PAID").reduce((s, p) => s + p.paidAmount, 0);
  const totalPending = payments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.paidAmount, 0);

  const statusColor: Record<string, string> = { PAID: "bg-green-100 text-green-700", PENDING: "bg-yellow-100 text-yellow-700", OVERDUE: "bg-red-100 text-red-600", PARTIAL: "bg-blue-100 text-blue-700" };

  return (
    <div>
      <Header title="Fee Details" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-2 gap-4">
          <div className="card p-5 border-l-4 border-green-500">
            <p className="text-sm text-gray-500">Total Paid</p>
            <p className="text-2xl font-bold text-green-700 mt-1">{formatCurrency(totalPaid)}</p>
          </div>
          <div className="card p-5 border-l-4 border-yellow-400">
            <p className="text-sm text-gray-500">Pending</p>
            <p className="text-2xl font-bold text-yellow-700 mt-1">{formatCurrency(totalPending)}</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Payment History</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{["Fee Type", "Amount", "Date", "Status", "Transaction ID"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {payments.length === 0 && <tr><td colSpan={5} className="py-8 text-center text-gray-400">No fee records found.</td></tr>}
              {payments.map((p) => (
                <tr key={p.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{p.feeStructure.feeType}</td>
                  <td className="px-4 py-3 font-semibold text-gray-800">{formatCurrency(p.paidAmount)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(p.paidDate)}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColor[p.status] ?? "bg-gray-100"}`}>{p.status}</span></td>
                  <td className="px-4 py-3 font-mono text-xs text-gray-500">{p.transactionId ?? "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

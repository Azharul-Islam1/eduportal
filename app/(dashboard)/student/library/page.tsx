import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import { formatDate } from "@/lib/utils";

export default async function StudentLibraryPage() {
  const session = await getServerSession(authOptions);
  const student = await db.student.findUnique({ where: { userId: session!.user.id } });

  const issues = student ? await db.bookIssue.findMany({
    where: { studentId: student.id },
    include: { book: { include: { category: true } } },
    orderBy: { issueDate: "desc" },
  }) : [];

  const statusColor: Record<string, string> = { ISSUED: "bg-blue-100 text-blue-700", RETURNED: "bg-green-100 text-green-700", OVERDUE: "bg-red-100 text-red-600" };

  const activeIssues = issues.filter((i) => i.status === "ISSUED");

  return (
    <div>
      <Header title="Library" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-blue-700">{activeIssues.length}</p><p className="text-xs text-gray-500 mt-1">Currently Issued</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-gray-800">{issues.length}</p><p className="text-xs text-gray-500 mt-1">Total Borrowed</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-red-600">{issues.reduce((s, i) => s + (i.fine ?? 0), 0).toFixed(2)}</p><p className="text-xs text-gray-500 mt-1">Total Fine ($)</p></div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Borrowing History</h3></div>
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{["Book Title", "Author", "Category", "Issue Date", "Due Date", "Return Date", "Status", "Fine"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {issues.length === 0 && <tr><td colSpan={8} className="py-8 text-center text-gray-400">No borrowing history.</td></tr>}
              {issues.map((i) => (
                <tr key={i.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{i.book.title}</td>
                  <td className="px-4 py-3 text-gray-600">{i.book.author}</td>
                  <td className="px-4 py-3"><span className="badge bg-purple-50 text-purple-700">{i.book.category.name}</span></td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(i.issueDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{formatDate(i.dueDate)}</td>
                  <td className="px-4 py-3 text-gray-600">{i.returnDate ? formatDate(i.returnDate) : "—"}</td>
                  <td className="px-4 py-3"><span className={`badge ${statusColor[i.status] ?? "bg-gray-100"}`}>{i.status}</span></td>
                  <td className="px-4 py-3 text-gray-600">{i.fine ? `$${i.fine}` : "—"}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

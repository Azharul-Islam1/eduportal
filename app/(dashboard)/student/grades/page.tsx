import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import { formatDate } from "@/lib/utils";

export default async function StudentGradesPage() {
  const session = await getServerSession(authOptions);
  const student = await db.student.findUnique({ where: { userId: session!.user.id } });

  const results = student ? await db.examResult.findMany({
    where: { studentId: student.id },
    include: { exam: { include: { subject: true, class: true } } },
    orderBy: { createdAt: "desc" },
  }) : [];

  const gradeColors: Record<string, string> = { "A+": "bg-green-100 text-green-700", "A": "bg-green-100 text-green-700", "B+": "bg-blue-100 text-blue-700", "B": "bg-blue-100 text-blue-700", "C": "bg-yellow-100 text-yellow-700", "D": "bg-orange-100 text-orange-700", "F": "bg-red-100 text-red-600" };

  const avg = results.length > 0 ? results.reduce((s, r) => s + (r.marksObtained / r.exam.totalMarks) * 100, 0) / results.length : 0;

  return (
    <div>
      <Header title="My Grades" />
      <div className="p-6 space-y-5">
        <div className="grid grid-cols-3 gap-4">
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-gray-800">{results.length}</p><p className="text-xs text-gray-500 mt-1">Total Exams</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-green-600">{avg.toFixed(1)}%</p><p className="text-xs text-gray-500 mt-1">Average Score</p></div>
          <div className="card p-4 text-center"><p className="text-2xl font-bold text-blue-600">{results.filter((r) => r.marksObtained >= r.exam.passingMarks).length}</p><p className="text-xs text-gray-500 mt-1">Passed</p></div>
        </div>

        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{["Subject", "Exam", "Type", "Date", "Marks", "Percentage", "Grade"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {results.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No results published yet.</td></tr>}
              {results.map((r) => {
                const pct = ((r.marksObtained / r.exam.totalMarks) * 100).toFixed(1);
                return (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.exam.subject.name}</td>
                    <td className="px-4 py-3 text-gray-600">{r.exam.name}</td>
                    <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-600">{r.exam.type}</span></td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.exam.date)}</td>
                    <td className="px-4 py-3 font-semibold text-gray-800">{r.marksObtained}/{r.exam.totalMarks}</td>
                    <td className="px-4 py-3">
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-1.5 rounded-full bg-gray-100 max-w-16"><div className="h-full rounded-full bg-blue-500" style={{ width: `${pct}%` }} /></div>
                        <span className="text-gray-600">{pct}%</span>
                      </div>
                    </td>
                    <td className="px-4 py-3"><span className={`badge ${gradeColors[r.grade ?? "F"] ?? "bg-gray-100"}`}>{r.grade ?? "—"}</span></td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

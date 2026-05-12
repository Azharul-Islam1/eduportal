import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import { formatDate } from "@/lib/utils";

export default async function TeacherExamsPage() {
  const session = await getServerSession(authOptions);
  const teacher = await db.teacher.findUnique({ where: { userId: session!.user.id } });

  const exams = teacher ? await db.exam.findMany({
    where: { teacherId: teacher.id },
    include: { class: true, subject: true, _count: { select: { results: true } } },
    orderBy: { date: "desc" },
  }) : [];

  const typeColors: Record<string, string> = { MIDTERM: "bg-blue-100 text-blue-700", FINAL: "bg-purple-100 text-purple-700", QUIZ: "bg-green-100 text-green-700", ASSIGNMENT: "bg-orange-100 text-orange-700", PRACTICAL: "bg-red-100 text-red-700" };

  return (
    <div>
      <Header title="My Exams" />
      <div className="p-6">
        <div className="card overflow-hidden">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 text-xs uppercase text-gray-500">
              <tr>{["Exam Name", "Type", "Class", "Subject", "Date", "Total Marks", "Results"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {exams.length === 0 && <tr><td colSpan={7} className="py-8 text-center text-gray-400">No exams created yet.</td></tr>}
              {exams.map((e) => (
                <tr key={e.id} className="hover:bg-gray-50">
                  <td className="px-4 py-3 font-medium text-gray-800">{e.name}</td>
                  <td className="px-4 py-3"><span className={`badge ${typeColors[e.type] ?? "bg-gray-100"}`}>{e.type}</span></td>
                  <td className="px-4 py-3 text-gray-600">{e.class?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{e.subject?.name ?? "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{e.date ? formatDate(e.date) : "—"}</td>
                  <td className="px-4 py-3 text-gray-600">{e.totalMarks}</td>
                  <td className="px-4 py-3"><span className="badge bg-gray-100 text-gray-600">{e._count.results} entered</span></td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

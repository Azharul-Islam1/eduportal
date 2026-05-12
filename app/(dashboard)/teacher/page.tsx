import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import { Users, ClipboardList, FileText, Calendar, BookOpen } from "lucide-react";
import { formatDate } from "@/lib/utils";

export default async function TeacherDashboard() {
  const session = await getServerSession(authOptions);

  const teacher = await db.teacher.findUnique({
    where: { userId: session!.user.id },
    include: {
      user: { select: { name: true, email: true, phone: true } },
      subjects: true,
      timetables: {
        include: { class: true, subject: true },
        orderBy: [{ day: "asc" }, { startTime: "asc" }],
      },
      _count: { select: { assignments: true, exams: true } },
    },
  });

  const upcomingExams = teacher
    ? await db.exam.findMany({
        where: { teacherId: teacher.id, date: { gte: new Date() } },
        include: { class: true, subject: true },
        orderBy: { date: "asc" },
        take: 5,
      })
    : [];

  const recentAssignments = teacher
    ? await db.assignment.findMany({
        where: { teacherId: teacher.id },
        include: { class: true, subject: true, _count: { select: { submissions: true } } },
        orderBy: { createdAt: "desc" },
        take: 5,
      })
    : [];

  const notices = await db.notice.findMany({
    where: { isActive: true, OR: [{ targetRole: null }, { targetRole: "TEACHER" }] },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { author: { select: { name: true } } },
  });

  const schedule = teacher?.timetables.slice(0, 6) ?? [];
  const activeClasses = teacher ? new Set(teacher.timetables.map((t) => t.classId)).size : 0;

  return (
    <div>
      <Header title="Teacher Dashboard" />
      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-green-600 to-teal-600 p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">Welcome, {teacher?.user.name ?? session?.user.name}!</h2>
              <p className="text-green-100 mt-1 text-sm">
                {teacher?.department ?? "Faculty"} · Employee ID {teacher?.employeeId ?? "—"}
              </p>
              <p className="text-green-100 text-sm mt-1">{formatDate(new Date())}</p>
            </div>
            <div className="space-y-1 text-sm text-green-100">
              <p>{teacher?.user.email}</p>
              <p>{teacher?.user.phone ?? "Phone not added"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Subjects" value={teacher?.subjects.length ?? 0} icon={BookOpen} color="green" />
          <StatCard title="Classes" value={activeClasses} icon={Users} color="blue" />
          <StatCard title="Assignments" value={teacher?._count.assignments ?? 0} icon={ClipboardList} color="purple" />
          <StatCard title="Exams" value={teacher?._count.exams ?? 0} icon={Calendar} color="orange" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Class Schedule</h3>
              <span className="text-xs text-gray-500">{schedule.length} entries</span>
            </div>
            <div className="divide-y divide-gray-100">
              {schedule.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No schedule assigned yet.</p>}
              {schedule.map((item) => (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.subject.name}</p>
                      <p className="text-xs text-gray-500">{item.class.name} · {item.day} · {item.startTime} - {item.endTime}</p>
                    </div>
                    <span className="badge bg-blue-50 text-blue-700">{item.class.section}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Notice Board</h3></div>
            <div className="divide-y divide-gray-100">
              {notices.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No notices yet.</p>}
              {notices.map((n) => (
                <div key={n.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{n.title}</p>
                  <p className="text-xs text-gray-500 mt-0.5">{n.author.name} · {formatDate(n.createdAt)}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Upcoming Exams</h3></div>
            <div className="divide-y divide-gray-100">
              {upcomingExams.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No upcoming exams scheduled.</p>}
              {upcomingExams.map((e) => (
                <div key={e.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{e.name}</p>
                    <p className="text-xs text-gray-500">{e.class?.name ?? "—"} · {e.subject?.name ?? "—"}</p>
                  </div>
                  <span className="text-xs text-blue-600 font-medium">{e.date ? formatDate(e.date) : "—"}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Recent Assignments</h3></div>
            <div className="divide-y divide-gray-100">
              {recentAssignments.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No assignments created yet.</p>}
              {recentAssignments.map((a) => (
                <div key={a.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-800">{a.title}</p>
                    <p className="text-xs text-gray-500">{a.class.name} · {a.subject.name}</p>
                  </div>
                  <span className="badge bg-blue-50 text-blue-700">{a._count.submissions} submitted</span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

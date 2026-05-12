import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import { BookOpen, ClipboardList, DollarSign, UserCheck, Calendar, Bell } from "lucide-react";
import { formatCurrency, formatDate } from "@/lib/utils";

export default async function StudentDashboard() {
  const session = await getServerSession(authOptions);

  const student = await db.student.findUnique({
    where: { userId: session!.user.id },
    include: {
      class: {
        include: {
          timetables: {
            include: { subject: true, teacher: { include: { user: { select: { name: true } } } } },
            orderBy: [{ day: "asc" }, { startTime: "asc" }],
          },
        },
      },
      user: { select: { name: true, email: true, phone: true } },
    },
  });

  if (!student) {
    return (
      <div>
        <Header title="Student Dashboard" />
        <div className="p-6">
          <div className="card p-8 text-center text-gray-500">Student profile not configured. Please contact admin.</div>
        </div>
      </div>
    );
  }

  const [attendancePresent, attendanceTotal, attendanceLog, results, feePayments, issuedBooks, events, notices] = await Promise.all([
    db.attendance.count({ where: { studentId: student.id, status: "PRESENT" } }),
    db.attendance.count({ where: { studentId: student.id } }),
    db.attendance.findMany({ where: { studentId: student.id }, orderBy: { date: "desc" }, take: 5 }),
    db.examResult.findMany({
      where: { studentId: student.id },
      include: { exam: { include: { subject: true } } },
      orderBy: { createdAt: "desc" },
      take: 5,
    }),
    db.feePayment.findMany({
      where: { studentId: student.id },
      include: { feeStructure: { include: { class: true } } },
      orderBy: { createdAt: "desc" },
      take: 10,
    }),
    db.bookIssue.count({ where: { studentId: student.id, status: "ISSUED" } }),
    db.event.findMany({ where: { isActive: true, date: { gte: new Date() } }, orderBy: { date: "asc" }, take: 5 }),
    db.notice.findMany({
      where: { isActive: true, OR: [{ targetRole: null }, { targetRole: "STUDENT" }] },
      orderBy: { createdAt: "desc" },
      take: 4,
      include: { author: { select: { name: true } } },
    }),
  ]);

  const attendancePct = attendanceTotal > 0 ? Math.round((attendancePresent / attendanceTotal) * 100) : 0;
  const pendingFees = feePayments.filter((p) => p.status === "PENDING").reduce((sum, p) => sum + p.paidAmount, 0);
  const timetable = student.class.timetables.slice(0, 5);

  return (
    <div>
      <Header title="Student Dashboard" />
      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-purple-600 to-pink-600 p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
            <div>
              <h2 className="text-xl font-bold">{student.user.name}</h2>
              <p className="text-purple-100 mt-1 text-sm">
                {student.class.name} · Roll: {student.rollNumber ?? "N/A"} · ID: {student.studentId}
              </p>
              <p className="text-purple-100 text-sm mt-1">{formatDate(new Date())}</p>
            </div>
            <div className="text-sm text-purple-100 space-y-1 text-right">
              <p>{student.user.email}</p>
              <p>{student.user.phone ?? "Phone not added"}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Attendance" value={`${attendancePct}%`} icon={UserCheck} color={attendancePct >= 75 ? "green" : "red"} />
          <StatCard title="Recent Exams" value={results.length} icon={ClipboardList} color="purple" />
          <StatCard title="Pending Fees" value={pendingFees} icon={DollarSign} color={pendingFees > 0 ? "orange" : "green"} />
          <StatCard title="Books Issued" value={issuedBooks} icon={BookOpen} color="blue" />
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Class Timetable</h3>
              <span className="text-xs text-gray-500">{timetable.length} entries</span>
            </div>
            <div className="divide-y divide-gray-100">
              {timetable.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No timetable available for your class.</p>}
              {timetable.map((item) => (
                <div key={item.id} className="px-5 py-3">
                  <div className="flex items-center justify-between gap-3">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{item.subject.name}</p>
                      <p className="text-xs text-gray-500">{item.day} · {item.startTime} - {item.endTime}</p>
                    </div>
                    <span className="badge bg-blue-50 text-blue-700">{item.teacher.user.name}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Upcoming Events</h3></div>
            <div className="divide-y divide-gray-100">
              {events.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No events scheduled.</p>}
              {events.map((e) => (
                <div key={e.id} className="px-5 py-3">
                  <p className="text-sm font-medium text-gray-800">{e.title}</p>
                  <p className="text-xs text-gray-500">{formatDate(e.date)}{e.venue ? ` · ${e.venue}` : ""}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Recent Results</h3>
              <a href="/student/grades" className="text-xs text-blue-600 hover:underline">View all</a>
            </div>
            <div className="divide-y divide-gray-100">
              {results.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No results available yet.</p>}
              {results.map((r) => {
                const pct = (r.marksObtained / r.exam.totalMarks) * 100;
                return (
                  <div key={r.id} className="px-5 py-3 flex items-center justify-between">
                    <div>
                      <p className="text-sm font-medium text-gray-800">{r.exam.subject?.name ?? r.exam.name}</p>
                      <p className="text-xs text-gray-500">{r.exam.name}{r.exam.date ? ` · ${formatDate(r.exam.date)}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-bold text-gray-800">{r.marksObtained}/{r.exam.totalMarks}</p>
                      <span className={`badge text-xs ${pct >= 40 ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>{r.grade ?? "—"}</span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="card">
            <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Attendance Log</h3></div>
            <div className="divide-y divide-gray-100">
              {attendanceLog.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No attendance records found.</p>}
              {attendanceLog.map((record) => (
                <div key={record.id} className="px-5 py-3 flex items-center justify-between">
                  <div>
                    <p className="text-sm text-gray-800">{formatDate(record.date)}</p>
                    <p className="text-xs text-gray-500">Status: {record.status}</p>
                  </div>
                  <span className={`badge text-xs ${record.status === "PRESENT" ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
                    {record.status}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-semibold text-gray-800">Fee Details</h3>
            <span className="text-xs text-gray-500">Total pending {formatCurrency(pendingFees)}</span>
          </div>
          <div className="divide-y divide-gray-100">
            {feePayments.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No fee payment records yet.</p>}
            {feePayments.map((payment) => (
              <div key={payment.id} className="px-5 py-3 flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-gray-800">{payment.feeStructure.feeType}</p>
                  <p className="text-xs text-gray-500">{payment.feeStructure.class?.name} · {formatDate(payment.paidDate)}</p>
                </div>
                <span className={`badge text-xs ${payment.status === "PAID" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-700"}`}>
                  {formatCurrency(payment.paidAmount)}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

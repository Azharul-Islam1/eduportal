import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import { formatDate } from "@/lib/utils";

export default async function StudentAttendancePage() {
  const session = await getServerSession(authOptions);
  const student = await db.student.findUnique({
    where: { userId: session!.user.id },
    include: { class: true },
  });

  if (!student) {
    return (
      <div>
        <Header title="My Attendance" />
        <div className="p-6">
          <div className="card p-8 text-center text-gray-500">Student profile not found.</div>
        </div>
      </div>
    );
  }

  const attendanceRecords = await db.attendance.findMany({
    where: { studentId: student.id },
    orderBy: { date: "desc" },
    take: 100,
  });

  const presentCount = attendanceRecords.filter((a) => a.status === "PRESENT").length;
  const absentCount = attendanceRecords.filter((a) => a.status === "ABSENT").length;
  const lateCount = attendanceRecords.filter((a) => a.status === "LATE").length;
  const excusedCount = attendanceRecords.filter((a) => a.status === "EXCUSED").length;
  const attendancePercentage = attendanceRecords.length > 0
    ? Math.round((presentCount / attendanceRecords.length) * 100)
    : 0;

  const statusColors: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-600",
    LATE: "bg-yellow-100 text-yellow-700",
    EXCUSED: "bg-blue-100 text-blue-700",
  };

  const statusBorder: Record<string, string> = {
    PRESENT: "border-l-4 border-green-500",
    ABSENT: "border-l-4 border-red-500",
    LATE: "border-l-4 border-yellow-400",
    EXCUSED: "border-l-4 border-blue-500",
  };

  return (
    <div>
      <Header title="My Attendance" />
      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-xl font-bold">Attendance Report</h2>
          <p className="text-blue-100 mt-1 text-sm">{student.class.name} · Total Records: {attendanceRecords.length}</p>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-green-600">{presentCount}</p>
            <p className="text-xs text-gray-500 mt-1">Present</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-red-600">{absentCount}</p>
            <p className="text-xs text-gray-500 mt-1">Absent</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-yellow-600">{lateCount}</p>
            <p className="text-xs text-gray-500 mt-1">Late</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-blue-600">{excusedCount}</p>
            <p className="text-xs text-gray-500 mt-1">Excused</p>
          </div>
          <div className="card p-4 text-center">
            <p className="text-3xl font-bold text-purple-600">{attendancePercentage}%</p>
            <p className="text-xs text-gray-500 mt-1">Attendance</p>
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="px-5 py-4 border-b border-gray-100">
            <h3 className="font-semibold text-gray-800">Attendance Records</h3>
          </div>
          <div className="divide-y divide-gray-100">
            {attendanceRecords.length === 0 && (
              <p className="px-5 py-8 text-center text-gray-400">No attendance records yet.</p>
            )}
            {attendanceRecords.map((record) => (
              <div
                key={record.id}
                className={`px-5 py-4 flex items-center justify-between hover:bg-gray-50 transition ${statusBorder[record.status] || ""}`}
              >
                <div className="flex items-center gap-4">
                  <p className="text-sm font-medium text-gray-800">{formatDate(record.date)}</p>
                  {record.remarks && <p className="text-xs text-gray-500">{record.remarks}</p>}
                </div>
                <span className={`badge ${statusColors[record.status] || "bg-gray-100"}`}>
                  {record.status}
                </span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

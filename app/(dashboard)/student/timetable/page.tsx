import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

export default async function StudentTimetablePage() {
  const session = await getServerSession(authOptions);
  const student = await db.student.findUnique({ where: { userId: session!.user.id } });

  const timetable = student ? await db.timetable.findMany({
    where: { classId: student.classId },
    include: { subject: true, teacher: { include: { user: { select: { name: true } } } } },
    orderBy: [{ day: "asc" }, { startTime: "asc" }],
  }) : [];

  const byDay = DAYS.reduce((acc, day) => {
    acc[day] = timetable.filter((t) => t.day === day);
    return acc;
  }, {} as Record<string, typeof timetable>);

  return (
    <div>
      <Header title="Timetable" />
      <div className="p-6 space-y-4">
        {DAYS.map((day) => (
          <div key={day} className="card overflow-hidden">
            <div className="px-5 py-3 bg-gray-50 border-b border-gray-100">
              <h3 className="font-semibold text-gray-700 text-sm">{day}</h3>
            </div>
            {byDay[day].length === 0 ? (
              <p className="px-5 py-3 text-sm text-gray-400 italic">No classes</p>
            ) : (
              <div className="divide-y divide-gray-100">
                {byDay[day].map((slot) => (
                  <div key={slot.id} className="px-5 py-3 flex items-center gap-4">
                    <div className="w-28 text-xs text-gray-500 font-medium shrink-0">{slot.startTime} – {slot.endTime}</div>
                    <div className="flex-1">
                      <p className="text-sm font-medium text-gray-800">{slot.subject.name}</p>
                      <p className="text-xs text-gray-500">{slot.teacher.user.name}</p>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {timetable.length === 0 && (
          <div className="card p-8 text-center text-gray-400">Timetable not configured yet. Check back later.</div>
        )}
      </div>
    </div>
  );
}

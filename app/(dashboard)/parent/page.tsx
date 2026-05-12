import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function ParentDashboard() {
  const session = await getServerSession(authOptions);

  const parent = await db.parent.findUnique({
    where: { userId: session!.user.id },
    include: {
      children: {
        include: {
          user: { select: { name: true, email: true } },
          class: true,
          attendance: { orderBy: { date: "desc" }, take: 10 },
          results: { include: { exam: { include: { subject: true } } }, orderBy: { createdAt: "desc" }, take: 5 },
          feePayments: { include: { feeStructure: true }, orderBy: { createdAt: "desc" }, take: 5 },
        },
      },
    },
  });

  const notices = await db.notice.findMany({
    where: { isActive: true, OR: [{ targetRole: null }, { targetRole: "PARENT" }] },
    orderBy: { createdAt: "desc" },
    take: 5,
    include: { author: { select: { name: true } } },
  });

  return (
    <div>
      <Header title="Parent Dashboard" />
      <div className="p-6 space-y-6">
        <div className="rounded-xl bg-gradient-to-r from-orange-500 to-amber-500 p-6 text-white">
          <h2 className="text-xl font-bold">Welcome, {session?.user.name}!</h2>
          <p className="text-orange-100 mt-1 text-sm">You have {parent?.children.length ?? 0} registered {(parent?.children.length ?? 0) === 1 ? "child" : "children"}</p>
        </div>

        {!parent || parent.children.length === 0 ? (
          <div className="card p-8 text-center text-gray-400">No children registered under your account. Please contact admin.</div>
        ) : (
          parent.children.map((child) => {
            const presentDays = child.attendance.filter((a) => a.status === "PRESENT").length;
            const attendancePct = child.attendance.length > 0 ? Math.round((presentDays / child.attendance.length) * 100) : 0;
            const pendingFees = child.feePayments.filter((p) => p.status === "PENDING").reduce((s, p) => s + p.paidAmount, 0);

            return (
              <div key={child.id} className="card">
                <div className="px-5 py-4 border-b border-gray-100 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-orange-100 text-orange-700 flex items-center justify-center font-bold">
                    {child.user.name.charAt(0)}
                  </div>
                  <div>
                    <p className="font-semibold text-gray-800">{child.user.name}</p>
                    <p className="text-xs text-gray-500">{child.class.name} · ID: {child.studentId}</p>
                  </div>
                  <div className="ml-auto flex gap-4 text-center">
                    <div><p className={`font-bold ${attendancePct >= 75 ? "text-green-600" : "text-red-500"}`}>{attendancePct}%</p><p className="text-xs text-gray-400">Attendance</p></div>
                    <div><p className={`font-bold ${pendingFees > 0 ? "text-yellow-600" : "text-green-600"}`}>{formatCurrency(pendingFees)}</p><p className="text-xs text-gray-400">Pending Fees</p></div>
                    <div><p className="font-bold text-gray-700">{child.results.length}</p><p className="text-xs text-gray-400">Results</p></div>
                  </div>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 divide-y md:divide-y-0 md:divide-x divide-gray-100">
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3">Recent Results</h4>
                    {child.results.length === 0 ? <p className="text-xs text-gray-400">No results yet.</p> : (
                      <div className="space-y-2">
                        {child.results.map((r) => (
                          <div key={r.id} className="flex items-center justify-between text-sm">
                            <span className="text-gray-700">{r.exam.subject?.name ?? r.exam.name}</span>
                            <span className="font-medium text-gray-800">{r.marksObtained}/{r.exam.totalMarks} <span className="text-gray-400">({r.grade})</span></span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                  <div className="p-4">
                    <h4 className="text-sm font-semibold text-gray-600 mb-3">Recent Attendance</h4>
                    <div className="flex flex-wrap gap-1">
                      {child.attendance.map((a) => (
                        <div key={a.id} title={`${formatDate(a.date)} - ${a.status}`} className={`w-6 h-6 rounded text-xs flex items-center justify-center font-bold ${
                          a.status === "PRESENT" ? "bg-green-100 text-green-700" :
                          a.status === "ABSENT" ? "bg-red-100 text-red-600" :
                          a.status === "LATE" ? "bg-yellow-100 text-yellow-700" : "bg-blue-100 text-blue-600"
                        }`}>
                          {a.status.charAt(0)}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          })
        )}

        <div className="card">
          <div className="px-5 py-4 border-b border-gray-100"><h3 className="font-semibold text-gray-800">Notices</h3></div>
          <div className="divide-y divide-gray-100">
            {notices.length === 0 && <p className="px-5 py-4 text-sm text-gray-400">No notices.</p>}
            {notices.map((n) => (
              <div key={n.id} className="px-5 py-3">
                <p className="text-sm font-medium text-gray-800">{n.title}</p>
                <p className="text-xs text-gray-500 mt-0.5 line-clamp-1">{n.content}</p>
                <p className="text-xs text-gray-400 mt-1">{n.author.name} · {formatDate(n.createdAt)}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

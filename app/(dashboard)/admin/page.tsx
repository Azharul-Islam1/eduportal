import Link from "next/link";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import Header from "@/components/dashboard/Header";
import StatCard from "@/components/dashboard/StatCard";
import { Users, GraduationCap, School, Bell, Calendar, DollarSign, Library, BookOpen } from "lucide-react";
import { formatDate, formatCurrency } from "@/lib/utils";

export default async function AdminDashboard() {
  const session = await getServerSession(authOptions);

  const [students, teachers, classes, subjects, notices, events, pendingFees, issuedBooks, recentStudents] = await Promise.all([
    db.student.count(),
    db.teacher.count(),
    db.class.count(),
    db.subject.count(),
    db.notice.count({ where: { isActive: true } }),
    db.event.count({ where: { isActive: true, date: { gte: new Date() } } }),
    db.feePayment.aggregate({ where: { status: "PENDING" }, _sum: { paidAmount: true } }),
    db.bookIssue.count({ where: { status: "ISSUED" } }),
    db.student.findMany({
      take: 5,
      orderBy: { createdAt: "desc" },
      include: { user: { select: { name: true, email: true } }, class: true },
    }),
  ]);

  const upcomingEvents = await db.event.findMany({
    where: { isActive: true, date: { gte: new Date() } },
    orderBy: { date: "asc" },
    take: 4,
  });

  const latestNotices = await db.notice.findMany({
    where: { isActive: true },
    orderBy: { createdAt: "desc" },
    take: 4,
    include: { author: { select: { name: true } } },
  });

  const managementItems = [
    { href: "/admin/students", title: "Students", description: "Manage student profiles and admissions.", value: students },
    { href: "/admin/teachers", title: "Teachers", description: "Add and manage faculty members.", value: teachers },
    { href: "/admin/classes", title: "Classes", description: "Create and assign classes.", value: classes },
    { href: "/admin/subjects", title: "Subjects", description: "Add subjects and assign teachers.", value: subjects },
    { href: "/admin/finance", title: "Fees", description: "Track fee structures and payments.", value: pendingFees._sum.paidAmount ?? 0, isCurrency: true },
    { href: "/admin/notices", title: "Notices", description: "Publish announcements for users.", value: notices },
  ];

  return (
    <div>
      <Header title="Admin Dashboard" />
      <div className="p-6 space-y-6">
        {/* Welcome */}
        <div className="rounded-xl bg-gradient-to-r from-blue-600 to-indigo-600 p-6 text-white">
          <h2 className="text-xl font-bold">Welcome back, {session?.user.name}!</h2>
          <p className="text-blue-100 mt-1 text-sm">{formatDate(new Date())}</p>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Students" value={students} icon={GraduationCap} color="blue" trend="12 new this month" trendUp />
          <StatCard title="Teachers" value={teachers} icon={Users} color="green" />
          <StatCard title="Classes" value={classes} icon={School} color="purple" />
          <StatCard title="Pending Fees" value={formatCurrency(pendingFees._sum.paidAmount ?? 0)} icon={DollarSign} color="orange" />
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          <StatCard title="Active Notices" value={notices} icon={Bell} color="blue" />
          <StatCard title="Upcoming Events" value={events} icon={Calendar} color="green" />
          <StatCard title="Books Issued" value={issuedBooks} icon={Library} color="purple" />
          <StatCard title="Subjects" value={subjects} icon={BookOpen} color="orange" />
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-4 gap-4">
          {managementItems.map((item) => (
            <Link key={item.href} href={item.href} className="card p-5 hover:shadow-lg transition border border-gray-200">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="text-sm font-semibold text-gray-900">{item.title}</h3>
                  <p className="text-xs text-gray-500">{item.description}</p>
                </div>
                <span className="px-2 py-1 rounded-full bg-blue-50 text-blue-700 text-xs font-semibold">Open</span>
              </div>
              <p className="text-3xl font-semibold text-gray-900">
                {item.isCurrency ? formatCurrency(item.value as number) : item.value}
              </p>
            </Link>
          ))}
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 card">
            <div className="px-5 py-4 border-b border-gray-100 flex items-center justify-between">
              <h3 className="font-semibold text-gray-800">Recent Admissions</h3>
              <a href="/admin/students" className="text-xs text-blue-600 hover:underline">View all</a>
            </div>
            <div className="divide-y divide-gray-100">
              {recentStudents.length === 0 && (
                <p className="px-5 py-4 text-sm text-gray-500">No students yet. Add them from the Students page.</p>
              )}
              {recentStudents.map((s) => (
                <div key={s.id} className="px-5 py-3 flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="w-9 h-9 rounded-full bg-blue-100 text-blue-700 flex items-center justify-center text-sm font-bold">
                      {s.user.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{s.user.name}</p>
                      <p className="text-xs text-gray-500">{s.class.name} · {s.studentId}</p>
                    </div>
                  </div>
                  <span className="text-xs text-gray-400">{formatDate(s.createdAt)}</span>
                </div>
              ))}
            </div>
          </div>

          <div className="space-y-4">
            <div className="card">
              <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
                <h3 className="font-semibold text-gray-800 text-sm">Latest Notices</h3>
                <a href="/admin/notices" className="text-xs text-blue-600 hover:underline">View all</a>
              </div>
              <div className="divide-y divide-gray-100">
                {latestNotices.map((n) => (
                  <div key={n.id} className="px-4 py-3">
                    <p className="text-sm font-medium text-gray-800 line-clamp-1">{n.title}</p>
                    <p className="text-xs text-gray-400 mt-0.5">{n.author.name} · {formatDate(n.createdAt)}</p>
                  </div>
                ))}
              </div>
            </div>

            <div className="card">
              <div className="px-4 py-3 border-b border-gray-100">
                <h3 className="font-semibold text-gray-800 text-sm">Upcoming Events</h3>
              </div>
              <div className="divide-y divide-gray-100">
                {upcomingEvents.length === 0 && <p className="px-4 py-3 text-xs text-gray-500">No upcoming events.</p>}
                {upcomingEvents.map((e) => (
                  <div key={e.id} className="px-4 py-3 flex gap-3">
                    <div className="rounded-lg bg-blue-50 px-2 py-1 text-center shrink-0">
                      <p className="text-xs font-bold text-blue-700">{new Date(e.date).toLocaleDateString("en-US", { month: "short" })}</p>
                      <p className="text-lg font-bold text-blue-900 leading-tight">{new Date(e.date).getDate()}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-800">{e.title}</p>
                      <p className="text-xs text-gray-500">{e.venue}</p>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { BookOpen, Users, GraduationCap, BarChart3, Calendar, Library } from "lucide-react";

const features = [
  { icon: Users, title: "Student & Staff Management", desc: "Manage student enrollment, teacher profiles, attendance, and performance tracking." },
  { icon: GraduationCap, title: "Courses & Examinations", desc: "Set up subjects, timetables, exams, assignments, and publish results." },
  { icon: BarChart3, title: "Finance & Fees", desc: "Track fee structures, payments, invoices, and financial reports." },
  { icon: Library, title: "Library System", desc: "Catalog books, manage issue/return records, and track overdue fines." },
  { icon: Calendar, title: "Events & Notices", desc: "Post notices, schedule events, and keep the entire institution informed." },
  { icon: BookOpen, title: "Role-Based Portals", desc: "Separate dashboards for Admin, Teacher, Student, and Parent roles." },
];

export default function HomePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-950 via-blue-900 to-indigo-900 text-white">
      {/* Header */}
      <header className="flex items-center justify-between px-8 py-5 border-b border-white/10">
        <div className="flex items-center gap-2">
          <GraduationCap className="w-8 h-8 text-blue-300" />
          <span className="text-xl font-bold tracking-tight">EduPortal</span>
        </div>
        <Link href="/login" className="btn-primary">
          Sign In
        </Link>
      </header>

      {/* Hero */}
      <section className="mx-auto max-w-4xl px-6 py-24 text-center">
        <h1 className="text-5xl font-extrabold leading-tight mb-6">
          Complete College<br />
          <span className="text-blue-300">Management Portal</span>
        </h1>
        <p className="text-xl text-blue-200 mb-10 max-w-2xl mx-auto">
          A unified platform covering every need of your educational institution — from admissions to exams, fees to library, all in one place.
        </p>
        <div className="flex justify-center gap-4">
          <Link href="/login" className="btn-primary text-base px-6 py-3">
            Get Started
          </Link>
          <a href="#features" className="btn-secondary text-base px-6 py-3 bg-white/10 border-white/20 text-white hover:bg-white/20">
            Learn More
          </a>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="mx-auto max-w-6xl px-6 pb-24">
        <h2 className="text-center text-3xl font-bold mb-12 text-white">Everything Your Institution Needs</h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {features.map((f) => (
            <div key={f.title} className="rounded-2xl border border-white/10 bg-white/5 p-6 backdrop-blur hover:bg-white/10 transition">
              <div className="w-12 h-12 rounded-xl bg-blue-500/20 flex items-center justify-center mb-4">
                <f.icon className="w-6 h-6 text-blue-300" />
              </div>
              <h3 className="font-semibold text-lg mb-2">{f.title}</h3>
              <p className="text-blue-200 text-sm leading-relaxed">{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      <footer className="text-center py-6 text-blue-300/50 text-sm">
        EduPortal. Built with Next.js, Prisma & TailwindCSS.
      </footer>
    </div>
  );
}

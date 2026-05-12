"use client";

import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { UserCheck, DollarSign, ClipboardList, BookOpen } from "lucide-react";

const tiles = [
  {
    href: "/admin/reports/attendance",
    icon: UserCheck,
    title: "Attendance Report",
    description: "Class-wise attendance trends, student-level breakdown, and CSV export.",
    color: "text-blue-500",
    bg: "hover:border-blue-200",
  },
  {
    href: "/admin/reports/fees",
    icon: DollarSign,
    title: "Fee Collection & Dues",
    description: "Monthly collection trends, outstanding dues by class, and defaulters list.",
    color: "text-green-500",
    bg: "hover:border-green-200",
  },
  {
    href: "/admin/reports/exams",
    icon: ClipboardList,
    title: "Exam Performance",
    description: "Pass/fail stats, subject averages, grade distribution, and rankings.",
    color: "text-purple-500",
    bg: "hover:border-purple-200",
  },
  {
    href: "/admin/reports/student-ledger",
    icon: BookOpen,
    title: "Student Ledger",
    description: "Complete financial, attendance, and academic history for any student.",
    color: "text-orange-500",
    bg: "hover:border-orange-200",
  },
];

export default function ReportsHubPage() {
  return (
    <div>
      <Header title="Reports" />
      <div className="p-6 space-y-6">
        <p className="text-sm text-gray-500">Select a report to view, filter, and export data.</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {tiles.map((t) => (
            <Link key={t.href} href={t.href} className={`card p-6 hover:shadow-sm transition ${t.bg} group`}>
              <t.icon className={`w-9 h-9 mb-3 ${t.color}`} />
              <h3 className="font-semibold text-gray-800 group-hover:text-gray-900 text-base">{t.title}</h3>
              <p className="text-sm text-gray-400 mt-1">{t.description}</p>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

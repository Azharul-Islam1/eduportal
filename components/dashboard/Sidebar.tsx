"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut } from "next-auth/react";
import { cn } from "@/lib/utils";
import {
  LayoutDashboard, Users, GraduationCap, BookOpen, Calendar,
  DollarSign, Library, Bell, LogOut, ChevronRight, School,
  ClipboardList, FileText, BookMarked, UserCheck,
} from "lucide-react";

type NavItem = { label: string; href: string; icon: React.ElementType };

const adminNav: NavItem[] = [
  { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
  { label: "Students", href: "/admin/students", icon: GraduationCap },
  { label: "Teachers", href: "/admin/teachers", icon: Users },
  { label: "Classes", href: "/admin/classes", icon: School },
  { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
  { label: "Exams", href: "/admin/exams", icon: ClipboardList },
  { label: "Attendance", href: "/admin/attendance", icon: UserCheck },
  { label: "Finance", href: "/admin/finance", icon: DollarSign },
  { label: "Library", href: "/admin/library", icon: Library },
  { label: "Notices", href: "/admin/notices", icon: Bell },
  { label: "Events", href: "/admin/events", icon: Calendar },
];

const teacherNav: NavItem[] = [
  { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
  { label: "Attendance", href: "/teacher/attendance", icon: UserCheck },
  { label: "Assignments", href: "/teacher/assignments", icon: FileText },
  { label: "Exams", href: "/teacher/exams", icon: ClipboardList },
];

const studentNav: NavItem[] = [
  { label: "Dashboard", href: "/student", icon: LayoutDashboard },
  { label: "Grades", href: "/student/grades", icon: BookOpen },
  { label: "Timetable", href: "/student/timetable", icon: Calendar },
  { label: "Fees", href: "/student/fees", icon: DollarSign },
  { label: "Library", href: "/student/library", icon: Library },
];

const parentNav: NavItem[] = [
  { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
];

const navMap: Record<string, NavItem[]> = {
  admin: adminNav,
  teacher: teacherNav,
  student: studentNav,
  parent: parentNav,
};

const roleColors: Record<string, string> = {
  admin: "bg-blue-600",
  teacher: "bg-green-600",
  student: "bg-purple-600",
  parent: "bg-orange-500",
};

interface SidebarProps {
  role: string;
  userName: string;
}

export default function Sidebar({ role, userName }: SidebarProps) {
  const pathname = usePathname();
  const navItems = navMap[role] ?? adminNav;
  const roleColor = roleColors[role] ?? "bg-blue-600";

  return (
    <aside className="fixed inset-y-0 left-0 z-40 w-64 flex flex-col bg-white border-r border-gray-200 shadow-sm">
      {/* Logo */}
      <div className={cn("flex items-center gap-2 px-5 py-4 border-b border-gray-200", roleColor)}>
        <GraduationCap className="w-7 h-7 text-white" />
        <span className="font-bold text-lg text-white">EduPortal</span>
      </div>

      {/* User chip */}
      <div className="px-4 py-3 border-b border-gray-100 bg-gray-50">
        <div className="flex items-center gap-3">
          <div className={cn("w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold shrink-0", roleColor)}>
            {userName.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-sm font-medium text-gray-800 truncate">{userName}</p>
            <p className="text-xs text-gray-500 capitalize">{role}</p>
          </div>
        </div>
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5">
        {navItems.map((item) => {
          const isActive = pathname === item.href || (item.href !== `/${role}` && pathname.startsWith(item.href));
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium transition-colors group",
                isActive
                  ? "bg-blue-50 text-blue-700"
                  : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
              )}
            >
              <item.icon className={cn("w-5 h-5 shrink-0", isActive ? "text-blue-600" : "text-gray-400 group-hover:text-gray-600")} />
              <span className="flex-1">{item.label}</span>
              {isActive && <ChevronRight className="w-4 h-4 text-blue-400" />}
            </Link>
          );
        })}
      </nav>

      {/* Sign out */}
      <div className="border-t border-gray-200 p-3">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex w-full items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-600 hover:bg-red-50 hover:text-red-600 transition-colors"
        >
          <LogOut className="w-5 h-5" />
          Sign Out
        </button>
      </div>
    </aside>
  );
}

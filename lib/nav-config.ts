import {
  LayoutDashboard,
  Users,
  GraduationCap,
  BookOpen,
  Calendar,
  DollarSign,
  Library,
  Bell,
  School,
  ClipboardList,
  FileText,
  UserCheck,
  Settings,
  Building2,
  ShieldCheck,
  BarChart3,
  UserPlus,
  Upload,
  CalendarDays,
  Layers,
  Receipt,
  AlertTriangle,
  Activity,
  Database,
  type LucideIcon,
} from "lucide-react";

export type NavItem = {
  label: string;
  href: string;
  icon: LucideIcon;
};

export type NavGroup = {
  title: string;
  items: NavItem[];
};

export const navConfig: Record<string, NavGroup[]> = {
  SUPER_ADMIN: [
    {
      title: "System",
      items: [
        { label: "Dashboard", href: "/superadmin", icon: LayoutDashboard },
        { label: "Schools", href: "/superadmin/schools", icon: Building2 },
        { label: "Plans", href: "/superadmin/plans", icon: DollarSign },
      ],
    },
    {
      title: "Observability",
      items: [
        { label: "Metrics", href: "/superadmin/metrics", icon: BarChart3 },
        { label: "Logs", href: "/superadmin/logs", icon: Activity },
        { label: "Backups", href: "/superadmin/backups", icon: Database },
      ],
    },
    {
      title: "Security",
      items: [
        { label: "Audit Logs", href: "/superadmin/audit", icon: ShieldCheck },
        { label: "Settings", href: "/superadmin/settings", icon: Settings },
      ],
    },
  ],

  SCHOOL_ADMIN: [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/admin", icon: LayoutDashboard },
      ],
    },
    {
      title: "Admissions",
      items: [
        { label: "Students", href: "/admin/students", icon: GraduationCap },
        { label: "New Admission", href: "/admin/admissions/new", icon: UserPlus },
        { label: "Bulk Import", href: "/admin/admissions/import", icon: Upload },
        { label: "Guardians", href: "/admin/guardians", icon: Users },
      ],
    },
    {
      title: "People",
      items: [
        { label: "Teachers", href: "/admin/teachers", icon: UserCheck },
      ],
    },
    {
      title: "Academics",
      items: [
        { label: "Classes", href: "/admin/classes", icon: School },
        { label: "Subjects", href: "/admin/subjects", icon: BookOpen },
        { label: "Assignments", href: "/admin/assignments", icon: Layers },
        { label: "Exams", href: "/admin/exams", icon: ClipboardList },
        { label: "Attendance", href: "/admin/attendance", icon: UserCheck },
        { label: "Mark Attendance", href: "/admin/attendance/mark", icon: CalendarDays },
      ],
    },
    {
      title: "Settings",
      items: [
        { label: "Academic Year", href: "/admin/settings/academic-year", icon: CalendarDays },
      ],
    },
    {
      title: "Finance",
      items: [
        { label: "Overview", href: "/admin/finance", icon: DollarSign },
        { label: "Fee Structures", href: "/admin/fees/structures", icon: ClipboardList },
        { label: "Generate Invoices", href: "/admin/fees/generate", icon: FileText },
        { label: "Record Payment", href: "/admin/fees/payments/new", icon: Receipt },
        { label: "Dues", href: "/admin/fees/dues", icon: AlertTriangle },
      ],
    },
    {
      title: "Communication",
      items: [
        { label: "Notices", href: "/admin/notices", icon: Bell },
        { label: "Events", href: "/admin/events", icon: Calendar },
        { label: "Library", href: "/admin/library", icon: Library },
      ],
    },
    {
      title: "Reports",
      items: [
        { label: "Reports", href: "/admin/reports", icon: BarChart3 },
        { label: "Attendance", href: "/admin/reports/attendance", icon: UserCheck },
        { label: "Fee Collection", href: "/admin/reports/fees", icon: DollarSign },
        { label: "Exam Performance", href: "/admin/reports/exams", icon: ClipboardList },
        { label: "Student Ledger", href: "/admin/reports/student-ledger", icon: FileText },
      ],
    },
  ],

  TEACHER: [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/teacher", icon: LayoutDashboard },
      ],
    },
    {
      title: "Classroom",
      items: [
        { label: "Attendance", href: "/teacher/attendance", icon: UserCheck },
        { label: "Assignments", href: "/teacher/assignments", icon: FileText },
        { label: "Exams", href: "/teacher/exams", icon: ClipboardList },
      ],
    },
  ],

  STUDENT: [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/student", icon: LayoutDashboard },
      ],
    },
    {
      title: "Academics",
      items: [
        { label: "Grades", href: "/student/grades", icon: BookOpen },
        { label: "Timetable", href: "/student/timetable", icon: Calendar },
        { label: "Attendance", href: "/student/attendance", icon: UserCheck },
      ],
    },
    {
      title: "Services",
      items: [
        { label: "Fees", href: "/student/fees", icon: DollarSign },
        { label: "Library", href: "/student/library", icon: Library },
      ],
    },
  ],

  PARENT: [
    {
      title: "Overview",
      items: [
        { label: "Dashboard", href: "/parent", icon: LayoutDashboard },
      ],
    },
  ],
};

// ADMIN is an alias for SCHOOL_ADMIN
navConfig.ADMIN = navConfig.SCHOOL_ADMIN;
navConfig.STAFF = navConfig.SCHOOL_ADMIN;

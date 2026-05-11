import { PrismaClient, UserRole } from "@prisma/client";
import bcrypt from "bcryptjs";

const prisma = new PrismaClient();

async function main() {
  console.log("Seeding database...");

  const hashedPassword = await bcrypt.hash("password123", 10);

  // Admin
  await prisma.user.upsert({
    where: { email: "admin@eduportal.com" },
    update: {},
    create: {
      name: "System Admin",
      email: "admin@eduportal.com",
      password: hashedPassword,
      role: UserRole.ADMIN,
      phone: "+1-555-0100",
    },
  });

  // Classes
  const classNames = ["Class 1", "Class 2", "Class 3", "Class 4", "Class 5",
    "Class 6", "Class 7", "Class 8", "Class 9", "Class 10",
    "Class 11 (Science)", "Class 11 (Commerce)", "Class 12 (Science)", "Class 12 (Commerce)"];

  for (const name of classNames) {
    await prisma.class.upsert({
      where: { name_section_academicYear: { name, section: "A", academicYear: "2025-2026" } },
      update: {},
      create: { name, section: "A", capacity: 40, academicYear: "2025-2026" },
    });
  }

  // Book Categories
  const categories = ["Mathematics", "Science", "Literature", "History", "Geography", "Computer Science", "Arts"];
  for (const name of categories) {
    await prisma.bookCategory.upsert({
      where: { name },
      update: {},
      create: { name },
    });
  }

  // Teacher
  const teacherUser = await prisma.user.upsert({
    where: { email: "teacher@eduportal.com" },
    update: {},
    create: {
      name: "Prof. Alice Johnson",
      email: "teacher@eduportal.com",
      password: hashedPassword,
      role: UserRole.TEACHER,
      phone: "+1-555-0101",
    },
  });

  await prisma.teacher.upsert({
    where: { userId: teacherUser.id },
    update: {},
    create: {
      userId: teacherUser.id,
      employeeId: "EMP001",
      department: "Science",
      qualification: "M.Sc Physics",
    },
  });

  const firstClass = await prisma.class.findFirst({ where: { name: "Class 10" } });

  // Student
  const studentUser = await prisma.user.upsert({
    where: { email: "student@eduportal.com" },
    update: {},
    create: {
      name: "Bob Smith",
      email: "student@eduportal.com",
      password: hashedPassword,
      role: UserRole.STUDENT,
      phone: "+1-555-0102",
    },
  });

  await prisma.student.upsert({
    where: { userId: studentUser.id },
    update: {},
    create: {
      userId: studentUser.id,
      studentId: "STU001",
      classId: firstClass!.id,
      rollNumber: "01",
      gender: "Male",
    },
  });

  // Parent
  const parentUser = await prisma.user.upsert({
    where: { email: "parent@eduportal.com" },
    update: {},
    create: {
      name: "Carol Smith",
      email: "parent@eduportal.com",
      password: hashedPassword,
      role: UserRole.PARENT,
      phone: "+1-555-0103",
    },
  });

  await prisma.parent.upsert({
    where: { userId: parentUser.id },
    update: {},
    create: { userId: parentUser.id },
  });

  // Subjects
  const subjectData = [
    { name: "Mathematics", code: "MATH101" },
    { name: "Physics", code: "PHY101" },
    { name: "Chemistry", code: "CHEM101" },
    { name: "English", code: "ENG101" },
    { name: "Computer Science", code: "CS101" },
    { name: "Biology", code: "BIO101" },
    { name: "History", code: "HIST101" },
    { name: "Geography", code: "GEO101" },
  ];

  for (const subj of subjectData) {
    await prisma.subject.upsert({
      where: { code: subj.code },
      update: {},
      create: subj,
    });
  }

  // Admin notice
  const admin = await prisma.user.findUnique({ where: { email: "admin@eduportal.com" } });
  await prisma.notice.create({
    data: {
      title: "Welcome to EduPortal",
      content: "Welcome to the new academic year 2025-2026! All students and staff are requested to update their profiles. Please contact the admin office for any queries.",
      publishedBy: admin!.id,
      targetRole: null,
    },
  });

  // Event
  await prisma.event.create({
    data: {
      title: "Annual Sports Day",
      description: "Join us for the Annual Sports Day celebration with various athletic events and competitions.",
      date: new Date("2026-02-15"),
      endDate: new Date("2026-02-16"),
      venue: "College Ground",
      organizer: "Sports Department",
    },
  });

  console.log("Seeding complete!");
  console.log("\nDemo accounts:");
  console.log("  Admin:   admin@eduportal.com   / password123");
  console.log("  Teacher: teacher@eduportal.com / password123");
  console.log("  Student: student@eduportal.com / password123");
  console.log("  Parent:  parent@eduportal.com  / password123");
}

main()
  .catch(console.error)
  .finally(() => prisma.$disconnect());

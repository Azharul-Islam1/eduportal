import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import LoginForm from "./LoginForm";

const ROLE_HOME: Record<string, string> = {
  SUPER_ADMIN: "/superadmin",
  SCHOOL_ADMIN: "/admin",
  ADMIN: "/admin",
  TEACHER: "/teacher",
  STAFF: "/admin",
  STUDENT: "/student",
  PARENT: "/parent",
};

export default async function LoginPage() {
  const session = await getServerSession(authOptions);
  if (session?.user) {
    redirect(ROLE_HOME[session.user.role ?? ""] ?? "/admin");
  }
  return <LoginForm />;
}

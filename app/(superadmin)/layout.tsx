import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";
import Header from "@/components/dashboard/Header";

export default async function SuperAdminLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");
  if (session.user.role !== "SUPER_ADMIN") redirect("/admin");

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role="SUPER_ADMIN" userName={session.user.name} />
      <div className="flex flex-col lg:pl-60 transition-all duration-300">
        <Header title="Super Admin" userName={session.user.name} role="SUPER_ADMIN" />
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

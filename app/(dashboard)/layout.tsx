import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const { name, role } = session.user;

  return (
    <div className="min-h-screen bg-background">
      <Sidebar role={role} userName={name} />
      <div className="flex flex-col lg:pl-60 transition-all duration-300">
        <main className="flex-1 p-4 lg:p-6">{children}</main>
      </div>
    </div>
  );
}

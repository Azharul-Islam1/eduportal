import { getServerSession } from "next-auth";
import { redirect } from "next/navigation";
import { authOptions } from "@/lib/auth";
import Sidebar from "@/components/dashboard/Sidebar";

export default async function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = await getServerSession(authOptions);
  if (!session) redirect("/login");

  const role = session.user.role.toLowerCase();

  return (
    <div className="min-h-screen bg-gray-50">
      <Sidebar role={role} userName={session.user.name} />
      <main className="ml-64 min-h-screen">
        {children}
      </main>
    </div>
  );
}

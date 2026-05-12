import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import PlansClient from "./PlansClient";

export default async function PlansPage() {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const plans = await db.plan.findMany({
    orderBy: { priceMonthly: "asc" },
    include: { _count: { select: { schools: true } } },
  });

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Plans</h1>
          <p className="text-sm text-muted-foreground">
            Manage subscription plans available to schools
          </p>
        </div>
      </div>

      <PlansClient initialPlans={plans} />
    </div>
  );
}

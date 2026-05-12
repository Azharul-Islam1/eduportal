import { getServerSession } from "next-auth";
import Link from "next/link";
import { authOptions } from "@/lib/auth";
import { db } from "@/lib/db";
import {
  Card, CardContent, CardDescription, CardHeader, CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { formatDate } from "@/lib/utils";
import {
  Building2, GraduationCap, ShieldAlert, FlaskConical, Plus, ExternalLink,
} from "lucide-react";

const STATUS_BADGE = {
  ACTIVE: "success" as const,
  TRIAL: "info" as const,
  SUSPENDED: "destructive" as const,
  INACTIVE: "secondary" as const,
};

export default async function SuperAdminDashboard() {
  const session = await getServerSession(authOptions);

  const [total, active, suspended, trial, recent] = await Promise.all([
    db.school.count(),
    db.school.count({ where: { status: "ACTIVE" } }),
    db.school.count({ where: { status: "SUSPENDED" } }),
    db.school.count({ where: { status: "TRIAL" } }),
    db.school.findMany({
      take: 10,
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true } } },
    }),
  ]);

  const stats = [
    { label: "Total Schools", value: total, icon: Building2, color: "text-blue-400" },
    { label: "Active", value: active, icon: GraduationCap, color: "text-emerald-400" },
    { label: "On Trial", value: trial, icon: FlaskConical, color: "text-amber-400" },
    { label: "Suspended", value: suspended, icon: ShieldAlert, color: "text-red-400" },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Welcome, {session?.user.name}</h1>
          <p className="text-sm text-muted-foreground">Super Admin · EduPortal Control Panel</p>
        </div>
        <Button asChild>
          <Link href="/superadmin/schools/new">
            <Plus className="h-4 w-4" />
            Onboard School
          </Link>
        </Button>
      </div>

      {/* Stats */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className={`h-5 w-5 ${s.color}`} />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      {/* Recent onboardings */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <div>
            <CardTitle>Recent Onboardings</CardTitle>
            <CardDescription>Last 10 schools added to the platform</CardDescription>
          </div>
          <Button variant="outline" size="sm" asChild>
            <Link href="/superadmin/schools">View all</Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {recent.length === 0 ? (
            <p className="px-6 py-4 text-sm text-muted-foreground">No schools yet.</p>
          ) : (
            <div className="divide-y divide-border">
              {recent.map((school) => (
                <div key={school.id} className="flex items-center justify-between px-6 py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary/10 text-sm font-bold text-primary">
                      {school.name.charAt(0)}
                    </div>
                    <div>
                      <p className="text-sm font-medium">{school.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {school.slug} · {school.plan?.name ?? "No Plan"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge variant={STATUS_BADGE[school.status]}>{school.status}</Badge>
                    <span className="hidden text-xs text-muted-foreground sm:block">
                      {formatDate(school.createdAt)}
                    </span>
                    <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                      <Link href={`/superadmin/schools/${school.id}`}>
                        <ExternalLink className="h-3.5 w-3.5" />
                      </Link>
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

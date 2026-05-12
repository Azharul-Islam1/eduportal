import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect, notFound } from "next/navigation";
import Link from "next/link";
import {
  Card, CardContent, CardHeader, CardTitle, CardDescription,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { formatDate } from "@/lib/utils";
import {
  ArrowLeft, Globe, Phone, Mail, User, Building2, Calendar,
  CheckCircle2, XCircle, Database,
} from "lucide-react";
import SchoolDetailActions from "./SchoolDetailActions";

const STATUS_BADGE = {
  ACTIVE: "success" as const,
  TRIAL: "info" as const,
  SUSPENDED: "destructive" as const,
  INACTIVE: "secondary" as const,
};

const SUB_BADGE = {
  TRIAL: "info" as const,
  ACTIVE: "success" as const,
  EXPIRED: "destructive" as const,
  CANCELLED: "secondary" as const,
};

function InfoRow({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div className="flex items-start gap-2 py-2">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function SchoolDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const { id } = await params;
  const school = await db.school.findUnique({
    where: { id },
    include: {
      plan: true,
      _count: { select: { users: true } },
    },
  });

  if (!school) notFound();

  const plans = await db.plan.findMany({
    where: { isActive: true },
    orderBy: { priceMonthly: "asc" },
    select: { id: true, name: true, priceMonthly: true },
  });

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-4">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/superadmin/schools">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div className="flex-1">
          <h1 className="text-2xl font-bold tracking-tight">{school.name}</h1>
          <p className="text-sm text-muted-foreground">
            {school.slug} · Joined {formatDate(school.createdAt)}
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Badge variant={STATUS_BADGE[school.status]}>{school.status}</Badge>
          <SchoolDetailActions
            schoolId={school.id}
            schoolName={school.name}
            status={school.status}
            currentPlanId={school.planId ?? null}
            plans={plans}
          />
        </div>
      </div>

      <div className="grid gap-6 lg:grid-cols-3">
        {/* Left column — school info */}
        <div className="space-y-6 lg:col-span-2">
          {/* Basic Info */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Building2 className="h-4 w-4" />
                School Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow label="Full Name" value={school.name} />
              <Separator />
              <InfoRow label="Slug" value={<code className="text-xs bg-muted px-1 py-0.5 rounded">{school.slug}</code>} />
              <Separator />
              <InfoRow
                label="Domain"
                value={
                  school.domain ? (
                    <span className="flex items-center gap-1.5">
                      {school.domain}
                      {school.isVerified ? (
                        <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                      ) : (
                        <XCircle className="h-3.5 w-3.5 text-muted-foreground" />
                      )}
                    </span>
                  ) : null
                }
              />
              <Separator />
              <InfoRow
                label="Address"
                value={school.address}
              />
              <Separator />
              <InfoRow
                label="Phone"
                value={
                  school.phone ? (
                    <span className="flex items-center gap-1.5">
                      <Phone className="h-3.5 w-3.5 text-muted-foreground" />
                      {school.phone}
                    </span>
                  ) : null
                }
              />
              <Separator />
              <InfoRow
                label="Email"
                value={
                  school.email ? (
                    <span className="flex items-center gap-1.5">
                      <Mail className="h-3.5 w-3.5 text-muted-foreground" />
                      {school.email}
                    </span>
                  ) : null
                }
              />
              <Separator />
              <InfoRow
                label="Principal"
                value={
                  school.principalName ? (
                    <span className="flex items-center gap-1.5">
                      <User className="h-3.5 w-3.5 text-muted-foreground" />
                      {school.principalName}
                    </span>
                  ) : null
                }
              />
            </CardContent>
          </Card>

          {/* Subscription */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <Calendar className="h-4 w-4" />
                Subscription
              </CardTitle>
            </CardHeader>
            <CardContent>
              <InfoRow
                label="Status"
                value={
                  <Badge variant={SUB_BADGE[school.subscriptionStatus]}>
                    {school.subscriptionStatus}
                  </Badge>
                }
              />
              <Separator />
              <InfoRow
                label="Start"
                value={school.subscriptionStart ? formatDate(school.subscriptionStart) : null}
              />
              <Separator />
              <InfoRow
                label="End"
                value={school.subscriptionEnd ? formatDate(school.subscriptionEnd) : null}
              />
            </CardContent>
          </Card>
        </div>

        {/* Right column — stats + plan */}
        <div className="space-y-6">
          {/* Stats */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Overview</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Total Users</span>
                <span className="text-2xl font-bold">{school._count.users}</span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Domain Verified</span>
                <span>
                  {school.isVerified ? (
                    <CheckCircle2 className="h-5 w-5 text-emerald-500" />
                  ) : (
                    <XCircle className="h-5 w-5 text-muted-foreground" />
                  )}
                </span>
              </div>
              <Separator />
              <div className="flex items-center justify-between">
                <span className="text-sm text-muted-foreground">Database</span>
                <span className="flex items-center gap-1 text-xs text-muted-foreground">
                  <Database className="h-3.5 w-3.5" />
                  {school.dbName ?? "Not provisioned"}
                </span>
              </div>
            </CardContent>
          </Card>

          {/* Plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Plan</CardTitle>
              <CardDescription>Current subscription plan</CardDescription>
            </CardHeader>
            <CardContent>
              {school.plan ? (
                <div className="space-y-3">
                  <div className="flex items-center justify-between">
                    <span className="font-semibold">{school.plan.name}</span>
                    <span className="text-sm text-muted-foreground">
                      ${school.plan.priceMonthly}/mo
                    </span>
                  </div>
                  <div className="text-sm text-muted-foreground space-y-1">
                    <p>Up to {school.plan.maxStudents} students</p>
                    <p>Up to {school.plan.maxTeachers} teachers</p>
                  </div>
                  {Array.isArray(school.plan.features) && (school.plan.features as string[]).length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {(school.plan.features as string[]).map((f) => (
                        <Badge key={f} variant="secondary" className="text-[10px]">
                          {f}
                        </Badge>
                      ))}
                    </div>
                  )}
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">No plan assigned</p>
              )}
            </CardContent>
          </Card>

          {/* Verify Token */}
          {school.verifyToken && !school.isVerified && (
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2 text-base">
                  <Globe className="h-4 w-4" />
                  DNS Verification
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground mb-2">
                  Add this TXT record to verify the domain:
                </p>
                <code className="block w-full rounded bg-muted p-2 text-xs break-all">
                  {school.verifyToken}
                </code>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}

import Link from "next/link";
import { db } from "@/lib/db";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { redirect } from "next/navigation";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { formatDate } from "@/lib/utils";
import SchoolActions from "./SchoolActions";
import SchoolFilters from "./SchoolFilters";
import { Plus } from "lucide-react";

const STATUS_BADGE = {
  ACTIVE: "success" as const,
  TRIAL: "info" as const,
  SUSPENDED: "destructive" as const,
  INACTIVE: "secondary" as const,
};

export default async function SchoolsPage({
  searchParams,
}: {
  searchParams: Promise<{ page?: string; status?: string; search?: string }>;
}) {
  const session = await getServerSession(authOptions);
  if (!session || session.user.role !== "SUPER_ADMIN") redirect("/login");

  const sp = await searchParams;
  const page = Number(sp.page ?? 1);
  const pageSize = 20;
  const skip = (page - 1) * pageSize;
  const status = (sp.status as "ACTIVE" | "TRIAL" | "SUSPENDED" | "INACTIVE") || undefined;
  const search = sp.search?.trim() || undefined;

  const where = {
    ...(status ? { status } : {}),
    ...(search
      ? { OR: [{ name: { contains: search } }, { slug: { contains: search } }, { domain: { contains: search } }] }
      : {}),
  };

  const [schools, total] = await Promise.all([
    db.school.findMany({
      where,
      skip,
      take: pageSize,
      orderBy: { createdAt: "desc" },
      include: { plan: { select: { name: true } }, _count: { select: { users: true } } },
    }),
    db.school.count({ where }),
  ]);

  const totalPages = Math.ceil(total / pageSize);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Schools</h1>
          <p className="text-sm text-muted-foreground">{total} school{total !== 1 ? "s" : ""} registered</p>
        </div>
        <Button asChild>
          <Link href="/superadmin/schools/new">
            <Plus className="h-4 w-4" />
            Onboard School
          </Link>
        </Button>
      </div>

      <SchoolFilters />

      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">All Schools</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>School</TableHead>
                <TableHead>Domain</TableHead>
                <TableHead>Plan</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Users</TableHead>
                <TableHead>Joined</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {schools.length === 0 && (
                <TableRow>
                  <TableCell colSpan={7} className="py-8 text-center text-muted-foreground">
                    No schools found
                  </TableCell>
                </TableRow>
              )}
              {schools.map((school) => (
                <TableRow key={school.id}>
                  <TableCell>
                    <div>
                      <p className="font-medium">{school.name}</p>
                      <p className="text-xs text-muted-foreground">{school.slug}</p>
                    </div>
                  </TableCell>
                  <TableCell className="text-sm text-muted-foreground">
                    {school.domain ?? "—"}
                    {school.isVerified && (
                      <Badge variant="success" className="ml-1 text-[10px]">✓</Badge>
                    )}
                  </TableCell>
                  <TableCell className="text-sm">{school.plan?.name ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={STATUS_BADGE[school.status]}>{school.status}</Badge>
                  </TableCell>
                  <TableCell className="text-sm">{school._count.users}</TableCell>
                  <TableCell className="text-sm text-muted-foreground">{formatDate(school.createdAt)}</TableCell>
                  <TableCell className="text-right">
                    <SchoolActions schoolId={school.id} status={school.status} schoolName={school.name} />
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Page {page} of {totalPages} · {total} results
          </span>
          <div className="flex gap-2">
            {page > 1 && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`?page=${page - 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}>
                  Previous
                </Link>
              </Button>
            )}
            {page < totalPages && (
              <Button variant="outline" size="sm" asChild>
                <Link href={`?page=${page + 1}${status ? `&status=${status}` : ""}${search ? `&search=${search}` : ""}`}>
                  Next
                </Link>
              </Button>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

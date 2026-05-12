import { notFound } from "next/navigation";
import Link from "next/link";
import { ArrowLeft, User } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import GuardianEditDialog from "./GuardianEditDialog";

interface Guardian {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  address: string | null;
  students: Array<{
    student: {
      id: string;
      studentId: string;
      user: { name: string };
      class: { name: string; section: string };
    };
  }>;
}

async function getGuardian(id: string): Promise<Guardian | null> {
  const baseUrl = process.env.NEXTAUTH_URL ?? "http://localhost:3000";
  const res = await fetch(`${baseUrl}/api/guardians/${id}`, { cache: "no-store" });
  if (!res.ok) return null;
  return res.json();
}

function relationVariant(relation: string): "info" | "warning" | "secondary" {
  if (relation === "FATHER") return "info";
  if (relation === "MOTHER") return "warning";
  return "secondary";
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div className="flex flex-col gap-0.5 py-2 sm:flex-row sm:items-center">
      <span className="w-36 shrink-0 text-sm text-muted-foreground">{label}</span>
      <span className="text-sm font-medium">{value ?? "—"}</span>
    </div>
  );
}

export default async function GuardianDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const guardian = await getGuardian(id);
  if (!guardian) notFound();

  return (
    <div className="space-y-6 max-w-3xl">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <Button variant="ghost" size="icon" asChild>
            <Link href="/admin/guardians">
              <ArrowLeft className="h-4 w-4" />
            </Link>
          </Button>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-semibold">{guardian.name}</h1>
              <Badge variant={relationVariant(guardian.relation)}>{guardian.relation}</Badge>
            </div>
            <p className="text-sm text-muted-foreground mt-0.5">{guardian.phone}</p>
          </div>
        </div>
        <GuardianEditDialog guardian={guardian} />
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Profile</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="divide-y divide-border">
            <InfoRow label="Full Name" value={guardian.name} />
            <InfoRow label="Relation" value={guardian.relation} />
            <InfoRow label="Phone" value={guardian.phone} />
            <InfoRow label="Email" value={guardian.email} />
            <InfoRow label="Occupation" value={guardian.occupation} />
            <InfoRow label="Address" value={guardian.address} />
          </div>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">
            Linked Students ({guardian.students.length})
          </CardTitle>
        </CardHeader>
        <CardContent>
          {guardian.students.length === 0 ? (
            <p className="text-sm text-muted-foreground py-4 text-center">
              No students linked to this guardian.
            </p>
          ) : (
            <div className="divide-y divide-border">
              {guardian.students.map((gs) => (
                <div key={gs.student.id} className="flex items-center justify-between py-3">
                  <div className="flex items-center gap-3">
                    <div className="flex h-9 w-9 items-center justify-center rounded-full bg-muted">
                      <User className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div>
                      <p className="text-sm font-medium">{gs.student.user.name}</p>
                      <p className="text-xs text-muted-foreground">
                        {gs.student.class.name} {gs.student.class.section} •{" "}
                        <span className="font-mono">{gs.student.studentId}</span>
                      </p>
                    </div>
                  </div>
                  <Button variant="ghost" size="sm" asChild>
                    <Link href={`/admin/students/${gs.student.id}`}>View</Link>
                  </Button>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

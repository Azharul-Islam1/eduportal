"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";

interface Enrollment {
  id: string;
  classId: string;
  academicYear: string;
  rollNumber: string | null;
  status: string;
  createdAt: Date | string;
  class: { name: string; section: string };
}

interface ClassOption {
  id: string;
  name: string;
  section: string;
}

export default function EnrollmentForm({
  studentId,
  enrollments,
}: {
  studentId: string;
  enrollments: Enrollment[];
}) {
  const router = useRouter();
  const [classes, setClasses] = useState<ClassOption[]>([]);
  const [classId, setClassId] = useState("");
  const [rollNumber, setRollNumber] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch("/api/classes")
      .then((r) => r.json())
      .then((data) => setClasses(Array.isArray(data) ? data : data.classes ?? []));
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!classId) { setError("Please select a class."); return; }
    setSaving(true);
    setError("");
    const res = await fetch("/api/enrollments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ studentId, classId, rollNumber, academicYear }),
    });
    if (res.ok) {
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to change class.");
    }
    setSaving(false);
  }

  function statusVariant(s: string) {
    if (s === "ACTIVE") return "success";
    if (s === "COMPLETED") return "secondary";
    if (s === "TRANSFERRED") return "warning";
    return "outline";
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Enrollment History</CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Class</TableHead>
                <TableHead>Academic Year</TableHead>
                <TableHead>Roll No</TableHead>
                <TableHead>Status</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {enrollments.length === 0 && (
                <TableRow>
                  <TableCell colSpan={4} className="py-8 text-center text-muted-foreground">
                    No enrollment history.
                  </TableCell>
                </TableRow>
              )}
              {enrollments.map((e) => (
                <TableRow key={e.id}>
                  <TableCell>
                    {e.class.name} {e.class.section}
                  </TableCell>
                  <TableCell>{e.academicYear}</TableCell>
                  <TableCell>{e.rollNumber ?? "—"}</TableCell>
                  <TableCell>
                    <Badge variant={statusVariant(e.status) as "success" | "secondary" | "warning" | "outline"}>
                      {e.status}
                    </Badge>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Change Class</CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-4">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
              <div>
                <p className="text-sm font-medium mb-1.5">Class</p>
                <Select value={classId} onValueChange={setClassId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select class" />
                  </SelectTrigger>
                  <SelectContent>
                    {classes.map((c) => (
                      <SelectItem key={c.id} value={c.id}>
                        {c.name} {c.section}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Roll Number</p>
                <Input
                  value={rollNumber}
                  onChange={(e) => setRollNumber(e.target.value)}
                  placeholder="Optional"
                />
              </div>
              <div>
                <p className="text-sm font-medium mb-1.5">Academic Year</p>
                <Input
                  value={academicYear}
                  onChange={(e) => setAcademicYear(e.target.value)}
                  placeholder="e.g. 2025-2026"
                />
              </div>
            </div>
            {error && <p className="text-sm text-destructive">{error}</p>}
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Change Class
            </Button>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}

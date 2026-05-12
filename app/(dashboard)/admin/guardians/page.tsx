"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { Search, Loader2 } from "lucide-react";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";

interface Guardian {
  id: string;
  name: string;
  relation: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  _count?: { students: number };
  students?: Array<{ student: { user: { name: string } } }>;
}

function relationVariant(relation: string): "info" | "warning" | "secondary" {
  if (relation === "FATHER") return "info";
  if (relation === "MOTHER") return "warning";
  return "secondary";
}

export default function GuardiansPage() {
  const router = useRouter();
  const [guardians, setGuardians] = useState<Guardian[]>([]);
  const [total, setTotal] = useState(0);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(true);
  const debounceRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchGuardians = useCallback(async () => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    const res = await fetch(`/api/guardians?${params}`);
    const data = await res.json();
    setGuardians(data.guardians ?? data ?? []);
    setTotal(data.total ?? (data.guardians ?? data ?? []).length);
    setLoading(false);
  }, [search]);

  useEffect(() => {
    if (debounceRef.current) clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(fetchGuardians, 300);
    return () => { if (debounceRef.current) clearTimeout(debounceRef.current); };
  }, [fetchGuardians]);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Guardians</h1>
        <p className="text-sm text-muted-foreground">{total} guardians registered</p>
      </div>

      <Card>
        <CardHeader className="pb-3">
          <div className="relative max-w-sm">
            <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              placeholder="Search by name or phone..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead>
                <TableHead>Relation</TableHead>
                <TableHead>Phone</TableHead>
                <TableHead>Email</TableHead>
                <TableHead>Students</TableHead>
                <TableHead className="w-20">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {loading && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center">
                    <Loader2 className="mx-auto h-5 w-5 animate-spin text-muted-foreground" />
                  </TableCell>
                </TableRow>
              )}
              {!loading && guardians.length === 0 && (
                <TableRow>
                  <TableCell colSpan={6} className="py-12 text-center text-muted-foreground">
                    No guardians found.
                  </TableCell>
                </TableRow>
              )}
              {!loading &&
                guardians.map((g) => (
                  <TableRow
                    key={g.id}
                    className="cursor-pointer"
                    onClick={() => router.push(`/admin/guardians/${g.id}`)}
                  >
                    <TableCell className="font-medium">{g.name}</TableCell>
                    <TableCell>
                      <Badge variant={relationVariant(g.relation)}>{g.relation}</Badge>
                    </TableCell>
                    <TableCell>{g.phone}</TableCell>
                    <TableCell className="text-muted-foreground text-sm">
                      {g.email ?? "—"}
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">
                        {g._count?.students ?? g.students?.length ?? 0}
                      </Badge>
                    </TableCell>
                    <TableCell>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={(e) => {
                          e.stopPropagation();
                          router.push(`/admin/guardians/${g.id}`);
                        }}
                      >
                        View
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}

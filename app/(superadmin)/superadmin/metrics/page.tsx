"use client";

import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Building2, GraduationCap, Users, AlertTriangle, Activity, Clock } from "lucide-react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer,
  PieChart, Pie, Cell, Legend, CartesianGrid,
} from "recharts";

interface Metrics {
  counts: {
    totalSchools: number;
    activeSchools: number;
    trialSchools: number;
    suspendedSchools: number;
    totalStudents: number;
    totalTeachers: number;
  };
  errors24h: number;
  avgResponseMs: number;
  totalApiCalls24h: number;
  recentErrors: { id: string; message: string; path: string | null; createdAt: string }[];
  schoolChart: { month: string; schools: number }[];
  statusChart: { status: string; count: number; color: string }[];
}

export default function MetricsPage() {
  const [data, setData] = useState<Metrics | null>(null);
  const [loading, setLoading] = useState(true);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    fetch("/api/superadmin/metrics")
      .then((r) => r.json())
      .then(setData)
      .finally(() => setLoading(false));
  }, []);

  if (loading || !data) return (
    <div className="space-y-4">
      <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
      <p className="text-muted-foreground">Loading…</p>
    </div>
  );

  const statCards = [
    { label: "Total Schools", value: data.counts.totalSchools, icon: Building2 },
    { label: "Active Schools", value: data.counts.activeSchools, icon: Building2 },
    { label: "Total Students", value: data.counts.totalStudents, icon: GraduationCap },
    { label: "Teachers", value: data.counts.totalTeachers, icon: Users },
    { label: "Errors (24h)", value: data.errors24h, icon: AlertTriangle },
    { label: "API Calls (24h)", value: data.totalApiCalls24h, icon: Activity },
    { label: "Avg Response", value: `${data.avgResponseMs}ms`, icon: Clock },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Metrics</h1>
        <p className="text-sm text-muted-foreground">Platform-wide performance and usage overview</p>
      </div>

      {/* Stat Cards */}
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {statCards.map((s) => (
          <Card key={s.label}>
            <CardHeader className="flex flex-row items-center justify-between pb-2">
              <CardTitle className="text-sm font-medium text-muted-foreground">{s.label}</CardTitle>
              <s.icon className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-3xl font-bold">{s.value}</div>
            </CardContent>
          </Card>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Monthly School Registrations */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">New Schools (Last 6 Months)</CardTitle>
          </CardHeader>
          <CardContent>
            {mounted && (
              <ResponsiveContainer width="100%" height={220}>
                <BarChart data={data.schoolChart} margin={{ top: 4, right: 8, left: -16, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} />
                  <XAxis dataKey="month" tick={{ fontSize: 12 }} />
                  <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                  <Tooltip />
                  <Bar dataKey="schools" fill="hsl(var(--primary))" radius={[4, 4, 0, 0]} name="Schools" />
                </BarChart>
              </ResponsiveContainer>
            )}
          </CardContent>
        </Card>

        {/* Status Pie */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base">School Status Breakdown</CardTitle>
          </CardHeader>
          <CardContent>
            {mounted && data.statusChart.length > 0 ? (
              <ResponsiveContainer width="100%" height={220}>
                <PieChart>
                  <Pie data={data.statusChart} dataKey="count" nameKey="status" cx="50%" cy="50%" outerRadius={80}>
                    {data.statusChart.map((entry, i) => (
                      <Cell key={i} fill={entry.color} />
                    ))}
                  </Pie>
                  <Legend />
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-[220px] flex items-center justify-center text-muted-foreground text-sm">No schools yet</div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Errors */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base">Recent Errors</CardTitle>
        </CardHeader>
        <CardContent>
          {data.recentErrors.length === 0 ? (
            <p className="text-sm text-green-600">✓ No errors logged.</p>
          ) : (
            <div className="space-y-3">
              {data.recentErrors.map((e) => (
                <div key={e.id} className="flex items-start justify-between gap-4 p-3 rounded-lg bg-destructive/5 border border-destructive/20">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-destructive truncate">{e.message}</p>
                    <p className="text-xs text-muted-foreground mt-0.5">{e.path ?? "unknown path"}</p>
                  </div>
                  <p className="text-xs text-muted-foreground whitespace-nowrap">{new Date(e.createdAt).toLocaleString()}</p>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

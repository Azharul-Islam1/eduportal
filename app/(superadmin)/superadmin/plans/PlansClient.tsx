"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  Table, TableBody, TableCell, TableHead, TableHeader, TableRow,
} from "@/components/ui/table";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Plus, Pencil, Trash2, Loader2, Check } from "lucide-react";

const planSchema = z.object({
  name: z.string().min(2, "Name required"),
  maxStudents: z.coerce.number().int().min(1),
  maxTeachers: z.coerce.number().int().min(1),
  priceMonthly: z.coerce.number().min(0),
  priceYearly: z.coerce.number().min(0),
  featuresRaw: z.string(),
  isActive: z.boolean(),
});

type PlanForm = z.infer<typeof planSchema>;

interface Plan {
  id: string;
  name: string;
  maxStudents: number;
  maxTeachers: number;
  priceMonthly: number;
  priceYearly: number;
  features: unknown;
  isActive: boolean;
  createdAt: Date | string;
  _count: { schools: number };
}

function featuresToString(features: unknown): string {
  if (Array.isArray(features)) return features.join(", ");
  return "";
}

export default function PlansClient({ initialPlans }: { initialPlans: Plan[] }) {
  const router = useRouter();
  const [plans, setPlans] = useState<Plan[]>(initialPlans);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);
  const [deleteTarget, setDeleteTarget] = useState<Plan | null>(null);
  const [deleteError, setDeleteError] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const form = useForm<PlanForm>({
    resolver: zodResolver(planSchema),
    defaultValues: {
      name: "",
      maxStudents: 100,
      maxTeachers: 20,
      priceMonthly: 0,
      priceYearly: 0,
      featuresRaw: "",
      isActive: true,
    },
  });

  const openCreate = () => {
    setEditingPlan(null);
    form.reset({
      name: "", maxStudents: 100, maxTeachers: 20,
      priceMonthly: 0, priceYearly: 0, featuresRaw: "", isActive: true,
    });
    setDialogOpen(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    form.reset({
      name: plan.name,
      maxStudents: plan.maxStudents,
      maxTeachers: plan.maxTeachers,
      priceMonthly: plan.priceMonthly,
      priceYearly: plan.priceYearly,
      featuresRaw: featuresToString(plan.features),
      isActive: plan.isActive,
    });
    setDialogOpen(true);
  };

  const onSubmit = async (values: PlanForm) => {
    setSaving(true);
    const features = values.featuresRaw
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    const body = { ...values, features, featuresRaw: undefined };
    const url = editingPlan
      ? `/api/superadmin/plans/${editingPlan.id}`
      : "/api/superadmin/plans";
    const method = editingPlan ? "PATCH" : "POST";

    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(body),
    });
    setSaving(false);

    if (res.ok) {
      setDialogOpen(false);
      router.refresh();
      // Re-fetch plans
      const updated = await fetch("/api/superadmin/plans").then((r) => r.json());
      setPlans(updated);
    }
  };

  const handleDelete = async () => {
    if (!deleteTarget) return;
    setDeleting(true);
    setDeleteError("");
    const res = await fetch(`/api/superadmin/plans/${deleteTarget.id}`, { method: "DELETE" });
    if (!res.ok) {
      const data = await res.json();
      setDeleteError(data.error ?? "Delete failed");
      setDeleting(false);
      return;
    }
    setDeleting(false);
    setDeleteTarget(null);
    router.refresh();
    const updated = await fetch("/api/superadmin/plans").then((r) => r.json());
    setPlans(updated);
  };

  return (
    <>
      <div className="flex justify-end">
        <Button onClick={openCreate}>
          <Plus className="mr-2 h-4 w-4" />
          New Plan
        </Button>
      </div>

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {plans.map((plan) => (
          <Card key={plan.id} className={plan.isActive ? "" : "opacity-60"}>
            <CardHeader className="pb-3">
              <div className="flex items-start justify-between">
                <div>
                  <CardTitle className="text-base">{plan.name}</CardTitle>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    {plan._count.schools} school{plan._count.schools !== 1 ? "s" : ""}
                  </p>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => openEdit(plan)}>
                    <Pencil className="h-3.5 w-3.5" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-7 w-7 text-destructive hover:text-destructive"
                    onClick={() => { setDeleteTarget(plan); setDeleteError(""); }}
                  >
                    <Trash2 className="h-3.5 w-3.5" />
                  </Button>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="flex items-baseline gap-1">
                <span className="text-2xl font-bold">${plan.priceMonthly}</span>
                <span className="text-sm text-muted-foreground">/mo</span>
                {plan.priceYearly > 0 && (
                  <span className="ml-2 text-xs text-muted-foreground">
                    ${plan.priceYearly}/yr
                  </span>
                )}
              </div>
              <div className="text-sm text-muted-foreground space-y-1">
                <p>Up to {plan.maxStudents} students</p>
                <p>Up to {plan.maxTeachers} teachers</p>
              </div>
              {Array.isArray(plan.features) && (plan.features as string[]).length > 0 && (
                <div className="space-y-1 pt-1 border-t">
                  {(plan.features as string[]).map((f) => (
                    <div key={f} className="flex items-center gap-1.5 text-xs">
                      <Check className="h-3 w-3 text-emerald-500 shrink-0" />
                      {f}
                    </div>
                  ))}
                </div>
              )}
              {!plan.isActive && (
                <Badge variant="secondary" className="text-xs">Inactive</Badge>
              )}
            </CardContent>
          </Card>
        ))}

        {plans.length === 0 && (
          <p className="col-span-3 py-8 text-center text-sm text-muted-foreground">
            No plans yet. Create one to get started.
          </p>
        )}
      </div>

      {/* Create / Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>{editingPlan ? "Edit Plan" : "Create Plan"}</DialogTitle>
            <DialogDescription>
              {editingPlan ? "Update the plan details below." : "Fill in the details for the new plan."}
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="space-y-1">
              <Label htmlFor="plan-name">Name</Label>
              <Input id="plan-name" {...form.register("name")} placeholder="e.g. Professional" />
              {form.formState.errors.name && (
                <p className="text-xs text-destructive">{form.formState.errors.name.message}</p>
              )}
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Max Students</Label>
                <Input type="number" {...form.register("maxStudents")} />
              </div>
              <div className="space-y-1">
                <Label>Max Teachers</Label>
                <Input type="number" {...form.register("maxTeachers")} />
              </div>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1">
                <Label>Price / Month ($)</Label>
                <Input type="number" step="0.01" {...form.register("priceMonthly")} />
              </div>
              <div className="space-y-1">
                <Label>Price / Year ($)</Label>
                <Input type="number" step="0.01" {...form.register("priceYearly")} />
              </div>
            </div>

            <div className="space-y-1">
              <Label htmlFor="features">Features (comma-separated)</Label>
              <Input
                id="features"
                {...form.register("featuresRaw")}
                placeholder="Attendance, Fees, Reports"
              />
            </div>

            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                className="h-4 w-4 rounded border-input"
                {...form.register("isActive")}
              />
              <Label htmlFor="isActive" className="cursor-pointer">Active (visible to schools)</Label>
            </div>

            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setDialogOpen(false)} disabled={saving}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving}>
                {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                {editingPlan ? "Save Changes" : "Create Plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={!!deleteTarget} onOpenChange={(o) => !o && setDeleteTarget(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete &ldquo;{deleteTarget?.name}&rdquo;?</AlertDialogTitle>
            <AlertDialogDescription>
              {deleteTarget?._count.schools === 0
                ? "This plan has no schools. It will be permanently deleted."
                : `${deleteTarget?._count.schools} school(s) are on this plan. You must reassign them first.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          {deleteError && (
            <p className="text-sm text-destructive px-1">{deleteError}</p>
          )}
          <AlertDialogFooter>
            <AlertDialogCancel disabled={deleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              disabled={deleting || (deleteTarget?._count.schools ?? 0) > 0}
              className="bg-destructive hover:bg-destructive/90"
            >
              {deleting && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}

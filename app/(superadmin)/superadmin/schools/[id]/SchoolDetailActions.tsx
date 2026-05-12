"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MoreHorizontal, ShieldOff, ShieldCheck, CreditCard, Loader2 } from "lucide-react";

interface Plan {
  id: string;
  name: string;
  priceMonthly: number;
}

interface Props {
  schoolId: string;
  schoolName: string;
  status: string;
  currentPlanId: string | null;
  plans: Plan[];
}

export default function SchoolDetailActions({
  schoolId, schoolName, status, currentPlanId, plans,
}: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [planOpen, setPlanOpen] = useState(false);
  const [action, setAction] = useState<"suspend" | "activate">("suspend");
  const [selectedPlan, setSelectedPlan] = useState(currentPlanId ?? "");
  const [loading, setLoading] = useState(false);

  const handleStatusChange = async () => {
    setLoading(true);
    await fetch(`/api/superadmin/schools/${schoolId}/status`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ action }),
    });
    setLoading(false);
    setConfirmOpen(false);
    router.refresh();
  };

  const handlePlanSave = async () => {
    setLoading(true);
    await fetch(`/api/superadmin/schools/${schoolId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ planId: selectedPlan || null }),
    });
    setLoading(false);
    setPlanOpen(false);
    router.refresh();
  };

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="outline" size="sm">
            <MoreHorizontal className="mr-2 h-4 w-4" />
            Actions
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onClick={() => setPlanOpen(true)}>
            <CreditCard className="mr-2 h-4 w-4" />
            Assign Plan
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status !== "SUSPENDED" ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => { setAction("suspend"); setConfirmOpen(true); }}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Suspend School
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => { setAction("activate"); setConfirmOpen(true); }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Activate School
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

      {/* Suspend / Activate confirmation */}
      <AlertDialog open={confirmOpen} onOpenChange={setConfirmOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {action === "suspend" ? "Suspend school?" : "Activate school?"}
            </AlertDialogTitle>
            <AlertDialogDescription>
              {action === "suspend"
                ? `${schoolName} will be suspended. All users will lose access immediately.`
                : `${schoolName} will be reactivated. Users will regain access.`}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={loading}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleStatusChange}
              disabled={loading}
              className={action === "suspend" ? "bg-destructive hover:bg-destructive/90" : ""}
            >
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              {action === "suspend" ? "Suspend" : "Activate"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Assign Plan dialog */}
      <Dialog open={planOpen} onOpenChange={setPlanOpen}>
        <DialogContent className="sm:max-w-sm">
          <DialogHeader>
            <DialogTitle>Assign Plan</DialogTitle>
          </DialogHeader>
          <div className="space-y-3 py-2">
            <Label htmlFor="plan-select">Select a plan</Label>
            <Select value={selectedPlan} onValueChange={setSelectedPlan}>
              <SelectTrigger id="plan-select">
                <SelectValue placeholder="No plan" />
              </SelectTrigger>
              <SelectContent>
                {plans.map((p) => (
                  <SelectItem key={p.id} value={p.id}>
                    {p.name} · ${p.priceMonthly}/mo
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setPlanOpen(false)} disabled={loading}>
              Cancel
            </Button>
            <Button onClick={handlePlanSave} disabled={loading}>
              {loading && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}

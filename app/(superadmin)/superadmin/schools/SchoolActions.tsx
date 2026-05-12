"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  DropdownMenu, DropdownMenuContent, DropdownMenuItem,
  DropdownMenuSeparator, DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import { MoreHorizontal, Eye, ShieldOff, ShieldCheck, Loader2 } from "lucide-react";

interface Props {
  schoolId: string;
  status: string;
  schoolName: string;
}

export default function SchoolActions({ schoolId, status, schoolName }: Props) {
  const router = useRouter();
  const [confirmOpen, setConfirmOpen] = useState(false);
  const [action, setAction] = useState<"suspend" | "activate">("suspend");
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

  return (
    <>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <Button variant="ghost" size="icon" className="h-8 w-8">
            <MoreHorizontal className="h-4 w-4" />
          </Button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem asChild>
            <Link href={`/superadmin/schools/${schoolId}`}>
              <Eye className="mr-2 h-4 w-4" />
              View details
            </Link>
          </DropdownMenuItem>
          <DropdownMenuSeparator />
          {status !== "SUSPENDED" ? (
            <DropdownMenuItem
              className="text-destructive focus:text-destructive"
              onClick={() => { setAction("suspend"); setConfirmOpen(true); }}
            >
              <ShieldOff className="mr-2 h-4 w-4" />
              Suspend
            </DropdownMenuItem>
          ) : (
            <DropdownMenuItem
              onClick={() => { setAction("activate"); setConfirmOpen(true); }}
            >
              <ShieldCheck className="mr-2 h-4 w-4" />
              Activate
            </DropdownMenuItem>
          )}
        </DropdownMenuContent>
      </DropdownMenu>

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
    </>
  );
}

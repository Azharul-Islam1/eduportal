"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Pencil, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog";
import { Textarea } from "@/components/ui/textarea";

interface Guardian {
  id: string;
  name: string;
  phone: string;
  email: string | null;
  occupation: string | null;
  address: string | null;
}

export default function GuardianEditDialog({ guardian }: { guardian: Guardian }) {
  const router = useRouter();
  const [open, setOpen] = useState(false);
  const [form, setForm] = useState({
    name: guardian.name,
    phone: guardian.phone,
    email: guardian.email ?? "",
    occupation: guardian.occupation ?? "",
    address: guardian.address ?? "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  function handleChange(key: keyof typeof form) {
    return (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm((prev) => ({ ...prev, [key]: e.target.value }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setSaving(true);
    setError("");
    const payload = {
      name: form.name.trim(),
      phone: form.phone.trim(),
      email: form.email.trim() || null,
      occupation: form.occupation.trim() || null,
      address: form.address.trim() || null,
    };
    const res = await fetch(`/api/guardians/${guardian.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });
    if (res.ok) {
      setOpen(false);
      router.refresh();
    } else {
      const d = await res.json().catch(() => ({}));
      setError(d.error ?? "Failed to update guardian.");
    }
    setSaving(false);
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Pencil className="mr-2 h-4 w-4" />
          Edit
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Guardian</DialogTitle>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <div className="space-y-1.5">
              <Label htmlFor="g-name">Full Name *</Label>
              <Input
                id="g-name"
                value={form.name}
                onChange={handleChange("name")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-phone">Phone *</Label>
              <Input
                id="g-phone"
                value={form.phone}
                onChange={handleChange("phone")}
                required
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-email">Email</Label>
              <Input
                id="g-email"
                type="email"
                value={form.email}
                onChange={handleChange("email")}
              />
            </div>
            <div className="space-y-1.5">
              <Label htmlFor="g-occupation">Occupation</Label>
              <Input
                id="g-occupation"
                value={form.occupation}
                onChange={handleChange("occupation")}
              />
            </div>
          </div>
          <div className="space-y-1.5">
            <Label htmlFor="g-address">Address</Label>
            <Textarea
              id="g-address"
              value={form.address}
              onChange={handleChange("address")}
              rows={2}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              disabled={saving}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={saving}>
              {saving && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Save Changes
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

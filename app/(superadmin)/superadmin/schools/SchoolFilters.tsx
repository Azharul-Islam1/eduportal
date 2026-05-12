"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

export default function SchoolFilters() {
  const router = useRouter();
  const params = useSearchParams();

  const update = useCallback(
    (key: string, value: string) => {
      const sp = new URLSearchParams(params.toString());
      if (value) sp.set(key, value);
      else sp.delete(key);
      sp.delete("page");
      router.push(`?${sp.toString()}`);
    },
    [params, router]
  );

  return (
    <div className="flex flex-col gap-3 sm:flex-row">
      <Input
        placeholder="Search by name, slug or domain…"
        defaultValue={params.get("search") ?? ""}
        onChange={(e) => update("search", e.target.value)}
        className="sm:max-w-xs"
      />
      <Select
        defaultValue={params.get("status") ?? ""}
        onValueChange={(v) => update("status", v === "ALL" ? "" : v)}
      >
        <SelectTrigger className="sm:w-40">
          <SelectValue placeholder="All statuses" />
        </SelectTrigger>
        <SelectContent>
          <SelectItem value="ALL">All statuses</SelectItem>
          <SelectItem value="ACTIVE">Active</SelectItem>
          <SelectItem value="TRIAL">Trial</SelectItem>
          <SelectItem value="SUSPENDED">Suspended</SelectItem>
          <SelectItem value="INACTIVE">Inactive</SelectItem>
        </SelectContent>
      </Select>
    </div>
  );
}

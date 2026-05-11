"use client";

import { Bell, Search } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface HeaderProps {
  title: string;
}

export default function Header({ title }: HeaderProps) {
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-between border-b border-gray-200 bg-white px-6 shadow-sm">
      <h1 className="text-lg font-semibold text-gray-900">{title}</h1>
      <div className="flex items-center gap-3">
        <div className="hidden sm:flex items-center gap-2 rounded-lg border border-gray-200 bg-gray-50 px-3 py-1.5 text-sm text-gray-500">
          <Search className="w-4 h-4" />
          <span>Search...</span>
        </div>
        <button className="relative p-2 rounded-lg hover:bg-gray-100 transition">
          <Bell className="w-5 h-5 text-gray-500" />
          <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-red-500" />
        </button>
        <span className="hidden md:block text-xs text-gray-400">{formatDate(new Date())}</span>
      </div>
    </header>
  );
}

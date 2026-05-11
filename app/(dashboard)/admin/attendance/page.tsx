"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Search, Loader2 } from "lucide-react";
import { formatDate } from "@/lib/utils";

interface AttendanceRecord {
  id: string; date: string; status: string; remarks: string | null;
  student: { user: { name: string }; studentId?: string };
}

export default function AttendancePage() {
  const [records, setRecords] = useState<AttendanceRecord[]>([]);
  const [loading, setLoading] = useState(false);
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchRecords = async () => {
    setLoading(true);
    const res = await fetch(`/api/attendance?date=${date}`);
    setRecords(await res.json());
    setLoading(false);
  };

  useEffect(() => { fetchRecords(); }, [date]);

  const statusColor: Record<string, string> = {
    PRESENT: "bg-green-100 text-green-700",
    ABSENT: "bg-red-100 text-red-600",
    LATE: "bg-yellow-100 text-yellow-700",
    EXCUSED: "bg-blue-100 text-blue-700",
  };

  const counts = records.reduce((acc, r) => { acc[r.status] = (acc[r.status] ?? 0) + 1; return acc; }, {} as Record<string, number>);

  return (
    <div>
      <Header title="Attendance" />
      <div className="p-6 space-y-5">
        <div className="flex flex-wrap gap-3 items-center">
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input w-44" />
          <div className="flex gap-2">
            {Object.entries(counts).map(([status, count]) => (
              <span key={status} className={`badge ${statusColor[status] ?? "bg-gray-100 text-gray-600"}`}>{status}: {count}</span>
            ))}
          </div>
        </div>

        <div className="card overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>{["Student", "Date", "Status", "Remarks"].map((h) => <th key={h} className="px-4 py-3 text-left font-medium">{h}</th>)}</tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {loading && <tr><td colSpan={4} className="py-8 text-center"><Loader2 className="w-5 h-5 animate-spin inline text-gray-400" /></td></tr>}
                {!loading && records.length === 0 && <tr><td colSpan={4} className="py-8 text-center text-gray-400">No attendance records for this date.</td></tr>}
                {records.map((r) => (
                  <tr key={r.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{r.student.user.name}</td>
                    <td className="px-4 py-3 text-gray-600">{formatDate(r.date)}</td>
                    <td className="px-4 py-3"><span className={`badge ${statusColor[r.status] ?? "bg-gray-100"}`}>{r.status}</span></td>
                    <td className="px-4 py-3 text-gray-500">{r.remarks ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}

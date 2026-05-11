"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, Save } from "lucide-react";

interface Student { id: string; studentId: string; user: { name: string }; rollNumber: string | null }
interface ClassOption { id: string; name: string; section: string }

type AttendanceStatus = "PRESENT" | "ABSENT" | "LATE" | "EXCUSED";

export default function TeacherAttendancePage() {
  const [assignedClasses, setAssignedClasses] = useState<ClassOption[]>([]);
  const [students, setStudents] = useState<Student[]>([]);
  const [selectedClass, setSelectedClass] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceStatus>>({});
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  // Fetch teacher's assigned classes
  useEffect(() => {
    fetch("/api/teachers?current=true")
      .then((r) => r.json())
      .then((data) => {
        if (data.assignedClasses && Array.isArray(data.assignedClasses)) {
          setAssignedClasses(data.assignedClasses);
          if (data.assignedClasses.length > 0) {
            setSelectedClass(data.assignedClasses[0].id);
          }
        }
      })
      .catch((err) => {
        setError("Failed to load assigned classes");
        console.error(err);
      });
  }, []);

  // Fetch students for selected class
  useEffect(() => {
    if (!selectedClass) return;
    setLoading(true);
    setError("");
    fetch(`/api/students?classId=${selectedClass}&limit=100`)
      .then((r) => r.json())
      .then((data) => {
        if (data.students) {
          setStudents(data.students);
          const initial: Record<string, AttendanceStatus> = {};
          data.students.forEach((s: Student) => {
            initial[s.id] = "PRESENT";
          });
          setAttendance(initial);
        } else {
          setStudents([]);
          setAttendance({});
        }
        setLoading(false);
      })
      .catch((err) => {
        setError("Failed to load students");
        setStudents([]);
        setLoading(false);
        console.error(err);
      });
  }, [selectedClass]);

  const setAll = (status: AttendanceStatus) => {
    setAttendance(Object.fromEntries(students.map((s) => [s.id, status])));
  };

  async function handleSave() {
    if (!selectedClass) {
      setError("Please select a class first");
      return;
    }
    setSaving(true);
    setError("");
    const records = students.map((s) => ({ studentId: s.id, status: attendance[s.id] ?? "PRESENT" }));
    try {
      const res = await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ records, date, classId: selectedClass }),
      });
      if (!res.ok) {
        const err = await res.json();
        setError(err.error || "Failed to save attendance");
      } else {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
      }
    } catch (err) {
      setError("Error saving attendance");
      console.error(err);
    }
    setSaving(false);
  }

  const statusColors: Record<AttendanceStatus, string> = {
    PRESENT: "bg-green-500 text-white",
    ABSENT: "bg-red-500 text-white",
    LATE: "bg-yellow-400 text-white",
    EXCUSED: "bg-blue-500 text-white",
  };
  const statusBorder: Record<AttendanceStatus, string> = {
    PRESENT: "border-green-500",
    ABSENT: "border-red-500",
    LATE: "border-yellow-400",
    EXCUSED: "border-blue-500",
  };

  const counts = Object.values(attendance).reduce(
    (acc, s) => {
      acc[s] = (acc[s] ?? 0) + 1;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <Header title="Mark Attendance" />
      <div className="p-6 space-y-5">
        {error && (
          <div className="card p-4 bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>
        )}

        {assignedClasses.length === 0 ? (
          <div className="card p-8 text-center text-gray-500">
            <p>No classes assigned to you yet. Contact admin to get assigned to classes.</p>
          </div>
        ) : (
          <>
            <div className="card p-4 flex flex-wrap gap-3 items-end">
              <div>
                <label className="label">Class *</label>
                <select
                  value={selectedClass}
                  onChange={(e) => setSelectedClass(e.target.value)}
                  className="input w-44"
                >
                  <option value="">Select class</option>
                  {assignedClasses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name} ({c.section})
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label className="label">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="input w-40"
                />
              </div>
              {students.length > 0 && (
                <div className="flex gap-2 items-center ml-auto">
                  <span className="text-xs text-gray-500">Mark all:</span>
                  {(["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]).map((s) => (
                    <button
                      key={s}
                      onClick={() => setAll(s)}
                      className={`text-xs px-2 py-1 rounded ${statusColors[s]}`}
                    >
                      {s}
                    </button>
                  ))}
                </div>
              )}
            </div>

            {students.length > 0 && (
              <>
                <div className="flex gap-3 items-center flex-wrap">
                  {(Object.entries(counts) as [string, number][]).map(([status, count]) => (
                    <span
                      key={status}
                      className={`badge ${statusColors[status as AttendanceStatus] ?? "bg-gray-100"}`}
                    >
                      {status}: {count}
                    </span>
                  ))}
                  <span className="text-xs text-gray-500 ml-auto">{students.length} students</span>
                </div>

                <div className="card overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                      <tr>
                        <th className="px-4 py-3 text-left font-medium">Roll</th>
                        <th className="px-4 py-3 text-left font-medium">Student Name</th>
                        <th className="px-4 py-3 text-left font-medium">Status</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {loading && (
                        <tr>
                          <td colSpan={3} className="py-8 text-center">
                            <Loader2 className="w-5 h-5 animate-spin inline text-gray-400" />
                          </td>
                        </tr>
                      )}
                      {students.map((s) => {
                        const status = attendance[s.id] ?? "PRESENT";
                        return (
                          <tr
                            key={s.id}
                            className={`hover:bg-gray-50 border-l-4 ${statusBorder[status]}`}
                          >
                            <td className="px-4 py-3 text-gray-500">{s.rollNumber ?? "—"}</td>
                            <td className="px-4 py-3 font-medium text-gray-800">{s.user.name}</td>
                            <td className="px-4 py-3">
                              <div className="flex gap-1">
                                {(
                                  ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as AttendanceStatus[]
                                ).map((opt) => (
                                  <button
                                    key={opt}
                                    onClick={() =>
                                      setAttendance((a) => ({
                                        ...a,
                                        [s.id]: opt,
                                      }))
                                    }
                                    className={`text-xs px-2.5 py-1 rounded border font-medium transition ${
                                      status === opt
                                        ? statusColors[opt] + " border-transparent"
                                        : "border-gray-200 text-gray-500 hover:border-gray-300"
                                    }`}
                                  >
                                    {opt}
                                  </button>
                                ))}
                              </div>
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>

                <div className="flex justify-end">
                  <button
                    onClick={handleSave}
                    disabled={saving}
                    className={`btn-primary ${saved ? "bg-green-600 hover:bg-green-700" : ""}`}
                  >
                    {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                    {saved ? "Saved!" : saving ? "Saving..." : "Save Attendance"}
                  </button>
                </div>
              </>
            )}

            {!loading && students.length === 0 && selectedClass && (
              <div className="card p-8 text-center text-gray-500">No students in this class yet.</div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

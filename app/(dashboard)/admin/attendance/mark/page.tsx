"use client";

import { useState, useEffect, useCallback } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, ChevronLeft, CheckCircle, Users, LayoutGrid, List } from "lucide-react";
import Link from "next/link";

const STATUSES = ["PRESENT", "ABSENT", "LATE", "EXCUSED"] as const;
type Status = typeof STATUSES[number];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

const statusStyle: Record<Status, string> = {
  PRESENT: "bg-green-500 text-white",
  ABSENT: "bg-red-500 text-white",
  LATE: "bg-yellow-400 text-white",
  EXCUSED: "bg-blue-400 text-white",
};
const statusGhost: Record<Status, string> = {
  PRESENT: "bg-green-100 text-green-700 hover:bg-green-200",
  ABSENT: "bg-red-100 text-red-700 hover:bg-red-200",
  LATE: "bg-yellow-100 text-yellow-700 hover:bg-yellow-200",
  EXCUSED: "bg-blue-100 text-blue-700 hover:bg-blue-200",
};

interface ClassItem { id: string; name: string; section: string }
interface StudentRow { id: string; studentId: string; user: { name: string } }
interface AttendanceRecord { studentId: string; period: number; status: Status }

function nextStatus(s: Status): Status {
  const idx = STATUSES.indexOf(s);
  return STATUSES[(idx + 1) % STATUSES.length];
}

export default function MarkAttendancePage() {
  const [classes, setClasses] = useState<ClassItem[]>([]);
  const [classId, setClassId] = useState("");
  const [date, setDate] = useState(new Date().toISOString().split("T")[0]);
  const [periodMode, setPeriodMode] = useState(false);
  const [activePeriod, setActivePeriod] = useState(1);
  const [students, setStudents] = useState<StudentRow[]>([]);
  const [loadingStudents, setLoadingStudents] = useState(false);
  const [existingMap, setExistingMap] = useState<Record<string, Record<number, Status>>>({});
  const [markingMap, setMarkingMap] = useState<Record<string, Record<number, Status>>>({});
  const [alreadyMarked, setAlreadyMarked] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => { fetch("/api/classes").then((r) => r.json()).then(setClasses); }, []);

  const loadAttendance = useCallback(async (cId: string, d: string) => {
    if (!cId) return;
    setLoadingStudents(true);

    const [studRes, attRes] = await Promise.all([
      fetch(`/api/students?classId=${cId}`),
      fetch(`/api/attendance?classId=${cId}&date=${d}`),
    ]);
    const studData = await studRes.json();
    const attData: AttendanceRecord[] = await attRes.json();

    setStudents(studData.students ?? studData);

    // Build map: studentId → { period → status }
    const em: Record<string, Record<number, Status>> = {};
    for (const r of attData) {
      if (!em[r.studentId]) em[r.studentId] = {};
      em[r.studentId][r.period] = r.status;
    }
    setExistingMap(em);
    setAlreadyMarked(attData.length > 0);

    // Pre-populate marking map from existing
    const mm: Record<string, Record<number, Status>> = {};
    for (const r of attData) {
      if (!mm[r.studentId]) mm[r.studentId] = {};
      mm[r.studentId][r.period] = r.status;
    }
    setMarkingMap(mm);
    setLoadingStudents(false);
  }, []);

  useEffect(() => { loadAttendance(classId, date); }, [classId, date, loadAttendance]);

  function getStatus(studentId: string, period: number): Status {
    return markingMap[studentId]?.[period] ?? "PRESENT";
  }

  function setStatus(studentId: string, period: number, status: Status) {
    setMarkingMap((prev) => ({
      ...prev,
      [studentId]: { ...(prev[studentId] ?? {}), [period]: status },
    }));
    setSaved(false);
  }

  function cycleStatus(studentId: string, period: number) {
    setStatus(studentId, period, nextStatus(getStatus(studentId, period)));
  }

  function markAll(status: Status) {
    const periods = periodMode ? [activePeriod] : [0];
    const mm = { ...markingMap };
    for (const s of students) {
      if (!mm[s.id]) mm[s.id] = {};
      for (const p of periods) mm[s.id][p] = status;
    }
    setMarkingMap(mm);
    setSaved(false);
  }

  async function handleSave() {
    if (!classId || students.length === 0) return;
    setSaving(true);

    const periods = periodMode ? PERIODS : [0];
    for (const period of periods) {
      const records = students.map((s) => ({
        studentId: s.id,
        status: getStatus(s.id, period),
      }));
      await fetch("/api/attendance", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ classId, date, period, records }),
      });
    }

    setSaving(false);
    setSaved(true);
    setAlreadyMarked(true);
    setTimeout(() => setSaved(false), 2000);
  }

  const currentPeriod = periodMode ? activePeriod : 0;

  return (
    <div>
      <Header title="Mark Attendance" />
      <div className="p-6 space-y-5">
        <div className="flex items-center gap-2">
          <Link href="/admin/attendance" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Attendance
          </Link>
        </div>

        {/* Config bar */}
        <div className="card p-4">
          <div className="flex flex-wrap gap-3 items-center">
            <div>
              <label className="label text-xs mb-1" htmlFor="mark-class">Class</label>
              <select id="mark-class" value={classId} onChange={(e) => setClassId(e.target.value)} className="input min-w-44">
                <option value="">Select class…</option>
                {classes.map((c) => <option key={c.id} value={c.id}>{c.name} — {c.section}</option>)}
              </select>
            </div>
            <div>
              <label className="label text-xs mb-1" htmlFor="mark-date">Date</label>
              <input id="mark-date" type="date" value={date} onChange={(e) => setDate(e.target.value)} className="input" />
            </div>
            <div className="flex items-end gap-2">
              <label className="flex items-center gap-2 cursor-pointer mt-5">
                <div
                  onClick={() => setPeriodMode((p) => !p)}
                  className={`w-10 h-5 rounded-full transition ${periodMode ? "bg-blue-500" : "bg-gray-300"} relative`}
                >
                  <span className={`absolute top-0.5 w-4 h-4 rounded-full bg-white shadow transition-transform ${periodMode ? "translate-x-5" : "translate-x-0.5"}`} />
                </div>
                <span className="text-sm text-gray-700">Period-wise</span>
              </label>
            </div>
          </div>

          {periodMode && (
            <div className="flex gap-1.5 mt-3 flex-wrap">
              {PERIODS.map((p) => (
                <button
                  key={p}
                  type="button"
                  onClick={() => setActivePeriod(p)}
                  className={`px-3 py-1 rounded-lg text-sm font-medium transition ${activePeriod === p ? "bg-blue-600 text-white" : "bg-gray-100 text-gray-600 hover:bg-gray-200"}`}
                >
                  P{p}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Already marked banner */}
        {alreadyMarked && !saving && (
          <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 rounded-xl px-4 py-2.5 text-sm text-blue-700">
            <CheckCircle className="w-4 h-4 shrink-0" />
            Attendance already marked for this date. Editing existing records.
          </div>
        )}

        {/* Action bar */}
        {classId && students.length > 0 && (
          <div className="flex flex-wrap gap-2 items-center justify-between">
            <div className="flex gap-2">
              {STATUSES.map((s) => (
                <button key={s} type="button" onClick={() => markAll(s)} className={`text-xs px-3 py-1.5 rounded-lg font-medium transition ${statusGhost[s]}`}>
                  All {s.charAt(0) + s.slice(1).toLowerCase()}
                </button>
              ))}
            </div>
            <button
              type="button"
              onClick={handleSave}
              disabled={saving || !classId}
              className={`btn-primary ${saved ? "!bg-green-600" : ""}`}
            >
              {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "Saved!" : `Save ${students.length} Records`}
            </button>
          </div>
        )}

        {/* Student list */}
        {!classId ? (
          <div className="card p-12 text-center text-gray-400">
            <Users className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>Select a class to start marking attendance.</p>
          </div>
        ) : loadingStudents ? (
          <div className="flex justify-center py-12"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
        ) : periodMode ? (
          /* Period-wise grid */
          <div className="card overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 text-xs text-gray-500">
                  <tr>
                    <th className="px-4 py-3 text-left font-medium sticky left-0 bg-gray-50">Student</th>
                    {PERIODS.map((p) => (
                      <th key={p} className={`px-3 py-3 text-center font-medium min-w-16 ${p === activePeriod ? "bg-blue-50 text-blue-700" : ""}`}>P{p}</th>
                    ))}
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {students.map((s) => (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-2.5 font-medium text-gray-800 sticky left-0 bg-white">
                        <p className="text-sm">{s.user.name}</p>
                        <p className="text-xs text-gray-400">{s.studentId}</p>
                      </td>
                      {PERIODS.map((p) => {
                        const st = getStatus(s.id, p);
                        return (
                          <td key={p} className={`px-2 py-2 text-center ${p === activePeriod ? "bg-blue-50/50" : ""}`}>
                            <button
                              type="button"
                              onClick={() => cycleStatus(s.id, p)}
                              className={`w-10 h-8 rounded-lg text-xs font-bold transition ${statusStyle[st]}`}
                              title={st}
                            >
                              {st[0]}
                            </button>
                          </td>
                        );
                      })}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
            <div className="px-4 py-2 border-t border-gray-100 flex gap-3 text-xs text-gray-400">
              {STATUSES.map((s) => (
                <span key={s} className={`inline-flex items-center gap-1 px-2 py-0.5 rounded ${statusStyle[s]}`}>{s[0]} = {s.charAt(0) + s.slice(1).toLowerCase()}</span>
              ))}
            </div>
          </div>
        ) : (
          /* Daily list */
          <div className="card overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  <th className="px-4 py-3 text-left font-medium">Student</th>
                  <th className="px-4 py-3 text-left font-medium">Admission No</th>
                  <th className="px-4 py-3 text-left font-medium">Status</th>
                  <th className="px-4 py-3 text-left font-medium">Remarks</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {students.map((s) => {
                  const st = getStatus(s.id, 0);
                  return (
                    <tr key={s.id} className="hover:bg-gray-50">
                      <td className="px-4 py-3 font-medium text-gray-800">{s.user.name}</td>
                      <td className="px-4 py-3 text-gray-500 font-mono text-xs">{s.studentId}</td>
                      <td className="px-4 py-3">
                        <div className="flex gap-1">
                          {STATUSES.map((status) => (
                            <button
                              key={status}
                              type="button"
                              onClick={() => setStatus(s.id, 0, status)}
                              className={`px-2.5 py-1 rounded-lg text-xs font-medium transition ${st === status ? statusStyle[status] : "bg-gray-100 text-gray-500 hover:bg-gray-200"}`}
                            >
                              {status[0]}
                            </button>
                          ))}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <input
                          value={markingMap[s.id]?.[(-1 as unknown as number)] ?? ""}
                          onChange={(e) => setMarkingMap((prev) => ({ ...prev, [s.id]: { ...(prev[s.id] ?? {}), [-1]: e.target.value as never } }))}
                          className="input text-xs py-1"
                          placeholder="Optional"
                        />
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}

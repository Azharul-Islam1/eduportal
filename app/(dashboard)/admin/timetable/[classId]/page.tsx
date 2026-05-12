"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, X, ChevronLeft, Clock } from "lucide-react";
import Link from "next/link";

const DAYS = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];
const PERIODS = [1, 2, 3, 4, 5, 6, 7, 8];

interface Subject { id: string; name: string; code: string }
interface Teacher { id: string; user: { name: string } }
interface TimetableEntry {
  id: string; day: string; period: number; subjectId: string; teacherId: string; startTime: string | null; endTime: string | null;
  subject: Subject;
  teacher: { user: { name: string } };
}
interface ClassInfo { id: string; name: string; section: string }

export default function TimetablePage({ params }: { params: Promise<{ classId: string }> }) {
  const { classId } = use(params);
  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [entries, setEntries] = useState<TimetableEntry[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [loading, setLoading] = useState(true);
  const [modal, setModal] = useState<{ day: string; period: number } | null>(null);
  const [form, setForm] = useState({ subjectId: "", teacherId: "", startTime: "", endTime: "" });
  const [saving, setSaving] = useState(false);

  const fetchTimetable = async () => {
    const res = await fetch(`/api/timetable/${classId}`);
    setEntries(await res.json());
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [clsRes, subjRes, tchrRes] = await Promise.all([
        fetch(`/api/classes/${classId}`),
        fetch("/api/subjects"),
        fetch("/api/teachers"),
      ]);
      setCls(await clsRes.json());
      setSubjects(await subjRes.json());
      setTeachers(await tchrRes.json());
      await fetchTimetable();
      setLoading(false);
    }
    load();
  }, [classId]);

  function getEntry(day: string, period: number) {
    return entries.find((e) => e.day === day && e.period === period);
  }

  function openSlot(day: string, period: number) {
    const existing = getEntry(day, period);
    setForm({
      subjectId: existing?.subjectId ?? "",
      teacherId: existing?.teacherId ?? "",
      startTime: existing?.startTime ?? "",
      endTime: existing?.endTime ?? "",
    });
    setModal({ day, period });
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!modal) return;
    setSaving(true);
    await fetch(`/api/timetable/${classId}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ ...form, day: modal.day, period: modal.period }),
    });
    setSaving(false);
    setModal(null);
    fetchTimetable();
  }

  async function handleClear(day: string, period: number) {
    await fetch(`/api/timetable/${classId}?day=${day}&period=${period}`, { method: "DELETE" });
    fetchTimetable();
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>;

  const subjectColors = ["bg-blue-100 text-blue-800", "bg-green-100 text-green-800", "bg-purple-100 text-purple-800",
    "bg-orange-100 text-orange-800", "bg-pink-100 text-pink-800", "bg-teal-100 text-teal-800",
    "bg-yellow-100 text-yellow-800", "bg-red-100 text-red-800"];
  const subjectColorMap = new Map(subjects.map((s, i) => [s.id, subjectColors[i % subjectColors.length]]));

  return (
    <div>
      <Header title="Timetable" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Link href="/admin/classes" className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Classes
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">
            {cls ? `${cls.name} — Section ${cls.section}` : "Timetable"}
          </span>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-sm border-collapse">
            <thead>
              <tr>
                <th className="p-3 text-left text-xs text-gray-500 font-medium w-24">Day</th>
                {PERIODS.map((p) => (
                  <th key={p} className="p-3 text-center text-xs text-gray-500 font-medium min-w-28">
                    <div className="flex items-center justify-center gap-1"><Clock className="w-3 h-3" /> P{p}</div>
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {DAYS.map((day) => (
                <tr key={day} className="border-t border-gray-100">
                  <td className="p-3 text-xs font-semibold text-gray-600 bg-gray-50">{day}</td>
                  {PERIODS.map((period) => {
                    const entry = getEntry(day, period);
                    return (
                      <td key={period} className="p-1 align-top">
                        {entry ? (
                          <div
                            className={`rounded-lg p-2 cursor-pointer group relative ${subjectColorMap.get(entry.subjectId) ?? "bg-gray-100 text-gray-800"}`}
                            onClick={() => openSlot(day, period)}
                          >
                            <p className="text-xs font-semibold leading-tight">{entry.subject.name}</p>
                            <p className="text-xs opacity-70 mt-0.5">{entry.teacher.user.name}</p>
                            {entry.startTime && <p className="text-xs opacity-60 mt-0.5">{entry.startTime}–{entry.endTime}</p>}
                            <button
                              type="button"
                              aria-label="Clear slot"
                              onClick={(ev) => { ev.stopPropagation(); handleClear(day, period); }}
                              className="absolute top-1 right-1 opacity-0 group-hover:opacity-100 transition rounded p-0.5 hover:bg-black/10"
                            >
                              <X className="w-3 h-3" />
                            </button>
                          </div>
                        ) : (
                          <button
                            type="button"
                            aria-label={`Add ${day} period ${period}`}
                            onClick={() => openSlot(day, period)}
                            className="w-full h-14 rounded-lg border-2 border-dashed border-gray-200 hover:border-blue-300 hover:bg-blue-50 transition text-gray-300 hover:text-blue-400 text-xs"
                          >
                            +
                          </button>
                        )}
                      </td>
                    );
                  })}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {modal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4">
          <div className="card w-full max-w-sm p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold">{modal.day} — Period {modal.period}</h2>
              <button type="button" aria-label="Close" onClick={() => setModal(null)}><X className="w-5 h-5" /></button>
            </div>
            <form onSubmit={handleSave} className="space-y-3">
              <div>
                <label className="label" htmlFor="tt-subject">Subject *</label>
                <select id="tt-subject" value={form.subjectId} onChange={(e) => setForm({ ...form, subjectId: e.target.value })} className="input" required>
                  <option value="">Select subject…</option>
                  {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
                </select>
              </div>
              <div>
                <label className="label" htmlFor="tt-teacher">Teacher *</label>
                <select id="tt-teacher" value={form.teacherId} onChange={(e) => setForm({ ...form, teacherId: e.target.value })} className="input" required>
                  <option value="">Select teacher…</option>
                  {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
                </select>
              </div>
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="label" htmlFor="tt-start">Start Time</label>
                  <input id="tt-start" type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="input" />
                </div>
                <div>
                  <label className="label" htmlFor="tt-end">End Time</label>
                  <input id="tt-end" type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="input" />
                </div>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setModal(null)} className="btn-secondary flex-1">Cancel</button>
                <button type="submit" disabled={saving} className="btn-primary flex-1 justify-center">
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Save Slot"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

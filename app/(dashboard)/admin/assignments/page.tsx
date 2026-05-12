"use client";

import { useState, useEffect } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, UserCheck, Trash2 } from "lucide-react";

interface ClassLevel { id: string; name: string; sections: { id: string; name: string; section: string }[] }
interface Subject { id: string; name: string; code: string }
interface Teacher { id: string; user: { name: string } }
interface Assignment {
  id: string; classId: string; subjectId: string; academicYear: string;
  teacher: { user: { name: string } };
  class: { name: string; section: string };
  subject: { name: string; code: string };
}

export default function TeacherAssignmentsPage() {
  const [levels, setLevels] = useState<ClassLevel[]>([]);
  const [subjects, setSubjects] = useState<Subject[]>([]);
  const [teachers, setTeachers] = useState<Teacher[]>([]);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const [selectedClassId, setSelectedClassId] = useState("");
  const [selectedSubjectId, setSelectedSubjectId] = useState("");
  const [selectedTeacherId, setSelectedTeacherId] = useState("");
  const [academicYear, setAcademicYear] = useState("2025-2026");

  const fetchAssignments = async (classId?: string) => {
    const url = classId ? `/api/teacher-assignments?classId=${classId}&academicYear=${academicYear}` : `/api/teacher-assignments?academicYear=${academicYear}`;
    const res = await fetch(url);
    setAssignments(await res.json());
  };

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [lvlRes, subjRes, tchrRes] = await Promise.all([
        fetch("/api/class-levels"),
        fetch("/api/subjects"),
        fetch("/api/teachers"),
      ]);
      const lvlData = await lvlRes.json();
      // Fetch sections for each level
      const levelsWithSections = await Promise.all(
        lvlData.map(async (l: { id: string; name: string }) => {
          const r = await fetch(`/api/class-levels/${l.id}`);
          return r.json();
        })
      );
      setLevels(levelsWithSections);
      setSubjects(await subjRes.json());
      setTeachers(await tchrRes.json());
      await fetchAssignments();
      setLoading(false);
    }
    load();
  }, []);

  useEffect(() => {
    if (!loading) fetchAssignments(selectedClassId || undefined);
  }, [selectedClassId, academicYear]);

  async function handleAssign(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedClassId || !selectedSubjectId || !selectedTeacherId) return;
    setSaving(true);
    await fetch("/api/teacher-assignments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId: selectedClassId, subjectId: selectedSubjectId, teacherId: selectedTeacherId, academicYear }),
    });
    setSaving(false);
    setSelectedSubjectId("");
    setSelectedTeacherId("");
    fetchAssignments(selectedClassId || undefined);
  }

  async function handleRemove(a: Assignment) {
    if (!confirm("Remove this assignment?")) return;
    await fetch(`/api/teacher-assignments?classId=${a.classId}&subjectId=${a.subjectId}&academicYear=${a.academicYear}`, { method: "DELETE" });
    fetchAssignments(selectedClassId || undefined);
  }

  const allSections = levels.flatMap((l) => l.sections ?? []);

  return (
    <div>
      <Header title="Teacher Assignments" />
      <div className="p-6 space-y-6">

        {/* Assign form */}
        <div className="card p-5">
          <h2 className="font-semibold text-gray-800 mb-4 flex items-center gap-2">
            <UserCheck className="w-4 h-4 text-blue-600" /> Assign Teacher to Subject
          </h2>
          <form onSubmit={handleAssign} className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 items-end">
            <div>
              <label className="label" htmlFor="ay">Academic Year</label>
              <input id="ay" value={academicYear} onChange={(e) => setAcademicYear(e.target.value)} className="input" />
            </div>
            <div>
              <label className="label" htmlFor="cls">Class / Section *</label>
              <select id="cls" value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="input" required>
                <option value="">Select class…</option>
                {levels.map((l) => (
                  <optgroup key={l.id} label={l.name}>
                    {(l.sections ?? []).map((s) => (
                      <option key={s.id} value={s.id}>{s.name} — {s.section}</option>
                    ))}
                  </optgroup>
                ))}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="subj">Subject *</label>
              <select id="subj" value={selectedSubjectId} onChange={(e) => setSelectedSubjectId(e.target.value)} className="input" required>
                <option value="">Select subject…</option>
                {subjects.map((s) => <option key={s.id} value={s.id}>{s.name}</option>)}
              </select>
            </div>
            <div>
              <label className="label" htmlFor="tchr">Teacher *</label>
              <select id="tchr" value={selectedTeacherId} onChange={(e) => setSelectedTeacherId(e.target.value)} className="input" required>
                <option value="">Select teacher…</option>
                {teachers.map((t) => <option key={t.id} value={t.id}>{t.user.name}</option>)}
              </select>
            </div>
            <div>
              <button type="submit" disabled={saving} className="btn-primary w-full justify-center">
                {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : "Assign"}
              </button>
            </div>
          </form>
        </div>

        {/* Assignment list */}
        <div className="card overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 flex items-center justify-between">
            <h3 className="font-medium text-gray-700">Current Assignments</h3>
            <select value={selectedClassId} onChange={(e) => setSelectedClassId(e.target.value)} className="input max-w-xs" aria-label="Filter by class">
              <option value="">All Classes</option>
              {allSections.map((s) => <option key={s.id} value={s.id}>{s.name} — {s.section}</option>)}
            </select>
          </div>
          {loading ? (
            <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
          ) : assignments.length === 0 ? (
            <div className="py-10 text-center text-sm text-gray-400">No assignments found.</div>
          ) : (
            <table className="w-full text-sm">
              <thead className="bg-gray-50 text-xs uppercase text-gray-500">
                <tr>
                  {["Class", "Section", "Subject", "Teacher", "Year", ""].map((h, i) => (
                    <th key={i} className="px-4 py-3 text-left font-medium">{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {assignments.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50">
                    <td className="px-4 py-3 font-medium text-gray-800">{a.class.name}</td>
                    <td className="px-4 py-3 text-gray-600">{a.class.section}</td>
                    <td className="px-4 py-3 text-gray-700">{a.subject.name} <span className="text-xs text-gray-400 font-mono">({a.subject.code})</span></td>
                    <td className="px-4 py-3 text-gray-700">{a.teacher.user.name}</td>
                    <td className="px-4 py-3 text-gray-500">{a.academicYear}</td>
                    <td className="px-4 py-3">
                      <button type="button" aria-label="Remove assignment" onClick={() => handleRemove(a)} className="p-1 text-gray-400 hover:text-red-500 rounded">
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
}

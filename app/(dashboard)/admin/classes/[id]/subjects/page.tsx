"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import { Loader2, BookOpen, ChevronLeft, Save } from "lucide-react";
import Link from "next/link";

interface Subject { id: string; name: string; code: string; type: string; isElective: boolean }
interface ClassSubject { id: string; subjectId: string; subject: Subject }
interface ClassInfo { id: string; name: string; section: string }

export default function ClassSubjectsPage({ params }: { params: Promise<{ id: string }> }) {
  const { id: classId } = use(params);
  const [cls, setCls] = useState<ClassInfo | null>(null);
  const [allSubjects, setAllSubjects] = useState<Subject[]>([]);
  const [assigned, setAssigned] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    async function load() {
      setLoading(true);
      const [clsRes, subjRes, mapRes] = await Promise.all([
        fetch(`/api/classes/${classId}`),
        fetch("/api/subjects"),
        fetch(`/api/class-subjects?classId=${classId}`),
      ]);
      const clsData = await clsRes.json();
      const subjData: Subject[] = await subjRes.json();
      const mapData: ClassSubject[] = await mapRes.json();
      setCls(clsData);
      setAllSubjects(subjData);
      setAssigned(new Set(mapData.map((m) => m.subjectId)));
      setLoading(false);
    }
    load();
  }, [classId]);

  function toggle(subjectId: string) {
    setAssigned((prev) => {
      const next = new Set(prev);
      next.has(subjectId) ? next.delete(subjectId) : next.add(subjectId);
      return next;
    });
    setSaved(false);
  }

  async function handleSave() {
    setSaving(true);
    await fetch("/api/class-subjects", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ classId, subjectIds: Array.from(assigned) }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  }

  if (loading) return <div className="flex justify-center py-24"><Loader2 className="w-7 h-7 animate-spin text-gray-400" /></div>;

  const theory = allSubjects.filter((s) => s.type === "THEORY" && !s.isElective);
  const practical = allSubjects.filter((s) => s.type === "PRACTICAL" && !s.isElective);
  const elective = allSubjects.filter((s) => s.isElective);

  return (
    <div>
      <Header title="Class Subjects" />
      <div className="p-6">
        <div className="flex items-center gap-2 mb-5">
          <Link href={`/admin/classes/${cls?.id ? "" : classId}`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Back
          </Link>
          <span className="text-gray-300">/</span>
          <span className="text-sm font-medium text-gray-700">
            {cls ? `${cls.name} — Section ${cls.section}` : "Subjects"}
          </span>
        </div>

        <div className="flex justify-between items-center mb-5">
          <p className="text-sm text-gray-500">{assigned.size} of {allSubjects.length} subjects selected</p>
          <button
            type="button"
            onClick={handleSave}
            disabled={saving}
            className={`btn-primary ${saved ? "!bg-green-600" : ""}`}
          >
            {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : saved ? "Saved!" : <><Save className="w-4 h-4" /> Save</>}
          </button>
        </div>

        {allSubjects.length === 0 ? (
          <div className="card p-12 text-center text-gray-400">
            <BookOpen className="w-10 h-10 mx-auto mb-3 opacity-40" />
            <p>No subjects available. <Link href="/admin/subjects" className="text-blue-600 hover:underline">Add subjects first.</Link></p>
          </div>
        ) : (
          <div className="space-y-6">
            {[
              { label: "Theory Subjects", items: theory },
              { label: "Practical Subjects", items: practical },
              { label: "Elective Subjects", items: elective },
            ].filter((g) => g.items.length > 0).map((group) => (
              <div key={group.label}>
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-3">{group.label}</h3>
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {group.items.map((s) => (
                    <label
                      key={s.id}
                      className={`flex items-center gap-3 p-4 rounded-xl border-2 cursor-pointer transition ${
                        assigned.has(s.id) ? "border-blue-500 bg-blue-50" : "border-gray-200 hover:border-gray-300"
                      }`}
                    >
                      <input
                        type="checkbox"
                        checked={assigned.has(s.id)}
                        onChange={() => toggle(s.id)}
                        className="rounded text-blue-600"
                      />
                      <div>
                        <p className={`font-medium text-sm ${assigned.has(s.id) ? "text-blue-800" : "text-gray-800"}`}>
                          {s.name}
                        </p>
                        <p className="text-xs text-gray-500 font-mono">{s.code}</p>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState, useEffect, use } from "react";
import Header from "@/components/dashboard/Header";
import Link from "next/link";
import { ChevronLeft, Loader2, Printer } from "lucide-react";

const GRADE_STYLE: Record<string, string> = {
  "A+": "bg-green-100 text-green-800",
  A: "bg-green-100 text-green-700",
  "B+": "bg-blue-100 text-blue-700",
  B: "bg-blue-100 text-blue-600",
  C: "bg-yellow-100 text-yellow-700",
  D: "bg-orange-100 text-orange-700",
  F: "bg-red-100 text-red-700",
};

function getGrade(pct: number): string {
  if (pct >= 90) return "A+";
  if (pct >= 80) return "A";
  if (pct >= 70) return "B+";
  if (pct >= 60) return "B";
  if (pct >= 50) return "C";
  if (pct >= 40) return "D";
  return "F";
}

interface SubjectResult {
  subjectName: string;
  subjectCode: string;
  maxMarks: number;
  passingMarks: number;
  obtained: number | null;
  isAbsent: boolean;
  grade: string;
  pass: boolean;
}

interface CardData {
  examName: string;
  academicYear: string;
  startDate: string | null;
  endDate: string | null;
  publishedAt: string | null;
  schoolName: string;
  principalName: string | null;
  studentName: string;
  studentAdmissionNo: string;
  className: string;
  subjects: SubjectResult[];
  totalObtained: number;
  totalMax: number;
  percentage: number;
  grade: string;
  rank: number;
  classSize: number;
}

export default function ResultCardPage({ params }: { params: Promise<{ id: string; studentId: string }> }) {
  const { id: examId, studentId } = use(params);
  const [card, setCard] = useState<CardData | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      const [examRes, resultRes, studentRes] = await Promise.all([
        fetch(`/api/exams/${examId}`),
        fetch(`/api/exams/${examId}/results`),
        fetch(`/api/students/${studentId}`),
      ]);

      const exam = await examRes.json();
      const resultData = await resultRes.json();
      const studentData = await studentRes.json();

      const subjects: SubjectResult[] = (resultData.subjects ?? []).map((s: { id: string; name: string }) => {
        const studentRow = (resultData.rows ?? []).find((r: { studentId: string }) => r.studentId === studentId);
        const sm = studentRow?.subjectMarks?.[s.id];
        const obtained = sm?.isAbsent ? null : (sm?.obtained ?? null);
        const pct = exam.papers?.find((p: { subject: { id: string }; maxMarks: number }) => p.subject.id === s.id)?.maxMarks
          ? ((obtained ?? 0) / (sm?.max ?? 100)) * 100 : 0;
        return {
          subjectName: s.name,
          subjectCode: "",
          maxMarks: sm?.max ?? 100,
          passingMarks: sm?.passing ?? 40,
          obtained,
          isAbsent: sm?.isAbsent ?? false,
          grade: getGrade(pct),
          pass: !sm?.isAbsent && obtained !== null && obtained >= (sm?.passing ?? 40),
        };
      });

      const studentRow = (resultData.rows ?? []).find((r: { studentId: string }) => r.studentId === studentId);

      setCard({
        examName: exam.name,
        academicYear: exam.academicYear,
        startDate: exam.startDate,
        endDate: exam.endDate,
        publishedAt: exam.publishedAt,
        schoolName: exam.school?.name ?? "School",
        principalName: exam.school?.principalName ?? null,
        studentName: studentData?.user?.name ?? "Student",
        studentAdmissionNo: studentData?.studentId ?? "",
        className: studentRow?.className ?? "",
        subjects,
        totalObtained: studentRow?.totalObtained ?? 0,
        totalMax: studentRow?.totalMax ?? 0,
        percentage: studentRow?.percentage ?? 0,
        grade: studentRow?.grade ?? "—",
        rank: studentRow?.rank ?? 0,
        classSize: (resultData.rows ?? []).length,
      });
      setLoading(false);
    };
    load();
  }, [examId, studentId]);

  function handlePrint() {
    const prev = document.title;
    document.title = `Result_${card?.studentName ?? "card"}_${card?.examName ?? ""}`;
    window.print();
    document.title = prev;
  }

  if (loading) return (
    <div>
      <Header title="Result Card" />
      <div className="flex justify-center py-20"><Loader2 className="w-6 h-6 animate-spin text-gray-400" /></div>
    </div>
  );

  if (!card) return <div className="p-6 text-gray-400">Result data not found.</div>;

  const overallPass = card.subjects.every((s) => s.isAbsent || s.pass);

  return (
    <div>
      <style>{`
        @media print {
          body * { visibility: hidden !important; }
          #result-card, #result-card * { visibility: visible !important; }
          #result-card { position: fixed !important; top: 0; left: 0; width: 100%; padding: 24px; }
          .no-print { display: none !important; }
        }
      `}</style>

      <Header title="Result Card" />
      <div className="p-6 space-y-4 no-print">
        <div className="flex items-center justify-between flex-wrap gap-3">
          <Link href={`/admin/exams/${examId}/results`} className="flex items-center gap-1 text-sm text-gray-500 hover:text-gray-700">
            <ChevronLeft className="w-4 h-4" /> Results
          </Link>
          <button type="button" onClick={handlePrint} className="btn-primary flex items-center gap-1.5">
            <Printer className="w-4 h-4" /> Print / Download PDF
          </button>
        </div>
      </div>

      {/* Result card */}
      <div id="result-card" className="max-w-2xl mx-auto bg-white rounded-2xl border border-gray-200 shadow-sm overflow-hidden mx-6">
        {/* School header */}
        <div className="bg-blue-700 text-white text-center px-6 py-5">
          <h1 className="text-xl font-bold tracking-wide">{card.schoolName}</h1>
          <p className="text-blue-200 text-sm mt-0.5">Academic Year {card.academicYear}</p>
        </div>

        {/* Exam title */}
        <div className="text-center py-4 border-b border-gray-100 bg-gray-50">
          <p className="text-lg font-semibold text-gray-800">{card.examName}</p>
          <p className="text-xs text-gray-400 mt-0.5">
            {card.startDate && new Date(card.startDate).toLocaleDateString()}
            {card.endDate && ` – ${new Date(card.endDate).toLocaleDateString()}`}
          </p>
        </div>

        {/* Student info */}
        <div className="px-6 py-4 grid grid-cols-2 gap-3 text-sm border-b border-gray-100">
          <div>
            <p className="text-xs text-gray-400">Student Name</p>
            <p className="font-semibold text-gray-800">{card.studentName}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Admission No.</p>
            <p className="font-semibold text-gray-800 font-mono">{card.studentAdmissionNo}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Class</p>
            <p className="font-semibold text-gray-800">{card.className}</p>
          </div>
          <div>
            <p className="text-xs text-gray-400">Rank</p>
            <p className="font-semibold text-gray-800">#{card.rank} of {card.classSize}</p>
          </div>
        </div>

        {/* Subject-wise marks */}
        <div className="px-6 py-4">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-xs text-gray-500 border-b border-gray-200">
                <th className="py-2 text-left font-medium">Subject</th>
                <th className="py-2 text-center font-medium">Max</th>
                <th className="py-2 text-center font-medium">Pass</th>
                <th className="py-2 text-center font-medium">Obtained</th>
                <th className="py-2 text-center font-medium">Grade</th>
                <th className="py-2 text-center font-medium">Result</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100">
              {card.subjects.map((s, i) => (
                <tr key={i}>
                  <td className="py-2.5 font-medium text-gray-800">{s.subjectName}</td>
                  <td className="py-2.5 text-center text-gray-500">{s.maxMarks}</td>
                  <td className="py-2.5 text-center text-gray-500">{s.passingMarks}</td>
                  <td className="py-2.5 text-center font-semibold text-gray-800">
                    {s.isAbsent ? "AB" : (s.obtained ?? "—")}
                  </td>
                  <td className="py-2.5 text-center">
                    <span className={`badge text-xs ${GRADE_STYLE[s.grade] ?? "bg-gray-100"}`}>{s.grade}</span>
                  </td>
                  <td className="py-2.5 text-center">
                    {s.isAbsent ? (
                      <span className="text-xs text-gray-400">Absent</span>
                    ) : s.pass ? (
                      <span className="text-xs font-medium text-green-600">Pass</span>
                    ) : (
                      <span className="text-xs font-medium text-red-500">Fail</span>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Summary footer */}
        <div className="px-6 py-4 bg-gray-50 border-t border-gray-100 flex flex-wrap gap-6 items-center justify-between">
          <div className="flex gap-6">
            <div className="text-center">
              <p className="text-xs text-gray-400">Total</p>
              <p className="text-lg font-bold text-gray-800">{card.totalObtained}/{card.totalMax}</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Percentage</p>
              <p className="text-lg font-bold text-gray-800">{card.percentage}%</p>
            </div>
            <div className="text-center">
              <p className="text-xs text-gray-400">Overall Grade</p>
              <span className={`badge text-base px-3 py-1 font-bold ${GRADE_STYLE[card.grade] ?? "bg-gray-100"}`}>{card.grade}</span>
            </div>
          </div>
          <div className={`px-4 py-2 rounded-xl font-bold text-sm ${overallPass ? "bg-green-100 text-green-700" : "bg-red-100 text-red-600"}`}>
            {overallPass ? "PASS" : "FAIL"}
          </div>
        </div>

        {/* Signatures */}
        <div className="px-6 py-5 grid grid-cols-2 gap-6 border-t border-gray-100">
          <div className="text-center">
            <div className="border-t-2 border-gray-300 pt-2 mt-8">
              <p className="text-xs text-gray-500">Class Teacher</p>
            </div>
          </div>
          <div className="text-center">
            <div className="border-t-2 border-gray-300 pt-2 mt-8">
              <p className="text-xs text-gray-500">{card.principalName ? `Principal: ${card.principalName}` : "Principal"}</p>
            </div>
          </div>
        </div>

        {card.publishedAt && (
          <div className="px-6 pb-4 text-center text-xs text-gray-300">
            Published {new Date(card.publishedAt).toLocaleDateString()}
          </div>
        )}
      </div>
    </div>
  );
}

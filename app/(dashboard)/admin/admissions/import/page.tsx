"use client";

import { useState, useRef } from "react";
import Papa from "papaparse";
import type { ParseResult } from "papaparse";
import Link from "next/link";
import { ArrowLeft, Upload, Download, FileText, CheckCircle, XCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

const EXPECTED_COLUMNS = [
  "name",
  "email",
  "gender",
  "dateOfBirth",
  "className",
  "section",
  "rollNumber",
  "phone",
  "fatherName",
  "fatherPhone",
  "motherName",
  "motherPhone",
  "bloodGroup",
];

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

interface CsvRow {
  name: string;
  email: string;
  gender: string;
  dateOfBirth: string;
  className: string;
  section: string;
  rollNumber: string;
  phone: string;
  fatherName: string;
  fatherPhone: string;
  motherName: string;
  motherPhone: string;
  bloodGroup: string;
  [key: string]: string;
}

interface PreviewRow {
  rowNum: number;
  data: CsvRow;
  valid: boolean;
  errors: string[];
}

function validateRow(row: CsvRow): string[] {
  const errors: string[] = [];
  if (!row.name?.trim()) errors.push("Name is required");
  if (!row.email?.trim()) errors.push("Email is required");
  else if (!EMAIL_RE.test(row.email.trim())) errors.push("Invalid email format");
  if (!row.className?.trim()) errors.push("Class name is required");
  return errors;
}

function downloadTemplate() {
  const csv = EXPECTED_COLUMNS.join(",") + "\n" +
    "John Doe,john@example.com,Male,2010-05-15,Grade 6,A,42,9876543210,Robert Doe,9876543211,Jane Doe,9876543212,O+";
  const blob = new Blob([csv], { type: "text/csv" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "admission_import_template.csv";
  a.click();
  URL.revokeObjectURL(url);
}

export default function ImportPage() {
  const fileRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<PreviewRow[]>([]);
  const [fileName, setFileName] = useState("");
  const [importing, setImporting] = useState(false);
  const [result, setResult] = useState<{ imported: number; skipped: number } | null>(null);

  const validRows = preview.filter((r) => r.valid);
  const invalidRows = preview.filter((r) => !r.valid);

  function handleFile(file: File) {
    setFileName(file.name);
    setResult(null);
    Papa.parse<CsvRow>(file, {
      header: true,
      skipEmptyLines: true,
      complete(res: ParseResult<CsvRow>) {
        const rows: PreviewRow[] = res.data.map((row, i) => {
          const errors = validateRow(row);
          return { rowNum: i + 1, data: row, valid: errors.length === 0, errors };
        });
        setPreview(rows);
      },
    });
  }

  function handleDrop(e: React.DragEvent) {
    e.preventDefault();
    const file = e.dataTransfer.files[0];
    if (file && file.name.endsWith(".csv")) handleFile(file);
  }

  async function handleImport() {
    if (validRows.length === 0) return;
    setImporting(true);
    const res = await fetch("/api/admissions/import", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ rows: validRows.map((r) => r.data) }),
    });
    if (res.ok) {
      const data = await res.json();
      setResult({ imported: data.imported ?? validRows.length, skipped: data.skipped ?? 0 });
    } else {
      setResult({ imported: 0, skipped: validRows.length });
    }
    setImporting(false);
  }

  return (
    <div className="space-y-6 max-w-5xl">
      <div className="flex items-center gap-3">
        <Button variant="ghost" size="icon" asChild>
          <Link href="/admin/students">
            <ArrowLeft className="h-4 w-4" />
          </Link>
        </Button>
        <div>
          <h1 className="text-2xl font-semibold">Import Students</h1>
          <p className="text-sm text-muted-foreground">Bulk import students from a CSV file</p>
        </div>
      </div>

      <div className="flex items-center justify-end">
        <Button variant="outline" onClick={downloadTemplate}>
          <Download className="mr-2 h-4 w-4" />
          Download Template
        </Button>
      </div>

      <Card>
        <CardContent className="pt-6">
          <div
            className="flex flex-col items-center justify-center gap-3 rounded-lg border-2 border-dashed border-border p-10 text-center transition-colors hover:border-primary/50 cursor-pointer"
            onDragOver={(e) => e.preventDefault()}
            onDrop={handleDrop}
            onClick={() => fileRef.current?.click()}
          >
            <div className="rounded-full bg-muted p-3">
              <Upload className="h-6 w-6 text-muted-foreground" />
            </div>
            <div>
              <p className="font-medium">Drop your CSV file here or click to browse</p>
              <p className="text-sm text-muted-foreground mt-1">
                Accepts .csv files only
              </p>
            </div>
            {fileName && (
              <div className="flex items-center gap-2 rounded-md bg-muted px-3 py-1.5">
                <FileText className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm">{fileName}</span>
              </div>
            )}
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              className="hidden"
              onChange={(e) => {
                const f = e.target.files?.[0];
                if (f) handleFile(f);
              }}
            />
          </div>
        </CardContent>
      </Card>

      {preview.length > 0 && (
        <>
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-center gap-3">
              <Badge variant="success" className="gap-1">
                <CheckCircle className="h-3.5 w-3.5" />
                {validRows.length} valid
              </Badge>
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3.5 w-3.5" />
                {invalidRows.length} invalid
              </Badge>
              <span className="text-sm text-muted-foreground">{preview.length} total rows</span>
            </div>
            <Button onClick={handleImport} disabled={importing || validRows.length === 0}>
              {importing && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Import {validRows.length} Valid Rows
            </Button>
          </div>

          {result && (
            <div className="rounded-md border border-border bg-muted/50 px-4 py-3 flex items-center gap-3">
              <CheckCircle className="h-5 w-5 text-emerald-500 shrink-0" />
              <p className="text-sm">
                <strong>{result.imported}</strong> students imported successfully.
                {result.skipped > 0 && (
                  <> <strong>{result.skipped}</strong> skipped.</>
                )}
              </p>
            </div>
          )}

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Preview</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-14">Row</TableHead>
                    <TableHead>Name</TableHead>
                    <TableHead>Email</TableHead>
                    <TableHead>Class</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Error</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {preview.map((row) => (
                    <TableRow key={row.rowNum} className={row.valid ? "" : "bg-destructive/5"}>
                      <TableCell className="text-muted-foreground text-xs">{row.rowNum}</TableCell>
                      <TableCell>{row.data.name || <span className="text-muted-foreground italic">empty</span>}</TableCell>
                      <TableCell className="text-sm">{row.data.email || <span className="text-muted-foreground italic">empty</span>}</TableCell>
                      <TableCell className="text-sm">
                        {row.data.className
                          ? `${row.data.className}${row.data.section ? " " + row.data.section : ""}`
                          : <span className="text-muted-foreground italic">empty</span>}
                      </TableCell>
                      <TableCell>
                        {row.valid ? (
                          <Badge variant="success">Valid</Badge>
                        ) : (
                          <Badge variant="destructive">Error</Badge>
                        )}
                      </TableCell>
                      <TableCell className="text-xs text-destructive">
                        {row.errors.join("; ") || "—"}
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}

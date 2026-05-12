"use client";

import { useState, useEffect, useCallback } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Database, Download, Trash2, RefreshCw, Play } from "lucide-react";

interface BackupFile {
  name: string;
  size: number;
  sizeLabel: string;
  createdAt: string;
}

interface BackupData {
  backups: BackupFile[];
  backupDir: string;
  maxBackups: number;
}

export default function BackupsPage() {
  const [data, setData] = useState<BackupData | null>(null);
  const [loading, setLoading] = useState(true);
  const [running, setRunning] = useState(false);
  const [deleting, setDeleting] = useState<string | null>(null);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchBackups = useCallback(async () => {
    setLoading(true);
    const res = await fetch("/api/superadmin/backup");
    if (res.ok) setData(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchBackups(); }, [fetchBackups]);

  async function runBackup() {
    if (!confirm("Run a new database backup now?")) return;
    setRunning(true);
    setMessage(null);
    const res = await fetch("/api/superadmin/backup", { method: "POST" });
    const j = await res.json();
    if (res.ok) {
      setMessage({ type: "success", text: `Backup created: ${j.fileName} (${j.sizeLabel})` });
      fetchBackups();
    } else {
      setMessage({ type: "error", text: j.error ?? "Backup failed" });
    }
    setRunning(false);
  }

  async function deleteBackup(name: string) {
    if (!confirm(`Delete backup "${name}"?`)) return;
    setDeleting(name);
    const res = await fetch(`/api/superadmin/backup?file=${encodeURIComponent(name)}`, { method: "DELETE" });
    if (res.ok) {
      setMessage({ type: "success", text: `Deleted ${name}` });
      fetchBackups();
    } else {
      const j = await res.json();
      setMessage({ type: "error", text: j.error ?? "Delete failed" });
    }
    setDeleting(null);
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Database Backups</h1>
          <p className="text-sm text-muted-foreground">
            {data ? `Stored in ${data.backupDir} · Max ${data.maxBackups} retained` : "Manage database backups"}
          </p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" size="sm" onClick={fetchBackups} disabled={loading}>
            <RefreshCw className="h-4 w-4 mr-1.5" /> Refresh
          </Button>
          <Button onClick={runBackup} disabled={running}>
            {running ? <RefreshCw className="h-4 w-4 mr-1.5 animate-spin" /> : <Play className="h-4 w-4 mr-1.5" />}
            {running ? "Running…" : "Run Backup"}
          </Button>
        </div>
      </div>

      {/* Message */}
      {message && (
        <div className={`text-sm px-4 py-3 rounded-lg border ${message.type === "success" ? "bg-green-50 text-green-700 border-green-200 dark:bg-green-950 dark:text-green-300" : "bg-destructive/10 text-destructive border-destructive/20"}`}>
          {message.text}
        </div>
      )}

      {/* Restore instructions */}
      <Card className="border-amber-200 bg-amber-50 dark:bg-amber-950/20 dark:border-amber-800">
        <CardContent className="pt-4">
          <p className="text-xs font-semibold text-amber-800 dark:text-amber-300 mb-2">Restore Instructions</p>
          <pre className="text-xs text-amber-700 dark:text-amber-400 font-mono whitespace-pre-wrap">
{`gunzip backup_<db>_<date>.sql.gz
mysql -h <host> -u <user> -p <database> < backup_<db>_<date>.sql`}
          </pre>
        </CardContent>
      </Card>

      {/* Backups Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base flex items-center gap-2">
            <Database className="h-4 w-4" /> Backup Files
            <span className="ml-auto text-xs font-normal text-muted-foreground">{data?.backups.length ?? 0} file{data?.backups.length !== 1 ? "s" : ""}</span>
          </CardTitle>
        </CardHeader>
        <CardContent className="p-0">
          {loading ? (
            <div className="py-12 text-center text-muted-foreground">Loading…</div>
          ) : data?.backups.length === 0 ? (
            <div className="py-12 text-center text-muted-foreground">
              <Database className="h-10 w-10 mx-auto mb-2 opacity-20" />
              <p>No backups yet. Run a backup to get started.</p>
            </div>
          ) : (
            <table className="w-full text-sm">
              <thead className="border-b bg-muted/50">
                <tr>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">File</th>
                  <th className="text-right px-4 py-3 font-medium text-muted-foreground">Size</th>
                  <th className="text-left px-4 py-3 font-medium text-muted-foreground">Created</th>
                  <th className="px-4 py-3 sr-only">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {data?.backups.map((b) => (
                  <tr key={b.name} className="hover:bg-muted/30">
                    <td className="px-4 py-3 font-mono text-xs">{b.name}</td>
                    <td className="px-4 py-3 text-right text-muted-foreground">{b.sizeLabel}</td>
                    <td className="px-4 py-3 text-muted-foreground text-xs">{new Date(b.createdAt).toLocaleString()}</td>
                    <td className="px-4 py-3 text-right">
                      <div className="flex items-center justify-end gap-1">
                        <Button variant="ghost" size="icon" className="h-8 w-8" asChild>
                          <a href={`/api/superadmin/backup/download?file=${encodeURIComponent(b.name)}`} download={b.name} aria-label="Download backup">
                            <Download className="h-4 w-4" />
                          </a>
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-8 w-8 text-destructive hover:text-destructive"
                          onClick={() => deleteBackup(b.name)}
                          disabled={deleting === b.name}
                          aria-label="Delete backup"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

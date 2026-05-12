"use client";

import { useEffect } from "react";
import { AlertTriangle, RefreshCw } from "lucide-react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error(JSON.stringify({
      level: "error",
      time: Date.now(),
      msg: "Global Next.js error",
      error: error.message,
      digest: error.digest,
      stack: error.stack,
    }));
  }, [error]);

  return (
    <html lang="en">
      <body style={{ fontFamily: "sans-serif", margin: 0, padding: 0, background: "#f9fafb" }}>
        <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: "100vh", textAlign: "center", padding: "2rem" }}>
          <div style={{ fontSize: "3rem", marginBottom: "1rem" }}>
            <AlertTriangle style={{ width: 56, height: 56, color: "#ef4444" }} />
          </div>
          <h1 style={{ fontSize: "1.5rem", fontWeight: 700, color: "#111827", marginBottom: "0.5rem" }}>
            Application Error
          </h1>
          <p style={{ color: "#6b7280", marginBottom: "1.5rem", maxWidth: 400 }}>
            {error.message ?? "An unexpected error occurred. Please try again."}
            {error.digest && (
              <span style={{ display: "block", fontSize: "0.75rem", marginTop: "0.25rem", fontFamily: "monospace", color: "#9ca3af" }}>
                Error ID: {error.digest}
              </span>
            )}
          </p>
          <button
            onClick={reset}
            style={{ display: "flex", alignItems: "center", gap: "0.375rem", padding: "0.5rem 1.25rem", background: "#3b82f6", color: "white", border: "none", borderRadius: "0.5rem", cursor: "pointer", fontSize: "0.875rem", fontWeight: 500 }}
          >
            <RefreshCw style={{ width: 14, height: 14 }} /> Try Again
          </button>
        </div>
      </body>
    </html>
  );
}

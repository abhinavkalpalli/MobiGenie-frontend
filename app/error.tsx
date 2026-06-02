"use client";

import { useEffect } from "react";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div
      className="min-h-screen flex items-center justify-center p-6"
      style={{ background: "#1a1a2e" }}
    >
      <div className="text-center max-w-sm">
        <div
          className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4 text-2xl"
          style={{ background: "#2a1a1a" }}
        >
          ⚠️
        </div>
        <h2 className="text-lg font-semibold mb-2" style={{ color: "#e2e2f0" }}>
          Something went wrong
        </h2>
        <p className="text-sm mb-6" style={{ color: "#6b6b8a" }}>
          {error.message || "An unexpected error occurred. Please try again."}
        </p>
        <div className="flex gap-3 justify-center">
          <button
            onClick={reset}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#6d28d9", color: "#fff" }}
          >
            Try again
          </button>
          <button
            onClick={() => (window.location.href = "/")}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#1e1e32", color: "#c4c4dc", border: "1px solid #2e2e4a" }}
          >
            Go home
          </button>
        </div>
      </div>
    </div>
  );
}

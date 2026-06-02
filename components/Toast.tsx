"use client";

import { useEffect } from "react";

export interface ToastData {
  id: string;
  message: string;
  type: "error" | "success" | "info";
}

interface Props {
  toasts: ToastData[];
  onDismiss: (id: string) => void;
}

export default function Toast({ toasts, onDismiss }: Props) {
  return (
    <div className="fixed bottom-4 right-4 z-50 flex flex-col gap-2 pointer-events-none">
      {toasts.map((t) => (
        <ToastItem key={t.id} toast={t} onDismiss={onDismiss} />
      ))}
    </div>
  );
}

function ToastItem({ toast, onDismiss }: { toast: ToastData; onDismiss: (id: string) => void }) {
  useEffect(() => {
    const timer = setTimeout(() => onDismiss(toast.id), 4000);
    return () => clearTimeout(timer);
  }, [toast.id, onDismiss]);

  const styles = {
    error: { background: "#2a1a1a", border: "1px solid #5a2020", color: "#f87171" },
    success: { background: "#0f2a1a", border: "1px solid #1a5a2a", color: "#34d399" },
    info: { background: "#1e1e32", border: "1px solid #2e2e4a", color: "#c4c4dc" },
  };

  const icons = { error: "⚠️", success: "✓", info: "ℹ" };

  return (
    <div
      className="flex items-center gap-3 px-4 py-3 rounded-xl text-sm pointer-events-auto shadow-lg"
      style={styles[toast.type]}
    >
      <span className="text-base">{icons[toast.type]}</span>
      <span className="flex-1 max-w-xs">{toast.message}</span>
      <button
        onClick={() => onDismiss(toast.id)}
        className="ml-1 opacity-60 hover:opacity-100 transition-opacity text-lg leading-none"
      >
        ×
      </button>
    </div>
  );
}

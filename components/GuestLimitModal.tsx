"use client";

import { useRouter } from "next/navigation";

interface Props {
  reason: "sessions" | "messages";
  onClose: () => void;
}

export default function GuestLimitModal({ reason, onClose }: Props) {
  const router = useRouter();

  const copy =
    reason === "sessions"
      ? {
          title: "Guest chat limit reached",
          body: "Guests can start up to 2 chats. Log in to keep chatting and save your history.",
        }
      : {
          title: "Guest message limit reached",
          body: "Guests can send up to 5 messages. Log in to continue the conversation.",
        };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-black/60" onClick={onClose} />
      <div
        className="relative w-full max-w-sm rounded-2xl p-6"
        style={{
          background: "rgba(15,15,30,0.95)",
          border: "1px solid rgba(99,102,241,0.4)",
          boxShadow: "0 0 30px rgba(99,102,241,0.25)",
        }}
      >
        <h2 className="text-lg font-semibold text-white mb-2">{copy.title}</h2>
        <p className="text-sm mb-6" style={{ color: "#a0c4ff" }}>
          {copy.body}
        </p>
        <div className="flex gap-3">
          <button
            onClick={onClose}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-colors"
            style={{ background: "rgba(255,255,255,0.08)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.15)" }}
          >
            Dismiss
          </button>
          <button
            onClick={() => router.push("/login")}
            className="flex-1 py-2.5 rounded-xl text-sm font-medium transition-opacity"
            style={{ background: "#6d28d9", color: "#fff", boxShadow: "0 0 20px rgba(109,40,217,0.6)" }}
          >
            Log In
          </button>
        </div>
      </div>
    </div>
  );
}

"use client";

import { useState, KeyboardEvent } from "react";

interface Props {
  onSend: (message: string) => void;
  isStreaming: boolean;
  disabled?: boolean;
}

export default function InputBox({ onSend, isStreaming, disabled }: Props) {
  const [input, setInput] = useState("");

  const handleSend = () => {
    if (!input.trim() || isStreaming || disabled) return;
    onSend(input.trim());
    setInput("");
  };

  const handleKeyDown = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const suggestions = [
    "Phone under ₹20,000 with 5G",
    "Best camera phone under ₹40,000",
    "Gaming phone under ₹30,000",
    "Phone with 5000mAh battery",
  ];

  return (
    <div className="px-4 pb-4 pt-2 flex-shrink-0" style={{ borderTop: "1px solid #2e2e4a" }}>
      {/* Suggestion chips */}
      {!disabled && (
        <div className="flex gap-2 mb-3 overflow-x-auto pb-1 scrollbar-hide">
          {suggestions.map((s) => (
            <button
              key={s}
              onClick={() => setInput(s)}
              className="flex-shrink-0 text-xs px-3 py-1.5 rounded-full transition-colors"
              style={{ background: "#1e1e32", color: "#8b8ba7", border: "1px solid #2e2e4a" }}
              onMouseEnter={(e) => {
                e.currentTarget.style.background = "#252540";
                e.currentTarget.style.color = "#c4c4dc";
              }}
              onMouseLeave={(e) => {
                e.currentTarget.style.background = "#1e1e32";
                e.currentTarget.style.color = "#8b8ba7";
              }}
            >
              {s}
            </button>
          ))}
        </div>
      )}

      {/* Input row */}
      <div
        className="flex items-end gap-3 rounded-xl px-4 py-3 transition-colors"
        style={{ background: "#1e1e32", border: "1px solid #2e2e4a" }}
        onFocus={(e) => (e.currentTarget.style.borderColor = "#6d28d9")}
        onBlur={(e) => (e.currentTarget.style.borderColor = "#2e2e4a")}
      >
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Ask me about phones…"
          rows={1}
          disabled={isStreaming}
          className="flex-1 bg-transparent resize-none outline-none text-sm max-h-32 disabled:opacity-40"
          style={{ color: "#e2e2f0" }}
          onInput={(e) => {
            const t = e.target as HTMLTextAreaElement;
            t.style.height = "auto";
            t.style.height = t.scrollHeight + "px";
          }}
        />

        <button
          onClick={handleSend}
          disabled={!input.trim() || isStreaming}
          className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 transition-opacity"
          style={{
            background: input.trim() && !isStreaming ? "#6d28d9" : "#2e2e4a",
            color: "#fff",
          }}
        >
          {isStreaming ? (
            <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
          ) : (
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
                d="M12 19l9 2-9-18-9 18 9-2zm0 0v-8" />
            </svg>
          )}
        </button>
      </div>

      <p className="text-center mt-2 text-xs" style={{ color: "#3b3b5a" }}>
        Enter to send · Shift+Enter for new line
      </p>
    </div>
  );
}

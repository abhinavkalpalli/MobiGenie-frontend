"use client";

import { useEffect, useRef } from "react";
import { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  loadingMessages: boolean;
  messagesError: string | null;
  onSend: (message: string) => void;
  onRetryMessages: () => void;
}

export default function ChatWindow({ messages, isStreaming, loadingMessages, messagesError, onSend, onRetryMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, isStreaming]);

  if (loadingMessages) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#1a1a2e" }}>
        <div className="text-center">
          <div className="w-7 h-7 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
          <p className="text-sm" style={{ color: "#6b6b8a" }}>Loading messages…</p>
        </div>
      </div>
    );
  }

  if (messagesError) {
    return (
      <div className="flex-1 flex items-center justify-center" style={{ background: "#1a1a2e" }}>
        <div className="text-center px-6">
          <div
            className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl"
            style={{ background: "#2a1a1a" }}
          >
            ⚠️
          </div>
          <p className="text-sm font-medium mb-1" style={{ color: "#e2e2f0" }}>
            Failed to load messages
          </p>
          <p className="text-xs mb-4 max-w-xs" style={{ color: "#6b6b8a" }}>
            {messagesError}
          </p>
          <button
            onClick={onRetryMessages}
            className="px-4 py-2 rounded-lg text-sm font-medium"
            style={{ background: "#6d28d9", color: "#fff" }}
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex-1 flex flex-col min-h-0" style={{ background: "#1a1a2e" }}>
      {/* Messages */}
      <div className="flex-1 overflow-y-auto min-h-0 py-6">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div
              className="w-14 h-14 rounded-2xl flex items-center justify-center mb-5"
              style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
            >
              <span className="text-2xl">📱</span>
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#e2e2f0" }}>
              Welcome to MobiGenie
            </h2>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#6b6b8a" }}>
              Your AI phone advisor. Tell me your budget and requirements and I&apos;ll find the perfect phone for you.
            </p>
            <div className="grid grid-cols-2 gap-2 mt-7 max-w-xs w-full">
              {[
                { icon: "💰", text: "Best phones under ₹20,000" },
                { icon: "📷", text: "Top camera phones" },
                { icon: "🎮", text: "Best gaming phones" },
                { icon: "🔋", text: "Long battery phones" },
              ].map((item) => (
                <button
                  key={item.text}
                  onClick={() => onSend(item.text)}
                  className="flex items-center gap-2 p-3 rounded-xl text-left transition-colors text-sm"
                  style={{ background: "#1e1e32", border: "1px solid #2e2e4a", color: "#a0a0c0" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "#252540";
                    e.currentTarget.style.borderColor = "#6d28d9";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "#1e1e32";
                    e.currentTarget.style.borderColor = "#2e2e4a";
                  }}
                >
                  <span>{item.icon}</span>
                  <span className="text-xs leading-snug">{item.text}</span>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <div className="space-y-1">
            {messages.map((message) => (
              <MessageBubble key={message.id} message={message} />
            ))}
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      <InputBox onSend={onSend} isStreaming={isStreaming} disabled={false} />
    </div>
  );
}

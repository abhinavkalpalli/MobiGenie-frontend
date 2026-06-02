"use client";

import React from "react";
import { ChatMessage } from "@/types";
import PhoneCard from "./PhoneCard";

interface Props {
  message: ChatMessage;
}

function renderInline(text: string): React.ReactNode {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) => {
    if (part.startsWith("**") && part.endsWith("**")) {
      return <strong key={i} style={{ color: "#e2e2f0", fontWeight: 600 }}>{part.slice(2, -2)}</strong>;
    }
    return part;
  });
}

export default function MessageBubble({ message }: Props) {
  const isUser = message.role === "user";

  return (
    <div className={`flex ${isUser ? "justify-end" : "justify-start"} px-4 py-1`}>
      <div className={`flex items-start gap-3 ${isUser ? "flex-row-reverse" : "flex-row"} max-w-3xl w-full`}>

        {/* Avatar */}
        <div
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold flex-shrink-0 mt-1"
          style={
            isUser
              ? { background: "#6d28d9", color: "#fff" }
              : { background: "linear-gradient(135deg, #6d28d9, #4f46e5)", color: "#fff" }
          }
        >
          {isUser ? "U" : "M"}
        </div>

        {/* Content */}
        <div className={`flex-1 ${isUser ? "flex justify-end" : ""}`}>
          {isUser ? (
            <div
              className="px-4 py-2.5 rounded-2xl rounded-tr-sm text-sm leading-relaxed max-w-lg"
              style={{ background: "#6d28d9", color: "#f0f0ff" }}
            >
              {message.content}
            </div>
          ) : (
            <div
              className="text-sm leading-relaxed px-4 py-3 rounded-2xl rounded-tl-sm"
              style={
                message.isError
                  ? { background: "#2a1a1a", color: "#f87171", border: "1px solid #5a2020" }
                  : { background: "#1e1e32", color: "#c4c4dc", border: "1px solid #2e2e4a" }
              }
            >
              {/* Phone Cards */}
              {message.phones && message.phones.length > 0 && (
                <div className="mb-4">
                  <p className="text-xs font-medium mb-2" style={{ color: "#6b6b8a" }}>
                    {message.phones.length} phone{message.phones.length !== 1 ? "s" : ""} found
                  </p>
                  <div className="grid grid-cols-1 gap-2 sm:grid-cols-2">
                    {message.phones.map((phone) => (
                      <PhoneCard
                        key={phone._id}
                        phone={phone}
                        isRecommended={message.recommendedIds?.includes(phone._id)}
                      />
                    ))}
                  </div>
                </div>
              )}

              {/* Text */}
              {message.content && (
                <div>
                  {message.content.split("\n").map((line, i) => {
                    const numbered = line.match(/^(\d+)\.\s+(.*)/);
                    if (numbered) {
                      return (
                        <div key={i} className="flex gap-2 mt-1.5">
                          <span className="font-semibold shrink-0" style={{ color: "#a0a0c0" }}>{numbered[1]}.</span>
                          <span>{renderInline(numbered[2])}</span>
                        </div>
                      );
                    }
                    const bullet = line.match(/^[*-]\s+(.*)/);
                    if (bullet) {
                      return (
                        <div key={i} className="flex gap-2 mt-1 ml-2">
                          <span className="shrink-0 mt-0.5" style={{ color: "#6d28d9" }}>•</span>
                          <span>{renderInline(bullet[1])}</span>
                        </div>
                      );
                    }
                    if (line.trim() === "") return <div key={i} className="h-2" />;
                    return <p key={i} className="mt-0.5">{renderInline(line)}</p>;
                  })}
                  {message.isStreaming && (
                    <span
                      className="inline-block w-0.5 h-4 ml-0.5 align-middle animate-pulse"
                      style={{ background: "#6d28d9" }}
                    />
                  )}
                </div>
              )}

              {/* Streaming dots */}
              {message.isStreaming && !message.content && (
                <div className="flex items-center gap-1 py-1">
                  <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.3s]" style={{ background: "#6d28d9" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce [animation-delay:-0.15s]" style={{ background: "#6d28d9" }} />
                  <div className="w-2 h-2 rounded-full animate-bounce" style={{ background: "#6d28d9" }} />
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

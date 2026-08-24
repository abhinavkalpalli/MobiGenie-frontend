"use client";

import React from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { ChatMessage } from "@/types";
import PhoneCard from "./PhoneCard";

interface Props {
  message: ChatMessage;
}

const markdownComponents = {
  h1: (props: React.ComponentPropsWithoutRef<"h1">) => (
    <h1 className="text-lg font-semibold mt-3 mb-2" style={{ color: "#f0f0ff" }} {...props} />
  ),
  h2: (props: React.ComponentPropsWithoutRef<"h2">) => (
    <h2 className="text-base font-semibold mt-3 mb-1.5" style={{ color: "#f0f0ff" }} {...props} />
  ),
  h3: (props: React.ComponentPropsWithoutRef<"h3">) => (
    <h3 className="text-sm font-semibold mt-2.5 mb-1" style={{ color: "#e2e2f0" }} {...props} />
  ),
  p: (props: React.ComponentPropsWithoutRef<"p">) => <p className="mt-1.5 leading-relaxed" {...props} />,
  strong: (props: React.ComponentPropsWithoutRef<"strong">) => (
    <strong style={{ color: "#e2e2f0", fontWeight: 600 }} {...props} />
  ),
  em: (props: React.ComponentPropsWithoutRef<"em">) => <em style={{ color: "#c4c4dc" }} {...props} />,
  ul: (props: React.ComponentPropsWithoutRef<"ul">) => (
    <ul className="mt-1.5 ml-2 space-y-1 list-disc list-inside" {...props} />
  ),
  ol: (props: React.ComponentPropsWithoutRef<"ol">) => (
    <ol className="mt-1.5 ml-2 space-y-1 list-decimal list-inside" {...props} />
  ),
  li: (props: React.ComponentPropsWithoutRef<"li">) => <li className="leading-relaxed" {...props} />,
  hr: () => <hr className="my-3" style={{ borderColor: "#2e2e4a" }} />,
  a: (props: React.ComponentPropsWithoutRef<"a">) => (
    <a
      className="underline"
      style={{ color: "#a78bfa" }}
      target="_blank"
      rel="noopener noreferrer"
      {...props}
    />
  ),
  code: (props: React.ComponentPropsWithoutRef<"code">) => (
    <code
      className="px-1 py-0.5 rounded text-xs"
      style={{ background: "#12121f", color: "#e2e2f0" }}
      {...props}
    />
  ),
  table: (props: React.ComponentPropsWithoutRef<"table">) => (
    <div className="overflow-x-auto mt-2 mb-1 rounded-lg" style={{ border: "1px solid #2e2e4a" }}>
      <table className="w-full text-xs border-collapse" {...props} />
    </div>
  ),
  thead: (props: React.ComponentPropsWithoutRef<"thead">) => (
    <thead style={{ background: "#12121f" }} {...props} />
  ),
  th: (props: React.ComponentPropsWithoutRef<"th">) => (
    <th
      className="text-left font-semibold px-3 py-2"
      style={{ color: "#a0a0c0", borderBottom: "1px solid #2e2e4a" }}
      {...props}
    />
  ),
  td: (props: React.ComponentPropsWithoutRef<"td">) => (
    <td className="px-3 py-2 align-top" style={{ borderBottom: "1px solid #2e2e4a" }} {...props} />
  ),
};

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
                  <ReactMarkdown remarkPlugins={[remarkGfm]} components={markdownComponents}>
                    {message.content}
                  </ReactMarkdown>
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

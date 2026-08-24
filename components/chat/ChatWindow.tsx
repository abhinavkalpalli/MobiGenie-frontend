"use client";

import { useEffect, useRef, useState, useCallback } from "react";
import { ChatMessage } from "@/types";
import MessageBubble from "./MessageBubble";
import InputBox from "./InputBox";
import Loader from "@/components/Loader";

interface Props {
  messages: ChatMessage[];
  isStreaming: boolean;
  loadingMessages: boolean;
  messagesError: string | null;
  onSend: (message: string) => void;
  onRetryMessages: () => void;
}

const NEAR_BOTTOM_THRESHOLD = 80; // px
const BUTTON_AUTO_HIDE_MS = 5000;

export default function ChatWindow({ messages, isStreaming, loadingMessages, messagesError, onSend, onRetryMessages }: Props) {
  const bottomRef = useRef<HTMLDivElement>(null);
  const scrollContainerRef = useRef<HTMLDivElement>(null);
  const hideTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const [isNearBottom, setIsNearBottom] = useState(true);
  const [showScrollButton, setShowScrollButton] = useState(false);

  const isNearBottomNow = () => {
    const el = scrollContainerRef.current;
    if (!el) return true;
    return el.scrollHeight - el.scrollTop - el.clientHeight <= NEAR_BOTTOM_THRESHOLD;
  };

  const armAutoHide = useCallback(() => {
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    hideTimerRef.current = setTimeout(() => setShowScrollButton(false), BUTTON_AUTO_HIDE_MS);
  }, []);

  const handleScroll = useCallback(() => {
    const nearBottom = isNearBottomNow();
    setIsNearBottom(nearBottom);
    if (nearBottom) {
      setShowScrollButton(false);
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    } else {
      setShowScrollButton(true);
      armAutoHide();
    }
  }, [armAutoHide]);

  useEffect(() => {
    return () => {
      if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
    };
  }, []);

  const scrollToBottom = () => {
    bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    setShowScrollButton(false);
    if (hideTimerRef.current) clearTimeout(hideTimerRef.current);
  };

  // Auto-scroll on new messages/streaming, but only if the user is already
  // near the bottom — otherwise it would yank them back down while reading.
  useEffect(() => {
    if (isNearBottom) {
      bottomRef.current?.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming, isNearBottom]);

  return (
    <div className="flex-1 flex flex-col min-h-0 relative" style={{ background: "transparent" }}>
      {/* Messages */}
      <div
        ref={scrollContainerRef}
        onScroll={handleScroll}
        className="flex-1 overflow-y-auto min-h-0 py-6 custom-scrollbar"
      >
        {loadingMessages ? (
          <div className="flex items-center justify-center h-full">
            <Loader label="Loading messages…" />
          </div>
        ) : messagesError ? (
          <div className="flex items-center justify-center h-full">
            <div className="text-center px-6">
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center mx-auto mb-3 text-xl" style={{ background: "#2a1a1a" }}>⚠️</div>
              <p className="text-sm font-medium mb-1" style={{ color: "#e2e2f0" }}>Failed to load messages</p>
              <p className="text-xs mb-4 max-w-xs" style={{ color: "#6b6b8a" }}>{messagesError}</p>
              <button onClick={onRetryMessages} className="px-4 py-2 rounded-lg text-sm font-medium" style={{ background: "#6d28d9", color: "#fff" }}>Retry</button>
            </div>
          </div>
        ) : messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-center px-6">
            <div className="w-20 h-20 flex items-center justify-center mb-5">
              <img src="/MobiGeinie_Chat_Genie_Face-removebg-preview.png" alt="MobiGenie" className="w-full h-full object-contain scale-150" style={{ filter: "drop-shadow(0 0 8px rgba(56,189,248,0.9)) drop-shadow(0 0 20px rgba(99,102,241,0.7)) drop-shadow(0 0 40px rgba(56,189,248,0.4)) brightness(1.15)" }} />
            </div>
            <h2 className="text-xl font-semibold mb-2" style={{ color: "#ffffff", textShadow: "0 0 20px rgba(56,189,248,0.8), 0 0 40px rgba(99,102,241,0.5)" }}>
              Welcome to MobiGenie
            </h2>
            <p className="text-sm max-w-sm leading-relaxed" style={{ color: "#e2e2f0" }}>
              Your AI phone advisor. Tell me your budget and requirements and I&apos;ll find the perfect phone for you.
            </p>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 mt-7 max-w-xs w-full">
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
                  style={{ background: "rgba(255,255,255,0.08)", border: "1px solid rgba(99,102,241,0.4)", color: "#ffffff", backdropFilter: "blur(10px)" }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = "rgba(109,40,217,0.3)";
                    e.currentTarget.style.borderColor = "rgba(109,40,217,0.8)";
                    e.currentTarget.style.boxShadow = "0 0 12px rgba(109,40,217,0.4)";
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = "rgba(255,255,255,0.08)";
                    e.currentTarget.style.borderColor = "rgba(99,102,241,0.4)";
                    e.currentTarget.style.boxShadow = "none";
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

      {showScrollButton && (
        <button
          onClick={scrollToBottom}
          aria-label="Scroll to bottom"
          className="absolute left-1/2 -translate-x-1/2 flex items-center justify-center w-9 h-9 rounded-full transition-opacity duration-300"
          style={{
            bottom: "88px",
            background: "#1e1e32",
            border: "1px solid #2e2e4a",
            color: "#e2e2f0",
            boxShadow: "0 4px 14px rgba(0,0,0,0.35)",
          }}
        >
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
            <path d="M12 5v14M5 12l7 7 7-7" />
          </svg>
        </button>
      )}

      <InputBox onSend={onSend} isStreaming={isStreaming} disabled={loadingMessages} />
    </div>
  );
}

"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";

export default function HomePage() {
  const router = useRouter();
  const { user, loading: authLoading, logout } = useAuth();
  const { toasts, addToast, dismiss } = useToast();

  const {
    sessions,
    activeSessionId,
    messages,
    isStreaming,
    loadingSessions,
    loadingMessages,
    sessionsError,
    messagesError,
    loadSessions,
    createSession,
    loadSession,
    sendMessage,
    startNewChat,
  } = useChat();

  useEffect(() => {
    if (!authLoading && !getToken()) {
      router.push("/login");
    }
  }, [authLoading, router]);

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a1a2e" }}>
        <div className="text-center">
          <div className="w-8 h-8 border-2 border-violet-500 border-t-transparent rounded-full animate-spin mx-auto mb-3" />
          <p className="text-sm" style={{ color: "#8b8ba7" }}>Loading MobiGenie...</p>
        </div>
      </div>
    );
  }

  const handleSend = async (message: string) => {
    let sessionId = activeSessionId;
    if (!sessionId) {
      try {
        const session = await createSession(
          message.length > 30 ? message.substring(0, 30) + "..." : message,
        );
        sessionId = session?._id ?? null;
      } catch (err) {
        addToast(err instanceof Error ? err.message : "Failed to create chat.", "error");
        return;
      }
    }
    await sendMessage(message, sessionId || undefined);
  };

  const activeTitle = activeSessionId
    ? sessions.find((s) => s._id === activeSessionId)?.title || "Chat"
    : "New Chat";

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: "#1a1a2e" }}>
      <Toast toasts={toasts} onDismiss={dismiss} />
      <Sidebar
        user={user}
        sessions={sessions}
        activeSessionId={activeSessionId}
        loading={loadingSessions}
        sessionsError={sessionsError}
        onNewChat={startNewChat}
        onSelectSession={loadSession}
        onLoadSessions={loadSessions}
        onLogout={logout}
      />

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="px-6 py-3 flex items-center justify-between border-b flex-shrink-0"
          style={{ background: "#1e1e32", borderColor: "#2e2e4a" }}
        >
          <div>
            <h2 className="font-medium text-sm" style={{ color: "#e2e2f0" }}>
              {activeTitle}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#6b6b8a" }}>
              {isStreaming ? "MobiGenie is thinking…" : "AI Phone Advisor"}
            </p>
          </div>
          <div className="flex items-center gap-2">
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-xs" style={{ color: "#6b6b8a" }}>Online</span>
          </div>
        </div>

        <ChatWindow
          messages={messages}
          isStreaming={isStreaming}
          loadingMessages={loadingMessages}
          messagesError={messagesError}
          onSend={handleSend}
          onRetryMessages={() => activeSessionId && loadSession(activeSessionId)}
        />
      </div>
    </div>
  );
}

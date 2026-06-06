"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { getToken } from "@/lib/auth";
import { useAuth } from "@/hooks/useAuth";
import { useChat } from "@/hooks/useChat";
import Sidebar from "@/components/chat/Sidebar";
import ChatWindow from "@/components/chat/ChatWindow";
import Toast from "@/components/Toast";
import { useToast } from "@/hooks/useToast";
import Loader from "@/components/Loader";

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

  if (authLoading || !user) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ background: "#1a1a2e" }}>
        <Loader label="Loading MobiGenie..." />
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
    <div
      className="flex h-screen overflow-hidden"
      style={{
        backgroundImage: `linear-gradient(rgba(10,10,25,0.25), rgba(10,10,25,0.25)), url('/Firefly_Gemini Flash.png')`,
        backgroundSize: "110%",
        backgroundPosition: "60% center",
        backgroundRepeat: "no-repeat",
      }}
    >
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
          style={{ background: "rgba(10,10,25,0.35)", borderColor: "rgba(99,102,241,0.3)", backdropFilter: "blur(20px)" }}
        >
          <div>
            <h2 className="font-medium text-sm" style={{ color: "#e2e2f0" }}>
              {activeTitle}
            </h2>
            <p className="text-xs mt-0.5" style={{ color: "#6b6b8a" }}>
              <span style={{ color: "#a0c4ff" }}>{isStreaming ? "MobiGenie is thinking…" : "AI Phone Advisor"}</span>
            </p>
          </div>
          <div className="flex items-center gap-3">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="text-xs px-3 py-1 rounded-md bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors font-medium"
              >
                Admin Panel
              </Link>
            )}
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

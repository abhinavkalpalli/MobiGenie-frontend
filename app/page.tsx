"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
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
  const [sidebarOpen, setSidebarOpen] = useState(false);

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
    if (!authLoading && !user) {
      router.push("/login");
    }
  }, [authLoading, user, router]);

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
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <Toast toasts={toasts} onDismiss={dismiss} />

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/60 z-20 md:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <div className={`
        fixed md:relative z-30 md:z-auto h-full
        transition-transform duration-300 ease-in-out
        ${sidebarOpen ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
      `}>
        <Sidebar
          user={user}
          sessions={sessions}
          activeSessionId={activeSessionId}
          loading={loadingSessions}
          sessionsError={sessionsError}
          onNewChat={() => { startNewChat(); setSidebarOpen(false); }}
          onSelectSession={(id) => { loadSession(id); setSidebarOpen(false); }}
          onLoadSessions={loadSessions}
          onLogout={logout}
        />
      </div>

      <div className="flex-1 flex flex-col min-w-0">
        {/* Header */}
        <div
          className="px-3 sm:px-6 py-3 flex items-center justify-between border-b flex-shrink-0"
          style={{ background: "rgba(10,10,25,0.35)", borderColor: "rgba(99,102,241,0.3)", backdropFilter: "blur(20px)" }}
        >
          <div className="flex items-center gap-2 sm:gap-3 min-w-0">
            {/* Hamburger — mobile only */}
            <button
              className="md:hidden flex-shrink-0 p-1.5 rounded-lg"
              style={{ background: "rgba(255,255,255,0.08)" }}
              onClick={() => setSidebarOpen(true)}
            >
              <svg className="w-5 h-5 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
            <div className="min-w-0">
              <h2 className="font-medium text-sm truncate" style={{ color: "#e2e2f0" }}>{activeTitle}</h2>
              <p className="text-xs mt-0.5 hidden sm:block" style={{ color: "#a0c4ff" }}>
                {isStreaming ? "MobiGenie is thinking…" : "AI Phone Advisor"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 flex-shrink-0">
            {user?.role === "admin" && (
              <Link
                href="/admin"
                className="text-xs px-2 sm:px-3 py-1 rounded-md bg-indigo-600/20 text-indigo-400 hover:bg-indigo-600/40 transition-colors font-medium"
              >
                Admin
              </Link>
            )}
            <div className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
            <span className="text-xs hidden sm:block" style={{ color: "#6b6b8a" }}>Online</span>
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

"use client";

import { useEffect } from "react";
import { Session, User } from "@/types";

interface Props {
  user: User | null;
  sessions: Session[];
  activeSessionId: string | null;
  loading: boolean;
  sessionsError: string | null;
  onNewChat: () => void;
  onSelectSession: (id: string) => void;
  onLoadSessions: () => void;
  onLogout: () => void;
}

export default function Sidebar({
  user,
  sessions,
  activeSessionId,
  loading,
  sessionsError,
  onNewChat,
  onSelectSession,
  onLoadSessions,
  onLogout,
}: Props) {
  useEffect(() => {
    onLoadSessions();
  }, [onLoadSessions]);

  const formatTime = (dateStr: string) => {
    const date = new Date(dateStr);
    const now = new Date();
    const days = Math.floor((now.getTime() - date.getTime()) / 86400000);
    if (days === 0) return "Today";
    if (days === 1) return "Yesterday";
    if (days < 7) return `${days}d ago`;
    return date.toLocaleDateString();
  };

  return (
    <div
      className="w-60 h-full flex flex-col flex-shrink-0"
      style={{ background: "#13131f", borderRight: "1px solid #2e2e4a" }}
    >
      {/* Logo */}
      <div className="px-4 py-4 flex items-center gap-2.5" style={{ borderBottom: "1px solid #2e2e4a" }}>
        <div className="w-7 h-7 rounded-lg flex items-center justify-center bg-gradient-to-br from-violet-600 to-indigo-600">
          <span className="text-sm">📱</span>
        </div>
        <div>
          <p className="text-sm font-semibold" style={{ color: "#e2e2f0" }}>MobiGenie</p>
          <p className="text-xs" style={{ color: "#6b6b8a" }}>AI Phone Advisor</p>
        </div>
      </div>

      {/* New Chat */}
      <div className="px-3 py-3">
        <button
          onClick={onNewChat}
          className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium transition-colors"
          style={{ background: "#6d28d9", color: "#fff" }}
          onMouseEnter={(e) => (e.currentTarget.style.background = "#7c3aed")}
          onMouseLeave={(e) => (e.currentTarget.style.background = "#6d28d9")}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
          New Chat
        </button>
      </div>

      {/* Sessions */}
      <div className="flex-1 overflow-y-auto px-2 pb-2">
        <p
          className="text-xs font-medium uppercase tracking-wider px-2 mb-1.5"
          style={{ color: "#4b4b6b" }}
        >
          Recent
        </p>

        {loading ? (
          <div className="space-y-1.5 px-1">
            {[1, 2, 3].map((i) => (
              <div key={i} className="h-10 rounded-lg animate-pulse" style={{ background: "#1e1e32" }} />
            ))}
          </div>
        ) : sessionsError ? (
          <div className="px-2 py-4 text-center">
            <p className="text-xs mb-2" style={{ color: "#f87171" }}>{sessionsError}</p>
            <button
              onClick={onLoadSessions}
              className="text-xs px-3 py-1.5 rounded-lg"
              style={{ background: "#1e1e32", color: "#a78bfa", border: "1px solid #2e2e4a" }}
            >
              Retry
            </button>
          </div>
        ) : sessions.length === 0 ? (
          <p className="text-xs text-center py-6" style={{ color: "#4b4b6b" }}>No chats yet</p>
        ) : (
          <div className="space-y-0.5">
            {sessions.map((session) => {
              const isActive = activeSessionId === session._id;
              return (
                <button
                  key={session._id}
                  onClick={() => onSelectSession(session._id)}
                  className="w-full text-left px-3 py-2.5 rounded-lg transition-colors"
                  style={{
                    background: isActive ? "#2a2a42" : "transparent",
                    color: isActive ? "#e2e2f0" : "#8b8ba7",
                  }}
                  onMouseEnter={(e) => {
                    if (!isActive) e.currentTarget.style.background = "#1e1e32";
                  }}
                  onMouseLeave={(e) => {
                    if (!isActive) e.currentTarget.style.background = "transparent";
                  }}
                >
                  <p className="text-xs font-medium truncate">{session.title}</p>
                  <p className="text-xs truncate mt-0.5" style={{ color: "#4b4b6b" }}>
                    {formatTime(session.updatedAt)}
                  </p>
                </button>
              );
            })}
          </div>
        )}
      </div>

      {/* User */}
      <div className="px-3 py-3 flex items-center justify-between" style={{ borderTop: "1px solid #2e2e4a" }}>
        <div className="flex items-center gap-2 min-w-0">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold flex-shrink-0"
            style={{ background: "#6d28d9", color: "#fff" }}
          >
            {user?.name?.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <p className="text-xs font-medium truncate" style={{ color: "#c4c4dc" }}>{user?.name}</p>
            <p className="text-xs truncate" style={{ color: "#4b4b6b" }}>{user?.email}</p>
          </div>
        </div>
        <button
          onClick={onLogout}
          className="flex-shrink-0 ml-1 p-1 rounded transition-colors"
          style={{ color: "#4b4b6b" }}
          onMouseEnter={(e) => (e.currentTarget.style.color = "#e2e2f0")}
          onMouseLeave={(e) => (e.currentTarget.style.color = "#4b4b6b")}
          title="Logout"
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2}
              d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
          </svg>
        </button>
      </div>
    </div>
  );
}

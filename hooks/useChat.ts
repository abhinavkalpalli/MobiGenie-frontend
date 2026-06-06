"use client";

import { useState, useCallback } from "react";
import { streamQuery, sessionApi } from "@/lib/api";
import { ChatMessage, Session, Message, Phone, ParsedQuery } from "@/types";

export function useChat() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [isStreaming, setIsStreaming] = useState(false);
  const [loadingSessions, setLoadingSessions] = useState(false);
  const [loadingMessages, setLoadingMessages] = useState(false);
  const [sessionsError, setSessionsError] = useState<string | null>(null);
  const [messagesError, setMessagesError] = useState<string | null>(null);

  // ─── Load all sessions ────────────────────────
  const loadSessions = useCallback(async () => {
    setLoadingSessions(true);
    setSessionsError(null);
    try {
      const res = await sessionApi.getAll();
      setSessions((res.data as Session[]) || []);
    } catch (err) {
      setSessionsError(err instanceof Error ? err.message : "Failed to load chats.");
    } finally {
      setLoadingSessions(false);
    }
  }, []);

  // ─── Create new session ───────────────────────
  const createSession = useCallback(async (title?: string) => {
    try {
      const res = await sessionApi.create(title);
      const newSession = res.data as Session;
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(newSession._id);
      setMessages([]);
      return newSession;
    } catch (err) {
      const message = err instanceof Error ? err.message : "Failed to create chat.";
      throw new Error(message);
    }
  }, []);

  // ─── Load session messages ─────────────────────
  const loadSession = useCallback(async (sessionId: string) => {
    setLoadingMessages(true);
    setMessagesError(null);
    setActiveSessionId(sessionId);

    try {
      const res = await sessionApi.getMessages(sessionId);
      const msgs: Message[] = (res.data as Message[]) || [];

      const chatMessages: ChatMessage[] = msgs.map((m) => {
        const phones =
          m.suggestedPhones?.length > 0
            ? m.suggestedPhones.map((sp) => {
                if (sp.phoneId && typeof sp.phoneId === "object") {
                  return sp.phoneId as Phone;
                }
                return {
                  _id: sp.phoneId as string,
                  name: sp.name,
                  price: { current: sp.price, original: sp.price, currency: "", discount: 0 },
                  image: sp.image,
                } as Phone;
              })
            : undefined;

        // Derive recommendedIds from phones with matchScore >= 1.0
        const recommendedIds = m.suggestedPhones?.length > 0
          ? m.suggestedPhones
              .filter((sp) => (sp.matchScore ?? 0) >= 1.0)
              .map((sp) =>
                typeof sp.phoneId === "object"
                  ? (sp.phoneId as any)._id?.toString() ?? (sp.phoneId as any).toString()
                  : sp.phoneId as string
              )
          : undefined;

        return {
          id: m._id,
          role: m.role,
          content: m.content,
          phones,
          parsed: m.parsedQuery ?? undefined,
          recommendedIds,
        };
      });

      setMessages(chatMessages);
    } catch (err) {
      setMessagesError(err instanceof Error ? err.message : "Failed to load messages.");
    } finally {
      setLoadingMessages(false);
    }
  }, []);

  // ─── Send query with streaming ─────────────────
  const sendMessage = useCallback(
    async (query: string, sessionId?: string) => {
      if (isStreaming) return;

      setIsStreaming(true);

      const userMsg: ChatMessage = {
        id: Date.now().toString(),
        role: "user",
        content: query,
      };

      const assistantMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        role: "assistant",
        content: "",
        isStreaming: true,
      };

      setMessages((prev) => [...prev, userMsg, assistantMsg]);
      const assistantId = assistantMsg.id;

      await streamQuery(
        query,
        sessionId || activeSessionId || undefined,

        (phones: Phone[], parsed: ParsedQuery) => {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, phones, parsed } : m),
          );
        },

        (chunk: string) => {
          setMessages((prev) =>
            prev.map((m) => m.id === assistantId ? { ...m, content: m.content + chunk } : m),
          );
        },

        (recommendedIds: string[]) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId ? { ...m, isStreaming: false, recommendedIds } : m,
            ),
          );
          setIsStreaming(false);
          loadSessions();
        },

        (error: string) => {
          setMessages((prev) =>
            prev.map((m) =>
              m.id === assistantId
                ? { ...m, content: error, isStreaming: false, isError: true }
                : m,
            ),
          );
          setIsStreaming(false);
        },
      );
    },
    [isStreaming, activeSessionId, loadSessions],
  );

  // ─── Start new chat ───────────────────────────
  const startNewChat = useCallback(() => {
    setActiveSessionId(null);
    setMessages([]);
    setMessagesError(null);
  }, []);

  return {
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
    setActiveSessionId,
  };
}

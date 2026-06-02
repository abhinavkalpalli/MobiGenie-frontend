import type { Phone, ParsedQuery } from "@/types";
import { getToken, getRefreshToken, setTokens, clearTokens } from "./auth";

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

interface AuthTokens {
  accessToken: string;
  refreshToken: string;
}

const BASE_URL =
  process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";

const TIMEOUT_MS = 15000;

// ════════════════════════════════════════════
// Helpers
// ════════════════════════════════════════════

async function withTimeout<T>(promise: Promise<T>, ms: number): Promise<T> {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), ms);
  try {
    const result = await promise;
    clearTimeout(timer);
    return result;
  } catch (err) {
    clearTimeout(timer);
    if ((err as Error)?.name === "AbortError") throw new Error("Request timed out. Please try again.");
    throw err;
  }
}

function isNetworkError(err: unknown): boolean {
  return err instanceof TypeError && err.message === "Failed to fetch";
}

// ════════════════════════════════════════════
// Base Fetch
// ════════════════════════════════════════════

const apiFetch = async (
  endpoint: string,
  options: RequestInit = {},
): Promise<ApiResponse> => {
  const token = getToken();

  let response: Response;
  try {
    response = await withTimeout(
      fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        headers: {
          "Content-Type": "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
          ...options.headers,
        },
      }),
      TIMEOUT_MS,
    );
  } catch (err) {
    if (isNetworkError(err)) {
      throw new Error("Network error — check your connection and try again.");
    }
    throw err;
  }

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;

    try {
      const error = await response.json();
      if (Array.isArray(error.message)) {
        errorMessage = error.message.join(", ");
      } else {
        errorMessage = error.message || errorMessage;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    if (response.status === 401) {
      const onLoginPage =
        typeof window !== "undefined" && window.location.pathname === "/login";
      if (!onLoginPage) {
        clearTokens();
        window.location.href = "/login";
      }
    }

    if (response.status === 429) {
      throw new Error("Too many requests — please wait a moment and try again.");
    }

    if (response.status >= 500) {
      throw new Error("Server error — please try again later.");
    }

    throw new Error(errorMessage);
  }

  try {
    return await response.json();
  } catch {
    throw new Error("Invalid response from server.");
  }
};

// ════════════════════════════════════════════
// Auth APIs
// ════════════════════════════════════════════

export const authApi = {
  login: async (email: string, password: string) => {
    const res = await apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    }) as ApiResponse<AuthTokens>;
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res;
  },

  register: async (name: string, email: string, password: string) => {
    const res = await apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
    }) as ApiResponse<AuthTokens>;
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res;
  },

  refreshToken: async () => {
    const refreshToken = getRefreshToken();
    if (!refreshToken) throw new Error("No refresh token");

    let res: Response;
    try {
      res = await withTimeout(
        fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${refreshToken}`,
          },
        }),
        TIMEOUT_MS,
      );
    } catch (err) {
      if (isNetworkError(err)) throw new Error("Network error during token refresh.");
      throw err;
    }

    if (!res.ok) {
      clearTokens();
      throw new Error("Session expired — please sign in again.");
    }

    const data = await res.json();
    setTokens(data.data.accessToken, data.data.refreshToken);
    return data;
  },

  logout: async () => {
    try {
      await apiFetch("/auth/logout", { method: "POST" });
    } finally {
      clearTokens();
    }
  },

  getProfile: async () => {
    return apiFetch("/auth/me");
  },

  googleLogin: async (accessToken: string) => {
    const res = await apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken: accessToken }),
    }) as ApiResponse<AuthTokens>;
    setTokens(res.data.accessToken, res.data.refreshToken);
    return res;
  },
};

// ════════════════════════════════════════════
// Session APIs
// ════════════════════════════════════════════

export const sessionApi = {
  create: async (title?: string) => {
    return apiFetch("/chat/sessions", {
      method: "POST",
      body: JSON.stringify({ title: title || "New Chat" }),
    });
  },

  getAll: async () => {
    return apiFetch("/chat/sessions");
  },

  getMessages: async (sessionId: string) => {
    return apiFetch(`/chat/sessions/${sessionId}/messages`);
  },
};

// ════════════════════════════════════════════
// Chat APIs
// ════════════════════════════════════════════

export const chatApi = {
  query: async (query: string, sessionId?: string) => {
    return apiFetch("/chat/query", {
      method: "POST",
      body: JSON.stringify({ query, sessionId }),
    });
  },
};

// ════════════════════════════════════════════
// Streaming
// ════════════════════════════════════════════

export const streamQuery = async (
  query: string,
  sessionId: string | undefined,
  onPhones: (phones: Phone[], parsed: ParsedQuery) => void,
  onChunk: (chunk: string) => void,
  onDone: (recommendedIds: string[]) => void,
  onError: (error: string) => void,
): Promise<void> => {
  const token = getToken();

  if (!token) {
    onError("Not authenticated. Please sign in again.");
    return;
  }

  const params = new URLSearchParams({ query });
  if (sessionId) params.append("sessionId", sessionId);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000); // 60s for stream

  try {
    let response: Response;
    try {
      response = await fetch(`${BASE_URL}/chat/stream?${params.toString()}`, {
        headers: { Authorization: `Bearer ${token}` },
        signal: controller.signal,
      });
    } catch (err) {
      if ((err as Error)?.name === "AbortError") {
        onError("Request timed out. Please try again.");
        return;
      }
      if (isNetworkError(err)) {
        onError("Network error — check your connection and try again.");
        return;
      }
      throw err;
    }

    if (!response.ok) {
      if (response.status === 401) {
        clearTokens();
        window.location.href = "/login";
        return;
      }
      if (response.status === 429) {
        onError("Too many requests — please wait a moment and try again.");
        return;
      }
      if (response.status >= 500) {
        onError("Server error — please try again later.");
        return;
      }
      onError(`Request failed (${response.status})`);
      return;
    }

    if (!response.body) {
      onError("No response from server.");
      return;
    }

    const reader = response.body.getReader();
    const decoder = new TextDecoder();
    let buffer = "";

    while (true) {
      const { done, value } = await reader.read();
      if (done) break;

      buffer += decoder.decode(value, { stream: true });
      const lines = buffer.split("\n");
      buffer = lines.pop() || "";

      for (const line of lines) {
        const trimmed = line.trim();
        if (!trimmed.startsWith("data: ")) continue;

        const data = trimmed.slice(6).trim();
        if (data === "[DONE]") return;

        try {
          const payload = JSON.parse(data);

          if (payload.phones !== undefined) onPhones(payload.phones, payload.parsed);
          if (payload.chunk !== undefined) onChunk(payload.chunk);
          if (payload.done === true) onDone(payload.recommendedIds || []);
          if (payload.error) { onError(payload.error); return; }
        } catch {
          // skip malformed SSE line
        }
      }
    }
  } catch (error) {
    onError(error instanceof Error ? error.message : "Something went wrong. Please try again.");
  } finally {
    clearTimeout(timer);
  }
};

import type { Phone, ParsedQuery } from "@/types";
import { clearTokens } from "./auth";

interface ApiResponse<T = unknown> {
  data: T;
  message?: string;
}

export class ApiError extends Error {
  code?: string;
  constructor(message: string, code?: string) {
    super(message);
    this.name = "ApiError";
    this.code = code;
  }
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

// Dedupe concurrent refresh attempts — if several requests 401 at once,
// only one /auth/refresh call should fire; the rest await the same promise.
let refreshPromise: Promise<boolean> | null = null;

async function refreshAccessToken(): Promise<boolean> {
  if (!refreshPromise) {
    refreshPromise = (async () => {
      try {
        const res = await withTimeout(
          fetch(`${BASE_URL}/auth/refresh`, {
            method: "POST",
            credentials: "include",
            headers: { "Content-Type": "application/json" },
          }),
          TIMEOUT_MS,
        );
        return res.ok;
      } catch {
        return false;
      } finally {
        refreshPromise = null;
      }
    })();
  }
  return refreshPromise;
}

const doFetch = (endpoint: string, fetchOptions: RequestInit) =>
  withTimeout(
    fetch(`${BASE_URL}${endpoint}`, {
      ...fetchOptions,
      credentials: "include", // sends httpOnly cookies automatically
      headers: {
        "Content-Type": "application/json",
        ...fetchOptions.headers,
      },
    }),
    TIMEOUT_MS,
  );

const apiFetch = async (
  endpoint: string,
  options: RequestInit & { skipGlobal401?: boolean; skipRefresh?: boolean } = {},
): Promise<ApiResponse> => {
  const { skipGlobal401, skipRefresh, ...fetchOptions } = options;

  let response: Response;
  try {
    response = await doFetch(endpoint, fetchOptions);
  } catch (err) {
    if (isNetworkError(err)) {
      throw new Error("Network error — check your connection and try again.");
    }
    throw err;
  }

  // Access token expired — try a silent refresh, then retry the original
  // request once before giving up and sending the user to /login.
  if (response.status === 401 && !skipRefresh) {
    const refreshed = await refreshAccessToken();
    if (refreshed) {
      try {
        response = await doFetch(endpoint, fetchOptions);
      } catch (err) {
        if (isNetworkError(err)) {
          throw new Error("Network error — check your connection and try again.");
        }
        throw err;
      }
    }
  }

  if (!response.ok) {
    let errorMessage = `Request failed (${response.status})`;
    let errorCode: string | undefined;

    try {
      const error = await response.json();
      errorCode = error.error;
      if (Array.isArray(error.message)) {
        errorMessage = error.message.join(", ");
      } else {
        errorMessage = error.message || errorMessage;
      }
    } catch {
      errorMessage = response.statusText || errorMessage;
    }

    if (response.status === 401 && !skipGlobal401) {
      const onLoginPage =
        typeof window !== "undefined" && window.location.pathname === "/login";
      if (!onLoginPage) {
        clearTokens();
        window.location.href = "/login";
      }
    }

    if (response.status === 403 && errorCode) {
      throw new ApiError(errorMessage, errorCode);
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
    return apiFetch("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      skipRefresh: true,
    });
  },

  register: async (name: string, email: string, password: string) => {
    return apiFetch("/auth/register", {
      method: "POST",
      body: JSON.stringify({ name, email, password }),
      skipRefresh: true,
    });
  },

  refreshToken: async () => {
    let res: Response;
    try {
      res = await withTimeout(
        fetch(`${BASE_URL}/auth/refresh`, {
          method: "POST",
          credentials: "include", // sends httpOnly refreshToken cookie automatically
          headers: { "Content-Type": "application/json" },
        }),
        TIMEOUT_MS,
      );
    } catch (err) {
      if (isNetworkError(err)) throw new Error("Network error during token refresh.");
      throw err;
    }

    if (!res.ok) {
      throw new Error("Session expired — please sign in again.");
    }

    return res.json();
  },

  logout: async () => {
    return apiFetch("/auth/logout", { method: "POST" });
  },

  getProfile: async () => {
    return apiFetch("/auth/me", { skipGlobal401: true });
  },

  sendOtp: async (email: string) => {
    return apiFetch('/auth/send-otp', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipGlobal401: true,
    });
  },

  verifyOtp: async (email: string, otp: string) => {
    return apiFetch('/auth/verify-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
      skipGlobal401: true,
    });
  },

  forgotPassword: async (email: string) => {
    return apiFetch('/auth/forgot-password', {
      method: 'POST',
      body: JSON.stringify({ email }),
      skipGlobal401: true,
    });
  },

  verifyResetOtp: async (email: string, otp: string) => {
    return apiFetch('/auth/verify-reset-otp', {
      method: 'POST',
      body: JSON.stringify({ email, otp }),
      skipGlobal401: true,
    });
  },

  resetPassword: async (resetToken: string, password: string) => {
    return apiFetch('/auth/reset-password', {
      method: 'PATCH',
      body: JSON.stringify({ resetToken, password }),
      skipGlobal401: true,
    });
  },

  guestLogin: async () => {
    return apiFetch("/auth/guest", { method: "POST" });
  },

  googleLogin: async (idToken: string) => {
    return apiFetch("/auth/google", {
      method: "POST",
      body: JSON.stringify({ idToken }),
    });
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
// Admin APIs
// ════════════════════════════════════════════

export const adminApi = {
  // ── Users ──
  getUsers: async (page = 1, limit = 20) => {
    return apiFetch(`/admin/users?page=${page}&limit=${limit}`);
  },

  updateUserRole: async (userId: string, role: string) => {
    return apiFetch(`/admin/users/${userId}/role`, {
      method: 'PUT',
      body: JSON.stringify({ role }),
    });
  },

  deleteUser: async (userId: string) => {
    return apiFetch(`/admin/users/${userId}`, { method: 'DELETE' });
  },

  // ── Phones ──
  getAllPhones: async (page = 1, limit = 20) => {
    return apiFetch(`/phones/admin/all?page=${page}&limit=${limit}`);
  },

  createPhone: async (data: Record<string, unknown>) => {
    return apiFetch('/phones/admin', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updatePhone: async (id: string, data: Record<string, unknown>) => {
    return apiFetch(`/phones/admin/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deletePhone: async (id: string) => {
    return apiFetch(`/phones/admin/${id}`, { method: 'DELETE' });
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
  onGuestLimit?: () => void,
): Promise<void> => {
  const params = new URLSearchParams({ query });
  if (sessionId) params.append("sessionId", sessionId);

  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), 60000); // 60s for stream

  try {
    const doStreamFetch = () =>
      fetch(`${BASE_URL}/chat/stream?${params.toString()}`, {
        credentials: "include", // sends httpOnly accessToken cookie automatically
        signal: controller.signal,
      });

    let response: Response;
    try {
      response = await doStreamFetch();
      if (response.status === 401 && (await refreshAccessToken())) {
        response = await doStreamFetch();
      }
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
        window.location.href = "/login";
        return;
      }
      if (response.status === 403) {
        try {
          const body = await response.json();
          if (body.error === "GuestLimitExceeded") {
            onGuestLimit?.();
            return;
          }
        } catch {
          // fall through to generic handling
        }
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

// Tokens are now httpOnly cookies set by the backend.
// JavaScript cannot read them — the browser sends them automatically.

// ════════════════════════════════════════════
// Auth Checks
// ════════════════════════════════════════════

// We can no longer read the token from JS.
// Use the /auth/me endpoint to check if the user is authenticated.
export const isAuthenticated = async (): Promise<boolean> => {
  try {
    const BASE_URL =
      process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api/v1";
    const res = await fetch(`${BASE_URL}/auth/me`, {
      credentials: "include", // sends httpOnly cookies automatically
    });
    return res.ok;
  } catch {
    return false;
  }
};

// ════════════════════════════════════════════
// No-ops kept for backwards compatibility
// (callers can be cleaned up later)
// ════════════════════════════════════════════

export const setTokens = (_accessToken: string, _refreshToken: string): void => {
  // Tokens are now set by the backend via Set-Cookie — nothing to do here.
};

export const clearTokens = (): void => {
  // Logout endpoint clears cookies server-side — nothing to do here.
};

export const getToken = (): string | undefined => {
  // Cannot read httpOnly cookies from JavaScript by design.
  return undefined;
};

export const getRefreshToken = (): string | undefined => {
  // Cannot read httpOnly cookies from JavaScript by design.
  return undefined;
};

export const isTokenExpired = (_token: string): boolean => {
  // Cannot decode httpOnly cookies from JavaScript by design.
  // Token expiry is handled server-side.
  return false;
};

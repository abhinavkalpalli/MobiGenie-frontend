import Cookies from "js-cookie";

// ─── Token Keys ───────────────────────────────
const ACCESS_TOKEN_KEY = "accessToken";
const REFRESH_TOKEN_KEY = "refreshToken";

// ════════════════════════════════════════════
// Token Getters
// ════════════════════════════════════════════

export const getToken = (): string | undefined => {
  return Cookies.get(ACCESS_TOKEN_KEY);
};

export const getRefreshToken = (): string | undefined => {
  return Cookies.get(REFRESH_TOKEN_KEY);
};

// ════════════════════════════════════════════
// Token Setters
// ════════════════════════════════════════════

export const setTokens = (accessToken: string, refreshToken: string): void => {
  // Access token expires in 7 days
  Cookies.set(ACCESS_TOKEN_KEY, accessToken, {
    expires: 7,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });

  // Refresh token expires in 30 days
  Cookies.set(REFRESH_TOKEN_KEY, refreshToken, {
    expires: 30,
    secure: process.env.NODE_ENV === "production",
    sameSite: "strict",
  });
};

// ════════════════════════════════════════════
// Token Removal
// ════════════════════════════════════════════

export const clearTokens = (): void => {
  Cookies.remove(ACCESS_TOKEN_KEY);
  Cookies.remove(REFRESH_TOKEN_KEY);
};

// ════════════════════════════════════════════
// Auth Checks
// ════════════════════════════════════════════

// Check if user is logged in
export const isAuthenticated = (): boolean => {
  return !!getToken();
};

// ════════════════════════════════════════════
// Token Decoder
// ════════════════════════════════════════════

// Decode JWT payload without verifying
// (verification happens on backend)
interface JwtPayload {
  sub: string;
  email: string;
  role: string;
  exp: number;
  [key: string]: unknown;
}

export const decodeToken = (token: string): JwtPayload | null => {
  try {
    const base64Payload = token.split(".")[1];
    const payload = atob(base64Payload);
    return JSON.parse(payload);
  } catch {
    return null;
  }
};

// Check if token is expired
export const isTokenExpired = (token: string): boolean => {
  try {
    const decoded = decodeToken(token);
    if (!decoded?.exp) return true;

    // exp is in seconds, Date.now() is in ms
    return decoded.exp * 1000 < Date.now();
  } catch {
    return true;
  }
};

// Get user info from token (without API call)
export const getUserFromToken = (): {
  userId: string;
  email: string;
  role: string;
} | null => {
  const token = getToken();
  if (!token) return null;

  const decoded = decodeToken(token);
  if (!decoded) return null;

  return {
    userId: decoded.sub,
    email: decoded.email,
    role: decoded.role,
  };
};

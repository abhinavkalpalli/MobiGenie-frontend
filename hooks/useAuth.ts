"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
import {
  getToken,
  clearTokens,
  isAuthenticated,
  isTokenExpired,
} from "@/lib/auth";             // ← import from auth.ts
import type { User } from "@/types";

export function useAuth() {
  const [user,    setUser]    = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router                = useRouter();

  const loadProfile = useCallback(async () => {
    try {
      const res = await authApi.getProfile();
      setUser(res.data as User);
    } catch {
      clearTokens();
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    const init = async () => {
      // ─── Check token exists ─────────────────
      if (!isAuthenticated()) {
        setLoading(false);
        router.push("/login");
        return;
      }

      // ─── Check token not expired ─────────────
      const token = getToken()!;
      if (isTokenExpired(token)) {
        // Try refresh before giving up
        try {
          await authApi.refreshToken();
          await loadProfile();
        } catch {
          clearTokens();
          setLoading(false);
          router.push("/login");
        }
        return;
      }

      // ─── Token valid — load profile ──────────
      await loadProfile();
    };

    init();
  }, [loadProfile, router]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } catch {
      clearTokens();
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return { user, loading, logout };
}
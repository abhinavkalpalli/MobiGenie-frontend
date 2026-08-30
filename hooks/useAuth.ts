"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { authApi } from "@/lib/api";
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
      router.push("/login");
    } finally {
      setLoading(false);
    }
  }, [router]);

  useEffect(() => {
    // apiFetch already retries a 401 with a silent /auth/refresh internally,
    // so loadProfile succeeds as long as the refresh token cookie is still
    // valid — no need to duplicate that dance here.
    loadProfile();
  }, [loadProfile]);

  const logout = useCallback(async () => {
    try {
      await authApi.logout();
    } finally {
      setUser(null);
      router.push("/login");
    }
  }, [router]);

  return { user, loading, logout };
}

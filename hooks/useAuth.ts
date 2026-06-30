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
    const init = async () => {
      try {
        // Try loading profile — if accessToken cookie is valid, this succeeds
        await loadProfile();
      } catch {
        // Access token expired — try refresh (refreshToken cookie sent automatically)
        try {
          await authApi.refreshToken();
          await loadProfile();
        } catch {
          setLoading(false);
          router.push("/login");
        }
      }
    };

    init();
  }, [loadProfile, router]);

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

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { authApi } from "@/lib/api";
import { getToken } from "@/lib/auth";

function LoginForm() {
  const router = useRouter();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState("");
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (getToken()) router.replace("/");
  }, [router]);

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError("");
    setLoading(true);
    try {
      if (isLogin) {
        await authApi.login(email, password);
      } else {
        await authApi.register(name, email, password);
      }
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const googleLogin = useGoogleLogin({
    onSuccess: async (tokenResponse) => {
      setGoogleLoading(true);
      setError("");
      try {
        await authApi.googleLogin(tokenResponse.access_token);
        router.push("/");
      } catch (err) {
        setError(err instanceof Error ? err.message : "Google sign-in failed");
      } finally {
        setGoogleLoading(false);
      }
    },
    onError: () => {
      setError("Google sign-in was cancelled or failed. Please try again.");
    },
  });

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError("");
  };

  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid #2e2e4a",
    background: "#13131f",
    color: "#e2e2f0",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s",
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4"
      style={{ background: "#1a1a2e" }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-8">
          <div
            className="w-14 h-14 rounded-2xl flex items-center justify-center mx-auto mb-4"
            style={{ background: "linear-gradient(135deg, #6d28d9, #4f46e5)" }}
          >
            <span className="text-2xl">📱</span>
          </div>
          <h1 className="text-2xl font-bold" style={{ color: "#e2e2f0" }}>MobiGenie</h1>
          <p className="text-sm mt-1" style={{ color: "#6b6b8a" }}>Your AI Phone Advisor</p>
        </div>

        {/* Card */}
        <div
          className="rounded-2xl p-6"
          style={{ background: "#1e1e32", border: "1px solid #2e2e4a" }}
        >
          {/* Tabs */}
          <div className="flex rounded-xl p-1 mb-5" style={{ background: "#13131f" }}>
            {[{ label: "Sign In", value: true }, { label: "Sign Up", value: false }].map((tab) => (
              <button
                key={tab.label}
                onClick={() => switchMode(tab.value)}
                className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                style={
                  isLogin === tab.value
                    ? { background: "#6d28d9", color: "#fff" }
                    : { background: "transparent", color: "#6b6b8a" }
                }
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Google Button */}
          <button
            type="button"
            onClick={() => googleLogin()}
            disabled={googleLoading || loading}
            className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium mb-4 transition-colors disabled:opacity-50"
            style={{ background: "#13131f", color: "#e2e2f0", border: "1px solid #2e2e4a" }}
            onMouseEnter={(e) => { e.currentTarget.style.background = "#1a1a30"; }}
            onMouseLeave={(e) => { e.currentTarget.style.background = "#13131f"; }}
          >
            {googleLoading ? (
              <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" />
            ) : (
              <svg className="w-4 h-4" viewBox="0 0 24 24">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
              </svg>
            )}
            Continue with Google
          </button>

          {/* Divider */}
          <div className="flex items-center gap-3 mb-4">
            <div className="flex-1 h-px" style={{ background: "#2e2e4a" }} />
            <span className="text-xs" style={{ color: "#4b4b6b" }}>or</span>
            <div className="flex-1 h-px" style={{ background: "#2e2e4a" }} />
          </div>

          {/* Email/Password Form */}
          <form onSubmit={handleSubmit} className="space-y-4">
            {!isLogin && (
              <div>
                <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8ba7" }}>
                  Name
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="John Doe"
                  required={!isLogin}
                  style={inputStyle}
                  onFocus={(e) => (e.target.style.borderColor = "#6d28d9")}
                  onBlur={(e) => (e.target.style.borderColor = "#2e2e4a")}
                />
              </div>
            )}

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8ba7" }}>
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@example.com"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6d28d9")}
                onBlur={(e) => (e.target.style.borderColor = "#2e2e4a")}
              />
            </div>

            <div>
              <label className="block text-xs font-medium mb-1.5" style={{ color: "#8b8ba7" }}>
                Password
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                required
                style={inputStyle}
                onFocus={(e) => (e.target.style.borderColor = "#6d28d9")}
                onBlur={(e) => (e.target.style.borderColor = "#2e2e4a")}
              />
            </div>

            {error && (
              <div
                className="px-4 py-3 rounded-xl text-sm"
                style={{ background: "#2a1a1a", border: "1px solid #5a2020", color: "#f87171" }}
              >
                {error}
              </div>
            )}

            <button
              type="submit"
              disabled={loading || googleLoading}
              className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
              style={{ background: "#6d28d9", color: "#fff" }}
              onMouseEnter={(e) => { if (!loading) e.currentTarget.style.background = "#7c3aed"; }}
              onMouseLeave={(e) => { if (!loading) e.currentTarget.style.background = "#6d28d9"; }}
            >
              {loading ? (
                <span className="flex items-center justify-center gap-2">
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
                  {isLogin ? "Signing in…" : "Creating account…"}
                </span>
              ) : isLogin ? "Sign In" : "Create Account"}
            </button>
          </form>
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#3b3b5a" }}>
          MobiGenie — Powered by AI
        </p>
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <GoogleOAuthProvider clientId={process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID ?? ""}>
      <LoginForm />
    </GoogleOAuthProvider>
  );
}

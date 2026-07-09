"use client";

import { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { GoogleOAuthProvider, useGoogleLogin } from "@react-oauth/google";
import { authApi } from "@/lib/api";

type Screen = "auth" | "verify-otp" | "forgot-email" | "forgot-otp" | "forgot-reset";

function OtpInput({ value, onChange }: { value: string; onChange: (v: string) => void }) {
  const inputs = useRef<(HTMLInputElement | null)[]>([]);

  const handleChange = (i: number, char: string) => {
    const digit = char.replace(/\D/g, "").slice(-1);
    const next = value.split("");
    next[i] = digit;
    const joined = next.join("").slice(0, 6).padEnd(6, "").trimEnd();
    // build exactly 6 chars
    const arr = (value + "      ").split("").slice(0, 6);
    arr[i] = digit;
    onChange(arr.join("").replace(/ /g, "").padEnd(0));
    const newVal = arr.join("");
    onChange(newVal.trimEnd());
    if (digit && i < 5) inputs.current[i + 1]?.focus();
  };

  const handleKeyDown = (i: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace") {
      if (!value[i] && i > 0) {
        const arr = value.split("");
        arr[i - 1] = "";
        onChange(arr.join(""));
        inputs.current[i - 1]?.focus();
      } else {
        const arr = value.split("");
        arr[i] = "";
        onChange(arr.join(""));
      }
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    onChange(pasted);
    inputs.current[Math.min(pasted.length, 5)]?.focus();
  };

  return (
    <div className="flex gap-2 justify-center">
      {[0,1,2,3,4,5].map((i) => (
        <input
          key={i}
          ref={(el) => { inputs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={value[i] || ""}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={handlePaste}
          className="w-11 h-12 text-center text-xl font-bold rounded-xl outline-none transition-all"
          style={{
            background: "rgba(255,255,255,0.08)",
            border: value[i] ? "2px solid #6d28d9" : "1px solid rgba(255,255,255,0.2)",
            color: "#ffffff",
            boxShadow: value[i] ? "0 0 8px rgba(109,40,217,0.5)" : "none",
          }}
          onFocus={(e) => (e.target.style.border = "2px solid #6d28d9")}
          onBlur={(e) => (e.target.style.border = value[i] ? "2px solid #6d28d9" : "1px solid rgba(255,255,255,0.2)")}
        />
      ))}
    </div>
  );
}

function PasswordInput({
  value,
  onChange,
  placeholder = "••••••••",
  required,
  style,
  borderColor,
}: {
  value: string;
  onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
  placeholder?: string;
  required?: boolean;
  style: React.CSSProperties;
  borderColor?: string;
}) {
  const [visible, setVisible] = useState(false);

  return (
    <div className="relative">
      <input
        type={visible ? "text" : "password"}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
        required={required}
        style={{ ...style, paddingRight: "40px", borderColor: borderColor ?? style.borderColor }}
        onFocus={(e) => (e.target.style.borderColor = "#6d28d9")}
        onBlur={(e) => (e.target.style.borderColor = borderColor ?? "rgba(255,255,255,0.15)")}
      />
      <button
        type="button"
        onClick={() => setVisible((v) => !v)}
        tabIndex={-1}
        className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center"
        style={{ color: "#a0c4ff" }}
        aria-label={visible ? "Hide password" : "Show password"}
      >
        {visible ? (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.542-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.542 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
          </svg>
        ) : (
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
          </svg>
        )}
      </button>
    </div>
  );
}

function LoginForm() {
  const router = useRouter();

  // ── Screen state ──────────────────────────────
  const [screen, setScreen] = useState<Screen>("auth");
  const [isLogin, setIsLogin] = useState(true);

  // ── Form fields ───────────────────────────────
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [otp, setOtp] = useState("");
  const [resetToken, setResetToken] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");

  // ── UI state ──────────────────────────────────
  const [loading, setLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [guestLoading, setGuestLoading] = useState(false);
  const [error, setError] = useState("");
  const [success, setSuccess] = useState("");
  const [otpTimer, setOtpTimer] = useState(0);

  useEffect(() => {
    authApi.getProfile()
      .then((res) => {
        const data = res.data as { isGuest?: boolean };
        if (!data.isGuest) router.replace("/");
      })
      .catch(() => {});
  }, [router]);

  useEffect(() => {
    if (otpTimer <= 0) return;
    const t = setTimeout(() => setOtpTimer((v) => v - 1), 1000);
    return () => clearTimeout(t);
  }, [otpTimer]);

  // ── Email validation ──────────────────────────
  const emailError = (() => {
    if (!email) return "Email is required.";
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) return "Enter a valid email address.";
    if (/\s/.test(email)) return "Email must not contain spaces.";
    return "";
  })();

  // ── Password strength ─────────────────────────
  const checks = {
    length:    password.length >= 8,
    uppercase: /[A-Z]/.test(password),
    lowercase: /[a-z]/.test(password),
    number:    /[0-9]/.test(password),
    special:   /[^A-Za-z0-9]/.test(password),
  };
  const score = Object.values(checks).filter(Boolean).length;
  const strength = score <= 1 ? "Weak" : score <= 3 ? "Fair" : score === 4 ? "Good" : "Strong";
  const strengthColor = score <= 1 ? "#ef4444" : score <= 3 ? "#f97316" : score === 4 ? "#eab308" : "#22c55e";

  const validatePassword = (pwd: string): string => {
    if (pwd.length < 8) return "Password must be at least 8 characters.";
    if (pwd.length > 100) return "Password is too long.";
    if (!/[A-Z]/.test(pwd)) return "Password must include an uppercase letter.";
    if (!/[a-z]/.test(pwd)) return "Password must include a lowercase letter.";
    if (!/[0-9]/.test(pwd)) return "Password must include a number.";
    return "";
  };

  // ── Styles ────────────────────────────────────
  const inputStyle: React.CSSProperties = {
    width: "100%",
    padding: "10px 14px",
    borderRadius: "10px",
    border: "1px solid rgba(255,255,255,0.15)",
    background: "rgba(255,255,255,0.08)",
    color: "#ffffff",
    fontSize: "14px",
    outline: "none",
    transition: "border-color 0.15s",
  };

  const cardStyle: React.CSSProperties = {
    background: "rgba(15,15,30,0.10)",
    border: "1px solid rgba(99,102,241,0.4)",
    backdropFilter: "blur(20px)",
    boxShadow: "0 0 30px rgba(99,102,241,0.15), inset 0 0 30px rgba(255,255,255,0.03)",
  };

  // ── Handlers ──────────────────────────────────

  const handleAuthSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailTouched(true);
    if (emailError) { setError(emailError); return; }

    if (!isLogin) {
      const pwdError = validatePassword(password);
      if (pwdError) { setError(pwdError); return; }
      if (password !== confirmPassword) { setError("Passwords do not match."); return; }
    }

    setLoading(true);
    try {
      if (isLogin) {
        await authApi.login(email, password);
        router.push("/");
      } else {
        await authApi.register(name, email, password);
        await authApi.sendOtp(email);
        setOtpTimer(60);
        setScreen("verify-otp");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.replace(/\s/g, "").length < 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      await authApi.verifyOtp(email, otp);
      setOtp("");
      await authApi.login(email, password);
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResendOtp = async () => {
    if (otpTimer > 0) return;
    setError("");
    setSuccess("");
    try {
      await authApi.sendOtp(email);
      setOtpTimer(60);
      setSuccess("OTP resent to your email.");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to resend OTP");
    }
  };

  const handleForgotEmail = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setEmailTouched(true);
    if (emailError) { setError(emailError); return; }
    setLoading(true);
    try {
      await authApi.forgotPassword(email);
      setOtp("");
      setOtpTimer(60);
      setScreen("forgot-otp");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotOtp = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (otp.replace(/\s/g, "").length < 6) { setError("Enter the 6-digit OTP."); return; }
    setLoading(true);
    try {
      const res = await authApi.verifyResetOtp(email, otp);
      setResetToken((res as any).data?.resetToken ?? "");
      setOtp("");
      setScreen("forgot-reset");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Invalid OTP");
    } finally {
      setLoading(false);
    }
  };

  const handleResetPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    const pwdError = validatePassword(newPassword);
    if (pwdError) { setError(pwdError); return; }
    if (newPassword !== confirmNewPassword) { setError("Passwords do not match."); return; }
    setLoading(true);
    try {
      await authApi.resetPassword(resetToken, newPassword);
      setSuccess("Password reset! Please sign in.");
      setScreen("auth");
      setIsLogin(true);
      setEmail("");
      setResetToken("");
      setNewPassword("");
      setConfirmNewPassword("");
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
    onError: () => setError("Google sign-in was cancelled or failed. Please try again."),
  });

  const handleGuestLogin = async () => {
    setGuestLoading(true);
    setError("");
    try {
      await authApi.guestLogin();
      router.push("/");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Guest sign-in failed");
    } finally {
      setGuestLoading(false);
    }
  };

  const switchMode = (login: boolean) => {
    setIsLogin(login);
    setError("");
    setSuccess("");
    setEmailTouched(false);
    setPassword("");
    setConfirmPassword("");
  };

  const resetToAuth = () => {
    setScreen("auth");
    setError("");
    setSuccess("");
    setOtp("");
    setOtpTimer(0);
    setEmailTouched(false);
  };

  const renderOtpScreen = (
    title: string,
    subtitle: string,
    onSubmit: (e: React.FormEvent) => void,
    onBack: () => void,
    onResend?: () => void,
    btnLabel = "Verify"
  ) => (
    <form onSubmit={onSubmit} className="space-y-4">
      <div className="text-center mb-2">
        <p className="text-sm font-semibold text-white">{title}</p>
        <p className="text-xs mt-1" style={{ color: "#a0c4ff" }}>{subtitle}</p>
      </div>
      <OtpInput value={otp} onChange={setOtp} />
      {onResend && (
        <p className="text-center text-xs" style={{ color: "#a0c4ff" }}>
          {otpTimer > 0 ? (
            <>Resend OTP in <span className="text-white font-medium">{otpTimer}s</span></>
          ) : (
            <button type="button" onClick={onResend} className="underline text-white hover:text-violet-300 transition-colors">
              Resend OTP
            </button>
          )}
        </p>
      )}
      {error && <p className="text-xs text-center" style={{ color: "#f87171" }}>{error}</p>}
      {success && <p className="text-xs text-center" style={{ color: "#34d399" }}>{success}</p>}
      <button
        type="submit"
        disabled={loading || otp.replace(/\s/g, "").length < 6}
        className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
        style={{ background: "#6d28d9", color: "#fff", boxShadow: "0 0 20px rgba(109,40,217,0.6)" }}
      >
        {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{btnLabel}…</span> : btnLabel}
      </button>
      <button type="button" onClick={onBack} className="w-full text-xs text-center py-1 transition-colors" style={{ color: "#a0c4ff" }}>
        ← Back
      </button>
    </form>
  );

  return (
    <div
      className="min-h-screen flex items-center justify-center p-4 overflow-y-auto"
      style={{
        backgroundImage: `linear-gradient(rgba(10,10,25,0.30), rgba(10,10,25,0.30)), url('/Firefly_Gemini Flash_login.png')`,
        backgroundSize: "cover",
        backgroundPosition: "center",
        backgroundRepeat: "no-repeat",
      }}
    >
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="text-center mb-6">
          <div className="mx-auto mb-3 w-32 h-32 flex items-center justify-center">
            <img
              src="/MobiGeinie_Chat_Genie_Face-removebg-preview.png"
              alt="MobiGenie"
              className="w-full h-full object-contain scale-150"
              style={{ filter: "drop-shadow(0 0 10px rgba(56,189,248,1)) drop-shadow(0 0 25px rgba(99,102,241,0.8)) drop-shadow(0 0 50px rgba(56,189,248,0.5)) brightness(1.2)" }}
            />
          </div>
          <h1 className="text-3xl font-bold" style={{ color: "#ffffff", textShadow: "0 0 20px rgba(56,189,248,0.8), 0 0 40px rgba(99,102,241,0.5)" }}>MobiGenie</h1>
          <p className="text-sm mt-1" style={{ color: "#e2e2f0" }}>Your AI Phone Advisor</p>
        </div>

        {/* Card */}
        <div className="rounded-2xl p-6" style={cardStyle}>

          {/* ── Verify OTP (after signup) ── */}
          {screen === "verify-otp" && renderOtpScreen(
            "Verify your email",
            `We sent a 6-digit OTP to ${email}`,
            handleVerifyOtp,
            resetToAuth,
            handleResendOtp,
            "Verify & Continue"
          )}

          {/* ── Forgot — enter email ── */}
          {screen === "forgot-email" && (
            <form onSubmit={handleForgotEmail} className="space-y-4">
              <div className="text-center mb-2">
                <p className="text-sm font-semibold text-white">Forgot Password</p>
                <p className="text-xs mt-1" style={{ color: "#a0c4ff" }}>Enter your email to receive an OTP</p>
              </div>
              <div>
                <label className="block text-xs font-medium mb-1.5 text-white">Email</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => { setEmail(e.target.value); setEmailTouched(false); }}
                  placeholder="you@example.com"
                  required
                  style={{ ...inputStyle, borderColor: emailTouched && emailError ? "#ef4444" : "rgba(255,255,255,0.15)" }}
                  onFocus={(e) => (e.target.style.borderColor = "#6d28d9")}
                  onBlur={(e) => { setEmailTouched(true); e.target.style.borderColor = emailError ? "#ef4444" : "rgba(255,255,255,0.15)"; }}
                />
                {emailTouched && emailError && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{emailError}</p>}
              </div>
              {error && <p className="text-xs text-center" style={{ color: "#f87171" }}>{error}</p>}
              <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: "#6d28d9", color: "#fff", boxShadow: "0 0 20px rgba(109,40,217,0.6)" }}>
                {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Sending…</span> : "Send OTP"}
              </button>
              <button type="button" onClick={resetToAuth} className="w-full text-xs text-center py-1 transition-colors" style={{ color: "#a0c4ff" }}>← Back to Sign In</button>
            </form>
          )}

          {/* ── Forgot — verify OTP ── */}
          {screen === "forgot-otp" && renderOtpScreen(
            "Enter reset OTP",
            `We sent a 6-digit OTP to ${email}`,
            handleForgotOtp,
            () => setScreen("forgot-email"),
            async () => {
              if (otpTimer > 0) return;
              try { await authApi.forgotPassword(email); setOtpTimer(60); setSuccess("OTP resent."); } catch {}
            },
            "Verify OTP"
          )}

          {/* ── Forgot — new password ── */}
          {screen === "forgot-reset" && (() => {
            const newChecks = {
              length:    newPassword.length >= 8,
              uppercase: /[A-Z]/.test(newPassword),
              lowercase: /[a-z]/.test(newPassword),
              number:    /[0-9]/.test(newPassword),
              special:   /[^A-Za-z0-9]/.test(newPassword),
            };
            const newScore = Object.values(newChecks).filter(Boolean).length;
            const newStrength = newScore <= 1 ? "Weak" : newScore <= 3 ? "Fair" : newScore === 4 ? "Good" : "Strong";
            const newStrengthColor = newScore <= 1 ? "#ef4444" : newScore <= 3 ? "#f97316" : newScore === 4 ? "#eab308" : "#22c55e";
            return (
              <form onSubmit={handleResetPassword} className="space-y-4">
                <div className="text-center mb-2">
                  <p className="text-sm font-semibold text-white">Set New Password</p>
                  <p className="text-xs mt-1" style={{ color: "#a0c4ff" }}>Choose a strong password</p>
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white">New Password</label>
                  <PasswordInput value={newPassword} onChange={(e) => setNewPassword(e.target.value)} required style={inputStyle} />
                  {newPassword.length > 0 && (
                    <div className="mt-1.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {[1,2,3,4,5].map((i) => (
                            <div key={i} className="h-0.5 flex-1 rounded-full transition-all duration-300" style={{ background: i <= newScore ? newStrengthColor : "#2e2e4a" }} />
                          ))}
                        </div>
                        <span className="text-xs font-medium w-12 text-right" style={{ color: newStrengthColor }}>{newStrength}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {[
                          { key: "length", label: "8+ characters" },
                          { key: "uppercase", label: "Uppercase" },
                          { key: "lowercase", label: "Lowercase" },
                          { key: "number", label: "Number" },
                          { key: "special", label: "Special character" },
                        ].map(({ key, label }) => {
                          const passed = newChecks[key as keyof typeof newChecks];
                          return (
                            <div key={key} className="flex items-center gap-1">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                                {passed ? <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : <circle cx="6" cy="6" r="4" stroke="#3b3b5a" strokeWidth="1.5" />}
                              </svg>
                              <span className="text-xs" style={{ color: passed ? "#86efac" : "#4b4b6b" }}>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white">Confirm Password</label>
                  <PasswordInput value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} required style={inputStyle}
                    borderColor={confirmNewPassword && confirmNewPassword !== newPassword ? "#ef4444" : "rgba(255,255,255,0.15)"} />
                  {confirmNewPassword && confirmNewPassword !== newPassword && <p className="text-xs mt-1" style={{ color: "#f87171" }}>Passwords do not match.</p>}
                </div>
                {error && <p className="text-xs text-center" style={{ color: "#f87171" }}>{error}</p>}
                <button type="submit" disabled={loading} className="w-full py-2.5 rounded-xl text-sm font-medium disabled:opacity-50" style={{ background: "#6d28d9", color: "#fff", boxShadow: "0 0 20px rgba(109,40,217,0.6)" }}>
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />Resetting…</span> : "Reset Password"}
                </button>
              </form>
            );
          })()}

          {/* ── Auth (sign in / sign up) ── */}
          {screen === "auth" && (
            <>
              {/* Tabs */}
              <div className="flex rounded-xl p-1 mb-5" style={{ background: "rgba(255,255,255,0.08)" }}>
                {[{ label: "Sign In", value: true }, { label: "Sign Up", value: false }].map((tab) => (
                  <button key={tab.label} onClick={() => switchMode(tab.value)} className="flex-1 py-2 text-sm font-medium rounded-lg transition-all"
                    style={isLogin === tab.value ? { background: "#6d28d9", color: "#fff", boxShadow: "0 0 12px rgba(109,40,217,0.6)" } : { background: "transparent", color: "#ffffff" }}>
                    {tab.label}
                  </button>
                ))}
              </div>

              {/* Google */}
              <button type="button" onClick={() => googleLogin()} disabled={googleLoading || loading}
                className="w-full flex items-center justify-center gap-3 py-2.5 rounded-xl text-sm font-medium mb-4 transition-colors disabled:opacity-50"
                style={{ background: "rgba(255,255,255,0.08)", color: "#ffffff", border: "1px solid rgba(255,255,255,0.15)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.15)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.08)"; }}
              >
                {googleLoading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : (
                  <svg className="w-4 h-4" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                )}
                Continue with Google
              </button>

              {/* Guest */}
              <button type="button" onClick={handleGuestLogin} disabled={guestLoading || loading || googleLoading}
                className="w-full flex items-center justify-center gap-2 py-2.5 rounded-xl text-sm font-medium mb-4 transition-colors disabled:opacity-50"
                style={{ background: "transparent", color: "#a0c4ff", border: "1px solid rgba(255,255,255,0.1)" }}
                onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(255,255,255,0.06)"; }}
                onMouseLeave={(e) => { e.currentTarget.style.background = "transparent"; }}
              >
                {guestLoading ? <div className="w-4 h-4 border-2 border-gray-400 border-t-transparent rounded-full animate-spin" /> : "Continue as Guest"}
              </button>

              {/* Divider */}
              <div className="flex items-center gap-3 mb-4">
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
                <span className="text-xs text-white">or</span>
                <div className="flex-1 h-px" style={{ background: "rgba(255,255,255,0.2)" }} />
              </div>

              {/* Success message */}
              {success && <p className="text-xs text-center mb-3" style={{ color: "#34d399" }}>{success}</p>}

              {/* Form */}
              <form onSubmit={handleAuthSubmit} className="space-y-3">
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-white">Name</label>
                    <input type="text" value={name} onChange={(e) => setName(e.target.value)} placeholder="John Doe" required={!isLogin} style={inputStyle}
                      onFocus={(e) => (e.target.style.borderColor = "#6d28d9")} onBlur={(e) => (e.target.style.borderColor = "rgba(255,255,255,0.15)")} />
                  </div>
                )}
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white">Email</label>
                  <input type="email" value={email} onChange={(e) => { setEmail(e.target.value); setEmailTouched(false); }} placeholder="you@example.com" required
                    style={{ ...inputStyle, borderColor: emailTouched && emailError ? "#ef4444" : "rgba(255,255,255,0.15)" }}
                    onFocus={(e) => (e.target.style.borderColor = emailTouched && emailError ? "#ef4444" : "#6d28d9")}
                    onBlur={(e) => { setEmailTouched(true); e.target.style.borderColor = emailError ? "#ef4444" : "rgba(255,255,255,0.15)"; }} />
                  {emailTouched && emailError && <p className="text-xs mt-1" style={{ color: "#f87171" }}>{emailError}</p>}
                </div>
                <div>
                  <label className="block text-xs font-medium mb-1.5 text-white">Password</label>
                  <PasswordInput value={password} onChange={(e) => setPassword(e.target.value)} required style={inputStyle} />
                  {!isLogin && password.length > 0 && (
                    <div className="mt-1.5 space-y-1.5">
                      <div className="flex items-center gap-2">
                        <div className="flex gap-1 flex-1">
                          {[1,2,3,4,5].map((i) => (
                            <div key={i} className="h-0.5 flex-1 rounded-full transition-all duration-300" style={{ background: i <= score ? strengthColor : "#2e2e4a" }} />
                          ))}
                        </div>
                        <span className="text-xs font-medium w-12 text-right" style={{ color: strengthColor }}>{strength}</span>
                      </div>
                      <div className="grid grid-cols-2 gap-x-3 gap-y-0.5">
                        {[
                          { key: "length", label: "8+ characters" },
                          { key: "uppercase", label: "Uppercase" },
                          { key: "lowercase", label: "Lowercase" },
                          { key: "number", label: "Number" },
                          { key: "special", label: "Special character" },
                        ].map(({ key, label }) => {
                          const passed = checks[key as keyof typeof checks];
                          return (
                            <div key={key} className="flex items-center gap-1">
                              <svg className="w-3 h-3 flex-shrink-0" viewBox="0 0 12 12" fill="none">
                                {passed ? <path d="M2 6l3 3 5-5" stroke="#22c55e" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" /> : <circle cx="6" cy="6" r="4" stroke="#3b3b5a" strokeWidth="1.5" />}
                              </svg>
                              <span className="text-xs" style={{ color: passed ? "#86efac" : "#4b4b6b" }}>{label}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
                {!isLogin && (
                  <div>
                    <label className="block text-xs font-medium mb-1.5 text-white">Confirm Password</label>
                    <PasswordInput value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} required={!isLogin} style={inputStyle}
                      borderColor={confirmPassword && confirmPassword !== password ? "#ef4444" : "rgba(255,255,255,0.15)"} />
                    {confirmPassword && confirmPassword !== password && <p className="text-xs mt-1" style={{ color: "#f87171" }}>Passwords do not match.</p>}
                  </div>
                )}

                {error && <div className="px-4 py-3 rounded-xl text-sm" style={{ background: "#2a1a1a", border: "1px solid #5a2020", color: "#f87171" }}>{error}</div>}

                <button type="submit" disabled={loading || googleLoading} className="w-full py-2.5 rounded-xl text-sm font-medium transition-opacity disabled:opacity-50"
                  style={{ background: "#6d28d9", color: "#fff", boxShadow: "0 0 20px rgba(109,40,217,0.6)" }}
                  onMouseEnter={(e) => { if (!loading) { e.currentTarget.style.background = "#7c3aed"; e.currentTarget.style.boxShadow = "0 0 30px rgba(109,40,217,0.8)"; } }}
                  onMouseLeave={(e) => { if (!loading) { e.currentTarget.style.background = "#6d28d9"; e.currentTarget.style.boxShadow = "0 0 20px rgba(109,40,217,0.6)"; } }}
                >
                  {loading ? <span className="flex items-center justify-center gap-2"><div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />{isLogin ? "Signing in…" : "Creating account…"}</span> : isLogin ? "Sign In" : "Create Account"}
                </button>

                {isLogin && (
                  <button type="button" onClick={() => { setScreen("forgot-email"); setError(""); setEmailTouched(false); }} className="w-full text-xs text-center py-1 transition-colors" style={{ color: "#a0c4ff" }}>
                    Forgot password?
                  </button>
                )}
              </form>
            </>
          )}
        </div>

        <p className="text-center text-xs mt-4" style={{ color: "#ffffff" }}>
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

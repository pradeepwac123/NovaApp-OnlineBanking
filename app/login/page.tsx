"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type View = "login" | "forgot-find" | "forgot-reset" | "forgot-success";

/* ── Page-level suspense boundary (required for useSearchParams) ── */
export default function LoginPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-surface flex items-center justify-center">
          {/* Spinner — uses primary brand color */}
          <div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <LoginPageContent />
    </Suspense>
  );
}

/* ── Shared input class — DRY helper ── */
const inputCls =
  "w-full bg-surface-container-lowest text-on_surface border border-[rgba(65,71,85,0.20)] rounded-xl px-4 py-3 placeholder-on_surface_variant/50 transition-all duration-200 focus:border-primary focus:shadow-[0_0_0_3px_rgba(0,88,188,0.15)] focus:outline-none";

/* ── Card motion preset — consistent entry/exit ── */
const cardMotion = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.25, ease: [0.22, 1, 0.36, 1] },
};

function LoginPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const registered = searchParams.get("registered");

  const [view, setView] = useState<View>("login");

  // Login state
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Forgot password state
  const [resetIdentifier, setResetIdentifier] = useState("");
  const [resetError, setResetError] = useState("");
  const [resetLoading, setResetLoading] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmNewPassword, setConfirmNewPassword] = useState("");
  const [resetPasswordError, setResetPasswordError] = useState("");
  const [foundUserId, setFoundUserId] = useState("");

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError("");

    const res = await signIn("credentials", { email, password, redirect: false });

    if (res?.error) {
      setError(res.error === "CredentialsSignin" ? "Invalid email or password" : res.error);
      setLoading(false);
    } else {
      const meRes = await fetch("/api/auth/me");
      const meData = await meRes.json();
      const role = meData?.user?.role;
      router.push(
        role === "admin" || role === "super_admin" || role === "superadmin"
          ? "/admin"
          : "/dashboard"
      );
    }
  };

  const handleFindUser = async () => {
    if (!resetIdentifier.trim()) { setResetError("Enter your email or phone number"); return; }
    setResetLoading(true);
    setResetError("");
    try {
      const res = await fetch("/api/auth/find-user", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ identifier: resetIdentifier.trim() }),
      });
      const data = await res.json();
      if (!res.ok) { setResetError(data.error || "User not found"); setResetLoading(false); return; }
      setFoundUserId(data.userId);
      setResetLoading(false);
      setView("forgot-reset");
    } catch {
      setResetError("Something went wrong");
      setResetLoading(false);
    }
  };

  const handleResetPassword = async () => {
    setResetPasswordError("");
    if (newPassword.length < 6) { setResetPasswordError("Password must be at least 6 characters"); return; }
    if (newPassword !== confirmNewPassword) { setResetPasswordError("Passwords don't match"); return; }
    setResetLoading(true);
    try {
      const res = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: foundUserId, newPassword }),
      });
      const data = await res.json();
      if (!res.ok) { setResetPasswordError(data.error || "Reset failed"); setResetLoading(false); return; }
      setResetLoading(false);
      setView("forgot-success");
    } catch {
      setResetPasswordError("Something went wrong");
      setResetLoading(false);
    }
  };

  const backToLogin = () => {
    setView("login");
    setResetIdentifier("");
    setResetError("");
    setNewPassword("");
    setConfirmNewPassword("");
    setResetPasswordError("");
    setFoundUserId("");
  };

  return (
    /*
      Full-screen light surface with a faint tonal blob accent
      behind the card — zero dark pixels.
    */
    <div className="min-h-screen bg-surface flex items-center justify-center p-4 relative overflow-hidden">

      {/* Decorative tonal glow — primary at very low opacity, GPU-only */}
      <div
        className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[400px] pointer-events-none"
        style={{
          background: "radial-gradient(ellipse at center top, rgba(0,88,188,0.06) 0%, transparent 70%)",
        }}
        aria-hidden="true"
      />

      <AnimatePresence mode="wait">

        {/* ─────────────────────────────────────
            VIEW: Login
            ───────────────────────────────────── */}
        {view === "login" && (
          <motion.div
            key="login"
            className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md shadow-ambient"
            {...cardMotion}
          >
            {/* Brand wordmark */}
            <Link href="/" className="font-display text-2xl font-bold gradient-text block text-center mb-2">
              NovaPay
            </Link>

            <h1 className="text-xl font-semibold text-on_surface text-center mb-6">
              Welcome back
            </h1>

            {/* Success banner — account just registered */}
            {registered && (
              <div className="bg-success/10 rounded-xl p-3 text-success text-sm mb-4 font-medium">
                Account created! Please login to continue.
              </div>
            )}

            {/* Error banner */}
            {error && (
              <div className="bg-error/10 rounded-xl p-3 text-error text-sm mb-4 font-medium">
                {error}
              </div>
            )}

            <form onSubmit={handleLogin} className="space-y-4">

              <div>
                <label className="block text-sm font-medium text-on_surface_variant mb-1.5" htmlFor="login-email">
                  Email
                </label>
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="you@example.com"
                  required
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on_surface_variant mb-1.5" htmlFor="login-password">
                  Password
                </label>
                <input
                  id="login-password"
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••"
                  required
                  className={inputCls}
                />
              </div>

              <div className="text-right">
                <button
                  type="button"
                  onClick={() => setView("forgot-find")}
                  className="text-primary text-sm font-medium hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 rounded"
                >
                  Forgot password?
                </button>
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full gradient-btn py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "Signing in..." : "Login"}
              </button>

            </form>

            <p className="text-on_surface_variant text-sm text-center mt-5">
              Don&apos;t have an account?{" "}
              <Link href="/signup" className="text-primary font-medium hover:underline">
                Sign Up
              </Link>
            </p>
          </motion.div>
        )}

        {/* ─────────────────────────────────────
            VIEW: Forgot — Find User
            ───────────────────────────────────── */}
        {view === "forgot-find" && (
          <motion.div
            key="forgot-find"
            className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md shadow-ambient"
            {...cardMotion}
          >
            <Link href="/" className="font-display text-2xl font-bold gradient-text block text-center mb-2">
              NovaPay
            </Link>

            <h1 className="text-xl font-semibold text-on_surface text-center mb-2">
              Reset Password
            </h1>
            <p className="text-on_surface_variant text-sm text-center mb-6">
              Enter your registered email or phone number
            </p>

            {resetError && (
              <div className="bg-error/10 rounded-xl p-3 text-error text-sm mb-4 font-medium">
                {resetError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on_surface_variant mb-1.5" htmlFor="reset-identifier">
                  Email or Phone Number
                </label>
                <input
                  id="reset-identifier"
                  type="text"
                  value={resetIdentifier}
                  onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  className={inputCls}
                />
              </div>

              <button
                onClick={handleFindUser}
                disabled={resetLoading}
                className="w-full gradient-btn py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? "Searching..." : "Continue"}
              </button>

              <button
                onClick={backToLogin}
                className="w-full text-center text-sm text-on_surface_variant hover:text-primary transition-colors duration-200 font-medium"
              >
                Back to Login
              </button>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────
            VIEW: Forgot — Set New Password
            ───────────────────────────────────── */}
        {view === "forgot-reset" && (
          <motion.div
            key="forgot-reset"
            className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md shadow-ambient"
            {...cardMotion}
          >
            <Link href="/" className="font-display text-2xl font-bold gradient-text block text-center mb-2">
              NovaPay
            </Link>

            <h1 className="text-xl font-semibold text-on_surface text-center mb-2">
              Set New Password
            </h1>
            <p className="text-on_surface_variant text-sm text-center mb-6">
              Create a new password for your account
            </p>

            {resetPasswordError && (
              <div className="bg-error/10 rounded-xl p-3 text-error text-sm mb-4 font-medium">
                {resetPasswordError}
              </div>
            )}

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-on_surface_variant mb-1.5" htmlFor="new-password">
                  New Password
                </label>
                <input
                  id="new-password"
                  type="password"
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  placeholder="••••••"
                  className={inputCls}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-on_surface_variant mb-1.5" htmlFor="confirm-password">
                  Re-enter New Password
                </label>
                <input
                  id="confirm-password"
                  type="password"
                  value={confirmNewPassword}
                  onChange={(e) => setConfirmNewPassword(e.target.value)}
                  placeholder="••••••"
                  className={inputCls}
                />
              </div>

              <button
                onClick={handleResetPassword}
                disabled={resetLoading}
                className="w-full gradient-btn py-3 rounded-xl font-semibold disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {resetLoading ? "Updating..." : "Update Password"}
              </button>

              <button
                onClick={backToLogin}
                className="w-full text-center text-sm text-on_surface_variant hover:text-primary transition-colors duration-200 font-medium"
              >
                Back to Login
              </button>
            </div>
          </motion.div>
        )}

        {/* ─────────────────────────────────────
            VIEW: Forgot — Success
            ───────────────────────────────────── */}
        {view === "forgot-success" && (
          <motion.div
            key="forgot-success"
            className="bg-surface-container-lowest rounded-2xl p-8 w-full max-w-md shadow-ambient text-center"
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.25, ease: [0.22, 1, 0.36, 1] }}
          >
            <Link href="/" className="font-display text-2xl font-bold gradient-text block text-center mb-4">
              NovaPay
            </Link>

            {/* Animated success check — spring bounce */}
            <motion.div
              initial={{ scale: 0 }}
              animate={{ scale: 1 }}
              transition={{ type: "spring", delay: 0.2, stiffness: 260, damping: 20 }}
            >
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center mx-auto mb-4"
                style={{ background: "rgba(0, 109, 59, 0.10)" }}
              >
                <svg
                  className="w-8 h-8"
                  style={{ color: "#006d3b" }}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  aria-hidden="true"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                </svg>
              </div>
            </motion.div>

            <h1 className="text-xl font-semibold text-on_surface mb-2">Password Updated!</h1>
            <p className="text-on_surface_variant text-sm mb-6">
              Your password has been reset successfully. You can now login with your new password.
            </p>

            <button
              onClick={backToLogin}
              className="w-full gradient-btn py-3 rounded-xl font-semibold"
            >
              Go to Login
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}

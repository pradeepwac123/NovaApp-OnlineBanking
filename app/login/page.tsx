"use client";

import { Suspense, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Link from "next/link";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

type View = "login" | "forgot-find" | "forgot-reset" | "forgot-success";

export default function LoginPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-darkbg flex items-center justify-center"><div className="w-10 h-10 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>}>
      <LoginPageContent />
    </Suspense>
  );
}

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
      router.push(role === "admin" || role === "super_admin" || role === "superadmin" ? "/admin" : "/dashboard");
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
    <div className="min-h-screen bg-darkbg flex items-center justify-center p-4">
      <AnimatePresence mode="wait">

        {/* ─── LOGIN ─── */}
        {view === "login" && (
          <motion.div key="login" className="glass rounded-2xl p-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Link href="/" className="text-2xl font-bold gradient-text block text-center mb-2">NovaPay</Link>
            <h1 className="text-xl font-semibold text-center mb-6">Welcome back</h1>

            {registered && (
              <div className="bg-success/10 border border-success/30 rounded-xl p-3 text-success text-sm mb-4">
                Account created! Please login to continue.
              </div>
            )}
            {error && <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4">{error}</div>}

            <form onSubmit={handleLogin} className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1.5">Email</label>
                <input type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="you@example.com" required
                  className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:border-primary focus:outline-none transition" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">Password</label>
                <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="••••••" required
                  className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:border-primary focus:outline-none transition" />
              </div>

              <div className="text-right">
                <button type="button" onClick={() => setView("forgot-find")} className="text-primary text-sm hover:underline">
                  Forgot password?
                </button>
              </div>

              <button type="submit" disabled={loading} className="w-full gradient-btn py-3 rounded-xl font-semibold text-white disabled:opacity-50">
                {loading ? "Signing in..." : "Login"}
              </button>
            </form>

            <p className="text-muted text-sm text-center mt-4">
              Don&apos;t have an account? <Link href="/signup" className="text-primary hover:underline">Sign Up</Link>
            </p>
          </motion.div>
        )}

        {/* ─── FORGOT: Find User ─── */}
        {view === "forgot-find" && (
          <motion.div key="forgot-find" className="glass rounded-2xl p-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Link href="/" className="text-2xl font-bold gradient-text block text-center mb-2">NovaPay</Link>
            <h1 className="text-xl font-semibold text-center mb-2">Reset Password</h1>
            <p className="text-muted text-sm text-center mb-6">Enter your registered email or phone number</p>

            {resetError && <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4">{resetError}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1.5">Email or Phone Number</label>
                <input type="text" value={resetIdentifier} onChange={(e) => setResetIdentifier(e.target.value)}
                  placeholder="you@example.com or 9876543210"
                  className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:border-primary focus:outline-none transition" />
              </div>

              <button onClick={handleFindUser} disabled={resetLoading}
                className="w-full gradient-btn py-3 rounded-xl font-semibold text-white disabled:opacity-50">
                {resetLoading ? "Searching..." : "Continue"}
              </button>

              <button onClick={backToLogin} className="w-full text-center text-sm text-muted hover:text-white transition">
                Back to Login
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── FORGOT: Set New Password ─── */}
        {view === "forgot-reset" && (
          <motion.div key="forgot-reset" className="glass rounded-2xl p-8 w-full max-w-md"
            initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -20 }}>
            <Link href="/" className="text-2xl font-bold gradient-text block text-center mb-2">NovaPay</Link>
            <h1 className="text-xl font-semibold text-center mb-2">Set New Password</h1>
            <p className="text-muted text-sm text-center mb-6">Create a new password for your account</p>

            {resetPasswordError && <div className="bg-error/10 border border-error/30 rounded-xl p-3 text-error text-sm mb-4">{resetPasswordError}</div>}

            <div className="space-y-4">
              <div>
                <label className="block text-sm text-muted mb-1.5">New Password</label>
                <input type="password" value={newPassword} onChange={(e) => setNewPassword(e.target.value)} placeholder="••••••"
                  className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:border-primary focus:outline-none transition" />
              </div>
              <div>
                <label className="block text-sm text-muted mb-1.5">Re-enter New Password</label>
                <input type="password" value={confirmNewPassword} onChange={(e) => setConfirmNewPassword(e.target.value)} placeholder="••••••"
                  className="w-full bg-darkbg border border-white/10 rounded-xl px-4 py-3 text-white placeholder-muted/50 focus:border-primary focus:outline-none transition" />
              </div>

              <button onClick={handleResetPassword} disabled={resetLoading}
                className="w-full gradient-btn py-3 rounded-xl font-semibold text-white disabled:opacity-50">
                {resetLoading ? "Updating..." : "Update Password"}
              </button>

              <button onClick={backToLogin} className="w-full text-center text-sm text-muted hover:text-white transition">
                Back to Login
              </button>
            </div>
          </motion.div>
        )}

        {/* ─── FORGOT: Success ─── */}
        {view === "forgot-success" && (
          <motion.div key="forgot-success" className="glass rounded-2xl p-8 w-full max-w-md text-center"
            initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0 }}>
            <Link href="/" className="text-2xl font-bold gradient-text block text-center mb-4">NovaPay</Link>

            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: "spring", delay: 0.2 }}>
              <div className="w-16 h-16 rounded-full bg-success/10 border-2 border-success flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-success" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" /></svg>
              </div>
            </motion.div>

            <h1 className="text-xl font-semibold mb-2">Password Updated!</h1>
            <p className="text-muted text-sm mb-6">Your password has been reset successfully. You can now login with your new password.</p>

            <button onClick={backToLogin} className="w-full gradient-btn py-3 rounded-xl font-semibold text-white">
              Go to Login
            </button>
          </motion.div>
        )}

      </AnimatePresence>
    </div>
  );
}


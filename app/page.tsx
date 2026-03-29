"use client";

import { motion } from "framer-motion";
import Link from "next/link";

const features = [
  { icon: "⚡", title: "Instant Transfers", desc: "Send money in seconds via UPI ID or phone number" },
  { icon: "🆓", title: "Zero Fees", desc: "No hidden charges. Every transaction is free" },
  { icon: "📋", title: "KYC in Minutes", desc: "Open your account with just your Aadhaar and PAN" },
  { icon: "🔒", title: "Secure Vault", desc: "Bank-grade encryption protects every transaction" },
];

const steps = [
  { num: "01", title: "Sign Up", desc: "Create your account in under a minute" },
  { num: "02", title: "Verify KYC", desc: "Upload documents using your phone camera" },
  { num: "03", title: "Start Banking", desc: "Send, receive, and manage money instantly" },
];

const fadeUp = {
  hidden: { opacity: 0, y: 28 },
  visible: (i: number) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.1, duration: 0.5, ease: [0.22, 1, 0.36, 1] },
  }),
};

export default function LandingPage() {
  return (
    /* ── Page shell — light surface background ── */
    <div className="min-h-screen bg-surface overflow-x-hidden text-on_surface">

      {/* ────────────────────────────────────────────
          NAVBAR — glassmorphism over light surface
          bg: surface_container_lowest / 80% + blur
          No 1px border — depth from ambient shadow
          ──────────────────────────────────────────── */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          {/* Brand wordmark — Manrope display font */}
          <Link href="/" className="font-display text-2xl font-bold gradient-text tracking-tight">
            NovaPay
          </Link>

          <div className="flex items-center gap-2">
            {/* Ghost login link */}
            <Link
              href="/login"
              className="px-5 py-2 rounded-xl text-sm font-medium text-on_surface_variant hover:text-primary transition-colors duration-200"
            >
              Login
            </Link>

            {/* Primary CTA */}
            <Link
              href="/signup"
              className="gradient-btn px-5 py-2 rounded-xl text-sm font-semibold"
            >
              Sign Up
            </Link>
          </div>
        </div>
      </nav>

      {/* ────────────────────────────────────────────
          HERO — asymmetric two-column layout
          Left: headline + CTAs
          Right: floating phone mockup
          ──────────────────────────────────────────── */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">

        {/* Subtle tonal blob accents — low opacity, GPU-friendly */}
        {/* Primary blue glow — top-left quadrant */}
        <div
          className="absolute top-1/4 -left-16 w-[480px] h-[480px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(0,88,188,0.07) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />
        {/* Secondary tint — bottom-right quadrant */}
        <div
          className="absolute bottom-1/4 right-0 w-[360px] h-[360px] rounded-full pointer-events-none"
          style={{
            background: "radial-gradient(circle, rgba(74,108,247,0.06) 0%, transparent 70%)",
          }}
          aria-hidden="true"
        />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-16 items-center">

          {/* ── Left column: editorial headline block ── */}
          <motion.div
            initial={{ opacity: 0, x: -36 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ duration: 0.7, ease: [0.22, 1, 0.36, 1] }}
          >
            {/* Eyebrow — secondary container chip */}
            <div className="inline-flex items-center gap-2 bg-secondary_container text-on_secondary_container text-xs font-semibold px-3 py-1.5 rounded-full mb-6">
              <span className="w-1.5 h-1.5 bg-primary rounded-full" />
              South India&apos;s Digital Bank
            </div>

            {/* Display headline — Manrope, tight tracking */}
            <h1 className="font-display text-5xl lg:text-display-lg font-bold leading-[1.08] tracking-tight text-on_surface mb-6">
              Banking made{" "}
              <span className="gradient-text">simple</span>
              {" "}for every Indian
            </h1>

            <p className="text-lg text-on_surface_variant leading-relaxed mb-8 max-w-lg">
              NovaPay is South India&apos;s digital-first bank. Open an account in minutes,
              send money instantly, and manage your finances — all from your phone.
            </p>

            <div className="flex flex-wrap gap-4">
              {/* Primary CTA */}
              <Link
                href="/signup"
                className="gradient-btn px-8 py-3.5 rounded-xl font-semibold text-lg"
              >
                Open Account
              </Link>

              {/* Ghost secondary CTA — no solid border, uses btn-ghost style */}
              <Link
                href="/login"
                className="btn-ghost px-8 py-3.5 rounded-xl font-semibold text-lg"
              >
                Login
              </Link>
            </div>

            {/* Trust indicators — small tertiary copy */}
            <div className="flex items-center gap-6 mt-8 text-sm text-on_surface_variant">
              <div className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> RBI Compliant
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> Zero Fees
              </div>
              <div className="flex items-center gap-1.5">
                <span className="text-primary">✓</span> 256-bit Encryption
              </div>
            </div>
          </motion.div>

          {/* ── Right column: floating phone mockup ── */}
          <motion.div
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3, ease: [0.22, 1, 0.36, 1] }}
          >
            <div className="animate-float">
              {/* Phone shell — surface_container_lowest card with ambient shadow */}
              <div
                className="w-72 h-[520px] rounded-[3rem] bg-surface-container-lowest shadow-ambient-lg p-4"
                style={{ boxShadow: "0 24px 64px rgba(0, 88, 188, 0.14), 0 8px 24px rgba(25, 28, 30, 0.08)" }}
              >
                {/* Phone screen — surface_container_low inner fill */}
                <div className="w-full h-full rounded-[2.4rem] bg-surface_container_low flex flex-col items-center justify-center gap-4 p-6">

                  {/* App wordmark inside phone */}
                  <div className="font-display text-4xl font-bold gradient-text">NovaPay</div>
                  {/* Tonal separator — color shift, no border */}
                  <div className="w-16 h-1 rounded-full bg-secondary_container" />
                  <p className="text-on_surface_variant text-sm text-center">Your digital bank</p>

                  {/* Mock transaction cards */}
                  <div className="mt-4 w-full space-y-3">

                    {/* Sent transaction */}
                    <div className="bg-surface-container-lowest rounded-xl p-3 flex items-center gap-3 shadow-ambient">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: "rgba(0, 109, 59, 0.12)", color: "#006d3b" }}
                      >
                        ↑
                      </div>
                      <div>
                        <div className="text-xs text-on_surface_variant">Sent to Priya</div>
                        <div className="text-sm font-semibold text-on_surface">₹2,500</div>
                      </div>
                    </div>

                    {/* Received transaction */}
                    <div className="bg-surface-container-lowest rounded-xl p-3 flex items-center gap-3 shadow-ambient">
                      <div
                        className="w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold"
                        style={{ background: "rgba(0, 88, 188, 0.10)", color: "#0058bc" }}
                      >
                        ↓
                      </div>
                      <div>
                        <div className="text-xs text-on_surface_variant">Received from Raj</div>
                        <div className="text-sm font-semibold text-on_surface">₹5,000</div>
                      </div>
                    </div>

                    {/* Balance chip */}
                    <div className="bg-primary rounded-xl p-3 text-center">
                      <div className="text-xs text-white/70 mb-0.5">Balance</div>
                      <div className="font-display text-display-sm font-bold text-white">₹47,250</div>
                    </div>

                  </div>
                </div>
              </div>
            </div>
          </motion.div>

        </div>
      </section>

      {/* ────────────────────────────────────────────
          FEATURES SECTION
          Cards: surface_container_lowest (white) on
          surface background — tonal layering, no borders
          ──────────────────────────────────────────── */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">

          <motion.div
            className="text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <h2 className="font-display text-headline-lg font-bold text-on_surface mb-4">
              Why <span className="gradient-text">NovaPay</span>?
            </h2>
            <p className="text-on_surface_variant text-lg max-w-2xl mx-auto">
              Everything you need from a modern bank, designed for the way India transacts.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-5">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="bg-surface-container-lowest rounded-xl p-6 shadow-ambient hover:shadow-elevated transition-shadow duration-300 group cursor-default"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {/* Icon — large, no background container */}
                <div className="text-4xl mb-4">{f.icon}</div>

                <h3 className="text-title-md font-semibold text-on_surface mb-2 group-hover:text-primary transition-colors duration-200">
                  {f.title}
                </h3>
                <p className="text-on_surface_variant text-sm leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────
          HOW IT WORKS
          Tonal background shift: surface_container_low
          to provide visual separation without a divider
          ──────────────────────────────────────────── */}
      <section className="py-24 bg-surface_container_low">
        <div className="max-w-5xl mx-auto px-6">

          <motion.h2
            className="font-display text-headline-lg font-bold text-on_surface text-center mb-16"
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            How it <span className="gradient-text">works</span>
          </motion.h2>

          <div className="grid md:grid-cols-3 gap-8">
            {steps.map((s, i) => (
              <motion.div
                key={s.num}
                className="text-center"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                {/* Step number — display-lg size, gradient text for brand moment */}
                <div className="font-display text-display-lg font-bold gradient-text mb-4 leading-none">
                  {s.num}
                </div>
                <h3 className="text-title-lg font-semibold text-on_surface mb-2">{s.title}</h3>
                <p className="text-on_surface_variant">{s.desc}</p>
              </motion.div>
            ))}
          </div>

        </div>
      </section>

      {/* ────────────────────────────────────────────
          SECURITY SECTION — back to base surface
          ──────────────────────────────────────────── */}
      <section className="py-24 bg-surface">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.5 }}
          >
            <div className="text-6xl mb-6">🛡️</div>

            <h2 className="font-display text-headline-lg font-bold text-on_surface mb-4">
              Bank-grade <span className="gradient-text">Security</span>
            </h2>

            <p className="text-on_surface_variant text-lg max-w-2xl mx-auto mb-10">
              Your data is encrypted end-to-end. MPIN protection, secure KYC
              verification, and RBI-compliant transaction protocols keep your money safe.
            </p>

            {/* Security badges — secondary_container chips */}
            <div className="flex flex-wrap justify-center gap-4">
              {[
                { icon: "🔐", label: "End-to-end Encryption" },
                { icon: "📱", label: "MPIN Protected" },
                { icon: "✅", label: "RBI Compliant" },
              ].map((badge) => (
                <div
                  key={badge.label}
                  className="inline-flex items-center gap-2 bg-secondary_container text-on_secondary_container text-sm font-medium px-4 py-2.5 rounded-full"
                >
                  <span>{badge.icon}</span>
                  {badge.label}
                </div>
              ))}
            </div>

          </motion.div>
        </div>
      </section>

      {/* ────────────────────────────────────────────
          FOOTER
          surface_container_low tonal band.
          No border-t — spacing provides separation.
          ──────────────────────────────────────────── */}
      <footer className="bg-surface_container_low py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-6">

          <div className="font-display text-xl font-bold gradient-text tracking-tight">NovaPay</div>

          <p className="text-on_surface_variant text-sm">
            &copy; 2026 NovaPay Digital Banking. All rights reserved.
          </p>

          <nav className="flex gap-6 text-sm" aria-label="Footer navigation">
            {["Privacy", "Terms", "Contact"].map((item) => (
              <span
                key={item}
                className="text-on_surface_variant hover:text-primary cursor-pointer transition-colors duration-200"
              >
                {item}
              </span>
            ))}
          </nav>

        </div>
      </footer>

    </div>
  );
}

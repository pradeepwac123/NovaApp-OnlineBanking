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
  hidden: { opacity: 0, y: 30 },
  visible: (i: number) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5 } }),
};

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-darkbg overflow-x-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 w-full z-50 glass">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <Link href="/" className="text-2xl font-bold gradient-text">NovaPay</Link>
          <div className="flex gap-3">
            <Link href="/login" className="px-5 py-2 rounded-xl text-sm font-medium text-muted hover:text-white transition">Login</Link>
            <Link href="/signup" className="gradient-btn px-5 py-2 rounded-xl text-sm font-medium text-white">Sign Up</Link>
          </div>
        </div>
      </nav>

      {/* Hero */}
      <section className="relative min-h-screen flex items-center justify-center pt-20">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-darkbg to-secondary/10" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-primary/20 rounded-full blur-[120px]" />
        <div className="absolute bottom-1/4 right-1/4 w-72 h-72 bg-secondary/20 rounded-full blur-[100px]" />

        <div className="relative z-10 max-w-7xl mx-auto px-6 grid lg:grid-cols-2 gap-12 items-center">
          <motion.div initial={{ opacity: 0, x: -40 }} animate={{ opacity: 1, x: 0 }} transition={{ duration: 0.7 }}>
            <h1 className="text-5xl lg:text-7xl font-bold leading-tight mb-6">
              Banking made <span className="gradient-text">simple</span> for every Indian
            </h1>
            <p className="text-lg text-muted mb-8 max-w-lg">
              NovaPay is South India&apos;s digital-first bank. Open an account in minutes, send money instantly, and manage your finances — all from your phone.
            </p>
            <div className="flex gap-4">
              <Link href="/signup" className="gradient-btn px-8 py-3.5 rounded-xl font-semibold text-white text-lg">
                Open Account
              </Link>
              <Link href="/login" className="px-8 py-3.5 rounded-xl font-semibold border border-primary/40 text-white hover:bg-primary/10 transition text-lg">
                Login
              </Link>
            </div>
          </motion.div>

          {/* Floating phone mockup */}
          <motion.div
            className="hidden lg:flex justify-center"
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.7, delay: 0.3 }}
          >
            <div className="animate-float">
              <div className="w-72 h-[520px] rounded-[3rem] border-4 border-primary/40 bg-cardbg p-4 shadow-2xl shadow-primary/20">
                <div className="w-full h-full rounded-[2.2rem] bg-gradient-to-b from-primary/30 to-darkbg flex flex-col items-center justify-center gap-4 p-6">
                  <div className="text-4xl font-bold gradient-text">NovaPay</div>
                  <div className="w-16 h-1 rounded bg-gradient-to-r from-primary to-secondary" />
                  <div className="text-muted text-sm text-center mt-2">Your digital bank</div>
                  <div className="mt-6 w-full space-y-3">
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-success/20 flex items-center justify-center text-success text-sm">↑</div>
                      <div><div className="text-xs text-muted">Sent to Priya</div><div className="text-sm font-semibold">₹2,500</div></div>
                    </div>
                    <div className="glass rounded-xl p-3 flex items-center gap-3">
                      <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center text-primary text-sm">↓</div>
                      <div><div className="text-xs text-muted">Received from Raj</div><div className="text-sm font-semibold">₹5,000</div></div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Features */}
      <section id="features" className="py-24 relative">
        <div className="max-w-7xl mx-auto px-6">
          <motion.h2 className="text-4xl font-bold text-center mb-4" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
            Why <span className="gradient-text">NovaPay</span>?
          </motion.h2>
          <p className="text-muted text-center mb-16 max-w-2xl mx-auto">Everything you need from a modern bank, designed for the way India transacts.</p>
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                className="glass rounded-2xl p-6 hover:border-primary/40 transition group"
                custom={i}
                variants={fadeUp}
                initial="hidden"
                whileInView="visible"
                viewport={{ once: true }}
              >
                <div className="text-4xl mb-4">{f.icon}</div>
                <h3 className="text-lg font-semibold mb-2 group-hover:text-primary transition">{f.title}</h3>
                <p className="text-muted text-sm">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it works */}
      <section className="py-24 bg-cardbg/30">
        <div className="max-w-5xl mx-auto px-6">
          <motion.h2 className="text-4xl font-bold text-center mb-16" initial={{ opacity: 0 }} whileInView={{ opacity: 1 }} viewport={{ once: true }}>
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
                <div className="text-6xl font-bold gradient-text mb-4">{s.num}</div>
                <h3 className="text-xl font-semibold mb-2">{s.title}</h3>
                <p className="text-muted">{s.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Security */}
      <section className="py-24">
        <div className="max-w-5xl mx-auto px-6 text-center">
          <motion.div initial={{ opacity: 0, y: 20 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }}>
            <div className="text-6xl mb-6">🛡️</div>
            <h2 className="text-4xl font-bold mb-4">Bank-grade <span className="gradient-text">Security</span></h2>
            <p className="text-muted max-w-2xl mx-auto mb-8">
              Your data is encrypted end-to-end. MPIN protection, secure KYC verification, and RBI-compliant transaction protocols keep your money safe.
            </p>
            <div className="flex justify-center gap-8 text-muted text-sm">
              <div>🔐 End-to-end Encryption</div>
              <div>📱 MPIN Protected</div>
              <div>✅ RBI Compliant</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-white/5 py-12">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="text-xl font-bold gradient-text">NovaPay</div>
          <p className="text-muted text-sm">&copy; 2026 NovaPay Digital Banking. All rights reserved.</p>
          <div className="flex gap-6 text-muted text-sm">
            <span className="hover:text-white cursor-pointer transition">Privacy</span>
            <span className="hover:text-white cursor-pointer transition">Terms</span>
            <span className="hover:text-white cursor-pointer transition">Contact</span>
          </div>
        </div>
      </footer>
    </div>
  );
}

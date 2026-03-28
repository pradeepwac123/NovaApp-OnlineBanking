"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "framer-motion";

type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  accountNo: string;
  upiId: string;
  balance: number;
  kycStatus: string;
  selfie: string | null;
  role: string;
  dob: string | null;
  blockedUntil: string | null;
  createdAt: string;
};

type Tx = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  note: string | null;
  status: string;
  createdAt: string;
  sender: { firstName: string; lastName: string };
  receiver: { firstName: string; lastName: string };
};

const formatInr = (amount: number) =>
  `₹${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

function buildVirtualCard(user: UserProfile) {
  const seed = `${user.accountNo}${user.phone}`.replace(/\D/g, "");
  const padded = seed.padEnd(16, "7").slice(0, 16);
  const number = padded.replace(/(\d{4})(?=\d)/g, "$1 ");
  const expiryDate = new Date(user.createdAt);
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);
  const expiry = `${String(expiryDate.getMonth() + 1).padStart(2, "0")}/${String(expiryDate.getFullYear()).slice(-2)}`;
  return { number, expiry, holder: `${user.firstName} ${user.lastName}`.toUpperCase() };
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [foundUser, setFoundUser] = useState<any>(null);
  const [searchError, setSearchError] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");
  const [sendError, setSendError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    password: "",
  });

  const fetchData = async () => {
    try {
      const [userRes, txRes] = await Promise.all([fetch("/api/auth/me"), fetch("/api/transactions")]);
      const userData = await userRes.json();
      const txData = await txRes.json();
      if (userData.user) {
        setUser(userData.user);
        setProfileForm({
          firstName: userData.user.firstName || "",
          lastName: userData.user.lastName || "",
          email: userData.user.email || "",
          phone: userData.user.phone || "",
          dob: userData.user.dob || "",
          password: "",
        });
      }
      if (txData.transactions) setTransactions(txData.transactions);
    } catch {}
  };

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") fetchData();
  }, [status, router]);

  useEffect(() => {
    if (user && ["admin", "super_admin", "superadmin"].includes(user.role)) {
      router.push("/admin");
      return;
    }
    if (user && user.kycStatus !== "verified" && !user.blockedUntil) {
      router.push("/onboarding");
    }
  }, [user, router]);

  useEffect(() => {
    if (user?.blockedUntil && new Date(user.blockedUntil) > new Date()) {
      setProfileOpen(false);
    }
  }, [user]);

  useEffect(() => {
    if (searchQuery.length < 3) {
      setFoundUser(null);
      setSearchError("");
      return;
    }
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-user?q=${encodeURIComponent(searchQuery)}`);
        const data = await res.json();
        if (data.user) {
          setFoundUser(data.user);
          setSearchError("");
        } else {
          setFoundUser(null);
          setSearchError("No user found");
        }
      } catch {
        setSearchError("Search failed");
      }
    }, 400);
    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSend = async () => {
    if (!foundUser || !amount || parseFloat(amount) <= 0) return;
    setSending(true);
    setSendError("");
    setSendSuccess("");
    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ toIdentifier: searchQuery, amount: parseFloat(amount), note }),
      });
      const data = await res.json();
      if (!res.ok) {
        setSendError(data.error || "Transfer failed");
      } else {
        setSendSuccess(`Sent ${formatInr(parseFloat(amount))} to ${data.receiver.firstName} ${data.receiver.lastName}`);
        setAmount("");
        setNote("");
        setSearchQuery("");
        setFoundUser(null);
        fetchData();
      }
    } catch {
      setSendError("Transfer failed");
    } finally {
      setSending(false);
    }
  };

  const handleProfileUpdate = async () => {
    setProfileError("");
    setProfileMessage("");
    if (!profileForm.password) {
      setProfileError("Enter your password to update profile");
      return;
    }
    setProfileSaving(true);
    try {
      const res = await fetch("/api/auth/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(profileForm),
      });
      const data = await res.json();
      if (!res.ok) {
        setProfileError(data.error || "Profile update failed");
      } else {
        setUser(data.user);
        setProfileForm((current) => ({ ...current, password: "" }));
        setProfileMessage("Profile updated successfully");
      }
    } catch {
      setProfileError("Profile update failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const maskedAccount = user ? `**** ${user.accountNo.slice(-4)}` : "";
  const card = useMemo(() => (user ? buildVirtualCard(user) : null), [user]);
  const sessionUserId = (session?.user as any)?.id as string | undefined;

  if (!user) {
    return <div className="min-h-screen bg-[#0a0a14] flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-[#00D4AA] border-t-transparent" /></div>;
  }

  const blocked = !!user.blockedUntil && new Date(user.blockedUntil) > new Date();

  if (blocked) {
    return (
      <div className="min-h-screen bg-[#0a0a14] text-white flex items-center justify-center p-6">
        <div className="max-w-md rounded-3xl border border-red-500/20 bg-[#11111d] p-8 text-center">
          <p className="text-sm uppercase tracking-[0.3em] text-red-300">Account Blocked</p>
          <h1 className="mt-3 text-3xl font-bold">Temporary restriction active</h1>
          <p className="mt-4 text-sm text-[#9a9ab5]">
            Your account is blocked until {new Date(user.blockedUntil!).toLocaleString("en-IN")}.
          </p>
          <button onClick={() => signOut({ callbackUrl: "/login" })} className="mt-6 rounded-xl bg-red-500/15 px-5 py-3 text-sm font-medium text-red-200 border border-red-500/30">
            Logout
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#0b0b1a] text-white">
      <div className="flex min-h-screen flex-col md:flex-row">
        <aside className="w-full border-b border-white/5 bg-[#0e0e1c] p-5 md:w-64 md:border-b-0 md:border-r">
          <div className="mb-10">
            <div className="text-2xl font-bold text-[#00D4AA]">NovaPay</div>
            <p className="mt-1 text-xs uppercase tracking-[0.25em] text-[#5a5a7a]">Secure Banking</p>
          </div>

          <nav className="space-y-2">
            <SidebarLink label="Dashboard" />
            <SidebarLink label="Payments" />
            <SidebarLink label="Virtual Card" />
            <SidebarLink label="Transactions" />
            {user.role === "admin" && (
              <button onClick={() => router.push("/admin")} className="w-full rounded-xl border border-white/10 px-4 py-3 text-left text-sm text-[#8d8dab] hover:text-white hover:border-[#6C3CE1]/30">
                Admin Panel
              </button>
            )}
          </nav>

          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-10 w-full rounded-xl border border-red-500/20 px-4 py-3 text-left text-sm text-red-300 hover:bg-red-500/10"
          >
            Logout
          </button>
        </aside>

        <main className="flex-1 p-5 md:p-8">
          <div className="mb-6 flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <p className="text-xs uppercase tracking-[0.25em] text-[#5a5a7a]">Welcome back</p>
              <h1 className="mt-2 text-3xl font-bold">Hello, {user.firstName}</h1>
            </div>

            <button onClick={() => setProfileOpen(true)} className="flex items-center gap-3 self-start rounded-2xl border border-white/10 bg-[#111122] px-4 py-3 hover:border-[#6C3CE1]/30 md:self-auto">
              <div className="flex h-11 w-11 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#6C3CE1] to-[#00D4AA] font-bold">
                {user.selfie ? <img src={user.selfie} alt="" className="h-full w-full object-cover" /> : user.firstName[0]}
              </div>
              <div className="text-left">
                <p className="text-sm font-medium">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-[#8d8dab]">Open profile</p>
              </div>
            </button>
          </div>

          <div className="grid gap-6 xl:grid-cols-[1.1fr_0.9fr]">
            <div className="space-y-6">
              <section className="rounded-3xl bg-gradient-to-br from-[#17384d] via-[#1d4f62] to-[#78d9c5] p-6 shadow-2xl">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-xs uppercase tracking-[0.25em] text-white/70">Total Balance</p>
                    <h2 className="mt-4 text-4xl font-bold">
                      {showBalance ? formatInr(user.balance) : "₹••••••••"}
                    </h2>
                  </div>
                  <button onClick={() => setShowBalance((value) => !value)} className="rounded-full border border-white/20 px-4 py-2 text-xs text-white/80">
                    {showBalance ? "Hide" : "Show"}
                  </button>
                </div>

                <div className="mt-8 grid gap-4 sm:grid-cols-3">
                  <SummaryPill label="UPI ID" value={user.upiId} />
                  <SummaryPill label="Account Number" value={maskedAccount} />
                  <SummaryPill label="KYC Status" value={user.kycStatus} />
                </div>
              </section>

              <section className="rounded-3xl border border-white/5 bg-[#0e0e1c] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <h2 className="text-xl font-semibold">Virtual Debit Card</h2>
                    <p className="text-sm text-[#8d8dab]">Card number, expiry year, and holder name</p>
                  </div>
                </div>

                {card && (
                  <div className="rounded-[28px] bg-gradient-to-br from-[#5625c6] via-[#2438b8] to-[#0ec6a5] p-6 shadow-2xl">
                    <div className="flex items-center justify-between">
                      <span className="text-sm uppercase tracking-[0.35em] text-white/75">NovaPay Virtual</span>
                      <span className="rounded-full bg-white/15 px-3 py-1 text-xs">Debit</span>
                    </div>
                    <p className="mt-12 font-mono text-2xl tracking-[0.25em]">{card.number}</p>
                    <div className="mt-8 flex items-end justify-between">
                      <div>
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Card Holder</p>
                        <p className="mt-1 font-semibold">{card.holder}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">Expiry</p>
                        <p className="mt-1 font-semibold">{card.expiry}</p>
                      </div>
                    </div>
                  </div>
                )}
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-3xl border border-white/5 bg-[#0e0e1c] p-6">
                <h2 className="text-xl font-semibold">Send Money</h2>
                <p className="mt-1 text-sm text-[#8d8dab]">Search user by phone or UPI ID</p>

                <div className="mt-5 space-y-4">
                  {sendSuccess && <div className="rounded-2xl border border-[#00D4AA]/20 bg-[#00D4AA]/10 px-4 py-3 text-sm text-[#00D4AA]">{sendSuccess}</div>}
                  {sendError && <div className="rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{sendError}</div>}

                  <input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Phone or UPI ID"
                    className="w-full rounded-2xl border border-white/10 bg-[#141425] px-4 py-3 text-sm text-white outline-none focus:border-[#6C3CE1]/35"
                  />

                  {foundUser && (
                    <div className="rounded-2xl border border-[#00D4AA]/20 bg-[#141425] px-4 py-3">
                      <p className="font-medium">{foundUser.firstName} {foundUser.lastName}</p>
                      <p className="text-xs text-[#8d8dab]">{foundUser.upiId}</p>
                    </div>
                  )}
                  {searchError && <p className="text-xs text-red-300">{searchError}</p>}

                  <input
                    type="number"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="Amount in INR"
                    className="w-full rounded-2xl border border-white/10 bg-[#141425] px-4 py-3 text-sm text-white outline-none focus:border-[#6C3CE1]/35"
                  />

                  <input
                    value={note}
                    onChange={(e) => setNote(e.target.value)}
                    placeholder="Note (optional)"
                    className="w-full rounded-2xl border border-white/10 bg-[#141425] px-4 py-3 text-sm text-white outline-none focus:border-[#6C3CE1]/35"
                  />

                  <button onClick={handleSend} disabled={sending || !foundUser || !amount} className="w-full rounded-2xl bg-gradient-to-r from-[#6C3CE1] to-[#00D4AA] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
                    {sending ? "Sending..." : "Send Money"}
                  </button>
                </div>
              </section>

              <section className="rounded-3xl border border-white/5 bg-[#0e0e1c] p-6">
                <div className="mb-5 flex items-center justify-between">
                  <h2 className="text-xl font-semibold">Recent Transactions</h2>
                  <span className="text-xs text-[#8d8dab]">{transactions.length} records</span>
                </div>

                <div className="space-y-3">
                  {transactions.length === 0 && (
                    <div className="rounded-2xl border border-dashed border-white/10 px-4 py-10 text-center text-sm text-[#8d8dab]">
                      No transactions yet.
                    </div>
                  )}

                  {transactions.slice(0, 6).map((tx) => {
                    const isSent = tx.senderId === sessionUserId;
                    return (
                      <div key={tx.id} className="flex items-center justify-between rounded-2xl border border-white/5 bg-white/[0.02] px-4 py-4">
                        <div>
                          <p className="font-medium">
                            {isSent ? `${tx.receiver.firstName} ${tx.receiver.lastName}` : `${tx.sender.firstName} ${tx.sender.lastName}`}
                          </p>
                          <p className="text-xs text-[#8d8dab]">{tx.note || new Date(tx.createdAt).toLocaleDateString("en-IN")}</p>
                        </div>
                        <div className={`text-sm font-semibold ${isSent ? "text-red-300" : "text-[#00D4AA]"}`}>
                          {isSent ? "-" : "+"}{formatInr(tx.amount)}
                        </div>
                      </div>
                    );
                  })}
                </div>
              </section>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {profileOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-black/50"
              onClick={() => setProfileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto border-l border-white/10 bg-[#0e0e1c] p-6"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.25em] text-[#5a5a7a]">Your Profile</p>
                  <h2 className="mt-2 text-2xl font-bold">{user.firstName} {user.lastName}</h2>
                </div>
                <button onClick={() => setProfileOpen(false)} className="rounded-full border border-white/10 px-3 py-2 text-sm text-[#8d8dab]">
                  Close
                </button>
              </div>

              <div className="mt-6 rounded-3xl border border-white/5 bg-[#111122] p-5">
                <div className="mb-5 flex items-center gap-4">
                  <div className="flex h-16 w-16 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#6C3CE1] to-[#00D4AA] text-lg font-bold">
                    {user.selfie ? <img src={user.selfie} alt="" className="h-full w-full object-cover" /> : user.firstName[0]}
                  </div>
                  <div>
                    <p className="font-medium">{user.email}</p>
                    <p className="text-sm text-[#8d8dab]">{user.phone}</p>
                  </div>
                </div>

                <div className="grid gap-3">
                  <ProfileInput label="First Name" value={profileForm.firstName} onChange={(value) => setProfileForm((current) => ({ ...current, firstName: value }))} />
                  <ProfileInput label="Last Name" value={profileForm.lastName} onChange={(value) => setProfileForm((current) => ({ ...current, lastName: value }))} />
                  <ProfileInput label="Email" value={profileForm.email} onChange={(value) => setProfileForm((current) => ({ ...current, email: value }))} />
                  <ProfileInput label="Phone" value={profileForm.phone} onChange={(value) => setProfileForm((current) => ({ ...current, phone: value }))} />
                  <ProfileInput label="Date of Birth" type="date" value={profileForm.dob} onChange={(value) => setProfileForm((current) => ({ ...current, dob: value }))} />
                  <ProfileInput label="Confirm Password" type="password" value={profileForm.password} onChange={(value) => setProfileForm((current) => ({ ...current, password: value }))} />
                </div>

                {profileMessage && <div className="mt-4 rounded-2xl border border-[#00D4AA]/20 bg-[#00D4AA]/10 px-4 py-3 text-sm text-[#00D4AA]">{profileMessage}</div>}
                {profileError && <div className="mt-4 rounded-2xl border border-red-500/20 bg-red-500/10 px-4 py-3 text-sm text-red-300">{profileError}</div>}

                <button onClick={handleProfileUpdate} disabled={profileSaving} className="mt-5 w-full rounded-2xl bg-gradient-to-r from-[#6C3CE1] to-[#00D4AA] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
                  {profileSaving ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

function SidebarLink({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-white/10 px-4 py-3 text-sm text-[#8d8dab]">
      {label}
    </div>
  );
}

function SummaryPill({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/10 bg-white/5 px-4 py-4">
      <p className="text-[10px] uppercase tracking-[0.25em] text-white/60">{label}</p>
      <p className="mt-2 text-sm font-medium">{value}</p>
    </div>
  );
}

function ProfileInput({
  label,
  value,
  onChange,
  type = "text",
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  type?: string;
}) {
  return (
    <label>
      <span className="mb-2 block text-sm text-[#8d8dab]">{label}</span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-2xl border border-white/10 bg-[#141425] px-4 py-3 text-sm text-white outline-none focus:border-[#6C3CE1]/35"
      />
    </label>
  );
}


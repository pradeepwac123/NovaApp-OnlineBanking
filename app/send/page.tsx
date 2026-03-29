"use client";

import { useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { AnimatePresence, motion } from "framer-motion";

type FoundUser = { id: string; firstName: string; lastName: string; upiId: string };
type QuickContact = {
  id: string;
  firstName: string;
  lastName: string;
  identifier: string;
  upiId: string;
};
type UserProfile = {
  firstName: string;
  lastName: string;
  email: string;
  balance: number;
  avatar: string | null;
  selfie: string | null;
  hasMpin?: boolean;
};
type Tx = {
  id: string;
  senderId: string;
  receiverId: string;
  amount: number;
  note: string | null;
  status: string;
  createdAt: string;
  sender: { firstName: string; lastName: string; upiId?: string; phone?: string };
  receiver: { firstName: string; lastName: string; upiId?: string; phone?: string };
};

const formatInr = (amount: number) =>
  `\u20B9${amount.toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const initials = (first: string, last: string) => `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

export default function SendPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [search, setSearch] = useState("");
  const [foundUser, setFoundUser] = useState<FoundUser | null>(null);
  const [searchError, setSearchError] = useState("");
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [success, setSuccess] = useState("");
  const [error, setError] = useState("");
  const [mpinOpen, setMpinOpen] = useState(false);
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [mpinError, setMpinError] = useState("");
  const searchRequestRef = useRef(0);

  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const avatar = user?.avatar || user?.selfie || null;

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      Promise.all([fetch("/api/auth/me"), fetch("/api/transactions")])
        .then(async ([userRes, txRes]) => ({
          userData: await userRes.json(),
          txData: await txRes.json(),
        }))
        .then(({ userData, txData }) => {
          if (userData.user) setUser(userData.user);
          if (txData.transactions) setTransactions(txData.transactions);
        })
        .catch(() => {});
    }
  }, [status, router]);

  useEffect(() => {
    if (search.length < 3) {
      setFoundUser(null);
      setSearchError("");
      searchRequestRef.current += 1;
      return;
    }

    const requestId = ++searchRequestRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search-user?q=${encodeURIComponent(search)}`);
        const data = await res.json();
        if (requestId !== searchRequestRef.current) return;
        if (data.user) {
          setFoundUser(data.user);
          setSearchError("");
        } else {
          setFoundUser(null);
          setSearchError("No user found");
        }
      } catch {
        if (requestId !== searchRequestRef.current) return;
        setFoundUser(null);
        setSearchError("Search failed");
      }
    }, 350);
    return () => clearTimeout(timer);
  }, [search]);

  const contacts = useMemo<QuickContact[]>(() => {
    if (!sessionUserId) return [];
    const seen = new Set<string>();
    return transactions
      .flatMap((tx) => {
        const isSent = tx.senderId === sessionUserId;
        const id = isSent ? tx.receiverId : tx.senderId;
        const upiId = isSent ? tx.receiver.upiId || "" : tx.sender.upiId || "";
        const phone = isSent ? tx.receiver.phone || "" : tx.sender.phone || "";
        const identifier = upiId || phone;
        if (!identifier || seen.has(id)) return [];
        seen.add(id);
        return [{
          id,
          firstName: isSent ? tx.receiver.firstName : tx.sender.firstName,
          lastName: isSent ? tx.receiver.lastName : tx.sender.lastName,
          identifier,
          upiId: upiId || identifier,
        }];
      })
      .slice(0, 4);
  }, [transactions, sessionUserId]);

  const recentActivity = useMemo(() => transactions.slice(0, 3), [transactions]);

  const handleTransfer = async () => {
    const joined = mpin.join("");
    if (!foundUser || !amount || parseFloat(amount) <= 0) return;
    if (joined.length !== 4) {
      setMpinError("Enter your 4-digit MPIN");
      return;
    }

    setSending(true);
    setError("");
    setSuccess("");

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toIdentifier: search,
          amount: parseFloat(amount),
          note,
          mpin: joined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        setMpinError(data.error || "Transfer failed");
      } else {
        setSuccess(`${formatInr(parseFloat(amount))} sent to ${data.receiver.firstName} ${data.receiver.lastName}`);
        setSearch("");
        setFoundUser(null);
        setSearchError("");
        setAmount("");
        setNote("");
        setMpin(["", "", "", ""]);
        setMpinOpen(false);
      }
    } catch {
      setMpinError("Transfer failed");
    } finally {
      setSending(false);
    }
  };

  const openMpin = () => {
    setError("");
    if (!user?.hasMpin) {
      setError("Set your MPIN first before sending money");
      return;
    }
    if (!foundUser || !amount || parseFloat(amount) <= 0) {
      setError("Choose a recipient and amount first");
      return;
    }
    setMpin(["", "", "", ""]);
    setMpinError("");
    setMpinOpen(true);
  };

  if (status === "loading" || !user) {
    return <div className="min-h-screen bg-[#f3f6fb] flex items-center justify-center"><div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" /></div>;
  }

  return (
    <div className="min-h-screen bg-[#f6f8fc] text-[#172033]">
      <div className="grid min-h-screen xl:grid-cols-[144px_minmax(0,1fr)]">
        <aside className="border-r border-slate-100 bg-[#fbfcfe] px-4 py-5">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-[#1b76ff] text-lg font-bold text-white">N</div>
            <div>
              <p className="font-display text-lg font-bold text-[#2372ff]">NovaApp</p>
              <p className="text-[11px] uppercase tracking-[0.18em] text-slate-400">Digital personal banking</p>
            </div>
          </div>

          <nav className="mt-12 space-y-2">
            {["Dashboard", "Transactions", "Payments", "Cards", "Settings"].map((item) => (
              <button
                key={item}
                onClick={() => (item === "Dashboard" ? router.push("/dashboard") : undefined)}
                className={`w-full rounded-[0.8rem] px-4 py-3 text-left text-sm font-medium ${
                  item === "Payments" ? "bg-white text-[#2372ff] shadow-[0_2px_10px_rgba(18,38,63,0.05)]" : "text-slate-500 hover:bg-white"
                }`}
              >
                {item}
              </button>
            ))}
          </nav>
        </aside>

        <main className="bg-[#f7f9fc]">
          <header className="flex flex-col gap-4 border-b border-slate-100 bg-white px-5 py-4 lg:flex-row lg:items-center lg:justify-between">
            <input
              placeholder="Search transactions, bills, or contacts..."
              className="w-full max-w-xl rounded-full bg-[#f6f8fc] px-5 py-3 text-sm text-slate-700 outline-none"
            />
            <div className="flex items-center gap-4 self-end lg:self-auto">
              <span className="text-slate-400">◌</span>
              <div className="text-right">
                <p className="text-sm font-semibold text-slate-900">{user.firstName} {user.lastName}</p>
                <p className="text-xs text-slate-400">Premium Member</p>
              </div>
              <div className="flex h-10 w-10 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1b76ff] to-[#8ec0ff] text-sm font-semibold text-white">
                {avatar ? <img src={avatar} alt="" className="h-full w-full object-cover" /> : initials(user.firstName, user.lastName)}
              </div>
            </div>
          </header>

          <div className="mx-auto mt-7 grid max-w-[1180px] gap-6 px-5 pb-6 xl:grid-cols-[minmax(0,1.3fr)_300px]">
            <div className="space-y-6">
              <section>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-[1.75rem] font-bold text-slate-900">Quick Send</p>
                  </div>
                  <button className="text-sm font-semibold text-[#2372ff]">View All Contacts</button>
                </div>

                <div className="mt-5 flex flex-wrap gap-4">
                  {contacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => {
                        setSearch(contact.identifier);
                        setFoundUser({
                          id: contact.id,
                          firstName: contact.firstName,
                          lastName: contact.lastName,
                          upiId: contact.upiId || contact.identifier,
                        });
                        setSearchError("");
                        setError("");
                      }}
                      className="flex w-[88px] flex-col items-center rounded-[1.15rem] bg-white px-3 py-4 shadow-[0_6px_18px_rgba(18,38,63,0.04)]"
                    >
                      <div className="flex h-12 w-12 items-center justify-center rounded-full bg-gradient-to-br from-[#1b76ff] to-[#8ec0ff] text-sm font-semibold text-white">
                        {initials(contact.firstName, contact.lastName)}
                      </div>
                      <span className="mt-3 text-sm font-medium text-slate-700">{contact.firstName}</span>
                    </button>
                  ))}
                  <button className="flex w-[88px] flex-col items-center rounded-[1.15rem] border border-dashed border-[#b9c7e8] px-3 py-4 text-slate-400">
                    <div className="flex h-12 w-12 items-center justify-center rounded-full bg-[#f5f7fb] text-2xl">+</div>
                    <span className="mt-3 text-sm font-medium">New</span>
                  </button>
                </div>
              </section>

              <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
                <p className="text-[1.8rem] font-bold text-slate-900">Transfer Details</p>

                <div className="mt-6 space-y-5">
                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Recipient</span>
                    <input
                      value={search}
                      onChange={(e) => {
                        setSearch(e.target.value);
                        setSearchError("");
                      }}
                      placeholder="Enter name, email, or account number"
                      className="w-full rounded-[1.1rem] bg-[#f5f7fb] px-4 py-4 text-sm text-slate-800 outline-none"
                    />
                  </label>

                  {foundUser && (
                    <div className="rounded-[1.1rem] bg-[#eef4ff] px-4 py-4">
                      <p className="text-sm font-semibold text-slate-900">{foundUser.firstName} {foundUser.lastName}</p>
                      <p className="text-xs text-slate-500">{foundUser.upiId}</p>
                    </div>
                  )}

                  {!foundUser && searchError && <p className="text-sm font-medium text-[#e36a5d]">{searchError}</p>}

                  <div className="grid gap-4 md:grid-cols-[minmax(0,1fr)_160px]">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Amount</span>
                      <input
                        type="number"
                        min="1"
                        value={amount}
                        onChange={(e) => setAmount(e.target.value)}
                        placeholder="$ 0.00"
                        className="w-full rounded-[1.1rem] bg-[#f5f7fb] px-4 py-4 text-xl font-semibold text-slate-800 outline-none"
                      />
                    </label>
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Currency</span>
                      <div className="w-full rounded-[1.1rem] bg-[#f5f7fb] px-4 py-4 text-sm font-semibold text-slate-700">USD</div>
                    </label>
                  </div>

                  <label className="block">
                    <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Optional Note</span>
                    <textarea
                      value={note}
                      onChange={(e) => setNote(e.target.value)}
                      placeholder="What is this for?"
                      rows={4}
                      className="w-full resize-none rounded-[1.1rem] bg-[#f5f7fb] px-4 py-4 text-sm text-slate-800 outline-none"
                    />
                  </label>

                  {error && <div className="rounded-[1rem] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#e36a5d]">{error}</div>}
                  {success && <div className="rounded-[1rem] bg-[#ecfaf4] px-4 py-3 text-sm font-medium text-[#1fa16b]">{success}</div>}

                  <button
                    onClick={openMpin}
                    disabled={!foundUser || !amount || sending}
                    className="w-full rounded-[1.1rem] bg-[#1b76ff] px-5 py-4 text-base font-semibold text-white shadow-[0_18px_40px_rgba(27,118,255,0.3)] disabled:opacity-40"
                  >
                    Send Money Now
                  </button>
                </div>
              </section>
            </div>

            <div className="space-y-6">
              <section className="rounded-[1.8rem] bg-gradient-to-br from-[#172b52] to-[#233d6c] p-6 text-white shadow-[0_25px_55px_rgba(18,38,63,0.18)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/55">Available Balance</p>
                    <p className="mt-4 text-4xl font-bold tracking-tight">{formatInr(user.balance)}</p>
                  </div>
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-sm font-semibold text-white">
                    ◫
                  </div>
                </div>
                <div className="mt-8 flex items-center gap-3 text-xs text-white/70">
                  <span className="rounded-full bg-[#3182ff] px-2 py-1 text-white">VISA</span>
                  <span className="rounded-full bg-[#8fb3ff] px-2 py-1 text-[#172b52]">MC</span>
                  <span>Connected to 2 main accounts</span>
                </div>
              </section>

              <section className="rounded-[1.8rem] bg-white p-6 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
                <div className="flex items-center justify-between">
                  <p className="text-2xl font-bold text-slate-900">Recent Activity</p>
                  <span className="text-slate-300">↻</span>
                </div>

                <div className="mt-5 space-y-4">
                  {recentActivity.length === 0 ? (
                    <p className="rounded-[1rem] bg-[#f7f9fc] px-4 py-6 text-center text-sm text-slate-400">No recent activity yet</p>
                  ) : (
                    recentActivity.map((tx) => {
                      const isSent = tx.senderId === sessionUserId;
                      const first = isSent ? tx.receiver.firstName : tx.sender.firstName;
                      const last = isSent ? tx.receiver.lastName : tx.sender.lastName;
                      return (
                        <div key={tx.id} className="flex items-center gap-3">
                          <div className={`flex h-11 w-11 items-center justify-center rounded-full text-sm font-semibold ${isSent ? "bg-[#ffe9e5] text-[#e36a5d]" : "bg-[#eaf2ff] text-[#2372ff]"}`}>
                            {isSent ? "↗" : "↙"}
                          </div>
                          <div className="min-w-0 flex-1">
                            <p className="text-sm font-semibold text-slate-800">{first} {last}</p>
                            <p className="text-xs text-slate-400">{new Date(tx.createdAt).toLocaleString("en-IN", { month: "short", day: "numeric", hour: "numeric", minute: "2-digit" })}</p>
                          </div>
                          <p className={`text-sm font-semibold ${isSent ? "text-[#e36a5d]" : "text-[#2372ff]"}`}>
                            {isSent ? "-" : "+"}{formatInr(tx.amount)}
                          </p>
                        </div>
                      );
                    })
                  )}
                </div>

                <button className="mt-6 w-full rounded-[1rem] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600">
                  Download Full Statement
                </button>
              </section>
            </div>
          </div>
        </main>
      </div>

      <AnimatePresence>
        {mpinOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setMpinOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(18,38,63,0.18)]"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Payment Confirmation</p>
              <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">Enter MPIN</h2>
              <p className="mt-2 text-sm text-slate-500">Confirm sending {amount ? formatInr(parseFloat(amount || "0")) : "money"} to {foundUser?.firstName || "recipient"}.</p>

              <div className="mt-6 flex  gap-3">
                {mpin.map((digit, index) => (
                  <input
                    key={index}
                    type="password"
                    inputMode="numeric"
                    maxLength={1}
                    value={digit}
                    onChange={(e) => {
                      const value = e.target.value.replace(/\D/g, "").slice(-1);
                      setMpin((current) => current.map((item, i) => (i === index ? value : item)));
                      setMpinError("");
                    }}
                    className="h-14 w-14 rounded-[1rem] border border-[#cfe0ff] bg-[#eef4ff] text-center text-xl font-semibold text-slate-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] focus:border-[#2d7cff] focus:bg-white focus:ring-2 focus:ring-[#2d7cff]/20"
                  />
                ))}
              </div>

              {mpinError && <p className="mt-4 text-center text-sm font-medium text-[#e36a5d]">{mpinError}</p>}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button onClick={() => setMpinOpen(false)} className="rounded-[1rem] bg-[#f5f7fb] px-4 py-3 text-sm font-semibold text-slate-600">Cancel</button>
                <button onClick={handleTransfer} disabled={sending} className="rounded-[1rem] bg-[#1b76ff] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40">
                  {sending ? "Sending..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </div>
  );
}

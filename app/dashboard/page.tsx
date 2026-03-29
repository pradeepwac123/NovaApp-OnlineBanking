"use client";

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
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
  avatar: string | null;
  role: string;
  dob: string | null;
  blockedUntil: string | null;
  createdAt: string;
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

type Recipient = {
  id: string;
  firstName: string;
  lastName: string;
  upiId: string;
  identifier?: string;
};

const formatInr = (amount: number) =>
  `\u20B9${amount.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;

const compactInr = (amount: number) =>
  `\u20B9${new Intl.NumberFormat("en-IN", {
    notation: "compact",
    maximumFractionDigits: 2,
  }).format(amount)}`;

const initials = (first: string, last: string) =>
  `${first[0] ?? ""}${last[0] ?? ""}`.toUpperCase();

function buildVirtualCard(user: UserProfile) {
  const seed = `${user.accountNo}${user.phone}`
    .replace(/\D/g, "")
    .padEnd(16, "7")
    .slice(0, 16);

  const expiryDate = new Date(user.createdAt);
  expiryDate.setFullYear(expiryDate.getFullYear() + 5);

  return {
    number: seed.replace(/(\d{4})(?=\d)/g, "$1 "),
    expiry: `${String(expiryDate.getMonth() + 1).padStart(2, "0")}/${String(
      expiryDate.getFullYear()
    ).slice(-2)}`,
    holder: `${user.firstName} ${user.lastName}`.toUpperCase(),
  };
}

function transferMeta(createdAt: string) {
  return new Date(createdAt).toLocaleString("en-IN", {
    month: "short",
    day: "numeric",
    hour: "numeric",
    minute: "2-digit",
  });
}

export default function DashboardPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  const [user, setUser] = useState<UserProfile | null>(null);
  const [transactions, setTransactions] = useState<Tx[]>([]);
  const [showBalance, setShowBalance] = useState(true);
  const [profileOpen, setProfileOpen] = useState(false);
  const [activeTab, setActiveTab] = useState<"dashboard" | "transactions" | "payments" | "cards" | "settings">("dashboard");
  const [searchQuery, setSearchQuery] = useState("");
  const [transactionSearch, setTransactionSearch] = useState("");
  const [transactionFilter, setTransactionFilter] = useState<"all" | "income" | "expense">("all");
  const [foundUser, setFoundUser] = useState<Recipient | null>(null);
  const [searchError, setSearchError] = useState("");
  const [paymentFormEnabled, setPaymentFormEnabled] = useState(false);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [sending, setSending] = useState(false);
  const [sendSuccess, setSendSuccess] = useState("");
  const [sendError, setSendError] = useState("");
  const [profileMessage, setProfileMessage] = useState("");
  const [profileError, setProfileError] = useState("");
  const [profileSaving, setProfileSaving] = useState(false);
  const [mpinPromptOpen, setMpinPromptOpen] = useState(false);
  const [mpin, setMpin] = useState(["", "", "", ""]);
  const [mpinError, setMpinError] = useState("");
  const [requestSuccess, setRequestSuccess] = useState("");
  const [cardFrozen, setCardFrozen] = useState(false);
  const [showCardNumber, setShowCardNumber] = useState(false);
  const [copiedCard, setCopiedCard] = useState(false);
  const [limitsOpen, setLimitsOpen] = useState(false);
  const [dailyLimit, setDailyLimit] = useState(50000);
  const [changePinOpen, setChangePinOpen] = useState(false);
  const [pinResetPassword, setPinResetPassword] = useState("");
  const [newPinDigits, setNewPinDigits] = useState(["", "", "", ""]);
  const [confirmPinDigits, setConfirmPinDigits] = useState(["", "", "", ""]);
  const [pinError, setPinError] = useState("");
  const [pinSaving, setPinSaving] = useState(false);
  const [pinUpdated, setPinUpdated] = useState(false);
  const searchRequestRef = useRef(0);
  const [profileForm, setProfileForm] = useState({
    firstName: "",
    lastName: "",
    email: "",
    phone: "",
    dob: "",
    avatar: "",
    password: "",
  });

  const fetchData = async () => {
    try {
      const [userRes, txRes] = await Promise.all([
        fetch("/api/auth/me"),
        fetch("/api/transactions"),
      ]);
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
          avatar: userData.user.avatar || "",
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
      searchRequestRef.current += 1;
      return;
    }

    const requestId = ++searchRequestRef.current;
    const timer = setTimeout(async () => {
      try {
        const res = await fetch(
          `/api/search-user?q=${encodeURIComponent(searchQuery)}`
        );
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
    }, 400);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const handleSend = async (mpinValue: string) => {
    if (!foundUser || !amount || parseFloat(amount) <= 0) return;

    setSending(true);
    setSendError("");
    setSendSuccess("");

    try {
      const res = await fetch("/api/transfer", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          toIdentifier: searchQuery,
          amount: parseFloat(amount),
          note,
          mpin: mpinValue,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        setSendError(data.error || "Transfer failed");
      } else {
        setSendSuccess(
          `Sent ${formatInr(parseFloat(amount))} to ${data.receiver.firstName} ${data.receiver.lastName}`
        );
        setAmount("");
        setNote("");
        setSearchQuery("");
        setFoundUser(null);
        setSearchError("");
        setMpin(["", "", "", ""]);
        setMpinPromptOpen(false);
        fetchData();
      }
    } catch {
      setSendError("Transfer failed");
    } finally {
      setSending(false);
    }
  };

  const openMpinPrompt = () => {
    if (!foundUser || !amount) return;
    if (!user?.hasMpin) {
      setSendError("Set your MPIN in onboarding before sending money");
      return;
    }
    setMpin(["", "", "", ""]);
    setMpinError("");
    setMpinPromptOpen(true);
  };

  const submitMpinTransfer = () => {
    const joined = mpin.join("");
    if (joined.length !== 4) {
      setMpinError("Enter your 4-digit MPIN");
      return;
    }
    handleSend(joined);
  };

  const handleRequest = () => {
    if (!foundUser || !amount || parseFloat(amount) <= 0) return;
    setRequestSuccess(
      `Request for ${formatInr(parseFloat(amount))} sent to ${foundUser.firstName} ${foundUser.lastName}`
    );
    setAmount("");
    setNote("");
    setSearchQuery("");
    setFoundUser(null);
    setSearchError("");
    setTimeout(() => setRequestSuccess(""), 4000);
  };

  const openNewPaymentForm = () => {
    setPaymentFormEnabled(true);
    setSearchQuery("");
    setFoundUser(null);
    setSearchError("");
    setSendError("");
    setSendSuccess("");
    setRequestSuccess("");
    setAmount("");
    setNote("");
  };

  const selectQuickRecipient = (contact: Recipient) => {
    setPaymentFormEnabled(true);
    setSearchQuery(contact.identifier || contact.upiId);
    setFoundUser({
      id: contact.id,
      firstName: contact.firstName,
      lastName: contact.lastName,
      upiId: contact.upiId,
    });
    setSearchError("");
    setSendError("");
    setSendSuccess("");
    setRequestSuccess("");
  };

  const handleAvatarChange = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    setProfileError("");
    setProfileMessage("");

    if (!file.type.startsWith("image/")) {
      setProfileError("Please choose a valid image file");
      event.target.value = "";
      return;
    }

    if (file.size > 2 * 1024 * 1024) {
      setProfileError("Profile photo must be 2 MB or smaller");
      event.target.value = "";
      return;
    }

    const reader = new FileReader();
    reader.onload = () => {
      if (typeof reader.result === "string") {
        setProfileForm((cur) => ({ ...cur, avatar: reader.result as string }));
      } else {
        setProfileError("Could not read selected image");
      }
    };
    reader.onerror = () => setProfileError("Could not read selected image");
    reader.readAsDataURL(file);
    event.target.value = "";
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
        setProfileForm({
          firstName: data.user.firstName || "",
          lastName: data.user.lastName || "",
          email: data.user.email || "",
          phone: data.user.phone || "",
          dob: data.user.dob || "",
          avatar: data.user.avatar || "",
          password: "",
        });
        setProfileMessage("Profile updated successfully");
      }
    } catch {
      setProfileError("Profile update failed");
    } finally {
      setProfileSaving(false);
    }
  };

  const sessionUserId = (session?.user as { id?: string } | undefined)?.id;
  const profileAvatar = profileForm.avatar || user?.avatar || user?.selfie;
  const blocked =
    !!user?.blockedUntil && new Date(user.blockedUntil) > new Date();
  const card = useMemo(() => (user ? buildVirtualCard(user) : null), [user]);

  const openResetMpinPanel = () => {
    setChangePinOpen(true);
    setPinResetPassword("");
    setNewPinDigits(["", "", "", ""]);
    setConfirmPinDigits(["", "", "", ""]);
    setPinError("");
    setPinUpdated(false);
  };

  const weeklySeries = useMemo(() => {
    if (!sessionUserId) return Array.from({ length: 7 }, () => 0);

    const now = new Date();
    const start = new Date(now);
    start.setDate(now.getDate() - 6);
    start.setHours(0, 0, 0, 0);

    const buckets = Array.from({ length: 7 }, () => 0);
    transactions.forEach((tx) => {
      if (tx.senderId !== sessionUserId) return;
      const txDate = new Date(tx.createdAt);
      if (txDate < start) return;
      const offset = Math.floor((txDate.getTime() - start.getTime()) / 86400000);
      if (offset >= 0 && offset < 7) buckets[offset] += tx.amount;
    });
    return buckets;
  }, [transactions, sessionUserId]);

  const sentThisWeek = weeklySeries.reduce((total, value) => total + value, 0);

  const recentContacts = useMemo(() => {
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
        return [
          {
            id,
            firstName: isSent ? tx.receiver.firstName : tx.sender.firstName,
            lastName: isSent ? tx.receiver.lastName : tx.sender.lastName,
            upiId: upiId || identifier,
            identifier,
          },
        ];
      })
      .slice(0, 3);
  }, [transactions, sessionUserId]);

  const monthSpend = useMemo(() => {
    if (!sessionUserId) return 0;
    const now = new Date();
    return transactions.reduce((total, tx) => {
      const txDate = new Date(tx.createdAt);
      if (tx.senderId !== sessionUserId) return total;
      if (txDate.getMonth() !== now.getMonth() || txDate.getFullYear() !== now.getFullYear()) {
        return total;
      }
      return total + tx.amount;
    }, 0);
  }, [transactions, sessionUserId]);

  const filteredTransactions = useMemo(() => {
    const query = transactionSearch.trim().toLowerCase();
    const searched = !query
      ? transactions
      : transactions.filter((tx) => {
          const isSent = tx.senderId === sessionUserId;
          const name = isSent
            ? `${tx.receiver.firstName} ${tx.receiver.lastName}`
            : `${tx.sender.firstName} ${tx.sender.lastName}`;
          return (
            name.toLowerCase().includes(query) ||
            (tx.note || "").toLowerCase().includes(query) ||
            tx.status.toLowerCase().includes(query)
          );
        });

    if (transactionFilter === "all") return searched;

    return searched.filter((tx) => {
      const isSent = tx.senderId === sessionUserId;
      return transactionFilter === "expense" ? isSent : !isSent;
    });
  }, [transactionSearch, transactionFilter, transactions, sessionUserId]);

  if (!user) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="h-10 w-10 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  if (blocked) {
    return (
      <div className="min-h-screen bg-surface flex items-center justify-center p-6">
        <div className="w-full max-w-md rounded-[2rem] bg-white p-8 shadow-[0_24px_60px_rgba(18,38,63,0.08)]">
          <span className="inline-flex rounded-full bg-red-50 px-3 py-1 text-xs font-semibold uppercase tracking-[0.3em] text-error">
            Account Blocked
          </span>
          <h1 className="mt-5 font-display text-3xl font-bold text-on-surface">
            Temporary restriction active
          </h1>
          <p className="mt-3 text-sm leading-7 text-on-surface-variant">
            Your account is blocked until{" "}
            {new Date(user.blockedUntil!).toLocaleString("en-IN")}.
          </p>
          <button
            onClick={() => signOut({ callbackUrl: "/login" })}
            className="mt-6 rounded-full bg-[#111111] px-5 py-3 text-sm font-semibold text-white"
          >
            Sign out
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-5 text-[#172033] md:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(42,123,255,0.14), transparent 26%), radial-gradient(circle at bottom right, rgba(43,87,195,0.08), transparent 24%)",
        }}
      />

      <div className="relative mx-auto grid max-w-[1500px] gap-6 xl:grid-cols-[300px_minmax(0,1fr)_0px]">
        <aside className="rounded-[2rem] bg-white/95 p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)] xl:sticky xl:top-5 xl:h-[calc(100vh-2.5rem)]">
          <div className="flex items-center gap-3">
            <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1b76ff] to-[#5da8ff] text-lg font-bold text-white">
              N
            </div>
            <div>
              <p className="font-display text-xl font-bold text-[#2372ff]">NovaApp</p>
              <p className="text-xs text-slate-400">Digital personal banking</p>
            </div>
          </div>

          <div className="mt-8 rounded-[1.6rem] bg-[#f5f8ff] p-4">
            <div className="flex items-center gap-3">
              <AvatarBadge firstName={user.firstName} lastName={user.lastName} src={profileAvatar} size="md" />
              <div className="min-w-0">
                <p className="truncate text-sm font-semibold text-slate-800">
                  {user.firstName} {user.lastName}
                </p>
                <p className="truncate text-xs text-slate-400">{user.email}</p>
              </div>
            </div>
          </div>

          <nav className="mt-8 space-y-2">
            <SideButton active={activeTab === "dashboard"} label="Dashboard" onClick={() => setActiveTab("dashboard")} />
            <SideButton active={activeTab === "transactions"} label="Transactions" onClick={() => setActiveTab("transactions")} />
            <SideButton active={activeTab === "payments"} label="Payments" onClick={() => setActiveTab("payments")} />
            <SideButton active={activeTab === "cards"} label="Cards" onClick={() => setActiveTab("cards")} />
            <SideButton active={activeTab === "settings"} label="Settings" onClick={() => setActiveTab("settings")} />
          </nav>

          <div className="mt-8 space-y-3">
            {user.role === "admin" && (
              <button
                onClick={() => router.push("/admin")}
                className="w-full rounded-[1.1rem] bg-[#edf4ff] px-4 py-3 text-left text-sm font-semibold text-[#2372ff]"
              >
                Open admin panel
              </button>
            )}
            <button
              onClick={() => signOut({ callbackUrl: "/login" })}
              className="w-full rounded-[1.1rem] bg-[#111111] px-4 py-3 text-left text-sm font-semibold text-white"
            >
              Log out
            </button>
          </div>
        </aside>

        <main className="space-y-6">
          {(activeTab === "dashboard" || activeTab === "transactions") && (
            <motion.section
              key={`profile-chip-${activeTab}`}
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="ml-auto w-fit rounded-[2rem] bg-white/95 p-3 shadow-[0_24px_60px_rgba(18,38,63,0.07)]"
            >
              <button
                onClick={() => setProfileOpen(true)}
                className="flex items-center gap-3 rounded-full bg-[#f5f7fb] px-2 py-2 pr-4"
              >
                <AvatarBadge firstName={user.firstName} lastName={user.lastName} src={profileAvatar} size="sm" />
                <div className="text-left">
                  <p className="text-sm font-semibold text-slate-800">{user.firstName}</p>
                  <p className="text-xs text-slate-400">Open profile</p>
                </div>
              </button>
            </motion.section>
          )}

          {activeTab === "payments" ? (
            <motion.section
              key="tab-payments"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Quick Send + View All Contacts */}
              <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                <div className="flex items-center justify-between">
                  <h2 className="text-xl font-bold text-slate-900">Quick Send</h2>
                  <button
                    onClick={() => setActiveTab("transactions")}
                    className="text-sm font-semibold text-[#2372ff]"
                  >
                    View All Contacts
                  </button>
                </div>
                <div className="mt-5 flex items-center gap-5">
                  {recentContacts.map((contact) => (
                    <button
                      key={contact.id}
                      onClick={() => selectQuickRecipient(contact)}
                      className="flex flex-col items-center gap-2"
                    >
                      <AvatarBadge firstName={contact.firstName} lastName={contact.lastName} size="md" />
                      <span className="text-xs text-slate-500">{contact.firstName}</span>
                    </button>
                  ))}
                  <button
                    onClick={openNewPaymentForm}
                    className="flex flex-col items-center gap-2"
                  >
                    <div className="flex h-12 w-12 items-center justify-center rounded-full border-2 border-dashed border-slate-300 text-slate-400">
                      +
                    </div>
                    <span className="text-xs text-slate-500">New</span>
                  </button>
                </div>
              </div>

              <div className="grid gap-6 xl:grid-cols-[minmax(0,1.4fr)_380px]">
                {/* Transfer Details Form */}
                <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                  <h2 className="text-xl font-bold text-slate-900">Transfer Details</h2>

                  <div className="mt-6 space-y-5">
                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Recipient
                      </span>
                      <input
                        value={searchQuery}
                        disabled={!paymentFormEnabled}
                        onChange={(e) => {
                          setSearchQuery(e.target.value);
                          setSearchError("");
                        }}
                        placeholder="Enter name, email, or account number"
                        className="w-full rounded-[1.1rem] bg-[#edf1f7] px-4 py-3.5 text-sm text-slate-800 outline-none ring-1 ring-[#e2e8f0] transition placeholder:text-slate-300 focus:bg-white focus:ring-2 focus:ring-[#2d7cff]/25 disabled:cursor-not-allowed disabled:bg-[#eef3fb] disabled:text-slate-400"
                      />
                    </label>

                    {!paymentFormEnabled && (
                      <p className="px-1 text-xs font-medium text-slate-400">
                        Choose a quick-send contact or tap New to start a transfer.
                      </p>
                    )}

                    {foundUser && (
                      <div className="rounded-[1.1rem] bg-[#eaf2ff] px-4 py-3">
                        <p className="text-sm font-semibold text-slate-800">
                          {foundUser.firstName} {foundUser.lastName}
                        </p>
                        <p className="text-xs text-slate-500">{foundUser.upiId}</p>
                      </div>
                    )}
                    {!foundUser && searchError && <p className="px-1 text-xs font-medium text-[#e36a5d]">{searchError}</p>}

                    <div className="grid grid-cols-[minmax(0,1fr)_140px] gap-4">
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Amount
                        </span>
                        <div className="flex items-center rounded-[1.1rem] bg-[#edf1f7] px-4 py-3.5 ring-1 ring-[#e2e8f0] transition focus-within:bg-white focus-within:ring-2 focus-within:ring-[#2d7cff]/25">
                          <span className="text-sm font-semibold text-slate-400 mr-2">{"\u20B9"}</span>
                          <input
                            type="number"
                            min="1"
                            disabled={!paymentFormEnabled}
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="w-full bg-transparent text-sm text-slate-800 outline-none placeholder:text-slate-300 disabled:cursor-not-allowed disabled:text-slate-400"
                          />
                        </div>
                      </label>
                      <label className="block">
                        <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                          Currency
                        </span>
                        <div className={`flex items-center rounded-[1.1rem] px-4 py-3.5 text-sm ring-1 ring-[#e2e8f0] ${paymentFormEnabled ? "bg-[#edf1f7] text-slate-700" : "bg-[#eef3fb] text-slate-400"}`}>
                          INR
                        </div>
                      </label>
                    </div>

                    <label className="block">
                      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                        Optional Note
                      </span>
                      <input
                        value={note}
                        disabled={!paymentFormEnabled}
                        onChange={(e) => setNote(e.target.value)}
                        placeholder="What is this for?"
                        className="w-full rounded-[1.1rem] bg-[#edf1f7] px-4 py-3.5 text-sm text-slate-800 outline-none ring-1 ring-[#e2e8f0] transition focus:bg-white focus:ring-2 focus:ring-[#2d7cff]/25 disabled:cursor-not-allowed disabled:bg-[#eef3fb] disabled:text-slate-400"
                      />
                    </label>

                    {sendSuccess && (
                      <div className="rounded-[1.1rem] bg-[#ecfaf4] px-4 py-3 text-sm font-medium text-[#1fa16b]">
                        {sendSuccess}
                      </div>
                    )}
                    {sendError && (
                      <div className="rounded-[1.1rem] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#e36a5d]">
                        {sendError}
                      </div>
                    )}

                    <button
                      onClick={openMpinPrompt}
                      disabled={!paymentFormEnabled || sending || !foundUser || !amount}
                      className="w-full rounded-[1.1rem] bg-[#1b76ff] px-5 py-4 text-sm font-semibold text-white shadow-[0_12px_36px_rgba(27,118,255,0.35)] transition hover:bg-[#146bef] disabled:cursor-not-allowed disabled:opacity-40 disabled:shadow-none"
                    >
                      {sending ? "Sending..." : "Send Money Now \u25B7"}
                    </button>
                  </div>
                </div>

                {/* Right column: Balance + Recent Activity */}
                <div className="space-y-6">
                  {/* Available Balance Card */}
                  <div className="rounded-[2rem] bg-gradient-to-br from-[#0f1d3d] via-[#162d5a] to-[#1f4080] p-6 text-white shadow-[0_28px_70px_rgba(15,29,61,0.4)]">
                    <div className="flex items-start justify-between">
                      <div>
                        <p className="text-xs uppercase tracking-[0.24em] text-white/60">Available Balance</p>
                        <p className="mt-3 text-[2.2rem] font-bold tracking-tight">
                          {showBalance ? formatInr(user.balance) : "\u20B9 \u2022\u2022\u2022\u2022\u2022\u2022"}
                        </p>
                      </div>
                      <button
                        onClick={() => setShowBalance((v) => !v)}
                        className="rounded-lg bg-white/15 p-2 text-white/80"
                      >
                        {"\u25A6"}
                      </button>
                    </div>
                    <div className="mt-5 flex items-center gap-2">
                      <span className="rounded-md bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white/70">UPI</span>
                      <span className="rounded-md bg-white/15 px-2.5 py-1 text-[10px] font-bold tracking-wider text-white/70">NEFT</span>
                      <span className="ml-2 text-xs text-white/50">Instant transfers enabled</span>
                    </div>
                  </div>

                  {/* Recent Activity */}
                  <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                    <div className="flex items-center justify-between">
                      <h3 className="text-lg font-semibold text-slate-900">Recent Activity</h3>
                      <button className="text-slate-400">{"\u21BB"}</button>
                    </div>
                    <div className="mt-5 space-y-4">
                      {transactions.length === 0 ? (
                        <p className="rounded-[1.3rem] bg-[#f7f9fc] px-4 py-6 text-center text-sm text-slate-400">
                          No recent activity
                        </p>
                      ) : (
                        transactions.slice(0, 4).map((tx) => {
                          const isSent = tx.senderId === sessionUserId;
                          const first = isSent ? tx.receiver.firstName : tx.sender.firstName;
                          const last = isSent ? tx.receiver.lastName : tx.sender.lastName;
                          return (
                            <div key={tx.id} className="flex items-center gap-3">
                              <div className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full ${isSent ? "bg-[#fff1ef] text-[#e36a5d]" : "bg-[#ecfaf4] text-[#1fa16b]"}`}>
                                <span className="text-lg">{isSent ? "\u2197" : "\u2199"}</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="truncate text-sm font-semibold text-slate-800">
                                  {first} {last}
                                </p>
                                <p className="text-xs text-slate-400">{transferMeta(tx.createdAt)}</p>
                              </div>
                              <p className={`text-sm font-semibold ${isSent ? "text-[#e36a5d]" : "text-[#1fa16b]"}`}>
                                {isSent ? "-" : "+"}
                                {formatInr(tx.amount)}
                              </p>
                            </div>
                          );
                        })
                      )}
                    </div>
                    <button
                      onClick={() => setActiveTab("transactions")}
                      className="mt-5 w-full rounded-[1.1rem] border border-slate-200 px-4 py-3 text-sm font-semibold text-slate-600 transition hover:bg-[#f5f7fb]"
                    >
                      Download Full Statement
                    </button>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : activeTab === "dashboard" ? (
            <div className="space-y-6">
            <div className="space-y-6">
              <motion.section
                key="tab-dashboard-top"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.05 }}
                className="grid gap-6 xl:grid-cols-2"
              >
                <div className="rounded-[2rem] bg-gradient-to-br from-[#136bff] via-[#1f7cff] to-[#4d9dff] p-7 text-white shadow-[0_28px_70px_rgba(19,107,255,0.35)]">
                  <div className="flex items-start justify-between gap-4">
                    <div>
                      <p className="text-xs font-medium uppercase tracking-[0.28em] text-white/65">
                        Total Balance
                      </p>
                      <h1 className="mt-4 font-display text-[2.2rem] font-bold tracking-tight md:text-[3rem]">
                        {showBalance ? formatInr(user.balance) : "\u20B9 ••••••"}
                      </h1>
                    </div>
                    <button
                      onClick={() => setShowBalance((value) => !value)}
                      className="rounded-full bg-white/15 px-4 py-2 text-xs font-semibold text-white"
                    >
                      {showBalance ? "Hide" : "Show"}
                    </button>
                  </div>

                  <div className="mt-8 grid gap-3 sm:grid-cols-3">
                    <BlueStat label="KYC" value={user.kycStatus} />
                    <BlueStat label="Account" value={`•••• ${user.accountNo.slice(-4)}`} />
                    <BlueStat label="UPI" value={user.upiId} />
                  </div>
                </div>

                <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-semibold text-slate-800">Weekly Transfers</p>
                      <p className="mt-1 text-xs text-slate-400">Past 7 days</p>
                    </div>
                    <span className="rounded-full bg-[#edf4ff] px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.24em] text-[#2372ff]">
                      Fast pay
                    </span>
                  </div>

                  <div className="mt-6 flex h-32 items-end gap-2">
                    {weeklySeries.map((value, index) => {
                      const max = Math.max(...weeklySeries, 1);
                      const height = Math.max(16, Math.round((value / max) * 100));
                      return (
                        <div key={index} className="flex flex-1 flex-col items-center gap-2">
                          <div
                            className={`w-6 rounded-full ${index === 5 ? "bg-[#2372ff]" : "bg-[#d9e7ff]"}`}
                            style={{ height }}
                          />
                          <span className="text-[10px] font-medium uppercase text-slate-400">
                            {["M", "T", "W", "T", "F", "S", "S"][index]}
                          </span>
                        </div>
                      );
                    })}
                  </div>

                  <div className="mt-5 rounded-[1.4rem] bg-[#f5f8ff] p-4">
                    <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Sent this week</p>
                    <p className="mt-2 text-xl font-bold text-slate-800">{compactInr(sentThisWeek)}</p>
                  </div>
                </div>
              </motion.section>

              <motion.section
                key="tab-dashboard-bottom"
                initial={{ opacity: 0, y: 18 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.4, delay: 0.1 }}
                className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]"
              >
                <div className="flex flex-col gap-6 xl:grid xl:grid-cols-[minmax(0,1.25fr)_300px] xl:gap-8">
                  <div>
                    <div className="mb-4 flex items-center justify-between">
                      <div>
                        <p className="text-lg font-semibold text-slate-900">Recent Peer Transfers</p>
                        <p className="text-sm text-slate-400">Your latest account activity</p>
                      </div>
                      <button className="text-sm font-semibold text-[#2372ff]">View all</button>
                    </div>

                    <div className="space-y-3">
                      {transactions.length === 0 ? (
                        <div className="rounded-[1.5rem] bg-[#f7f9fc] px-5 py-10 text-center text-sm text-slate-400">
                          No transfers yet. Your activity will appear here.
                        </div>
                      ) : (
                        transactions.slice(0, 4).map((tx) => {
                          const isSent = tx.senderId === sessionUserId;
                          const first = isSent ? tx.receiver.firstName : tx.sender.firstName;
                          const last = isSent ? tx.receiver.lastName : tx.sender.lastName;

                          return (
                            <div
                              key={tx.id}
                              className="flex items-center justify-between gap-3 rounded-[1.4rem] bg-[#f5f9ff] px-4 py-4 ring-1 ring-[#e4eefc]"
                            >
                              <div className="flex min-w-0 items-center gap-3">
                                <AvatarBadge firstName={first} lastName={last} size="sm" />
                                <div className="min-w-0">
                                  <p className="truncate text-sm font-semibold text-slate-800">
                                    {first} {last}
                                  </p>
                                  <p className="truncate text-xs text-slate-400">
                                    {tx.note || transferMeta(tx.createdAt)}
                                  </p>
                                </div>
                              </div>

                              <div className="text-right">
                                <p className={`text-sm font-semibold ${isSent ? "text-[#e36a5d]" : "text-[#1fa16b]"}`}>
                                  {isSent ? "-" : "+"}
                                  {compactInr(tx.amount)}
                                </p>
                                <p className="text-[10px] uppercase tracking-[0.24em] text-slate-300">
                                  {isSent ? "sent" : "received"}
                                </p>
                              </div>
                            </div>
                          );
                        })
                      )}
                    </div>
                  </div>
                  <div className="space-y-4">
                    <div className="rounded-[1.6rem] bg-[#eef5ff] p-4 ring-1 ring-[#d9e6fb]">
                      <div>
                        <p className="text-sm font-semibold text-slate-800">Quick Send</p>
                        <p className="mt-1 text-xs text-slate-500">Search recipients by phone number or UPI ID</p>
                      </div>

                      <div className="mt-4 flex items-center gap-3">
                        {recentContacts.length === 0 ? (
                          <p className="text-sm text-slate-400">Recent recipients will appear here</p>
                        ) : (
                          recentContacts.map((contact) => (
                            <button
                              key={contact.id}
                              onClick={() => {
                                setSearchQuery(contact.identifier || contact.upiId);
                                setFoundUser({
                                  id: contact.id,
                                  firstName: contact.firstName,
                                  lastName: contact.lastName,
                                  upiId: contact.upiId,
                                });
                                setSearchError("");
                                setSendError("");
                              }}
                              className="flex flex-col items-center gap-2"
                            >
                              <AvatarBadge firstName={contact.firstName} lastName={contact.lastName} size="sm" />
                              <span className="text-[11px] text-slate-500">{contact.firstName}</span>
                            </button>
                          ))
                        )}
                      </div>

                      <div className="mt-4">
                        <input
                          value={searchQuery}
                          onChange={(e) => {
                            setSearchQuery(e.target.value);
                            setSearchError("");
                            setSendError("");
                          }}
                          placeholder="Search by number or UPI ID"
                          className="w-full rounded-[1.2rem] bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-1 ring-[#d9e6fb] transition placeholder:text-slate-400 focus:ring-2 focus:ring-[#2d7cff]/25"
                        />
                      </div>

                      <div className="mt-5 space-y-3">
                        <div className="rounded-[1.25rem] bg-white px-4 py-3">
                          <p className="text-[10px] uppercase tracking-[0.22em] text-slate-400">Amount</p>
                          <input
                            type="number"
                            min="1"
                            value={amount}
                            onChange={(e) => setAmount(e.target.value)}
                            placeholder="0.00"
                            className="mt-2 w-full bg-transparent text-2xl font-semibold text-slate-800 outline-none placeholder:text-slate-300"
                          />
                        </div>

                        <input
                          value={note}
                          onChange={(e) => setNote(e.target.value)}
                          placeholder="Add a note"
                          className="w-full rounded-[1.25rem] bg-white px-4 py-3 text-sm text-slate-700 outline-none ring-1 ring-transparent transition focus:ring-2 focus:ring-[#2d7cff]/25"
                        />

                        {foundUser && (
                          <div className="rounded-[1.25rem] bg-[#eaf2ff] px-4 py-3">
                            <p className="text-sm font-semibold text-slate-800">
                              {foundUser.firstName} {foundUser.lastName}
                            </p>
                            <p className="text-xs text-slate-500">{foundUser.upiId}</p>
                          </div>
                        )}

                        {sendSuccess && (
                          <div className="rounded-[1.25rem] bg-[#ecfaf4] px-4 py-3 text-sm font-medium text-[#1fa16b]">
                            {sendSuccess}
                          </div>
                        )}

                        {requestSuccess && (
                          <div className="rounded-[1.25rem] bg-[#eaf2ff] px-4 py-3 text-sm font-medium text-[#2372ff]">
                            {requestSuccess}
                          </div>
                        )}

                        {sendError && (
                          <div className="rounded-[1.25rem] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#e36a5d]">
                            {sendError}
                          </div>
                        )}

                        {!foundUser && searchError && <p className="px-1 text-xs font-medium text-[#e36a5d]">{searchError}</p>}

                        <div className="grid grid-cols-2 gap-3">
                          <button
                            onClick={openMpinPrompt}
                            disabled={sending || !foundUser || !amount}
                            className="rounded-[1.1rem] bg-[#111111] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            {sending ? "Sending..." : "Send"}
                          </button>
                          <button
                            type="button"
                            onClick={handleRequest}
                            disabled={!foundUser || !amount}
                            className="rounded-[1.1rem] bg-white px-4 py-3 text-sm font-semibold text-slate-500 disabled:cursor-not-allowed disabled:opacity-40"
                          >
                            Request
                          </button>
                        </div>
                      </div>
                    </div>

                    {card && (
                      <div className="hidden rounded-[1.6rem] bg-gradient-to-br from-[#132b67] via-[#1f4c9d] to-[#3d77dd] p-5 text-white shadow-[0_24px_60px_rgba(24,62,146,0.28)]">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-semibold text-white/85">Virtual Card</p>
                          <span>◫</span>
                        </div>
                        <p className="mt-8 font-mono text-xl tracking-[0.22em]">{card.number}</p>
                        <div className="mt-6 flex items-end justify-between">
                          <div>
                            <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Holder</p>
                            <p className="mt-1 text-sm font-semibold">{card.holder}</p>
                          </div>
                          <div className="text-right">
                            <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Expiry</p>
                            <p className="mt-1 text-sm font-semibold">{card.expiry}</p>
                          </div>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </motion.section>
            </div>

            <motion.aside
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.4, delay: 0.12 }}
              className="hidden"
            >
              <section className="rounded-[2rem] bg-gradient-to-br from-[#146eff] via-[#2783ff] to-[#54a2ff] p-6 text-white shadow-[0_28px_70px_rgba(19,107,255,0.3)]">
                <div className="flex items-start justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.24em] text-white/65">Total balance</p>
                    <p className="mt-4 text-[2rem] font-bold tracking-tight">
                      {showBalance ? compactInr(user.balance) : "\u20B9 •••••"}
                    </p>
                  </div>
                  <div className="rounded-full bg-white/15 p-2">◫</div>
                </div>

                <div className="mt-6 inline-flex rounded-full bg-white/15 px-3 py-2 text-xs font-semibold">
                  {compactInr(sentThisWeek)} this week
                </div>

                <div className="mt-6 grid grid-cols-3 gap-3">
                  {["Send", "Request", "Cards"].map((item) => (
                    <button
                      key={item}
                      onClick={() => item === "Cards" && setProfileOpen(true)}
                      className="flex flex-col items-center gap-2 rounded-[1.2rem] bg-white/12 px-3 py-4 text-sm font-medium text-white"
                    >
                      <span className="flex h-10 w-10 items-center justify-center rounded-full bg-white/18">
                        {item === "Send" ? "➜" : item === "Request" ? "↓" : "◫"}
                      </span>
                      {item}
                    </button>
                  ))}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Weekly Transfers</p>
                    <p className="text-xs text-slate-400">P2P activity</p>
                  </div>
                  <p className="text-sm font-semibold text-[#2372ff]">{compactInr(sentThisWeek)}</p>
                </div>

                <div className="mt-6 flex h-36 items-end justify-between gap-2">
                  {weeklySeries.map((value, index) => {
                    const max = Math.max(...weeklySeries, 1);
                    const height = Math.max(12, Math.round((value / max) * 110));
                    return (
                      <div key={index} className="flex flex-1 flex-col items-center gap-2">
                        <div
                          className={`w-5 rounded-full ${index === 4 ? "bg-[#2372ff]" : "bg-[#dce9ff]"}`}
                          style={{ height }}
                        />
                        <span className="text-[10px] font-medium text-slate-400">
                          {["M", "T", "W", "T", "F", "S", "S"][index]}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </section>

              <section className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                <div className="mb-5 flex items-center justify-between">
                  <div>
                    <p className="text-sm font-semibold text-slate-900">Recent Transfers</p>
                    <p className="text-xs text-slate-400">Latest movement</p>
                  </div>
                  <button className="text-xs font-semibold text-[#2372ff]">View all</button>
                </div>

                <div className="space-y-4">
                  {transactions.length === 0 ? (
                    <p className="rounded-[1.3rem] bg-[#f7f9fc] px-4 py-6 text-center text-sm text-slate-400">
                      No recent transfer data
                    </p>
                  ) : (
                    transactions.slice(0, 3).map((tx) => {
                      const isSent = tx.senderId === sessionUserId;
                      const first = isSent ? tx.receiver.firstName : tx.sender.firstName;
                      const last = isSent ? tx.receiver.lastName : tx.sender.lastName;

                      return (
                        <div key={tx.id} className="flex items-center gap-3">
                          <AvatarBadge firstName={first} lastName={last} size="sm" />
                          <div className="min-w-0 flex-1">
                            <p className="truncate text-sm font-semibold text-slate-800">
                              {first} {last}
                            </p>
                            <p className="text-xs text-slate-400">{transferMeta(tx.createdAt)}</p>
                          </div>
                          <div className="text-right">
                            <p className={`text-sm font-semibold ${isSent ? "text-[#e36a5d]" : "text-[#2372ff]"}`}>
                              {isSent ? "-" : "+"}
                              {compactInr(tx.amount)}
                            </p>
                            <p className="text-[10px] uppercase tracking-[0.22em] text-slate-300">
                              {isSent ? "sent" : "recv"}
                            </p>
                          </div>
                        </div>
                      );
                    })
                  )}
                </div>
              </section>
            </motion.aside>
          </div>
          ) : activeTab === "transactions" ? (
            <motion.section
              key="tab-transactions"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)]"
            >
              <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
                <div>
                  <p className="text-sm text-slate-400">Total Spend This Month</p>
                  <h1 className="mt-2 font-display text-4xl font-bold text-slate-900">
                    {formatInr(monthSpend)}
                  </h1>
                </div>
                <div className="flex gap-3">
                  <button className="rounded-[1rem] bg-[#f5f7fb] px-4 py-3 text-sm font-semibold text-slate-600">
                    Filters
                  </button>
                  <button className="rounded-[1rem] bg-[#1b76ff] px-4 py-3 text-sm font-semibold text-white">
                    Export
                  </button>
                </div>
              </div>

              <div className="mt-6 grid gap-6 xl:grid-cols-[minmax(0,1.45fr)_280px]">
                <div className="rounded-[1.8rem] bg-[#fbfcff] p-5">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-lg font-semibold text-slate-900">Spending Trends</p>
                      <p className="text-sm text-slate-400">Weekly categorized analysis</p>
                    </div>
                    <div className="flex items-center gap-4 text-xs font-semibold">
                      <span className="flex items-center gap-2 text-[#2372ff]">
                        <span className="h-2 w-2 rounded-full bg-[#2372ff]" />
                        Income
                      </span>
                      <span className="flex items-center gap-2 text-[#ef8a52]">
                        <span className="h-2 w-2 rounded-full bg-[#ef8a52]" />
                        Expense
                      </span>
                    </div>
                  </div>

                  <div className="mt-8 flex h-64 items-end gap-5 rounded-[1.4rem] bg-white px-6 py-8">
                    {weeklySeries.map((value, index) => {
                      const income = filteredTransactions
                        .filter((tx) => tx.receiverId === sessionUserId)
                        .slice(0, 7)[index]?.amount || 0;
                      const expenseHeight = Math.max(20, Math.round((value / Math.max(...weeklySeries, 1)) * 150));
                      const incomeHeight = Math.max(
                        16,
                        Math.round((income / Math.max(...weeklySeries, income, 1)) * 90)
                      );
                      return (
                        <div key={index} className="flex flex-1 flex-col items-center gap-3">
                          <div className="flex w-full items-end justify-center gap-2">
                            <div className="w-5 rounded-full bg-[#2372ff]" style={{ height: incomeHeight }} />
                            <div className="w-5 rounded-full bg-[#ef8a52]" style={{ height: expenseHeight }} />
                          </div>
                          <span className="text-[10px] uppercase tracking-[0.24em] text-slate-400">
                            Week {index + 1}
                          </span>
                        </div>
                      );
                    })}
                  </div>
                </div>

                <div className="space-y-4">
                  <div className="rounded-[1.8rem] bg-[#f8fbff] p-5">
                    <p className="text-sm font-semibold text-slate-800">Projected Savings</p>
                    <p className="text-xs text-slate-400">End of month forecast</p>
                    <p className="mt-5 text-3xl font-bold text-slate-900">
                      {formatInr(Math.max(user.balance - monthSpend * 0.25, 0))}
                    </p>
                    <div className="mt-5 h-2 rounded-full bg-slate-200">
                      <div className="h-2 rounded-full bg-[#2372ff]" style={{ width: "72%" }} />
                    </div>
                  </div>

                  <div className="rounded-[1.8rem] bg-[#fff8f3] p-5">
                    <p className="text-sm font-semibold text-slate-800">Active Subscriptions</p>
                    <p className="text-xs text-slate-400">Estimated recurring charges</p>
                    <p className="mt-5 text-3xl font-bold text-slate-900">
                      {formatInr(Math.max(monthSpend * 0.12, 248.9))}
                    </p>
                    <p className="mt-1 text-sm text-slate-400">per month</p>
                  </div>
                </div>
              </div>

              <div className="mt-8 rounded-[1.8rem] bg-[#fbfcff] p-5">
                <div className="flex flex-col gap-4 lg:flex-row lg:items-center lg:justify-between">
                  <div>
                    <p className="text-lg font-semibold text-slate-900">Detailed History</p>
                    <p className="text-sm text-slate-400">All credits and debits</p>
                  </div>
                  <div className="flex flex-wrap items-center gap-3">
                    <label className="min-w-[220px] flex-1 lg:min-w-[260px] lg:flex-none">
                      <input
                        value={transactionSearch}
                        onChange={(e) => setTransactionSearch(e.target.value)}
                        placeholder="Find merchant..."
                        className="w-full rounded-full bg-white px-4 py-2.5 text-sm text-slate-700 outline-none ring-1 ring-[#e8edf6] placeholder:text-slate-400 focus:ring-2 focus:ring-[#2d7cff]/25"
                      />
                    </label>
                    <div className="flex rounded-full bg-white p-1 text-xs font-semibold text-slate-500 ring-1 ring-[#e8edf6]">
                      <button
                        onClick={() => setTransactionFilter("all")}
                        className={`rounded-full px-3 py-1.5 ${transactionFilter === "all" ? "bg-[#f5f7fb] text-[#2372ff]" : ""}`}
                      >
                        All
                      </button>
                      <button
                        onClick={() => setTransactionFilter("income")}
                        className={`rounded-full px-3 py-1.5 ${transactionFilter === "income" ? "bg-[#eef4ff] text-[#2372ff]" : ""}`}
                      >
                        Income
                      </button>
                      <button
                        onClick={() => setTransactionFilter("expense")}
                        className={`rounded-full px-3 py-1.5 ${transactionFilter === "expense" ? "bg-[#fff1e8] text-[#ef8a52]" : ""}`}
                      >
                        Expense
                      </button>
                    </div>
                  </div>
                </div>

                <div className="mt-6 overflow-x-auto rounded-[1.4rem] bg-white">
                  <table className="min-w-full text-left">
                    <thead className="text-[11px] uppercase tracking-[0.22em] text-slate-400">
                      <tr>
                        <th className="px-6 py-4 font-semibold">Transaction</th>
                        <th className="px-6 py-4 font-semibold">Category</th>
                        <th className="px-6 py-4 font-semibold">Date & Time</th>
                        <th className="px-6 py-4 font-semibold">Status</th>
                        <th className="px-6 py-4 text-right font-semibold">Amount</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredTransactions.length === 0 ? (
                        <tr className="border-t border-slate-100">
                          <td colSpan={5} className="px-6 py-12 text-center text-sm font-medium text-slate-400">
                            No data found
                          </td>
                        </tr>
                      ) : (
                        filteredTransactions.slice(0, 12).map((tx) => {
                          const isSent = tx.senderId === sessionUserId;
                          const first = isSent ? tx.receiver.firstName : tx.sender.firstName;
                          const last = isSent ? tx.receiver.lastName : tx.sender.lastName;
                          const category = isSent ? "expense" : "income";
                          return (
                            <tr key={tx.id} className="border-t border-slate-100">
                              <td className="px-6 py-4">
                                <div className="flex items-center gap-3">
                                  <AvatarBadge firstName={first} lastName={last} size="sm" />
                                  <div>
                                    <p className="text-sm font-semibold text-slate-800">{first} {last}</p>
                                    <p className="text-xs text-slate-400">{tx.note || "Direct transfer"}</p>
                                  </div>
                                </div>
                              </td>
                              <td className="px-6 py-4">
                                <span className={`rounded-full px-3 py-1 text-[10px] font-semibold uppercase tracking-[0.18em] ${isSent ? "bg-[#fff1e8] text-[#ef8a52]" : "bg-[#eaf2ff] text-[#2372ff]"}`}>
                                  {category}
                                </span>
                              </td>
                              <td className="px-6 py-4 text-sm text-slate-500">{transferMeta(tx.createdAt)}</td>
                              <td className="px-6 py-4">
                                <span className="inline-flex items-center gap-2 text-sm text-slate-500">
                                  <span className={`h-2 w-2 rounded-full ${tx.status === "success" ? "bg-[#1fa16b]" : "bg-slate-300"}`} />
                                  {tx.status === "success" ? "Completed" : tx.status}
                                </span>
                              </td>
                              <td className={`px-6 py-4 text-right text-sm font-semibold ${isSent ? "text-[#e36a5d]" : "text-[#1fa16b]"}`}>
                                {isSent ? "-" : "+"}
                                {formatInr(tx.amount)}
                              </td>
                            </tr>
                          );
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </motion.section>
          ) : activeTab === "cards" ? (
            <motion.section
              key="tab-cards"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                <div>
                  <h2 className="text-2xl font-bold text-slate-900">Manage Cards</h2>
                  <p className="mt-1 text-sm text-slate-400">Review your virtual assets and security settings.</p>
                </div>
              </div>

              <div className="grid gap-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
                <div className="space-y-6">
                  {/* Virtual Card */}
                  {card && (
                    <div className="rounded-[2rem] bg-gradient-to-br from-[#3b82f6] via-[#6366f1] to-[#8b5cf6] p-6 text-white shadow-[0_28px_70px_rgba(99,102,241,0.35)]">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">Virtual Debit</p>
                          <p className="mt-1 text-lg font-bold">NovaPay Premium</p>
                        </div>
                        <div className="rounded-lg bg-white/15 p-2">
                          <span className="text-lg">{"\u25A6"}</span>
                        </div>
                      </div>
                      <p className="mt-6 font-mono text-xl tracking-[0.22em]">
                        {showCardNumber ? card.number : "\u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 \u2022\u2022\u2022\u2022 " + card.number.slice(-4)}
                      </p>
                      <div className="mt-6 flex items-end justify-between">
                        <div>
                          <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Card Holder</p>
                          <p className="mt-1 text-sm font-semibold">{card.holder}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-[10px] uppercase tracking-[0.24em] text-white/55">Expiry</p>
                          <p className="mt-1 text-sm font-semibold">{card.expiry}</p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Show Details / Copy Number */}
                  <div className="flex gap-3">
                    <button
                      onClick={() => setShowCardNumber((v) => !v)}
                      className="flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_8px_30px_rgba(18,38,63,0.06)]"
                    >
                      <span>{"👁"}</span> {showCardNumber ? "Hide Details" : "Show Details"}
                    </button>
                    <button
                      onClick={() => {
                        if (card) {
                          navigator.clipboard.writeText(card.number.replace(/\s/g, ""));
                          setCopiedCard(true);
                          setTimeout(() => setCopiedCard(false), 2000);
                        }
                      }}
                      className="flex flex-1 items-center justify-center gap-2 rounded-[1.2rem] bg-white px-4 py-3.5 text-sm font-semibold text-slate-700 shadow-[0_8px_30px_rgba(18,38,63,0.06)]"
                    >
                      <span>{copiedCard ? "\u2713" : "📋"}</span> {copiedCard ? "Copied!" : "Copy Number"}
                    </button>
                  </div>

                </div>

                {/* Right Column - Card Controls */}
                <div className="space-y-5">
                  {/* Freeze Card */}
                  <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#fff1ef] text-[#e36a5d]">
                          {"\u2744"}
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-slate-800">Freeze Card</p>
                          <p className="text-xs text-slate-400">Temporarily disable all transactions.</p>
                        </div>
                      </div>
                      <button
                        onClick={() => setCardFrozen((v) => !v)}
                        aria-pressed={cardFrozen}
                        className={`relative h-[38px] w-[76px] rounded-full border-2 transition ${
                          cardFrozen
                            ? "border-[#111111] bg-[#2f73ea]"
                            : "border-[#d7e3f7] bg-[#eef4ff]"
                        }`}
                      >
                        <span
                          className={`absolute top-1/2 h-8 w-8 -translate-y-1/2 rounded-full bg-white shadow-[0_6px_18px_rgba(18,38,63,0.18)] transition-all ${
                            cardFrozen ? "left-[40px]" : "left-1"
                          }`}
                        />
                      </button>
                    </div>
                  </div>

                  {/* Set Limits */}
                  <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#eef4ff] text-[#2372ff]">
                      {"\u2699"}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">Set Limits</p>
                    <p className="text-xs text-slate-400">Daily spending and withdrawal caps.</p>
                    <button onClick={() => setLimitsOpen(true)} className="mt-3 text-sm font-semibold text-[#2372ff]">Manage {"\u2192"}</button>
                  </div>

                  {/* Change PIN */}
                  <div className="rounded-[2rem] bg-white p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                    <div className="flex h-10 w-10 items-center justify-center rounded-full bg-[#f5f7fb] text-slate-500">
                      {"\u2022\u2022\u2022"}
                    </div>
                    <p className="mt-3 text-sm font-semibold text-slate-800">Reset MPIN</p>
                    <p className="text-xs text-slate-400">Use your login password to change your 4-digit security MPIN.</p>
                    <button onClick={openResetMpinPanel} className="mt-3 text-sm font-semibold text-[#2372ff]">Reset MPIN {"\u2192"}</button>
                  </div>
                </div>
              </div>
            </motion.section>
          ) : activeTab === "settings" ? (
            <motion.section
              key="tab-settings"
              initial={{ opacity: 0, y: 18 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.35 }}
              className="space-y-6"
            >
              {/* Profile Header */}
              <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                <div className="flex flex-col items-center gap-4 sm:flex-row sm:items-start sm:gap-6">
                  <div className="relative">
                    <AvatarBadge firstName={user.firstName} lastName={user.lastName} src={profileAvatar} size="lg" />
                    <label className="absolute -bottom-1 -right-1 flex h-7 w-7 cursor-pointer items-center justify-center rounded-full bg-[#2372ff] text-xs text-white shadow-lg">
                      {"\u270E"}
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                  </div>
                  <div className="text-center sm:text-left">
                    <h2 className="text-xl font-bold text-slate-900">{user.firstName} {user.lastName}</h2>
                    <p className="mt-1 text-sm text-slate-400">{user.email}</p>
                    <div className="mt-3 flex flex-wrap justify-center gap-2 sm:justify-start">
                      <button
                        onClick={() => setProfileOpen(true)}
                        className="rounded-full bg-[#2372ff] px-4 py-2 text-xs font-semibold text-white"
                      >
                        {"\u270E"} Edit Profile
                      </button>
                      <span className="inline-flex items-center gap-1.5 rounded-full bg-[#ecfaf4] px-3 py-2 text-xs font-semibold text-[#1fa16b]">
                        {"\u2713"} Verified Member
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Account & Security */}
              <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                <h3 className="flex items-center gap-2 text-sm font-semibold uppercase tracking-[0.18em] text-slate-400">
                  <span>{"🔒"}</span> Account &amp; Security
                </h3>

                <div className="mt-5 divide-y divide-slate-100">
                  <SettingsRow
                    icon={"🔐"}
                    title="Security &amp; Login"
                    subtitle="Update password and review account protection"
                    onClick={() => setProfileOpen(true)}
                  />
                  <SettingsRow
                    icon={"•••"}
                    title="Reset MPIN"
                    subtitle="Use your account password to set a new 4-digit MPIN"
                    onClick={openResetMpinPanel}
                  />
                </div>
              </div>

              {/* Session Security + Logout */}
              <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)]">
                <div className="flex flex-col items-center justify-between gap-4 sm:flex-row">
                  <div>
                    <p className="text-sm font-semibold text-slate-800">Session Security</p>
                    <p className="text-xs text-slate-400">
                      Your last login was {new Date().toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" })}
                    </p>
                  </div>
                  <button
                    onClick={() => signOut({ callbackUrl: "/login" })}
                    className="rounded-[1.1rem] border border-red-200 bg-[#fff5f5] px-5 py-3 text-sm font-semibold text-[#e36a5d] transition hover:bg-[#ffe8e5]"
                  >
                    {"\u2192"} Logout
                  </button>
                </div>
              </div>
            </motion.section>
          ) : null}
        </main>
      </div>

      <AnimatePresence>
        {mpinPromptOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setMpinPromptOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close MPIN prompt"
            />
            <motion.div
              initial={{ opacity: 0, y: 20, scale: 0.98 }}
              animate={{ opacity: 1, y: 0, scale: 1 }}
              exit={{ opacity: 0, y: 16, scale: 0.98 }}
              className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-md -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-white p-6 shadow-[0_30px_80px_rgba(18,38,63,0.18)]"
            >
              <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Confirm transfer</p>
              <h3 className="mt-2 font-display text-3xl font-bold text-slate-900">Enter MPIN</h3>
              <p className="mt-2 text-sm text-slate-500">
                Type your 4-digit MPIN to send {amount ? formatInr(parseFloat(amount || "0")) : "money"}.
              </p>

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
                    className="h-14 w-14 rounded-[1rem] border border-[#cfe0ff] bg-[#eef4ff] text-center text-xl font-semibold text-slate-900 outline-none shadow-[inset_0_1px_0_rgba(255,255,255,0.65)] ring-1 ring-transparent focus:border-[#2d7cff] focus:bg-white focus:ring-2 focus:ring-[#2d7cff]/20"
                  />
                ))}
              </div>

              {mpinError && <p className="mt-4 text-center text-sm font-medium text-[#e36a5d]">{mpinError}</p>}

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button
                  onClick={() => setMpinPromptOpen(false)}
                  className="rounded-[1.1rem] bg-[#f5f7fb] px-4 py-3 text-sm font-semibold text-slate-600"
                >
                  Cancel
                </button>
                <button
                  onClick={submitMpinTransfer}
                  disabled={sending}
                  className="rounded-[1.1rem] bg-[#111111] px-4 py-3 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {sending ? "Sending..." : "Confirm"}
                </button>
              </div>
            </motion.div>
          </>
        )}

        {profileOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setProfileOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close profile panel"
            />

            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-[#fcfdff] p-6 shadow-[0_24px_60px_rgba(18,38,63,0.15)]"
              role="dialog"
              aria-modal="true"
              aria-label="Profile settings"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Your profile</p>
                  <h2 className="mt-2 font-display text-3xl font-bold text-slate-900">
                    {user.firstName} {user.lastName}
                  </h2>
                </div>
                <button
                  onClick={() => setProfileOpen(false)}
                  className="rounded-full bg-[#eff4fb] px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="mt-6 rounded-[2rem] bg-white p-5 shadow-[0_18px_50px_rgba(18,38,63,0.06)]">
                <div className="flex items-start gap-4">
                  <AvatarBadge firstName={user.firstName} lastName={user.lastName} src={profileAvatar} size="lg" />
                  <div className="min-w-0 flex-1">
                    <p className="truncate text-sm font-semibold text-slate-800">{user.email}</p>
                    <p className="mt-1 text-sm text-slate-400">{user.phone}</p>
                    <label className="mt-3 inline-flex cursor-pointer rounded-full bg-[#eff4fb] px-4 py-2 text-xs font-semibold text-[#2372ff]">
                      Update Photo
                      <input
                        type="file"
                        accept="image/png,image/jpeg,image/webp"
                        className="hidden"
                        onChange={handleAvatarChange}
                      />
                    </label>
                    <p className="mt-2 text-xs text-slate-400">PNG, JPG or WEBP, max 2 MB</p>
                  </div>
                </div>

                <div className="mt-6 grid gap-3">
                  <ProfileInput label="First Name" value={profileForm.firstName} onChange={(value) => setProfileForm((cur) => ({ ...cur, firstName: value }))} />
                  <ProfileInput label="Last Name" value={profileForm.lastName} onChange={(value) => setProfileForm((cur) => ({ ...cur, lastName: value }))} />
                  <ProfileInput label="Email" value={profileForm.email} onChange={(value) => setProfileForm((cur) => ({ ...cur, email: value }))} />
                  <ProfileInput label="Phone" value={profileForm.phone} onChange={(value) => setProfileForm((cur) => ({ ...cur, phone: value }))} />
                  <ProfileInput label="Date of Birth" type="date" value={profileForm.dob} onChange={(value) => setProfileForm((cur) => ({ ...cur, dob: value }))} />
                  <ProfileInput label="Confirm Password" type="password" value={profileForm.password} onChange={(value) => setProfileForm((cur) => ({ ...cur, password: value }))} />
                </div>

                {profileMessage && (
                  <div className="mt-4 rounded-[1.2rem] bg-[#ecfaf4] px-4 py-3 text-sm font-medium text-[#1fa16b]">
                    {profileMessage}
                  </div>
                )}

                {profileError && (
                  <div className="mt-4 rounded-[1.2rem] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#e36a5d]">
                    {profileError}
                  </div>
                )}

                <button
                  onClick={handleProfileUpdate}
                  disabled={profileSaving}
                  className="mt-5 w-full rounded-[1.2rem] bg-[#111111] px-4 py-3 text-sm font-semibold text-white disabled:cursor-not-allowed disabled:opacity-40"
                >
                  {profileSaving ? "Updating..." : "Update Profile"}
                </button>
              </div>
            </motion.aside>
          </>
        )}
        {/* Set Limits Side Panel */}
        {limitsOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setLimitsOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close limits panel"
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-[#fcfdff] p-6 shadow-[0_24px_60px_rgba(18,38,63,0.15)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Card Controls</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Set Daily Limit</h2>
                </div>
                <button
                  onClick={() => setLimitsOpen(false)}
                  className="rounded-full bg-[#eff4fb] px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="mt-10 rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(18,38,63,0.06)]">
                <p className="text-sm text-slate-400">Daily spending limit</p>
                <p className="mt-2 text-4xl font-bold text-slate-900">{formatInr(dailyLimit)}</p>

                <div className="mt-8">
                  <input
                    type="range"
                    min={1000}
                    max={100000}
                    step={1000}
                    value={dailyLimit}
                    onChange={(e) => setDailyLimit(Number(e.target.value))}
                    className="w-full cursor-pointer accent-[#2372ff]"
                    style={{ height: 8 }}
                  />
                  <div className="mt-3 flex justify-between text-xs text-slate-400">
                    <span>{formatInr(1000)}</span>
                    <span>{formatInr(100000)}</span>
                  </div>
                </div>

                <div className="mt-6 grid grid-cols-4 gap-2">
                  {[10000, 25000, 50000, 100000].map((val) => (
                    <button
                      key={val}
                      onClick={() => setDailyLimit(val)}
                      className={`rounded-[1rem] px-2 py-2.5 text-xs font-semibold transition ${dailyLimit === val ? "bg-[#2372ff] text-white" : "bg-[#f5f7fb] text-slate-600"}`}
                    >
                      {compactInr(val)}
                    </button>
                  ))}
                </div>

                <button
                  onClick={() => setLimitsOpen(false)}
                  className="mt-8 w-full rounded-[1.2rem] bg-[#111111] px-4 py-3.5 text-sm font-semibold text-white"
                >
                  Save Limit
                </button>
              </div>
            </motion.aside>
          </>
        )}

        {/* Change PIN Side Panel */}
        {changePinOpen && (
          <>
            <motion.button
              className="fixed inset-0 z-40 bg-slate-900/20 backdrop-blur-sm"
              onClick={() => setChangePinOpen(false)}
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              aria-label="Close change pin panel"
            />
            <motion.aside
              className="fixed right-0 top-0 z-50 h-full w-full max-w-md overflow-y-auto bg-[#fcfdff] p-6 shadow-[0_24px_60px_rgba(18,38,63,0.15)]"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 28, stiffness: 280 }}
            >
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs uppercase tracking-[0.24em] text-slate-400">Security</p>
                  <h2 className="mt-2 text-2xl font-bold text-slate-900">Reset MPIN</h2>
                </div>
                <button
                  onClick={() => setChangePinOpen(false)}
                  className="rounded-full bg-[#eff4fb] px-4 py-2 text-sm font-semibold text-slate-600"
                >
                  Close
                </button>
              </div>

              <div className="mt-8 rounded-[2rem] bg-white p-6 shadow-[0_18px_50px_rgba(18,38,63,0.06)]">
                <div className="space-y-7">
                  <label className="block">
                    <span className="mb-3 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
                      Account Password
                    </span>
                    <input
                      type="password"
                      value={pinResetPassword}
                      onChange={(e) => {
                        setPinResetPassword(e.target.value);
                        setPinError("");
                      }}
                      placeholder="Enter your login password"
                      className="w-full rounded-[1.1rem] bg-[#edf1f7] px-4 py-3 text-sm text-slate-800 outline-none ring-1 ring-[#e2e8f0] transition focus:bg-white focus:ring-2 focus:ring-[#2d7cff]/25"
                    />
                  </label>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">New MPIN</p>
                    <PinBoxes digits={newPinDigits} onChange={setNewPinDigits} />
                  </div>
                  <div>
                    <p className="mb-3 text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">Re-enter New MPIN</p>
                    <PinBoxes digits={confirmPinDigits} onChange={setConfirmPinDigits} />
                  </div>
                </div>

                {pinError && (
                  <div className="mt-4 rounded-[1.2rem] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#e36a5d]">
                    {pinError}
                  </div>
                )}

                <button
                  disabled={pinSaving}
                  onClick={async () => {
                    setPinError("");
                    const password = pinResetPassword.trim();
                    const nw = newPinDigits.join("");
                    const cnf = confirmPinDigits.join("");
                    if (!password) { setPinError("Enter your account password"); return; }
                    if (nw.length !== 4) { setPinError("New MPIN must be 4 digits"); return; }
                    if (nw !== cnf) { setPinError("New MPINs do not match"); return; }
                    setPinSaving(true);
                    try {
                      const res = await fetch("/api/auth/set-mpin", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({ password, mpin: nw }),
                      });
                      const data = await res.json();
                      if (!res.ok) { setPinError(data.error || "Failed to update MPIN"); return; }
                      setPinResetPassword("");
                      setNewPinDigits(["", "", "", ""]);
                      setConfirmPinDigits(["", "", "", ""]);
                      setPinUpdated(true);
                      setChangePinOpen(false);
                      setTimeout(() => setPinUpdated(false), 3000);
                    } catch { setPinError("Something went wrong"); } finally { setPinSaving(false); }
                  }}
                  className="mt-6 w-full rounded-[1.2rem] bg-[#111111] px-4 py-3.5 text-sm font-semibold text-white disabled:opacity-40"
                >
                  {pinSaving ? "Updating..." : "Update MPIN"}
                </button>
              </div>
            </motion.aside>
          </>
        )}

        {/* MPIN Updated Success Popup */}
        {pinUpdated && (
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0, scale: 0.9 }}
            className="fixed left-1/2 top-1/2 z-50 w-[calc(100%-2rem)] max-w-sm -translate-x-1/2 -translate-y-1/2 rounded-[2rem] bg-white p-8 text-center shadow-[0_30px_80px_rgba(18,38,63,0.18)]"
          >
            <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-[#ecfaf4] text-3xl text-[#1fa16b]">
              {"\u2713"}
            </div>
            <h3 className="mt-4 text-xl font-bold text-slate-900">MPIN Updated</h3>
            <p className="mt-2 text-sm text-slate-400">Your security MPIN has been changed successfully.</p>
            <button
              onClick={() => setPinUpdated(false)}
              className="mt-6 rounded-[1.1rem] bg-[#111111] px-6 py-3 text-sm font-semibold text-white"
            >
              Done
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

function SideButton({
  label,
  active = false,
  onClick,
}: {
  label: string;
  active?: boolean;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className={`w-full rounded-[1.2rem] px-4 py-3 text-left text-sm font-semibold ${
        active ? "bg-[#eef4ff] text-[#2372ff]" : "text-slate-500 hover:bg-[#f6f8fc] hover:text-slate-800"
      }`}
    >
      {label}
    </button>
  );
}

function BlueStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.4rem] bg-white/12 px-4 py-4 backdrop-blur">
      <p className="text-[10px] uppercase tracking-[0.24em] text-white/60">{label}</p>
      <p className="mt-2 truncate text-sm font-semibold text-white">{value}</p>
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
    <label className="block">
      <span className="mb-2 block text-xs font-semibold uppercase tracking-[0.18em] text-slate-400">
        {label}
      </span>
      <input
        type={type}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        className="w-full rounded-[1.1rem] bg-[#edf1f7] px-4 py-3 text-sm text-slate-800 outline-none ring-1 ring-[#e2e8f0] transition focus:bg-white focus:ring-2 focus:ring-[#2d7cff]/25"
      />
    </label>
  );
}

function AvatarBadge({
  firstName,
  lastName,
  src,
  size,
}: {
  firstName: string;
  lastName: string;
  src?: string | null;
  size: "sm" | "md" | "lg";
}) {
  const sizes = { sm: "h-11 w-11 text-sm", md: "h-12 w-12 text-sm", lg: "h-16 w-16 text-lg" };
  return (
    <div
      className={`flex shrink-0 items-center justify-center overflow-hidden rounded-full bg-gradient-to-br from-[#1b76ff] to-[#8ec0ff] font-semibold text-white ${sizes[size]}`}
    >
      {src ? <img src={src} alt="" className="h-full w-full object-cover" /> : initials(firstName, lastName)}
    </div>
  );
}

function RoundIcon({ children, label }: { children: React.ReactNode; label: string }) {
  return (
    <button aria-label={label} className="flex h-11 w-11 items-center justify-center rounded-full bg-[#f5f7fb] text-slate-500">
      {children}
    </button>
  );
}

function PinBoxes({
  digits,
  onChange,
}: {
  digits: string[];
  onChange: (d: string[]) => void;
}) {
  const handleChange = (index: number, value: string) => {
    const v = value.replace(/\D/g, "").slice(-1);
    const next = digits.map((d, i) => (i === index ? v : d));
    onChange(next);
    if (v && index < 3) {
      const el = document.getElementById(`pin-${index + 1}-${onChange.toString().slice(0, 20)}`);
      // fallback: find next sibling input
      const inputs = (document.activeElement?.parentElement?.querySelectorAll("input") || []) as NodeListOf<HTMLInputElement>;
      inputs[index + 1]?.focus();
    }
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Backspace" && !digits[index] && index > 0) {
      const inputs = (e.currentTarget.parentElement?.querySelectorAll("input") || []) as NodeListOf<HTMLInputElement>;
      inputs[index - 1]?.focus();
    }
  };

  return (
    <div className="flex  gap-3">
      {digits.map((digit, i) => (
        <input
          key={i}
          type="password"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          className="h-14 w-14 rounded-[1rem] bg-[#eaf2ff] text-center text-xl font-semibold text-slate-800 outline-none ring-1 ring-[#cfe0ff] transition focus:bg-[#f2f7ff] focus:ring-2 focus:ring-[#2d7cff]"
        />
      ))}
    </div>
  );
}

function SettingsRow({
  icon,
  title,
  subtitle,
  onClick,
}: {
  icon: string;
  title: string;
  subtitle: string;
  onClick?: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="flex w-full items-center gap-4 px-2 py-4 text-left transition hover:bg-[#f8faff]"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[#eef4ff] text-lg">
        <span>{icon}</span>
      </div>
      <div className="min-w-0 flex-1">
        <p className="text-sm font-semibold text-slate-800">{title}</p>
        <p className="text-xs text-slate-400">{subtitle}</p>
      </div>
      <span className="text-slate-300">{"\u203A"}</span>
    </button>
  );
}

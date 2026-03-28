export type AdminRole = "admin" | "super_admin";
export type KycStatus = "Pending" | "Verified" | "Rejected";
export type AccountStatus = "Active" | "Frozen";
export type TransactionStatus = "Success" | "Failed" | "Pending" | "Flagged" | "Reversed";
export type CardStatus = "Active" | "Blocked" | "Expired";
export type FraudStatus = "Open" | "Investigating" | "Resolved";

export type AdminUser = {
  id: string;
  name: string;
  phone: string;
  email: string;
  kycStatus: KycStatus;
  accountStatus: AccountStatus;
  role: "user" | "admin" | "super_admin";
  joinedAt: string;
  accountNo?: string;
  upiId?: string;
};

export type AdminTransaction = {
  id: string;
  userId: string;
  userName: string;
  amount: number;
  status: TransactionStatus;
  channel: string;
  createdAt: string;
  riskReason: string;
};

export type AdminCard = {
  id: string;
  userId: string;
  userName: string;
  status: CardStatus;
  lastUsed: string;
};

export type FraudAlert = {
  id: string;
  transactionId: string;
  userId: string;
  userName: string;
  amount: number;
  riskScore: number;
  reason: string;
  status: FraudStatus;
};

export type KycDocument = {
  label: string;
  type: string;
};

export type KycRequest = {
  id: string;
  userId: string;
  userName: string;
  submittedAt: string;
  status: "Pending" | "Approved" | "Rejected";
  documents: KycDocument[];
};

export type AnalyticsPoint = {
  label: string;
  value: number;
};

export type AnalyticsSeries = Record<"7d" | "30d" | "90d", AnalyticsPoint[]>;

export type AdminLog = {
  id: string;
  type: "login" | "action";
  actor: string;
  role: string;
  action: string;
  ip: string;
  status: "Success" | "Failed";
  createdAt: string;
};

export type AdminDashboardData = {
  users: AdminUser[];
  transactions: AdminTransaction[];
  cards: AdminCard[];
  fraudAlerts: FraudAlert[];
  kycRequests: KycRequest[];
  analytics: {
    transactionVolume: AnalyticsSeries;
    userGrowth: AnalyticsSeries;
    successVsFailed: AnalyticsSeries;
  };
  adminLogs: AdminLog[];
};

type ApiUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  upiId: string;
  accountNo: string;
  balance: number;
  kycStatus: string;
  role: string;
  blockedUntil: string | null;
  createdAt: string;
};

type ApiTransaction = {
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

type AdminApiResponse = {
  users: ApiUser[];
  transactions: ApiTransaction[];
  stats: {
    totalUsers: number;
    totalTransactions: number;
    totalBalance: number;
  };
};

function titleCase(value: string) {
  return value ? value.charAt(0).toUpperCase() + value.slice(1).toLowerCase() : value;
}

function normalizeKycStatus(status: string): KycStatus {
  const normalized = titleCase(status) as KycStatus;
  return ["Pending", "Verified", "Rejected"].includes(normalized) ? normalized : "Pending";
}

function normalizeTransactionStatus(status: string): TransactionStatus {
  const normalized = titleCase(status) as TransactionStatus;
  return ["Success", "Failed", "Pending", "Flagged", "Reversed"].includes(normalized) ? normalized : "Pending";
}

function getAccountStatus(blockedUntil: string | null): AccountStatus {
  return blockedUntil && new Date(blockedUntil) > new Date() ? "Frozen" : "Active";
}

function formatDay(date: Date) {
  return date.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
}

function formatMonth(date: Date) {
  return date.toLocaleDateString("en-IN", { month: "short" });
}

function buildDailySeries(days: number, valuesByDate: Map<string, number>): AnalyticsPoint[] {
  const today = new Date();
  const rows: AnalyticsPoint[] = [];
  for (let offset = days - 1; offset >= 0; offset -= 1) {
    const current = new Date(today);
    current.setDate(today.getDate() - offset);
    const key = current.toISOString().slice(0, 10);
    rows.push({ label: formatDay(current), value: valuesByDate.get(key) || 0 });
  }
  return rows;
}

function buildWeeklySeries(days: number, valuesByDate: Map<string, number>): AnalyticsPoint[] {
  const today = new Date();
  const rows: AnalyticsPoint[] = [];
  for (let week = 0; week < days / 7; week += 1) {
    let total = 0;
    for (let day = 0; day < 7; day += 1) {
      const current = new Date(today);
      current.setDate(today.getDate() - ((days - 1) - (week * 7 + day)));
      total += valuesByDate.get(current.toISOString().slice(0, 10)) || 0;
    }
    rows.push({ label: `Week ${week + 1}`, value: total });
  }
  return rows;
}

function buildMonthlySeries(valuesByMonth: Map<string, number>): AnalyticsPoint[] {
  const today = new Date();
  const rows: AnalyticsPoint[] = [];
  for (let offset = 2; offset >= 0; offset -= 1) {
    const current = new Date(today.getFullYear(), today.getMonth() - offset, 1);
    const key = `${current.getFullYear()}-${String(current.getMonth() + 1).padStart(2, "0")}`;
    rows.push({ label: formatMonth(current), value: valuesByMonth.get(key) || 0 });
  }
  return rows;
}

function buildStatusMix(transactions: ApiTransaction[], days: number): AnalyticsPoint[] {
  const cutoff = new Date();
  cutoff.setDate(cutoff.getDate() - (days - 1));
  cutoff.setHours(0, 0, 0, 0);
  const filtered = transactions.filter((entry) => new Date(entry.createdAt) >= cutoff);
  const total = filtered.length || 1;
  const success = filtered.filter((entry) => normalizeTransactionStatus(entry.status) === "Success").length;
  const failed = filtered.filter((entry) => normalizeTransactionStatus(entry.status) === "Failed").length;
  const pending = filtered.filter((entry) => ["Pending", "Flagged"].includes(normalizeTransactionStatus(entry.status))).length;
  return [
    { label: "Success", value: Math.round((success / total) * 100) },
    { label: "Failed", value: Math.round((failed / total) * 100) },
    { label: "Pending", value: Math.round((pending / total) * 100) }
  ];
}

function deriveRiskReason(transaction: ApiTransaction) {
  const status = normalizeTransactionStatus(transaction.status);
  if (status === "Failed") return "Repeated failure or rail rejection";
  if (status === "Pending") return "Pending beyond expected processing window";
  if (status === "Flagged") return transaction.note || "Flagged by transaction monitoring rules";
  if (transaction.amount >= 100000) return "High amount transaction";
  if (transaction.amount >= 50000) return "Large value transfer outside normal band";
  return transaction.note || "Requires manual review";
}

function deriveFraudAlerts(transactions: ApiTransaction[]): FraudAlert[] {
  return transactions
    .filter((entry) => {
      const status = normalizeTransactionStatus(entry.status);
      return entry.amount >= 50000 || status === "Failed" || status === "Flagged" || status === "Pending";
    })
    .slice(0, 8)
    .map((entry, index) => ({
      id: `fraud_${entry.id}_${index}`,
      transactionId: entry.id,
      userId: entry.senderId,
      userName: `${entry.sender.firstName} ${entry.sender.lastName}`,
      amount: entry.amount,
      riskScore: Math.min(98, 50 + (entry.amount >= 100000 ? 28 : entry.amount >= 50000 ? 18 : 8) + (normalizeTransactionStatus(entry.status) === "Failed" ? 12 : 0) + (normalizeTransactionStatus(entry.status) === "Flagged" ? 18 : 0)),
      reason: deriveRiskReason(entry),
      status: normalizeTransactionStatus(entry.status) === "Failed" ? "Investigating" : "Open"
    }));
}

function buildAnalytics(users: ApiUser[], transactions: ApiTransaction[]) {
  const transactionDaily = new Map<string, number>();
  const userDaily = new Map<string, number>();
  const transactionMonthly = new Map<string, number>();
  const userMonthly = new Map<string, number>();

  transactions.forEach((entry) => {
    const dateKey = entry.createdAt.slice(0, 10);
    const monthKey = entry.createdAt.slice(0, 7);
    transactionDaily.set(dateKey, (transactionDaily.get(dateKey) || 0) + entry.amount);
    transactionMonthly.set(monthKey, (transactionMonthly.get(monthKey) || 0) + entry.amount);
  });

  users.forEach((entry) => {
    const dateKey = entry.createdAt.slice(0, 10);
    const monthKey = entry.createdAt.slice(0, 7);
    userDaily.set(dateKey, (userDaily.get(dateKey) || 0) + 1);
    userMonthly.set(monthKey, (userMonthly.get(monthKey) || 0) + 1);
  });

  return {
    transactionVolume: {
      "7d": buildDailySeries(7, transactionDaily),
      "30d": buildWeeklySeries(28, transactionDaily),
      "90d": buildMonthlySeries(transactionMonthly)
    },
    userGrowth: {
      "7d": buildDailySeries(7, userDaily),
      "30d": buildWeeklySeries(28, userDaily),
      "90d": buildMonthlySeries(userMonthly)
    },
    successVsFailed: {
      "7d": buildStatusMix(transactions, 7),
      "30d": buildStatusMix(transactions, 30),
      "90d": buildStatusMix(transactions, 90)
    }
  };
}

function buildCards(users: ApiUser[], transactions: ApiTransaction[]): AdminCard[] {
  return users
    .filter((entry) => entry.role === "user")
    .map((entry) => {
      const latestTransaction = transactions.find((transaction) => transaction.senderId === entry.id || transaction.receiverId === entry.id);
      return {
        id: entry.accountNo || `card_${entry.id}`,
        userId: entry.id,
        userName: `${entry.firstName} ${entry.lastName}`,
        status: getAccountStatus(entry.blockedUntil) === "Frozen" ? "Blocked" : "Active",
        lastUsed: latestTransaction?.createdAt || entry.createdAt
      };
    });
}

function buildKycRequests(users: ApiUser[]): KycRequest[] {
  return users
    .filter((entry) => normalizeKycStatus(entry.kycStatus) !== "Verified")
    .map((entry) => ({
      id: `kyc_${entry.id}`,
      userId: entry.id,
      userName: `${entry.firstName} ${entry.lastName}`,
      submittedAt: entry.createdAt,
      status: normalizeKycStatus(entry.kycStatus) === "Rejected" ? "Rejected" : "Pending",
      documents: [
        { label: "Aadhaar Front", type: "image" },
        { label: "Aadhaar Back", type: "image" },
        { label: "PAN Card", type: "image" },
        { label: "Selfie", type: "image" }
      ]
    }));
}

function buildAdminLogs(users: ApiUser[], transactions: ApiTransaction[]): AdminLog[] {
  const sessionLog: AdminLog = {
    id: "log_admin_session",
    type: "login",
    actor: "Current Admin Session",
    role: "Admin",
    action: "Admin console session active",
    ip: "Masked",
    status: "Success",
    createdAt: new Date().toISOString()
  };

  const userLogs: AdminLog[] = users.slice(0, 3).map((entry) => ({
    id: `log_user_${entry.id}`,
    type: "action",
    actor: "System",
    role: "Platform",
    action: `User onboarded: ${entry.firstName} ${entry.lastName}`,
    ip: "Internal",
    status: "Success",
    createdAt: entry.createdAt
  }));

  const transactionLogs: AdminLog[] = transactions.slice(0, 3).map((entry) => ({
    id: `log_txn_${entry.id}`,
    type: "action",
    actor: "System",
    role: "Payments Rail",
    action: `Transaction ${entry.id} processed with status ${normalizeTransactionStatus(entry.status)}`,
    ip: "Internal",
    status: normalizeTransactionStatus(entry.status) === "Failed" ? "Failed" : "Success",
    createdAt: entry.createdAt
  }));

  return [sessionLog, ...userLogs, ...transactionLogs].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt));
}

function transformAdminResponse(payload: AdminApiResponse): AdminDashboardData {
  const users: AdminUser[] = payload.users.map((entry) => ({
    id: entry.id,
    name: `${entry.firstName} ${entry.lastName}`,
    phone: entry.phone,
    email: entry.email,
    kycStatus: normalizeKycStatus(entry.kycStatus),
    accountStatus: getAccountStatus(entry.blockedUntil),
    role: entry.role === "super_admin" || entry.role === "superadmin" ? "super_admin" : entry.role === "admin" ? "admin" : "user",
    joinedAt: entry.createdAt,
    accountNo: entry.accountNo,
    upiId: entry.upiId
  }));

  const transactions: AdminTransaction[] = payload.transactions.map((entry) => ({
    id: entry.id,
    userId: entry.senderId,
    userName: `${entry.sender.firstName} ${entry.sender.lastName}`,
    amount: entry.amount,
    status: normalizeTransactionStatus(entry.status),
    channel: entry.note?.toLowerCase().includes("upi") ? "UPI" : entry.note?.toLowerCase().includes("card") ? "Card" : "Bank Transfer",
    createdAt: entry.createdAt,
    riskReason: deriveRiskReason(entry)
  }));

  return {
    users,
    transactions,
    cards: buildCards(payload.users, payload.transactions),
    fraudAlerts: deriveFraudAlerts(payload.transactions),
    kycRequests: buildKycRequests(payload.users),
    analytics: buildAnalytics(payload.users, payload.transactions),
    adminLogs: buildAdminLogs(payload.users, payload.transactions)
  };
}

export async function fetchAdminDashboard(): Promise<AdminDashboardData> {
  const response = await fetch("/api/admin", { cache: "no-store" });
  if (!response.ok) {
    throw new Error("Failed to load admin dashboard");
  }
  const payload = (await response.json()) as AdminApiResponse;
  return transformAdminResponse(payload);
}

export function formatCurrencyInr(amount: number) {
  return `?${amount.toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;
}

export function maskPhone(phone: string) {
  return `${phone.slice(0, 2)}******${phone.slice(-2)}`;
}

export function maskEmail(email: string) {
  const [name, domain] = email.split("@");
  if (!domain) return email;
  return `${name.slice(0, 2)}***@${domain}`;
}

export function maskCardId(cardId: string) {
  const digits = cardId.replace(/\D/g, "");
  const tail = digits.slice(-4) || "0000";
  return `•••• •••• •••• ${tail}`;
}

export function canRunCriticalAction(role: AdminRole) {
  return role === "super_admin";
}



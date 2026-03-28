"use client";

import { useEffect, useMemo, useState } from "react";
import {
  AdminDashboardData,
  AdminLog,
  AdminRole,
  AdminTransaction,
  FraudAlert,
  fetchAdminDashboard,
} from "@/services/api/adminDashboard";

function cloneData<T>(data: T): T {
  return JSON.parse(JSON.stringify(data)) as T;
}

function todayKey() {
  return new Date().toISOString().slice(0, 10);
}

export function useAdminDashboard(actorName: string, viewerRole: AdminRole) {
  const [data, setData] = useState<AdminDashboardData | null>(null);
  const [loading, setLoading] = useState(true);

  const load = async () => {
    const snapshot = await fetchAdminDashboard();
    setData(snapshot);
    return snapshot;
  };

  useEffect(() => {
    let mounted = true;
    setLoading(true);
    fetchAdminDashboard()
      .then((snapshot) => {
        if (!mounted) return;
        setData(snapshot);
      })
      .finally(() => {
        if (mounted) setLoading(false);
      });
    return () => {
      mounted = false;
    };
  }, []);

  const addLog = (draft: AdminDashboardData, action: string, status: "Success" | "Failed" = "Success") => {
    const log: AdminLog = {
      id: `log_${Date.now()}`,
      type: "action",
      actor: actorName,
      role: viewerRole === "super_admin" ? "Super Admin" : "Admin",
      action,
      ip: "10.0.0.18",
      status,
      createdAt: new Date().toISOString(),
    };
    draft.adminLogs.unshift(log);
  };

  const updateData = (mutator: (draft: AdminDashboardData) => void) => {
    setData((current) => {
      if (!current) return current;
      const draft = cloneData(current);
      mutator(draft);
      return draft;
    });
  };

  const freezeUser = async (userId: string) => {
    const user = data?.users.find((entry) => entry.id === userId);
    if (!user) return;
    const action = user.accountStatus === "Frozen" ? "unblock" : "block";
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action })
    });
    if (!response.ok) return;
    const snapshot = await load();
    updateData((draft) => {
      draft.adminLogs = snapshot.adminLogs;
      addLog(draft, `${action === "block" ? "Froze" : "Restored"} account for ${user.name}`);
    });
  };

  const approveKycForUser = async (userId: string) => {
    const user = data?.users.find((entry) => entry.id === userId);
    if (!user) return;
    const response = await fetch("/api/admin", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ userId, action: "approveKyc" })
    });
    if (!response.ok) return;
    const snapshot = await load();
    updateData((draft) => {
      draft.adminLogs = snapshot.adminLogs;
      addLog(draft, `Approved KYC for ${user.name}`);
    });
  };

  const reverseTransaction = (transactionId: string) => {
    updateData((draft) => {
      const transaction = draft.transactions.find((entry) => entry.id === transactionId);
      if (!transaction) return;
      transaction.status = "Reversed";
      addLog(draft, `Reversed transaction ${transaction.id}`);
    });
  };

  const flagTransaction = (transactionId: string) => {
    updateData((draft) => {
      const transaction = draft.transactions.find((entry) => entry.id === transactionId);
      if (!transaction) return;
      transaction.status = "Flagged";
      const existingAlert = draft.fraudAlerts.find((entry) => entry.transactionId === transactionId);
      if (!existingAlert) {
        const alert: FraudAlert = {
          id: `fraud_${Date.now()}`,
          transactionId: transaction.id,
          userId: transaction.userId,
          userName: transaction.userName,
          amount: transaction.amount,
          riskScore: 78,
          reason: transaction.riskReason || "Manually flagged by operations team",
          status: "Open",
        };
        draft.fraudAlerts.unshift(alert);
      }
      addLog(draft, `Flagged transaction ${transaction.id} as suspicious`);
    });
  };

  const toggleCardStatus = (cardId: string) => {
    updateData((draft) => {
      const card = draft.cards.find((entry) => entry.id === cardId);
      if (!card) return;
      card.status = card.status === "Blocked" ? "Active" : "Blocked";
      addLog(draft, `${card.status === "Blocked" ? "Blocked" : "Unblocked"} card ${card.id}`);
    });
  };

  const investigateAlert = (alertId: string) => {
    updateData((draft) => {
      const alert = draft.fraudAlerts.find((entry) => entry.id === alertId);
      if (!alert) return;
      alert.status = "Investigating";
      addLog(draft, `Started investigation on ${alert.transactionId}`);
    });
  };

  const blockUserFromAlert = async (userId: string) => {
    await freezeUser(userId);
  };

  const approveKycRequest = async (requestId: string) => {
    const request = data?.kycRequests.find((entry) => entry.id === requestId);
    if (!request) return;
    await approveKycForUser(request.userId);
  };

  const rejectKycRequest = (requestId: string) => {
    updateData((draft) => {
      const request = draft.kycRequests.find((entry) => entry.id === requestId);
      if (!request) return;
      request.status = "Rejected";
      const user = draft.users.find((entry) => entry.id === request.userId);
      if (user) user.kycStatus = "Rejected";
      addLog(draft, `Rejected KYC request ${request.id}`);
    });
  };

  const overview = useMemo(() => {
    if (!data) {
      return {
        totalUsers: 0,
        transactionsToday: 0,
        volumeToday: 0,
        failedTransactions: 0,
        fraudAlerts: 0,
      };
    }

    const today = todayKey();
    const transactionsToday = data.transactions.filter((entry) => entry.createdAt.startsWith(today));
    return {
      totalUsers: data.users.length,
      transactionsToday: transactionsToday.length,
      volumeToday: transactionsToday.reduce((sum, entry) => sum + entry.amount, 0),
      failedTransactions: data.transactions.filter((entry) => entry.status === "Failed").length,
      fraudAlerts: data.fraudAlerts.filter((entry) => entry.status !== "Resolved").length,
    };
  }, [data]);

  const suspiciousTransactions = useMemo(() => {
    if (!data) return [] as AdminTransaction[];
    return data.transactions.filter((entry) => entry.status === "Flagged");
  }, [data]);

  return {
    data,
    loading,
    overview,
    suspiciousTransactions,
    reload: load,
    actions: {
      freezeUser,
      approveKycForUser,
      reverseTransaction,
      flagTransaction,
      toggleCardStatus,
      investigateAlert,
      blockUserFromAlert,
      approveKycRequest,
      rejectKycRequest,
    },
  };
}


"use client";

import { useEffect, useMemo, useState } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import { AdminLogsPanel } from "@/components/admin/AdminLogsPanel";
import { AdminNavKey, AdminSidebar } from "@/components/admin/AdminSidebar";
import { AnalyticsPanel } from "@/components/admin/AnalyticsPanel";
import { CardManagementPanel } from "@/components/admin/CardManagementPanel";
import { DashboardOverview } from "@/components/admin/DashboardOverview";
import { FraudDetectionPanel } from "@/components/admin/FraudDetectionPanel";
import { KycVerificationPanel } from "@/components/admin/KycVerificationPanel";
import { Modal } from "@/components/admin/Modal";
import { SettingsPanel } from "@/components/admin/SettingsPanel";
import { UserManagementPanel } from "@/components/admin/UserManagementPanel";
import { TransactionMonitoringPanel } from "@/components/admin/TransactionMonitoringPanel";
import { useAdminDashboard } from "@/hooks/useAdminDashboard";
import {
  AdminRole,
  AdminUser,
  FraudAlert,
  KycRequest,
  AdminTransaction,
  AdminCard,
  maskEmail,
  maskPhone,
} from "@/services/api/adminDashboard";

type ConfirmState = {
  title: string;
  description: string;
  confirmLabel: string;
  confirmTone?: "primary" | "danger";
  onConfirm: () => void;
};

export default function AdminPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [activeNav, setActiveNav] = useState<AdminNavKey>("dashboard");
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [viewedUser, setViewedUser] = useState<AdminUser | null>(null);

  const sessionRole = ((session?.user as any)?.role || "") as string;
  const viewerRole: AdminRole = useMemo(() => {
    return sessionRole === "super_admin" || sessionRole === "superadmin" ? "super_admin" : "admin";
  }, [sessionRole]);

  const actorName = ((session?.user as any)?.name || "Operations Admin") as string;
  const { data, loading, overview, actions } = useAdminDashboard(actorName, viewerRole);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
    if (status === "authenticated") {
      if (!["admin", "super_admin", "superadmin"].includes(sessionRole)) {
        router.push("/dashboard");
      }
    }
  }, [router, sessionRole, status]);

  const openConfirm = (state: ConfirmState) => setConfirmState(state);

  const requestFreeze = (user: AdminUser) => {
    openConfirm({
      title: user.accountStatus === "Frozen" ? "Restore account access?" : "Freeze account?",
      description: `${user.name} will ${user.accountStatus === "Frozen" ? "regain" : "lose"} access after this operation.`,
      confirmLabel: user.accountStatus === "Frozen" ? "Restore Account" : "Freeze Account",
      confirmTone: "danger",
      onConfirm: () => actions.freezeUser(user.id),
    });
  };

  const requestApproveKyc = (user: AdminUser) => {
    openConfirm({
      title: "Approve KYC?",
      description: `Approve identity verification for ${user.name} and move the account to verified status.`,
      confirmLabel: "Approve KYC",
      onConfirm: () => actions.approveKycForUser(user.id),
    });
  };

  const requestReverse = (transaction: AdminTransaction) => {
    openConfirm({
      title: "Reverse transaction?",
      description: `This will mark ${transaction.id} as reversed and should only be used for supervised recovery flows.`,
      confirmLabel: "Reverse Transaction",
      confirmTone: "danger",
      onConfirm: () => actions.reverseTransaction(transaction.id),
    });
  };

  const requestFlag = (transaction: AdminTransaction) => {
    openConfirm({
      title: "Flag transaction as suspicious?",
      description: `This will move ${transaction.id} into the fraud workflow for manual review.`,
      confirmLabel: "Flag Transaction",
      onConfirm: () => actions.flagTransaction(transaction.id),
    });
  };

  const requestCardToggle = (card: AdminCard) => {
    openConfirm({
      title: card.status === "Blocked" ? "Unblock card?" : "Block card?",
      description: `${card.userName}'s card status will change immediately across admin monitoring views.`,
      confirmLabel: card.status === "Blocked" ? "Unblock Card" : "Block Card",
      confirmTone: card.status === "Blocked" ? "primary" : "danger",
      onConfirm: () => actions.toggleCardStatus(card.id),
    });
  };

  const requestInvestigate = (alert: FraudAlert) => {
    openConfirm({
      title: "Start investigation?",
      description: `This will move ${alert.transactionId} into an active investigation state for the risk team.`,
      confirmLabel: "Investigate",
      onConfirm: () => actions.investigateAlert(alert.id),
    });
  };

  const requestBlockUser = (alert: FraudAlert) => {
    openConfirm({
      title: "Block user from fraud panel?",
      description: `${alert.userName}'s account will be frozen from the fraud console.`,
      confirmLabel: "Block User",
      confirmTone: "danger",
      onConfirm: () => actions.blockUserFromAlert(alert.userId),
    });
  };

  const requestApproveKycSubmission = (request: KycRequest) => {
    openConfirm({
      title: "Approve KYC submission?",
      description: `${request.userName}'s documents will be marked approved.`,
      confirmLabel: "Approve Submission",
      onConfirm: () => actions.approveKycRequest(request.id),
    });
  };

  const requestRejectKycSubmission = (request: KycRequest) => {
    openConfirm({
      title: "Reject KYC submission?",
      description: `${request.userName}'s documents will be rejected and require resubmission.`,
      confirmLabel: "Reject Submission",
      confirmTone: "danger",
      onConfirm: () => actions.rejectKycRequest(request.id),
    });
  };

  if (loading || !data) {
    return (
      // Loading state: light bg with primary spinner
      <div className="min-h-screen bg-surface flex items-center justify-center">
        <div className="h-12 w-12 animate-spin rounded-full border-2 border-primary border-t-transparent" />
      </div>
    );
  }

  return (
    // Root: light surface background — all panels layer tonally on top
    <div className="min-h-screen bg-[#f3f6fb] px-4 py-5 text-[#172033] md:px-6 lg:px-8">
      <div
        aria-hidden="true"
        className="pointer-events-none fixed inset-0 opacity-80"
        style={{
          background:
            "radial-gradient(circle at top left, rgba(42,123,255,0.14), transparent 26%), radial-gradient(circle at bottom right, rgba(43,87,195,0.08), transparent 24%)",
        }}
      />
      <div className="relative mx-auto flex min-h-[calc(100vh-2.5rem)] max-w-[1500px] flex-col gap-6 md:flex-row">
        <AdminSidebar active={activeNav} onChange={setActiveNav} viewerRole={viewerRole} />

        <main className="flex-1">
          <div className="rounded-[2rem] bg-white/95 p-6 shadow-[0_24px_60px_rgba(18,38,63,0.07)] md:p-8">
          {/* Page header — spacing separates from content, no divider line */}
          <div className="mb-8 flex flex-col gap-4 md:flex-row md:items-end md:justify-between">
            <div>
              <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">
                Digital Bank Operations
              </p>
              <h1 className="mt-3 font-display text-4xl font-bold tracking-tight text-slate-900">
                Production Admin Dashboard
              </h1>
              <p className="mt-3 max-w-3xl text-sm leading-7 text-slate-500">
                Monitor users, transactions, cards, fraud signals, analytics, and KYC queues from a
                single secure operations console.
              </p>
            </div>

            {/* Operator identity chip — surface-container-low tonal card */}
            <div className="rounded-[1.4rem] bg-[#f5f8ff] px-5 py-4 text-sm shadow-[0_10px_30px_rgba(18,38,63,0.05)]">
              <p className="font-semibold text-slate-900">{actorName}</p>
              <p className="mt-1 text-xs uppercase tracking-[0.2em] text-slate-400">
                {viewerRole === "super_admin" ? "Super Admin" : "Admin"}
              </p>
            </div>
          </div>

          <div className="space-y-8">
            {activeNav === "dashboard" && (
              <>
                <DashboardOverview overview={overview} />
                <div className="grid gap-8 xl:grid-cols-2">
                  <FraudDetectionPanel
                    alerts={data.fraudAlerts.slice(0, 2)}
                    viewerRole={viewerRole}
                    onInvestigate={requestInvestigate}
                    onBlockUser={requestBlockUser}
                  />
                  <KycVerificationPanel
                    requests={data.kycRequests.slice(0, 2)}
                    onApprove={requestApproveKycSubmission}
                    onReject={requestRejectKycSubmission}
                  />
                </div>
              </>
            )}

            {activeNav === "users" && (
              <UserManagementPanel
                users={data.users}
                viewerRole={viewerRole}
                onView={setViewedUser}
                onFreeze={requestFreeze}
                onApproveKyc={requestApproveKyc}
              />
            )}

            {activeNav === "transactions" && (
              <TransactionMonitoringPanel
                transactions={data.transactions}
                viewerRole={viewerRole}
                onReverse={requestReverse}
                onFlag={requestFlag}
              />
            )}

            {activeNav === "cards" && (
              <CardManagementPanel
                cards={data.cards}
                viewerRole={viewerRole}
                onToggleBlock={requestCardToggle}
              />
            )}

            {activeNav === "kyc" && (
              <KycVerificationPanel
                requests={data.kycRequests}
                onApprove={requestApproveKycSubmission}
                onReject={requestRejectKycSubmission}
              />
            )}

            {activeNav === "fraud" && (
              <FraudDetectionPanel
                alerts={data.fraudAlerts}
                viewerRole={viewerRole}
                onInvestigate={requestInvestigate}
                onBlockUser={requestBlockUser}
              />
            )}

            {activeNav === "analytics" && (
              <AnalyticsPanel
                transactionVolume={data.analytics.transactionVolume}
                userGrowth={data.analytics.userGrowth}
                successVsFailed={data.analytics.successVsFailed}
              />
            )}

            {activeNav === "settings" && (
              <div className="space-y-8">
                <SettingsPanel viewerRole={viewerRole} />
                <AdminLogsPanel logs={data.adminLogs} />
              </div>
            )}
          </div>
          </div>
        </main>
      </div>

      {/* Confirm action modal */}
      <Modal
        open={!!confirmState}
        title={confirmState?.title || "Confirm action"}
        description={confirmState?.description}
        confirmLabel={confirmState?.confirmLabel}
        confirmTone={confirmState?.confirmTone}
        onClose={() => setConfirmState(null)}
        onConfirm={
          confirmState
            ? () => {
                confirmState.onConfirm();
                setConfirmState(null);
              }
            : undefined
        }
      />

      {/* User detail modal */}
      <Modal
        open={!!viewedUser}
        title={viewedUser?.name || "User details"}
        onClose={() => setViewedUser(null)}
      >
        {viewedUser && (
          <div className="grid gap-3">
            <Detail label="Phone"          value={maskPhone(viewedUser.phone)} />
            <Detail label="Email"          value={maskEmail(viewedUser.email)} />
            <Detail label="KYC Status"     value={viewedUser.kycStatus} />
            <Detail label="Account Status" value={viewedUser.accountStatus} />
            <Detail label="Role"           value={viewedUser.role} />
            <Detail label="Joined"         value={new Date(viewedUser.joinedAt).toLocaleString("en-IN")} />
          </div>
        )}
      </Modal>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    // Detail row: surface-container-low tonal tile — no border, spacing is the separator
    <div className="flex items-center justify-between rounded-sm bg-surface-container-low px-4 py-3 text-sm">
      <span className="text-on-surface-variant">{label}</span>
      <span className="font-medium text-on-surface">{value}</span>
    </div>
  );
}

"use client";

import { FraudAlert, AdminRole, formatCurrencyInr } from "@/services/api/adminDashboard";
import { StatusBadge } from "@/components/admin/StatusBadge";

type FraudDetectionPanelProps = {
  alerts: FraudAlert[];
  viewerRole: AdminRole;
  onInvestigate: (alert: FraudAlert) => void;
  onBlockUser: (alert: FraudAlert) => void;
};

export function FraudDetectionPanel({ alerts, viewerRole, onInvestigate, onBlockUser }: FraudDetectionPanelProps) {
  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">Fraud Detection Panel</h2>
        <p className="mt-1 text-sm text-[#8b8ba7]">Risk-scored cases with operator actions and escalation controls.</p>
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        {alerts.map((alert) => (
          <div key={alert.id} className="rounded-3xl border border-white/6 bg-[#11111d] p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-white">{alert.userName}</p>
                <p className="mt-1 text-sm text-[#8b8ba7]">{alert.transactionId}</p>
              </div>
              <StatusBadge
                label={alert.status}
                tone={alert.status === "Open" ? "danger" : alert.status === "Investigating" ? "warning" : "success"}
              />
            </div>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <Metric label="Amount" value={formatCurrencyInr(alert.amount)} />
              <Metric label="Risk Score" value={`${alert.riskScore}/100`} />
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8fae]">Reason</p>
              <p className="mt-2 text-sm leading-6 text-[#d3d3e3]">{alert.reason}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button onClick={() => onInvestigate(alert)} className="rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/10 px-4 py-2 text-sm text-[#87f4d4]">
                Investigate
              </button>
              <button
                onClick={() => onBlockUser(alert)}
                disabled={viewerRole !== "super_admin"}
                className="rounded-xl border border-[#ff5d6c]/20 bg-[#ff5d6c]/10 px-4 py-2 text-sm text-[#ffb1b8] disabled:cursor-not-allowed disabled:opacity-40"
              >
                Block user
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-2xl border border-white/5 bg-white/[0.03] px-4 py-3">
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8fae]">{label}</p>
      <p className="mt-2 text-lg font-semibold text-white">{value}</p>
    </div>
  );
}


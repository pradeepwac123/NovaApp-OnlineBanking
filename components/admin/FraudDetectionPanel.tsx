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
        <h2 className="text-3xl font-bold text-slate-900">Fraud Detection Panel</h2>
        <p className="mt-1 text-sm text-slate-500">
          Risk-scored cases with operator actions and escalation controls.
        </p>
      </div>

      {alerts.length === 0 && (
        <p className="rounded-[1.6rem] bg-white px-4 py-8 text-center text-sm text-slate-500 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
          No fraud alerts in the active queue.
        </p>
      )}

      <div className="grid gap-4 xl:grid-cols-2">
        {alerts.map((alert) => (
          <article key={alert.id} className="rounded-[1.8rem] bg-white p-5 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-lg font-semibold text-slate-900">{alert.userName}</p>
                <p className="mt-1 text-sm font-mono text-slate-400">{alert.transactionId}</p>
              </div>
              <StatusBadge
                label={alert.status}
                tone={
                  alert.status === "Open"
                    ? "danger"
                    : alert.status === "Investigating"
                      ? "warning"
                      : "success"
                }
              />
            </div>

            <div className="mt-5 grid gap-3 sm:grid-cols-2">
              <Metric label="Amount" value={formatCurrencyInr(alert.amount)} />
              <Metric label="Risk Score" value={`${alert.riskScore}/100`} />
            </div>

            <div className="mt-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">Reason</p>
              <p className="mt-2 text-sm leading-6 text-slate-700">{alert.reason}</p>
            </div>

            <div className="mt-5 flex flex-wrap gap-3">
              <button
                onClick={() => onInvestigate(alert)}
                className="rounded-[1rem] bg-[#eef4ff] px-4 py-2 text-sm font-semibold text-[#2372ff] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2372ff]"
              >
                Investigate
              </button>

              <button
                onClick={() => onBlockUser(alert)}
                disabled={viewerRole !== "super_admin"}
                className="rounded-[1rem] bg-[#fff1ef] px-4 py-2 text-sm font-semibold text-[#e36a5d] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#e36a5d]"
              >
                Block user
              </button>
            </div>
          </article>
        ))}
      </div>
    </div>
  );
}

function Metric({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-[1.2rem] bg-[#f8fbff] px-4 py-3 ring-1 ring-[#e4eefc]">
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className="mt-2 text-lg font-semibold text-slate-900">{value}</p>
    </div>
  );
}

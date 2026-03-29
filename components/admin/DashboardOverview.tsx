"use client";

import { StatCard } from "@/components/admin/StatCard";
import { formatCurrencyInr } from "@/services/api/adminDashboard";

type DashboardOverviewProps = {
  overview: {
    totalUsers: number;
    transactionsToday: number;
    volumeToday: number;
    failedTransactions: number;
    fraudAlerts: number;
  };
};

export function DashboardOverview({ overview }: DashboardOverviewProps) {
  return (
    <div className="space-y-6">
      <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-5">
        <StatCard
          label="Total Users"
          value={overview.totalUsers.toLocaleString("en-IN")}
          helper="Retail and business accounts"
        />
        <StatCard
          label="Transactions Today"
          value={overview.transactionsToday.toLocaleString("en-IN")}
          tone="success"
          helper="Live operational count"
        />
        <StatCard
          label="Transaction Volume"
          value={formatCurrencyInr(overview.volumeToday)}
          helper="Today's processed value"
        />
        <StatCard
          label="Failed Transactions"
          value={overview.failedTransactions.toString()}
          tone="warning"
          helper="Requires review and retries"
        />
        <StatCard
          label="Fraud Alerts"
          value={overview.fraudAlerts.toString()}
          tone="danger"
          helper="Open and investigating cases"
        />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-[1.8rem] bg-[#f8fbff] p-6 shadow-[0_20px_50px_rgba(18,38,63,0.05)] lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">System Monitoring</p>
          <h2 className="mt-3 text-3xl font-bold text-slate-900">Payments rail health snapshot</h2>
          <p className="mt-3 max-w-2xl text-sm leading-7 text-slate-500">
            Live operational metrics are sourced from the real database, so newly created users and fresh
            transactions appear here automatically.
          </p>
        </div>

        <div className="rounded-[1.8rem] bg-[#f8fbff] p-6 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
          <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Risk Snapshot</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-[1.2rem] bg-[#fff1ef] px-4 py-3 text-sm font-medium text-[#e36a5d]">
              {overview.fraudAlerts === 0
                ? "No active fraud alerts right now"
                : `${overview.fraudAlerts} fraud alerts in the active queue`}
            </div>
            <div className="rounded-[1.2rem] bg-[#fff7e6] px-4 py-3 text-sm font-medium text-[#b7791f]">
              {overview.failedTransactions === 0
                ? "No failed transactions in the current snapshot"
                : `${overview.failedTransactions} failed transactions need review`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

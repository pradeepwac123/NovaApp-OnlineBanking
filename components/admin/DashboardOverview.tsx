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
        <StatCard label="Total Users" value={overview.totalUsers.toLocaleString("en-IN")} helper="Retail and business accounts" />
        <StatCard label="Transactions Today" value={overview.transactionsToday.toLocaleString("en-IN")} tone="success" helper="Live operational count" />
        <StatCard label="Transaction Volume" value={formatCurrencyInr(overview.volumeToday)} helper="Today's processed value" />
        <StatCard label="Failed Transactions" value={overview.failedTransactions.toString()} tone="warning" helper="Requires review and retries" />
        <StatCard label="Fraud Alerts" value={overview.fraudAlerts.toString()} tone="danger" helper="Open and investigating cases" />
      </div>

      <div className="grid gap-4 lg:grid-cols-3">
        <div className="rounded-3xl border border-white/6 bg-[#11111d] p-5 lg:col-span-2">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f8fae]">System Monitoring</p>
          <h2 className="mt-3 text-2xl font-semibold text-white">Payments rail health snapshot</h2>
          <p className="mt-3 max-w-2xl text-sm leading-6 text-[#7d7d99]">
            Live operational metrics are sourced from the real database, so newly created users and fresh transactions appear here automatically.
          </p>
        </div>

        <div className="rounded-3xl border border-white/6 bg-[#11111d] p-5">
          <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f8fae]">Risk Snapshot</p>
          <div className="mt-4 space-y-3">
            <div className="rounded-2xl border border-[#ff5d6c]/20 bg-[#ff5d6c]/10 px-4 py-3 text-sm text-[#ffb1b8]">
              {overview.fraudAlerts === 0 ? "No active fraud alerts right now" : `${overview.fraudAlerts} fraud alerts in the active queue`}
            </div>
            <div className="rounded-2xl border border-[#f5b942]/20 bg-[#f5b942]/10 px-4 py-3 text-sm text-[#ffd78b]">
              {overview.failedTransactions === 0 ? "No failed transactions in the current snapshot" : `${overview.failedTransactions} failed transactions need review`}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}


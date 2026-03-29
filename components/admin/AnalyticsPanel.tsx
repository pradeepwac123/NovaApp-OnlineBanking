"use client";

import { ReactNode, useMemo, useState } from "react";
import { Tabs } from "@/components/admin/Tabs";
import { AnalyticsSeries, formatCurrencyInr } from "@/services/api/adminDashboard";

type AnalyticsPanelProps = {
  transactionVolume: AnalyticsSeries;
  userGrowth: AnalyticsSeries;
  successVsFailed: AnalyticsSeries;
};

export function AnalyticsPanel({ transactionVolume, userGrowth, successVsFailed }: AnalyticsPanelProps) {
  const [period, setPeriod] = useState<"7d" | "30d" | "90d">("7d");
  const mix = useMemo(() => successVsFailed[period], [period, successVsFailed]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">Analytics Dashboard</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Transaction volume, user growth, and success-rate visibility over time.
          </p>
        </div>
        <Tabs
          items={[
            { key: "7d",  label: "7D"  },
            { key: "30d", label: "30D" },
            { key: "90d", label: "90D" },
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Transaction Volume" subtitle="Daily or period volume in INR">
          <BarChart
            items={transactionVolume[period]}
            formatter={formatCurrencyInr}
            accentColor="bg-primary"
          />
        </ChartCard>

        <ChartCard title="User Growth" subtitle="New accounts created">
          <BarChart
            items={userGrowth[period]}
            formatter={(value) => value.toString()}
            accentColor="bg-success"
          />
        </ChartCard>
      </div>

      <ChartCard title="Success vs Failed transactions" subtitle="Operational quality snapshot">
        <div className="grid gap-3 md:grid-cols-3">
          {mix.map((item) => (
            // Each metric tile: one step up from chart card bg
            <div key={item.label} className="rounded-sm bg-surface-container p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-on-surface-variant">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-on-surface">{item.value}%</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  // Chart card uses surface-container-low — sits on bg-surface, no border needed
  return (
    <div className="rounded-sm bg-surface-container-low p-5">
      <h3 className="text-lg font-semibold text-on-surface">{title}</h3>
      <p className="mt-1 text-sm text-on-surface-variant">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function BarChart({
  items,
  formatter,
  accentColor = "bg-primary",
}: {
  items: { label: string; value: number }[];
  formatter: (value: number) => string;
  accentColor?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-on-surface">{item.label}</span>
            <span className="text-on-surface-variant">{formatter(item.value)}</span>
          </div>
          {/* Track: surface-container (slightly darker than chart card bg) */}
          <div className="h-2.5 overflow-hidden rounded-full bg-surface-container">
            {/* Fill: solid primary/success — GPU-accelerated width transition */}
            <div
              className={`h-full rounded-full ${accentColor} transition-all duration-500`}
              style={{ width: `${(item.value / max) * 100}%` }}
            />
          </div>
        </div>
      ))}
    </div>
  );
}

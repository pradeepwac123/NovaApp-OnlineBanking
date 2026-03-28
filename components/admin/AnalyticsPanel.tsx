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
          <h2 className="text-2xl font-semibold text-white">Analytics Dashboard</h2>
          <p className="mt-1 text-sm text-[#8b8ba7]">Transaction volume, user growth, and success-rate visibility over time.</p>
        </div>
        <Tabs
          items={[
            { key: "7d", label: "7D" },
            { key: "30d", label: "30D" },
            { key: "90d", label: "90D" }
          ]}
          value={period}
          onChange={setPeriod}
        />
      </div>

      <div className="grid gap-4 xl:grid-cols-2">
        <ChartCard title="Transaction Volume" subtitle="Daily or period volume in INR">
          <BarChart items={transactionVolume[period]} formatter={formatCurrencyInr} />
        </ChartCard>

        <ChartCard title="User Growth" subtitle="New accounts created">
          <BarChart items={userGrowth[period]} formatter={(value) => value.toString()} accent="from-[#00D4AA] to-[#6C3CE1]" />
        </ChartCard>
      </div>

      <ChartCard title="Success vs Failed transactions" subtitle="Operational quality snapshot">
        <div className="grid gap-3 md:grid-cols-3">
          {mix.map((item) => (
            <div key={item.label} className="rounded-2xl border border-white/6 bg-white/[0.02] p-4">
              <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8fae]">{item.label}</p>
              <p className="mt-3 text-3xl font-semibold text-white">{item.value}%</p>
            </div>
          ))}
        </div>
      </ChartCard>
    </div>
  );
}

function ChartCard({ title, subtitle, children }: { title: string; subtitle: string; children: ReactNode }) {
  return (
    <div className="rounded-3xl border border-white/6 bg-[#11111d] p-5">
      <h3 className="text-lg font-semibold text-white">{title}</h3>
      <p className="mt-1 text-sm text-[#8b8ba7]">{subtitle}</p>
      <div className="mt-5">{children}</div>
    </div>
  );
}

function BarChart({
  items,
  formatter,
  accent = "from-[#6C3CE1] to-[#00D4AA]"
}: {
  items: { label: string; value: number }[];
  formatter: (value: number) => string;
  accent?: string;
}) {
  const max = Math.max(...items.map((item) => item.value), 1);

  return (
    <div className="space-y-3">
      {items.map((item) => (
        <div key={item.label}>
          <div className="mb-2 flex items-center justify-between text-sm">
            <span className="text-[#c8c8da]">{item.label}</span>
            <span className="text-[#8b8ba7]">{formatter(item.value)}</span>
          </div>
          <div className="h-3 overflow-hidden rounded-full bg-white/[0.05]">
            <div className={`h-full rounded-full bg-gradient-to-r ${accent}`} style={{ width: `${(item.value / max) * 100}%` }} />
          </div>
        </div>
      ))}
    </div>
  );
}



"use client";

import { AdminRole } from "@/services/api/adminDashboard";

type SettingsPanelProps = {
  viewerRole: AdminRole;
};

export function SettingsPanel({ viewerRole }: SettingsPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      <div className="rounded-3xl border border-white/6 bg-[#11111d] p-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f8fae]">Role-Based Access</p>
        <h3 className="mt-3 text-xl font-semibold text-white">Current operator role</h3>
        <p className="mt-3 text-sm leading-6 text-[#8b8ba7]">
          {viewerRole === "super_admin"
            ? "Super Admin can reverse transactions, block cards, and apply high-impact user controls."
            : "Admin can monitor operations, review KYC, investigate alerts, and freeze accounts with confirmation."}
        </p>
      </div>

      <div className="rounded-3xl border border-white/6 bg-[#11111d] p-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f8fae]">Safety Controls</p>
        <h3 className="mt-3 text-xl font-semibold text-white">High-risk actions require confirmation</h3>
        <p className="mt-3 text-sm leading-6 text-[#8b8ba7]">
          Account freezes, KYC decisions, transaction reversals, fraud blocks, and card controls are routed through confirmation modals to prevent unsafe actions.
        </p>
      </div>
    </div>
  );
}


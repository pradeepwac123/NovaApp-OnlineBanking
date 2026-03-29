"use client";

import { AdminRole } from "@/services/api/adminDashboard";

type SettingsPanelProps = {
  viewerRole: AdminRole;
};

export function SettingsPanel({ viewerRole }: SettingsPanelProps) {
  return (
    <div className="grid gap-4 xl:grid-cols-2">
      {/* Card: surface-container-low on bg-surface — tonal layering, no border */}
      <div className="rounded-sm bg-surface-container-low p-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant">Role-Based Access</p>
        <h3 className="mt-3 text-xl font-semibold text-on-surface">Current operator role</h3>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          {viewerRole === "super_admin"
            ? "Super Admin can reverse transactions, block cards, and apply high-impact user controls."
            : "Admin can monitor operations, review KYC, investigate alerts, and freeze accounts with confirmation."}
        </p>
        {/* Role chip */}
        <div className="mt-4">
          <span className="inline-flex rounded-full bg-secondary-container px-3 py-1 text-xs font-semibold text-on-secondary-container">
            {viewerRole === "super_admin" ? "Super Admin" : "Admin"}
          </span>
        </div>
      </div>

      <div className="rounded-sm bg-surface-container-low p-5">
        <p className="text-[11px] uppercase tracking-[0.3em] text-on-surface-variant">Safety Controls</p>
        <h3 className="mt-3 text-xl font-semibold text-on-surface">
          High-risk actions require confirmation
        </h3>
        <p className="mt-3 text-sm leading-6 text-on-surface-variant">
          Account freezes, KYC decisions, transaction reversals, fraud blocks, and card controls are routed
          through confirmation modals to prevent unsafe actions.
        </p>
        {/* Info chip */}
        <div className="mt-4">
          <span className="inline-flex rounded-full bg-[#ffefd5] px-3 py-1 text-xs font-semibold text-[#7a5900]">
            Confirmation Required
          </span>
        </div>
      </div>
    </div>
  );
}

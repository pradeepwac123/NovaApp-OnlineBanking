"use client";

import { AdminRole } from "@/services/api/adminDashboard";

export type AdminNavKey =
  | "dashboard"
  | "users"
  | "transactions"
  | "cards"
  | "kyc"
  | "fraud"
  | "analytics"
  | "settings";

const navItems: { key: AdminNavKey; label: string }[] = [
  { key: "dashboard", label: "Dashboard" },
  { key: "users", label: "Users" },
  { key: "transactions", label: "Transactions" },
  { key: "cards", label: "Cards" },
  { key: "kyc", label: "KYC" },
  { key: "fraud", label: "Fraud" },
  { key: "analytics", label: "Analytics" },
  { key: "settings", label: "Settings" }
];

type AdminSidebarProps = {
  active: AdminNavKey;
  onChange: (key: AdminNavKey) => void;
  viewerRole: AdminRole;
};

export function AdminSidebar({ active, onChange, viewerRole }: AdminSidebarProps) {
  return (
    <aside className="w-full border-b border-white/6 bg-[#0d0d18] p-5 md:w-72 md:border-b-0 md:border-r md:p-6">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#6C3CE1] to-[#00D4AA] font-bold text-white">
            N
          </div>
          <div>
            <p className="text-2xl font-semibold tracking-tight text-white">NovaPay</p>
            <p className="text-xs uppercase tracking-[0.32em] text-[#8181a4]">Admin Control Center</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-3xl border border-white/6 bg-[#111122] p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-[#8f8fae]">Signed in as</p>
        <p className="mt-3 text-lg font-medium text-white">{viewerRole === "super_admin" ? "Super Admin" : "Admin"}</p>
        <p className="mt-1 text-sm text-[#7a7a99]">
          {viewerRole === "super_admin"
            ? "Can reverse transactions and manage card controls."
            : "Can monitor operations, users, and KYC queues."}
        </p>
      </div>

      <nav className="space-y-2">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`w-full rounded-2xl px-4 py-3 text-left text-sm transition ${
              active === item.key
                ? "border border-[#6C3CE1]/30 bg-gradient-to-r from-[#6C3CE1]/18 to-[#00D4AA]/10 text-white"
                : "border border-transparent text-[#8d8dad] hover:border-white/10 hover:bg-white/[0.03] hover:text-white"
            }`}
          >
            {item.label}
          </button>
        ))}
      </nav>
    </aside>
  );
}


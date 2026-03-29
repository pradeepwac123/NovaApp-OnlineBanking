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

const navItems: { key: AdminNavKey; label: string; icon: string }[] = [
  { key: "dashboard", label: "Dashboard", icon: "\u25A6" },
  { key: "users", label: "Users", icon: "\u25CB" },
  { key: "transactions", label: "Transactions", icon: "\u2194" },
  { key: "cards", label: "Cards", icon: "\u25AD" },
  { key: "kyc", label: "KYC", icon: "\u2713" },
  { key: "fraud", label: "Fraud", icon: "\u2691" },
  { key: "analytics", label: "Analytics", icon: "\u2197" },
  { key: "settings", label: "Settings", icon: "\u2699" },
];

type AdminSidebarProps = {
  active: AdminNavKey;
  onChange: (key: AdminNavKey) => void;
  viewerRole: AdminRole;
};

export function AdminSidebar({ active, onChange, viewerRole }: AdminSidebarProps) {
  return (
    <aside className="w-full rounded-[2rem] bg-white/95 p-5 shadow-[0_24px_60px_rgba(18,38,63,0.07)] md:w-72 md:p-6 md:sticky md:top-5 md:h-[calc(100vh-2.5rem)] md:overflow-hidden">
      <div className="flex h-full flex-col">
      <div className="mb-10">
        <div className="flex items-center gap-3">
          <div className="flex h-11 w-11 items-center justify-center rounded-2xl bg-gradient-to-br from-[#1b76ff] to-[#5da8ff] text-lg font-bold text-white">
            N
          </div>
          <div>
            <p className="font-display text-2xl font-bold tracking-tight text-[#2372ff]">NovaPay</p>
            <p className="text-xs uppercase tracking-[0.32em] text-slate-400">Admin Control Center</p>
          </div>
        </div>
      </div>

      <div className="mb-6 rounded-[1.6rem] bg-[#f5f8ff] p-4">
        <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Signed in as</p>
        <p className="mt-3 text-lg font-semibold text-slate-900">
          {viewerRole === "super_admin" ? "Super Admin" : "Admin"}
        </p>
        <p className="mt-1 text-sm leading-6 text-slate-500">
          {viewerRole === "super_admin"
            ? "Can reverse transactions and manage card controls."
            : "Can monitor operations, users, and KYC queues."}
        </p>
      </div>

      <nav aria-label="Admin navigation" className="space-y-2 md:min-h-0 md:flex-1 md:overflow-y-auto md:pr-1">
        {navItems.map((item) => (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            aria-current={active === item.key ? "page" : undefined}
            className={`flex w-full items-center gap-3 rounded-[1.2rem] px-4 py-3 text-left text-sm font-semibold transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#2372ff] ${
              active === item.key
                ? "bg-[#eef4ff] text-[#2372ff]"
                : "text-slate-500 hover:bg-[#f6f8fc] hover:text-slate-800"
            }`}
          >
            <span className="w-4 text-center text-base leading-none" aria-hidden="true">
              {item.icon}
            </span>
            {item.label}
          </button>
        ))}
      </nav>
      </div>
    </aside>
  );
}

"use client";

import { useMemo, useState } from "react";
import { DataColumn, DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminRole, AdminUser, maskEmail, maskPhone } from "@/services/api/adminDashboard";

type UserManagementPanelProps = {
  users: AdminUser[];
  viewerRole: AdminRole;
  onView: (user: AdminUser) => void;
  onFreeze: (user: AdminUser) => void;
  onApproveKyc: (user: AdminUser) => void;
};

export function UserManagementPanel({ users, viewerRole, onView, onFreeze, onApproveKyc }: UserManagementPanelProps) {
  const [statusFilter, setStatusFilter] = useState<"all" | "active" | "frozen">("all");

  const visibleUsers = useMemo(() => {
    if (statusFilter === "all") return users;
    return users.filter((user) => user.accountStatus.toLowerCase() === statusFilter);
  }, [statusFilter, users]);

  const columns: DataColumn<AdminUser>[] = [
    {
      key: "name",
      header: "Name",
      render: (user) => (
        <div>
          <p className="font-medium text-white">{user.name}</p>
          <p className="mt-1 text-xs text-[#8b8ba7]">{new Date(user.joinedAt).toLocaleDateString("en-IN")}</p>
        </div>
      )
    },
    {
      key: "contact",
      header: "Phone / Email",
      render: (user) => (
        <div className="space-y-1 text-sm text-[#c8c8da]">
          <p>{maskPhone(user.phone)}</p>
          <p className="text-[#8b8ba7]">{maskEmail(user.email)}</p>
        </div>
      )
    },
    {
      key: "kyc",
      header: "KYC Status",
      render: (user) => (
        <StatusBadge
          label={user.kycStatus}
          tone={user.kycStatus === "Verified" ? "success" : user.kycStatus === "Rejected" ? "danger" : "warning"}
        />
      )
    },
    {
      key: "account",
      header: "Account Status",
      render: (user) => <StatusBadge label={user.accountStatus} tone={user.accountStatus === "Active" ? "success" : "danger"} />
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          <button onClick={() => onView(user)} className="rounded-xl border border-white/10 px-3 py-2 text-xs text-[#c8c8da] hover:text-white">
            View
          </button>
          <button onClick={() => onFreeze(user)} className="rounded-xl border border-[#ff5d6c]/20 bg-[#ff5d6c]/10 px-3 py-2 text-xs text-[#ffb1b8]">
            {user.accountStatus === "Frozen" ? "Restore" : "Freeze Account"}
          </button>
          <button
            onClick={() => onApproveKyc(user)}
            disabled={user.kycStatus === "Verified"}
            className="rounded-xl border border-[#00D4AA]/20 bg-[#00D4AA]/10 px-3 py-2 text-xs text-[#8ef6d8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Approve KYC
          </button>
          {viewerRole === "super_admin" && (
            <span className="rounded-full border border-[#6C3CE1]/20 bg-[#6C3CE1]/10 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em] text-[#c1b2ff]">
              Super Admin
            </span>
          )}
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-white">User Management</h2>
          <p className="mt-1 text-sm text-[#8b8ba7]">Monitor account health, KYC progression, and operational controls.</p>
        </div>
        <div className="flex gap-2">
          {[
            { key: "all", label: "All" },
            { key: "active", label: "Active" },
            { key: "frozen", label: "Frozen" }
          ].map((item) => (
            <button
              key={item.key}
              onClick={() => setStatusFilter(item.key as "all" | "active" | "frozen")}
              className={`rounded-full px-4 py-2 text-xs ${
                statusFilter === item.key ? "bg-[#6C3CE1] text-white" : "border border-white/10 text-[#8b8ba7]"
              }`}
            >
              {item.label}
            </button>
          ))}
        </div>
      </div>
      <DataTable columns={columns} rows={visibleUsers} rowKey={(row) => row.id} emptyState="No users match the active filter." />
    </div>
  );
}


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
          <p className="font-medium text-on-surface">{user.name}</p>
          <p className="mt-1 text-xs text-on-surface-variant">
            {new Date(user.joinedAt).toLocaleDateString("en-IN")}
          </p>
        </div>
      ),
    },
    {
      key: "contact",
      header: "Phone / Email",
      render: (user) => (
        <div className="space-y-1 text-sm">
          <p className="text-on-surface">{maskPhone(user.phone)}</p>
          <p className="text-on-surface-variant">{maskEmail(user.email)}</p>
        </div>
      ),
    },
    {
      key: "kyc",
      header: "KYC Status",
      render: (user) => (
        <StatusBadge
          label={user.kycStatus}
          tone={
            user.kycStatus === "Verified" ? "success"
            : user.kycStatus === "Rejected" ? "danger"
            : "warning"
          }
        />
      ),
    },
    {
      key: "account",
      header: "Account Status",
      render: (user) => (
        <StatusBadge
          label={user.accountStatus}
          tone={user.accountStatus === "Active" ? "success" : "danger"}
        />
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (user) => (
        <div className="flex flex-wrap gap-2">
          {/* Secondary action — surface-container-high tonal button */}
          <button
            onClick={() => onView(user)}
            className="rounded-sm bg-surface-container-high px-3 py-2 text-xs font-medium text-on-surface transition-colors hover:bg-surface-container focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
          >
            View
          </button>

          {/* Destructive action — error container */}
          <button
            onClick={() => onFreeze(user)}
            className="rounded-sm bg-[#ffdad6] px-3 py-2 text-xs font-medium text-[#ba1a1a] transition-opacity hover:opacity-80 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
          >
            {user.accountStatus === "Frozen" ? "Restore" : "Freeze Account"}
          </button>

          {/* Positive action — success container */}
          <button
            onClick={() => onApproveKyc(user)}
            disabled={user.kycStatus === "Verified"}
            className="rounded-sm bg-[#c8f5de] px-3 py-2 text-xs font-medium text-[#005229] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-success"
          >
            Approve KYC
          </button>

          {/* Role indicator chip */}
          {viewerRole === "super_admin" && (
            <span className="rounded-full bg-secondary-container px-2.5 py-1 text-[10px] font-semibold uppercase tracking-[0.2em] text-on-secondary-container">
              Super Admin
            </span>
          )}
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">User Management</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Monitor account health, KYC progression, and operational controls.
          </p>
        </div>

        {/* Filter pills */}
        <div className="flex gap-2">
          {(["all", "active", "frozen"] as const).map((key) => (
            <button
              key={key}
              onClick={() => setStatusFilter(key)}
              aria-pressed={statusFilter === key}
              className={`rounded-full px-4 py-2 text-xs font-medium capitalize transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
                statusFilter === key
                  ? "bg-secondary-container text-on-secondary-container"
                  : "bg-surface-container text-on-surface-variant hover:bg-surface-container-high"
              }`}
            >
              {key === "all" ? "All" : key.charAt(0).toUpperCase() + key.slice(1)}
            </button>
          ))}
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={visibleUsers}
        rowKey={(row) => row.id}
        emptyState="No users match the active filter."
      />
    </div>
  );
}

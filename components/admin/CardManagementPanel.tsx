"use client";

import { DataColumn, DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { AdminCard, AdminRole, maskCardId } from "@/services/api/adminDashboard";

type CardManagementPanelProps = {
  cards: AdminCard[];
  viewerRole: AdminRole;
  onToggleBlock: (card: AdminCard) => void;
};

export function CardManagementPanel({ cards, viewerRole, onToggleBlock }: CardManagementPanelProps) {
  const columns: DataColumn<AdminCard>[] = [
    {
      key: "card",
      header: "Card ID",
      render: (card) => (
        // Mono font for card numbers — on-surface-variant to avoid pure black
        <span className="font-mono tracking-[0.25em] text-on-surface-variant">
          {maskCardId(card.id)}
        </span>
      ),
    },
    {
      key: "user",
      header: "User",
      render: (card) => <span className="text-on-surface">{card.userName}</span>,
    },
    {
      key: "status",
      header: "Status",
      render: (card) => (
        <StatusBadge
          label={card.status}
          tone={
            card.status === "Active"  ? "success"
            : card.status === "Blocked" ? "danger"
            : "warning"
          }
        />
      ),
    },
    {
      key: "lastUsed",
      header: "Last Used",
      render: (card) => (
        <span className="text-on-surface-variant">
          {new Date(card.lastUsed).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (card) => (
        // Block = error container | Unblock = secondary-container
        <button
          onClick={() => onToggleBlock(card)}
          disabled={viewerRole !== "super_admin"}
          className={`rounded-sm px-3 py-2 text-xs font-medium transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            card.status === "Blocked"
              ? "bg-secondary-container text-on-secondary-container"
              : "bg-[#ffdad6] text-[#ba1a1a]"
          }`}
        >
          {card.status === "Blocked" ? "Unblock" : "Block"}
        </button>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-on-surface">Card Management</h2>
        <p className="mt-1 text-sm text-on-surface-variant">
          Mask card identifiers and control card lifecycle safely.
        </p>
      </div>
      <DataTable
        columns={columns}
        rows={cards}
        rowKey={(row) => row.id}
        emptyState="No cards available."
      />
    </div>
  );
}

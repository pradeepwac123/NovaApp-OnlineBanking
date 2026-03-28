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
      render: (card) => <span className="font-mono tracking-[0.25em] text-white">{maskCardId(card.id)}</span>
    },
    {
      key: "user",
      header: "User",
      render: (card) => <span>{card.userName}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (card) => (
        <StatusBadge label={card.status} tone={card.status === "Active" ? "success" : card.status === "Blocked" ? "danger" : "warning"} />
      )
    },
    {
      key: "lastUsed",
      header: "Last Used",
      render: (card) => <span className="text-[#8b8ba7]">{new Date(card.lastUsed).toLocaleString("en-IN")}</span>
    },
    {
      key: "actions",
      header: "Actions",
      render: (card) => (
        <button
          onClick={() => onToggleBlock(card)}
          disabled={viewerRole !== "super_admin"}
          className="rounded-xl border border-[#6C3CE1]/20 bg-[#6C3CE1]/10 px-3 py-2 text-xs text-[#c4b6ff] disabled:cursor-not-allowed disabled:opacity-40"
        >
          {card.status === "Blocked" ? "Unblock" : "Block"}
        </button>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div>
        <h2 className="text-2xl font-semibold text-white">Card Management</h2>
        <p className="mt-1 text-sm text-[#8b8ba7]">Mask card identifiers and control card lifecycle safely.</p>
      </div>
      <DataTable columns={columns} rows={cards} rowKey={(row) => row.id} emptyState="No cards available." />
    </div>
  );
}


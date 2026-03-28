"use client";

import { useMemo, useState } from "react";
import { DataColumn, DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Tabs } from "@/components/admin/Tabs";
import { AdminRole, AdminTransaction, TransactionStatus, formatCurrencyInr } from "@/services/api/adminDashboard";

type TransactionMonitoringPanelProps = {
  transactions: AdminTransaction[];
  viewerRole: AdminRole;
  onReverse: (transaction: AdminTransaction) => void;
  onFlag: (transaction: AdminTransaction) => void;
};

export function TransactionMonitoringPanel({
  transactions,
  viewerRole,
  onReverse,
  onFlag
}: TransactionMonitoringPanelProps) {
  const [dateFilter, setDateFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState<"All" | TransactionStatus>("All");

  const filtered = useMemo(() => {
    return transactions.filter((transaction) => {
      const sameDate = !dateFilter || transaction.createdAt.startsWith(dateFilter);
      const sameStatus = statusFilter === "All" || transaction.status === statusFilter;
      return sameDate && sameStatus;
    });
  }, [dateFilter, statusFilter, transactions]);

  const columns: DataColumn<AdminTransaction>[] = [
    {
      key: "txn",
      header: "Transaction",
      render: (transaction) => (
        <div>
          <p className="font-medium text-white">{transaction.id}</p>
          <p className="mt-1 text-xs text-[#8b8ba7]">{transaction.userName}</p>
        </div>
      )
    },
    {
      key: "amount",
      header: "Amount",
      render: (transaction) => <span className="font-semibold">{formatCurrencyInr(transaction.amount)}</span>
    },
    {
      key: "channel",
      header: "Channel",
      render: (transaction) => <span className="text-[#c8c8da]">{transaction.channel}</span>
    },
    {
      key: "status",
      header: "Status",
      render: (transaction) => (
        <StatusBadge
          label={transaction.status}
          tone={
            transaction.status === "Success"
              ? "success"
              : transaction.status === "Failed"
              ? "danger"
              : transaction.status === "Flagged"
              ? "warning"
              : "info"
          }
        />
      )
    },
    {
      key: "date",
      header: "Date",
      render: (transaction) => <span className="text-[#8b8ba7]">{new Date(transaction.createdAt).toLocaleString("en-IN")}</span>
    },
    {
      key: "actions",
      header: "Actions",
      render: (transaction) => (
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => onReverse(transaction)}
            disabled={viewerRole !== "super_admin"}
            className="rounded-xl border border-[#ff5d6c]/20 bg-[#ff5d6c]/10 px-3 py-2 text-xs text-[#ffb1b8] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Reverse transaction
          </button>
          <button
            onClick={() => onFlag(transaction)}
            disabled={transaction.status === "Flagged"}
            className="rounded-xl border border-[#f5b942]/20 bg-[#f5b942]/10 px-3 py-2 text-xs text-[#ffd88d] disabled:cursor-not-allowed disabled:opacity-40"
          >
            Flag suspicious
          </button>
        </div>
      )
    }
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-white">Transaction Monitoring</h2>
          <p className="mt-1 text-sm text-[#8b8ba7]">Filter live transactions and trigger supervised controls.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="rounded-2xl border border-white/10 bg-[#111122] px-4 py-2.5 text-sm text-white outline-none"
          />
          <Tabs
            items={[
              { key: "All", label: "All" },
              { key: "Success", label: "Success" },
              { key: "Failed", label: "Failed" },
              { key: "Pending", label: "Pending" },
              { key: "Flagged", label: "Flagged" }
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>
      <DataTable columns={columns} rows={filtered} rowKey={(row) => row.id} emptyState="No transactions found for the current filters." />
    </div>
  );
}


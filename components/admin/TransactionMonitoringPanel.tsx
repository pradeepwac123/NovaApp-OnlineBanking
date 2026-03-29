"use client";

import { useMemo, useState } from "react";
import { DataColumn, DataTable } from "@/components/admin/DataTable";
import { StatusBadge } from "@/components/admin/StatusBadge";
import { Tabs } from "@/components/admin/Tabs";
import {
  AdminRole,
  AdminTransaction,
  TransactionStatus,
  formatCurrencyInr,
} from "@/services/api/adminDashboard";

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
  onFlag,
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
          <p className="font-medium text-on-surface">{transaction.id}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{transaction.userName}</p>
        </div>
      ),
    },
    {
      key: "amount",
      header: "Amount",
      render: (transaction) => (
        <span className="font-semibold text-on-surface">{formatCurrencyInr(transaction.amount)}</span>
      ),
    },
    {
      key: "channel",
      header: "Channel",
      render: (transaction) => (
        <span className="text-on-surface-variant">{transaction.channel}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (transaction) => (
        <StatusBadge
          label={transaction.status}
          tone={
            transaction.status === "Success" ? "success"
            : transaction.status === "Failed"  ? "danger"
            : transaction.status === "Flagged" ? "warning"
            : "info"
          }
        />
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (transaction) => (
        <span className="text-on-surface-variant">
          {new Date(transaction.createdAt).toLocaleString("en-IN")}
        </span>
      ),
    },
    {
      key: "actions",
      header: "Actions",
      render: (transaction) => (
        <div className="flex flex-wrap gap-2">
          {/* Destructive action: error container */}
          <button
            onClick={() => onReverse(transaction)}
            disabled={viewerRole !== "super_admin"}
            className="rounded-sm bg-[#ffdad6] px-3 py-2 text-xs font-medium text-[#ba1a1a] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-error"
          >
            Reverse transaction
          </button>

          {/* Warning action: warning container */}
          <button
            onClick={() => onFlag(transaction)}
            disabled={transaction.status === "Flagged"}
            className="rounded-sm bg-[#ffefd5] px-3 py-2 text-xs font-medium text-[#7a5900] transition-opacity hover:opacity-80 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-[#7a5900]"
          >
            Flag suspicious
          </button>
        </div>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">Transaction Monitoring</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Filter live transactions and trigger supervised controls.
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-3">
          {/* Date input: surface-container-low trough, no border */}
          <input
            type="date"
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            aria-label="Filter by date"
            className="rounded-sm bg-surface-container-low px-4 py-2.5 text-sm text-on-surface outline-none focus:ring-2 focus:ring-primary"
          />
          <Tabs
            items={[
              { key: "All",     label: "All"     },
              { key: "Success", label: "Success" },
              { key: "Failed",  label: "Failed"  },
              { key: "Pending", label: "Pending" },
              { key: "Flagged", label: "Flagged" },
            ]}
            value={statusFilter}
            onChange={setStatusFilter}
          />
        </div>
      </div>

      <DataTable
        columns={columns}
        rows={filtered}
        rowKey={(row) => row.id}
        emptyState="No transactions found for the current filters."
      />
    </div>
  );
}

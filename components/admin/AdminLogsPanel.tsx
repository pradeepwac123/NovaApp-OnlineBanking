"use client";

import { useMemo, useState } from "react";
import { DataColumn, DataTable } from "@/components/admin/DataTable";
import { Tabs } from "@/components/admin/Tabs";
import { AdminLog } from "@/services/api/adminDashboard";

type AdminLogsPanelProps = {
  logs: AdminLog[];
};

export function AdminLogsPanel({ logs }: AdminLogsPanelProps) {
  const [tab, setTab] = useState<"all" | "login" | "action">("all");

  const rows = useMemo(() => {
    if (tab === "all") return logs;
    return logs.filter((log) => log.type === tab);
  }, [logs, tab]);

  const columns: DataColumn<AdminLog>[] = [
    {
      key: "actor",
      header: "Actor",
      render: (log) => (
        <div>
          <p className="font-medium text-on-surface">{log.actor}</p>
          <p className="mt-1 text-xs text-on-surface-variant">{log.role}</p>
        </div>
      ),
    },
    {
      key: "action",
      header: "Action",
      render: (log) => <span className="text-on-surface">{log.action}</span>,
    },
    {
      key: "ip",
      header: "IP Tracking",
      render: (log) => (
        <span className="font-mono text-on-surface-variant">{log.ip}</span>
      ),
    },
    {
      key: "status",
      header: "Status",
      render: (log) => (
        // Semantic inline status: success green or error red — no badge container needed here
        <span
          className={
            log.status === "Success"
              ? "font-medium text-success"
              : "font-medium text-error"
          }
        >
          {log.status}
        </span>
      ),
    },
    {
      key: "date",
      header: "Date",
      render: (log) => (
        <span className="text-on-surface-variant">
          {new Date(log.createdAt).toLocaleString("en-IN")}
        </span>
      ),
    },
  ];

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-2xl font-semibold text-on-surface">Admin Logs</h2>
          <p className="mt-1 text-sm text-on-surface-variant">
            Login history, action trails, and IP tracking for audit readiness.
          </p>
        </div>
        <Tabs
          items={[
            { key: "all",    label: "All Logs"       },
            { key: "login",  label: "Login History"  },
            { key: "action", label: "Admin Actions"  },
          ]}
          value={tab}
          onChange={setTab}
        />
      </div>
      <DataTable
        columns={columns}
        rows={rows}
        rowKey={(row) => row.id}
        emptyState="No audit logs found."
      />
    </div>
  );
}

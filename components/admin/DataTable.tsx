"use client";

import { ReactNode } from "react";

export type DataColumn<T> = {
  key: string;
  header: string;
  className?: string;
  render: (row: T) => ReactNode;
};

type DataTableProps<T> = {
  columns: DataColumn<T>[];
  rows: T[];
  rowKey: (row: T) => string;
  emptyState?: string;
};

export function DataTable<T>({ columns, rows, rowKey, emptyState = "No records found." }: DataTableProps<T>) {
  return (
    // Outer container uses surface-container-lowest — sits on bg-surface so no border needed
    <div className="overflow-hidden rounded-sm bg-surface-container-lowest">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          {/* Header: one step higher on the surface hierarchy to distinguish from data rows */}
          <thead className="bg-surface-container-low text-on-surface-variant">
            <tr>
              {columns.map((column) => (
                <th
                  key={column.key}
                  scope="col"
                  className={`px-4 py-3 text-left text-xs font-semibold uppercase tracking-[0.15em] ${column.className || ""}`}
                >
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row, index) => (
              // Alternating rows: even rows stay on surface-container-lowest (white),
              // odd rows step up to surface-container-low — no dividers needed
              <tr
                key={rowKey(row)}
                className={index % 2 === 0 ? "bg-surface-container-lowest" : "bg-surface-container-low"}
              >
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 align-top text-on-surface ${column.className || ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr className="bg-surface-container-lowest">
                <td colSpan={columns.length} className="px-4 py-12 text-center text-on-surface-variant">
                  {emptyState}
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

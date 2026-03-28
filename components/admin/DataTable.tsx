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
    <div className="overflow-hidden rounded-3xl border border-white/6 bg-[#10101c]">
      <div className="overflow-x-auto">
        <table className="min-w-full text-sm">
          <thead className="bg-white/[0.03] text-[#8f8fae]">
            <tr>
              {columns.map((column) => (
                <th key={column.key} className={`px-4 py-3 text-left font-medium ${column.className || ""}`}>
                  {column.header}
                </th>
              ))}
            </tr>
          </thead>
          <tbody>
            {rows.map((row) => (
              <tr key={rowKey(row)} className="border-t border-white/[0.05]">
                {columns.map((column) => (
                  <td key={column.key} className={`px-4 py-4 align-top text-white ${column.className || ""}`}>
                    {column.render(row)}
                  </td>
                ))}
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={columns.length} className="px-4 py-12 text-center text-[#737390]">
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


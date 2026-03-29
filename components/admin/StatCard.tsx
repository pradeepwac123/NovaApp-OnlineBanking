"use client";

type StatCardProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
  helper?: string;
};

export function StatCard({ label, value, tone = "default", helper }: StatCardProps) {
  const accentBar = {
    default: "bg-[#2372ff]",
    success: "bg-[#1fa16b]",
    warning: "bg-[#b7791f]",
    danger: "bg-[#e36a5d]",
  };

  const valueColor = {
    default: "text-slate-900",
    success: "text-[#1fa16b]",
    warning: "text-[#b7791f]",
    danger: "text-[#e36a5d]",
  };

  return (
    <div className="relative overflow-hidden rounded-[1.8rem] bg-white p-5 shadow-[0_20px_50px_rgba(18,38,63,0.05)]">
      <div className={`absolute left-0 top-0 h-full w-1.5 rounded-l-[1.8rem] ${accentBar[tone]}`} aria-hidden="true" />
      <p className="text-[11px] uppercase tracking-[0.28em] text-slate-400">{label}</p>
      <p className={`mt-4 text-3xl font-semibold tracking-tight ${valueColor[tone]}`}>{value}</p>
      {helper && <p className="mt-2 text-sm leading-6 text-slate-500">{helper}</p>}
    </div>
  );
}

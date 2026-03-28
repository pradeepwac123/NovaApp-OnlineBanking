"use client";

type StatCardProps = {
  label: string;
  value: string;
  tone?: "default" | "success" | "warning" | "danger";
  helper?: string;
};

export function StatCard({ label, value, tone = "default", helper }: StatCardProps) {
  const toneClasses = {
    default: "from-[#6C3CE1]/15 to-[#00D4AA]/10 border-[#6C3CE1]/20",
    success: "from-[#00D4AA]/15 to-transparent border-[#00D4AA]/20",
    warning: "from-[#f5b942]/12 to-transparent border-[#f5b942]/20",
    danger: "from-[#ff5d6c]/12 to-transparent border-[#ff5d6c]/20",
  };

  return (
    <div className={`rounded-3xl border bg-gradient-to-br ${toneClasses[tone]} p-5`}>
      <p className="text-[11px] uppercase tracking-[0.28em] text-[#8f8fae]">{label}</p>
      <p className="mt-4 text-3xl font-semibold tracking-tight text-white">{value}</p>
      {helper && <p className="mt-2 text-sm text-[#7b7b99]">{helper}</p>}
    </div>
  );
}


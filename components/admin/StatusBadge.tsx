"use client";

type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  const tones = {
    neutral: "bg-white/5 text-[#c1c1d8] border-white/10",
    success: "bg-[#00D4AA]/12 text-[#67f5d0] border-[#00D4AA]/20",
    warning: "bg-[#f5b942]/12 text-[#ffd27c] border-[#f5b942]/20",
    danger: "bg-[#ff5d6c]/12 text-[#ff9ca4] border-[#ff5d6c]/20",
    info: "bg-[#6C3CE1]/12 text-[#b59dff] border-[#6C3CE1]/20",
  };

  return <span className={`inline-flex rounded-full border px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>{label}</span>;
}


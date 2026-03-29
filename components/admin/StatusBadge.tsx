"use client";

type StatusBadgeProps = {
  label: string;
  tone?: "neutral" | "success" | "warning" | "danger" | "info";
};

export function StatusBadge({ label, tone = "neutral" }: StatusBadgeProps) {
  // Semantic container variants: uses surface-level tonal backgrounds instead of
  // dark overlays. Each tone maps to an M3-style container + on-container pair.
  const tones = {
    neutral:  "bg-surface-container text-on-surface-variant",
    success:  "bg-[#c8f5de] text-[#005229]",
    warning:  "bg-[#ffefd5] text-[#7a5900]",
    danger:   "bg-[#ffdad6] text-[#ba1a1a]",
    info:     "bg-secondary-container text-on-secondary-container",
  };

  return (
    <span className={`inline-flex rounded-full px-2.5 py-1 text-xs font-medium ${tones[tone]}`}>
      {label}
    </span>
  );
}

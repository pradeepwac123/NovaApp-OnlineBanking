"use client";

type TabsProps<T extends string> = {
  items: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ items, value, onChange }: TabsProps<T>) {
  return (
    // Pill container uses surface-container-low as its trough — no border needed
    <div className="inline-flex rounded-full bg-surface-container-low p-1 gap-1">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          // Active: secondary-container fill with on-secondary-container text
          // Inactive: transparent with on-surface-variant text
          className={`rounded-full px-4 py-1.5 text-sm font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary ${
            value === item.key
              ? "bg-secondary-container text-on-secondary-container"
              : "text-on-surface-variant hover:bg-surface-container"
          }`}
          aria-pressed={value === item.key}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}

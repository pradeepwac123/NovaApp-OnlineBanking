"use client";

type TabsProps<T extends string> = {
  items: { key: T; label: string }[];
  value: T;
  onChange: (value: T) => void;
};

export function Tabs<T extends string>({ items, value, onChange }: TabsProps<T>) {
  return (
    <div className="inline-flex rounded-2xl border border-white/8 bg-[#111122] p-1">
      {items.map((item) => (
        <button
          key={item.key}
          onClick={() => onChange(item.key)}
          className={`rounded-xl px-4 py-2 text-sm transition ${
            value === item.key
              ? "bg-gradient-to-r from-[#6C3CE1] to-[#00D4AA] text-white"
              : "text-[#8b8ba7] hover:text-white"
          }`}
        >
          {item.label}
        </button>
      ))}
    </div>
  );
}


export interface TabItem {
  key: string;
  label: string;
}

export interface TabsProps {
  items: TabItem[];
  active: string;
  onChange: (key: string) => void;
}

export function Tabs({ items, active, onChange }: TabsProps) {
  return (
    <div className="flex gap-1 overflow-x-auto border-b border-slate-200">
      {items.map((item) => {
        const isActive = item.key === active;
        return (
          <button
            key={item.key}
            onClick={() => onChange(item.key)}
            className={`whitespace-nowrap border-b-2 px-4 py-2 text-sm font-medium transition-colors ${
              isActive
                ? "border-brand-600 text-brand-700"
                : "border-transparent text-slate-500 hover:text-slate-700"
            }`}
          >
            {item.label}
          </button>
        );
      })}
    </div>
  );
}

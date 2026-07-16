import { LucideIcon } from "lucide-react";

type Tone = "brand" | "green" | "amber" | "red" | "slate";

const TONE_CLASSES: Record<Tone, string> = {
  brand: "bg-brand-50 text-brand-700",
  green: "bg-green-50 text-green-700",
  amber: "bg-amber-50 text-amber-700",
  red: "bg-red-50 text-red-700",
  slate: "bg-slate-100 text-slate-600",
};

export interface StatCardProps {
  label: string;
  value: string | number;
  subLabel?: string;
  icon?: LucideIcon;
  tone?: Tone;
}

export function StatCard({ label, value, subLabel, icon: Icon, tone = "brand" }: StatCardProps) {
  return (
    <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-medium uppercase tracking-wide text-slate-500">{label}</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{value}</p>
          {subLabel && <p className="mt-1 text-xs text-slate-500">{subLabel}</p>}
        </div>
        {Icon && (
          <div className={`rounded-lg p-2 ${TONE_CLASSES[tone]}`}>
            <Icon className="h-5 w-5" />
          </div>
        )}
      </div>
    </div>
  );
}

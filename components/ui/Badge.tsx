type Tone = "green" | "amber" | "red" | "blue" | "slate" | "purple";

const TONE_CLASSES: Record<Tone, string> = {
  green: "bg-green-100 text-green-800",
  amber: "bg-amber-100 text-amber-800",
  red: "bg-red-100 text-red-800",
  blue: "bg-blue-100 text-blue-800",
  purple: "bg-purple-100 text-purple-800",
  slate: "bg-slate-100 text-slate-600",
};

// Covers every status string used across the app; anything unlisted falls back to slate.
const STATUS_TONES: Record<string, Tone> = {
  ACTIVE: "green",
  ON_LEAVE: "amber",
  RESIGNED: "slate",
  TERMINATED: "red",
  SUSPENDED: "red",
  PENDING: "amber",
  APPROVED: "green",
  REJECTED: "red",
  CANCELLED: "slate",
  NOT_STARTED: "slate",
  SELF_SUBMITTED: "amber",
  COMPLETED: "green",
  DRAFT: "slate",
  FINALIZED: "blue",
  PAID: "green",
  OPEN: "blue",
  CLOSED: "slate",
  TRIALING: "blue",
  PAST_DUE: "amber",
  CANCELED: "red",
  READY_NOW: "green",
  READY_1_2_YEARS: "amber",
  READY_3_5_YEARS: "slate",
  LOW: "slate",
  MEDIUM: "amber",
  HIGH: "red",
};

export interface BadgeProps {
  status: string;
  tone?: Tone;
  className?: string;
}

export function Badge({ status, tone, className = "" }: BadgeProps) {
  const resolvedTone = tone ?? STATUS_TONES[status] ?? "slate";
  return (
    <span
      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${TONE_CLASSES[resolvedTone]} ${className}`}
    >
      {status.replace(/_/g, " ")}
    </span>
  );
}

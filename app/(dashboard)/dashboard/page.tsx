"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Banknote, CalendarClock, Users } from "lucide-react";
import type { PayrollRunDto } from "@hrm/shared";
import { PageHeader, StatCard } from "@/components/ui";
import { api } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardOverviewPage() {
  const { session } = useAuth();
  const [headcount, setHeadcount] = useState<number | null>(null);
  const [pendingApprovals, setPendingApprovals] = useState<number | null>(null);
  const [latestRun, setLatestRun] = useState<PayrollRunDto | null | undefined>(undefined);

  const isHrOrOwner = session?.user.role === "OWNER" || session?.user.role === "HR_ADMIN";

  useEffect(() => {
    if (!session) return;
    api.employees
      .list(session.accessToken)
      .then((list) => setHeadcount(list.length))
      .catch(() => undefined);
    api.leaveRequests
      .pendingApprovals(session.accessToken)
      .then((list) => setPendingApprovals(list.length))
      .catch(() => undefined);
    if (isHrOrOwner) {
      api.payroll
        .listRuns(session.accessToken)
        .then((runs) => setLatestRun(runs[0] ?? null))
        .catch(() => undefined);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  return (
    <div>
      <PageHeader title={`Welcome${session ? `, ${session.user.name}` : ""}`} />

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <StatCard label="Employees" value={headcount ?? "—"} icon={Users} />
        <StatCard
          label="Pending leave approvals"
          value={pendingApprovals ?? "—"}
          subLabel="Awaiting your response"
          icon={CalendarClock}
          tone={pendingApprovals ? "amber" : "green"}
        />
        {isHrOrOwner && (
          <StatCard
            label="Latest payroll run"
            value={latestRun ? `${MONTH_NAMES[latestRun.periodMonth - 1]} ${latestRun.periodYear}` : latestRun === null ? "None yet" : "—"}
            subLabel={latestRun ? latestRun.status : undefined}
            icon={Banknote}
          />
        )}
      </div>

      <p className="mt-6 text-sm text-slate-500">
        Use the sidebar to manage employees, attendance & leave, payroll, performance, training,
        surveys, and succession planning.{" "}
        <Link href="/dashboard/employees" className="text-brand-700 underline">
          Go to Employees
        </Link>
      </p>
    </div>
  );
}

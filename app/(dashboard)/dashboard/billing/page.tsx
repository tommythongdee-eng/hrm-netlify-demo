"use client";

import { useEffect, useState } from "react";
import type { BillingSummaryDto, PlanDto } from "@hrm/shared";
import { Badge, Card, PageHeader, Table, Tbody, Td, Th, Thead } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

export default function BillingPage() {
  const session = useRequireAuth();
  const [summary, setSummary] = useState<BillingSummaryDto | null>(null);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  const isOwner = session?.user.role === "OWNER";

  useEffect(() => {
    if (!session || !isOwner) return;
    Promise.all([api.billing.getSummary(session.accessToken), api.billing.listPlans(session.accessToken)])
      .then(([s, p]) => {
        setSummary(s);
        setPlans(p);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load billing info"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) return null;

  if (!isOwner) {
    return (
      <div>
        <PageHeader title="Billing" />
        <p className="text-sm text-slate-500">Only the organization Owner can view billing details.</p>
      </div>
    );
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!summary) return <p className="text-sm text-slate-500">Loading...</p>;

  const usagePercent = summary.plan ? Math.min(100, (summary.employeeCount / summary.plan.maxEmployees) * 100) : 0;

  return (
    <div className="max-w-2xl">
      <PageHeader
        title="Billing"
        description="There's no self-serve upgrade yet — plan changes go through the platform operator."
      />

      <Card className="mb-6" title="Current plan">
        {summary.plan ? (
          <>
            <p className="text-lg font-semibold text-slate-900">
              {summary.plan.name} — {summary.plan.priceThbPerMonth.toLocaleString()} THB/month
            </p>
            <p className="mb-3 text-sm text-slate-500">
              Subscription status: <Badge status={summary.subscriptionStatus} />
            </p>
            <div>
              <div className="flex justify-between text-xs text-slate-500">
                <span>
                  {summary.employeeCount} / {summary.plan.maxEmployees.toLocaleString()} employees
                </span>
                <span>{usagePercent.toFixed(0)}%</span>
              </div>
              <div className="mt-1 h-2 w-full rounded-full bg-slate-100">
                <div
                  className={`h-2 rounded-full ${usagePercent >= 100 ? "bg-red-500" : "bg-brand-600"}`}
                  style={{ width: `${usagePercent}%` }}
                />
              </div>
            </div>
          </>
        ) : (
          <p className="text-sm text-slate-500">No plan assigned yet.</p>
        )}
      </Card>

      <div>
        <h2 className="mb-2 font-semibold text-slate-900">Available plans</h2>
        <Table>
          <Thead>
            <tr>
              <Th>Plan</Th>
              <Th>Max employees</Th>
              <Th>Price / month</Th>
            </tr>
          </Thead>
          <Tbody>
            {plans.map((p) => (
              <tr key={p.id} className={p.id === summary.plan?.id ? "bg-brand-50 font-medium" : ""}>
                <Td>{p.name}</Td>
                <Td>{p.maxEmployees.toLocaleString()}</Td>
                <Td>{p.priceThbPerMonth.toLocaleString()} THB</Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}

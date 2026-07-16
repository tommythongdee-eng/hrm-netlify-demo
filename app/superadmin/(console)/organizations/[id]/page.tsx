"use client";

import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OrganizationDetailDto, PlanDto } from "@hrm/shared";
import { Badge, Button, Card } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireSuperAdminAuth } from "@/lib/superadmin-auth-context";

export default function OrganizationDetailPage() {
  const session = useRequireSuperAdminAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [organization, setOrganization] = useState<OrganizationDetailDto | null>(null);
  const [plans, setPlans] = useState<PlanDto[]>([]);
  const [selectedPlanId, setSelectedPlanId] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function refresh() {
    if (!session) return;
    const [org, planList] = await Promise.all([
      api.superadmin.getOrganization(session.accessToken, params.id),
      api.superadmin.listPlans(session.accessToken),
    ]);
    setOrganization(org);
    setPlans(planList);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load organization"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, params.id]);

  if (!session || !organization) {
    return error ? <p className="text-sm text-red-600">{error}</p> : <p className="text-sm text-slate-500">Loading...</p>;
  }

  async function handleSuspend() {
    setIsBusy(true);
    try {
      await api.superadmin.suspendOrganization(session!.accessToken, organization!.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to suspend");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleReactivate() {
    setIsBusy(true);
    try {
      await api.superadmin.reactivateOrganization(session!.accessToken, organization!.id);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to reactivate");
    } finally {
      setIsBusy(false);
    }
  }

  async function handleAssignPlan(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedPlanId) return;
    setIsBusy(true);
    try {
      await api.superadmin.assignPlan(session!.accessToken, organization!.id, { planId: selectedPlanId });
      setSelectedPlanId("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to assign plan");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">{organization.name}</h1>
          <p className="text-sm text-slate-500">{organization.slug}</p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/superadmin/organizations")}>
          Back to list
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <Card className="mt-6" title="Status">
        <dl className="grid grid-cols-2 gap-3 text-sm">
          <div>
            <dt className="text-xs uppercase text-slate-500">Status</dt>
            <dd>
              <Badge status={organization.status} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Subscription</dt>
            <dd>
              <Badge status={organization.subscriptionStatus} />
            </dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Plan</dt>
            <dd className="text-slate-900">{organization.planName ?? "—"}</dd>
          </div>
          <div>
            <dt className="text-xs uppercase text-slate-500">Employees</dt>
            <dd className="text-slate-900">{organization.employeeCount}</dd>
          </div>
        </dl>
        <div className="mt-4">
          {organization.status === "SUSPENDED" ? (
            <Button onClick={handleReactivate} disabled={isBusy}>
              Reactivate
            </Button>
          ) : (
            <Button variant="danger" onClick={handleSuspend} disabled={isBusy}>
              Suspend
            </Button>
          )}
        </div>
      </Card>

      <Card className="mt-6" title="Assign plan">
        <form className="flex items-end gap-3" onSubmit={handleAssignPlan}>
          <label className="flex flex-col gap-1 text-sm">
            Plan
            <select className="input" value={selectedPlanId} onChange={(e) => setSelectedPlanId(e.target.value)}>
              <option value="">Select...</option>
              {plans.map((p) => (
                <option key={p.id} value={p.id}>
                  {p.name} ({p.maxEmployees.toLocaleString()} employees, {p.priceThbPerMonth} THB/mo)
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={isBusy || !selectedPlanId}>
            Assign
          </Button>
        </form>
      </Card>

      <Card className="mt-6" title="Members">
        <ul className="divide-y divide-slate-100">
          {organization.memberships.map((m) => (
            <li key={m.userId} className="flex items-center justify-between py-2 text-sm">
              <span>
                {m.userName} ({m.userEmail})
              </span>
              <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs">{m.role}</span>
            </li>
          ))}
        </ul>
      </Card>
    </div>
  );
}

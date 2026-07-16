"use client";

import { Fragment, useEffect, useState } from "react";
import { PositionCriticality, ReadinessLevel, RatingLevel } from "@hrm/shared";
import type { EmployeeSummary, KeyPositionDto, NineBoxGridDto } from "@hrm/shared";
import { Button, Card, PageHeader, Tabs } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

const RATING_LEVELS = Object.values(RatingLevel);
const READINESS_LEVELS = Object.values(ReadinessLevel);
const CRITICALITY_LEVELS = Object.values(PositionCriticality);
// Potential increases upward, performance increases rightward — standard 9-box layout.
const POTENTIAL_ROWS = [RatingLevel.HIGH, RatingLevel.MEDIUM, RatingLevel.LOW];
const PERFORMANCE_COLS = [RatingLevel.LOW, RatingLevel.MEDIUM, RatingLevel.HIGH];

const TABS = ["9-Box Grid", "Key Positions"] as const;

export default function SuccessionPage() {
  const session = useRequireAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("9-Box Grid");

  if (!session) return null;
  const isHrOrOwner = session.user.role === "OWNER" || session.user.role === "HR_ADMIN";

  if (!isHrOrOwner) {
    return (
      <div>
        <PageHeader title="Succession Planning" />
        <p className="text-sm text-slate-500">
          This page is restricted to HR and Owner accounts — 9-box assessments and succession
          candidates are confidential HR material.
        </p>
      </div>
    );
  }

  return (
    <div>
      <PageHeader title="Succession Planning" />
      <Tabs items={TABS.map((t) => ({ key: t, label: t }))} active={tab} onChange={(k) => setTab(k as (typeof TABS)[number])} />

      <div className="mt-6">
        {tab === "9-Box Grid" && <NineBoxTab accessToken={session.accessToken} />}
        {tab === "Key Positions" && <KeyPositionsTab accessToken={session.accessToken} />}
      </div>
    </div>
  );
}

function NineBoxTab({ accessToken }: { accessToken: string }) {
  const [grid, setGrid] = useState<NineBoxGridDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [employeeId, setEmployeeId] = useState("");
  const [performanceRating, setPerformanceRating] = useState<string>(RatingLevel.MEDIUM);
  const [potentialRating, setPotentialRating] = useState<string>(RatingLevel.MEDIUM);
  const [notes, setNotes] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    try {
      setGrid(await api.succession.getGrid(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load grid");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return;
    setError(null);
    setIsSubmitting(true);
    try {
      await api.succession.upsertAssessment(accessToken, employeeId, {
        performanceRating: performanceRating as (typeof RATING_LEVELS)[number],
        potentialRating: potentialRating as (typeof RATING_LEVELS)[number],
        notes: notes || undefined,
      });
      setNotes("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save assessment");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!grid) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div>
      <div className="grid grid-cols-[auto_1fr_1fr_1fr] gap-1">
        <div />
        {PERFORMANCE_COLS.map((p) => (
          <div key={p} className="text-center text-xs font-medium uppercase text-slate-500">
            Performance: {p}
          </div>
        ))}
        {POTENTIAL_ROWS.map((potential) => (
          <Fragment key={potential}>
            <div className="flex items-center text-xs font-medium uppercase text-slate-500">
              Potential: {potential}
            </div>
            {PERFORMANCE_COLS.map((performance) => {
              const cell = grid.cells.find(
                (c) => c.potentialRating === potential && c.performanceRating === performance,
              );
              return (
                <div
                  key={`${potential}-${performance}`}
                  className="min-h-[80px] rounded-xl border border-slate-200 bg-white p-2"
                >
                  {cell?.employees.length ? (
                    <ul className="space-y-1 text-xs">
                      {cell.employees.map((e) => (
                        <li key={e.employeeId}>{e.employeeName}</li>
                      ))}
                    </ul>
                  ) : (
                    <span className="text-xs text-slate-300">—</span>
                  )}
                </div>
              );
            })}
          </Fragment>
        ))}
      </div>

      {grid.unassessedEmployees.length > 0 && (
        <p className="mt-3 text-xs text-slate-500">
          Not yet assessed: {grid.unassessedEmployees.map((e) => e.employeeName).join(", ")}
        </p>
      )}

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">Assess / reassess an employee</h2>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            Employee
            <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              <option value="">Select...</option>
              {[...grid.unassessedEmployees, ...grid.cells.flatMap((c) => c.employees)].map((e) => (
                <option key={e.employeeId} value={e.employeeId}>
                  {e.employeeName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Performance
            <select className="input" value={performanceRating} onChange={(e) => setPerformanceRating(e.target.value)}>
              {RATING_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Potential
            <select className="input" value={potentialRating} onChange={(e) => setPotentialRating(e.target.value)}>
              {RATING_LEVELS.map((r) => (
                <option key={r} value={r}>
                  {r}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Notes (optional)
            <input className="input" value={notes} onChange={(e) => setNotes(e.target.value)} />
          </label>
          <Button type="submit" disabled={isSubmitting || !employeeId}>
            {isSubmitting ? "Saving..." : "Save assessment"}
          </Button>
        </form>
      </Card>
    </div>
  );
}

function KeyPositionsTab({ accessToken }: { accessToken: string }) {
  const [positions, setPositions] = useState<KeyPositionDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [title, setTitle] = useState("");
  const [criticality, setCriticality] = useState<string>("");
  const [currentHolderId, setCurrentHolderId] = useState("");
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      const [p, e] = await Promise.all([
        api.succession.listKeyPositions(accessToken),
        api.employees.list(accessToken),
      ]);
      setPositions(p);
      setEmployees(e);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load key positions");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.succession.createKeyPosition(accessToken, {
        title,
        criticality: criticality ? (criticality as (typeof CRITICALITY_LEVELS)[number]) : undefined,
        currentHolderId: currentHolderId || undefined,
      });
      setTitle("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create key position");
    }
  }

  async function handleRemove(id: string) {
    await api.succession.removeKeyPosition(accessToken, id);
    await refresh();
  }

  return (
    <div>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleCreate}>
          <label className="flex flex-col gap-1 text-sm">
            Position title
            <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Criticality (optional)
            <select className="input" value={criticality} onChange={(e) => setCriticality(e.target.value)}>
              <option value="">—</option>
              {CRITICALITY_LEVELS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Current holder (optional)
            <select className="input" value={currentHolderId} onChange={(e) => setCurrentHolderId(e.target.value)}>
              <option value="">—</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={!title}>
            Add key position
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <div className="mt-6 space-y-4">
        {positions.map((p) => (
          <KeyPositionCard
            key={p.id}
            accessToken={accessToken}
            position={p}
            employees={employees}
            onChanged={refresh}
            onRemove={() => handleRemove(p.id)}
          />
        ))}
      </div>
    </div>
  );
}

function KeyPositionCard({
  accessToken,
  position,
  employees,
  onChanged,
  onRemove,
}: {
  accessToken: string;
  position: KeyPositionDto;
  employees: EmployeeSummary[];
  onChanged: () => void;
  onRemove: () => void;
}) {
  const [employeeId, setEmployeeId] = useState("");
  const [readiness, setReadiness] = useState<string>(ReadinessLevel.READY_1_2_YEARS);

  async function handleAddCandidate(e: React.FormEvent) {
    e.preventDefault();
    if (!employeeId) return;
    await api.succession.addCandidate(accessToken, position.id, {
      employeeId,
      readiness: readiness as (typeof READINESS_LEVELS)[number],
    });
    setEmployeeId("");
    onChanged();
  }

  async function handleRemoveCandidate(candidateId: string) {
    await api.succession.removeCandidate(accessToken, position.id, candidateId);
    onChanged();
  }

  return (
    <Card>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-medium">{position.title}</p>
          <p className="text-xs text-slate-500">
            {position.criticality ? `${position.criticality} criticality · ` : ""}
            Held by: {position.currentHolderName ?? "Vacant"}
          </p>
        </div>
        <button onClick={onRemove} className="text-sm text-red-600 underline">
          Delete position
        </button>
      </div>

      <ul className="mt-3 divide-y divide-slate-100">
        {position.candidates.map((c) => (
          <li key={c.id} className="flex items-center justify-between py-1 text-sm">
            <span>
              {c.employeeName} — {c.readiness.replace(/_/g, " ")}
            </span>
            <button onClick={() => handleRemoveCandidate(c.id)} className="text-xs text-red-600 underline">
              Remove
            </button>
          </li>
        ))}
      </ul>

      <form className="mt-3 flex flex-wrap items-end gap-3" onSubmit={handleAddCandidate}>
        <label className="flex flex-col gap-1 text-xs">
          Candidate
          <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
            <option value="">Select...</option>
            {employees.map((emp) => (
              <option key={emp.id} value={emp.id}>
                {emp.firstName} {emp.lastName}
              </option>
            ))}
          </select>
        </label>
        <label className="flex flex-col gap-1 text-xs">
          Readiness
          <select className="input" value={readiness} onChange={(e) => setReadiness(e.target.value)}>
            {READINESS_LEVELS.map((r) => (
              <option key={r} value={r}>
                {r.replace(/_/g, " ")}
              </option>
            ))}
          </select>
        </label>
        <Button type="submit" variant="secondary" className="px-3 py-2 text-xs" disabled={!employeeId}>
          Add candidate
        </Button>
      </form>
    </Card>
  );
}

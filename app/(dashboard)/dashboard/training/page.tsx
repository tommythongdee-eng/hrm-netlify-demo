"use client";

import { useEffect, useState } from "react";
import { TrainingCategory } from "@hrm/shared";
import type { EmployeeSummary, TrainingRecordDto } from "@hrm/shared";
import { Button, Card, PageHeader, Table, Tabs, Tbody, Td, Th, Thead } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

const CATEGORIES = Object.values(TrainingCategory);
const TABS = ["My Training", "All Training"] as const;

export default function TrainingPage() {
  const session = useRequireAuth();
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Training");

  if (!session) return null;

  return (
    <div>
      <PageHeader title="Training & Development" />
      <Tabs items={TABS.map((t) => ({ key: t, label: t }))} active={tab} onChange={(k) => setTab(k as (typeof TABS)[number])} />

      <div className="mt-6">
        {tab === "My Training" && <MyTrainingTab accessToken={session.accessToken} />}
        {tab === "All Training" && <AllTrainingTab accessToken={session.accessToken} />}
      </div>
    </div>
  );
}

function RecordsTable({ records }: { records: TrainingRecordDto[] }) {
  if (records.length === 0) return <p className="mt-4 text-sm text-slate-500">No training records yet.</p>;
  return (
    <div className="mt-4">
      <Table>
        <Thead>
          <tr>
            <Th>Employee</Th>
            <Th>Title</Th>
            <Th>Category</Th>
            <Th>Completed</Th>
            <Th>Hours</Th>
          </tr>
        </Thead>
        <Tbody>
          {records.map((r) => (
            <tr key={r.id}>
              <Td>{r.employeeName}</Td>
              <Td>
                {r.title}
                {r.provider ? <span className="text-xs text-slate-500"> · {r.provider}</span> : null}
              </Td>
              <Td>{r.category}</Td>
              <Td>{r.completionDate.slice(0, 10)}</Td>
              <Td>{r.hours ?? "—"}</Td>
            </tr>
          ))}
        </Tbody>
      </Table>
    </div>
  );
}

function MyTrainingTab({ accessToken }: { accessToken: string }) {
  const [records, setRecords] = useState<TrainingRecordDto[]>([]);
  const [title, setTitle] = useState("");
  const [provider, setProvider] = useState("");
  const [category, setCategory] = useState<string>(TrainingCategory.INTERNAL);
  const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [hours, setHours] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    try {
      setRecords(await api.training.my(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load training records");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.training.logMine(accessToken, {
        title,
        provider: provider || undefined,
        category: category as (typeof CATEGORIES)[number],
        completionDate,
        hours: hours ? Number(hours) : undefined,
      });
      setTitle("");
      setProvider("");
      setHours("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to log training");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Provider (optional)
            <input className="input" value={provider} onChange={(e) => setProvider(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Category
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Completion date
            <input
              type="date"
              className="input"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Hours (optional)
            <input type="number" min={0} className="input" value={hours} onChange={(e) => setHours(e.target.value)} />
          </label>
          <Button type="submit" disabled={isSubmitting || !title}>
            {isSubmitting ? "Saving..." : "Log training"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <RecordsTable records={records} />
    </div>
  );
}

function AllTrainingTab({ accessToken }: { accessToken: string }) {
  const [records, setRecords] = useState<TrainingRecordDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [title, setTitle] = useState("");
  const [category, setCategory] = useState<string>(TrainingCategory.INTERNAL);
  const [completionDate, setCompletionDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    try {
      const [r, e] = await Promise.all([api.training.all(accessToken), api.employees.list(accessToken)]);
      setRecords(r);
      setEmployees(e);
      if (!employeeId && e.length > 0) setEmployeeId(e[0].id);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load training records");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.training.logForEmployee(accessToken, {
        employeeId,
        title,
        category: category as (typeof CATEGORIES)[number],
        completionDate,
      });
      setTitle("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to log training");
    } finally {
      setIsSubmitting(false);
    }
  }

  if (error && employees.length === 0) return <p className="text-sm text-red-600">{error}</p>;

  return (
    <div>
      <p className="mb-3 text-sm text-slate-500">
        HR/Owner can log or view training for anyone; a manager sees this scoped to their own reports.
      </p>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            Employee
            <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Category
            <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Completion date
            <input
              type="date"
              className="input"
              value={completionDate}
              onChange={(e) => setCompletionDate(e.target.value)}
            />
          </label>
          <Button type="submit" disabled={isSubmitting || !employeeId || !title}>
            {isSubmitting ? "Saving..." : "Log training"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <RecordsTable records={records} />
    </div>
  );
}

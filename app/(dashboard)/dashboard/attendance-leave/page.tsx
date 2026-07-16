"use client";

import { useEffect, useState } from "react";
import type {
  AttendanceRecordDto,
  EmployeeSummary,
  LeaveBalanceDto,
  LeaveRequestDto,
  LeaveTypeDto,
} from "@hrm/shared";
import { Badge, Button, Card, FormField, PageHeader, StatCard, Table, Tabs, Tbody, Td, Th, Thead } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

const TABS = ["My Attendance", "My Leave", "Approvals", "All Attendance"] as const;
type Tab = (typeof TABS)[number];

export default function AttendanceLeavePage() {
  const session = useRequireAuth();
  const [tab, setTab] = useState<Tab>("My Attendance");

  if (!session) return null;
  const isHrOrOwner = session.user.role === "OWNER" || session.user.role === "HR_ADMIN";
  const visibleTabs = TABS.filter((t) => t !== "All Attendance" || isHrOrOwner);

  return (
    <div>
      <PageHeader title="Attendance & Leave" />
      <Tabs items={visibleTabs.map((t) => ({ key: t, label: t }))} active={tab} onChange={(k) => setTab(k as Tab)} />

      <div className="mt-6">
        {tab === "My Attendance" && <MyAttendanceTab accessToken={session.accessToken} />}
        {tab === "My Leave" && <MyLeaveTab accessToken={session.accessToken} />}
        {tab === "Approvals" && <ApprovalsTab accessToken={session.accessToken} />}
        {tab === "All Attendance" && isHrOrOwner && <AllAttendanceTab accessToken={session.accessToken} />}
      </div>
    </div>
  );
}

function MyAttendanceTab({ accessToken }: { accessToken: string }) {
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isBusy, setIsBusy] = useState(false);

  async function refresh() {
    try {
      setRecords(await api.attendance.my(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load attendance");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const today = new Date().toISOString().slice(0, 10);
  const todayRecord = records.find((r) => r.date.slice(0, 10) === today);

  async function handleClock(action: "in" | "out") {
    setError(null);
    setIsBusy(true);
    try {
      if (action === "in") await api.attendance.clockIn(accessToken);
      else await api.attendance.clockOut(accessToken);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Action failed");
    } finally {
      setIsBusy(false);
    }
  }

  return (
    <div>
      <Card>
        <p className="text-sm text-slate-600">
          {todayRecord?.clockIn ? `Clocked in at ${formatTime(todayRecord.clockIn)}` : "Not clocked in yet today"}
          {todayRecord?.clockOut ? ` · Clocked out at ${formatTime(todayRecord.clockOut)}` : ""}
        </p>
        <div className="mt-3 flex gap-3">
          <Button disabled={isBusy || Boolean(todayRecord?.clockIn)} onClick={() => handleClock("in")}>
            Clock in
          </Button>
          <Button
            variant="secondary"
            disabled={isBusy || !todayRecord?.clockIn || Boolean(todayRecord?.clockOut)}
            onClick={() => handleClock("out")}
          >
            Clock out
          </Button>
        </div>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">History</h2>
      <RecordsTable records={records} />
    </div>
  );
}

function RecordsTable({ records, showEmployee = false }: { records: AttendanceRecordDto[]; showEmployee?: boolean }) {
  if (records.length === 0) return <p className="text-sm text-slate-500">No records yet.</p>;
  return (
    <Table>
      <Thead>
        <tr>
          {showEmployee && <Th>Employee</Th>}
          <Th>Date</Th>
          <Th>Clock in</Th>
          <Th>Clock out</Th>
          <Th>Source</Th>
        </tr>
      </Thead>
      <Tbody>
        {records.map((r) => (
          <tr key={r.id}>
            {showEmployee && <Td>{r.employeeName}</Td>}
            <Td>{r.date.slice(0, 10)}</Td>
            <Td>{r.clockIn ? formatTime(r.clockIn) : "—"}</Td>
            <Td>{r.clockOut ? formatTime(r.clockOut) : "—"}</Td>
            <Td>{r.source}</Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}

function formatTime(iso: string): string {
  return new Date(iso).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" });
}

function MyLeaveTab({ accessToken }: { accessToken: string }) {
  const [balances, setBalances] = useState<LeaveBalanceDto[]>([]);
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [leaveTypes, setLeaveTypes] = useState<LeaveTypeDto[]>([]);
  const [leaveTypeId, setLeaveTypeId] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [reason, setReason] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    const [b, r, t] = await Promise.all([
      api.leaveRequests.myBalances(accessToken),
      api.leaveRequests.myRequests(accessToken),
      api.leaveTypes.list(accessToken),
    ]);
    setBalances(b);
    setRequests(r);
    setLeaveTypes(t);
    if (!leaveTypeId && t.length > 0) setLeaveTypeId(t[0].id);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load leave data"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.leaveRequests.create(accessToken, { leaveTypeId, startDate, endDate, reason: reason || undefined });
      setReason("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit leave request");
    } finally {
      setIsSubmitting(false);
    }
  }

  async function handleCancel(id: string) {
    await api.leaveRequests.cancel(accessToken, id);
    await refresh();
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold text-slate-900">Balances ({new Date().getFullYear()})</h2>
      <div className="grid grid-cols-2 gap-3 sm:grid-cols-4">
        {balances.map((b) => (
          <StatCard key={b.leaveTypeId} label={b.leaveTypeName} value={b.remainingDays} subLabel={`of ${b.allocatedDays} days`} />
        ))}
      </div>

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">Request leave</h2>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
          <FormField label="Leave type">
            <select className="input" value={leaveTypeId} onChange={(e) => setLeaveTypeId(e.target.value)}>
              {leaveTypes.map((t) => (
                <option key={t.id} value={t.id}>
                  {t.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Start date">
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </FormField>
          <FormField label="End date">
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </FormField>
          <FormField label="Reason (optional)">
            <input className="input" value={reason} onChange={(e) => setReason(e.target.value)} />
          </FormField>
          <Button type="submit" disabled={isSubmitting || !leaveTypeId}>
            {isSubmitting ? "Submitting..." : "Submit request"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">My requests</h2>
      {requests.length === 0 ? (
        <p className="text-sm text-slate-500">No requests yet.</p>
      ) : (
        <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
          {requests.map((r) => (
            <li key={r.id} className="flex items-center justify-between px-4 py-2 text-sm">
              <div>
                <p className="font-medium">
                  {r.leaveTypeName}: {r.startDate.slice(0, 10)} → {r.endDate.slice(0, 10)} ({r.daysCount}d)
                </p>
                <p className="text-xs text-slate-500">{r.reason ?? "No reason given"}</p>
              </div>
              <div className="flex items-center gap-3">
                <Badge status={r.status} />
                {r.status === "PENDING" && (
                  <button onClick={() => handleCancel(r.id)} className="text-xs text-red-600 underline">
                    Cancel
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function ApprovalsTab({ accessToken }: { accessToken: string }) {
  const [requests, setRequests] = useState<LeaveRequestDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setRequests(await api.leaveRequests.pendingApprovals(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load approvals");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function respond(id: string, decision: "APPROVED" | "REJECTED") {
    await api.leaveRequests.respond(accessToken, id, decision);
    await refresh();
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (requests.length === 0) return <p className="text-sm text-slate-500">No pending requests to approve.</p>;

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {requests.map((r) => (
        <li key={r.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium">
              {r.employeeName} — {r.leaveTypeName}: {r.startDate.slice(0, 10)} → {r.endDate.slice(0, 10)} (
              {r.daysCount}d)
            </p>
            <p className="text-xs text-slate-500">{r.reason ?? "No reason given"}</p>
          </div>
          <div className="flex gap-2">
            <Button className="px-3 py-1.5 text-xs" onClick={() => respond(r.id, "APPROVED")}>
              Approve
            </Button>
            <Button variant="secondary" className="px-3 py-1.5 text-xs" onClick={() => respond(r.id, "REJECTED")}>
              Reject
            </Button>
          </div>
        </li>
      ))}
    </ul>
  );
}

function AllAttendanceTab({ accessToken }: { accessToken: string }) {
  const [records, setRecords] = useState<AttendanceRecordDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [employeeId, setEmployeeId] = useState("");
  const [date, setDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [clockIn, setClockIn] = useState("");
  const [clockOut, setClockOut] = useState("");
  const [note, setNote] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function refresh() {
    const [r, e] = await Promise.all([api.attendance.all(accessToken), api.employees.list(accessToken)]);
    setRecords(r);
    setEmployees(e);
    if (!employeeId && e.length > 0) setEmployeeId(e[0].id);
  }

  useEffect(() => {
    refresh().catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load attendance"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.attendance.manual(accessToken, {
        employeeId,
        date,
        clockIn: clockIn ? `${date}T${clockIn}:00.000Z` : undefined,
        clockOut: clockOut ? `${date}T${clockOut}:00.000Z` : undefined,
        note: note || undefined,
      });
      setNote("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save attendance");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <h2 className="mb-2 font-semibold text-slate-900">Manual entry / adjustment</h2>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
          <FormField label="Employee">
            <select className="input" value={employeeId} onChange={(e) => setEmployeeId(e.target.value)}>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Date">
            <input type="date" className="input" value={date} onChange={(e) => setDate(e.target.value)} />
          </FormField>
          <FormField label="Clock in (UTC)">
            <input type="time" className="input" value={clockIn} onChange={(e) => setClockIn(e.target.value)} />
          </FormField>
          <FormField label="Clock out (UTC)">
            <input type="time" className="input" value={clockOut} onChange={(e) => setClockOut(e.target.value)} />
          </FormField>
          <FormField label="Note">
            <input className="input" value={note} onChange={(e) => setNote(e.target.value)} />
          </FormField>
          <Button type="submit" disabled={isSubmitting || !employeeId}>
            {isSubmitting ? "Saving..." : "Save"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <h2 className="mb-2 mt-6 font-semibold text-slate-900">All records</h2>
      <RecordsTable records={records} showEmployee />
    </div>
  );
}

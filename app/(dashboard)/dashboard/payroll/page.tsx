"use client";

import { useEffect, useState } from "react";
import type { PayrollRunDto, PayrollSettingsDto, PayslipDto, TaxBracketDto } from "@hrm/shared";
import { Badge, Button, Card, PageHeader, Table, Tabs, Tbody, Td, Th, Thead } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

const HR_TABS = ["Run payroll", "Past runs", "Settings"] as const;
const ALL_TABS = [...HR_TABS, "My Payslips"] as const;
type Tab = (typeof ALL_TABS)[number];

export default function PayrollPage() {
  const session = useRequireAuth();
  const isHrOrOwner = session?.user.role === "OWNER" || session?.user.role === "HR_ADMIN";
  const [tab, setTab] = useState<Tab>("My Payslips");

  useEffect(() => {
    if (isHrOrOwner) setTab("Run payroll");
  }, [isHrOrOwner]);

  if (!session) return null;
  const visibleTabs = isHrOrOwner ? ALL_TABS : (["My Payslips"] as const);

  return (
    <div>
      <PageHeader
        title="Payroll"
        description="Social security and withholding tax figures use a simplified calculation — verify with an accountant before running real payroll."
      />

      <Tabs items={visibleTabs.map((t) => ({ key: t, label: t }))} active={tab} onChange={(k) => setTab(k as Tab)} />

      <div className="mt-6">
        {tab === "Run payroll" && isHrOrOwner && <RunPayrollTab accessToken={session.accessToken} />}
        {tab === "Past runs" && isHrOrOwner && <PastRunsTab accessToken={session.accessToken} />}
        {tab === "Settings" && isHrOrOwner && <SettingsTab accessToken={session.accessToken} />}
        {tab === "My Payslips" && <MyPayslipsTab accessToken={session.accessToken} />}
      </div>
    </div>
  );
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function RunPayrollTab({ accessToken }: { accessToken: string }) {
  const now = new Date();
  const [periodYear, setPeriodYear] = useState(now.getFullYear());
  const [periodMonth, setPeriodMonth] = useState(now.getMonth() + 1);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<PayrollRunDto | null>(null);
  const [payslips, setPayslips] = useState<PayslipDto[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setIsSubmitting(true);
    try {
      const run = await api.payroll.createRun(accessToken, { periodYear, periodMonth });
      setSuccess(run);
      setPayslips(await api.payroll.getPayslips(accessToken, run.id));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to run payroll");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
          <label className="flex flex-col gap-1 text-sm">
            Year
            <input
              type="number"
              className="input"
              value={periodYear}
              onChange={(e) => setPeriodYear(Number(e.target.value))}
            />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Month
            <select className="input" value={periodMonth} onChange={(e) => setPeriodMonth(Number(e.target.value))}>
              {MONTH_NAMES.map((name, i) => (
                <option key={name} value={i + 1}>
                  {name}
                </option>
              ))}
            </select>
          </label>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Running..." : "Run payroll"}
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      {success && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-slate-900">
            Payslips for {MONTH_NAMES[success.periodMonth - 1]} {success.periodYear}
          </h2>
          <PayslipsTable accessToken={accessToken} payslips={payslips} />
        </div>
      )}
    </div>
  );
}

async function downloadPayslipPdf(accessToken: string, payslip: PayslipDto) {
  const blob = await api.payroll.downloadPayslipPdf(accessToken, payslip.id);
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  const safeName = payslip.employeeName.replace(/\s+/g, "_");
  a.download = `payslip-${payslip.periodYear}-${String(payslip.periodMonth).padStart(2, "0")}-${safeName}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}

function PayslipsTable({ accessToken, payslips }: { accessToken: string; payslips: PayslipDto[] }) {
  if (payslips.length === 0) return <p className="text-sm text-slate-500">No payslips.</p>;
  return (
    <Table>
      <Thead>
        <tr>
          <Th>Employee</Th>
          <Th>Base</Th>
          <Th>Unpaid leave</Th>
          <Th>Gross</Th>
          <Th>SSF (employee)</Th>
          <Th>Provident fund</Th>
          <Th>Withholding tax</Th>
          <Th>Net pay</Th>
          <Th></Th>
        </tr>
      </Thead>
      <Tbody>
        {payslips.map((p) => (
          <tr key={p.id}>
            <Td>{p.employeeName}</Td>
            <Td>{p.baseSalary.toLocaleString()}</Td>
            <Td>{p.unpaidLeaveDeduction.toLocaleString()}</Td>
            <Td>{p.grossPay.toLocaleString()}</Td>
            <Td>{p.socialSecurityEmployee.toLocaleString()}</Td>
            <Td>{p.providentFundEmployee.toLocaleString()}</Td>
            <Td>{p.withholdingTax.toLocaleString()}</Td>
            <Td className="font-medium">{p.netPay.toLocaleString()}</Td>
            <Td>
              <button onClick={() => downloadPayslipPdf(accessToken, p)} className="text-brand-700 underline">
                PDF
              </button>
            </Td>
          </tr>
        ))}
      </Tbody>
    </Table>
  );
}

function PastRunsTab({ accessToken }: { accessToken: string }) {
  const [runs, setRuns] = useState<PayrollRunDto[]>([]);
  const [selectedRunId, setSelectedRunId] = useState<string | null>(null);
  const [payslips, setPayslips] = useState<PayslipDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.payroll
      .listRuns(accessToken)
      .then(setRuns)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load runs"));
  }, [accessToken]);

  async function viewRun(runId: string) {
    setSelectedRunId(runId);
    setPayslips(await api.payroll.getPayslips(accessToken, runId));
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (runs.length === 0) return <p className="text-sm text-slate-500">No payroll runs yet.</p>;

  return (
    <div>
      <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {runs.map((r) => (
          <li key={r.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="flex items-center gap-2">
              {MONTH_NAMES[r.periodMonth - 1]} {r.periodYear} <Badge status={r.status} />
            </span>
            <button onClick={() => viewRun(r.id)} className="text-brand-700 underline">
              View payslips
            </button>
          </li>
        ))}
      </ul>

      {selectedRunId && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-slate-900">Payslips</h2>
          <PayslipsTable accessToken={accessToken} payslips={payslips} />
        </div>
      )}
    </div>
  );
}

function SettingsTab({ accessToken }: { accessToken: string }) {
  const [settings, setSettings] = useState<PayrollSettingsDto | null>(null);
  const [brackets, setBrackets] = useState<TaxBracketDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSaving, setIsSaving] = useState(false);

  useEffect(() => {
    Promise.all([api.payroll.getSettings(accessToken), api.payroll.getTaxBrackets(accessToken)])
      .then(([s, b]) => {
        setSettings(s);
        setBrackets(b);
      })
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load settings"));
  }, [accessToken]);

  async function saveSettings(e: React.FormEvent) {
    e.preventDefault();
    if (!settings) return;
    setIsSaving(true);
    try {
      const updated = await api.payroll.updateSettings(accessToken, settings);
      setSettings(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to save settings");
    } finally {
      setIsSaving(false);
    }
  }

  async function saveBracket(bracket: TaxBracketDto) {
    const updated = await api.payroll.updateTaxBracket(accessToken, bracket.id, {
      minIncome: bracket.minIncome,
      maxIncome: bracket.maxIncome,
      rate: bracket.rate,
    });
    setBrackets((prev) => prev.map((b) => (b.id === updated.id ? updated : b)));
  }

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (!settings) return <p className="text-sm text-slate-500">Loading...</p>;

  return (
    <div className="space-y-6">
      <Card title="Social security">
        <form className="grid max-w-md grid-cols-2 gap-3" onSubmit={saveSettings}>
          <NumberField
            label="Employee rate"
            value={settings.socialSecurityEmployeeRate}
            onChange={(v) => setSettings({ ...settings, socialSecurityEmployeeRate: v })}
            step={0.001}
          />
          <NumberField
            label="Employer rate"
            value={settings.socialSecurityEmployerRate}
            onChange={(v) => setSettings({ ...settings, socialSecurityEmployerRate: v })}
            step={0.001}
          />
          <NumberField
            label="Wage floor (THB)"
            value={settings.socialSecurityWageFloor}
            onChange={(v) => setSettings({ ...settings, socialSecurityWageFloor: v })}
          />
          <NumberField
            label="Wage ceiling (THB)"
            value={settings.socialSecurityWageCeiling}
            onChange={(v) => setSettings({ ...settings, socialSecurityWageCeiling: v })}
          />
          <div className="col-span-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>

      <Card title="Provident fund">
        <form className="grid max-w-md grid-cols-2 gap-3" onSubmit={saveSettings}>
          <label className="col-span-2 flex items-center gap-2 text-sm">
            <input
              type="checkbox"
              checked={settings.providentFundEnabled}
              onChange={(e) => setSettings({ ...settings, providentFundEnabled: e.target.checked })}
            />
            Enable provident fund for this organization
          </label>
          <NumberField
            label="Default employee rate"
            value={settings.providentFundDefaultEmployeeRate}
            onChange={(v) => setSettings({ ...settings, providentFundDefaultEmployeeRate: v })}
            step={0.001}
          />
          <NumberField
            label="Default employer rate"
            value={settings.providentFundDefaultEmployerRate}
            onChange={(v) => setSettings({ ...settings, providentFundDefaultEmployerRate: v })}
            step={0.001}
          />
          <div className="col-span-2">
            <Button type="submit" disabled={isSaving}>
              {isSaving ? "Saving..." : "Save"}
            </Button>
          </div>
        </form>
      </Card>

      <div>
        <h2 className="mb-2 font-semibold text-slate-900">Tax brackets</h2>
        <Table>
          <Thead>
            <tr>
              <Th>Min income</Th>
              <Th>Max income</Th>
              <Th>Rate</Th>
              <Th></Th>
            </tr>
          </Thead>
          <Tbody>
            {brackets.map((b) => (
              <BracketRow key={b.id} bracket={b} onSave={saveBracket} />
            ))}
          </Tbody>
        </Table>
      </div>
    </div>
  );
}

function NumberField({
  label,
  value,
  onChange,
  step = 1,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  step?: number;
}) {
  return (
    <label className="flex flex-col gap-1 text-sm">
      {label}
      <input
        type="number"
        step={step}
        className="input"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
      />
    </label>
  );
}

function BracketRow({ bracket, onSave }: { bracket: TaxBracketDto; onSave: (bracket: TaxBracketDto) => void }) {
  const [minIncome, setMinIncome] = useState(bracket.minIncome);
  const [maxIncome, setMaxIncome] = useState(bracket.maxIncome);
  const [rate, setRate] = useState(bracket.rate);

  return (
    <tr>
      <Td>
        <input
          type="number"
          className="input"
          value={minIncome}
          onChange={(e) => setMinIncome(Number(e.target.value))}
        />
      </Td>
      <Td>
        <input
          type="number"
          className="input"
          value={maxIncome ?? ""}
          placeholder="No limit"
          onChange={(e) => setMaxIncome(e.target.value === "" ? null : Number(e.target.value))}
        />
      </Td>
      <Td>
        <input
          type="number"
          step={0.01}
          className="input"
          value={rate}
          onChange={(e) => setRate(Number(e.target.value))}
        />
      </Td>
      <Td>
        <button onClick={() => onSave({ ...bracket, minIncome, maxIncome, rate })} className="text-sm text-brand-700 underline">
          Save
        </button>
      </Td>
    </tr>
  );
}

function MyPayslipsTab({ accessToken }: { accessToken: string }) {
  const [payslips, setPayslips] = useState<PayslipDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    api.payroll
      .myPayslips(accessToken)
      .then(setPayslips)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load payslips"));
  }, [accessToken]);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (payslips.length === 0) return <p className="text-sm text-slate-500">No payslips yet.</p>;

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {payslips.map((p) => (
        <li key={p.id} className="flex items-center justify-between px-4 py-3 text-sm">
          <div>
            <p className="font-medium">
              {MONTH_NAMES[p.periodMonth - 1]} {p.periodYear} — Net pay: {p.netPay.toLocaleString()} THB
            </p>
            <p className="text-xs text-slate-500">
              Gross {p.grossPay.toLocaleString()} · SSF {p.socialSecurityEmployee.toLocaleString()}
              {p.providentFundEmployee > 0 ? ` · PF ${p.providentFundEmployee.toLocaleString()}` : ""} · Tax{" "}
              {p.withholdingTax.toLocaleString()}
            </p>
          </div>
          <button onClick={() => downloadPayslipPdf(accessToken, p)} className="text-sm text-brand-700 underline">
            Download PDF
          </button>
        </li>
      ))}
    </ul>
  );
}

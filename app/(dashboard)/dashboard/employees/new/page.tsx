"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { EmploymentType } from "@hrm/shared";
import type { DepartmentDto, EmployeeSummary, PayrollSettingsDto } from "@hrm/shared";
import { Button, Card, FormField, PageHeader } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

const EMPLOYMENT_TYPES = Object.values(EmploymentType);

export default function NewEmployeePage() {
  const session = useRequireAuth();
  const router = useRouter();

  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [position, setPosition] = useState("");
  const [employmentType, setEmploymentType] = useState<string>(EmploymentType.FULL_TIME);
  const [departmentId, setDepartmentId] = useState("");
  const [managerId, setManagerId] = useState("");
  const [baseSalary, setBaseSalary] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettingsDto | null>(null);
  const [providentFundOptIn, setProvidentFundOptIn] = useState(false);
  const [providentFundEmployeeRate, setProvidentFundEmployeeRate] = useState("");

  useEffect(() => {
    if (!session) return;
    api.departments.list(session.accessToken).then(setDepartments).catch(() => undefined);
    api.employees.list(session.accessToken).then(setEmployees).catch(() => undefined);
    api.payroll.getSettings(session.accessToken).then(setPayrollSettings).catch(() => undefined);
  }, [session]);

  if (!session) return null;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const employee = await api.employees.create(session!.accessToken, {
        firstName,
        lastName,
        position,
        employmentType: employmentType as (typeof EMPLOYMENT_TYPES)[number],
        departmentId: departmentId || undefined,
        managerId: managerId || undefined,
        baseSalary: Number(baseSalary),
        startDate,
        email: email || undefined,
        phone: phone || undefined,
        providentFundOptIn: payrollSettings?.providentFundEnabled ? providentFundOptIn : undefined,
        providentFundEmployeeRate: providentFundEmployeeRate ? Number(providentFundEmployeeRate) : undefined,
      });
      router.push(`/dashboard/employees/${employee.id}`);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create employee");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <div className="max-w-2xl">
      <PageHeader title="Add employee" />
      <Card>
        <form className="grid grid-cols-2 gap-4" onSubmit={handleSubmit}>
          <FormField label="First name">
            <input required className="input" value={firstName} onChange={(e) => setFirstName(e.target.value)} />
          </FormField>
          <FormField label="Last name">
            <input required className="input" value={lastName} onChange={(e) => setLastName(e.target.value)} />
          </FormField>
          <FormField label="Position">
            <input required className="input" value={position} onChange={(e) => setPosition(e.target.value)} />
          </FormField>
          <FormField label="Employment type">
            <select className="input" value={employmentType} onChange={(e) => setEmploymentType(e.target.value)}>
              {EMPLOYMENT_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t.replace("_", " ")}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Department">
            <select className="input" value={departmentId} onChange={(e) => setDepartmentId(e.target.value)}>
              <option value="">—</option>
              {departments.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Manager">
            <select className="input" value={managerId} onChange={(e) => setManagerId(e.target.value)}>
              <option value="">—</option>
              {employees.map((emp) => (
                <option key={emp.id} value={emp.id}>
                  {emp.firstName} {emp.lastName}
                </option>
              ))}
            </select>
          </FormField>
          <FormField label="Base salary (THB/month)">
            <input
              required
              type="number"
              min={0}
              className="input"
              value={baseSalary}
              onChange={(e) => setBaseSalary(e.target.value)}
            />
          </FormField>
          <FormField label="Start date">
            <input
              required
              type="date"
              className="input"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </FormField>
          <FormField label="Email (optional)">
            <input type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
          </FormField>
          <FormField label="Phone (optional)">
            <input className="input" value={phone} onChange={(e) => setPhone(e.target.value)} />
          </FormField>

          {payrollSettings?.providentFundEnabled && (
            <>
              <label className="col-span-2 flex items-center gap-2 text-sm font-medium text-slate-700">
                <input
                  type="checkbox"
                  checked={providentFundOptIn}
                  onChange={(e) => setProvidentFundOptIn(e.target.checked)}
                />
                Opt in to provident fund
              </label>
              {providentFundOptIn && (
                <FormField label={`Employee rate override (default ${payrollSettings.providentFundDefaultEmployeeRate})`}>
                  <input
                    type="number"
                    min={0}
                    max={1}
                    step={0.001}
                    className="input"
                    value={providentFundEmployeeRate}
                    onChange={(e) => setProvidentFundEmployeeRate(e.target.value)}
                  />
                </FormField>
              )}
            </>
          )}

          {error && <p className="col-span-2 text-sm text-red-600">{error}</p>}

          <div className="col-span-2 flex gap-3">
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Saving..." : "Create employee"}
            </Button>
            <Button type="button" variant="secondary" onClick={() => router.push("/dashboard/employees")}>
              Cancel
            </Button>
          </div>
        </form>
      </Card>
    </div>
  );
}

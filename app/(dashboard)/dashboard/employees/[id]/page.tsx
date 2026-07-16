"use client";

import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { DocumentCategory, EmployeeStatus, EmploymentType } from "@hrm/shared";
import type {
  DepartmentDto,
  EmployeeDetail,
  EmployeeDocumentDto,
  EmployeeSummary,
  PayrollSettingsDto,
  SeveranceRecordDto,
} from "@hrm/shared";
import { Badge, Button, Card, FormField } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

const EMPLOYMENT_TYPES = Object.values(EmploymentType);
const EMPLOYEE_STATUSES = Object.values(EmployeeStatus);
const DOCUMENT_CATEGORIES = Object.values(DocumentCategory);

export default function EmployeeDetailPage() {
  const session = useRequireAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();

  const [employee, setEmployee] = useState<EmployeeDetail | null>(null);
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [colleagues, setColleagues] = useState<EmployeeSummary[]>([]);
  const [documents, setDocuments] = useState<EmployeeDocumentDto[]>([]);
  const [payrollSettings, setPayrollSettings] = useState<PayrollSettingsDto | null>(null);
  const [severance, setSeverance] = useState<SeveranceRecordDto | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);

  async function reload() {
    if (!session) return;
    const [emp, docs] = await Promise.all([
      api.employees.get(session.accessToken, params.id),
      api.documents.list(session.accessToken, params.id),
    ]);
    setEmployee(emp);
    setDocuments(docs);
    if (emp.status === EmployeeStatus.TERMINATED) {
      api.employees.getSeverance(session.accessToken, params.id).then(setSeverance).catch(() => undefined);
    }
  }

  useEffect(() => {
    if (!session) return;
    reload().catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load employee"));
    api.departments.list(session.accessToken).then(setDepartments).catch(() => undefined);
    api.employees.list(session.accessToken).then(setColleagues).catch(() => undefined);
    api.payroll.getSettings(session.accessToken).then(setPayrollSettings).catch(() => undefined);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session, params.id]);

  if (!session || !employee) {
    return error ? <p className="text-sm text-red-600">{error}</p> : <p className="text-sm text-slate-500">Loading...</p>;
  }

  return (
    <div className="max-w-3xl">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-semibold text-slate-900">
            {employee.firstName} {employee.lastName}
          </h1>
          <p className="text-sm text-slate-500">
            {employee.employeeCode} · {employee.position}
          </p>
        </div>
        <Button variant="secondary" onClick={() => router.push("/dashboard/employees")}>
          Back to list
        </Button>
      </div>

      {error && <p className="mt-4 text-sm text-red-600">{error}</p>}

      <Card
        className="mt-6"
        title="Profile"
        action={
          <button onClick={() => setIsEditing((v) => !v)} className="text-sm font-medium text-brand-700 underline">
            {isEditing ? "Cancel" : "Edit"}
          </button>
        }
      >
        {isEditing ? (
          <EditForm
            employee={employee}
            departments={departments}
            colleagues={colleagues.filter((c) => c.id !== employee.id)}
            payrollSettings={payrollSettings}
            accessToken={session.accessToken}
            onSaved={(updated) => {
              setEmployee(updated);
              setIsEditing(false);
              if (updated.status === EmployeeStatus.TERMINATED) {
                api.employees.getSeverance(session.accessToken, updated.id).then(setSeverance).catch(() => undefined);
              }
            }}
          />
        ) : (
          <dl className="grid grid-cols-2 gap-3 text-sm">
            <Detail label="Status" value={<Badge status={employee.status} />} />
            <Detail label="Employment type" value={employee.employmentType.replace("_", " ")} />
            <Detail label="Department" value={employee.department?.name ?? "—"} />
            <Detail label="Base salary" value={`${employee.baseSalary.toLocaleString()} THB/month`} />
            <Detail label="Start date" value={employee.startDate.slice(0, 10)} />
            <Detail label="Email" value={employee.email ?? "—"} />
            <Detail label="Phone" value={employee.phone ?? "—"} />
            <Detail label="National ID" value={employee.nationalId ?? "—"} />
            <Detail label="Bank" value={employee.bankName ?? "—"} />
            <Detail label="Bank account" value={employee.bankAccountNumber ?? "—"} />
            <Detail
              label="Provident fund"
              value={
                employee.providentFundOptIn
                  ? `Opted in${employee.providentFundEmployeeRate != null ? ` (${employee.providentFundEmployeeRate} rate override)` : " (org default rate)"}`
                  : "Not opted in"
              }
            />
          </dl>
        )}
      </Card>

      {employee.status === EmployeeStatus.TERMINATED && (
        <Card className="mt-6" title="Severance">
          {severance ? (
            <div className="text-sm">
              <p>
                {severance.yearsOfService.toFixed(1)} years of service · {severance.daysOfPay} days' pay at{" "}
                {severance.dailyRate.toLocaleString()} THB/day
              </p>
              <p className="mt-1 font-medium">Amount: {severance.amount.toLocaleString()} THB</p>
              <p className="mt-2 text-xs text-slate-500">
                Calculated automatically from the statutory tenure table. This does not account for cause-based
                exemptions (e.g. termination for serious misconduct) — review with HR/legal before paying out.
              </p>
            </div>
          ) : (
            <p className="text-sm text-slate-500">No severance record found for this employee.</p>
          )}
        </Card>
      )}

      <Card className="mt-6" title="Portal access">
        {employee.hasPortalAccess ? (
          <p className="text-sm text-slate-600">This employee can log in and use self-service.</p>
        ) : (
          <InviteForm
            accessToken={session.accessToken}
            employeeId={employee.id}
            onInvited={(updated) => setEmployee(updated)}
          />
        )}
      </Card>

      <Card className="mt-6" title="Documents">
        <DocumentsPanel
          accessToken={session.accessToken}
          employeeId={employee.id}
          documents={documents}
          onChanged={setDocuments}
        />
      </Card>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <dt className="text-xs uppercase text-slate-500">{label}</dt>
      <dd className="text-slate-900">{value}</dd>
    </div>
  );
}

function EditForm({
  employee,
  departments,
  colleagues,
  payrollSettings,
  accessToken,
  onSaved,
}: {
  employee: EmployeeDetail;
  departments: DepartmentDto[];
  colleagues: EmployeeSummary[];
  payrollSettings: PayrollSettingsDto | null;
  accessToken: string;
  onSaved: (employee: EmployeeDetail) => void;
}) {
  const [position, setPosition] = useState(employee.position);
  const [employmentType, setEmploymentType] = useState<string>(employee.employmentType);
  const [status, setStatus] = useState<string>(employee.status);
  const [departmentId, setDepartmentId] = useState(employee.department?.id ?? "");
  const [managerId, setManagerId] = useState(employee.managerId ?? "");
  const [baseSalary, setBaseSalary] = useState(String(employee.baseSalary));
  const [providentFundOptIn, setProvidentFundOptIn] = useState(employee.providentFundOptIn);
  const [providentFundEmployeeRate, setProvidentFundEmployeeRate] = useState(
    employee.providentFundEmployeeRate != null ? String(employee.providentFundEmployeeRate) : "",
  );
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await api.employees.update(accessToken, employee.id, {
        position,
        employmentType: employmentType as (typeof EMPLOYMENT_TYPES)[number],
        status: status as (typeof EMPLOYEE_STATUSES)[number],
        departmentId: departmentId || undefined,
        managerId: managerId || undefined,
        baseSalary: Number(baseSalary),
        providentFundOptIn: payrollSettings?.providentFundEnabled ? providentFundOptIn : undefined,
        providentFundEmployeeRate: providentFundEmployeeRate ? Number(providentFundEmployeeRate) : undefined,
      });
      onSaved(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to update employee");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="grid grid-cols-2 gap-3" onSubmit={handleSubmit}>
      <FormField label="Position">
        <input className="input" value={position} onChange={(e) => setPosition(e.target.value)} />
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
      <FormField label="Status">
        <select className="input" value={status} onChange={(e) => setStatus(e.target.value)}>
          {EMPLOYEE_STATUSES.map((s) => (
            <option key={s} value={s}>
              {s.replace("_", " ")}
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
          {colleagues.map((c) => (
            <option key={c.id} value={c.id}>
              {c.firstName} {c.lastName}
            </option>
          ))}
        </select>
      </FormField>
      <FormField label="Base salary">
        <input
          type="number"
          min={0}
          className="input"
          value={baseSalary}
          onChange={(e) => setBaseSalary(e.target.value)}
        />
      </FormField>

      {payrollSettings?.providentFundEnabled && (
        <>
          <label className="col-span-2 flex items-center gap-2 text-sm">
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

      <div className="col-span-2">
        <Button type="submit" disabled={isSubmitting}>
          {isSubmitting ? "Saving..." : "Save changes"}
        </Button>
      </div>
    </form>
  );
}

function InviteForm({
  accessToken,
  employeeId,
  onInvited,
}: {
  accessToken: string;
  employeeId: string;
  onInvited: (employee: EmployeeDetail) => void;
}) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const updated = await api.employees.invite(accessToken, employeeId, { email, password });
      onInvited(updated);
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to invite employee");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
      <FormField label="Login email">
        <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
      </FormField>
      <FormField label="Initial password">
        <input
          required
          type="text"
          minLength={8}
          className="input"
          value={password}
          onChange={(e) => setPassword(e.target.value)}
          placeholder="At least 8 characters"
        />
      </FormField>
      <Button type="submit" disabled={isSubmitting}>
        {isSubmitting ? "Inviting..." : "Grant portal access"}
      </Button>
      {error && <p className="w-full text-sm text-red-600">{error}</p>}
      <p className="w-full text-xs text-slate-500">
        A login-instructions email will be sent to this address (or written to the dev-mode outbox if no SMTP
        server is configured). You can also share this email/password with the employee directly as a backup.
      </p>
    </form>
  );
}

function DocumentsPanel({
  accessToken,
  employeeId,
  documents,
  onChanged,
}: {
  accessToken: string;
  employeeId: string;
  documents: EmployeeDocumentDto[];
  onChanged: (documents: EmployeeDocumentDto[]) => void;
}) {
  const [category, setCategory] = useState<string>(DocumentCategory.OTHER);
  const [file, setFile] = useState<File | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  async function refresh() {
    const docs = await api.documents.list(accessToken, employeeId);
    onChanged(docs);
  }

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault();
    if (!file) return;
    setError(null);
    setIsUploading(true);
    try {
      await api.documents.upload(accessToken, employeeId, file, category);
      setFile(null);
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Upload failed");
    } finally {
      setIsUploading(false);
    }
  }

  async function handleDownload(doc: EmployeeDocumentDto) {
    const blob = await api.documents.download(accessToken, employeeId, doc.id);
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = doc.fileName;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function handleDelete(doc: EmployeeDocumentDto) {
    await api.documents.remove(accessToken, employeeId, doc.id);
    await refresh();
  }

  return (
    <div>
      <form className="flex flex-wrap items-end gap-3" onSubmit={handleUpload}>
        <FormField label="Category">
          <select className="input" value={category} onChange={(e) => setCategory(e.target.value)}>
            {DOCUMENT_CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c.replace("_", " ")}
              </option>
            ))}
          </select>
        </FormField>
        <FormField label="File">
          <input type="file" onChange={(e) => setFile(e.target.files?.[0] ?? null)} />
        </FormField>
        <Button type="submit" disabled={!file || isUploading}>
          {isUploading ? "Uploading..." : "Upload"}
        </Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      {documents.length === 0 ? (
        <p className="mt-4 text-sm text-slate-500">No documents uploaded yet.</p>
      ) : (
        <ul className="mt-4 divide-y divide-slate-100">
          {documents.map((doc) => (
            <li key={doc.id} className="flex items-center justify-between py-2 text-sm">
              <div>
                <p className="font-medium">{doc.fileName}</p>
                <p className="text-xs text-slate-500">
                  {doc.category} · {(doc.sizeBytes / 1024).toFixed(0)} KB
                </p>
              </div>
              <div className="flex gap-3">
                <button onClick={() => handleDownload(doc)} className="text-brand-700 underline">
                  Download
                </button>
                <button onClick={() => handleDelete(doc)} className="text-red-600 underline">
                  Delete
                </button>
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

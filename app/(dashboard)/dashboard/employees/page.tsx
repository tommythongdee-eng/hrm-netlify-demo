"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { DepartmentDto, EmployeeSummary } from "@hrm/shared";
import { Badge, Button, Card, PageHeader, Table, Tbody, Td, Th, Thead } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

export default function EmployeesPage() {
  const session = useRequireAuth();
  const router = useRouter();
  const [employees, setEmployees] = useState<EmployeeSummary[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showDepartments, setShowDepartments] = useState(false);

  const canManage = session?.user.role === "OWNER" || session?.user.role === "HR_ADMIN";

  function loadEmployees() {
    if (!session) return;
    api.employees
      .list(session.accessToken)
      .then(setEmployees)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load employees"))
      .finally(() => setIsLoading(false));
  }

  useEffect(() => {
    loadEmployees();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [session]);

  if (!session) return null;

  return (
    <div>
      <PageHeader
        title="Employees"
        action={
          <div className="flex gap-3">
            {canManage && (
              <Button variant="secondary" onClick={() => setShowDepartments((v) => !v)}>
                {showDepartments ? "Hide departments" : "Manage departments"}
              </Button>
            )}
            {canManage && (
              <Link href="/dashboard/employees/new">
                <Button>Add employee</Button>
              </Link>
            )}
          </div>
        }
      />

      {canManage && showDepartments && (
        <div className="mb-6">
          <DepartmentsPanel accessToken={session.accessToken} />
        </div>
      )}

      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : employees.length === 0 ? (
        <p className="text-sm text-slate-500">No employees yet.</p>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Code</Th>
              <Th>Name</Th>
              <Th>Position</Th>
              <Th>Department</Th>
              <Th>Status</Th>
              <Th>Portal</Th>
            </tr>
          </Thead>
          <Tbody>
            {employees.map((e) => {
              const row = (
                <>
                  <Td className="font-mono text-xs">{e.employeeCode}</Td>
                  <Td>
                    {e.firstName} {e.lastName}
                  </Td>
                  <Td>{e.position}</Td>
                  <Td>{e.department?.name ?? "—"}</Td>
                  <Td>
                    <Badge status={e.status} />
                  </Td>
                  <Td>{e.hasPortalAccess ? "Yes" : "No"}</Td>
                </>
              );
              return canManage ? (
                <tr
                  key={e.id}
                  className="cursor-pointer hover:bg-slate-50"
                  onClick={() => router.push(`/dashboard/employees/${e.id}`)}
                >
                  {row}
                </tr>
              ) : (
                <tr key={e.id}>{row}</tr>
              );
            })}
          </Tbody>
        </Table>
      )}
    </div>
  );
}

function DepartmentsPanel({ accessToken }: { accessToken: string }) {
  const [departments, setDepartments] = useState<DepartmentDto[]>([]);
  const [name, setName] = useState("");
  const [error, setError] = useState<string | null>(null);

  function refresh() {
    api.departments
      .list(accessToken)
      .then(setDepartments)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load departments"));
  }

  useEffect(refresh, [accessToken]);

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!name.trim()) return;
    setError(null);
    try {
      await api.departments.create(accessToken, { name: name.trim() });
      setName("");
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to add department");
    }
  }

  async function handleRemove(id: string) {
    try {
      await api.departments.remove(accessToken, id);
      refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to remove department");
    }
  }

  return (
    <Card title="Departments">
      <form className="flex items-end gap-3" onSubmit={handleAdd}>
        <label className="flex flex-col gap-1 text-sm">
          New department
          <input className="input" value={name} onChange={(e) => setName(e.target.value)} />
        </label>
        <Button type="submit">Add</Button>
      </form>
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      <ul className="mt-3 flex flex-wrap gap-2">
        {departments.map((d) => (
          <li
            key={d.id}
            className="flex items-center gap-2 rounded-full bg-slate-100 px-3 py-1 text-sm text-slate-700"
          >
            {d.name}
            <button onClick={() => handleRemove(d.id)} className="text-slate-400 hover:text-red-600">
              ×
            </button>
          </li>
        ))}
      </ul>
    </Card>
  );
}

"use client";

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import type { OrganizationSummaryDto } from "@hrm/shared";
import { Badge, PageHeader, Table, Tbody, Td, Th, Thead } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireSuperAdminAuth } from "@/lib/superadmin-auth-context";

export default function OrganizationsPage() {
  const session = useRequireSuperAdminAuth();
  const router = useRouter();
  const [organizations, setOrganizations] = useState<OrganizationSummaryDto[]>([]);
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    if (!session) return;
    api.superadmin
      .listOrganizations(session.accessToken)
      .then(setOrganizations)
      .catch((err) => setError(err instanceof ApiError ? err.message : "Failed to load organizations"))
      .finally(() => setIsLoading(false));
  }, [session]);

  if (!session) return null;

  return (
    <div>
      <PageHeader title="Organizations" />
      {error && <p className="mb-4 text-sm text-red-600">{error}</p>}
      {isLoading ? (
        <p className="text-sm text-slate-500">Loading...</p>
      ) : (
        <Table>
          <Thead>
            <tr>
              <Th>Name</Th>
              <Th>Plan</Th>
              <Th>Employees</Th>
              <Th>Status</Th>
              <Th>Subscription</Th>
              <Th>Created</Th>
            </tr>
          </Thead>
          <Tbody>
            {organizations.map((org) => (
              <tr
                key={org.id}
                className="cursor-pointer hover:bg-slate-50"
                onClick={() => router.push(`/superadmin/organizations/${org.id}`)}
              >
                <Td className="font-medium">{org.name}</Td>
                <Td>{org.planName ?? "—"}</Td>
                <Td>{org.employeeCount}</Td>
                <Td>
                  <Badge status={org.status} />
                </Td>
                <Td>
                  <Badge status={org.subscriptionStatus} />
                </Td>
                <Td>{org.createdAt.slice(0, 10)}</Td>
              </tr>
            ))}
          </Tbody>
        </Table>
      )}
    </div>
  );
}

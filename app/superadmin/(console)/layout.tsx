"use client";

import { useRouter } from "next/navigation";
import { Building2 } from "lucide-react";
import { ConsoleShell } from "@/components/ui";
import { useRequireSuperAdminAuth, useSuperAdminAuth } from "@/lib/superadmin-auth-context";

const NAV_ITEMS = [{ href: "/superadmin/organizations", label: "Organizations", icon: Building2 }];

export default function SuperAdminConsoleLayout({ children }: { children: React.ReactNode }) {
  const session = useRequireSuperAdminAuth();
  const { clearSession } = useSuperAdminAuth();
  const router = useRouter();

  if (!session) {
    return null;
  }

  return (
    <ConsoleShell
      navItems={NAV_ITEMS}
      brandLabel="Platform Console"
      subLabel={session.name}
      onLogout={() => {
        clearSession();
        router.push("/superadmin/login");
      }}
    >
      {children}
    </ConsoleShell>
  );
}

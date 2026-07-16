"use client";

import { useRouter } from "next/navigation";
import {
  Banknote,
  CalendarClock,
  ClipboardList,
  CreditCard,
  GraduationCap,
  LayoutDashboard,
  Network,
  TrendingUp,
  Users,
} from "lucide-react";
import { ConsoleShell } from "@/components/ui";
import { useRequireAuth, useAuth } from "@/lib/auth-context";

const NAV_ITEMS = [
  { href: "/dashboard", label: "Overview", icon: LayoutDashboard },
  { href: "/dashboard/employees", label: "Employees", icon: Users },
  { href: "/dashboard/attendance-leave", label: "Attendance & Leave", icon: CalendarClock },
  { href: "/dashboard/payroll", label: "Payroll", icon: Banknote },
  { href: "/dashboard/performance", label: "Performance", icon: TrendingUp },
  { href: "/dashboard/training", label: "Training", icon: GraduationCap },
  { href: "/dashboard/surveys", label: "Surveys", icon: ClipboardList },
  { href: "/dashboard/succession", label: "Succession", icon: Network },
  { href: "/dashboard/billing", label: "Billing", icon: CreditCard },
];

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  const session = useRequireAuth();
  const { clearSession } = useAuth();
  const router = useRouter();

  if (!session) {
    return null;
  }

  return (
    <ConsoleShell
      navItems={NAV_ITEMS}
      brandLabel={session.user.organizationName}
      subLabel={session.user.role}
      onLogout={() => {
        clearSession();
        router.push("/login");
      }}
    >
      {children}
    </ConsoleShell>
  );
}

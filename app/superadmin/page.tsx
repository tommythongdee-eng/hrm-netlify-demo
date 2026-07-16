"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { useSuperAdminAuth } from "@/lib/superadmin-auth-context";

export default function SuperAdminIndexPage() {
  const router = useRouter();
  const { session, isLoading } = useSuperAdminAuth();

  useEffect(() => {
    if (isLoading) return;
    router.replace(session ? "/superadmin/organizations" : "/superadmin/login");
  }, [isLoading, session, router]);

  return null;
}

"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { SuperAdminAuthResponse } from "@hrm/shared";

// Separate storage key + context from the tenant AuthProvider (lib/auth-context.tsx)
// — a superadmin session has no organizationId and must never be confused
// with a tenant session by anything reading localStorage.
const STORAGE_KEY = "hrm.superadmin.session";

interface StoredSuperAdminSession {
  accessToken: string;
  name: string;
}

interface SuperAdminAuthContextValue {
  session: StoredSuperAdminSession | null;
  isLoading: boolean;
  setSession: (session: SuperAdminAuthResponse) => void;
  clearSession: () => void;
}

const SuperAdminAuthContext = createContext<SuperAdminAuthContextValue | undefined>(undefined);

export function SuperAdminAuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<StoredSuperAdminSession | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const raw = window.localStorage.getItem(STORAGE_KEY);
    if (raw) {
      try {
        setSessionState(JSON.parse(raw));
      } catch {
        window.localStorage.removeItem(STORAGE_KEY);
      }
    }
    setIsLoading(false);
  }, []);

  const value = useMemo<SuperAdminAuthContextValue>(
    () => ({
      session,
      isLoading,
      setSession: (next) => {
        const stored: StoredSuperAdminSession = { accessToken: next.accessToken, name: next.name };
        window.localStorage.setItem(STORAGE_KEY, JSON.stringify(stored));
        setSessionState(stored);
      },
      clearSession: () => {
        window.localStorage.removeItem(STORAGE_KEY);
        setSessionState(null);
      },
    }),
    [session, isLoading],
  );

  return <SuperAdminAuthContext.Provider value={value}>{children}</SuperAdminAuthContext.Provider>;
}

export function useSuperAdminAuth(): SuperAdminAuthContextValue {
  const ctx = useContext(SuperAdminAuthContext);
  if (!ctx) {
    throw new Error("useSuperAdminAuth must be used within SuperAdminAuthProvider");
  }
  return ctx;
}

export function useRequireSuperAdminAuth(): StoredSuperAdminSession | null {
  const { session, isLoading } = useSuperAdminAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/superadmin/login");
    }
  }, [isLoading, session, router]);

  return session;
}

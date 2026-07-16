"use client";

import { createContext, useContext, useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import type { AuthResponse, AuthenticatedUser } from "@hrm/shared";

// Phase 0 note: session state lives in localStorage for simplicity. This is
// fine for local development but should move to httpOnly cookies + a proper
// refresh flow before this ships to real users (Phase 1 hardening item).
const STORAGE_KEY = "hrm.session";

interface StoredSession {
  accessToken: string;
  refreshToken: string;
  user: AuthenticatedUser;
}

interface AuthContextValue {
  session: StoredSession | null;
  isLoading: boolean;
  setSession: (session: AuthResponse) => void;
  clearSession: () => void;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [session, setSessionState] = useState<StoredSession | null>(null);
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

  const value = useMemo<AuthContextValue>(
    () => ({
      session,
      isLoading,
      setSession: (next) => {
        const stored: StoredSession = {
          accessToken: next.accessToken,
          refreshToken: next.refreshToken,
          user: next.user,
        };
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

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) {
    throw new Error("useAuth must be used within AuthProvider");
  }
  return ctx;
}

export function useRequireAuth(): StoredSession | null {
  const { session, isLoading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!isLoading && !session) {
      router.replace("/login");
    }
  }, [isLoading, session, router]);

  return session;
}

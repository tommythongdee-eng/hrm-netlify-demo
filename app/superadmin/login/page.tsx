"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { Button, Card, FormField } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useSuperAdminAuth } from "@/lib/superadmin-auth-context";

export default function SuperAdminLoginPage() {
  const router = useRouter();
  const { setSession } = useSuperAdminAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await api.superadmin.login({ email, password });
      setSession(response);
      router.push("/superadmin/organizations");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-950 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-1 text-center text-2xl font-semibold text-white">Platform Console</h1>
        <p className="mb-6 text-center text-sm text-slate-400">Superadmin sign-in — separate from tenant accounts.</p>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FormField label="Email">
              <input required type="email" className="input" value={email} onChange={(e) => setEmail(e.target.value)} />
            </FormField>
            <FormField label="Password">
              <input
                required
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
              />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </Card>
      </div>
    </main>
  );
}

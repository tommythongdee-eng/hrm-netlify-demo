"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, FormField } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function LoginPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await api.login({ email, password });
      setSession(response);
      router.push("/dashboard");
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Something went wrong. Please try again.");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-slate-50 px-4">
      <div className="w-full max-w-md">
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">Log in</h1>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FormField label="Email">
              <input
                required
                type="email"
                className="input"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="you@company.com"
              />
            </FormField>
            <FormField label="Password">
              <input
                required
                type="password"
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="Your password"
              />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Logging in..." : "Log in"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-slate-600">
          Don&apos;t have an organization yet?{" "}
          <Link href="/signup" className="font-medium text-brand-700 underline">
            Create one
          </Link>
        </p>
      </div>
    </main>
  );
}

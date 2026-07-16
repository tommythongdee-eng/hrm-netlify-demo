"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Button, Card, FormField } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useAuth } from "@/lib/auth-context";

export default function SignupPage() {
  const router = useRouter();
  const { setSession } = useAuth();
  const [organizationName, setOrganizationName] = useState("");
  const [ownerName, setOwnerName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const response = await api.registerOrganization({ organizationName, ownerName, email, password });
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
        <h1 className="mb-6 text-center text-2xl font-semibold text-slate-900">Create your organization</h1>
        <Card>
          <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
            <FormField label="Organization name">
              <input
                required
                className="input"
                value={organizationName}
                onChange={(e) => setOrganizationName(e.target.value)}
                placeholder="Demo SME Co."
              />
            </FormField>
            <FormField label="Your name">
              <input
                required
                className="input"
                value={ownerName}
                onChange={(e) => setOwnerName(e.target.value)}
                placeholder="Somchai Jaidee"
              />
            </FormField>
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
                minLength={8}
                className="input"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="At least 8 characters"
              />
            </FormField>

            {error && <p className="text-sm text-red-600">{error}</p>}

            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Creating..." : "Create organization"}
            </Button>
          </form>
        </Card>
        <p className="mt-4 text-center text-sm text-slate-600">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-brand-700 underline">
            Log in
          </Link>
        </p>
      </div>
    </main>
  );
}

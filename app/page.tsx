import Link from "next/link";
import { Button } from "@/components/ui";

export default function HomePage() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center gap-6 bg-gradient-to-b from-brand-50 to-white px-4 text-center">
      <div>
        <h1 className="text-3xl font-bold text-slate-900">HRM for Thai SMEs</h1>
        <p className="mt-2 max-w-lg text-slate-600">
          Employee data, attendance, leave, payroll, performance, training, surveys, and succession
          planning — in one place.
        </p>
      </div>
      <div className="flex gap-3">
        <Link href="/signup">
          <Button>Create your organization</Button>
        </Link>
        <Link href="/login">
          <Button variant="secondary">Log in</Button>
        </Link>
      </div>
    </main>
  );
}

"use client";

import { useEffect, useState } from "react";
import type { PerformanceReviewDto, ReviewCycleDto } from "@hrm/shared";
import { Badge, Button, Card, PageHeader, Tabs } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

export default function PerformancePage() {
  const session = useRequireAuth();
  const isHrOrOwner = session?.user.role === "OWNER" || session?.user.role === "HR_ADMIN";
  const TABS = isHrOrOwner ? (["My Reviews", "Approvals", "Cycles"] as const) : (["My Reviews", "Approvals"] as const);
  const [tab, setTab] = useState<(typeof TABS)[number]>("My Reviews");

  if (!session) return null;

  return (
    <div>
      <PageHeader title="Performance" />
      <Tabs items={TABS.map((t) => ({ key: t, label: t }))} active={tab} onChange={(k) => setTab(k as (typeof TABS)[number])} />

      <div className="mt-6">
        {tab === "My Reviews" && <MyReviewsTab accessToken={session.accessToken} />}
        {tab === "Approvals" && <ApprovalsTab accessToken={session.accessToken} />}
        {tab === "Cycles" && isHrOrOwner && <CyclesTab accessToken={session.accessToken} />}
      </div>
    </div>
  );
}

function MyReviewsTab({ accessToken }: { accessToken: string }) {
  const [reviews, setReviews] = useState<PerformanceReviewDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setReviews(await api.performance.myReviews(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load reviews");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (reviews.length === 0) return <p className="text-sm text-slate-500">No reviews yet.</p>;

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {reviews.map((r) => (
        <li key={r.id} className="px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">{r.cycleName}</p>
            <Badge status={r.status} />
          </div>
          {r.selfRating != null ? (
            <p className="mt-1 text-xs text-slate-500">
              Your rating: {r.selfRating}/5 — {r.selfComments ?? "no comments"}
            </p>
          ) : (
            <SelfReviewForm accessToken={accessToken} reviewId={r.id} onSubmitted={refresh} />
          )}
          {r.managerRating != null && (
            <p className="mt-1 text-xs text-slate-500">
              Manager rating: {r.managerRating}/5 — {r.managerComments ?? "no comments"}
            </p>
          )}
        </li>
      ))}
    </ul>
  );
}

function SelfReviewForm({
  accessToken,
  reviewId,
  onSubmitted,
}: {
  accessToken: string;
  reviewId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(3);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.performance.submitSelfReview(accessToken, reviewId, { selfRating: rating, selfComments: comments || undefined });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-2 flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-sm">
        Self rating (1-5)
        <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Comments
        <input className="input" value={comments} onChange={(e) => setComments(e.target.value)} />
      </label>
      <Button type="submit" className="px-3 py-2" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Submit self-review"}
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

function ApprovalsTab({ accessToken }: { accessToken: string }) {
  const [reviews, setReviews] = useState<PerformanceReviewDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setReviews(await api.performance.pending(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load pending reviews");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (reviews.length === 0) return <p className="text-sm text-slate-500">Nothing pending your review.</p>;

  return (
    <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
      {reviews.map((r) => (
        <li key={r.id} className="px-4 py-3 text-sm">
          <div className="flex items-center justify-between">
            <p className="font-medium">
              {r.employeeName} — {r.cycleName}
            </p>
            <Badge status={r.status} />
          </div>
          {r.selfRating != null && (
            <p className="mt-1 text-xs text-slate-500">
              Self rating: {r.selfRating}/5 — {r.selfComments ?? "no comments"}
            </p>
          )}
          <ManagerReviewForm accessToken={accessToken} reviewId={r.id} onSubmitted={refresh} />
        </li>
      ))}
    </ul>
  );
}

function ManagerReviewForm({
  accessToken,
  reviewId,
  onSubmitted,
}: {
  accessToken: string;
  reviewId: string;
  onSubmitted: () => void;
}) {
  const [rating, setRating] = useState(3);
  const [comments, setComments] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.performance.submitManagerReview(accessToken, reviewId, {
        managerRating: rating,
        managerComments: comments || undefined,
      });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <form className="mt-2 flex flex-wrap items-end gap-3" onSubmit={handleSubmit}>
      <label className="flex flex-col gap-1 text-sm">
        Manager rating (1-5)
        <select className="input" value={rating} onChange={(e) => setRating(Number(e.target.value))}>
          {[1, 2, 3, 4, 5].map((n) => (
            <option key={n} value={n}>
              {n}
            </option>
          ))}
        </select>
      </label>
      <label className="flex flex-col gap-1 text-sm">
        Comments
        <input className="input" value={comments} onChange={(e) => setComments(e.target.value)} />
      </label>
      <Button type="submit" className="px-3 py-2" disabled={isSubmitting}>
        {isSubmitting ? "Submitting..." : "Complete review"}
      </Button>
      {error && <p className="w-full text-xs text-red-600">{error}</p>}
    </form>
  );
}

function CyclesTab({ accessToken }: { accessToken: string }) {
  const [cycles, setCycles] = useState<ReviewCycleDto[]>([]);
  const [name, setName] = useState("");
  const [startDate, setStartDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [endDate, setEndDate] = useState(() => new Date().toISOString().slice(0, 10));
  const [selectedCycleId, setSelectedCycleId] = useState<string | null>(null);
  const [cycleReviews, setCycleReviews] = useState<PerformanceReviewDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setCycles(await api.performance.listCycles(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load cycles");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleCreate(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    try {
      await api.performance.createCycle(accessToken, { name, startDate, endDate });
      setName("");
      await refresh();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create cycle");
    }
  }

  async function handleActivate(id: string) {
    await api.performance.activateCycle(accessToken, id);
    await refresh();
  }

  async function handleClose(id: string) {
    await api.performance.closeCycle(accessToken, id);
    await refresh();
  }

  async function viewCycle(id: string) {
    setSelectedCycleId(id);
    setCycleReviews(await api.performance.forCycle(accessToken, id));
  }

  return (
    <div>
      <Card>
        <form className="flex flex-wrap items-end gap-3" onSubmit={handleCreate}>
          <label className="flex flex-col gap-1 text-sm">
            Cycle name
            <input className="input" value={name} onChange={(e) => setName(e.target.value)} placeholder="H1 2026 Review" />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Start date
            <input type="date" className="input" value={startDate} onChange={(e) => setStartDate(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            End date
            <input type="date" className="input" value={endDate} onChange={(e) => setEndDate(e.target.value)} />
          </label>
          <Button type="submit" disabled={!name}>
            Create cycle
          </Button>
        </form>
        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}
      </Card>

      <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {cycles.map((c) => (
          <li key={c.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="flex items-center gap-2">
              {c.name} — {c.startDate.slice(0, 10)} → {c.endDate.slice(0, 10)} <Badge status={c.status} />
            </span>
            <div className="flex gap-3">
              {c.status === "DRAFT" && (
                <button onClick={() => handleActivate(c.id)} className="text-brand-700 underline">
                  Activate
                </button>
              )}
              {c.status === "ACTIVE" && (
                <button onClick={() => handleClose(c.id)} className="text-brand-700 underline">
                  Close
                </button>
              )}
              <button onClick={() => viewCycle(c.id)} className="text-brand-700 underline">
                View reviews
              </button>
            </div>
          </li>
        ))}
      </ul>

      {selectedCycleId && (
        <div className="mt-6">
          <h2 className="mb-2 font-semibold text-slate-900">Reviews</h2>
          {cycleReviews.length === 0 ? (
            <p className="text-sm text-slate-500">No reviews for this cycle.</p>
          ) : (
            <ul className="divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
              {cycleReviews.map((r) => (
                <li key={r.id} className="flex items-center justify-between px-4 py-2 text-sm">
                  <span>{r.employeeName}</span>
                  <div className="flex items-center gap-3">
                    <span className="text-xs text-slate-500">
                      Self: {r.selfRating ?? "—"} · Manager: {r.managerRating ?? "—"}
                    </span>
                    <Badge status={r.status} />
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { SurveyQuestionType } from "@hrm/shared";
import type { CreateSurveyQuestionInput, SubmitSurveyAnswerInput, SurveyDto, SurveyResultsDto } from "@hrm/shared";
import { Badge, Button, Card, PageHeader, Tabs } from "@/components/ui";
import { api, ApiError } from "@/lib/api-client";
import { useRequireAuth } from "@/lib/auth-context";

const QUESTION_TYPES = Object.values(SurveyQuestionType);

export default function SurveysPage() {
  const session = useRequireAuth();
  const isHrOrOwner = session?.user.role === "OWNER" || session?.user.role === "HR_ADMIN";
  const TABS = isHrOrOwner ? (["Answer Surveys", "Manage"] as const) : (["Answer Surveys"] as const);
  const [tab, setTab] = useState<(typeof TABS)[number]>("Answer Surveys");

  if (!session) return null;

  return (
    <div>
      <PageHeader
        title="Employee Satisfaction Surveys"
        description="Responses are anonymous — no answer is linked back to who submitted it."
      />
      <Tabs items={TABS.map((t) => ({ key: t, label: t }))} active={tab} onChange={(k) => setTab(k as (typeof TABS)[number])} />

      <div className="mt-6">
        {tab === "Answer Surveys" && <AnswerSurveysTab accessToken={session.accessToken} />}
        {tab === "Manage" && isHrOrOwner && <ManageSurveysTab accessToken={session.accessToken} />}
      </div>
    </div>
  );
}

function AnswerSurveysTab({ accessToken }: { accessToken: string }) {
  const [surveys, setSurveys] = useState<SurveyDto[]>([]);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setSurveys(await api.surveys.listOpenForMe(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load surveys");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  if (error) return <p className="text-sm text-red-600">{error}</p>;
  if (surveys.length === 0) return <p className="text-sm text-slate-500">No open surveys for you right now.</p>;

  return (
    <div className="space-y-6">
      {surveys.map((s) => (
        <SurveyAnswerForm key={s.id} accessToken={accessToken} survey={s} onSubmitted={refresh} />
      ))}
    </div>
  );
}

function SurveyAnswerForm({
  accessToken,
  survey,
  onSubmitted,
}: {
  accessToken: string;
  survey: SurveyDto;
  onSubmitted: () => void;
}) {
  const [values, setValues] = useState<Record<string, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      const answers: SubmitSurveyAnswerInput[] = survey.questions.map((q) => {
        const raw = values[q.id] ?? "";
        return q.type === "TEXT"
          ? { questionId: q.id, textValue: raw }
          : { questionId: q.id, numericValue: Number(raw) };
      });
      await api.surveys.submit(accessToken, survey.id, { answers });
      onSubmitted();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to submit response");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card title={survey.title}>
      <form onSubmit={handleSubmit}>
        {survey.description && <p className="-mt-2 mb-4 text-sm text-slate-500">{survey.description}</p>}

        <div className="space-y-4">
          {survey.questions.map((q) => (
            <label key={q.id} className="flex flex-col gap-1 text-sm">
              {q.text}
              {q.type === "TEXT" ? (
                <input
                  required
                  className="input"
                  value={values[q.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [q.id]: e.target.value }))}
                />
              ) : (
                <select
                  required
                  className="input max-w-xs"
                  value={values[q.id] ?? ""}
                  onChange={(e) => setValues((v) => ({ ...v, [q.id]: e.target.value }))}
                >
                  <option value="" disabled>
                    Select...
                  </option>
                  {(q.type === "RATING_1_5" ? [1, 2, 3, 4, 5] : [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10]).map((n) => (
                    <option key={n} value={n}>
                      {n}
                    </option>
                  ))}
                </select>
              )}
            </label>
          ))}
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <Button type="submit" className="mt-4" disabled={isSubmitting}>
          {isSubmitting ? "Submitting..." : "Submit response"}
        </Button>
      </form>
    </Card>
  );
}

function ManageSurveysTab({ accessToken }: { accessToken: string }) {
  const [surveys, setSurveys] = useState<SurveyDto[]>([]);
  const [results, setResults] = useState<SurveyResultsDto | null>(null);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    try {
      setSurveys(await api.surveys.list(accessToken));
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to load surveys");
    }
  }

  useEffect(() => {
    refresh();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function handleOpen(id: string) {
    await api.surveys.open(accessToken, id);
    await refresh();
  }

  async function handleClose(id: string) {
    await api.surveys.close(accessToken, id);
    await refresh();
  }

  async function viewResults(id: string) {
    setResults(await api.surveys.getResults(accessToken, id));
  }

  return (
    <div>
      <CreateSurveyForm accessToken={accessToken} onCreated={refresh} />
      {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

      <ul className="mt-6 divide-y divide-slate-100 rounded-xl border border-slate-200 bg-white">
        {surveys.map((s) => (
          <li key={s.id} className="flex items-center justify-between px-4 py-2 text-sm">
            <span className="flex items-center gap-2">
              {s.title} <Badge status={s.status} /> {s.participantCount}/{s.totalEmployeeCount} responded
            </span>
            <div className="flex gap-3">
              {s.status === "DRAFT" && (
                <button onClick={() => handleOpen(s.id)} className="text-brand-700 underline">
                  Open
                </button>
              )}
              {s.status === "OPEN" && (
                <button onClick={() => handleClose(s.id)} className="text-brand-700 underline">
                  Close
                </button>
              )}
              <button onClick={() => viewResults(s.id)} className="text-brand-700 underline">
                Results
              </button>
            </div>
          </li>
        ))}
      </ul>

      {results && <ResultsPanel results={results} />}
    </div>
  );
}

function ResultsPanel({ results }: { results: SurveyResultsDto }) {
  return (
    <div className="mt-6">
      <h2 className="mb-2 font-semibold text-slate-900">
        Results: {results.title} ({results.participantCount}/{results.totalEmployeeCount} responded)
      </h2>
      <div className="space-y-4">
        {results.questions.map((q) => (
          <Card key={q.questionId}>
            <p className="text-sm font-medium">{q.text}</p>
            {q.type === "TEXT" ? (
              q.textAnswers.length === 0 ? (
                <p className="mt-1 text-xs text-slate-500">No answers yet.</p>
              ) : (
                <ul className="mt-2 list-disc pl-5 text-sm text-slate-700">
                  {q.textAnswers.map((a, i) => (
                    <li key={i}>{a}</li>
                  ))}
                </ul>
              )
            ) : (
              <>
                <p className="mt-1 text-xs text-slate-500">
                  Average: {q.averageValue ?? "—"} ({q.responseCount} responses)
                </p>
                <div className="mt-2 space-y-1">
                  {Object.entries(q.distribution)
                    .sort(([a], [b]) => Number(a) - Number(b))
                    .map(([value, count]) => (
                      <div key={value} className="flex items-center gap-2 text-xs">
                        <span className="w-6 text-right">{value}</span>
                        <div
                          className="h-3 rounded bg-brand-600"
                          style={{ width: `${(count / q.responseCount) * 150 + 4}px` }}
                        />
                        <span>{count}</span>
                      </div>
                    ))}
                </div>
              </>
            )}
          </Card>
        ))}
      </div>
    </div>
  );
}

function CreateSurveyForm({ accessToken, onCreated }: { accessToken: string; onCreated: () => void }) {
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [questions, setQuestions] = useState<CreateSurveyQuestionInput[]>([
    { text: "", type: SurveyQuestionType.RATING_1_5 },
  ]);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  function updateQuestion(index: number, patch: Partial<CreateSurveyQuestionInput>) {
    setQuestions((qs) => qs.map((q, i) => (i === index ? { ...q, ...patch } : q)));
  }

  function addQuestion() {
    setQuestions((qs) => [...qs, { text: "", type: SurveyQuestionType.RATING_1_5 }]);
  }

  function removeQuestion(index: number) {
    setQuestions((qs) => qs.filter((_, i) => i !== index));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setIsSubmitting(true);
    try {
      await api.surveys.create(accessToken, {
        title,
        description: description || undefined,
        questions: questions.filter((q) => q.text.trim().length > 0),
      });
      setTitle("");
      setDescription("");
      setQuestions([{ text: "", type: SurveyQuestionType.RATING_1_5 }]);
      onCreated();
    } catch (err) {
      setError(err instanceof ApiError ? err.message : "Failed to create survey");
    } finally {
      setIsSubmitting(false);
    }
  }

  return (
    <Card title="Create a survey">
      <form onSubmit={handleSubmit}>
        <div className="flex flex-wrap gap-3">
          <label className="flex flex-col gap-1 text-sm">
            Title
            <input required className="input" value={title} onChange={(e) => setTitle(e.target.value)} />
          </label>
          <label className="flex flex-col gap-1 text-sm">
            Description (optional)
            <input className="input" value={description} onChange={(e) => setDescription(e.target.value)} />
          </label>
        </div>

        <div className="mt-4 space-y-2">
          {questions.map((q, i) => (
            <div key={i} className="flex items-end gap-3">
              <label className="flex flex-1 flex-col gap-1 text-sm">
                Question {i + 1}
                <input
                  className="input"
                  value={q.text}
                  onChange={(e) => updateQuestion(i, { text: e.target.value })}
                />
              </label>
              <label className="flex flex-col gap-1 text-sm">
                Type
                <select
                  className="input"
                  value={q.type}
                  onChange={(e) => updateQuestion(i, { type: e.target.value as CreateSurveyQuestionInput["type"] })}
                >
                  {QUESTION_TYPES.map((t) => (
                    <option key={t} value={t}>
                      {t}
                    </option>
                  ))}
                </select>
              </label>
              {questions.length > 1 && (
                <button type="button" onClick={() => removeQuestion(i)} className="pb-2 text-red-600 underline">
                  Remove
                </button>
              )}
            </div>
          ))}
          <button type="button" onClick={addQuestion} className="text-sm text-brand-700 underline">
            + Add question
          </button>
        </div>

        {error && <p className="mt-2 text-sm text-red-600">{error}</p>}

        <Button type="submit" className="mt-4" disabled={isSubmitting || !title}>
          {isSubmitting ? "Creating..." : "Create survey"}
        </Button>
      </form>
    </Card>
  );
}

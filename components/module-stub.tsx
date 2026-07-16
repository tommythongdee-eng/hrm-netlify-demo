export function ModuleStub({ title, phase }: { title: string; phase: string }) {
  return (
    <div>
      <h1 className="text-2xl font-semibold">{title}</h1>
      <p className="mt-2 text-slate-600">Coming in {phase}.</p>
    </div>
  );
}

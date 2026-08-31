export type ScenarioItem = { label: string; value: string };

export function ScenarioOverview({
  title = "Jouw scenario",
  items,
}: {
  title?: string;
  items: ScenarioItem[];
}) {
  if (items.length === 0) return null;

  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <dl className="mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
        {items.map((item) => (
          <div key={item.label} className="flex items-baseline justify-between gap-4">
            <dt className="text-xs text-muted-foreground">{item.label}</dt>
            <dd className="text-sm font-medium text-foreground">{item.value}</dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

export type ScenarioItem = { label: string; value: string };

export function ScenarioOverview({
  title = "Jouw scenario",
  items,
  compact = false,
}: {
  title?: string;
  items: ScenarioItem[];
  compact?: boolean;
}) {
  if (items.length === 0) return null;

  return (
    <section className={compact ? "" : "rounded-xl border border-border bg-card p-4"}>
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <dl
        className={
          compact
            ? "mt-3 grid grid-cols-1 gap-x-8 md:grid-cols-2"
            : "mt-3 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2"
        }
      >
        {items.map((item) => (
          <div
            key={item.label}
            className={
              compact
                ? "grid grid-cols-[minmax(0,1fr)_auto] items-start gap-4 border-t border-border/70 py-3"
                : "flex items-baseline justify-between gap-4"
            }
          >
            <dt className="text-xs leading-5 text-muted-foreground">{item.label}</dt>
            <dd className="max-w-[12rem] text-right text-sm font-medium leading-5 text-foreground">
              {item.value}
            </dd>
          </div>
        ))}
      </dl>
    </section>
  );
}

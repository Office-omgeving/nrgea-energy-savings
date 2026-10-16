export function KpiCard({
  label,
  value,
  hint,
  compact = false,
}: {
  label: string;
  value: string;
  hint?: string | undefined;
  compact?: boolean;
}) {
  if (compact) {
    return (
      <div className="min-w-0 px-4 py-4 first:pt-0 last:pb-0 sm:px-5 sm:py-0 sm:first:pl-0 sm:last:pr-0">
        <p className="text-xs font-medium leading-5 text-muted-foreground">{label}</p>
        <p className="mt-0.5 font-display text-lg font-semibold leading-snug text-foreground sm:text-xl">
          {value}
        </p>
        {hint ? <p className="mt-1 text-xs leading-relaxed text-muted-foreground">{hint}</p> : null}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-border bg-card p-4">
      <p className="text-xs font-medium text-muted-foreground">{label}</p>
      <p className="mt-1 font-display text-xl font-semibold text-foreground">{value}</p>
      {hint ? <p className="mt-1 text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

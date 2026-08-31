export function WizardNavigation({
  onPrev,
  onNext,
  prevDisabled,
  nextLabel = "Volgende",
  nextDisabled,
}: {
  onPrev: () => void;
  onNext: () => void;
  prevDisabled?: boolean;
  nextLabel?: string;
  nextDisabled?: boolean;
}) {
  return (
    <div className="sticky bottom-0 z-10 -mx-5 mt-6 flex items-center justify-between gap-3 border-t border-border bg-card/95 px-5 py-3 backdrop-blur md:static md:mx-0 md:border-0 md:bg-transparent md:px-0 md:backdrop-blur-none">
      <button
        type="button"
        onClick={onPrev}
        disabled={prevDisabled}
        className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground transition-colors hover:bg-muted disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        Vorige
      </button>
      <button
        type="button"
        onClick={onNext}
        disabled={nextDisabled}
        className="inline-flex h-11 min-h-[44px] items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-40 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
      >
        {nextLabel}
      </button>
    </div>
  );
}

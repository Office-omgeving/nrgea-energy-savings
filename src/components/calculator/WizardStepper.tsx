import { cn } from "@/lib/utils";

export function WizardStepper({
  steps,
  current,
}: {
  steps: string[];
  current: number;
}) {
  return (
    <nav aria-label="Voortgang" className="w-full">
      {/* Desktop / tablet */}
      <ol className="hidden items-center gap-2 sm:flex">
        {steps.map((step, index) => {
          const state = index === current ? "current" : index < current ? "done" : "todo";
          return (
            <li key={step} className="flex flex-1 items-center gap-2">
              <span
                className={cn(
                  "flex h-7 w-7 shrink-0 items-center justify-center rounded-full text-xs font-semibold",
                  state === "current" && "bg-primary text-primary-foreground",
                  state === "done" && "bg-accent text-accent-foreground",
                  state === "todo" && "bg-muted text-muted-foreground",
                )}
              >
                {index + 1}
              </span>
              <span
                className={cn(
                  "truncate text-xs font-medium",
                  state === "todo" ? "text-muted-foreground" : "text-foreground",
                )}
              >
                {step}
              </span>
              {index < steps.length - 1 ? (
                <span className="h-px flex-1 bg-border" aria-hidden="true" />
              ) : null}
            </li>
          );
        })}
      </ol>

      {/* Mobiel: compacte stepper zonder overflow */}
      <div className="sm:hidden">
        <div className="flex items-center justify-between text-xs font-medium text-muted-foreground">
          <span className="text-foreground">{steps[current]}</span>
          <span>
            Stap {current + 1} / {steps.length}
          </span>
        </div>
        <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
          <div
            className="h-full rounded-full bg-primary transition-all"
            style={{ width: `${((current + 1) / steps.length) * 100}%` }}
          />
        </div>
      </div>
    </nav>
  );
}

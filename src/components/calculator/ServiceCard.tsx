import type { CalculatorService } from "@/config/calculatorServices";
import { cn } from "@/lib/utils";
import { ArrowRight } from "lucide-react";

export function ServiceCard({
  service,
  onOpen,
}: {
  service: CalculatorService;
  onOpen: (slug: string) => void;
}) {
  const Icon = service.icon;

  return (
    <button
      type="button"
      onClick={() => onOpen(service.slug)}
      className={cn(
        "group relative flex min-h-[230px] w-full flex-col rounded-2xl border border-border bg-card p-6 text-left",
        "transition-colors duration-200 hover:border-primary hover:bg-secondary",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span className="flex h-12 w-12 shrink-0 items-center justify-center rounded-2xl bg-primary">
          <Icon className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden="true" />
        </span>
        {service.badge ? (
          <span className="rounded-full bg-mint-soft px-3 py-1 text-[11px] font-medium text-forest">
            {service.badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-5 font-display text-lg font-medium leading-snug text-foreground">
        {service.title}
      </h3>
      {service.subtitle ? (
        <p className="mt-0.5 text-xs font-medium text-primary">{service.subtitle}</p>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">{service.description}</p>

      <span className="mt-auto inline-flex items-center gap-2 pt-5 text-sm font-medium text-primary">
        Start simulatie
        <ArrowRight
          className="h-4 w-4 transition-transform group-hover:translate-x-1"
          aria-hidden="true"
        />
      </span>
    </button>
  );
}

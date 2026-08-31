import type { CalculatorService } from "@/config/calculatorServices";
import { cn } from "@/lib/utils";

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
        "group relative flex min-h-[210px] w-full flex-col rounded-[15px] border border-border bg-card p-5 text-left",
        "shadow-[0_1px_2px_rgba(10,39,34,0.05)] transition-all duration-200",
        "hover:-translate-y-[3px] hover:shadow-[0_8px_20px_rgba(10,39,34,0.09)]",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background",
      )}
    >
      <div className="flex items-start justify-between gap-3">
        <span
          className={cn(
            "flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br",
            service.accent,
          )}
        >
          <Icon className="h-6 w-6 text-white" strokeWidth={1.75} aria-hidden="true" />
        </span>
        {service.badge ? (
          <span className="rounded-full bg-highlight px-2.5 py-1 text-[11px] font-semibold text-forest">
            {service.badge}
          </span>
        ) : null}
      </div>

      <h3 className="mt-4 font-display text-base font-semibold leading-snug text-foreground">
        {service.title}
      </h3>
      {service.subtitle ? (
        <p className="mt-0.5 text-xs font-medium text-primary">{service.subtitle}</p>
      ) : null}
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        {service.description}
      </p>

      <span className="mt-auto pt-4 text-sm font-medium text-muted-foreground transition-colors group-hover:text-primary">
        Start simulatie →
      </span>
    </button>
  );
}

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

export function OptionCard({
  label,
  description,
  icon: Icon,
  selected,
  onSelect,
}: {
  label: string;
  description?: string;
  icon?: LucideIcon;
  selected?: boolean;
  onSelect: () => void;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={!!selected}
      onClick={onSelect}
      className={cn(
        "flex min-h-[56px] w-full items-start gap-3 rounded-xl border bg-card p-4 text-left transition-all",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2",
        selected
          ? "border-primary bg-secondary shadow-[0_0_0_1px_var(--color-primary)]"
          : "border-border hover:border-primary/50",
      )}
    >
      {Icon ? <Icon className="mt-0.5 h-5 w-5 shrink-0 text-primary" aria-hidden="true" /> : null}
      <span>
        <span className="block text-sm font-semibold text-foreground">{label}</span>
        {description ? (
          <span className="mt-0.5 block text-xs leading-relaxed text-muted-foreground">
            {description}
          </span>
        ) : null}
      </span>
    </button>
  );
}

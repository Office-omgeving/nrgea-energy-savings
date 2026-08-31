import type { LucideIcon } from "lucide-react";
import { OptionCard } from "./OptionCard";

export type RadioCardOption = {
  value: string;
  label: string;
  description?: string;
  icon?: LucideIcon;
};

export function RadioCards({
  legend,
  options,
  value,
  onChange,
  columns = 2,
}: {
  legend?: string;
  options: RadioCardOption[];
  value?: string;
  onChange: (value: string) => void;
  columns?: 1 | 2 | 3;
}) {
  const cols =
    columns === 1 ? "grid-cols-1" : columns === 3 ? "sm:grid-cols-3" : "sm:grid-cols-2";

  return (
    <fieldset>
      {legend ? (
        <legend className="mb-2 text-sm font-semibold text-foreground">{legend}</legend>
      ) : null}
      <div role="radiogroup" className={`grid grid-cols-1 gap-3 ${cols}`}>
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            icon={option.icon}
            selected={value === option.value}
            onSelect={() => onChange(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

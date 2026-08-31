import { OptionCard } from "../OptionCard";

export type MultiOption = { value: string; label: string; description?: string };

/**
 * Multiselect met "geen van deze"-gedrag: exclusieve waarden wissen de rest.
 */
export function MultiSelectCards({
  legend,
  options,
  values,
  onChange,
  exclusive = [],
  columns = 2,
}: {
  legend?: string;
  options: MultiOption[];
  values: string[];
  onChange: (values: string[]) => void;
  exclusive?: string[];
  columns?: 1 | 2;
}) {
  const toggle = (value: string) => {
    if (exclusive.includes(value)) {
      onChange(values.includes(value) ? [] : [value]);
      return;
    }
    const next = values.includes(value)
      ? values.filter((v) => v !== value)
      : [...values.filter((v) => !exclusive.includes(v)), value];
    onChange(next);
  };

  return (
    <fieldset>
      {legend ? (
        <legend className="mb-2 text-sm font-semibold text-foreground">{legend}</legend>
      ) : null}
      <div className={`grid grid-cols-1 gap-3 ${columns === 2 ? "sm:grid-cols-2" : ""}`}>
        {options.map((option) => (
          <OptionCard
            key={option.value}
            label={option.label}
            description={option.description}
            selected={values.includes(option.value)}
            onSelect={() => toggle(option.value)}
          />
        ))}
      </div>
    </fieldset>
  );
}

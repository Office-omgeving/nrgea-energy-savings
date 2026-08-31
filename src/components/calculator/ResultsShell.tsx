import type { ReactNode } from "react";
import { ScenarioOverview, type ScenarioItem } from "./ScenarioOverview";

/** Gedeelde resultaatshell: elke dienstflow vult de secties die relevant zijn. */
export function ResultsShell({
  title = "Jouw resultaat",
  scenario,
  summary,
  advice,
  kpis,
  chart,
  disclaimer = "Deze simulatie is een indicatieve raming op basis van je antwoorden en gemiddelde marktgegevens. Er kunnen geen rechten aan worden ontleend.",
  onRequestAdvice,
  onRestart,
  onBackToOverview,
}: {
  title?: string;
  scenario?: ScenarioItem[];
  summary?: ReactNode;
  advice?: ReactNode;
  kpis?: ReactNode;
  chart?: ReactNode;
  disclaimer?: string;
  onRequestAdvice?: () => void;
  onRestart: () => void;
  onBackToOverview: () => void;
}) {
  return (
    <div className="space-y-5">
      <h2 className="font-display text-xl font-semibold text-foreground">{title}</h2>

      {scenario && scenario.length > 0 ? <ScenarioOverview items={scenario} /> : null}
      {summary}
      {kpis ? <div className="grid grid-cols-2 gap-3 lg:grid-cols-4">{kpis}</div> : null}
      {chart}
      {advice}

      <p className="text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        {onRequestAdvice ? (
          <button
            type="button"
            onClick={onRequestAdvice}
            className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground hover:opacity-90"
          >
            Vraag persoonlijk advies
          </button>
        ) : null}
        <button
          type="button"
          onClick={onRestart}
          className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground hover:bg-muted"
        >
          Nieuwe simulatie
        </button>
        <button
          type="button"
          onClick={onBackToOverview}
          className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
        >
          Terug naar alle simulaties
        </button>
      </div>
    </div>
  );
}

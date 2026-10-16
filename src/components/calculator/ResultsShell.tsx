import type { ReactNode } from "react";
import { ScenarioOverview, type ScenarioItem } from "./ScenarioOverview";

/** Gedeelde resultaatshell: elke dienstflow vult de secties die relevant zijn. */
export function ResultsShell({
  title = "Jouw resultaat",
  variant = "default",
  price,
  scenario,
  scenarioDetails,
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
  variant?: "default" | "facade";
  price?: { value: string; label?: string; hint?: string };
  scenario?: ScenarioItem[] | undefined;
  scenarioDetails?: ScenarioItem[] | undefined;
  summary?: ReactNode;
  advice?: ReactNode;
  kpis?: ReactNode;
  chart?: ReactNode;
  disclaimer?: string;
  onRequestAdvice?: () => void;
  onRestart: () => void;
  onBackToOverview: () => void;
}) {
  const isFacade = variant === "facade";

  if (isFacade) {
    return (
      <div className="space-y-6 sm:space-y-7">
        <div>
          <h2 className="font-display text-2xl font-semibold tracking-tight text-foreground sm:text-3xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-2xl text-sm leading-relaxed text-muted-foreground">
            Een eerste prijsindicatie op basis van je woning, geveloppervlakte en gekozen aanpak.
          </p>
        </div>

        {price ? (
          <section className="grid gap-5 rounded-2xl bg-forest px-5 py-6 text-white sm:px-7 sm:py-7 md:grid-cols-[minmax(0,1.2fr)_minmax(15rem,0.8fr)] md:items-end md:gap-8">
            <div className="min-w-0">
              <p className="text-sm font-medium text-white/75">
                {price.label ?? "Richtprijs inclusief plaatsing"}
              </p>
              <p className="mt-2 font-display text-[clamp(2.15rem,8vw,3.35rem)] font-semibold leading-[1.05] tracking-[-0.025em] tabular-nums">
                {price.value}
              </p>
            </div>
            {price.hint ? (
              <p className="border-t border-white/20 pt-4 text-sm leading-relaxed text-white/70 md:border-l md:border-t-0 md:pb-1 md:pl-6 md:pt-0">
                {price.hint}
              </p>
            ) : null}
          </section>
        ) : null}

        {summary}

        {kpis ? (
          <section aria-label="Kerncijfers" className="border-y border-border py-5">
            <div className="grid grid-cols-1 divide-y divide-border sm:grid-cols-3 sm:divide-x sm:divide-y-0">
              {kpis}
            </div>
          </section>
        ) : null}

        {chart}
        {advice}

        {scenario && scenario.length > 0 ? (
          <ScenarioOverview title="Berekening in het kort" items={scenario} compact />
        ) : null}

        {scenarioDetails && scenarioDetails.length > 0 ? (
          <details className="group border-t border-border pt-4">
            <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-4 text-sm font-semibold text-foreground marker:hidden focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring">
              Bekijk alle ingevoerde gegevens
              <span
                aria-hidden="true"
                className="text-lg font-normal text-primary transition-transform group-open:rotate-45"
              >
                +
              </span>
            </summary>
            <div className="pb-2 pt-2">
              <ScenarioOverview title="Jouw antwoorden" items={scenarioDetails} compact />
            </div>
          </details>
        ) : null}

        <p className="max-w-2xl text-xs leading-relaxed text-muted-foreground">{disclaimer}</p>

        <div className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center">
          {onRequestAdvice ? (
            <button
              type="button"
              onClick={onRequestAdvice}
              className="inline-flex h-12 items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2"
            >
              Vraag persoonlijk advies
            </button>
          ) : null}
          <button
            type="button"
            onClick={onRestart}
            className="inline-flex h-12 items-center justify-center rounded-xl border border-border bg-card px-6 text-sm font-medium text-foreground transition-colors hover:bg-muted focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            Nieuwe simulatie
          </button>
          <button
            type="button"
            onClick={onBackToOverview}
            className="min-h-11 text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring sm:px-2"
          >
            Terug naar alle simulaties
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <h2 className="font-display text-2xl font-medium tracking-tight text-foreground">{title}</h2>

      {price ? (
        <section className="rounded-2xl bg-forest px-6 py-7 text-white sm:px-8 sm:py-8">
          <div className="mb-5 h-1 w-14 rounded-full bg-primary" aria-hidden="true" />
          <p className="text-xs font-medium uppercase tracking-[0.14em] text-white/60">
            {price.label ?? "Richtprijs investering"}
          </p>
          <p className="mt-2 font-display text-4xl font-medium leading-none tracking-[-0.025em] sm:text-5xl">
            {price.value}
          </p>
          {price.hint ? <p className="mt-3 max-w-xl text-sm text-white/60">{price.hint}</p> : null}
        </section>
      ) : null}

      {scenario && scenario.length > 0 ? <ScenarioOverview items={scenario} /> : null}
      {summary}
      {kpis ? <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">{kpis}</div> : null}
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

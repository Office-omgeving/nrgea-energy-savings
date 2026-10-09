import { AirVent, Droplets, GitMerge, Leaf, ThermometerSun } from "lucide-react";
import { useMemo, useState } from "react";

import type { ServiceComponentProps } from "@/config/calculatorServices";
import { useWizardState } from "@/hooks/useWizardState";
import {
  calculatePremium,
  getIncomeThresholds,
  PREMIUM_PRODUCTS,
  type HouseholdType,
  type IncomeCategory,
  type PremiumProduct,
} from "@/lib/premiumCalculations";
import { submitCalculatorLead } from "@/services/submitCalculatorLead";
import { CalculatorWizardShell } from "../CalculatorWizardShell";
import { ContactForm, type ContactFormValues } from "../ContactForm";
import { measureAndPost } from "../IframeResizeReporter";
import { InfoNotice } from "../Notices";
import { RadioCards, type RadioCardOption } from "../RadioCards";
import { ResultsShell } from "../ResultsShell";
import { ScenarioOverview } from "../ScenarioOverview";
import { KpiCard } from "../KpiCard";
import { WizardNavigation } from "../WizardNavigation";

type PremiumPhase =
  "product" | "dwelling" | "household" | "dependents" | "income" | "contact" | "result";

type PremiumAnswers = Record<string, unknown> & {
  product: PremiumProduct | "";
  dwellingEligible: "yes" | "no" | "";
  household: HouseholdType | "";
  dependents: number | "";
  incomeCategory: IncomeCategory | "";
};

const INITIAL: PremiumAnswers = {
  product: "",
  dwellingEligible: "",
  household: "",
  dependents: "",
  incomeCategory: "",
};

const PHASE_LABELS: Record<PremiumPhase, string> = {
  product: "Product",
  dwelling: "Woning",
  household: "Gezin",
  dependents: "Ten laste",
  income: "Inkomen",
  contact: "Gegevens",
  result: "Resultaat",
};

const PRODUCT_OPTIONS: RadioCardOption[] = [
  {
    value: "geothermal",
    label: PREMIUM_PRODUCTS.geothermal.label,
    description: PREMIUM_PRODUCTS.geothermal.description,
    icon: Leaf,
  },
  {
    value: "air-water",
    label: PREMIUM_PRODUCTS["air-water"].label,
    description: PREMIUM_PRODUCTS["air-water"].description,
    icon: ThermometerSun,
  },
  {
    value: "heat-pump-boiler",
    label: PREMIUM_PRODUCTS["heat-pump-boiler"].label,
    description: PREMIUM_PRODUCTS["heat-pump-boiler"].description,
    icon: Droplets,
  },
  {
    value: "hybrid",
    label: PREMIUM_PRODUCTS.hybrid.label,
    description: PREMIUM_PRODUCTS.hybrid.description,
    icon: GitMerge,
  },
  {
    value: "air-air",
    label: PREMIUM_PRODUCTS["air-air"].label,
    description: PREMIUM_PRODUCTS["air-air"].description,
    icon: AirVent,
  },
];

const euro = (value: number) =>
  new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

function QuestionError({ message }: { message: string }) {
  return (
    <p role="alert" className="mt-2 text-xs font-medium text-destructive">
      {message}
    </p>
  );
}

export function PremiumWizard({ service, onBackToOverview }: ServiceComponentProps) {
  const { state, update, reset } = useWizardState<PremiumAnswers>(service.id, INITIAL);
  const [phase, setPhase] = useState<PremiumPhase>("product");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<ContactFormValues | null>(null);

  const eligible = state.dwellingEligible === "yes";
  const ineligible = state.dwellingEligible === "no";
  const phases: PremiumPhase[] = ineligible
    ? ["product", "dwelling", "contact", "result"]
    : ["product", "dwelling", "household", "dependents", "income", "contact", "result"];
  const currentStep = Math.max(0, phases.indexOf(phase));

  const dependents = typeof state.dependents === "number" ? state.dependents : 0;
  const thresholds = useMemo(
    () => getIncomeThresholds(state.household || "single", dependents),
    [dependents, state.household],
  );

  const incomeOptions: RadioCardOption[] = useMemo(
    () => [
      {
        value: "cat4",
        label: "Categorie 4 — laagste inkomen",
        description: `Netto belastbaar gezinsinkomen tot en met ${euro(thresholds.cat4)}.`,
      },
      {
        value: "cat3",
        label: "Categorie 3 — laag inkomen",
        description: `Meer dan ${euro(thresholds.cat4)} en tot en met ${euro(thresholds.cat3)}.`,
      },
      {
        value: "cat2",
        label: "Categorie 2 — middeninkomen",
        description: `Meer dan ${euro(thresholds.cat3)} en tot en met ${euro(thresholds.cat2)}.`,
      },
      {
        value: "cat1",
        label: "Categorie 1 — hoogste inkomen",
        description: `Meer dan ${euro(thresholds.cat2)}.`,
      },
    ],
    [thresholds],
  );

  const goTo = (next: PremiumPhase) => {
    setError("");
    setPhase(next);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(measureAndPost);
  };

  const requireChoice = (value: unknown, next: PremiumPhase, message = "Maak een keuze.") => {
    if (value === "" || value === undefined || value === null) {
      setError(message);
      requestAnimationFrame(measureAndPost);
      return;
    }
    goTo(next);
  };

  const product = state.product || "air-water";
  const category = state.incomeCategory || "cat1";
  const calculation = calculatePremium({ product, category, eligible });
  const productConfig = PREMIUM_PRODUCTS[product];
  const categoryLabel = incomeOptions.find((option) => option.value === category)?.label ?? "—";
  const scenario = [
    { label: "Installatie", value: productConfig.label },
    {
      label: "Leeftijdsvoorwaarde woning",
      value: eligible ? "Voldoet waarschijnlijk" : "Voldoet waarschijnlijk niet",
    },
    ...(eligible
      ? [
          {
            label: "Gezinssituatie",
            value: state.household === "couple" ? "Koppel / samenwonend" : "Alleenstaand",
          },
          {
            label: "Personen ten laste",
            value: dependents === 4 ? "4 of meer" : String(dependents),
          },
          { label: "Inkomenscategorie", value: categoryLabel.split(" — ")[0] },
        ]
      : []),
  ];

  return (
    <CalculatorWizardShell
      title={service.title}
      description="Bereken je indicatieve Vlaamse premie voor een warmtepomp of warmtepompboiler."
      steps={phases.map((item) => PHASE_LABELS[item])}
      currentStep={currentStep}
      onBackToOverview={onBackToOverview}
    >
      {phase === "product" ? (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Welk toestel wil je plaatsen?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              De basispremie verschilt per type warmtepomp.
            </p>
          </div>
          <RadioCards
            value={state.product}
            onChange={(value) => {
              update({ product: value as PremiumProduct });
              setError("");
            }}
            columns={1}
            options={PRODUCT_OPTIONS}
          />
          {error ? <QuestionError message={error} /> : null}
          <WizardNavigation
            onPrev={onBackToOverview}
            onNext={() => requireChoice(state.product, "dwelling")}
          />
        </div>
      ) : null}

      {phase === "dwelling" ? (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Voldoet je woning aan de leeftijdsvoorwaarde?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              De woning is aangesloten op het elektriciteitsnet vóór 1 januari 2014, of de
              omgevingsvergunning dateert van meer dan vijf jaar vóór de eindfactuur en voldoet aan
              de EPB-voorwaarden.
            </p>
          </div>
          <RadioCards
            value={state.dwellingEligible}
            onChange={(value) => {
              update({ dwellingEligible: value as "yes" | "no" });
              setError("");
            }}
            options={[
              { value: "yes", label: "Ja", description: "Mijn woning voldoet hieraan." },
              {
                value: "no",
                label: "Nee of onzeker",
                description: "Mijn woning voldoet niet of ik weet het niet zeker.",
              },
            ]}
          />
          {error ? <QuestionError message={error} /> : null}
          <WizardNavigation
            onPrev={() => goTo("product")}
            onNext={() => {
              if (!state.dwellingEligible) {
                setError("Maak een keuze.");
                return;
              }
              goTo(state.dwellingEligible === "yes" ? "household" : "contact");
            }}
          />
        </div>
      ) : null}

      {phase === "household" ? (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Wat is je gezinssituatie?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              De inkomensgrenzen hangen af van je gezinssituatie.
            </p>
          </div>
          <RadioCards
            value={state.household}
            onChange={(value) => {
              update({ household: value as HouseholdType, incomeCategory: "" });
              setError("");
            }}
            options={[
              { value: "single", label: "Alleenstaand", description: "Eén belastbaar inkomen." },
              {
                value: "couple",
                label: "Koppel / samenwonend",
                description: "Het gezamenlijke belastbare inkomen.",
              },
            ]}
          />
          {error ? <QuestionError message={error} /> : null}
          <WizardNavigation
            onPrev={() => goTo("dwelling")}
            onNext={() => requireChoice(state.household, "dependents")}
          />
        </div>
      ) : null}

      {phase === "dependents" ? (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Hoeveel personen heb je ten laste?
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Elke bijkomende persoon ten laste verhoogt de inkomensgrenzen.
            </p>
          </div>
          <RadioCards
            value={state.dependents === "" ? "" : String(state.dependents)}
            onChange={(value) => {
              update({ dependents: Number(value), incomeCategory: "" });
              setError("");
            }}
            columns={3}
            options={[0, 1, 2, 3, 4].map((value) => ({
              value: String(value),
              label: value === 4 ? "4 of meer" : String(value),
              description: value === 0 ? "Geen" : value === 1 ? "1 persoon" : `${value} personen`,
            }))}
          />
          {error ? <QuestionError message={error} /> : null}
          <WizardNavigation
            onPrev={() => goTo("household")}
            onNext={() => requireChoice(state.dependents, "income")}
          />
        </div>
      ) : null}

      {phase === "income" ? (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              In welke inkomenscategorie val je?
            </h3>
            <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
              Gebruik het gezamenlijk netto belastbaar inkomen op je laatst beschikbare
              aanslagbiljet.
            </p>
          </div>
          <RadioCards
            value={state.incomeCategory}
            onChange={(value) => {
              update({ incomeCategory: value as IncomeCategory });
              setError("");
            }}
            columns={1}
            options={incomeOptions}
          />
          {error ? <QuestionError message={error} /> : null}
          <InfoNotice>
            Heb je naast deze woning nog een woning, appartement of bouwgrond volledig in volle
            eigendom? Dan val je normaal automatisch in categorie 1.
          </InfoNotice>
          <WizardNavigation
            onPrev={() => goTo("dependents")}
            onNext={() => requireChoice(state.incomeCategory, "contact")}
            nextLabel="Naar mijn gegevens"
          />
        </div>
      ) : null}

      {phase === "contact" ? (
        <div className="space-y-4">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Ontvang je premieberekening
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Vul je gegevens in om het indicatieve resultaat te bekijken.
            </p>
          </div>
          <ContactForm
            submitting={submitting}
            onSubmit={async (values) => {
              setSubmitting(true);
              await submitCalculatorLead({
                serviceId: service.id,
                contact: values,
                answers: state,
              });
              setSubmitting(false);
              setLead(values);
              goTo("result");
            }}
          />
          <button
            type="button"
            onClick={() => goTo(eligible ? "income" : "dwelling")}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Vorige
          </button>
        </div>
      ) : null}

      {phase === "result" ? (
        <ResultsShell
          title="Jouw premieberekening"
          price={{
            label: "Geschatte Mijn VerbouwPremie",
            value: euro(calculation.premium),
            hint: eligible
              ? `Indicatief op basis van een richtkost van ${euro(calculation.referenceInvestment)}.`
              : "Op basis van je antwoord voldoet de woning waarschijnlijk niet aan de leeftijdsvoorwaarde.",
          }}
          scenario={scenario}
          summary={
            <InfoNotice>
              {eligible
                ? `Voor ${lead?.firstName ?? "jouw situatie"} ramen we de premie op ${euro(calculation.premium)}. Het definitieve bedrag wordt berekend op het netto factuurbedrag exclusief btw en na controle van alle voorwaarden.`
                : "Voor deze woning ramen we momenteel geen Mijn VerbouwPremie. Laat de leeftijdsvoorwaarde controleren als je hierover twijfelt."}
            </InfoNotice>
          }
          kpis={
            eligible ? (
              <>
                <KpiCard label="Basisbedrag" value={euro(calculation.basisAmount)} />
                <KpiCard
                  label="Maximum factuuraandeel"
                  value={`${Math.round(calculation.maxPercentage * 100)}%`}
                  hint="Van de nettofactuur excl. btw"
                />
                <KpiCard label="Inkomenscategorie" value={categoryLabel.split(" — ")[0] ?? categoryLabel} />
              </>
            ) : undefined
          }
          advice={
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Belangrijk bij deze raming</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                De berekening volgt de Vlaamse regeling voor aanvragen vanaf 1 maart 2026. Een
                eventuele verhoging voor de vervanging van elektrische weerstandsverwarming of een
                gebied zonder aardgas is niet meegerekend. Ook technische productvoorwaarden en
                eerdere premies kunnen het uiteindelijke bedrag beïnvloeden.
              </p>
              <a
                href="https://www.vlaanderen.be/bouwen-wonen-en-energie/bouwen-en-verbouwen/premies-voor-renovatie/mijn-verbouwpremie/mijn-verbouwpremie-voor-warmtepomp"
                target="_blank"
                rel="noreferrer"
                className="mt-3 inline-block text-sm font-medium text-primary underline-offset-4 hover:underline"
              >
                Bekijk de officiële voorwaarden
              </a>
            </section>
          }
          disclaimer="Indicatieve berekening volgens de gekende Vlaamse voorwaarden voor aanvragen vanaf 1 maart 2026. Aan deze raming kunnen geen rechten worden ontleend."
          onRestart={() => {
            reset();
            setLead(null);
            goTo("product");
          }}
          onBackToOverview={onBackToOverview}
        />
      ) : null}
    </CalculatorWizardShell>
  );
}

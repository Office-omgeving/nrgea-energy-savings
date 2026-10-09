import { useMemo, useState, type ReactNode } from "react";
import { BatteryCharging, Check, Sun, Zap } from "lucide-react";

import type { ServiceComponentProps } from "@/config/calculatorServices";
import { useWizardState } from "@/hooks/useWizardState";
import {
  BATTERY_CONFIG,
  INVERTER_TEXT,
  batteryAccuracy,
  batteryPrice,
  computeSavings,
  deviationWarning,
  energyFlow,
  estimatePv,
  inverterCheck,
  paybackYears,
  recommendCapacity,
  type BackupPref,
  type ContractType,
  type Goal,
  type HasPv,
  type InstallAge,
  type InstallPeriod,
  type MeterType,
  type Phase,
  type PvKnowledge,
  type PvPlan,
  type SmartPref,
} from "@/lib/battery/battery";
import type { ChangeTag } from "@/lib/solar/types";
import { submitCalculatorLead } from "@/services/submitCalculatorLead";
import { CalculatorWizardShell } from "../CalculatorWizardShell";
import { ContactForm } from "../ContactForm";
import { measureAndPost } from "../IframeResizeReporter";
import { KpiCard } from "../KpiCard";
import { InfoNotice, WarningNotice } from "../Notices";
import { NumberField } from "../NumberField";
import { RadioCards } from "../RadioCards";
import { ResultsShell } from "../ResultsShell";
import { ScenarioOverview } from "../ScenarioOverview";
import { WizardNavigation } from "../WizardNavigation";
import {
  ConsumptionEstimator,
  INITIAL_CONSUMPTION,
  useResolvedConsumption,
  type ConsumptionState,
} from "../shared/ConsumptionEstimator";
import { AdvancedSection } from "../solar/AdvancedSection";
import { MultiSelectCards } from "../solar/MultiSelectCards";

const STEPS = [
  "Zonnepanelen",
  "Verbruik",
  "Energiesituatie",
  "Voorkeuren",
  "Advies",
  "Overzicht",
  "Gegevens",
  "Resultaat",
];

type State = ConsumptionState & {
  hasPv: HasPv | "";
  pvKnowledge: PvKnowledge | "";
  annualProduction: number | "";
  panels: number | "";
  installPeriod: InstallPeriod | "";
  exactWp: number | "";
  pvPlan: PvPlan | "";
  meter: MeterType | "";
  contract: ContractType | "";
  phase: Phase | "";
  installAge: InstallAge | "";
  goal: Goal | "";
  backup: BackupPref | "";
  smart: SmartPref | "";
  capacityOverride: number | "";
};

const INITIAL: State = {
  ...INITIAL_CONSUMPTION,
  hasPv: "",
  pvKnowledge: "",
  annualProduction: "",
  panels: "",
  installPeriod: "",
  exactWp: "",
  pvPlan: "",
  meter: "",
  contract: "",
  phase: "",
  installAge: "",
  goal: "",
  backup: "",
  smart: "",
  capacityOverride: "",
};

const nf = new Intl.NumberFormat("nl-BE");
const euro = (v: number) =>
  new Intl.NumberFormat("nl-BE", { style: "currency", currency: "EUR", maximumFractionDigits: 0 }).format(v);
const kwh = (v: number) => `${nf.format(Math.round(v))} kWh`;
const pct = (v: number) => `${Math.round(v * 100)}%`;

const LABELS = {
  hasPv: { yes: "Ja", no: "Nee", soon: "Binnenkort geplaatst", unknown: "Nog niet bekend" },
  period: {
    pre2015: "Vóór 2015",
    "2015to2019": "Tussen 2015 en 2019",
    "2020to2022": "Tussen 2020 en 2022",
    "2023plus": "In 2023 of later",
    unknown: "Onbekend",
  },
  meter: { yes: "Ja", no: "Nee", unknown: "Onbekend" },
  contract: { fixed: "Vast tarief", variable: "Variabel tarief", dynamic: "Dynamisch tarief", unknown: "Onbekend" },
  phase: { mono: "Monofase", three: "Driefase", unknown: "Nog te controleren" },
  goal: {
    selfUse: "Meer eigen zonnestroom gebruiken",
    balanced: "Balans tussen prijs en opslag",
    cheapHours: "Profiteren van goedkope energiemomenten",
    backup: "Extra reserve bij stroomuitval",
    advice: "Nrgea adviseert",
  },
  backup: {
    few: "Enkele belangrijke toestellen",
    large: "Groter deel van de woning",
    no: "Nee",
    unknown: "Nog niet bekend",
  },
  smart: { yes: "Ja", no: "Nee", info: "Advies", advice: "Advies" },
  source: { exact: "Exact in kWh", cost: "Uit elektriciteitskost geschat", household: "Op basis van gezin geschat" },
  pvStatus: {
    exact: "Exact",
    estimated: "Voorlopig ingeschat",
    toCheck: "Nog te controleren",
    planned: "Voorlopig ingeschat (geplande installatie)",
    none: "Geen zonnepanelen",
  },
  changes: {
    electricCar: "Elektrische auto",
    heatPump: "Warmtepomp",
    heatPumpBoiler: "Warmtepompboiler",
    familyGrowth: "Gezinsuitbreiding",
    none: "Geen grote verandering",
    unknown: "Nog niet bekend",
  } as Record<ChangeTag, string>,
};

function Heading({ title, text }: { title: string; text?: string }) {
  return (
    <div>
      <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
      {text ? <p className="mt-1 text-sm text-muted-foreground">{text}</p> : null}
    </div>
  );
}

function TextLink({ onClick, children }: { onClick: () => void; children: ReactNode }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="text-sm font-medium text-primary underline-offset-4 hover:underline"
    >
      {children}
    </button>
  );
}

function Bars({ title, rows, unit = "" }: { title: string; rows: { label: string; value: number; highlight?: boolean; display: string }[]; unit?: string }) {
  const max = Math.max(1, ...rows.map((r) => r.value));
  return (
    <section className="rounded-xl border border-border bg-card p-4">
      <h3 className="font-display text-sm font-semibold text-foreground">{title}</h3>
      <div className="mt-3 space-y-3">
        {rows.map((r) => (
          <div key={r.label}>
            <div className="mb-1 flex justify-between text-xs">
              <span className="text-muted-foreground">{r.label}</span>
              <span className="font-semibold text-foreground">
                {r.display}
                {unit}
              </span>
            </div>
            <div className="h-3 w-full overflow-hidden rounded-full bg-muted">
              <div
                className={`h-full rounded-full ${r.highlight ? "bg-primary" : "bg-muted-foreground/40"}`}
                style={{ width: `${Math.max(2, (r.value / max) * 100)}%` }}
              />
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

export function HomeBatteryWizard({ service, onBackToOverview }: ServiceComponentProps) {
  const { state, update, reset } = useWizardState<State>(service.id, INITIAL);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);

  const refresh = () => requestAnimationFrame(measureAndPost);
  const set = (patch: Partial<State>) => {
    update(patch);
    refresh();
  };
  const goto = (next: number) => {
    setStep(next);
    // Enkel de iframe-inhoud scrollen, nooit de parentpagina.
    window.scrollTo({ top: 0, behavior: "auto" });
    refresh();
  };

  const { household, costEstimate, resolved, pricePerKwh } = useResolvedConsumption(state);

  const pv = useMemo(
    () =>
      estimatePv({
        hasPv: state.hasPv,
        knowledge: state.pvKnowledge,
        annualProduction: state.annualProduction,
        panels: state.panels,
        period: state.installPeriod,
        exactWp: state.exactWp,
        pvPlan: state.pvPlan,
        consumptionKwh: resolved.kwh,
      }),
    [state.hasPv, state.pvKnowledge, state.annualProduction, state.panels, state.installPeriod, state.exactWp, state.pvPlan, resolved.kwh],
  );

  const periodKnown = !!state.installPeriod && state.installPeriod !== "unknown" && state.pvKnowledge === "panels";
  const inverter = inverterCheck({
    hasExisting: pv.hasExisting,
    period: periodKnown ? state.installPeriod : "",
    age: state.installAge,
  });

  const recommendation = recommendCapacity({
    kwp: pv.kwp,
    consumptionKwh: resolved.kwh,
    goal: state.goal,
    backup: state.backup,
  });
  const capacity = typeof state.capacityOverride === "number" ? state.capacityOverride : recommendation.capacity;
  const manual = typeof state.capacityOverride === "number" && state.capacityOverride !== recommendation.capacity;
  const deviation = manual ? deviationWarning(capacity, recommendation.capacity) : null;

  const smartOn = state.smart === "yes" || state.smart === "advice" || state.smart === "info" || state.smart === "";
  const smartLabel = state.smart === "yes" ? "Ja" : state.smart === "no" ? "Nee" : "Advies (aanbevolen)";
  const flow = energyFlow({ production: pv.production, consumptionKwh: resolved.kwh, smart: smartOn });
  const savings = computeSavings({
    production: pv.production,
    consumptionKwh: resolved.kwh,
    smart: smartOn,
    capacity,
    contract: state.contract,
    pricePerKwh,
  });
  const price = batteryPrice({ capacity, phase: state.phase, inverter });
  const annual = savings.kind === "custom" ? null : savings.annual;
  const paybackLow = paybackYears(price.low, annual);
  const paybackHigh = paybackYears(price.high, annual);
  const priceText = price.isRange ? `${euro(price.low)} – ${euro(price.high)}` : euro(price.low);
  const paybackText =
    paybackLow === null
      ? "Niet betrouwbaar te berekenen"
      : price.isRange && paybackHigh !== paybackLow
        ? `${nf.format(paybackLow)} – ${nf.format(paybackHigh ?? paybackLow)} jaar`
        : `${nf.format(paybackLow)} jaar`;
  const savingsText =
    savings.kind === "custom"
      ? "Besparing op maat te bepalen"
      : savings.kind === "dynamic"
        ? `${euro(savings.annual)} (zeer indicatief)`
        : euro(savings.annual);
  const hasPvFlow = pv.production > 0;
  const gridReduction = flow.gridBefore > 0 ? (flow.gridBefore - flow.gridAfter) / flow.gridBefore : 0;
  const accuracy = batteryAccuracy(pv.status, resolved.source);
  const inverterNeedsCheck = inverter === "hybridLikely" || inverter === "unknown";

  const productionError =
    typeof state.annualProduction === "number" &&
    (state.annualProduction < 1 || state.annualProduction > 50000)
      ? "Vul een waarde tussen 1 en 50.000 kWh in, of kies ‘Ik kan dit niet vinden’."
      : undefined;
  const panelsError =
    typeof state.panels === "number" && (state.panels < 1 || state.panels > 100)
      ? "Vul een aantal tussen 1 en 100 in, of kies ‘Ik weet het aantal niet’."
      : undefined;

  /* ------------------------------------------------------------ stap 1 */
  const renderPv = () => (
    <div className="space-y-5">
      <Heading title="Wat is je huidige situatie?" />
      <RadioCards
        legend="Heb je momenteel zonnepanelen?"
        value={state.hasPv}
        onChange={(v) => set({ hasPv: v as HasPv })}
        options={[
          { value: "yes", label: "Ja", icon: Sun },
          { value: "no", label: "Nee" },
          { value: "soon", label: "Ze worden binnenkort geplaatst" },
          { value: "unknown", label: "Ik weet het nog niet" },
        ]}
      />

      {state.hasPv === "yes" ? (
        <div className="space-y-4">
          <RadioCards
            legend="Welke informatie over je zonnepanelen ken je?"
            columns={1}
            value={state.pvKnowledge}
            onChange={(v) => set({ pvKnowledge: v as PvKnowledge })}
            options={[
              { value: "production", label: "Ik ken de jaarlijkse productie", description: "Dit staat meestal in de app van je omvormer." },
              { value: "panels", label: "Ik weet ongeveer hoeveel panelen ik heb", description: "We maken een inschatting op basis van het aantal en de ouderdom." },
              { value: "unknown", label: "Ik weet het niet", description: "We maken voorlopig een inschatting op basis van je stroomverbruik." },
            ]}
          />

          {state.pvKnowledge === "production" ? (
            <div className="space-y-2">
              <NumberField
                label="Hoeveel elektriciteit produceren je zonnepanelen per jaar?"
                unit="kWh"
                min={1}
                max={50000}
                placeholder="Bijvoorbeeld 4.000"
                hint="Zoek in de app van je omvormer naar ‘jaaropbrengst’, ‘productie’ of ‘yield’."
                {...(productionError ? { error: productionError } : {})}
                value={state.annualProduction}
                onChange={(v) => set({ annualProduction: v })}
              />
              <TextLink onClick={() => set({ pvKnowledge: "panels", annualProduction: "" })}>
                Ik kan dit niet vinden
              </TextLink>
            </div>
          ) : null}

          {state.pvKnowledge === "panels" ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <NumberField
                  label="Hoeveel zonnepanelen liggen er ongeveer?"
                  min={1}
                  max={100}
                  placeholder="Bijvoorbeeld 10"
                  {...(panelsError ? { error: panelsError } : {})}
                  value={state.panels}
                  onChange={(v) => set({ panels: v })}
                />
                <TextLink onClick={() => set({ pvKnowledge: "unknown", panels: "" })}>
                  Ik weet het aantal niet
                </TextLink>
              </div>
              <RadioCards
                legend="Wanneer zijn de zonnepanelen ongeveer geplaatst?"
                value={state.installPeriod}
                onChange={(v) => set({ installPeriod: v as InstallPeriod })}
                options={[
                  { value: "pre2015", label: "Vóór 2015" },
                  { value: "2015to2019", label: "Tussen 2015 en 2019" },
                  { value: "2020to2022", label: "Tussen 2020 en 2022" },
                  { value: "2023plus", label: "In 2023 of later" },
                  { value: "unknown", label: "Ik weet het niet" },
                ]}
              />
              <AdvancedSection title="Ik ken het exacte vermogen per paneel">
                <label className="block text-sm font-semibold text-foreground">
                  Vermogen per paneel (optioneel)
                  <select
                    value={state.exactWp === "" ? "" : String(state.exactWp)}
                    onChange={(e) => set({ exactWp: e.target.value ? Number(e.target.value) : "" })}
                    className="mt-1.5 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm font-normal text-foreground"
                  >
                    <option value="">Ik ken het niet</option>
                    {BATTERY_CONFIG.exactWpOptions.map((wp) => (
                      <option key={wp} value={wp}>
                        {wp} Wp
                      </option>
                    ))}
                  </select>
                </label>
              </AdvancedSection>
              {pv.status === "estimated" ? (
                <div className="rounded-xl border border-primary/30 bg-secondary p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <p className="text-xs text-muted-foreground">Geschat PV-vermogen</p>
                      <p className="font-display text-xl font-semibold text-foreground">{nf.format(pv.kwp)} kWp</p>
                    </div>
                    <div>
                      <p className="text-xs text-muted-foreground">Geschatte jaarproductie</p>
                      <p className="font-display text-xl font-semibold text-foreground">{kwh(pv.production)}</p>
                    </div>
                  </div>
                  {typeof state.exactWp !== "number" ? (
                    <p className="mt-2 text-xs font-medium text-primary">
                      Voorlopig ingeschat · {pv.wpPerPanel} Wp per paneel aangenomen
                    </p>
                  ) : null}
                </div>
              ) : null}
            </div>
          ) : null}

          {state.pvKnowledge === "unknown" ? (
            <InfoNotice>
              Geen probleem. We schatten je zonnepanelen voorlopig in op basis van je stroomverbruik. Nrgea
              controleert dit later.
            </InfoNotice>
          ) : null}
        </div>
      ) : null}

      {state.hasPv === "no" ? (
        <div className="space-y-3">
          <RadioCards
            legend="Ben je van plan zonnepanelen te laten plaatsen?"
            value={state.pvPlan}
            onChange={(v) => set({ pvPlan: v as PvPlan })}
            options={[
              { value: "withBattery", label: "Ja, samen met de thuisbatterij" },
              { value: "later", label: "Ja, maar pas later" },
              { value: "no", label: "Nee" },
              { value: "advice", label: "Ik wil advies" },
            ]}
          />
          {state.pvPlan === "withBattery" ? (
            <InfoNotice>We nemen een combinatie van zonnepanelen en batterij mee in het advies.</InfoNotice>
          ) : null}
          {state.pvPlan === "later" ? (
            <InfoNotice>De batterij kan al worden voorbereid op een toekomstige zonnepaneleninstallatie.</InfoNotice>
          ) : null}
          {state.pvPlan === "no" || state.pvPlan === "advice" ? (
            <InfoNotice>
              Een thuisbatterij kan ook met goedkope of dynamische netstroom worden geladen. De rendabiliteit hangt
              dan sterk af van je energiecontract en verbruiksprofiel.
            </InfoNotice>
          ) : null}
        </div>
      ) : null}

      {state.hasPv === "soon" || state.hasPv === "unknown" ? (
        <InfoNotice>
          We schatten een passende zonnepaneleninstallatie voorlopig in op basis van je stroomverbruik.
        </InfoNotice>
      ) : null}

      <WizardNavigation onPrev={onBackToOverview} onNext={() => goto(1)} nextDisabled={!state.hasPv} />
    </div>
  );

  /* ------------------------------------------------------------ stap 2 */
  const renderConsumption = () => (
    <div className="space-y-5">
      <Heading
        title="Hoe wil je je stroomverbruik bepalen?"
        text="Kies wat voor jou het makkelijkst is. Je hoeft je exacte verbruik niet te kennen."
      />
      <ConsumptionEstimator state={state} set={set} household={household} costEstimate={costEstimate} />
      {state.method ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">
            Gebruikt jaarlijks stroomverbruik: ongeveer {kwh(resolved.kwh)}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">{LABELS.source[resolved.source]}</p>
        </div>
      ) : null}
      <WizardNavigation onPrev={() => goto(0)} onNext={() => goto(2)} nextDisabled={!state.method} />
    </div>
  );

  /* ------------------------------------------------------------ stap 3 */
  const showAge = pv.hasExisting && !periodKnown;
  const renderEnergy = () => (
    <div className="space-y-5">
      <Heading
        title="Een paar eenvoudige vragen over je energie"
        text="Je hoeft geen technische documenten bij de hand te hebben."
      />
      <div className="space-y-2">
        <RadioCards
          legend="Heb je een digitale elektriciteitsmeter?"
          columns={3}
          value={state.meter}
          onChange={(v) => set({ meter: v as MeterType })}
          options={[
            { value: "yes", label: "Ja" },
            { value: "no", label: "Nee" },
            { value: "unknown", label: "Ik weet het niet" },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Een digitale meter heeft meestal een digitaal scherm waarop meerdere meterstanden verschijnen.
        </p>
        {state.meter === "no" ? (
          <InfoNotice>
            Een digitale meter kan nodig zijn voor bepaalde slimme functies. Nrgea controleert dit tijdens het
            advies.
          </InfoNotice>
        ) : null}
        {state.meter === "unknown" ? <InfoNotice>Geen probleem. We controleren dit later.</InfoNotice> : null}
      </div>

      <div className="space-y-2">
        <RadioCards
          legend="Welk type energiecontract heb je?"
          value={state.contract}
          onChange={(v) => set({ contract: v as ContractType })}
          options={[
            { value: "fixed", label: "Vast tarief" },
            { value: "variable", label: "Variabel tarief" },
            { value: "dynamic", label: "Dynamisch tarief" },
            { value: "unknown", label: "Ik weet het niet" },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Bij een dynamisch contract verandert de elektriciteitsprijs per uur.
        </p>
      </div>

      <div className="space-y-2">
        <RadioCards
          legend="Weet je of je een mono- of driefaseaansluiting hebt?"
          columns={3}
          value={state.phase}
          onChange={(v) => set({ phase: v as Phase })}
          options={[
            { value: "mono", label: "Monofase" },
            { value: "three", label: "Driefase" },
            { value: "unknown", label: "Ik weet het niet" },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Je vindt dit meestal op de elektriciteitsmeter of het keuringsverslag.
        </p>
        {state.phase === "unknown" ? (
          <InfoNotice>Geen probleem. We rekenen voorlopig met monofase. Aansluiting nog te controleren.</InfoNotice>
        ) : null}
      </div>

      {showAge ? (
        <RadioCards
          legend="Hoe oud is de installatie ongeveer?"
          value={state.installAge}
          onChange={(v) => set({ installAge: v as InstallAge })}
          options={[
            { value: "lt5", label: "Minder dan 5 jaar" },
            { value: "5to10", label: "Tussen 5 en 10 jaar" },
            { value: "gt10", label: "Meer dan 10 jaar" },
            { value: "unknown", label: "Ik weet het niet" },
          ]}
        />
      ) : null}

      {pv.hasExisting ? <InfoNotice>{INVERTER_TEXT[inverter]}</InfoNotice> : null}

      <WizardNavigation onPrev={() => goto(1)} onNext={() => goto(3)} />
    </div>
  );

  /* ------------------------------------------------------------ stap 4 */
  const renderPrefs = () => (
    <div className="space-y-5">
      <Heading
        title="Wat wil je bereiken met je thuisbatterij?"
        text="Je voorkeur helpt ons om een passende capaciteit te adviseren."
      />
      <RadioCards
        legend="Wat vind je het belangrijkst?"
        columns={1}
        value={state.goal}
        onChange={(v) => set({ goal: v as Goal })}
        options={[
          { value: "selfUse", label: "Meer eigen zonnestroom gebruiken", description: "Sla zonnestroom overdag op voor gebruik in de avond." },
          { value: "balanced", label: "Een goede balans tussen prijs en opslag", description: "Niet groter dan nodig, maar voldoende voor dagelijks gebruik." },
          { value: "cheapHours", label: "Profiteren van goedkope energiemomenten", description: "Laad de batterij wanneer netstroom goedkoop is." },
          { value: "backup", label: "Extra reserve bij stroomuitval", description: "Meer capaciteit beschikbaar houden voor belangrijke toestellen." },
          { value: "advice", label: "Ik wil dat Nrgea adviseert", description: "Gebruik een evenwichtige standaardconfiguratie." },
        ]}
      />

      <div className="space-y-2">
        <RadioCards
          legend="Vind je noodstroom bij een stroomuitval belangrijk?"
          value={state.backup}
          onChange={(v) => set({ backup: v as BackupPref })}
          options={[
            { value: "few", label: "Ja, voor enkele belangrijke toestellen" },
            { value: "large", label: "Ja, voor een groter deel van de woning" },
            { value: "no", label: "Nee" },
            { value: "unknown", label: "Ik weet het nog niet" },
          ]}
        />
        <InfoNotice>
          Noodstroom is niet bij iedere batterij of installatie standaard actief. De technische mogelijkheden
          worden later gecontroleerd.
        </InfoNotice>
      </div>

      <div className="space-y-2">
        <RadioCards
          legend="Wil je dat de batterij automatisch inspeelt op productie, verbruik en energietarieven?"
          value={state.smart}
          onChange={(v) => set({ smart: v as SmartPref })}
          options={[
            { value: "yes", label: "Ja, automatisch optimaliseren" },
            { value: "no", label: "Nee" },
            { value: "info", label: "Vertel me meer" },
            { value: "advice", label: "Ik wil advies" },
          ]}
        />
        {state.smart === "info" ? (
          <InfoNotice>
            Een slimme sturing bepaalt automatisch wanneer de batterij wordt geladen of ontladen. Zo kan meer eigen
            zonnestroom worden gebruikt en kan dure netstroom worden beperkt.
          </InfoNotice>
        ) : null}
      </div>

      <MultiSelectCards
        legend="Verwacht je binnen twee jaar een hoger stroomverbruik?"
        values={state.changes}
        exclusive={["none", "unknown"]}
        onChange={(values) => set({ changes: values as ChangeTag[] })}
        options={[
          { value: "electricCar", label: "Een elektrische auto" },
          { value: "heatPump", label: "Een warmtepomp" },
          { value: "heatPumpBoiler", label: "Een warmtepompboiler" },
          { value: "familyGrowth", label: "Een gezinsuitbreiding" },
          { value: "none", label: "Geen grote verandering" },
          { value: "unknown", label: "Ik weet het nog niet" },
        ]}
      />
      {resolved.source === "household" ? (
        <p className="text-xs text-muted-foreground">
          Deze keuzes zijn gekoppeld aan je verbruiksinschatting en worden niet dubbel meegeteld.
        </p>
      ) : null}

      <WizardNavigation onPrev={() => goto(2)} onNext={() => goto(4)} />
    </div>
  );

  /* ------------------------------------------------------------ stap 5 */
  const adviceItems = [
    { label: "Geschat stroomverbruik", value: kwh(resolved.kwh) },
    {
      label: "PV-vermogen",
      value: pv.status === "none" ? "Geen zonnepanelen" : pv.status === "toCheck" ? `±${nf.format(pv.kwp)} kWp · Nog te controleren` : `${nf.format(pv.kwp)} kWp`,
    },
    { label: "Hoofddoel", value: LABELS.goal[(state.goal || "advice") as Goal] },
    { label: "Slimme sturing", value: smartLabel },
    { label: "Noodstroom", value: LABELS.backup[(state.backup || "unknown") as BackupPref] },
    { label: "Digitale meter", value: LABELS.meter[(state.meter || "unknown") as MeterType] },
  ];

  const renderAdvice = () => (
    <div className="space-y-5">
      <Heading title="Ons eerste batterijadvies" />
      <section className="rounded-2xl border border-primary/30 bg-secondary p-5">
        <div className="flex items-center gap-3">
          <span className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground">
            <BatteryCharging className="h-5 w-5" aria-hidden="true" />
          </span>
          <p className="font-display text-xl font-semibold text-foreground">
            Wij adviseren ongeveer {recommendation.capacity} kWh batterijcapaciteit
          </p>
        </div>
        <dl className="mt-4 grid grid-cols-1 gap-x-6 gap-y-2 sm:grid-cols-2">
          {adviceItems.map((i) => (
            <div key={i.label} className="flex justify-between gap-4">
              <dt className="text-xs text-muted-foreground">{i.label}</dt>
              <dd className="text-sm font-medium text-foreground">{i.value}</dd>
            </div>
          ))}
        </dl>
        <p className="mt-4 text-xs text-muted-foreground">
          De definitieve capaciteit hangt af van je werkelijke productieprofiel, avondverbruik, omvormer en
          technische installatie.
        </p>
      </section>

      <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
        <section className="rounded-xl border border-border bg-card p-4">
          <h4 className="font-display text-sm font-semibold text-foreground">Zonder thuisbatterij</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Geschatte zelfconsumptie: {pct(BATTERY_CONFIG.selfConsumption.without)}</li>
            <li>Meer injectie naar het net</li>
            <li>Meer netafname in de avond</li>
          </ul>
        </section>
        <section className="rounded-xl border border-primary/40 bg-card p-4">
          <h4 className="font-display text-sm font-semibold text-foreground">Met geadviseerde thuisbatterij</h4>
          <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
            <li>Zonder slimme sturing: ongeveer {pct(BATTERY_CONFIG.selfConsumption.battery)}</li>
            <li>Met slimme sturing: ongeveer {pct(BATTERY_CONFIG.selfConsumption.smart)}</li>
            <li>Minder netafname</li>
            <li>Meer gebruik van eigen zonnestroom</li>
          </ul>
        </section>
      </div>
      <p className="text-xs text-muted-foreground">Deze percentages zijn indicatieve aannames.</p>

      {inverterNeedsCheck ? (
        <WarningNotice>
          <strong className="block">Controle van de omvormer nodig</strong>
          Op basis van de ouderdom kunnen we niet bevestigen of de bestaande omvormer rechtstreeks geschikt is.
          Nrgea controleert dit tijdens de technische analyse. Indien nodig nemen we een passende hybride omvormer
          mee in het voorstel.
        </WarningNotice>
      ) : null}

      <AdvancedSection title="Advies handmatig aanpassen">
        <label className="block text-sm font-semibold text-foreground">
          Batterijcapaciteit
          <select
            value={String(capacity)}
            onChange={(e) => {
              const v = Number(e.target.value);
              set({ capacityOverride: v === recommendation.capacity ? "" : v });
            }}
            className="mt-1.5 h-12 w-full rounded-xl border border-input bg-card px-4 text-sm font-normal text-foreground"
          >
            {BATTERY_CONFIG.capacities.map((c) => (
              <option key={c} value={c}>
                {c} kWh{c === recommendation.capacity ? " — Aanbevolen" : ""}
              </option>
            ))}
          </select>
        </label>
        {deviation === "muchSmaller" ? (
          <WarningNotice>Deze capaciteit kan mogelijk weinig overtollige zonnestroom opslaan.</WarningNotice>
        ) : null}
        {deviation === "muchLarger" ? (
          <WarningNotice>Een grotere batterij levert niet automatisch een evenredig hogere besparing op.</WarningNotice>
        ) : null}
      </AdvancedSection>

      <WizardNavigation onPrev={() => goto(3)} onNext={() => goto(5)} />
    </div>
  );

  /* ------------------------------------------------------------ stap 6 */
  const productionValue =
    pv.status === "none"
      ? "Niet van toepassing"
      : pv.status === "exact"
        ? kwh(pv.production)
        : `ongeveer ${kwh(pv.production)}`;
  const sections: { title: string; items: { label: string; value: string }[] }[] = [
    {
      title: "Zonnepanelen",
      items: [
        { label: "Bestaande zonnepanelen", value: LABELS.hasPv[(state.hasPv || "unknown") as HasPv] },
        { label: pv.status === "exact" ? "Jaarlijkse productie" : "Geschatte productie", value: productionValue },
        ...(typeof state.panels === "number" && state.pvKnowledge === "panels"
          ? [{ label: "Aantal panelen", value: String(state.panels) }]
          : []),
        { label: "Geschat PV-vermogen", value: pv.kwp > 0 ? `${nf.format(pv.kwp)} kWp` : "Nog te bepalen" },
        ...(pv.hasExisting
          ? [{ label: "Installatieperiode", value: periodKnown ? LABELS.period[state.installPeriod as InstallPeriod] : "Nog te bepalen" }]
          : []),
        { label: "Gegevensstatus", value: LABELS.pvStatus[pv.status] },
      ],
    },
    {
      title: "Verbruik",
      items: [
        { label: "Gebruikt jaarlijks stroomverbruik", value: kwh(resolved.kwh) },
        { label: "Methode", value: LABELS.source[resolved.source] },
      ],
    },
    {
      title: "Energiesituatie",
      items: [
        { label: "Digitale meter", value: LABELS.meter[(state.meter || "unknown") as MeterType] },
        { label: "Contracttype", value: LABELS.contract[(state.contract || "unknown") as ContractType] },
        { label: "Aansluiting", value: LABELS.phase[(state.phase || "unknown") as Phase] },
        {
          label: "Omvormercontrole nodig",
          value: inverterNeedsCheck ? "Ja, wordt technisch gecontroleerd" : pv.hasExisting ? "Wordt technisch gecontroleerd" : "Nee",
        },
      ],
    },
    {
      title: "Voorkeuren",
      items: [
        { label: "Hoofddoel", value: LABELS.goal[(state.goal || "advice") as Goal] },
        { label: "Noodstroom", value: LABELS.backup[(state.backup || "unknown") as BackupPref] },
        { label: "Slimme sturing", value: smartLabel },
        {
          label: "Toekomstig stroomverbruik",
          value: state.changes.length ? state.changes.map((c) => LABELS.changes[c]).join(", ") : "Nog te bepalen",
        },
      ],
    },
    {
      title: "Advies",
      items: [
        { label: "Aanbevolen capaciteit", value: `${recommendation.capacity} kWh` },
        { label: "Handmatig aangepast", value: manual ? `Ja, ${capacity} kWh` : "Nee" },
        { label: "Verwachte zelfconsumptie", value: hasPvFlow ? pct(flow.shareWith) : "Nog te bepalen" },
        { label: "Verwachte vermindering netafname", value: hasPvFlow ? pct(gridReduction) : "Nog te bepalen" },
      ],
    },
  ];

  const renderOverview = () => (
    <div className="space-y-4">
      <Heading title="Controleer je situatie en advies" />
      {sections.map((s) => (
        <ScenarioOverview key={s.title} title={s.title} items={s.items} />
      ))}
      <WizardNavigation onPrev={() => goto(4)} onNext={() => goto(6)} />
    </div>
  );

  /* ------------------------------------------------------------ stap 7 */
  const renderContact = () => (
    <div className="space-y-4">
      <Heading
        title="Je batterijadvies is bijna klaar"
        text="Vul je gegevens in om de volledige indicatieve berekening te bekijken."
      />
      <ContactForm
        submitting={submitting}
        onSubmit={async (values) => {
          setSubmitting(true);
          await submitCalculatorLead({
            serviceId: service.id,
            contact: values,
            answers: { ...state, resolvedKwh: resolved.kwh, pv, capacity, inverter },
          });
          setSubmitting(false);
          goto(7);
        }}
      />
      <button
        type="button"
        onClick={() => goto(5)}
        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        Vorige
      </button>
    </div>
  );

  /* ------------------------------------------------------------ stap 8 */
  const restart = () => {
    reset();
    goto(0);
  };

  const renderResult = () => (
    <ResultsShell
      title="Dit is jouw indicatieve thuisbatterijadvies"
      disclaimer="Deze simulatie is indicatief. De werkelijke capaciteit, compatibiliteit, besparing en prijs hangen af van het verbruiksprofiel, de zonnepanelenproductie, omvormer, elektrische aansluiting, energiecontract en technische situatie van de woning."
      summary={
        <div className="space-y-4">
          <span className="inline-flex rounded-full bg-secondary px-3 py-1 text-xs font-semibold text-primary">
            {accuracy}
          </span>
          <section className="grid grid-cols-2 gap-3 rounded-2xl bg-forest p-5 sm:grid-cols-4">
            {[
              ["Batterijcapaciteit", `${capacity} kWh`],
              ["Slimme sturing", smartOn ? "Ja" : "Nee"],
              ["Zelfconsumptie", hasPvFlow ? pct(flow.shareWith) : "Nog te bepalen"],
              ["Jaarlijkse besparing", savingsText],
            ].map(([l, v]) => (
              <div key={l}>
                <p className="text-xs text-mint/80">{l}</p>
                <p className="mt-1 font-display text-lg font-semibold text-primary-foreground">{v}</p>
              </div>
            ))}
          </section>
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="font-display text-base font-semibold text-foreground">Thuisbatterij</h3>
            <dl className="mt-3 space-y-2 text-sm">
              {[
                ["Capaciteit", `${capacity} kWh`],
                ["Slimme sturing", smartOn ? "Ja" : "Nee"],
                ["Digitale meter", LABELS.meter[(state.meter || "unknown") as MeterType]],
                ["Noodstroomvoorkeur", LABELS.backup[(state.backup || "unknown") as BackupPref]],
                ["Omvormercontrole", INVERTER_TEXT[inverter]],
                ["Indicatieve prijs", priceText],
              ].map(([l, v]) => (
                <div key={l} className="flex justify-between gap-4">
                  <dt className="text-muted-foreground">{l}</dt>
                  <dd className="text-right font-medium text-foreground">{v}</dd>
                </div>
              ))}
              {price.hybridIncluded ? (
                <div className="flex items-center gap-2 text-primary">
                  <Check className="h-4 w-4" aria-hidden="true" /> Hybride omvormer mogelijk inbegrepen
                </div>
              ) : null}
              {price.isRange ? (
                <p className="text-xs text-muted-foreground">
                  Ondergrens: met compatibele omvormer. Bovengrens: hybride omvormer inbegrepen.
                </p>
              ) : null}
              {price.phaseToCheck ? (
                <p className="text-xs text-muted-foreground">Aansluiting nog te controleren.</p>
              ) : null}
            </dl>
          </section>
        </div>
      }
      kpis={
        <>
          <KpiCard label="Zelfconsumptie zonder batterij" value={hasPvFlow ? pct(flow.shareWithout) : "–"} />
          <KpiCard label="Zelfconsumptie met batterij" value={hasPvFlow ? pct(flow.shareWith) : "–"} />
          <KpiCard label="Netafname vóór" value={kwh(hasPvFlow ? flow.gridBefore : resolved.kwh)} />
          <KpiCard label="Netafname na" value={kwh(hasPvFlow ? flow.gridAfter : resolved.kwh)} hint={hasPvFlow ? undefined : "Verschuift naar goedkope uren"} />
          <KpiCard label="Jaarlijkse besparing" value={savingsText} />
          <KpiCard label="Indicatieve investering" value={priceText} />
          <KpiCard label="Terugverdientijd" value={paybackText} />
        </>
      }
      chart={
        hasPvFlow ? (
          <div className="space-y-3">
            <Bars
              title="Eigen zonnestroom gebruiken"
              rows={[
                { label: "Zonder batterij", value: flow.selfWithout, display: kwh(flow.selfWithout) },
                { label: "Met batterij", value: flow.selfWith, display: kwh(flow.selfWith), highlight: true },
              ]}
            />
            <Bars
              title="Netafname vóór vs. na"
              rows={[
                { label: "Vóór", value: flow.gridBefore, display: kwh(flow.gridBefore) },
                { label: "Na", value: flow.gridAfter, display: kwh(flow.gridAfter), highlight: true },
              ]}
            />
            <Bars
              title="Energiestroom (met batterij)"
              rows={[
                { label: "Geschatte PV-productie", value: flow.production, display: kwh(flow.production) },
                { label: "Direct gebruikt", value: flow.selfWithout, display: kwh(flow.selfWithout), highlight: true },
                { label: "Opgeslagen", value: flow.stored, display: kwh(flow.stored), highlight: true },
                { label: "Geïnjecteerd", value: flow.injectedWith, display: kwh(flow.injectedWith) },
                { label: "Afgenomen van het net", value: flow.gridAfter, display: kwh(flow.gridAfter) },
              ]}
            />
          </div>
        ) : (
          <section className="rounded-xl border border-border bg-card p-4">
            <h3 className="flex items-center gap-2 font-display text-sm font-semibold text-foreground">
              <Zap className="h-4 w-4 text-primary" aria-hidden="true" /> Laden op goedkope momenten
            </h3>
            <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
              <li>
                Geschat batterijgebruik:{" "}
                {savings.kind === "dynamic" ? `ongeveer ${kwh(savings.shiftedKwh)} per jaar` : "Nog te bepalen"}
              </li>
              <li>Mogelijke verschuiving van dure naar goedkope uren.</li>
            </ul>
            <p className="mt-2 text-xs text-muted-foreground">
              Zeer indicatief: dit hangt sterk af van je energiecontract en verbruiksprofiel.
              {savings.kind === "custom" ? " Zonder dynamisch contract bepalen we de besparing op maat." : ""}
            </p>
          </section>
        )
      }
      advice={
        <section className="rounded-2xl border border-primary/30 bg-secondary p-5">
          <h3 className="font-display text-base font-semibold text-foreground">
            Thuisbatterij met slimme optimalisatie
          </h3>
          <p className="mt-1 text-sm text-muted-foreground">
            Nrgea combineert installatie, monitoring en slimme aansturing in één persoonlijk energieplan.
          </p>
          <ul className="mt-3 grid grid-cols-1 gap-2 text-sm text-foreground sm:grid-cols-2">
            {["Professionele installatie", "Slimme monitoring", "Automatische optimalisatie", "10 jaar service en garantie"].map((u) => (
              <li key={u} className="flex items-center gap-2">
                <Check className="h-4 w-4 text-primary" aria-hidden="true" /> {u}
              </li>
            ))}
          </ul>
          {!pv.hasExisting ? (
            <p className="mt-3 text-sm text-foreground">
              Nrgea kan de thuisbatterij combineren met een nieuwe zonnepaneleninstallatie.
            </p>
          ) : null}
        </section>
      }
      onRequestAdvice={() => goto(6)}
      onRestart={restart}
      onBackToOverview={onBackToOverview}
    />
  );

  return (
    <CalculatorWizardShell
      title="Bereken je thuisbatterij"
      description="Ontdek welke batterij bij je zonnepanelen, verbruik en wensen past."
      steps={STEPS}
      currentStep={step}
      onBackToOverview={onBackToOverview}
    >
      {step === 0 ? renderPv() : null}
      {step === 1 ? renderConsumption() : null}
      {step === 2 ? renderEnergy() : null}
      {step === 3 ? renderPrefs() : null}
      {step === 4 ? renderAdvice() : null}
      {step === 5 ? renderOverview() : null}
      {step === 6 ? renderContact() : null}
      {step === 7 ? renderResult() : null}
    </CalculatorWizardShell>
  );
}

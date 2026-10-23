import { useMemo, useState } from "react";
import { BatteryCharging, Car, Euro, Gauge, Home, Sun } from "lucide-react";

import type { ServiceComponentProps } from "@/config/calculatorServices";
import { PANEL_WP, REFERENCE_KWH_PRICE } from "@/config/solarConfig";
import { useWizardState } from "@/hooks/useWizardState";
import {
  accuracyFor,
  estimateFromCost,
  estimateFromHousehold,
  type ConsumptionSource,
} from "@/lib/solar/consumption";
import {
  compareBatteryScenarios,
  computeFinancials,
  recommendBatteryKwh,
  recommendPanels,
} from "@/lib/solar/recommendation";
import type {
  BatteryChoice,
  BatteryPriority,
  CarType,
  ChangeTag,
  ExistingIntent,
  HeatingType,
  PhaseType,
  PlannedCarType,
  RoofSpace,
  RoofType,
  ShadeLevel,
  SituationTag,
  WaterHeatingType,
} from "@/lib/solar/types";
import { submitCalculatorLead } from "@/services/submitCalculatorLead";
import { CalculatorWizardShell } from "../CalculatorWizardShell";
import { ContactForm, type ContactFormValues } from "../ContactForm";
import { measureAndPost } from "../IframeResizeReporter";
import { KpiCard } from "../KpiCard";
import { InfoNotice, WarningNotice } from "../Notices";
import { NumberField } from "../NumberField";
import { RadioCards } from "../RadioCards";
import { ResultsShell } from "../ResultsShell";
import { ScenarioOverview } from "../ScenarioOverview";
import { WizardNavigation } from "../WizardNavigation";
import { ConsumptionEstimator } from "../shared/ConsumptionEstimator";
import { AdvancedSection } from "./AdvancedSection";
import { MultiSelectCards } from "./MultiSelectCards";

const STEPS = ["Verbruik", "Woning", "Advies", "Overzicht", "Gegevens", "Resultaat"];

type Method = "kwh" | "cost" | "estimate";

type State = {
  method: Method | "";
  kwhPerYear: number | "";
  costElectricityOnly: "" | "yes" | "no" | "unknown";
  costPeriod: "" | "month" | "year";
  costAmount: number | "";
  knowsPrice: "" | "yes" | "no";
  kwhPrice: number | "";
  costAccepted: boolean;
  persons: number | "";
  heating: HeatingType | "";
  waterHeating: WaterHeatingType | "";
  car: CarType | "";
  plannedCar: PlannedCarType | "";
  situations: SituationTag[];
  changes: ChangeTag[];
  householdAccepted: boolean;
  manualKwh: number | "";
  roofType: RoofType | "";
  roofSpace: RoofSpace | "";
  shade: ShadeLevel | "";
  phase: PhaseType | "";
  existingPv: "" | "yes" | "no" | "unknown";
  existingPanels: number | "";
  existingIntent: ExistingIntent | "";
  panelOverride: number | "";
  battery: BatteryChoice | "";
  batteryPriority: BatteryPriority | "";
  batteryOverride: number | "";
  smartControl: "" | "yes" | "no";
};

const INITIAL: State = {
  method: "",
  kwhPerYear: "",
  costElectricityOnly: "",
  costPeriod: "",
  costAmount: "",
  knowsPrice: "",
  kwhPrice: "",
  costAccepted: false,
  persons: "",
  heating: "",
  waterHeating: "",
  car: "",
  plannedCar: "",
  situations: [],
  changes: [],
  householdAccepted: false,
  manualKwh: "",
  roofType: "",
  roofSpace: "",
  shade: "",
  phase: "",
  existingPv: "",
  existingPanels: "",
  existingIntent: "",
  panelOverride: "",
  battery: "",
  batteryPriority: "",
  batteryOverride: "",
  smartControl: "",
};

const euro = (value: number) =>
  new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);
const kwh = (value: number) => `${new Intl.NumberFormat("nl-BE").format(Math.round(value))} kWh`;

export function SolarWizard({ service, onBackToOverview }: ServiceComponentProps) {
  const { state, update, reset } = useWizardState<State>(service.id, INITIAL);
  const [step, setStep] = useState(0);
  const [showManualKwh, setShowManualKwh] = useState(false);
  const [showSmartInfo, setShowSmartInfo] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<ContactFormValues | null>(null);

  const refresh = () => requestAnimationFrame(measureAndPost);
  const set = (patch: Partial<State>) => {
    update(patch);
    refresh();
  };
  const goto = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "auto" });
    refresh();
  };

  const household = useMemo(
    () =>
      estimateFromHousehold({
        persons: typeof state.persons === "number" ? state.persons : 2,
        heating: (state.heating || "unknown") as HeatingType,
        waterHeating: (state.waterHeating || "unknown") as WaterHeatingType,
        car: (state.car || "none") as CarType,
        plannedCar: (state.plannedCar || "unknown") as PlannedCarType,
        situations: state.situations,
        changes: state.changes,
      }),
    [
      state.persons,
      state.heating,
      state.waterHeating,
      state.car,
      state.plannedCar,
      state.situations,
      state.changes,
    ],
  );

  const costEstimate = useMemo(() => {
    if (typeof state.costAmount !== "number" || state.costAmount <= 0) return null;
    return estimateFromCost({
      amount: state.costAmount,
      period: state.costPeriod === "year" ? "year" : "month",
      pricePerKwh:
        state.knowsPrice === "yes" && typeof state.kwhPrice === "number"
          ? state.kwhPrice
          : undefined,
    });
  }, [state.costAmount, state.costPeriod, state.knowsPrice, state.kwhPrice]);

  const resolved = useMemo(() => {
    let source: ConsumptionSource = "household";
    let value = household.total;
    if (state.method === "kwh" && typeof state.kwhPerYear === "number" && state.kwhPerYear > 0) {
      source = "exact";
      value = state.kwhPerYear;
    } else if (state.method === "cost" && state.costAccepted && costEstimate) {
      source = "cost";
      value = costEstimate.kwh;
    }
    if (typeof state.manualKwh === "number" && state.manualKwh > 0) value = state.manualKwh;
    return { source, kwh: value, accuracy: accuracyFor(source) };
  }, [
    state.method,
    state.kwhPerYear,
    state.costAccepted,
    state.manualKwh,
    costEstimate,
    household.total,
  ]);

  const pricePerKwh =
    state.knowsPrice === "yes" && typeof state.kwhPrice === "number" && state.kwhPrice > 0
      ? state.kwhPrice
      : REFERENCE_KWH_PRICE;

  const advice = useMemo(
    () =>
      recommendPanels({
        consumptionKwh: resolved.kwh,
        shade: (state.shade || "unknown") as ShadeLevel,
        phase: (state.phase || "unknown") as PhaseType,
        roofSpace: (state.roofSpace || "unknown") as RoofSpace,
        override: typeof state.panelOverride === "number" ? state.panelOverride : null,
      }),
    [resolved.kwh, state.shade, state.phase, state.roofSpace, state.panelOverride],
  );

  const baseAdvice = useMemo(
    () =>
      recommendPanels({
        consumptionKwh: resolved.kwh,
        shade: (state.shade || "unknown") as ShadeLevel,
        phase: (state.phase || "unknown") as PhaseType,
        roofSpace: (state.roofSpace || "unknown") as RoofSpace,
      }),
    [resolved.kwh, state.shade, state.phase, state.roofSpace],
  );

  const batteryKwh = useMemo(() => {
    if (state.battery !== "yes") return 0;
    return recommendBatteryKwh({
      kwp: advice.kwp,
      priority: (state.batteryPriority || "balanced") as BatteryPriority,
      override: typeof state.batteryOverride === "number" ? state.batteryOverride : null,
    });
  }, [state.battery, state.batteryPriority, state.batteryOverride, advice.kwp]);

  const comparison = useMemo(
    () =>
      compareBatteryScenarios({
        panels: advice.panels,
        production: advice.production,
        consumptionKwh: resolved.kwh,
        kwp: advice.kwp,
        priority: (state.batteryPriority || "balanced") as BatteryPriority,
        smartControl: state.smartControl === "yes",
        pricePerKwh,
      }),
    [advice, resolved.kwh, state.batteryPriority, state.smartControl, pricePerKwh],
  );

  const financials = useMemo(
    () =>
      computeFinancials({
        panels: advice.panels,
        production: advice.production,
        consumptionKwh: resolved.kwh,
        batteryKwh,
        smartControl: state.smartControl === "yes",
        pricePerKwh,
      }),
    [advice, resolved.kwh, batteryKwh, state.smartControl, pricePerKwh],
  );

  const switchToEstimate = () => set({ method: "estimate" });

  /* ---------------------------------------------------------------- stap 1 */
  const renderConsumption = () => (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">
          Hoe wil je je stroomverbruik bepalen?
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Kies wat voor jou het makkelijkst is. Je hoeft je exacte verbruik niet te kennen.
        </p>
      </div>

      <ConsumptionEstimator
        state={state}
        set={set}
        household={household}
        costEstimate={costEstimate}
      />

      <WizardNavigation
        onPrev={onBackToOverview}
        onNext={() => goto(1)}
        nextDisabled={!state.method}
      />
    </div>
  );


  /* ---------------------------------------------------------------- stap 2 */
  const renderHome = () => (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">
          Vertel ons iets over je woning
        </h3>
        <p className="mt-1 text-sm text-muted-foreground">
          Je hoeft geen technische plannen of keuringsdocumenten bij de hand te hebben.
        </p>
      </div>

      <RadioCards
        legend="Welk type dak wil je gebruiken voor zonnepanelen?"
        value={state.roofType}
        onChange={(value) => set({ roofType: value as RoofType })}
        options={[
          { value: "pitched", label: "Schuin dak" },
          { value: "flat", label: "Plat dak" },
          { value: "mixed", label: "Een combinatie" },
          { value: "unknown", label: "Ik weet het niet" },
        ]}
      />
      {state.roofType === "mixed" ? (
        <InfoNotice>
          We rekenen voorlopig met een schuin dak. De definitieve verdeling tussen schuin en plat
          bekijken we later.
        </InfoNotice>
      ) : null}
      {state.roofType === "unknown" ? (
        <InfoNotice>
          Geen probleem. Dit controleren we later met luchtfoto’s of tijdens de technische analyse.
        </InfoNotice>
      ) : null}

      <RadioCards
        legend="Hoeveel vrije ruimte is er ongeveer op het dak?"
        value={state.roofSpace}
        onChange={(value) => set({ roofSpace: value as RoofSpace })}
        options={[
          { value: "small", label: "Een klein deel van het dak" },
          { value: "half", label: "Ongeveer de helft" },
          { value: "most", label: "Het grootste deel" },
          { value: "full", label: "Bijna het volledige dak" },
          { value: "unknown", label: "Ik weet het niet" },
        ]}
      />

      <RadioCards
        legend="Ligt het dak vaak in de schaduw?"
        value={state.shade}
        onChange={(value) => set({ shade: value as ShadeLevel })}
        options={[
          { value: "never", label: "Bijna nooit" },
          { value: "partial", label: "Alleen een deel van de dag" },
          { value: "much", label: "Een groot deel van de dag" },
          { value: "unknown", label: "Ik weet het niet" },
        ]}
      />
      {state.shade === "much" ? (
        <WarningNotice>
          De opbrengst kan lager liggen. Tijdens de technische analyse bekijken we de exacte
          schaduwsituatie.
        </WarningNotice>
      ) : null}

      <div className="space-y-2">
        <RadioCards
          legend="Weet je of je een mono- of driefaseaansluiting hebt? (optioneel)"
          columns={3}
          value={state.phase}
          onChange={(value) => set({ phase: value as PhaseType })}
          options={[
            { value: "mono", label: "Monofase" },
            { value: "three", label: "Driefase" },
            { value: "unknown", label: "Ik weet het niet" },
          ]}
        />
        <p className="text-xs text-muted-foreground">
          Je vindt dit meestal op de elektriciteitsmeter of het keuringsverslag. Weet je het niet?
          Dan rekenen we voorzichtig met een monofaseaansluiting.
        </p>
      </div>

      <RadioCards
        legend="Liggen er momenteel al zonnepanelen op de woning?"
        columns={3}
        value={state.existingPv}
        onChange={(value) => set({ existingPv: value as State["existingPv"] })}
        options={[
          { value: "no", label: "Nee" },
          { value: "yes", label: "Ja" },
          { value: "unknown", label: "Ik weet het niet" },
        ]}
      />

      {state.existingPv === "yes" ? (
        <div className="space-y-4">
          <NumberField
            label="Hoeveel panelen liggen er ongeveer? (optioneel)"
            min={1}
            value={state.existingPanels}
            onChange={(value) => set({ existingPanels: value })}
          />
          <button
            type="button"
            onClick={() => set({ existingPanels: "" })}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ik weet het aantal niet
          </button>
          <RadioCards
            legend="Wat wil je vooral doen?"
            value={state.existingIntent}
            onChange={(value) => set({ existingIntent: value as ExistingIntent })}
            options={[
              { value: "extend", label: "Mijn bestaande installatie uitbreiden" },
              { value: "replace", label: "Mijn oude panelen vervangen" },
              { value: "battery", label: "Een thuisbatterij toevoegen", icon: BatteryCharging },
              { value: "advice", label: "Ik wil graag advies" },
            ]}
          />
          {state.existingIntent === "battery" ? (
            <InfoNotice>
              Voor een gedetailleerde batterijberekening kun je ook de simulator ‘Thuisbatterij’
              gebruiken. Je kunt hier gewoon verdergaan.
            </InfoNotice>
          ) : null}
        </div>
      ) : null}

      <WizardNavigation onPrev={() => goto(0)} onNext={() => goto(2)} />
    </div>
  );

  /* ---------------------------------------------------------------- stap 3 */
  const renderAdvice = () => (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">Ons eerste advies</h3>
        <p className="mt-1 text-sm text-muted-foreground">
          We berekenden automatisch een voorstel op basis van je antwoorden.
        </p>
      </div>

      <div className="rounded-xl border border-primary/30 bg-secondary p-5">
        <p className="font-display text-xl font-semibold text-foreground">
          Wij adviseren ongeveer {advice.panels} zonnepanelen
        </p>
        <ul className="mt-3 space-y-1 text-sm text-foreground">
          <li>
            {advice.panels} panelen van {PANEL_WP} Wp
          </li>
          <li>Totaal: {advice.kwp.toFixed(2)} kWp</li>
          <li>Geschatte productie: {kwh(advice.production)} per jaar</li>
          <li>Geschat aandeel van je verbruik: {advice.coverage}%</li>
          <li>Voorlopige omvormerlimiet: {advice.inverterLimitKva} kVA</li>
        </ul>
        <p className="mt-3 text-xs text-muted-foreground">
          Het definitieve aantal hangt af van de beschikbare dakruimte, oriëntatie, schaduw en
          elektrische aansluiting.
        </p>
      </div>

      {advice.roofSpaceWarning ? (
        <WarningNotice>
          Het geadviseerde aantal past mogelijk niet volledig op het beschikbare dak. We bekijken
          tijdens de analyse welke opstelling haalbaar is.
        </WarningNotice>
      ) : null}

      <AdvancedSection title="Advies handmatig aanpassen">
        <label className="block">
          <span className="mb-1.5 block text-sm font-semibold text-foreground">Aantal panelen</span>
          <select
            value={state.panelOverride === "" ? "" : String(state.panelOverride)}
            onChange={(event) =>
              set({ panelOverride: event.target.value === "" ? "" : Number(event.target.value) })
            }
            className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground"
          >
            <option value="">Advies van Nrgea ({baseAdvice.panels} panelen)</option>
            {Array.from({ length: 22 }, (_, i) => i + 6).map((n) => (
              <option key={n} value={n}>
                {n} panelen
              </option>
            ))}
          </select>
        </label>
        <p className="text-sm text-muted-foreground">
          {advice.kwp.toFixed(2)} kWp · geschatte productie {kwh(advice.production)} per jaar
        </p>
        {typeof state.panelOverride === "number" &&
        Math.abs(state.panelOverride - baseAdvice.panels) >= 5 ? (
          <WarningNotice>
            Je keuze wijkt sterk af van ons advies van {baseAdvice.panels} panelen. Dit kan de
            besparing of de haalbaarheid beïnvloeden.
          </WarningNotice>
        ) : null}
      </AdvancedSection>

      <RadioCards
        legend="Wil je ook energie kunnen opslaan voor later?"
        columns={1}
        value={state.battery}
        onChange={(value) => set({ battery: value as BatteryChoice })}
        options={[
          { value: "yes", label: "Ja, voeg een thuisbatterij toe", icon: BatteryCharging },
          { value: "no", label: "Nee, alleen zonnepanelen", icon: Sun },
          { value: "advice", label: "Ik wil dat Nrgea adviseert" },
        ]}
      />

      {state.battery === "yes" ? (
        <div className="space-y-4">
          <RadioCards
            legend="Wat vind je het belangrijkst?"
            columns={1}
            value={state.batteryPriority}
            onChange={(value) => set({ batteryPriority: value as BatteryPriority })}
            options={[
              { value: "selfUse", label: "Zoveel mogelijk eigen zonnestroom gebruiken" },
              { value: "balanced", label: "Een goede balans tussen prijs en opslag" },
              { value: "backup", label: "Extra reserve bij stroomuitval" },
              { value: "advice", label: "Ik wil advies" },
            ]}
          />
          <InfoNotice>
            Voor jouw situatie adviseren we ongeveer {batteryKwh} kWh batterijcapaciteit.
          </InfoNotice>
          <AdvancedSection>
            <label className="block">
              <span className="mb-1.5 block text-sm font-semibold text-foreground">
                Batterijcapaciteit aanpassen (optioneel)
              </span>
              <select
                value={state.batteryOverride === "" ? "" : String(state.batteryOverride)}
                onChange={(event) =>
                  set({
                    batteryOverride: event.target.value === "" ? "" : Number(event.target.value),
                  })
                }
                className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground"
              >
                <option value="">Advies van Nrgea</option>
                {Array.from({ length: 8 }, (_, i) => (i + 1) * 5).map((n) => (
                  <option key={n} value={n}>
                    {n} kWh
                  </option>
                ))}
              </select>
            </label>
          </AdvancedSection>
        </div>
      ) : null}

      {state.battery === "advice" ? (
        <div className="rounded-xl border border-border bg-card p-4">
          <p className="text-sm font-semibold text-foreground">
            Vergelijking met en zonder batterij
          </p>
          <div className="mt-3 grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">Alleen zonnepanelen</p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {euro(comparison.withoutBattery.investment)} ·{" "}
                {euro(comparison.withoutBattery.annualSavings)}/jaar
              </p>
              <p className="text-xs text-muted-foreground">
                Terugverdientijd {comparison.withoutBattery.paybackYears} jaar
              </p>
            </div>
            <div className="rounded-xl border border-border p-3">
              <p className="text-xs text-muted-foreground">
                Met batterij van {comparison.recommendedKwh} kWh
              </p>
              <p className="mt-1 text-sm font-semibold text-foreground">
                {euro(comparison.withBattery.investment)} ·{" "}
                {euro(comparison.withBattery.annualSavings)}/jaar
              </p>
              <p className="text-xs text-muted-foreground">
                Terugverdientijd {comparison.withBattery.paybackYears} jaar
              </p>
            </div>
          </div>
        </div>
      ) : null}

      <div className="space-y-2">
        <RadioCards
          legend="Wil je dat het systeem automatisch inspeelt op productie, verbruik en energietarieven?"
          columns={3}
          value={state.smartControl}
          onChange={(value) => {
            if (value === "info") {
              setShowSmartInfo(true);
              refresh();
              return;
            }
            set({ smartControl: value as State["smartControl"] });
          }}
          options={[
            { value: "yes", label: "Ja, automatisch optimaliseren" },
            { value: "no", label: "Nee" },
            { value: "info", label: "Vertel me meer" },
          ]}
        />
        {showSmartInfo ? (
          <InfoNotice>
            Een slimme sturing bepaalt automatisch wanneer de batterij wordt geladen of ontladen om
            meer eigen energie te gebruiken en dure netstroom te beperken.
          </InfoNotice>
        ) : null}
      </div>

      <WizardNavigation onPrev={() => goto(1)} onNext={() => goto(3)} />
    </div>
  );

  /* ---------------------------------------------------------------- stap 4 */
  const sourceLabel =
    resolved.source === "exact"
      ? "Exact verbruik in kWh"
      : resolved.source === "cost"
        ? "Geschat uit elektriciteitskost"
        : "Geschat op basis van gezin";

  const devicesSummary = () => {
    const items: string[] = [];
    if (state.heating === "heatPump") items.push("lucht-waterwarmtepomp");
    if (state.heating === "electric") items.push("elektrische verwarming");
    if (state.waterHeating === "electric") items.push("elektrische boiler");
    if (state.waterHeating === "heatPump") items.push("warmtepompboiler");
    if (state.car === "phev") items.push("plug-inhybride");
    if (state.car === "ev") items.push("elektrische auto");
    if (state.car === "planned") items.push("elektrische auto gepland");
    state.changes
      .filter((c) => c !== "none" && c !== "unknown")
      .forEach((c) =>
        items.push(
          c === "heatPump"
            ? "warmtepomp gepland"
            : c === "heatPumpBoiler"
              ? "warmtepompboiler gepland"
              : c === "electricCar"
                ? "elektrische auto gepland"
                : "gezinsuitbreiding",
        ),
      );
    return items.length ? Array.from(new Set(items)).join(", ") : "Nog te bepalen";
  };

  const overviewItems = [
    { label: "Manier van bepalen", value: sourceLabel },
    { label: "Gebruikt jaarverbruik", value: kwh(resolved.kwh) },
    { label: "Toestellen", value: devicesSummary() },
    {
      label: "Daktype",
      value:
        state.roofType === "pitched"
          ? "Schuin dak"
          : state.roofType === "flat"
            ? "Plat dak"
            : state.roofType === "mixed"
              ? "Combinatie (voorlopig schuin)"
              : "Wordt later gecontroleerd",
    },
    {
      label: "Beschikbare dakruimte",
      value:
        state.roofSpace === "small"
          ? "Klein deel"
          : state.roofSpace === "half"
            ? "Ongeveer de helft"
            : state.roofSpace === "most"
              ? "Grootste deel"
              : state.roofSpace === "full"
                ? "Bijna volledig dak"
                : "Wordt later gecontroleerd",
    },
    {
      label: "Schaduw",
      value:
        state.shade === "never"
          ? "Bijna nooit"
          : state.shade === "partial"
            ? "Deel van de dag"
            : state.shade === "much"
              ? "Groot deel van de dag"
              : "Voorlopig ingeschat",
    },
    {
      label: "Aansluiting",
      value:
        state.phase === "mono"
          ? "Monofase"
          : state.phase === "three"
            ? "Driefase"
            : "Nog te controleren",
    },
    {
      label: "Bestaande zonnepanelen",
      value:
        state.existingPv === "yes"
          ? typeof state.existingPanels === "number"
            ? `Ja, ongeveer ${state.existingPanels}`
            : "Ja, aantal nog te bepalen"
          : state.existingPv === "no"
            ? "Nee"
            : "Wordt later gecontroleerd",
    },
    { label: "Aanbevolen nieuwe panelen", value: `${advice.panels} × ${PANEL_WP} Wp` },
    { label: "Vermogen", value: `${advice.kwp.toFixed(2)} kWp` },
    { label: "Geschatte productie", value: `${kwh(advice.production)} per jaar` },
    {
      label: "Thuisbatterij",
      value:
        state.battery === "yes"
          ? `Ja, ongeveer ${batteryKwh} kWh`
          : state.battery === "advice"
            ? `Advies Nrgea (vergelijking ${comparison.recommendedKwh} kWh)`
            : state.battery === "no"
              ? "Nee, alleen zonnepanelen"
              : "Nog te bepalen",
    },
    {
      label: "Slimme sturing",
      value:
        state.smartControl === "yes"
          ? "Ja"
          : state.smartControl === "no"
            ? "Nee"
            : "Nog te bepalen",
    },
  ];

  const renderOverview = () => (
    <div className="space-y-5">
      <h3 className="font-display text-lg font-semibold text-foreground">Overzicht</h3>
      <ScenarioOverview title="Jouw gegevens" items={overviewItems} />
      <InfoNotice>
        Onbekende gegevens vullen we voorlopig veilig in. Nrgea controleert alles tijdens de
        persoonlijke analyse.
      </InfoNotice>
      <WizardNavigation
        onPrev={() => goto(2)}
        onNext={() => goto(4)}
        nextLabel="Naar mijn gegevens"
      />
    </div>
  );

  /* ---------------------------------------------------------------- stap 5 */
  const renderContact = () => (
    <div className="space-y-4">
      <h3 className="font-display text-lg font-semibold text-foreground">Jouw gegevens</h3>
      <ContactForm
        submitting={submitting}
        onSubmit={async (values) => {
          setSubmitting(true);
          try {
            await submitCalculatorLead({
              serviceId: service.id,
              contact: values,
              result: { advice, financials },
              answers: { ...state, resolvedKwh: resolved.kwh, source: resolved.source },
            });

            setLead(values);
            goto(5);
          } finally {
            setSubmitting(false);
          }
        }}
      />
      <button
        type="button"
        onClick={() => goto(3)}
        className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
      >
        Vorige
      </button>
    </div>
  );

  /* ---------------------------------------------------------------- stap 6 */
  const renderResult = () => (
    <ResultsShell
      price={{
        value: euro(financials.investment),
        hint: "Indicatieve installatieprijs inclusief btw.",
      }}
      scenario={overviewItems}
      summary={
        <div className="space-y-3">
          <div className="flex flex-wrap items-center gap-2">
            <span className="rounded-full bg-primary/15 px-3 py-1 text-xs font-semibold text-primary">
              {resolved.accuracy.label}
            </span>
            <span className="text-xs text-muted-foreground">
              Verbruik: {sourceLabel.toLowerCase()}
            </span>
          </div>
          <InfoNotice>
            Hoe meer werkelijke verbruiksgegevens beschikbaar zijn, hoe nauwkeuriger de berekening.
            Nrgea controleert de gegevens tijdens de persoonlijke analyse.
            {lead ? ` We nemen contact op met ${lead.firstName}.` : ""}
          </InfoNotice>
        </div>
      }
      kpis={
        <>
          <KpiCard
            label="Geschatte jaarbesparing"
            value={euro(financials.annualSavings)}
            hint="Eigen verbruik + injectie"
          />
          <KpiCard
            label="Geschatte productie"
            value={kwh(advice.production)}
            hint={`${advice.coverage}% van je verbruik`}
          />
          <KpiCard label="Terugverdientijd" value={`${financials.paybackYears} jaar`} />
        </>
      }
      advice={
        state.battery === "advice" ? (
          <div className="rounded-xl border border-border bg-card p-4 text-sm">
            <p className="font-semibold text-foreground">Met of zonder thuisbatterij</p>
            <p className="mt-1 text-muted-foreground">
              Zonder batterij: {euro(comparison.withoutBattery.investment)} investering en{" "}
              {euro(comparison.withoutBattery.annualSavings)} besparing per jaar. Met een batterij
              van {comparison.recommendedKwh} kWh: {euro(comparison.withBattery.investment)} en{" "}
              {euro(comparison.withBattery.annualSavings)} per jaar.
            </p>
          </div>
        ) : null
      }
      onRestart={() => {
        reset();
        setLead(null);
        setShowManualKwh(false);
        setShowSmartInfo(false);
        goto(0);
      }}
      onBackToOverview={onBackToOverview}
    />
  );

  return (
    <CalculatorWizardShell
      title={service.title}
      description="Ontdek in enkele eenvoudige vragen wat zonnepanelen voor jou kunnen opleveren."
      steps={STEPS}
      currentStep={step}
      onBackToOverview={onBackToOverview}
    >
      {step === 0 ? renderConsumption() : null}
      {step === 1 ? renderHome() : null}
      {step === 2 ? renderAdvice() : null}
      {step === 3 ? renderOverview() : null}
      {step === 4 ? renderContact() : null}
      {step === 5 ? renderResult() : null}
    </CalculatorWizardShell>
  );
}

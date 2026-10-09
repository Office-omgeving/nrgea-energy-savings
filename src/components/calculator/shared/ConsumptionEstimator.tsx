import { useMemo, useState } from "react";
import { Car, Euro, Gauge, Home } from "lucide-react";

import { REFERENCE_KWH_PRICE } from "@/config/solarConfig";
import {
  accuracyFor,
  estimateFromCost,
  estimateFromHousehold,
  type ConsumptionSource,
  type CostEstimate,
  type HouseholdEstimate,
} from "@/lib/solar/consumption";
import type {
  CarType,
  ChangeTag,
  HeatingType,
  PlannedCarType,
  SituationTag,
  WaterHeatingType,
} from "@/lib/solar/types";
import { measureAndPost } from "../IframeResizeReporter";
import { InfoNotice } from "../Notices";
import { NumberField } from "../NumberField";
import { RadioCards } from "../RadioCards";
import { MultiSelectCards } from "../solar/MultiSelectCards";

/** Gedeelde verbruiksvelden: gebruikt door zonnepanelen én thuisbatterij. */
export type ConsumptionState = {
  method: "kwh" | "cost" | "estimate" | "";
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
};

export const INITIAL_CONSUMPTION: ConsumptionState = {
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
};

const kwh = (value: number) => `${new Intl.NumberFormat("nl-BE").format(Math.round(value))} kWh`;

export function useResolvedConsumption(state: ConsumptionState) {
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
    [state.persons, state.heating, state.waterHeating, state.car, state.plannedCar, state.situations, state.changes],
  );
  const costEstimate = useMemo(() => {
    if (typeof state.costAmount !== "number" || state.costAmount <= 0) return null;
    return estimateFromCost({
      amount: state.costAmount,
      period: state.costPeriod === "year" ? "year" : "month",
      pricePerKwh:
        state.knowsPrice === "yes" && typeof state.kwhPrice === "number" ? state.kwhPrice : undefined,
    });
  }, [state.costAmount, state.costPeriod, state.knowsPrice, state.kwhPrice]);
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
  const pricePerKwh =
    state.knowsPrice === "yes" && typeof state.kwhPrice === "number" && state.kwhPrice > 0
      ? state.kwhPrice
      : REFERENCE_KWH_PRICE;
  return { household, costEstimate, resolved: { source, kwh: value, accuracy: accuracyFor(source) }, pricePerKwh };
}

export function ConsumptionEstimator({
  state,
  set,
  household,
  costEstimate,
}: {
  state: ConsumptionState;
  set: (patch: Partial<ConsumptionState>) => void;
  household: HouseholdEstimate;
  costEstimate: CostEstimate | null;
}) {
  const [showManualKwh, setShowManualKwh] = useState(false);
  const refresh = () => requestAnimationFrame(measureAndPost);
  const switchToEstimate = () => set({ method: "estimate" });

  return (
    <>
      <RadioCards
        columns={1}
        value={state.method}
        onChange={(value) => set({ method: value as ConsumptionState["method"] })}
        options={[
          {
            value: "kwh",
            label: "Ik ken mijn verbruik in kWh",
            description: "Het jaarlijkse verbruik staat op je jaarafrekening.",
            icon: Gauge,
          },
          {
            value: "cost",
            label: "Ik ken mijn elektriciteitskost",
            description: "Gebruik je maandelijkse voorschot of jaarlijkse elektriciteitsfactuur.",
            icon: Euro,
          },
          {
            value: "estimate",
            label: "Maak een inschatting voor mij",
            description: "We schatten je verbruik op basis van je gezin en elektrische toestellen.",
            icon: Home,
          },
        ]}
      />

      {state.method === "kwh" ? (
        <div className="space-y-3">
          <NumberField
            label="Hoeveel elektriciteit verbruik je per jaar?"
            unit="kWh"
            min={1}
            max={50000}
            placeholder="Bijvoorbeeld 3.500"
            hint="Zoek op je jaarafrekening naar ‘jaarlijks verbruik’, ‘afname’ of ‘verbruik in kWh’."
            value={state.kwhPerYear}
            onChange={(value) => set({ kwhPerYear: value })}
          />
          <button
            type="button"
            onClick={switchToEstimate}
            className="text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ik kan dit niet vinden
          </button>
        </div>
      ) : null}

      {state.method === "cost" ? (
        <div className="space-y-4">
          <RadioCards
            legend="Is dit bedrag alleen voor elektriciteit?"
            columns={1}
            value={state.costElectricityOnly}
            onChange={(value) =>
              set({ costElectricityOnly: value as ConsumptionState["costElectricityOnly"] })
            }
            options={[
              { value: "yes", label: "Ja, alleen elektriciteit" },
              { value: "no", label: "Nee, elektriciteit en gas samen" },
              { value: "unknown", label: "Ik weet het niet" },
            ]}
          />

          {state.costElectricityOnly === "no" || state.costElectricityOnly === "unknown" ? (
            <div className="space-y-3">
              <InfoNotice>
                Omdat gas en elektriciteit samen op je factuur staan, kunnen we het stroomverbruik
                niet betrouwbaar uit het totaalbedrag halen. We maken daarom een inschatting op
                basis van je gezin.
              </InfoNotice>
              <button
                type="button"
                onClick={switchToEstimate}
                className="inline-flex h-11 items-center justify-center rounded-xl bg-primary px-5 text-sm font-semibold text-primary-foreground hover:opacity-90"
              >
                Maak een inschatting
              </button>
            </div>
          ) : null}

          {state.costElectricityOnly === "yes" ? (
            <div className="space-y-4">
              <RadioCards
                legend="Welk bedrag ken je?"
                value={state.costPeriod}
                onChange={(value) => set({ costPeriod: value as ConsumptionState["costPeriod"] })}
                options={[
                  { value: "month", label: "Mijn maandelijkse elektriciteitskost" },
                  { value: "year", label: "Mijn jaarlijkse elektriciteitskost" },
                ]}
              />

              {state.costPeriod ? (
                <NumberField
                  label={
                    state.costPeriod === "month"
                      ? "Maandelijkse elektriciteitskost"
                      : "Jaarlijkse elektriciteitskost"
                  }
                  unit="€"
                  min={1}
                  placeholder={
                    state.costPeriod === "month" ? "Bijvoorbeeld €110" : "Bijvoorbeeld €1.320"
                  }
                  hint="Gebruik alleen het elektriciteitsgedeelte. Tel gas, water en andere diensten niet mee."
                  value={state.costAmount}
                  onChange={(value) => set({ costAmount: value })}
                />
              ) : null}

              <RadioCards
                legend="Ken je je huidige prijs per kWh? (optioneel)"
                value={state.knowsPrice}
                onChange={(value) => set({ knowsPrice: value as ConsumptionState["knowsPrice"] })}
                options={[
                  { value: "yes", label: "Ja" },
                  { value: "no", label: "Nee" },
                ]}
              />
              {state.knowsPrice === "yes" ? (
                <NumberField
                  label="Prijs per kWh"
                  unit="€/kWh"
                  step={0.01}
                  placeholder="Bijvoorbeeld 0,33"
                  value={state.kwhPrice}
                  onChange={(value) => set({ kwhPrice: value })}
                />
              ) : null}
              {state.knowsPrice === "no" ? (
                <InfoNotice>We rekenen voorlopig met €0,33 per kWh.</InfoNotice>
              ) : null}

              {costEstimate ? (
                <div className="rounded-xl border border-primary/30 bg-secondary p-4">
                  <p className="text-sm font-semibold text-foreground">
                    Geschat jaarlijks verbruik: ongeveer {kwh(costEstimate.kwh)}
                  </p>
                  <p className="mt-1 text-xs text-muted-foreground">
                    Dit is een ruwe inschatting. Vaste kosten en nettarieven kunnen op je factuur
                    zijn inbegrepen.
                  </p>
                  <div className="mt-3 flex flex-col gap-2 sm:flex-row">
                    <button
                      type="button"
                      onClick={() => set({ costAccepted: true })}
                      className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold ${
                        state.costAccepted
                          ? "bg-primary text-primary-foreground"
                          : "border border-border bg-card text-foreground"
                      }`}
                    >
                      Deze inschatting gebruiken
                    </button>
                    <button
                      type="button"
                      onClick={switchToEstimate}
                      className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground"
                    >
                      Liever inschatten op basis van mijn gezin
                    </button>
                  </div>
                </div>
              ) : null}
            </div>
          ) : null}
        </div>
      ) : null}

      {state.method === "estimate" ? (
      <div className="space-y-5">
        <h4 className="font-display text-base font-semibold text-foreground">
          Vertel ons kort over je situatie
        </h4>
  
        <RadioCards
          legend="Hoeveel personen wonen er in de woning?"
          columns={3}
          value={state.persons === "" ? "" : String(state.persons)}
          onChange={(value) => set({ persons: Number(value) })}
          options={[
            { value: "1", label: "1 persoon" },
            { value: "2", label: "2 personen" },
            { value: "3", label: "3 personen" },
            { value: "4", label: "4 personen" },
            { value: "5", label: "5 personen" },
            { value: "6", label: "6 of meer" },
          ]}
        />
  
        <RadioCards
          legend="Hoe wordt de woning voornamelijk verwarmd?"
          value={state.heating}
          onChange={(value) => set({ heating: value as HeatingType })}
          options={[
            { value: "fossil", label: "Gas, stookolie of warmtenet" },
            {
              value: "heatPump",
              label: "Lucht-waterwarmtepomp",
              description:
                "Een installatie die de woning verwarmt via vloerverwarming of radiatoren.",
            },
            { value: "electric", label: "Elektrische verwarming of accumulatie" },
            { value: "other", label: "Anders" },
            { value: "unknown", label: "Ik weet het niet" },
          ]}
        />
  
        <RadioCards
          legend="Hoe wordt je sanitair warm water verwarmd?"
          value={state.waterHeating}
          onChange={(value) => set({ waterHeating: value as WaterHeatingType })}
          options={[
            { value: "boilerCentral", label: "Via de gasketel of verwarmingsketel" },
            { value: "electric", label: "Elektrische boiler" },
            { value: "heatPump", label: "Warmtepompboiler" },
            { value: "other", label: "Anders" },
            { value: "unknown", label: "Ik weet het niet" },
          ]}
        />
  
        <RadioCards
          legend="Heb je een elektrische auto die je thuis oplaadt?"
          value={state.car}
          onChange={(value) => set({ car: value as CarType })}
          options={[
            { value: "none", label: "Nee" },
            { value: "phev", label: "Ja, een plug-inhybride", icon: Car },
            { value: "ev", label: "Ja, een volledig elektrische auto", icon: Car },
            { value: "planned", label: "Nog niet, maar wel gepland binnen twee jaar" },
          ]}
        />
  
        {state.car === "planned" ? (
          <RadioCards
            legend="Wat ben je van plan?"
            columns={3}
            value={state.plannedCar}
            onChange={(value) => set({ plannedCar: value as PlannedCarType })}
            options={[
              { value: "phev", label: "Plug-inhybride" },
              { value: "ev", label: "Volledig elektrische auto" },
              { value: "unknown", label: "Ik weet het nog niet" },
            ]}
          />
        ) : null}
  
        <MultiSelectCards
          legend="Welke situaties zijn nog van toepassing?"
          values={state.situations}
          exclusive={["none"]}
          onChange={(values) => set({ situations: values as SituationTag[] })}
          options={[
            { value: "homeWorking", label: "We werken regelmatig thuis" },
            { value: "airco", label: "We gebruiken airconditioning" },
            { value: "pool", label: "We hebben een zwembad of jacuzzi" },
            { value: "none", label: "Geen van deze" },
          ]}
        />
  
        <MultiSelectCards
          legend="Verwacht je binnen twee jaar een grote verandering?"
          values={state.changes}
          exclusive={["none", "unknown"]}
          onChange={(values) => set({ changes: values as ChangeTag[] })}
          options={[
            { value: "heatPump", label: "Een lucht-waterwarmtepomp" },
            { value: "heatPumpBoiler", label: "Een warmtepompboiler" },
            { value: "electricCar", label: "Een elektrische auto" },
            { value: "familyGrowth", label: "Een uitbreiding van het gezin" },
            { value: "none", label: "Geen grote verandering" },
            { value: "unknown", label: "Ik weet het nog niet" },
          ]}
        />
  
        <div className="rounded-xl border border-primary/30 bg-secondary p-4">
          <p className="text-xs font-medium text-muted-foreground">
            Geschat jaarlijks stroomverbruik
          </p>
          <p className="mt-1 font-display text-2xl font-semibold text-foreground">
            Ongeveer {kwh(household.total)} per jaar
          </p>
          <ul className="mt-3 space-y-1 text-xs text-muted-foreground">
            {household.breakdown.map((item, index) => (
              <li key={item.label} className="flex justify-between gap-4">
                <span>{item.label}</span>
                <span>
                  {index === 0 ? "" : "+"}
                  {kwh(item.kwh)}
                </span>
              </li>
            ))}
            <li className="flex justify-between gap-4 border-t border-border pt-1 font-semibold text-foreground">
              <span>Totaal</span>
              <span>ongeveer {kwh(household.total)}</span>
            </li>
          </ul>
          <div className="mt-3 flex flex-col gap-2 sm:flex-row">
            <button
              type="button"
              onClick={() => set({ householdAccepted: true })}
              className={`inline-flex h-11 items-center justify-center rounded-xl px-5 text-sm font-semibold ${
                state.householdAccepted
                  ? "bg-primary text-primary-foreground"
                  : "border border-border bg-card text-foreground"
              }`}
            >
              Deze inschatting gebruiken
            </button>
            <button
              type="button"
              onClick={() => set({ householdAccepted: false })}
              className="inline-flex h-11 items-center justify-center rounded-xl border border-border bg-card px-5 text-sm font-medium text-foreground"
            >
              Mijn antwoorden aanpassen
            </button>
          </div>
          <button
            type="button"
            onClick={() => {
              setShowManualKwh(true);
              refresh();
            }}
            className="mt-3 text-sm font-medium text-primary underline-offset-4 hover:underline"
          >
            Ik wil het geschatte verbruik handmatig aanpassen
          </button>
          {showManualKwh ? (
            <div className="mt-3">
              <NumberField
                label="Geschat jaarlijks verbruik"
                unit="kWh"
                min={1}
                max={50000}
                value={state.manualKwh}
                onChange={(value) => set({ manualKwh: value })}
              />
            </div>
          ) : null}
        </div>
      </div>
      ) : null}
    </>
  );
}

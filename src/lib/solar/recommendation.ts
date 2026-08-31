import {
  BATTERY_MAX_KWH,
  BATTERY_MIN_KWH,
  BATTERY_STEP_KWH,
  INJECTION_PRICE,
  INVERTER_LIMIT_KVA,
  KWP_PER_PANEL,
  MAX_PANELS,
  MIN_PANELS,
  PRICING,
  REFERENCE_KWH_PRICE,
  SELF_CONSUMPTION_WITHOUT_BATTERY,
  SELF_CONSUMPTION_WITH_BATTERY,
  SHADE_FACTORS,
  YIELD_PER_KWP,
} from "@/config/solarConfig";
import type { BatteryPriority, PhaseType, RoofSpace, ShadeLevel } from "./types";

export function shadeFactor(shade: ShadeLevel): number {
  return SHADE_FACTORS[shade] ?? SHADE_FACTORS.unknown;
}

export type PanelAdvice = {
  panels: number;
  kwp: number;
  production: number;
  coverage: number;
  shadeFactor: number;
  inverterLimitKva: number;
  roofSpaceWarning: boolean;
};

/** Maximaal aantal panelen dat we indicatief aanhouden per dakruimtekeuze. */
const ROOF_SPACE_HINT: Record<RoofSpace, number> = {
  small: 10,
  half: 16,
  most: 22,
  full: MAX_PANELS,
  unknown: MAX_PANELS,
};

export function recommendPanels({
  consumptionKwh,
  shade = "unknown",
  phase = "unknown",
  roofSpace = "unknown",
  override,
}: {
  consumptionKwh: number;
  shade?: ShadeLevel;
  phase?: PhaseType;
  roofSpace?: RoofSpace;
  override?: number | null;
}): PanelAdvice {
  const factor = shadeFactor(shade);
  const perPanel = KWP_PER_PANEL * YIELD_PER_KWP * factor;
  const ideal = Math.round(consumptionKwh / perPanel);
  const recommended = Math.min(MAX_PANELS, Math.max(MIN_PANELS, ideal || MIN_PANELS));
  const panels = override
    ? Math.min(MAX_PANELS, Math.max(MIN_PANELS, Math.round(override)))
    : recommended;
  const kwp = Number((panels * KWP_PER_PANEL).toFixed(2));
  const production = Math.round(panels * perPanel);
  const coverage = consumptionKwh > 0 ? Math.round((production / consumptionKwh) * 100) : 0;

  return {
    panels,
    kwp,
    production,
    coverage,
    shadeFactor: factor,
    inverterLimitKva: INVERTER_LIMIT_KVA[phase] ?? INVERTER_LIMIT_KVA.unknown,
    roofSpaceWarning: panels > (ROOF_SPACE_HINT[roofSpace] ?? MAX_PANELS),
  };
}

const roundToStep = (value: number) =>
  Math.min(
    BATTERY_MAX_KWH,
    Math.max(BATTERY_MIN_KWH, Math.round(value / BATTERY_STEP_KWH) * BATTERY_STEP_KWH),
  );

/** Indicatief batterijadvies: ongeveer 1 kWh per kWp, bijgestuurd op voorkeur. */
export function recommendBatteryKwh({
  kwp,
  priority = "balanced",
  override,
}: {
  kwp: number;
  priority?: BatteryPriority;
  override?: number | null;
}): number {
  if (override) return roundToStep(override);
  const base = roundToStep(kwp);
  const steps = priority === "selfUse" ? 1 : priority === "backup" ? 2 : 0;
  return roundToStep(base + steps * BATTERY_STEP_KWH);
}

export type Financials = {
  investment: number;
  annualSavings: number;
  selfConsumedKwh: number;
  injectedKwh: number;
  paybackYears: number;
};

export function computeFinancials({
  panels,
  production,
  consumptionKwh,
  batteryKwh = 0,
  smartControl = false,
  pricePerKwh = REFERENCE_KWH_PRICE,
}: {
  panels: number;
  production: number;
  consumptionKwh: number;
  batteryKwh?: number;
  smartControl?: boolean;
  pricePerKwh?: number;
}): Financials {
  const share = batteryKwh > 0 ? SELF_CONSUMPTION_WITH_BATTERY : SELF_CONSUMPTION_WITHOUT_BATTERY;
  const selfConsumedKwh = Math.round(Math.min(production * share, consumptionKwh));
  const injectedKwh = Math.max(0, production - selfConsumedKwh);
  const annualSavings = Math.round(
    selfConsumedKwh * pricePerKwh + injectedKwh * INJECTION_PRICE,
  );
  const investment = Math.round(
    PRICING.pvBase +
      panels * PRICING.pvPerPanel +
      (batteryKwh > 0 ? PRICING.batteryBase + batteryKwh * PRICING.batteryPerKwh : 0) +
      (smartControl ? PRICING.smartControl : 0),
  );
  const paybackYears = annualSavings > 0 ? Number((investment / annualSavings).toFixed(1)) : 0;
  return { investment, annualSavings, selfConsumedKwh, injectedKwh, paybackYears };
}

export type BatteryComparison = {
  withoutBattery: Financials;
  withBattery: Financials;
  recommendedKwh: number;
};

/** Vergelijking met en zonder batterij, zodat er nooit stilzwijgend duur gekozen wordt. */
export function compareBatteryScenarios(input: {
  panels: number;
  production: number;
  consumptionKwh: number;
  kwp: number;
  priority?: BatteryPriority;
  smartControl?: boolean;
  pricePerKwh?: number;
}): BatteryComparison {
  const recommendedKwh = recommendBatteryKwh({
    kwp: input.kwp,
    ...(input.priority ? { priority: input.priority } : {}),
  });
  return {
    recommendedKwh,
    withoutBattery: computeFinancials({ ...input, batteryKwh: 0 }),
    withBattery: computeFinancials({ ...input, batteryKwh: recommendedKwh }),
  };
}

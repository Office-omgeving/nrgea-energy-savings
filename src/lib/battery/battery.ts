/**
 * Indicatieve rekenlogica voor de thuisbatterijflow.
 * Alle aannames staan centraal in BATTERY_CONFIG en zijn bewust eenvoudig.
 */
import { REFERENCE_KWH_PRICE } from "@/config/solarConfig";
import type { ConsumptionSource } from "@/lib/solar/consumption";

export type HasPv = "yes" | "no" | "soon" | "unknown";
export type PvKnowledge = "production" | "panels" | "unknown";
export type InstallPeriod = "pre2015" | "2015to2019" | "2020to2022" | "2023plus" | "unknown";
export type PvPlan = "withBattery" | "later" | "no" | "advice";
export type InstallAge = "lt5" | "5to10" | "gt10" | "unknown";
export type MeterType = "yes" | "no" | "unknown";
export type ContractType = "fixed" | "variable" | "dynamic" | "unknown";
export type Phase = "mono" | "three" | "unknown";
export type Goal = "selfUse" | "balanced" | "cheapHours" | "backup" | "advice";
export type BackupPref = "few" | "large" | "no" | "unknown";
export type SmartPref = "yes" | "no" | "info" | "advice";

export const BATTERY_CONFIG = {
  yieldPerKwp: 950,
  wpByPeriod: {
    pre2015: 275,
    "2015to2019": 325,
    "2020to2022": 385,
    "2023plus": 430,
    unknown: 385,
  } satisfies Record<InstallPeriod, number>,
  exactWpOptions: [250, 275, 300, 325, 350, 370, 385, 400, 410, 420, 430, 440, 450, 465],
  capacities: [5, 10, 15, 20, 25, 30, 35, 40],
  goalFactor: {
    selfUse: 1.2,
    balanced: 1,
    cheapHours: 1.1,
    backup: 1.4,
    advice: 1,
  } satisfies Record<Goal, number>,
  selfConsumption: { without: 0.35, battery: 0.68, smart: 0.79 },
  /** Dynamisch-tariefscenario zonder PV: zeer indicatief. */
  dynamic: { cycleDays: 250, usableShare: 0.9, spreadPerKwh: 0.1 },
  pricePerKwh: REFERENCE_KWH_PRICE,
} as const;

type PricePoint = [number, number];
export const PRICE_TABLES: Record<"compatible" | "hybrid", Record<"mono" | "three", PricePoint[]>> = {
  compatible: {
    mono: [[5, 2563], [10, 3461], [15, 4485], [20, 5462]],
    three: [[5, 2563], [10, 3671], [15, 4603], [20, 5494], [25, 6441], [30, 7228]],
  },
  hybrid: {
    mono: [[5, 4228], [10, 4955], [15, 5941], [20, 6860]],
    three: [[5, 4228], [10, 5492], [15, 6378], [20, 7203], [25, 7967], [30, 8669]],
  },
};

/* ------------------------------------------------------------------ PV */

export type PvStatus = "exact" | "estimated" | "toCheck" | "planned" | "none";

export type PvEstimate = {
  kwp: number;
  production: number;
  status: PvStatus;
  wpPerPanel: number | null;
  hasExisting: boolean;
};

export function estimatePv(input: {
  hasPv: HasPv | "";
  knowledge?: PvKnowledge | "";
  annualProduction?: number | "";
  panels?: number | "";
  period?: InstallPeriod | "";
  exactWp?: number | "";
  pvPlan?: PvPlan | "";
  consumptionKwh: number;
}): PvEstimate {
  const y = BATTERY_CONFIG.yieldPerKwp;
  const fromConsumption = () => {
    const kwp = Number((Math.max(0, input.consumptionKwh) / y).toFixed(2));
    return { kwp, production: Math.round(kwp * y) };
  };

  if (input.hasPv === "yes") {
    if (
      input.knowledge === "production" &&
      typeof input.annualProduction === "number" &&
      input.annualProduction > 0
    ) {
      return {
        kwp: Number((input.annualProduction / y).toFixed(2)),
        production: Math.round(input.annualProduction),
        status: "exact",
        wpPerPanel: null,
        hasExisting: true,
      };
    }
    if (input.knowledge === "panels" && typeof input.panels === "number" && input.panels > 0) {
      const wp =
        typeof input.exactWp === "number" && input.exactWp > 0
          ? input.exactWp
          : BATTERY_CONFIG.wpByPeriod[(input.period || "unknown") as InstallPeriod];
      const kwp = Number(((input.panels * wp) / 1000).toFixed(2));
      return { kwp, production: Math.round(kwp * y), status: "estimated", wpPerPanel: wp, hasExisting: true };
    }
    return { ...fromConsumption(), status: "toCheck", wpPerPanel: null, hasExisting: true };
  }

  const plansNow = input.hasPv === "soon" || (input.hasPv === "no" && input.pvPlan === "withBattery");
  if (plansNow) return { ...fromConsumption(), status: "planned", wpPerPanel: null, hasExisting: false };
  if (input.hasPv === "unknown")
    return { ...fromConsumption(), status: "toCheck", wpPerPanel: null, hasExisting: false };
  return { kwp: 0, production: 0, status: "none", wpPerPanel: null, hasExisting: false };
}

/* ------------------------------------------------------------ omvormer */

export type InverterCheck = "hybridLikely" | "checkRecent" | "unknown" | "notApplicable";

export function inverterCheck(input: {
  hasExisting: boolean;
  period?: InstallPeriod | "";
  age?: InstallAge | "";
}): InverterCheck {
  if (!input.hasExisting) return "notApplicable";
  const p = input.period;
  if (p === "pre2015" || p === "2015to2019") return "hybridLikely";
  if (p === "2020to2022" || p === "2023plus") return "checkRecent";
  if (input.age === "5to10" || input.age === "gt10") return "hybridLikely";
  if (input.age === "lt5") return "checkRecent";
  return "unknown";
}

export const INVERTER_TEXT: Record<InverterCheck, string> = {
  hybridLikely: "Mogelijk is een nieuwe of hybride omvormer nodig.",
  checkRecent: "De bestaande omvormer moet nog op compatibiliteit worden gecontroleerd.",
  unknown: "Compatibiliteit wordt tijdens de technische analyse gecontroleerd.",
  notApplicable: "Een passende omvormer wordt meegenomen in het voorstel.",
};

/* ------------------------------------------------------------ capaciteit */

export function roundCapacity(value: number): number {
  const caps = BATTERY_CONFIG.capacities;
  let best = caps[0]!;
  const caps: readonly number[] = BATTERY_CONFIG.capacities;
  const i = caps.indexOf(roundCapacity(capacity));
  return best;
}

export function stepUp(capacity: number): number {
  const caps = BATTERY_CONFIG.capacities;
  const i = caps.indexOf(roundCapacity(capacity) as (typeof caps)[number]);
  return caps[Math.min(caps.length - 1, i + 1)]!;
}

export function recommendCapacity(input: {
  kwp: number;
  consumptionKwh: number;
  goal?: Goal | "";
  backup?: BackupPref | "";
}): { capacity: number; base: number } {
  const daily = Math.max(0, input.consumptionKwh) / 365;
  const base = input.kwp > 0 ? Math.max(input.kwp, daily * 0.5) : daily * 0.5;
  const factor = BATTERY_CONFIG.goalFactor[(input.goal || "advice") as Goal];
  let capacity = roundCapacity(base * factor);
  if (input.backup === "few") capacity = Math.max(10, capacity);
  if (input.backup === "large") capacity = stepUp(capacity);
  return { capacity, base: Number(base.toFixed(2)) };
}

export type DeviationWarning = "muchSmaller" | "muchLarger" | null;
export function deviationWarning(chosen: number, recommended: number): DeviationWarning {
  if (chosen <= recommended - 10 || chosen <= recommended / 2) return "muchSmaller";
  if (chosen >= recommended + 10 || chosen >= recommended * 2) return "muchLarger";
  return null;
}

/* ------------------------------------------------------------------ prijs */

export function interpolate(points: PricePoint[], x: number): number {
  const first = points[0]!;
  const last = points[points.length - 1]!;
  if (x <= first[0]) return first[1];
  for (let i = 1; i < points.length; i++) {
    const [x1, y1] = points[i]!;
    const [x0, y0] = points[i - 1]!;
    if (x <= x1) return Math.round(y0 + ((y1 - y0) * (x - x0)) / (x1 - x0));
  }
  // Boven de tabel: extrapoleer met de laatste helling.
  const [px, py] = points[points.length - 2]!;
  return Math.round(last[1] + ((last[1] - py) / (last[0] - px)) * (x - last[0]));
}

export type PriceEstimate = {
  low: number;
  high: number;
  isRange: boolean;
  hybridIncluded: boolean;
  phaseUsed: "mono" | "three";
  phaseToCheck: boolean;
};

export function batteryPrice(input: {
  capacity: number;
  phase: Phase | "";
  inverter: InverterCheck;
}): PriceEstimate {
  const phaseUsed = input.phase === "three" ? "three" : "mono";
  const compatible = interpolate(PRICE_TABLES.compatible[phaseUsed], input.capacity);
  const hybrid = interpolate(PRICE_TABLES.hybrid[phaseUsed], input.capacity);
  const phaseToCheck = input.phase !== "mono" && input.phase !== "three";
  if (input.inverter === "hybridLikely" || input.inverter === "notApplicable")
    return { low: hybrid, high: hybrid, isRange: false, hybridIncluded: true, phaseUsed, phaseToCheck };
  if (input.inverter === "unknown")
    return { low: compatible, high: hybrid, isRange: true, hybridIncluded: false, phaseUsed, phaseToCheck };
  return { low: compatible, high: compatible, isRange: false, hybridIncluded: false, phaseUsed, phaseToCheck };
}

/* --------------------------------------------------------------- besparing */

export function selfConsumptionShare(smart: boolean): number {
  return smart ? BATTERY_CONFIG.selfConsumption.smart : BATTERY_CONFIG.selfConsumption.battery;
}

export type EnergyFlow = {
  production: number;
  selfWithout: number;
  selfWith: number;
  extraSelf: number;
  stored: number;
  injectedWithout: number;
  injectedWith: number;
  gridBefore: number;
  gridAfter: number;
  shareWithout: number;
  shareWith: number;
};

export function energyFlow(input: {
  production: number;
  consumptionKwh: number;
  smart: boolean;
}): EnergyFlow {
  const shareWithout = BATTERY_CONFIG.selfConsumption.without;
  const shareWith = selfConsumptionShare(input.smart);
  const selfWithout = Math.round(Math.min(input.production * shareWithout, input.consumptionKwh));
  const selfWith = Math.round(Math.min(input.production * shareWith, input.consumptionKwh));
  const extraSelf = Math.max(0, selfWith - selfWithout);
  return {
    production: Math.round(input.production),
    selfWithout,
    selfWith,
    extraSelf,
    stored: extraSelf,
    injectedWithout: Math.max(0, Math.round(input.production) - selfWithout),
    injectedWith: Math.max(0, Math.round(input.production) - selfWith),
    gridBefore: Math.max(0, Math.round(input.consumptionKwh) - selfWithout),
    gridAfter: Math.max(0, Math.round(input.consumptionKwh) - selfWith),
    shareWithout,
    shareWith,
  };
}

export type Savings =
  | { kind: "pv"; annual: number }
  | { kind: "dynamic"; annual: number; shiftedKwh: number }
  | { kind: "custom" };

export function computeSavings(input: {
  production: number;
  consumptionKwh: number;
  smart: boolean;
  capacity: number;
  contract: ContractType | "";
  pricePerKwh?: number;
}): Savings {
  const price = input.pricePerKwh ?? BATTERY_CONFIG.pricePerKwh;
  if (input.production > 0) {
    const flow = energyFlow(input);
    return { kind: "pv", annual: Math.round(flow.extraSelf * price) };
  }
  // Geen zonnepanelen: nooit fictieve PV-besparing.
  if (input.contract !== "dynamic") return { kind: "custom" };
  const d = BATTERY_CONFIG.dynamic;
  const shiftedKwh = Math.round(
    Math.min(input.capacity * d.usableShare * d.cycleDays, input.consumptionKwh * 0.5),
  );
  return { kind: "dynamic", annual: Math.round(shiftedKwh * d.spreadPerKwh), shiftedKwh };
}

export function paybackYears(investment: number, annual: number | null | undefined): number | null {
  if (!annual || annual <= 0 || !Number.isFinite(annual)) return null;
  return Number((investment / annual).toFixed(1));
}

/* ------------------------------------------------------------ nauwkeurigheid */

export function batteryAccuracy(pv: PvStatus, consumption: ConsumptionSource): string {
  const pvExact = pv === "exact";
  const consExact = consumption === "exact";
  if (pvExact && consExact) return "Hoge nauwkeurigheid";
  if (pvExact || consExact) return "Goede indicatie";
  return "Eerste inschatting";
}

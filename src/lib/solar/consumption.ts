import {
  ADDON_KWH,
  HOUSEHOLD_BASE_KWH,
  REFERENCE_KWH_PRICE,
} from "@/config/solarConfig";
import type { BreakdownItem, CostPeriod, HouseholdAnswers } from "./types";

export type HouseholdEstimate = {
  total: number;
  breakdown: BreakdownItem[];
};

const clampPersons = (persons: number) => Math.min(6, Math.max(1, Math.round(persons || 1)));

/**
 * Indicatieve inschatting op basis van het gezinsprofiel.
 * Voorkomt dubbeltelling tussen huidige en geplande toestellen.
 */
export function estimateFromHousehold(answers: HouseholdAnswers): HouseholdEstimate {
  const persons = clampPersons(answers.persons);
  const base = HOUSEHOLD_BASE_KWH[persons] ?? HOUSEHOLD_BASE_KWH[4]!;
  const breakdown: BreakdownItem[] = [
    { label: `Basisverbruik gezin (${persons} ${persons === 1 ? "persoon" : "personen"})`, kwh: base },
  ];

  let hasHeatPump = false;
  if (answers.heating === "heatPump") {
    hasHeatPump = true;
    breakdown.push({ label: "Lucht-waterwarmtepomp", kwh: ADDON_KWH.heatPumpAirWater });
  } else if (answers.heating === "electric") {
    breakdown.push({ label: "Elektrische verwarming", kwh: ADDON_KWH.electricHeating });
  }

  let hasHeatPumpBoiler = false;
  if (answers.waterHeating === "electric") {
    breakdown.push({ label: "Elektrische boiler", kwh: ADDON_KWH.electricBoiler });
  } else if (answers.waterHeating === "heatPump") {
    hasHeatPumpBoiler = true;
    breakdown.push({ label: "Warmtepompboiler", kwh: ADDON_KWH.heatPumpBoiler });
  }

  let hasCar = false;
  if (answers.car === "phev") {
    hasCar = true;
    breakdown.push({ label: "Plug-inhybride", kwh: ADDON_KWH.plugInHybrid });
  } else if (answers.car === "ev") {
    hasCar = true;
    breakdown.push({ label: "Elektrische auto", kwh: ADDON_KWH.fullElectricCar });
  } else if (answers.car === "planned") {
    hasCar = true;
    const planned =
      answers.plannedCar === "phev" ? ADDON_KWH.plugInHybrid : ADDON_KWH.fullElectricCar;
    breakdown.push({ label: "Geplande elektrische auto", kwh: planned });
  }

  if (answers.situations.includes("homeWorking")) {
    breakdown.push({ label: "Regelmatig thuiswerken", kwh: ADDON_KWH.homeWorking });
  }
  if (answers.situations.includes("airco")) {
    breakdown.push({ label: "Airconditioning", kwh: ADDON_KWH.airconditioning });
  }
  if (answers.situations.includes("pool")) {
    breakdown.push({ label: "Zwembad of jacuzzi", kwh: ADDON_KWH.pool });
  }

  if (answers.changes.includes("heatPump") && !hasHeatPump) {
    breakdown.push({ label: "Geplande warmtepomp", kwh: ADDON_KWH.plannedHeatPump });
  }
  if (answers.changes.includes("heatPumpBoiler") && !hasHeatPumpBoiler) {
    breakdown.push({ label: "Geplande warmtepompboiler", kwh: ADDON_KWH.plannedHeatPumpBoiler });
  }
  if (answers.changes.includes("electricCar") && !hasCar) {
    breakdown.push({ label: "Geplande elektrische auto", kwh: ADDON_KWH.plannedElectricCar });
  }
  if (answers.changes.includes("familyGrowth")) {
    breakdown.push({ label: "Gezinsuitbreiding", kwh: ADDON_KWH.plannedFamilyGrowth });
  }

  const total = breakdown.reduce((sum, item) => sum + item.kwh, 0);
  return { total, breakdown };
}

export type CostEstimate = {
  annualCost: number;
  pricePerKwh: number;
  usedReferencePrice: boolean;
  kwh: number;
};

/** Ruwe inschatting van het verbruik op basis van de elektriciteitskost. */
export function estimateFromCost({
  amount,
  period,
  pricePerKwh,
}: {
  amount: number;
  period: CostPeriod;
  pricePerKwh?: number | undefined;
}): CostEstimate {
  const annualCost = period === "month" ? amount * 12 : amount;
  const usedReferencePrice = !pricePerKwh || pricePerKwh <= 0;
  const price = usedReferencePrice ? REFERENCE_KWH_PRICE : pricePerKwh!;
  return {
    annualCost,
    pricePerKwh: price,
    usedReferencePrice,
    kwh: Math.round(annualCost / price),
  };
}

export type ConsumptionSource = "exact" | "cost" | "household";

export type AccuracyLevel = {
  label: string;
  source: ConsumptionSource;
};

export function accuracyFor(source: ConsumptionSource): AccuracyLevel {
  if (source === "exact") return { source, label: "Hoge nauwkeurigheid" };
  if (source === "cost") return { source, label: "Goede indicatie" };
  return { source, label: "Eerste inschatting" };
}

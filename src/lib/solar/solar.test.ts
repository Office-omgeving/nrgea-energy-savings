import { describe, expect, it } from "vitest";

import { HOUSEHOLD_BASE_KWH, ADDON_KWH, REFERENCE_KWH_PRICE } from "@/config/solarConfig";
import { accuracyFor, estimateFromCost, estimateFromHousehold } from "./consumption";
import {
  compareBatteryScenarios,
  recommendBatteryKwh,
  recommendPanels,
  shadeFactor,
} from "./recommendation";
import type { HouseholdAnswers } from "./types";

const baseAnswers = (patch: Partial<HouseholdAnswers> = {}): HouseholdAnswers => ({
  persons: 4,
  heating: "fossil",
  waterHeating: "boilerCentral",
  car: "none",
  plannedCar: "unknown",
  situations: [],
  changes: [],
  ...patch,
});

describe("verbruik uit kWh en kost", () => {
  it("gebruikt exact verbruik met hoge nauwkeurigheid", () => {
    expect(accuracyFor("exact").label).toBe("Hoge nauwkeurigheid");
  });

  it("schat verbruik uit maandelijkse elektriciteitskost", () => {
    const result = estimateFromCost({ amount: 110, period: "month" });
    expect(result.annualCost).toBe(1320);
    expect(result.pricePerKwh).toBe(REFERENCE_KWH_PRICE);
    expect(result.kwh).toBe(4000);
    expect(accuracyFor("cost").label).toBe("Goede indicatie");
  });

  it("schat verbruik uit jaarlijkse elektriciteitskost met eigen prijs", () => {
    const result = estimateFromCost({ amount: 1320, period: "year", pricePerKwh: 0.44 });
    expect(result.usedReferencePrice).toBe(false);
    expect(result.kwh).toBe(3000);
  });

  it("valt bij een gecombineerde gas- en elektriciteitsfactuur terug op het gezinsprofiel", () => {
    // De UI schakelt in dat geval naar de gezinsinschatting; die blijft bruikbaar.
    const estimate = estimateFromHousehold(baseAnswers({ persons: 3 }));
    expect(estimate.total).toBe(HOUSEHOLD_BASE_KWH[3]);
    expect(accuracyFor("household").label).toBe("Eerste inschatting");
  });
});

describe("gezinsprofielen", () => {
  it("dekt één tot zes personen", () => {
    [1, 2, 3, 4, 5, 6].forEach((persons) => {
      expect(estimateFromHousehold(baseAnswers({ persons })).total).toBe(
        HOUSEHOLD_BASE_KWH[persons],
      );
    });
  });

  it("telt huidige en geplande elektrische auto op", () => {
    expect(estimateFromHousehold(baseAnswers({ car: "ev" })).total).toBe(
      HOUSEHOLD_BASE_KWH[4]! + ADDON_KWH.fullElectricCar,
    );
    expect(
      estimateFromHousehold(baseAnswers({ car: "planned", plannedCar: "phev" })).total,
    ).toBe(HOUSEHOLD_BASE_KWH[4]! + ADDON_KWH.plugInHybrid);
  });

  it("telt warmtepomp en elektrische verwarming op", () => {
    expect(estimateFromHousehold(baseAnswers({ heating: "heatPump" })).total).toBe(
      HOUSEHOLD_BASE_KWH[4]! + ADDON_KWH.heatPumpAirWater,
    );
    expect(estimateFromHousehold(baseAnswers({ heating: "electric" })).total).toBe(
      HOUSEHOLD_BASE_KWH[4]! + ADDON_KWH.electricHeating,
    );
  });

  it("voorkomt dubbeltelling van reeds aanwezige toestellen", () => {
    const answers = baseAnswers({
      heating: "heatPump",
      waterHeating: "heatPump",
      car: "ev",
      changes: ["heatPump", "heatPumpBoiler", "electricCar"],
    });
    expect(estimateFromHousehold(answers).total).toBe(
      HOUSEHOLD_BASE_KWH[4]! +
        ADDON_KWH.heatPumpAirWater +
        ADDON_KWH.heatPumpBoiler +
        ADDON_KWH.fullElectricCar,
    );
  });

  it("gebruikt veilige standaardwaarden bij onbekende antwoorden", () => {
    const answers = baseAnswers({ heating: "unknown", waterHeating: "unknown", car: "none" });
    expect(estimateFromHousehold(answers).total).toBe(HOUSEHOLD_BASE_KWH[4]);
  });
});

describe("advies", () => {
  it("past schaduwcorrectie toe", () => {
    expect(shadeFactor("never")).toBe(1);
    expect(shadeFactor("much")).toBe(0.75);
    const sunny = recommendPanels({ consumptionKwh: 4000, shade: "never" });
    const shady = recommendPanels({ consumptionKwh: 4000, shade: "much" });
    expect(shady.panels).toBeGreaterThan(sunny.panels);
    expect(shady.production).toBeLessThan(sunny.panels * 465 * 0.95);
  });

  it("gebruikt een voorzichtige omvormerlimiet bij onbekende aansluiting", () => {
    expect(recommendPanels({ consumptionKwh: 4000, phase: "unknown" }).inverterLimitKva).toBe(5);
    expect(recommendPanels({ consumptionKwh: 4000, phase: "three" }).inverterLimitKva).toBe(10);
  });

  it("adviseert automatisch een aantal panelen binnen de grenzen", () => {
    const advice = recommendPanels({ consumptionKwh: 4200, shade: "never" });
    expect(advice.panels).toBeGreaterThanOrEqual(6);
    expect(advice.panels).toBeLessThanOrEqual(27);
    expect(advice.coverage).toBeGreaterThan(70);
    expect(recommendPanels({ consumptionKwh: 500 }).panels).toBe(6);
    expect(recommendPanels({ consumptionKwh: 40000 }).panels).toBe(27);
  });

  it("waarschuwt bij weinig dakruimte", () => {
    expect(recommendPanels({ consumptionKwh: 12000, roofSpace: "small" }).roofSpaceWarning).toBe(
      true,
    );
    expect(recommendPanels({ consumptionKwh: 3000, roofSpace: "full" }).roofSpaceWarning).toBe(
      false,
    );
  });

  it("adviseert automatisch een batterijcapaciteit", () => {
    expect(recommendBatteryKwh({ kwp: 4.65, priority: "balanced" })).toBe(5);
    expect(recommendBatteryKwh({ kwp: 9.3, priority: "balanced" })).toBe(10);
    expect(recommendBatteryKwh({ kwp: 9.3, priority: "selfUse" })).toBe(15);
    expect(recommendBatteryKwh({ kwp: 9.3, priority: "backup" })).toBe(20);
    expect(recommendBatteryKwh({ kwp: 0.5 })).toBe(5);
    expect(recommendBatteryKwh({ kwp: 100, priority: "backup" })).toBe(40);
  });

  it("vergelijkt scenario's met en zonder batterij", () => {
    const advice = recommendPanels({ consumptionKwh: 6000, shade: "never" });
    const comparison = compareBatteryScenarios({
      panels: advice.panels,
      production: advice.production,
      consumptionKwh: 6000,
      kwp: advice.kwp,
      priority: "balanced",
    });
    expect(comparison.recommendedKwh).toBeGreaterThanOrEqual(5);
    expect(comparison.withBattery.investment).toBeGreaterThan(
      comparison.withoutBattery.investment,
    );
    expect(comparison.withBattery.annualSavings).toBeGreaterThan(
      comparison.withoutBattery.annualSavings,
    );
  });
});

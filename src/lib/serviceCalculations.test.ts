import { describe, expect, it } from "vitest";

import {
  calculateAirco,
  calculateBattery,
  calculateFacadeInsulation,
  calculateHeatPump,
  estimateHeatPumpPower,
  getHeatPumpPriceBand,
  heatPumpPremium,
  calculateHeatPumpBoiler,
  estimateBatteryEnergyProfile,
  estimateFacadeArea,
} from "./serviceCalculations";

describe("thuisbatterij", () => {
  it("adviseert capaciteit binnen de praktische grenzen", () => {
    const result = calculateBattery({
      annualConsumption: 4500,
      solarProduction: 5200,
      annualExport: 2800,
      usageProfile: "evening",
      goal: "independence",
      smartControl: true,
    });

    expect(result.capacity).toBeGreaterThanOrEqual(5);
    expect(result.capacity).toBeLessThanOrEqual(20);
    expect(result.shiftedEnergy).toBeLessThanOrEqual(2800);
    expect(result.annualSavings).toBeGreaterThan(0);
  });

  it("maakt een bruikbaar energieprofiel zonder technische jaarwaarden", () => {
    const standard = estimateBatteryEnergyProfile({
      persons: 3,
      panels: 10,
      majorUsage: "standard",
      usageProfile: "mixed",
    });
    const withLargeConsumers = estimateBatteryEnergyProfile({
      persons: 3,
      panels: 10,
      majorUsage: "both",
      usageProfile: "evening",
    });

    expect(standard.annualConsumption).toBe(3500);
    expect(standard.solarProduction).toBe(4420);
    expect(withLargeConsumers.annualConsumption).toBeGreaterThan(standard.annualConsumption);
    expect(withLargeConsumers.annualExport).toBeGreaterThan(standard.annualExport);
  });
});

describe("lucht-waterwarmtepomp", () => {
  it("rekent vermogen zoals de vermogentool", () => {
    expect(estimateHeatPumpPower("oil", 2000, false)).toBe(10);
    expect(estimateHeatPumpPower("gas-m3", 2000, false)).toBe(10);
    expect(estimateHeatPumpPower("gas-m3", 2050, true)).toBe(10);
    expect(estimateHeatPumpPower("gas-kwh", 19400, false)).toBe(10);
  });

  it("kiest de juiste prijsschijf en rondt gaten naar boven af", () => {
    expect(getHeatPumpPriceBand(3)?.label).toBe("4 à 6 kW");
    expect(getHeatPumpPriceBand(6)?.label).toBe("4 à 6 kW");
    expect(getHeatPumpPriceBand(6.5)?.label).toBe("7 à 10 kW");
    expect(getHeatPumpPriceBand(10)?.label).toBe("7 à 10 kW");
    expect(getHeatPumpPriceBand(11)?.label).toBe("12 à 17 kW");
    expect(getHeatPumpPriceBand(17)?.label).toBe("12 à 17 kW");
    expect(getHeatPumpPriceBand(17.5)).toBeNull();
  });

  it("berekent prijsvork, premie en netto investering", () => {
    const result = calculateHeatPump({
      fuel: "gas-m3",
      consumption: 1800,
      cookingOnGas: false,
      homeType: "semi",
      household: "couple",
      dependents: 0,
      taxableIncome: 50_000,
    });
    expect(result.onRequest).toBe(false);
    if (result.onRequest) return;
    expect(result.power).toBe(9);
    expect(result.price).toEqual({ min: 10_680, max: 13_948 });
    expect(result.category).toBe("cat3");
    expect(result.premium).toEqual({ min: 3_526, max: 4_500 });
    expect(result.net).toEqual({ min: 7_154, max: 9_448 });
  });

  it("geeft geen premie voor een bedrijfspand en op aanvraag boven 17 kW", () => {
    const commercial = calculateHeatPump({
      fuel: "oil",
      consumption: 1000,
      cookingOnGas: false,
      homeType: "commercial",
    });
    expect(commercial.onRequest).toBe(false);
    if (!commercial.onRequest) expect(commercial.premium).toEqual({ min: 0, max: 0 });

    const large = calculateHeatPump({
      fuel: "oil",
      consumption: 4000,
      cookingOnGas: false,
      homeType: "detached",
      household: "single",
      dependents: 0,
      taxableIncome: 20_000,
    });
    expect(large.onRequest).toBe(true);
    expect(heatPumpPremium(9_000, "cat4")).toBe(4_245);
    expect(heatPumpPremium(15_430, "cat4")).toBe(6_000);
  });
});

describe("warmtepompboiler", () => {
  it("schaalt het boilervolume met het huishouden", () => {
    const small = calculateHeatPumpBoiler({
      persons: 2,
      currentHeating: "electric",
      installationRoom: "utility",
      existingSolar: false,
      showerProfile: "average",
    });
    const large = calculateHeatPumpBoiler({
      persons: 5,
      currentHeating: "electric",
      installationRoom: "utility",
      existingSolar: true,
      showerProfile: "average",
    });

    expect(small.volume).toBe(180);
    expect(large.volume).toBe(300);
    expect(large.electricityUse).toBeGreaterThan(small.electricityUse);
  });
});

describe("airco", () => {
  it("rekent een zonnige slecht geïsoleerde ruimte zwaarder", () => {
    const efficient = calculateAirco({
      rooms: 2,
      totalArea: 60,
      goal: "both",
      insulation: "good",
      sunExposure: "low",
      currentHeating: "gas",
    });
    const demanding = calculateAirco({
      rooms: 2,
      totalArea: 60,
      goal: "both",
      insulation: "poor",
      sunExposure: "high",
      currentHeating: "gas",
    });

    expect(demanding.capacity).toBeGreaterThan(efficient.capacity);
    expect(demanding.investment).toBeGreaterThan(efficient.investment);
  });
});

describe("gevelisolatie", () => {
  const baseInput = {
    surfaceMethod: "estimate" as const,
    homeType: "semi" as const,
    facades: 3,
    floors: 2,
    wallType: "cavity" as const,
    currentInsulation: "none" as const,
    preferredMethod: "advice" as const,
    finish: "render" as const,
    heating: "gas" as const,
    buildingAge: "pre-2006" as const,
    applicant: "owner-occupant" as const,
    incomeCategory: "category-3" as const,
    contractor: "yes" as const,
    wallCondition: "good" as const,
  };

  it("raamt de oppervlakte met gewone woninggegevens", () => {
    const area = estimateFacadeArea({ homeType: "row", facades: 2, floors: 2 });

    expect(area).toBeGreaterThan(40);
    expect(area).toBeLessThan(70);
  });

  it("kiest bij een spouwmuur een passend startscenario", () => {
    const result = calculateFacadeInsulation(baseInput);

    expect(result.method).toBe("cavity");
    expect(result.investmentHigh).toBeGreaterThan(result.investmentLow);
    expect(result.annualSavingsHigh).toBeGreaterThan(result.annualSavingsLow);
  });

  it("begrenst de premie voor inkomenscategorie 3", () => {
    const result = calculateFacadeInsulation({
      ...baseInput,
      surfaceMethod: "exact",
      facadeArea: 300,
      wallType: "solid",
      preferredMethod: "exterior",
    });

    expect(result.premiumStatus).toBe("eligible");
    expect(result.premium).toBe(3500);
  });

  it("belooft geen premie als de gebruiker de voorwaarden niet kent", () => {
    const result = calculateFacadeInsulation({
      ...baseInput,
      buildingAge: "unknown",
      incomeCategory: "unknown",
      contractor: "unknown",
    });

    expect(result.premiumStatus).toBe("unknown");
    expect(result.premium).toBe(0);
  });
});

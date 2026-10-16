import { describe, expect, it } from "vitest";

import {
  calculateAirco,
  calculateBattery,
  calculateFacadeInsulation,
  calculateHeatPump,
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
  it("berekent vermogen, verbruik en investering", () => {
    const result = calculateHeatPump({
      homeArea: 150,
      annualHeatingCost: 2400,
      homeType: "semi",
      insulation: "average",
      emitters: "low-temp",
      currentHeating: "gas",
      hotWater: true,
    });

    expect(result.thermalPower).toBeGreaterThan(4);
    expect(result.scop).toBeGreaterThan(3);
    expect(result.electricityUse).toBeGreaterThan(0);
    expect(result.investment).toBeGreaterThan(10000);
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

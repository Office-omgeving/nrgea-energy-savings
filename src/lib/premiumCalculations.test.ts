import { describe, expect, it } from "vitest";

import {
  calculatePremium,
  getIncomeThresholds,
  type IncomeCategory,
  type PremiumProduct,
} from "./premiumCalculations";

describe("premium income thresholds for 2026", () => {
  it("uses the official thresholds for a single person without dependents", () => {
    expect(getIncomeThresholds("single", 0)).toEqual({
      cat4: 24_750,
      cat3: 43_240,
      cat2: 55_020,
    });
  });

  it("uses the official thresholds for a single person with one dependent", () => {
    expect(getIncomeThresholds("single", 1)).toEqual({
      cat4: 37_110,
      cat3: 60_520,
      cat2: 78_610,
    });
  });

  it("adds 4,420 euro per dependent for a couple", () => {
    expect(getIncomeThresholds("couple", 2)).toEqual({
      cat4: 45_950,
      cat3: 69_360,
      cat2: 87_450,
    });
  });
});

describe("premium calculation", () => {
  it.each<[PremiumProduct, IncomeCategory, number]>([
    ["geothermal", "cat4", 8_000],
    ["geothermal", "cat3", 6_000],
    ["geothermal", "cat2", 4_000],
    ["geothermal", "cat1", 3_600],
    ["air-water", "cat4", 5_000],
    ["air-water", "cat3", 3_500],
    ["air-water", "cat2", 1_500],
    ["air-water", "cat1", 1_500],
    ["heat-pump-boiler", "cat4", 1_200],
    ["heat-pump-boiler", "cat3", 1_050],
    ["heat-pump-boiler", "cat2", 450],
    ["heat-pump-boiler", "cat1", 450],
    ["hybrid", "cat4", 4_000],
    ["hybrid", "cat3", 2_800],
    ["hybrid", "cat2", 800],
    ["hybrid", "cat1", 800],
    ["air-air", "cat4", 600],
    ["air-air", "cat3", 450],
    ["air-air", "cat2", 300],
    ["air-air", "cat1", 300],
  ])("calculates %s for %s", (product, category, expected) => {
    expect(calculatePremium({ product, category, eligible: true }).premium).toBe(expected);
  });

  it("returns no premium when the building is not eligible", () => {
    expect(
      calculatePremium({ product: "air-water", category: "cat4", eligible: false }).premium,
    ).toBe(0);
  });
});

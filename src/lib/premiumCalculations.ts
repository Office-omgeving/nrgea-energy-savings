export type PremiumProduct = "geothermal" | "air-water" | "heat-pump-boiler" | "hybrid" | "air-air";

export type HouseholdType = "single" | "couple";
export type IncomeCategory = "cat4" | "cat3" | "cat2" | "cat1";

export type IncomeThresholds = {
  cat4: number;
  cat3: number;
  cat2: number;
};

export const PREMIUM_PRODUCTS: Record<
  PremiumProduct,
  {
    label: string;
    description: string;
    referenceInvestment: number;
    amounts: Record<IncomeCategory, number>;
  }
> = {
  geothermal: {
    label: "Geothermische warmtepomp",
    description: "Haalt warmte uit de bodem of het grondwater.",
    referenceInvestment: 18_000,
    amounts: { cat4: 8_000, cat3: 6_000, cat2: 4_000, cat1: 4_000 },
  },
  "air-water": {
    label: "Lucht-waterwarmtepomp",
    description: "Voor centrale verwarming en eventueel warm water.",
    referenceInvestment: 10_000,
    amounts: { cat4: 6_000, cat3: 4_500, cat2: 1_500, cat1: 1_500 },
  },
  "heat-pump-boiler": {
    label: "Warmtepompboiler",
    description: "Energiezuinige productie van sanitair warm water.",
    referenceInvestment: 4_000,
    amounts: { cat4: 1_200, cat3: 1_050, cat2: 450, cat1: 450 },
  },
  hybrid: {
    label: "Hybride warmtepomp",
    description: "Een lucht-waterwarmtepomp gecombineerd met een gasketel.",
    referenceInvestment: 8_000,
    amounts: { cat4: 4_000, cat3: 3_000, cat2: 800, cat1: 800 },
  },
  "air-air": {
    label: "Lucht-luchtwarmtepomp (airco)",
    description: "Verwarmt en koelt via binnenunits.",
    referenceInvestment: 5_000,
    amounts: { cat4: 600, cat3: 450, cat2: 300, cat1: 300 },
  },
};

const CATEGORY_PERCENTAGES: Record<IncomeCategory, number> = {
  cat4: 0.5,
  cat3: 0.35,
  cat2: 0.25,
  cat1: 0.2,
};

const EXTRA_DEPENDENT = 4_420;

/** Officiële inkomensgrenzen voor aanvragen vanaf 1 januari 2026. */
export function getIncomeThresholds(
  household: HouseholdType,
  dependents: number,
): IncomeThresholds {
  const safeDependents = Math.max(0, Math.floor(dependents));
  const isSingleWithoutDependents = household === "single" && safeDependents === 0;

  if (isSingleWithoutDependents) {
    return { cat4: 24_750, cat3: 43_240, cat2: 55_020 };
  }

  const additionalDependents =
    household === "single" ? Math.max(0, safeDependents - 1) : safeDependents;
  const increase = additionalDependents * EXTRA_DEPENDENT;

  return {
    cat4: 37_110 + increase,
    cat3: 60_520 + increase,
    cat2: 78_610 + increase,
  };
}

export function calculatePremium({
  product,
  category,
  eligible,
}: {
  product: PremiumProduct;
  category: IncomeCategory;
  eligible: boolean;
}) {
  const config = PREMIUM_PRODUCTS[product];
  const maxPercentage = CATEGORY_PERCENTAGES[category];
  const basisAmount = config.amounts[category];
  const referenceCap = Math.round(config.referenceInvestment * maxPercentage);
  const premium = eligible ? Math.min(basisAmount, referenceCap) : 0;

  return {
    premium,
    basisAmount,
    maxPercentage,
    referenceInvestment: config.referenceInvestment,
    cappedByReferenceCost: eligible && referenceCap < basisAmount,
  };
}

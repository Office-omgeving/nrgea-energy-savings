const ELECTRICITY_PRICE = 0.33;
const GAS_PRICE = 0.11;
const OIL_PRICE = 0.12;

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

const round = (value: number) => Math.round(value);

export type BatteryInput = {
  annualConsumption: number;
  solarProduction: number;
  annualExport: number;
  usageProfile: "day" | "mixed" | "evening";
  goal: "savings" | "independence" | "backup";
  smartControl: boolean;
  electricityPrice?: number;
  injectionPrice?: number;
};

export type BatteryProfileEstimateInput = {
  persons: number;
  panels: number;
  majorUsage: "standard" | "heat-pump" | "ev" | "both";
  usageProfile: "day" | "mixed" | "evening";
};

export function estimateBatteryEnergyProfile(input: BatteryProfileEstimateInput) {
  const householdConsumption: Record<number, number> = {
    1: 1900,
    2: 2800,
    3: 3500,
    4: 4200,
    5: 4800,
    6: 5400,
  };
  const persons = clamp(Math.round(input.persons), 1, 10);
  const baseConsumption = householdConsumption[Math.min(persons, 6)] ?? householdConsumption[2]!;
  const extraPersons = Math.max(0, persons - 6) * 500;
  const extraConsumption =
    input.majorUsage === "both"
      ? 6000
      : input.majorUsage === "heat-pump"
        ? 3500
        : input.majorUsage === "ev"
          ? 2500
          : 0;
  const annualConsumption = baseConsumption + extraPersons + extraConsumption;
  const solarProduction = round(clamp(Math.round(input.panels), 4, 60) * 442);
  const exportShare =
    input.usageProfile === "day" ? 0.3 : input.usageProfile === "evening" ? 0.58 : 0.45;
  const annualExport = round(solarProduction * exportShare);

  return { annualConsumption, solarProduction, annualExport };
}

export function calculateBattery(input: BatteryInput) {
  const price = input.electricityPrice ?? ELECTRICITY_PRICE;
  const injectionPrice = input.injectionPrice ?? 0.05;
  const goalFactor = input.goal === "backup" ? 1.25 : input.goal === "independence" ? 1 : 0.8;
  const rawCapacity = (input.annualExport / 365) * goalFactor;
  const capacity = clamp(Math.round(rawCapacity / 2.5) * 2.5, 5, 20);
  const cycles =
    input.usageProfile === "evening" ? 285 : input.usageProfile === "mixed" ? 245 : 190;
  const smartFactor = input.smartControl ? 1.08 : 1;
  const shiftedEnergy = round(
    Math.min(input.annualExport * 0.78, input.annualConsumption * 0.48, capacity * 0.9 * cycles) *
      smartFactor,
  );
  const annualSavings = round(shiftedEnergy * Math.max(0, price - injectionPrice));
  const investment = round(2200 + capacity * 520 + (input.smartControl ? 650 : 0));
  const paybackYears = annualSavings > 0 ? Number((investment / annualSavings).toFixed(1)) : 0;
  const selfConsumptionGain =
    input.solarProduction > 0 ? round((shiftedEnergy / input.solarProduction) * 100) : 0;

  return { capacity, shiftedEnergy, annualSavings, investment, paybackYears, selfConsumptionGain };
}

export type HeatPumpInput = {
  homeArea: number;
  annualHeatingCost: number;
  homeType: "apartment" | "row" | "semi" | "detached";
  insulation: "poor" | "average" | "good";
  emitters: "floor" | "low-temp" | "radiators";
  currentHeating: "gas" | "oil" | "electric";
  hotWater: boolean;
  electricityPrice?: number;
};

export function calculateHeatPump(input: HeatPumpInput) {
  const demandPerM2 = input.insulation === "poor" ? 175 : input.insulation === "average" ? 115 : 70;
  const homeFactor =
    input.homeType === "detached"
      ? 1.12
      : input.homeType === "semi"
        ? 1.03
        : input.homeType === "apartment"
          ? 0.82
          : 0.92;
  const heatDemand = input.homeArea * demandPerM2 * homeFactor + (input.hotWater ? 2200 : 0);
  const baseScop = input.emitters === "floor" ? 4.2 : input.emitters === "low-temp" ? 3.65 : 3.05;
  const scop = Number(
    clamp(
      baseScop + (input.insulation === "good" ? 0.15 : input.insulation === "poor" ? -0.2 : 0),
      2.7,
      4.4,
    ).toFixed(1),
  );
  const electricityUse = round(heatDemand / scop);
  const annualCost = round(electricityUse * (input.electricityPrice ?? ELECTRICITY_PRICE));
  const annualSavings = round(input.annualHeatingCost - annualCost);
  const investment = round(11250 + input.homeArea * 16 + (input.hotWater ? 1200 : 0));
  const paybackYears = annualSavings > 0 ? Number((investment / annualSavings).toFixed(1)) : 0;
  const peakWattsPerM2 =
    input.insulation === "poor" ? 85 : input.insulation === "average" ? 60 : 40;
  const thermalPower = Number(
    clamp((input.homeArea * peakWattsPerM2 * homeFactor) / 1000, 4, 16).toFixed(1),
  );

  return {
    heatDemand: round(heatDemand),
    scop,
    electricityUse,
    annualCost,
    annualSavings,
    investment,
    paybackYears,
    thermalPower,
  };
}

export type HeatPumpBoilerInput = {
  persons: number;
  currentHeating: "electric" | "gas" | "oil";
  installationRoom: "heated" | "utility" | "cold";
  existingSolar: boolean;
  showerProfile: "short" | "average" | "long";
  electricityPrice?: number;
};

export function calculateHeatPumpBoiler(input: HeatPumpBoilerInput) {
  const profileFactor =
    input.showerProfile === "long" ? 1.25 : input.showerProfile === "short" ? 0.8 : 1;
  const heatDemand = input.persons * 650 * profileFactor;
  const cop =
    input.installationRoom === "heated" ? 3.1 : input.installationRoom === "utility" ? 2.8 : 2.45;
  const electricityUse = round(heatDemand / cop);
  const electricityPrice = input.electricityPrice ?? ELECTRICITY_PRICE;
  const solarFactor = input.existingSolar ? 0.78 : 1;
  const annualCost = round(electricityUse * electricityPrice * solarFactor);
  const oldAnnualCost = round(
    input.currentHeating === "electric"
      ? (heatDemand / 0.92) * electricityPrice
      : input.currentHeating === "gas"
        ? (heatDemand / 0.78) * GAS_PRICE
        : (heatDemand / 0.72) * OIL_PRICE,
  );
  const annualSavings = Math.max(0, oldAnnualCost - annualCost);
  const volume = input.persons <= 2 ? 180 : input.persons <= 4 ? 250 : 300;
  const investment = volume === 180 ? 2850 : volume === 250 ? 3350 : 3850;
  const paybackYears = annualSavings > 0 ? Number((investment / annualSavings).toFixed(1)) : 0;

  return {
    heatDemand: round(heatDemand),
    cop,
    electricityUse,
    annualCost,
    oldAnnualCost,
    annualSavings,
    volume,
    investment,
    paybackYears,
  };
}

export type AircoInput = {
  rooms: number;
  totalArea: number;
  goal: "cool" | "heat" | "both";
  insulation: "poor" | "average" | "good";
  sunExposure: "low" | "average" | "high";
  currentHeating: "gas" | "oil" | "electric" | "heat-pump";
  electricityPrice?: number;
};

export function calculateAirco(input: AircoInput) {
  const insulationFactor =
    input.insulation === "poor" ? 1.22 : input.insulation === "good" ? 0.84 : 1;
  const sunFactor = input.sunExposure === "high" ? 1.16 : input.sunExposure === "low" ? 0.92 : 1;
  const capacity = Number(
    clamp(input.totalArea * 0.095 * insulationFactor * sunFactor, 2.5, 18).toFixed(1),
  );
  const units = clamp(Math.max(input.rooms, Math.ceil(capacity / 5)), 1, 5);
  const investment = round(900 + units * 1250 + capacity * 160);
  const price = input.electricityPrice ?? ELECTRICITY_PRICE;
  const coolingUse = input.goal === "heat" ? 0 : round((capacity * 260) / 5.4);
  const coolingCost = round(coolingUse * price);
  const usefulHeat = input.goal === "cool" ? 0 : input.totalArea * 48 * insulationFactor;
  const currentHeatingCost = round(
    input.currentHeating === "gas"
      ? (usefulHeat / 0.9) * GAS_PRICE
      : input.currentHeating === "oil"
        ? (usefulHeat / 0.82) * OIL_PRICE
        : input.currentHeating === "heat-pump"
          ? (usefulHeat / 3.2) * price
          : usefulHeat * price,
  );
  const aircoHeatingCost = round((usefulHeat / 4) * price);
  const annualHeatingSavings = Math.max(0, currentHeatingCost - aircoHeatingCost);
  const netAnnualBenefit = annualHeatingSavings - coolingCost;
  const paybackYears =
    netAnnualBenefit > 0 ? Number((investment / netAnnualBenefit).toFixed(1)) : 0;

  return {
    capacity,
    units,
    investment,
    coolingUse,
    coolingCost,
    aircoHeatingCost,
    annualHeatingSavings,
    netAnnualBenefit,
    paybackYears,
  };
}

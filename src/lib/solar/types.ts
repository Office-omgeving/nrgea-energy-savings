export type ConsumptionMethod = "kwh" | "cost" | "estimate";

export type CostPeriod = "month" | "year";
export type YesNoUnknown = "yes" | "no" | "unknown";

export type HeatingType = "fossil" | "heatPump" | "electric" | "other" | "unknown";
export type WaterHeatingType = "boilerCentral" | "electric" | "heatPump" | "other" | "unknown";
export type CarType = "none" | "phev" | "ev" | "planned";
export type PlannedCarType = "phev" | "ev" | "unknown";
export type SituationTag = "homeWorking" | "airco" | "pool" | "none";
export type ChangeTag =
  | "heatPump"
  | "heatPumpBoiler"
  | "electricCar"
  | "familyGrowth"
  | "none"
  | "unknown";

export type HouseholdAnswers = {
  persons: number;
  heating: HeatingType;
  waterHeating: WaterHeatingType;
  car: CarType;
  plannedCar: PlannedCarType;
  situations: SituationTag[];
  changes: ChangeTag[];
};

export type RoofType = "pitched" | "flat" | "mixed" | "unknown";
export type RoofSpace = "small" | "half" | "most" | "full" | "unknown";
export type ShadeLevel = "never" | "partial" | "much" | "unknown";
export type PhaseType = "mono" | "three" | "unknown";
export type ExistingIntent = "extend" | "replace" | "battery" | "advice";
export type BatteryChoice = "yes" | "no" | "advice";
export type BatteryPriority = "selfUse" | "balanced" | "backup" | "advice";

export type BreakdownItem = { label: string; kwh: number };

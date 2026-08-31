/**
 * Centrale, indicatieve referentiewaarden voor de zonnepanelensimulatie.
 * Alle waarden staan hier zodat ze later eenvoudig aangepast kunnen worden.
 * Het zijn indicatieve profielen, geen absolute waarheden.
 */

/** Indicatieve referentieprijs elektriciteit (all-in) in €/kWh. */
export const REFERENCE_KWH_PRICE = 0.33;

/** Basisverbruik per gezinsgrootte (kWh/jaar). */
export const HOUSEHOLD_BASE_KWH: Record<number, number> = {
  1: 1900,
  2: 2800,
  3: 3500,
  4: 4200,
  5: 4800,
  6: 5400,
};

/** Aanvullingen op het basisverbruik (kWh/jaar). */
export const ADDON_KWH = {
  heatPumpAirWater: 3500,
  electricHeating: 6000,
  electricBoiler: 1200,
  heatPumpBoiler: 800,
  plugInHybrid: 1200,
  fullElectricCar: 2500,
  homeWorking: 400,
  airconditioning: 500,
  pool: 1500,
  plannedHeatPump: 3500,
  plannedHeatPumpBoiler: 800,
  plannedElectricCar: 2500,
  plannedFamilyGrowth: 500,
} as const;

/** Paneel- en opbrengstparameters. */
export const PANEL_WP = 465;
export const KWP_PER_PANEL = PANEL_WP / 1000;
/** Indicatieve jaaropbrengst in Vlaanderen (kWh per kWp). */
export const YIELD_PER_KWP = 950;
export const MIN_PANELS = 6;
export const MAX_PANELS = 27;

/** Voorlopige omvormerlimiet (kVA) per aansluitingstype. */
export const INVERTER_LIMIT_KVA = {
  mono: 5,
  three: 10,
  unknown: 5,
} as const;

/** Indicatieve opbrengstcorrectie voor schaduw. */
export const SHADE_FACTORS = {
  never: 1,
  partial: 0.9,
  much: 0.75,
  unknown: 0.9,
} as const;

/** Batterijadvies. */
export const BATTERY_STEP_KWH = 5;
export const BATTERY_MIN_KWH = 5;
export const BATTERY_MAX_KWH = 40;

/** Indicatieve prijzen (incl. btw, richtprijzen). */
export const PRICING = {
  pvBase: 1500,
  pvPerPanel: 340,
  batteryPerKwh: 480,
  batteryBase: 1200,
  smartControl: 950,
} as const;

/** Aandeel van de productie dat zonder batterij direct verbruikt wordt. */
export const SELF_CONSUMPTION_WITHOUT_BATTERY = 0.35;
/** Aandeel van de productie dat met batterij direct verbruikt wordt. */
export const SELF_CONSUMPTION_WITH_BATTERY = 0.65;
/** Indicatieve injectievergoeding (€/kWh). */
export const INJECTION_PRICE = 0.05;

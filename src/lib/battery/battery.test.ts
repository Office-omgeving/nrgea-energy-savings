import { afterEach, describe, expect, it, vi } from "vitest";

import { postCalculatorHeight } from "@/components/calculator/IframeResizeReporter";
import { estimateFromCost, estimateFromHousehold } from "@/lib/solar/consumption";
import {
  batteryAccuracy,
  batteryPrice,
  computeSavings,
  deviationWarning,
  energyFlow,
  estimatePv,
  inverterCheck,
  paybackYears,
  recommendCapacity,
} from "./battery";

const C = 3500;

describe("PV-inschatting", () => {
  it("jaarproductie exact bekend", () => {
    const pv = estimatePv({ hasPv: "yes", knowledge: "production", annualProduction: 4000, consumptionKwh: C });
    expect(pv.status).toBe("exact");
    expect(pv.production).toBe(4000);
    expect(pv.kwp).toBeCloseTo(4.21, 2);
  });
  it("productie geschat uit aantal panelen en periode", () => {
    const pv = estimatePv({ hasPv: "yes", knowledge: "panels", panels: 10, period: "pre2015", consumptionKwh: C });
    expect(pv.kwp).toBe(2.75);
    expect(pv.production).toBe(Math.round(2.75 * 950));
    expect(pv.status).toBe("estimated");
    expect(estimatePv({ hasPv: "yes", knowledge: "panels", panels: 10, period: "2023plus", consumptionKwh: C }).kwp).toBe(4.3);
    expect(estimatePv({ hasPv: "yes", knowledge: "panels", panels: 10, period: "unknown", consumptionKwh: C }).kwp).toBe(3.85);
    expect(estimatePv({ hasPv: "yes", knowledge: "panels", panels: 10, exactWp: 465, consumptionKwh: C }).kwp).toBe(4.65);
  });
  it("volledig onbekende PV-installatie blokkeert niet", () => {
    const pv = estimatePv({ hasPv: "yes", knowledge: "unknown", consumptionKwh: C });
    expect(pv.status).toBe("toCheck");
    expect(pv.production).toBeGreaterThan(0);
  });
  it("geen zonnepanelen", () => {
    const pv = estimatePv({ hasPv: "no", pvPlan: "no", consumptionKwh: C });
    expect(pv.production).toBe(0);
    expect(pv.status).toBe("none");
  });
  it("geplande zonnepanelen", () => {
    expect(estimatePv({ hasPv: "no", pvPlan: "withBattery", consumptionKwh: C }).status).toBe("planned");
    expect(estimatePv({ hasPv: "soon", consumptionKwh: C }).production).toBeGreaterThan(0);
  });
});

describe("verbruik", () => {
  it("exact, via kost en via gezin", () => {
    expect(estimateFromCost({ amount: 110, period: "month" }).kwh).toBe(Math.round(1320 / 0.33));
    const h = estimateFromHousehold({ persons: 3, heating: "fossil", waterHeating: "boilerCentral", car: "none", plannedCar: "unknown", situations: [], changes: [] });
    expect(h.total).toBeGreaterThan(0);
    expect(batteryAccuracy("exact", "exact")).toBe("Hoge nauwkeurigheid");
  });
});

describe("energiesituatie", () => {
  it("onbekende meter/contract/aansluiting blokkeren niet", () => {
    const p = batteryPrice({ capacity: 10, phase: "unknown", inverter: "checkRecent" });
    expect(p.phaseUsed).toBe("mono");
    expect(p.phaseToCheck).toBe(true);
    expect(p.low).toBe(3461);
    expect(computeSavings({ production: 0, consumptionKwh: C, smart: true, capacity: 10, contract: "unknown" }).kind).toBe("custom");
  });
  it("omvormercontrole op basis van ouderdom", () => {
    expect(inverterCheck({ hasExisting: true, period: "2015to2019" })).toBe("hybridLikely");
    expect(inverterCheck({ hasExisting: true, period: "2023plus" })).toBe("checkRecent");
    expect(inverterCheck({ hasExisting: true, age: "gt10" })).toBe("hybridLikely");
    expect(inverterCheck({ hasExisting: true, age: "lt5" })).toBe("checkRecent");
    expect(inverterCheck({ hasExisting: true, age: "unknown" })).toBe("unknown");
  });
});

describe("batterijadvies", () => {
  it("automatisch advies uit PV en verbruik", () => {
    expect(recommendCapacity({ kwp: 4, consumptionKwh: 3500 }).capacity).toBe(5);
    expect(recommendCapacity({ kwp: 0, consumptionKwh: 7300 }).base).toBe(10);
    expect(recommendCapacity({ kwp: 9, consumptionKwh: 3500 }).capacity).toBe(10);
  });
  it("doelfactoren", () => {
    expect(recommendCapacity({ kwp: 10, consumptionKwh: 0, goal: "balanced" }).capacity).toBe(10);
    expect(recommendCapacity({ kwp: 10, consumptionKwh: 0, goal: "selfUse" }).capacity).toBe(10);
    expect(recommendCapacity({ kwp: 10, consumptionKwh: 0, goal: "backup" }).capacity).toBe(15);
  });
  it("noodstroomcorrectie", () => {
    expect(recommendCapacity({ kwp: 4, consumptionKwh: 3500, backup: "few" }).capacity).toBe(10);
    expect(recommendCapacity({ kwp: 10, consumptionKwh: 0, backup: "large" }).capacity).toBe(15);
    expect(recommendCapacity({ kwp: 50, consumptionKwh: 0, backup: "large" }).capacity).toBe(40);
  });
  it("handmatige aanpassing met waarschuwingen", () => {
    expect(deviationWarning(5, 20)).toBe("muchSmaller");
    expect(deviationWarning(30, 10)).toBe("muchLarger");
    expect(deviationWarning(15, 10)).toBeNull();
  });
  it("prijsbereik bij onbekende compatibiliteit", () => {
    const p = batteryPrice({ capacity: 15, phase: "three", inverter: "unknown" });
    expect(p).toMatchObject({ low: 4603, high: 6378, isRange: true });
    expect(batteryPrice({ capacity: 12.5, phase: "mono", inverter: "checkRecent" }).low).toBe(3973);
  });
});

describe("besparing", () => {
  it("zelfconsumptie vóór en na, slimme sturing", () => {
    const f = energyFlow({ production: 4000, consumptionKwh: 3500, smart: false });
    expect(f.selfWithout).toBe(1400);
    expect(f.selfWith).toBe(2720);
    expect(energyFlow({ production: 4000, consumptionKwh: 3500, smart: true }).selfWith).toBe(3160);
    const s = computeSavings({ production: 4000, consumptionKwh: 3500, smart: true, capacity: 5, contract: "fixed" });
    expect(s).toEqual({ kind: "pv", annual: Math.round(1760 * 0.33) });
  });
  it("geen fictieve PV-besparing zonder zonnepanelen", () => {
    const s = computeSavings({ production: 0, consumptionKwh: C, smart: true, capacity: 10, contract: "dynamic" });
    expect(s.kind).toBe("dynamic");
    expect(paybackYears(5000, 0)).toBeNull();
  });
  it("nauwkeurigheidslabel", () => {
    expect(batteryAccuracy("estimated", "exact")).toBe("Goede indicatie");
    expect(batteryAccuracy("estimated", "household")).toBe("Eerste inschatting");
  });
});

describe("iframe-resize", () => {
  afterEach(() => vi.unstubAllGlobals());
  it("stuurt hoogteberichten naar de parent", () => {
    const postMessage = vi.fn();
    vi.stubGlobal("window", { parent: { postMessage } });
    postCalculatorHeight(812.3);
    expect(postMessage).toHaveBeenCalledWith({ type: "nrgea-calculator-resize", height: 813 }, "*");
  });
});

import { describe, expect, it } from "vitest";

import { heatPumpConfig } from "./ServiceWizards";

// Tekst van Nico (NRGEA): wat de lead na de berekening ziet en wat in Strilio komt.
// Op 10/11 werd die tekst bij een review herschreven; Nico vroeg 19/11 zijn tekst terug.
const answers = {
  homeType: "row",
  fuel: "gas-kwh",
  gasKwh: 10_678,
  cookingOnGas: "no",
  household: "couple",
  dependents: 2,
  taxableIncome: 22_968,
};

describe("warmtepomp: tekst van Nico", () => {
  const estimate = heatPumpConfig.calculate(answers);

  it("toont de intro en de prijsregel letterlijk", () => {
    expect(estimate.summary).toContain(
      "Waarom nog mazout inslaan of een hoge gasfactuur betalen? Dankzij onze nieuwste hogetemperatuurwarmtepompen kan het voor elk type woning.",
    );
    expect(estimate.summary).toMatch(
      /uw indicatieve prijs van .+ mag u verminderen met .+ subsidie\nuw netto investering bedraagt dan /,
    );
    expect(estimate.summary).toContain(
      "Hiermee bent u volledig gas- of mazoutvrij en verlost van deze hoge energiefacturen en energietaksen ( CO2 taks enz)",
    );
  });

  it("toont het advies van Nico en geen extra premielink", () => {
    expect(estimate.advice).toBe(
      "De rendementen zitten tussen 14 à 30% per jaar afhankelijk van uw verbruik.\nDe jaarlijkse besparing hangt af van enkele factoren welke wij graag samen met u bekijken tijdens een technische controle van de woning.",
    );
    expect(estimate).not.toHaveProperty("informationLink");
    expect(estimate.kpis?.map((k) => k.label)).toEqual([
      "Indicatieve prijs",
      "Premie",
      "Netto investering",
    ]);
  });
});

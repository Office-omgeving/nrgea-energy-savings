import { expect, it } from "vitest";
import { formatCalculationNote } from "./calculatorNote";
it("maakt een leesbare notitie zonder lege velden of ruwe objectnotatie", () => {
  expect(
    formatCalculationNote({
      rooms: 1,
      roomArea1: 25,
      roomArea2: "",
      goal: "both",
      kpis: [{ label: "Vermogen", value: "2.5 kW" }],
    }),
  ).toBe(
    "Aantal ruimtes: 1\nOppervlakte ruimte 1 (m²): 25\nGebruik: Koelen en verwarmen\nKerncijfers: Vermogen: 2.5 kW",
  );
});

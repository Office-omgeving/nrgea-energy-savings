const labels: Record<string, string> = {
  rooms: "Aantal ruimtes",
  goal: "Gebruik",
  insulation: "Isolatieniveau",
  sunExposure: "Zoninstraling",
  currentHeating: "Huidige verwarming",
  electricityPrice: "Elektriciteitsprijs (€/kWh)",
  price: "Richtprijs",
  value: "Waarde",
  hint: "Toelichting",
  summary: "Samenvatting",
  advice: "Advies",
  scenario: "Scenario",
  kpis: "Kerncijfers",
  financials: "Financiële indicatie",
  investment: "Investering",
  capacity: "Capaciteit (kWh)",
  savings: "Besparing",
  accuracy: "Nauwkeurigheid",
  smartControl: "Slimme sturing",
  annualSavings: "Jaarlijkse besparing",
  paybackYears: "Terugverdientijd (jaar)",
  resolvedKwh: "Verbruik (kWh)",
};
const values: Record<string, string> = {
  both: "Koelen en verwarmen",
  cooling: "Koelen",
  heating: "Verwarmen",
  average: "Gemiddeld",
  good: "Goed",
  poor: "Beperkt",
  gas: "Aardgas",
  oil: "Stookolie",
  electric: "Elektrisch",
  low: "Beperkt",
  high: "Hoog",
};
function label(key: string): string {
  const room = key.match(/^roomArea(\d+)$/);
  return room
    ? `Oppervlakte ruimte ${room[1]} (m²)`
    : labels[key] || key.replace(/([a-z])([A-Z])/g, "$1 $2");
}
export function formatCalculationNote(value: unknown, depth = 0): string {
  if (depth > 8 || value === null || value === undefined || value === "") return "";
  if (typeof value === "boolean") return value ? "Ja" : "Nee";
  if (typeof value === "number")
    return new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 2 }).format(value);
  if (typeof value === "string") return values[value] || value;
  if (Array.isArray(value))
    return value
      .map((item) => formatCalculationNote(item, depth + 1))
      .filter(Boolean)
      .join("\n");
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj["label"] === "string" && "value" in obj)
      return `${obj["label"]}: ${formatCalculationNote(obj["value"], depth + 1)}${obj["hint"] ? ` (${String(obj["hint"])})` : ""}`;
    return Object.entries(obj)
      .map(([key, item]) => {
        const rendered = formatCalculationNote(item, depth + 1);
        return rendered ? `${label(key)}: ${rendered}` : "";
      })
      .filter(Boolean)
      .join("\n");
  }
  return "";
}

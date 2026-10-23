import type { ServiceComponentProps } from "@/config/calculatorServices";
import {
  calculateAirco,
  calculateBattery,
  calculateFacadeInsulation,
  calculateHeatPump,
  calculateHeatPumpBoiler,
  estimateBatteryEnergyProfile,
} from "@/lib/serviceCalculations";
import {
  CalculatedServiceWizard,
  type CalculatedServiceConfig,
  type WizardAnswers,
} from "./CalculatedServiceWizard";

const euro = (value: number) =>
  new Intl.NumberFormat("nl-BE", {
    style: "currency",
    currency: "EUR",
    maximumFractionDigits: 0,
  }).format(value);

const number = (answers: WizardAnswers, key: string, fallback = 0) => {
  const value = answers[key];
  return typeof value === "number" ? value : fallback;
};

const text = <T extends string>(answers: WizardAnswers, key: string, fallback: T) => {
  const value = answers[key];
  return (typeof value === "string" && value ? value : fallback) as T;
};

const batteryConfig: CalculatedServiceConfig = {
  description: "Bereken welke batterijcapaciteit past bij je zonnepanelen en wat die kan besparen.",
  initial: {
    energyMethod: "",
    annualConsumption: "",
    solarProduction: "",
    annualExport: "",
    persons: "",
    panels: "",
    majorUsage: "",
    electricityPrice: 0.33,
    injectionPrice: 0.05,
    usageProfile: "",
    goal: "",
    smartControl: "",
  },
  steps: [
    {
      title: "Energieprofiel",
      description: "Gebruik bij voorkeur de jaarwaarden uit de app van je digitale meter.",
      questions: [
        {
          kind: "choice",
          key: "energyMethod",
          label: "Ken je deze energiegegevens?",
          options: [
            {
              value: "exact",
              label: "Ja, ik ken mijn jaarwaarden",
              description: "Gebruik je digitale meter en de app van je omvormer.",
            },
            {
              value: "estimate",
              label: "Nee, maak een schatting",
              description: "Beantwoord enkele eenvoudige vragen over je gezin en zonnepanelen.",
            },
          ],
        },
        {
          kind: "number",
          key: "annualConsumption",
          label: "Jaarlijks elektriciteitsverbruik",
          unit: "kWh/jaar",
          hint: "Je totale afname en rechtstreeks verbruik samen.",
          min: 500,
          max: 30000,
          showWhen: { key: "energyMethod", value: "exact" },
        },
        {
          kind: "number",
          key: "solarProduction",
          label: "Jaarlijkse productie van je zonnepanelen",
          unit: "kWh/jaar",
          hint: "Staat meestal in de app van je omvormer.",
          min: 500,
          max: 30000,
          showWhen: { key: "energyMethod", value: "exact" },
        },
        {
          kind: "number",
          key: "annualExport",
          label: "Jaarlijkse injectie op het net",
          unit: "kWh/jaar",
          hint: "De energie die je zonnepanelen produceren maar je niet meteen verbruikt.",
          min: 100,
          max: 25000,
          showWhen: { key: "energyMethod", value: "exact" },
        },
        {
          kind: "number",
          key: "persons",
          label: "Aantal bewoners",
          unit: "personen",
          hint: "Hiermee ramen we je normale huishoudelijke stroomverbruik.",
          min: 1,
          max: 10,
          showWhen: { key: "energyMethod", value: "estimate" },
        },
        {
          kind: "number",
          key: "panels",
          label: "Aantal zonnepanelen",
          unit: "panelen",
          hint: "Een schatting is voldoende. Je hoeft het vermogen per paneel niet te kennen.",
          min: 4,
          max: 60,
          showWhen: { key: "energyMethod", value: "estimate" },
        },
        {
          kind: "choice",
          key: "majorUsage",
          label: "Heb je een grote elektrische verbruiker?",
          showWhen: { key: "energyMethod", value: "estimate" },
          options: [
            {
              value: "standard",
              label: "Geen van beide",
              description: "Normaal huishoudelijk verbruik.",
            },
            {
              value: "heat-pump",
              label: "Warmtepomp",
              description: "De warmtepomp verwarmt de woning.",
            },
            {
              value: "ev",
              label: "Elektrische auto",
              description: "De auto wordt meestal thuis geladen.",
            },
            {
              value: "both",
              label: "Beide",
              description: "Warmtepomp en elektrische auto.",
            },
          ],
        },
      ],
    },
    {
      title: "Gebruik en voorkeur",
      description:
        "Deze keuzes bepalen hoeveel zonne-energie de batterij dagelijks kan verschuiven.",
      questions: [
        {
          kind: "choice",
          key: "usageProfile",
          label: "Wanneer verbruik je het meeste stroom?",
          columns: 3,
          options: [
            {
              value: "day",
              label: "Overdag",
              description: "Veel verbruik terwijl de zon schijnt.",
            },
            { value: "mixed", label: "Verspreid", description: "Verbruik doorheen de hele dag." },
            {
              value: "evening",
              label: "Avond",
              description: "Het meeste verbruik na zonsondergang.",
            },
          ],
        },
        {
          kind: "choice",
          key: "goal",
          label: "Wat is je belangrijkste doel?",
          columns: 3,
          options: [
            { value: "savings", label: "Rendement", description: "De kortste terugverdientijd." },
            {
              value: "independence",
              label: "Zelfverbruik",
              description: "Minder elektriciteit van het net.",
            },
            {
              value: "backup",
              label: "Extra reserve",
              description: "Meer capaciteit voor pieken en reserve.",
            },
          ],
        },
        {
          kind: "choice",
          key: "smartControl",
          label: "Wil je slimme sturing meenemen?",
          options: [
            { value: "yes", label: "Ja", description: "Automatisch laden op gunstige momenten." },
            { value: "no", label: "Nee", description: "Alleen sturen op je zonneproductie." },
          ],
        },
        {
          kind: "number",
          key: "electricityPrice",
          label: "Elektriciteitsprijs",
          unit: "€/kWh",
          hint: "Vooraf ingevuld met een indicatieve all-inprijs.",
          min: 0.1,
          max: 1,
          step: 0.01,
        },
        {
          kind: "number",
          key: "injectionPrice",
          label: "Injectievergoeding",
          unit: "€/kWh",
          hint: "De vergoeding die je krijgt voor teruggeleverde stroom.",
          min: 0,
          max: 0.5,
          step: 0.01,
        },
      ],
    },
  ],
  calculate: (answers) => {
    const estimatedProfile = estimateBatteryEnergyProfile({
      persons: number(answers, "persons", 2),
      panels: number(answers, "panels", 10),
      majorUsage: text(answers, "majorUsage", "standard"),
      usageProfile: text(answers, "usageProfile", "mixed"),
    });
    const usesEstimate = text(answers, "energyMethod", "estimate" as string) === "estimate";
    const annualConsumption = usesEstimate
      ? estimatedProfile.annualConsumption
      : number(answers, "annualConsumption");
    const solarProduction = usesEstimate
      ? estimatedProfile.solarProduction
      : number(answers, "solarProduction");
    const annualExport = usesEstimate
      ? estimatedProfile.annualExport
      : number(answers, "annualExport");
    const result = calculateBattery({
      annualConsumption,
      solarProduction,
      annualExport,
      usageProfile: text(answers, "usageProfile", "mixed"),
      goal: text(answers, "goal", "savings"),
      smartControl: text(answers, "smartControl", "no" as string) === "yes",
      electricityPrice: number(answers, "electricityPrice", 0.33),
      injectionPrice: number(answers, "injectionPrice", 0.05),
    });
    return {
      price: {
        value: euro(result.investment),
        hint: "Indicatieve installatieprijs inclusief btw.",
      },
      summary: `${usesEstimate ? "Op basis van je gezinsprofiel ramen we eerst je energiegegevens. " : ""}Een batterij van ongeveer ${result.capacity} kWh kan jaarlijks circa ${result.shiftedEnergy.toLocaleString("nl-BE")} kWh zonne-energie naar je avond- en nachtverbruik verschuiven.`,
      advice:
        result.capacity >= 15
          ? "Je berekende capaciteit is groot. Laat het kwartiervermogen, de omvormer en het echte injectieprofiel controleren voordat je een toestel kiest."
          : "Kies geen grotere batterij dan je regelmatig kunt laden en ontladen. Een technisch advies op basis van kwartierdata maakt deze raming nauwkeuriger.",
      scenario: [
        { label: "Gegevensbasis", value: usesEstimate ? "Schatting" : "Jaarwaarden" },
        ...(usesEstimate
          ? [
              {
                label: "Geschat elektriciteitsverbruik",
                value: `${annualConsumption.toLocaleString("nl-BE")} kWh/jaar`,
              },
              {
                label: "Geschatte zonneproductie",
                value: `${solarProduction.toLocaleString("nl-BE")} kWh/jaar`,
              },
              {
                label: "Geschatte injectie",
                value: `${annualExport.toLocaleString("nl-BE")} kWh/jaar`,
              },
            ]
          : []),
        { label: "Extra zelfverbruik", value: `ongeveer ${result.selfConsumptionGain}%` },
      ],
      kpis: [
        { label: "Aanbevolen capaciteit", value: `${result.capacity} kWh` },
        { label: "Geschatte jaarbesparing", value: euro(result.annualSavings) },
        {
          label: "Terugverdientijd",
          value: result.paybackYears ? `${result.paybackYears} jaar` : "Niet berekenbaar",
        },
      ],
    };
  },
};

const heatPumpConfig: CalculatedServiceConfig = {
  description:
    "Schat het benodigde vermogen, verbruik en financieel effect van een lucht-waterwarmtepomp.",
  initial: {
    homeArea: "",
    homeType: "",
    insulation: "",
    currentHeating: "",
    annualHeatingCost: "",
    emitters: "",
    hotWater: "",
    electricityPrice: 0.33,
  },
  steps: [
    {
      title: "Woning",
      description: "De warmtevraag hangt vooral af van de grootte en isolatie van je woning.",
      questions: [
        {
          kind: "number",
          key: "homeArea",
          label: "Verwarmde vloeroppervlakte",
          unit: "m²",
          hint: "Tel alleen de ruimtes mee die gewoonlijk verwarmd worden.",
          min: 25,
          max: 500,
        },
        {
          kind: "choice",
          key: "homeType",
          label: "Type woning",
          options: [
            {
              value: "apartment",
              label: "Appartement",
              description: "Woonlaag in een groter gebouw.",
            },
            { value: "row", label: "Rijwoning", description: "Aan beide zijden aangebouwd." },
            { value: "semi", label: "Halfopen", description: "Aan één zijde aangebouwd." },
            { value: "detached", label: "Open bebouwing", description: "Vier vrijstaande gevels." },
          ],
        },
        {
          kind: "choice",
          key: "insulation",
          label: "Isolatieniveau",
          columns: 3,
          options: [
            { value: "poor", label: "Beperkt", description: "Oudere woning, weinig renovatie." },
            { value: "average", label: "Gemiddeld", description: "Dak en glas zijn aangepakt." },
            { value: "good", label: "Goed", description: "Grondig gerenoveerd of recent." },
          ],
        },
      ],
    },
    {
      title: "Verwarming",
      description: "Vergelijk je huidige verwarmingskost met het verwachte warmtepompverbruik.",
      questions: [
        {
          kind: "choice",
          key: "currentHeating",
          label: "Huidige hoofdverwarming",
          columns: 3,
          options: [
            { value: "gas", label: "Aardgas", description: "Ketel op aardgas." },
            { value: "oil", label: "Stookolie", description: "Mazoutketel." },
            {
              value: "electric",
              label: "Elektrisch",
              description: "Directe elektrische verwarming.",
            },
          ],
        },
        {
          kind: "number",
          key: "annualHeatingCost",
          label: "Jaarlijkse kost voor verwarming",
          unit: "€/jaar",
          hint: "Laat sanitair warm water buiten beschouwing als dat apart wordt opgewekt.",
          min: 200,
          max: 15000,
        },
        {
          kind: "choice",
          key: "emitters",
          label: "Afgiftesysteem",
          columns: 3,
          options: [
            { value: "floor", label: "Vloerverwarming", description: "Lage aanvoertemperatuur." },
            {
              value: "low-temp",
              label: "Lage-temperatuurradiatoren",
              description: "Radiatoren geschikt voor 45–55 °C.",
            },
            {
              value: "radiators",
              label: "Klassieke radiatoren",
              description: "Ontworpen voor hogere temperaturen.",
            },
          ],
        },
        {
          kind: "choice",
          key: "hotWater",
          label: "Moet de warmtepomp ook sanitair warm water maken?",
          options: [
            { value: "yes", label: "Ja", description: "Verwarming en warm water combineren." },
            { value: "no", label: "Nee", description: "Warm water blijft apart." },
          ],
        },
        {
          kind: "number",
          key: "electricityPrice",
          label: "Elektriciteitsprijs",
          unit: "€/kWh",
          hint: "Vooraf ingevuld met een indicatieve all-inprijs.",
          min: 0.1,
          max: 1,
          step: 0.01,
        },
      ],
    },
  ],
  calculate: (answers) => {
    const result = calculateHeatPump({
      homeArea: number(answers, "homeArea"),
      annualHeatingCost: number(answers, "annualHeatingCost"),
      homeType: text(answers, "homeType", "row"),
      insulation: text(answers, "insulation", "average"),
      emitters: text(answers, "emitters", "low-temp"),
      currentHeating: text(answers, "currentHeating", "gas"),
      hotWater: text(answers, "hotWater", "no" as string) === "yes",
      electricityPrice: number(answers, "electricityPrice", 0.33),
    });
    const saves = result.annualSavings > 0;
    return {
      price: {
        value: euro(result.investment),
        hint: "Indicatieve installatieprijs inclusief btw, vóór eventuele premies.",
      },
      summary: `De geraamde warmtevraag is ${result.heatDemand.toLocaleString("nl-BE")} kWh per jaar. Bij een seizoensrendement van ${result.scop} komt het verwachte stroomverbruik uit op ongeveer ${result.electricityUse.toLocaleString("nl-BE")} kWh.`,
      advice:
        text(answers, "emitters", "low-temp" as string) === "radiators"
          ? "Klassieke radiatoren vragen vaak een hogere watertemperatuur. Laat eerst een warmteverliesberekening uitvoeren en controleer of grotere radiatoren nodig zijn."
          : "Je afgiftesysteem is in beginsel geschikt voor lage temperatuur. Een warmteverliesberekening per ruimte blijft nodig voor de definitieve dimensionering.",
      scenario: [{ label: "Geschat vermogen", value: `${result.thermalPower} kW` }],
      kpis: [
        {
          label: "Jaarlijkse stroomkost",
          value: euro(result.annualCost),
          hint: `${result.electricityUse.toLocaleString("nl-BE")} kWh/jaar`,
        },
        {
          label: saves ? "Geschatte jaarbesparing" : "Verschil met huidige kost",
          value: euro(result.annualSavings),
        },
        {
          label: "Terugverdientijd",
          value: result.paybackYears ? `${result.paybackYears} jaar` : "Niet berekenbaar",
        },
      ],
    };
  },
};

const heatPumpBoilerConfig: CalculatedServiceConfig = {
  description: "Bereken het geschikte boilervat en de verwachte kost voor sanitair warm water.",
  initial: {
    persons: "",
    showerProfile: "",
    currentHeating: "",
    installationRoom: "",
    existingSolar: "",
    electricityPrice: 0.33,
  },
  steps: [
    {
      title: "Warmwatergebruik",
      description: "Gezinsgrootte en douchegedrag bepalen vooral het benodigde boilervolume.",
      questions: [
        {
          kind: "number",
          key: "persons",
          label: "Aantal bewoners",
          unit: "personen",
          hint: "Tel bewoners mee die doorgaans thuis douchen.",
          min: 1,
          max: 10,
        },
        {
          kind: "choice",
          key: "showerProfile",
          label: "Gemiddeld douchegebruik",
          columns: 3,
          options: [
            { value: "short", label: "Zuinig", description: "Korte douches en weinig baden." },
            { value: "average", label: "Gemiddeld", description: "Normaal dagelijks gebruik." },
            { value: "long", label: "Hoog", description: "Lange douches of regelmatig een bad." },
          ],
        },
        {
          kind: "choice",
          key: "currentHeating",
          label: "Hoe verwarm je nu je sanitair water?",
          columns: 3,
          options: [
            {
              value: "electric",
              label: "Elektrische boiler",
              description: "Boiler met elektrische weerstand.",
            },
            { value: "gas", label: "Aardgas", description: "Via gasketel of gasboiler." },
            { value: "oil", label: "Stookolie", description: "Via de mazoutketel." },
          ],
        },
      ],
    },
    {
      title: "Installatie",
      description: "De temperatuur van de opstellingsruimte beïnvloedt het rendement.",
      questions: [
        {
          kind: "choice",
          key: "installationRoom",
          label: "Waar komt de boiler te staan?",
          columns: 3,
          options: [
            {
              value: "heated",
              label: "Verwarmde ruimte",
              description: "Bijvoorbeeld een wasruimte binnen de woning.",
            },
            {
              value: "utility",
              label: "Technische ruimte",
              description: "Vorstvrij, maar niet actief verwarmd.",
            },
            { value: "cold", label: "Koude ruimte", description: "Een koude garage of kelder." },
          ],
        },
        {
          kind: "choice",
          key: "existingSolar",
          label: "Heb je zonnepanelen?",
          options: [
            { value: "yes", label: "Ja", description: "De boiler kan overdag slim opwarmen." },
            { value: "no", label: "Nee", description: "Alle energie komt van het net." },
          ],
        },
        {
          kind: "number",
          key: "electricityPrice",
          label: "Elektriciteitsprijs",
          unit: "€/kWh",
          hint: "Vooraf ingevuld met een indicatieve all-inprijs.",
          min: 0.1,
          max: 1,
          step: 0.01,
        },
      ],
    },
  ],
  calculate: (answers) => {
    const result = calculateHeatPumpBoiler({
      persons: number(answers, "persons"),
      currentHeating: text(answers, "currentHeating", "electric"),
      installationRoom: text(answers, "installationRoom", "utility"),
      existingSolar: text(answers, "existingSolar", "no" as string) === "yes",
      showerProfile: text(answers, "showerProfile", "average"),
      electricityPrice: number(answers, "electricityPrice", 0.33),
    });
    return {
      price: {
        value: euro(result.investment),
        hint: result.paybackYears
          ? `Indicatieve installatieprijs inclusief btw. Terugverdientijd circa ${result.paybackYears} jaar.`
          : "Indicatieve installatieprijs inclusief btw.",
      },
      summary: `Voor dit huishouden past indicatief een vat van ${result.volume} liter. Het toestel gebruikt naar schatting ${result.electricityUse.toLocaleString("nl-BE")} kWh elektriciteit per jaar.`,
      advice:
        text(answers, "installationRoom", "utility" as string) === "cold"
          ? "Een koude opstellingsruimte verlaagt het rendement. Controleer of de ruimte vorstvrij is en of aan- en afvoer van lucht technisch mogelijk zijn."
          : "Plan de opwarming zoveel mogelijk overdag. Met zonnepanelen verhoogt dat het eigen verbruik en verlaagt het de effectieve energiekost.",
      scenario: [{ label: "Geschat rendement", value: `COP ${result.cop}` }],
      kpis: [
        { label: "Aanbevolen volume", value: `${result.volume} liter` },
        {
          label: "Jaarlijkse energiekost",
          value: euro(result.annualCost),
          hint: `Nu circa ${euro(result.oldAnnualCost)}`,
        },
        { label: "Geschatte jaarbesparing", value: euro(result.annualSavings) },
      ],
    };
  },
};

const aircoConfig: CalculatedServiceConfig = {
  description:
    "Bereken het benodigde koelvermogen, de investering en het verwachte energiegebruik.",
  initial: {
    rooms: "",
    roomArea1: "",
    roomArea2: "",
    roomArea3: "",
    roomArea4: "",
    roomArea5: "",
    goal: "",
    insulation: "",
    sunExposure: "",
    currentHeating: "",
    electricityPrice: 0.33,
  },
  steps: [
    {
      title: "Ruimtes",
      description:
        "Geef per ruimte de oppervlakte op. De calculator telt de oppervlaktes automatisch samen.",
      questions: [
        {
          kind: "number",
          key: "rooms",
          label: "Aantal ruimtes",
          unit: "ruimtes",
          hint: "Elke afzonderlijke ruimte vraagt doorgaans een eigen binnenunit.",
          min: 1,
          max: 5,
        },
        {
          kind: "number",
          key: "roomArea1",
          label: "Oppervlakte ruimte 1",
          unit: "m²",
          hint: "Een afgeronde schatting is voldoende.",
          min: 5,
          max: 150,
          showWhen: { key: "rooms", min: 1 },
        },
        {
          kind: "number",
          key: "roomArea2",
          label: "Oppervlakte ruimte 2",
          unit: "m²",
          hint: "Een afgeronde schatting is voldoende.",
          min: 5,
          max: 150,
          showWhen: { key: "rooms", min: 2 },
        },
        {
          kind: "number",
          key: "roomArea3",
          label: "Oppervlakte ruimte 3",
          unit: "m²",
          hint: "Een afgeronde schatting is voldoende.",
          min: 5,
          max: 150,
          showWhen: { key: "rooms", min: 3 },
        },
        {
          kind: "number",
          key: "roomArea4",
          label: "Oppervlakte ruimte 4",
          unit: "m²",
          hint: "Een afgeronde schatting is voldoende.",
          min: 5,
          max: 150,
          showWhen: { key: "rooms", min: 4 },
        },
        {
          kind: "number",
          key: "roomArea5",
          label: "Oppervlakte ruimte 5",
          unit: "m²",
          hint: "Een afgeronde schatting is voldoende.",
          min: 5,
          max: 150,
          showWhen: { key: "rooms", min: 5 },
        },
        {
          kind: "choice",
          key: "goal",
          label: "Waarvoor wil je de airco gebruiken?",
          columns: 3,
          options: [
            { value: "cool", label: "Koelen", description: "Comfort tijdens warme dagen." },
            {
              value: "heat",
              label: "Verwarmen",
              description: "Efficiënt bijverwarmen in de winter.",
            },
            { value: "both", label: "Beide", description: "Koelen én verwarmen." },
          ],
        },
      ],
    },
    {
      title: "Woningprofiel",
      description: "Isolatie en zoninstraling bepalen hoeveel vermogen er nodig is.",
      questions: [
        {
          kind: "choice",
          key: "insulation",
          label: "Isolatieniveau van de ruimtes",
          columns: 3,
          options: [
            { value: "poor", label: "Beperkt", description: "Oud glas of weinig isolatie." },
            { value: "average", label: "Gemiddeld", description: "Dubbel glas en basisisolatie." },
            {
              value: "good",
              label: "Goed",
              description: "Recente of grondig gerenoveerde ruimtes.",
            },
          ],
        },
        {
          kind: "choice",
          key: "sunExposure",
          label: "Zoninstraling",
          columns: 3,
          options: [
            { value: "low", label: "Beperkt", description: "Noordgericht of veel schaduw." },
            {
              value: "average",
              label: "Gemiddeld",
              description: "Een normale mix van zon en schaduw.",
            },
            { value: "high", label: "Hoog", description: "Grote zuidgerichte ramen of plat dak." },
          ],
        },
        {
          kind: "choice",
          key: "currentHeating",
          label: "Huidige verwarming",
          options: [
            { value: "gas", label: "Aardgas", description: "Centrale verwarming op gas." },
            { value: "oil", label: "Stookolie", description: "Centrale verwarming op mazout." },
            { value: "electric", label: "Elektrisch", description: "Convectoren of accumulatie." },
            {
              value: "heat-pump",
              label: "Warmtepomp",
              description: "Er is al efficiënte elektrische verwarming.",
            },
          ],
        },
        {
          kind: "number",
          key: "electricityPrice",
          label: "Elektriciteitsprijs",
          unit: "€/kWh",
          hint: "Vooraf ingevuld met een indicatieve all-inprijs.",
          min: 0.1,
          max: 1,
          step: 0.01,
        },
      ],
    },
  ],
  calculate: (answers) => {
    const goal = text<"cool" | "heat" | "both">(answers, "goal", "both");
    const rooms = Math.min(5, Math.max(1, Math.round(number(answers, "rooms", 1))));
    const totalArea = Array.from({ length: rooms }, (_, index) =>
      number(answers, `roomArea${index + 1}`),
    ).reduce((sum, area) => sum + area, 0);
    const result = calculateAirco({
      rooms,
      totalArea,
      goal,
      insulation: text(answers, "insulation", "average"),
      sunExposure: text(answers, "sunExposure", "average"),
      currentHeating: text(answers, "currentHeating", "gas"),
      electricityPrice: number(answers, "electricityPrice", 0.33),
    });
    const heatingRelevant = goal !== "cool";
    return {
      price: {
        value: euro(result.investment),
        hint: "Indicatieve installatieprijs inclusief btw.",
      },
      summary: `Voor de gekozen ruimtes is ongeveer ${result.capacity} kW totaal koelvermogen nodig, verdeeld over ${result.units} ${result.units === 1 ? "binnenunit" : "binnenunits"}.`,
      advice:
        result.units >= 4
          ? "Bij meerdere binnenunits is de ligging van leidingen en buitenunits bepalend. Laat per ruimte een koellastberekening en geluidscontrole uitvoeren."
          : "Laat de installateur het vermogen per ruimte controleren. Een te zware unit schakelt vaak aan en uit en ontvochtigt minder goed.",
      scenario: [
        { label: "Totale oppervlakte", value: `${totalArea.toLocaleString("nl-BE")} m²` },
        ...(heatingRelevant
          ? [{ label: "Besparing op verwarming", value: euro(result.annualHeatingSavings) }]
          : [
              {
                label: "Geschat koelverbruik",
                value: `${result.coolingUse.toLocaleString("nl-BE")} kWh/jaar`,
              },
            ]),
      ],
      kpis: [
        { label: "Benodigd vermogen", value: `${result.capacity} kW` },
        { label: "Aantal binnenunits", value: String(result.units) },
        heatingRelevant
          ? {
              label: "Netto voordeel per jaar",
              value: euro(result.netAnnualBenefit),
              hint: goal === "both" ? "Verwarmingsbesparing min koelkost" : "Verwarmingsbesparing",
            }
          : { label: "Jaarlijkse koelkost", value: euro(result.coolingCost) },
      ],
    };
  },
};

const facadeInsulationConfig: CalculatedServiceConfig = {
  description:
    "Schat de geschikte isolatiemethode, investering, energiebesparing en mogelijke Vlaamse premie.",
  resultVariant: "facade",
  initial: {
    buildingAge: "",
    homeType: "",
    heating: "",
    wallType: "",
    currentInsulation: "",
    wallCondition: "",
    surfaceMethod: "",
    facadeArea: "",
    facades: "",
    floors: "",
    preferredMethod: "",
    finish: "render",
    applicant: "",
    incomeCategory: "",
    contractor: "",
  },
  steps: [
    {
      title: "Woning en gevel",
      description: "Kies wat je weet. Bij twijfel kun je telkens ‘Ik weet het niet’ aanduiden.",
      questions: [
        {
          kind: "choice",
          key: "buildingAge",
          label: "Van wanneer is de woning?",
          columns: 3,
          options: [
            {
              value: "pre-2006",
              label: "Vóór 2006",
              description: "De woning is aangesloten of vergund vóór 2006.",
            },
            {
              value: "post-2005",
              label: "Vanaf 2006",
              description: "De woning is recenter gebouwd.",
            },
            {
              value: "unknown",
              label: "Ik weet het niet",
              description: "We houden de premie als te controleren punt.",
            },
          ],
        },
        {
          kind: "choice",
          key: "homeType",
          label: "Welk type woning is het?",
          options: [
            { value: "apartment", label: "Appartement", description: "Een woning in een gebouw." },
            { value: "row", label: "Rijwoning", description: "Aan beide kanten aangebouwd." },
            { value: "semi", label: "Halfopen", description: "Aan één kant aangebouwd." },
            { value: "detached", label: "Open bebouwing", description: "Vrijstaand gebouw." },
          ],
        },
        {
          kind: "choice",
          key: "heating",
          label: "Waarmee verwarm je vooral?",
          options: [
            { value: "gas", label: "Aardgas", description: "Centrale verwarming op gas." },
            { value: "oil", label: "Stookolie", description: "Centrale verwarming op mazout." },
            { value: "electric", label: "Elektrisch", description: "Rechtstreeks elektrisch." },
            { value: "heat-pump", label: "Warmtepomp", description: "Volledig of hoofdzakelijk." },
            {
              value: "other",
              label: "Andere / onbekend",
              description: "Hout, pellets of niet zeker.",
            },
          ],
        },
        {
          kind: "choice",
          key: "wallType",
          label: "Weet je hoe de buitenmuur is opgebouwd?",
          columns: 3,
          options: [
            {
              value: "cavity",
              label: "Muur met spouw",
              description: "Er zit een open ruimte tussen binnen- en buitenmuur.",
            },
            {
              value: "solid",
              label: "Volle muur",
              description: "Een massieve muur zonder spouw.",
            },
            {
              value: "unknown",
              label: "Ik weet het niet",
              description: "Een plaatsbezoek kan dit vaststellen.",
            },
          ],
        },
        {
          kind: "choice",
          key: "currentInsulation",
          label: "Is de gevel momenteel geïsoleerd?",
          options: [
            { value: "none", label: "Nee", description: "Voor zover je weet is er geen isolatie." },
            { value: "limited", label: "Een beetje", description: "Oude of dunne isolatie." },
            { value: "good", label: "Ja, goed", description: "Recente of grondige gevelisolatie." },
            {
              value: "unknown",
              label: "Ik weet het niet",
              description: "We gebruiken een voorzichtige raming.",
            },
          ],
        },
        {
          kind: "choice",
          key: "wallCondition",
          label: "Zie je vocht, scheuren of loszittende gevelafwerking?",
          options: [
            { value: "good", label: "Nee", description: "De gevel oogt in goede staat." },
            {
              value: "repairs",
              label: "Kleine herstellingen",
              description: "Plaatselijk voeg- of herstelwerk.",
            },
            {
              value: "moisture",
              label: "Vocht of grotere schade",
              description: "Eerst technisch laten onderzoeken.",
            },
            {
              value: "unknown",
              label: "Ik weet het niet",
              description: "Nrgea controleert dit ter plaatse.",
            },
          ],
        },
      ],
    },
    {
      title: "Oppervlakte en aanpak",
      description: "Gebruik een gekende oppervlakte of laat ons ramen op basis van je woning.",
      questions: [
        {
          kind: "choice",
          key: "surfaceMethod",
          label: "Hoe wil je de geveloppervlakte bepalen?",
          options: [
            {
              value: "exact",
              label: "Ik ken de bruto oppervlakte",
              description: "Bijvoorbeeld uit een offerte, meetstaat of bouwplan.",
            },
            {
              value: "estimate",
              label: "Maak een schatting",
              description: "Op basis van het aantal gevels en bouwlagen.",
            },
          ],
        },
        {
          kind: "number",
          key: "facadeArea",
          label: "Bruto geveloppervlakte",
          unit: "m²",
          hint: "Ramen en deuren mogen inbegrepen zijn; de calculator trekt ze indicatief af.",
          min: 10,
          max: 600,
          showWhen: { key: "surfaceMethod", value: "exact" },
        },
        {
          kind: "number",
          key: "facades",
          label: "Hoeveel gevelzijden wil je isoleren?",
          unit: "gevels",
          hint: "Voor- en achtergevel zijn samen twee gevelzijden.",
          min: 1,
          max: 4,
          showWhen: { key: "surfaceMethod", value: "estimate" },
        },
        {
          kind: "number",
          key: "floors",
          label: "Hoeveel bovengrondse bouwlagen heeft de woning?",
          unit: "bouwlagen",
          hint: "Tel het gelijkvloers mee. Een niet-bewoonde zolder telt niet mee.",
          min: 1,
          max: 4,
          showWhen: { key: "surfaceMethod", value: "estimate" },
        },
        {
          kind: "choice",
          key: "preferredMethod",
          label: "Heb je al een voorkeur voor de isolatiemethode?",
          options: [
            {
              value: "advice",
              label: "Nee, geef advies",
              description: "We kiezen een logisch startscenario.",
            },
            {
              value: "cavity",
              label: "Spouwmuurisolatie",
              description: "De bestaande spouw wordt opgevuld.",
            },
            {
              value: "exterior",
              label: "Buitenisolatie",
              description: "Isolatie en afwerking aan de buitenzijde.",
            },
            {
              value: "interior",
              label: "Binnenisolatie",
              description: "Isolatie tegen de binnenkant van de gevel.",
            },
          ],
        },
        {
          kind: "choice",
          key: "finish",
          label: "Welke buitenafwerking verkies je?",
          showWhen: { key: "preferredMethod", value: "exterior" },
          options: [
            { value: "render", label: "Crepi", description: "Gepleisterde gevelafwerking." },
            {
              value: "brick",
              label: "Gevelsteen",
              description: "Nieuwe steenstrips of gevelsteen.",
            },
            {
              value: "cladding",
              label: "Gevelbekleding",
              description: "Hout, composiet of platen.",
            },
            { value: "keep", label: "Nog te bepalen", description: "Gebruik een neutrale raming." },
          ],
        },
      ],
    },
    {
      title: "Premiecheck",
      description:
        "Beantwoord alleen wat je weet. Onzekere punten blijven zichtbaar in het resultaat.",
      questions: [
        {
          kind: "choice",
          key: "applicant",
          label: "Wat is je situatie voor deze woning?",
          options: [
            {
              value: "owner-occupant",
              label: "Eigenaar-bewoner",
              description: "Je bezit en bewoont de woning.",
            },
            {
              value: "social-landlord",
              label: "Sociale verhuur",
              description: "Verhuur via een woonmaatschappij.",
            },
            {
              value: "landlord",
              label: "Andere verhuurder",
              description: "Je verhuurt of investeert in de woning.",
            },
            {
              value: "renter",
              label: "Huurder",
              description: "Je bent geen eigenaar van de woning.",
            },
          ],
        },
        {
          kind: "choice",
          key: "incomeCategory",
          label: "Ken je je inkomenscategorie voor Mijn VerbouwPremie?",
          options: [
            {
              value: "category-4",
              label: "Categorie 4",
              description: "Laagste inkomenscategorie.",
            },
            {
              value: "category-3",
              label: "Categorie 3",
              description: "Tweede laagste inkomenscategorie.",
            },
            {
              value: "category-1-2",
              label: "Categorie 1 of 2",
              description: "Hogere inkomenscategorieën.",
            },
            {
              value: "unknown",
              label: "Ik weet het niet",
              description: "We tonen welke controle nog nodig is.",
            },
          ],
        },
        {
          kind: "choice",
          key: "contractor",
          label: "Worden de werken door een aannemer uitgevoerd?",
          columns: 3,
          options: [
            { value: "yes", label: "Ja", description: "Een aannemer voert de werken uit." },
            { value: "no", label: "Nee", description: "Je plant de werken zelf uit te voeren." },
            {
              value: "unknown",
              label: "Nog niet beslist",
              description: "We houden dit als aandachtspunt.",
            },
          ],
        },
      ],
    },
  ],
  calculate: (answers) => {
    const result = calculateFacadeInsulation({
      surfaceMethod: text(answers, "surfaceMethod", "estimate"),
      facadeArea: number(answers, "facadeArea"),
      homeType: text(answers, "homeType", "row"),
      facades: number(answers, "facades", 2),
      floors: number(answers, "floors", 2),
      wallType: text(answers, "wallType", "unknown"),
      currentInsulation: text(answers, "currentInsulation", "unknown"),
      preferredMethod: text(answers, "preferredMethod", "advice"),
      finish: text(answers, "finish", "render"),
      heating: text(answers, "heating", "other"),
      buildingAge: text(answers, "buildingAge", "unknown"),
      applicant: text(answers, "applicant", "renter"),
      incomeCategory: text(answers, "incomeCategory", "unknown"),
      contractor: text(answers, "contractor", "unknown"),
      wallCondition: text(answers, "wallCondition", "unknown"),
    });
    const premiumText =
      result.premiumStatus === "eligible"
        ? euro(result.premium)
        : result.premiumStatus === "unknown"
          ? "Nog te controleren"
          : "Niet voorzien";
    return {
      price: {
        value: `${euro(result.investmentLow)} – ${euro(result.investmentHigh)}`,
        hint: "Indicatieve richtprijs inclusief plaatsing; de gekozen afwerking en gevelstaat kunnen dit beïnvloeden.",
      },
      summary: `Voor ongeveer ${result.netArea.toLocaleString("nl-BE")} m² netto geveloppervlakte is ${result.methodLabel.toLowerCase()} het berekende startscenario. De jaarlijkse besparing ligt indicatief tussen ${euro(result.annualSavingsLow)} en ${euro(result.annualSavingsHigh)}.`,
      advice:
        result.method === "cavity"
          ? "Laat met een endoscopisch onderzoek controleren of de spouw breed, droog en vrij genoeg is. Alleen dan is spouwmuurisolatie een geschikte oplossing."
          : result.method === "interior"
            ? "Binnenisolatie vraagt een zorgvuldige aansluiting bij vloeren, plafonds en ramen om koudebruggen en vochtproblemen te vermijden."
            : "Laat de ondergrond, bouwknopen en gewenste gevelafwerking technisch beoordelen. Buitenisolatie is grondig, maar beïnvloedt dorpels, dakranden en aansluitingen.",
      scenario: [
        {
          label: "Berekende netto oppervlakte",
          value: `${result.netArea.toLocaleString("nl-BE")} m²`,
        },
        { label: "Voorgestelde methode", value: result.methodLabel },
        { label: "Premiestatus", value: premiumText },
      ],
      kpis: [
        {
          label: "Jaarlijkse besparing",
          value: `${euro(result.annualSavingsLow)} – ${euro(result.annualSavingsHigh)}`,
        },
        { label: "Minder warmteverlies", value: `circa ${result.heatLossReduction}%` },
        { label: "Mogelijke premie", value: premiumText },
      ],
    };
  },
};

export function BatteryWizard(props: ServiceComponentProps) {
  return <CalculatedServiceWizard {...props} config={batteryConfig} />;
}

export function HeatPumpWizard(props: ServiceComponentProps) {
  return <CalculatedServiceWizard {...props} config={heatPumpConfig} />;
}

export function HeatPumpBoilerWizard(props: ServiceComponentProps) {
  return <CalculatedServiceWizard {...props} config={heatPumpBoilerConfig} />;
}

export function AircoWizard(props: ServiceComponentProps) {
  return <CalculatedServiceWizard {...props} config={aircoConfig} />;
}

export function FacadeInsulationWizard(props: ServiceComponentProps) {
  return <CalculatedServiceWizard {...props} config={facadeInsulationConfig} />;
}

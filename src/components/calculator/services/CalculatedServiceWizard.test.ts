import { describe, expect, it } from "vitest";

import type { WizardAnswers, WizardQuestion } from "./CalculatedServiceWizard";
import { getQuestionError } from "./questionValidation";

const annualConsumption: WizardQuestion = {
  kind: "number",
  key: "annualConsumption",
  label: "Jaarlijks elektriciteitsverbruik",
  unit: "kWh/jaar",
  hint: "",
  min: 500,
  max: 30_000,
};

describe("calculator question validation", () => {
  it("explains when a number is below the configured minimum", () => {
    const answers: WizardAnswers = { annualConsumption: 100 };

    expect(getQuestionError(annualConsumption, answers)).toBe("Vul minimaal 500 kWh/jaar in.");
  });

  it("accepts a number inside the configured range", () => {
    const answers: WizardAnswers = { annualConsumption: 2_500 };

    expect(getQuestionError(annualConsumption, answers)).toBeUndefined();
  });

  it("asks for a missing required choice", () => {
    const question: WizardQuestion = {
      kind: "choice",
      key: "energyDataMode",
      label: "Ken je deze energiegegevens?",
      options: [],
    };

    expect(getQuestionError(question, {})).toBe("Maak een keuze.");
  });
});

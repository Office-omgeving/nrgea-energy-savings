import type { WizardAnswers, WizardQuestion } from "./CalculatedServiceWizard";

export function getQuestionError(question: WizardQuestion, answers: WizardAnswers) {
  if (question.required === false) return undefined;
  const value = answers[question.key];

  if (value === "" || value === undefined) {
    return question.kind === "choice" ? "Maak een keuze." : "Vul dit veld in.";
  }

  if (question.kind === "number") {
    if (typeof value !== "number" || Number.isNaN(value)) return "Vul een geldig getal in.";

    const formatLimit = (limit: number) =>
      new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 2 }).format(limit);

    if (value < question.min) {
      return `Vul minimaal ${formatLimit(question.min)} ${question.unit} in.`;
    }
    if (value > question.max) {
      return `Vul maximaal ${formatLimit(question.max)} ${question.unit} in.`;
    }
    return undefined;
  }

  return typeof value === "string" ? undefined : "Maak een keuze.";
}

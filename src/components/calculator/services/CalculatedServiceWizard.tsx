import { useMemo, useState } from "react";

import type { ServiceComponentProps } from "@/config/calculatorServices";
import { useWizardState } from "@/hooks/useWizardState";
import { submitCalculatorLead } from "@/services/submitCalculatorLead";
import { CalculatorWizardShell } from "../CalculatorWizardShell";
import { ContactForm, type ContactFormValues } from "../ContactForm";
import { measureAndPost } from "../IframeResizeReporter";
import { InfoNotice } from "../Notices";
import { NumberField } from "../NumberField";
import { RadioCards } from "../RadioCards";
import { ResultsShell } from "../ResultsShell";
import { ScenarioOverview, type ScenarioItem } from "../ScenarioOverview";
import { KpiCard } from "../KpiCard";
import { WizardNavigation } from "../WizardNavigation";
import { getQuestionError } from "./questionValidation";

export type WizardAnswers = Record<string, string | number>;

type VisibilityCondition = { key: string; value: string } | { key: string; min: number };

type ChoiceQuestion = {
  kind: "choice";
  key: string;
  label: string;
  required?: boolean;
  showWhen?: VisibilityCondition;
  columns?: 1 | 2 | 3;
  options: { value: string; label: string; description: string }[];
};

type NumberQuestion = {
  kind: "number";
  key: string;
  label: string;
  unit: string;
  hint: string;
  min: number;
  max: number;
  step?: number;
  required?: boolean;
  showWhen?: VisibilityCondition;
};

export type WizardQuestion = ChoiceQuestion | NumberQuestion;

export type WizardQuestionStep = {
  title: string;
  description: string;
  questions: WizardQuestion[];
};

export type ServiceEstimate = {
  price: { value: string; hint?: string };
  summary: string;
  advice: string;
  scenario?: ScenarioItem[];
  kpis: { label: string; value: string; hint?: string }[];
};

export type CalculatedServiceConfig = {
  description: string;
  steps: WizardQuestionStep[];
  initial: WizardAnswers;
  calculate: (answers: WizardAnswers) => ServiceEstimate;
};

function isVisible(question: WizardQuestion, answers: WizardAnswers) {
  if (!question.showWhen) return true;
  const current = answers[question.showWhen.key];
  return "value" in question.showWhen
    ? current === question.showWhen.value
    : typeof current === "number" && current >= question.showWhen.min;
}

function formatAnswer(question: WizardQuestion, answers: WizardAnswers) {
  const value = answers[question.key];
  if (question.kind === "choice") {
    return question.options.find((option) => option.value === value)?.label ?? "—";
  }
  return typeof value === "number"
    ? `${new Intl.NumberFormat("nl-BE", { maximumFractionDigits: 2 }).format(value)} ${question.unit}`
    : "—";
}

export function CalculatedServiceWizard({
  service,
  onBackToOverview,
  config,
}: ServiceComponentProps & { config: CalculatedServiceConfig }) {
  const { state, update, reset } = useWizardState<WizardAnswers>(service.id, config.initial);
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<ContactFormValues | null>(null);
  const [questionErrors, setQuestionErrors] = useState<Record<string, string>>({});

  const questionCount = config.steps.length;
  const overviewStep = questionCount;
  const contactStep = questionCount + 1;
  const resultStep = questionCount + 2;
  const stepLabels = [
    ...config.steps.map((item) => item.title),
    "Overzicht",
    "Gegevens",
    "Resultaat",
  ];

  const goto = (next: number) => {
    setQuestionErrors({});
    setStep(next);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(measureAndPost);
  };

  const clearQuestionError = (key: string) => {
    setQuestionErrors((current) => {
      if (!current[key]) return current;
      const next = { ...current };
      delete next[key];
      return next;
    });
  };

  const continueFromQuestionStep = (questionStep: WizardQuestionStep, index: number) => {
    const errors = questionStep.questions
      .filter((question) => isVisible(question, state))
      .reduce<Record<string, string>>((result, question) => {
        const error = getQuestionError(question, state);
        if (error) result[question.key] = error;
        return result;
      }, {});

    if (Object.keys(errors).length > 0) {
      setQuestionErrors(errors);
      requestAnimationFrame(measureAndPost);
      return;
    }

    goto(index + 1);
  };

  const reviewItems = useMemo(
    () =>
      config.steps.flatMap((item) =>
        item.questions
          .filter((question) => isVisible(question, state))
          .map((question) => ({
            label: question.label,
            value: formatAnswer(question, state),
          })),
      ),
    [config.steps, state],
  );
  const estimate = useMemo(() => config.calculate(state), [config, state]);

  const renderQuestionStep = (questionStep: WizardQuestionStep, index: number) => (
    <div className="space-y-5">
      <div>
        <h3 className="font-display text-lg font-semibold text-foreground">{questionStep.title}</h3>
        <p className="mt-1 text-sm text-muted-foreground">{questionStep.description}</p>
      </div>

      {questionStep.questions
        .filter((question) => isVisible(question, state))
        .map((question) =>
          question.kind === "choice" ? (
            <div key={question.key}>
              <RadioCards
                legend={question.label}
                value={typeof state[question.key] === "string" ? String(state[question.key]) : ""}
                onChange={(value) => {
                  update({ [question.key]: value });
                  clearQuestionError(question.key);
                }}
                columns={question.columns ?? 2}
                options={question.options}
              />
              {questionErrors[question.key] ? (
                <p role="alert" className="mt-1 text-xs font-medium text-destructive">
                  {questionErrors[question.key]}
                </p>
              ) : null}
            </div>
          ) : (
            <NumberField
              key={question.key}
              label={question.label}
              value={typeof state[question.key] === "number" ? (state[question.key] as number) : ""}
              onChange={(value) => {
                update({ [question.key]: value });
                clearQuestionError(question.key);
              }}
              unit={question.unit}
              min={question.min}
              max={question.max}
              step={question.step ?? 1}
              hint={question.hint}
              error={questionErrors[question.key]}
            />
          ),
        )}

      <WizardNavigation
        onPrev={index === 0 ? onBackToOverview : () => goto(index - 1)}
        onNext={() => continueFromQuestionStep(questionStep, index)}
      />
    </div>
  );

  return (
    <CalculatorWizardShell
      title={service.title}
      description={config.description}
      steps={stepLabels}
      currentStep={step}
      onBackToOverview={onBackToOverview}
    >
      {config.steps.map((questionStep, index) =>
        step === index ? (
          <div key={questionStep.title}>{renderQuestionStep(questionStep, index)}</div>
        ) : null,
      )}

      {step === overviewStep ? (
        <div className="space-y-5">
          <div>
            <h3 className="font-display text-lg font-semibold text-foreground">
              Controleer je gegevens
            </h3>
            <p className="mt-1 text-sm text-muted-foreground">
              Pas een vorige stap aan als een antwoord niet klopt.
            </p>
          </div>
          <ScenarioOverview items={reviewItems} />
          <InfoNotice>
            De berekening gebruikt vaste, indicatieve markt- en rendementswaarden. Nrgea verfijnt
            het advies na een technische controle van je woning.
          </InfoNotice>
          <WizardNavigation
            onPrev={() => goto(overviewStep - 1)}
            onNext={() => goto(contactStep)}
            nextLabel="Naar mijn gegevens"
          />
        </div>
      ) : null}

      {step === contactStep ? (
        <div className="space-y-4">
          <ContactForm
            submitting={submitting}
            onSubmit={async (values) => {
              setSubmitting(true);
              await submitCalculatorLead({
                serviceId: service.id,
                contact: values,
                answers: state,
              });
              setSubmitting(false);
              setLead(values);
              goto(resultStep);
            }}
          />
          <button
            type="button"
            onClick={() => goto(overviewStep)}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Vorige
          </button>
        </div>
      ) : null}

      {step === resultStep ? (
        <ResultsShell
          price={estimate.price}
          scenario={[...reviewItems, ...(estimate.scenario ?? [])]}
          summary={
            <InfoNotice>
              {estimate.summary}
              {lead
                ? ` We nemen contact op met ${lead.firstName} om dit resultaat te verfijnen.`
                : ""}
            </InfoNotice>
          }
          kpis={
            <>
              {estimate.kpis.map((kpi) => (
                <KpiCard key={kpi.label} {...kpi} />
              ))}
            </>
          }
          advice={
            <section className="rounded-xl border border-border bg-card p-4">
              <h3 className="text-sm font-semibold text-foreground">Advies voor jouw situatie</h3>
              <p className="mt-1 text-sm leading-relaxed text-muted-foreground">
                {estimate.advice}
              </p>
            </section>
          }
          onRestart={() => {
            reset();
            setLead(null);
            goto(0);
          }}
          onBackToOverview={onBackToOverview}
        />
      ) : null}
    </CalculatorWizardShell>
  );
}

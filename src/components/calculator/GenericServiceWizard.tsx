import { useState } from "react";

import type { CalculatorService } from "@/config/calculatorServices";
import { useWizardState } from "@/hooks/useWizardState";
import { submitCalculatorLead } from "@/services/submitCalculatorLead";
import { CalculatorWizardShell } from "./CalculatorWizardShell";
import { ContactForm, type ContactFormValues } from "./ContactForm";
import { InfoNotice } from "./Notices";
import { KpiCard } from "./KpiCard";
import { ResultsShell } from "./ResultsShell";
import { WizardNavigation } from "./WizardNavigation";
import { measureAndPost } from "./IframeResizeReporter";

const STEPS = ["Situatie", "Contactgegevens", "Resultaat"];

type State = { situation: string };

/**
 * Basisflow op de gedeelde wizardcomponenten.
 * Volgende prompts vervangen deze per dienst door de volledige berekening.
 */
export function GenericServiceWizard({
  service,
  onBackToOverview,
}: {
  service: CalculatorService;
  onBackToOverview: () => void;
}) {
  const { state, update, reset } = useWizardState<State>(service.id, { situation: "" });
  const [step, setStep] = useState(0);
  const [submitting, setSubmitting] = useState(false);
  const [lead, setLead] = useState<ContactFormValues | null>(null);

  const goto = (next: number) => {
    setStep(next);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(measureAndPost);
  };

  return (
    <CalculatorWizardShell
      title={service.title}
      description={service.description}
      steps={STEPS}
      currentStep={step}
      onBackToOverview={onBackToOverview}
    >
      {step === 0 ? (
        <div className="space-y-4">
          <InfoNotice>
            De volledige berekening voor <strong>{service.title}</strong> wordt in een volgende
            stap toegevoegd. De vragen en resultaten verschijnen hier, binnen dezelfde simulator.
          </InfoNotice>
          <label className="block">
            <span className="mb-1.5 block text-sm font-semibold text-foreground">
              Korte omschrijving van je situatie (optioneel)
            </span>
            <textarea
              rows={3}
              value={state.situation}
              onChange={(event) => update({ situation: event.target.value })}
              className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm outline-none focus:border-primary focus:ring-2 focus:ring-ring/40"
            />
          </label>
          <WizardNavigation onPrev={onBackToOverview} onNext={() => goto(1)} />
        </div>
      ) : null}

      {step === 1 ? (
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
              goto(2);
            }}
          />
          <button
            type="button"
            onClick={() => goto(0)}
            className="text-sm font-medium text-muted-foreground underline-offset-4 hover:text-primary hover:underline"
          >
            Vorige
          </button>
        </div>
      ) : null}

      {step === 2 ? (
        <ResultsShell
          scenario={[
            { label: "Dienst", value: service.title },
            { label: "Aanvrager", value: lead ? `${lead.firstName} ${lead.lastName}` : "—" },
          ]}
          kpis={
            <>
              <KpiCard label="Geschatte besparing" value="—" hint="Volgt per dienst" />
              <KpiCard label="Investering" value="—" />
              <KpiCard label="Premies" value="—" />
              <KpiCard label="Terugverdientijd" value="—" />
            </>
          }
          summary={
            <InfoNotice>
              Je gegevens zijn lokaal verwerkt. De cijfermatige resultaten voor deze dienst
              worden in een volgende stap toegevoegd.
            </InfoNotice>
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

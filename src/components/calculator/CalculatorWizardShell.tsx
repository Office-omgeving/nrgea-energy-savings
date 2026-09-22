import type { ReactNode } from "react";
import { WizardStepper } from "./WizardStepper";

export function CalculatorWizardShell({
  title,
  description,
  steps,
  currentStep,
  onBackToOverview,
  children,
}: {
  title: string;
  description: string;
  steps?: string[];
  currentStep?: number;
  onBackToOverview: () => void;
  children: ReactNode;
}) {
  return (
    <div className="bg-background">
      <header className="sr-only">
        <h2>{title}</h2>
        <p>{description}</p>
      </header>

      <div className="mx-auto w-full max-w-[820px] px-6 py-12 md:px-12 md:py-20">
        {steps && steps.length > 0 && typeof currentStep === "number" ? (
          <div className="mb-6">
            <WizardStepper steps={steps} current={currentStep} />
          </div>
        ) : null}

        {children}

        <div className="mt-6">
          <button
            type="button"
            onClick={onBackToOverview}
            className="text-sm font-medium text-muted-foreground underline-offset-4 transition-colors hover:text-primary hover:underline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          >
            ← Terug naar alle simulaties
          </button>
        </div>
      </div>
    </div>
  );
}

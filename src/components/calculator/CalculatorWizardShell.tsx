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
      <header className="relative isolate overflow-hidden bg-forest">
        <div className="absolute inset-0 bg-gradient-to-br from-forest via-forest to-forest-surface" />
        <div className="hex-pattern absolute inset-0 opacity-60" />
        <div className="absolute -right-20 top-1/2 h-[220px] w-[220px] -translate-y-1/2 rounded-full bg-primary/20 blur-[80px]" />
        <div className="relative mx-auto w-full max-w-[760px] px-5 py-6 md:px-8">
          <span className="inline-flex rounded-full bg-white/10 px-3 py-1 text-[11px] font-semibold text-mint">
            Nrgea simulator
          </span>
          <h2 className="mt-3 font-display text-xl font-semibold leading-tight text-white sm:text-2xl">
            {title}
          </h2>
          <p className="mt-1.5 max-w-[420px] text-sm text-mint/80">{description}</p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[760px] px-5 py-6 md:px-8">
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

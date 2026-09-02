import type { ReactNode } from "react";
import { CalculatorBrandBar } from "./CalculatorBrandBar";
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
      <CalculatorBrandBar />
      <header className="bg-forest">
        <div className="mx-auto w-full max-w-[820px] px-5 py-8 md:px-8 md:py-10">
          <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-primary">
            NRGEA simulator
          </span>
          <h2 className="mt-3 font-display text-2xl font-medium leading-tight tracking-tight text-white sm:text-3xl">
            {title}
          </h2>
          <p className="mt-2 max-w-[560px] text-sm leading-relaxed text-white/65 sm:text-base">
            {description}
          </p>
        </div>
      </header>

      <div className="mx-auto w-full max-w-[820px] px-5 py-8 md:px-8 md:py-10">
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

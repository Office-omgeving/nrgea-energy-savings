import { CalculatorBrandBar } from "./CalculatorBrandBar";

export function CalculatorHero() {
  return (
    <>
      <CalculatorBrandBar />
      <header className="bg-forest">
        <div className="mx-auto flex min-h-[190px] w-full max-w-[1100px] flex-col justify-center px-5 py-10 md:min-h-[220px] md:px-8">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
            Uw persoonlijke energiescan
          </p>
          <h1 className="mt-3 max-w-[680px] font-display text-[2rem] font-medium leading-[1.08] tracking-[-0.025em] text-white sm:text-[2.6rem] lg:text-[3rem]">
            Bereken wat duurzame energie voor u kan betekenen.
          </h1>
          <p className="mt-4 max-w-[560px] text-base leading-relaxed text-white/65">
            Kies een oplossing en ontvang meteen een heldere, persoonlijke indicatie.
          </p>
        </div>
      </header>
    </>
  );
}

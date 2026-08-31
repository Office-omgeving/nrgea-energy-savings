export function CalculatorHero() {
  return (
    <header className="relative isolate overflow-hidden bg-forest">
      <div className="absolute inset-0 bg-gradient-to-br from-forest via-forest to-forest-surface" />
      <div className="hex-pattern absolute inset-0 opacity-70" />
      <div className="absolute -right-24 top-1/2 h-[320px] w-[320px] -translate-y-1/2 rounded-full bg-primary/25 blur-[90px]" />
      <div className="absolute -bottom-20 right-24 h-[180px] w-[180px] rounded-full bg-highlight/15 blur-[80px]" />

      <div className="relative mx-auto flex min-h-[170px] w-full max-w-[1100px] flex-col justify-center px-5 py-8 sm:min-h-[190px] md:min-h-[210px] md:px-8 lg:min-h-[230px]">
        <h1 className="font-display text-[1.6rem] font-semibold leading-[1.15] tracking-tight text-white sm:text-[2rem] lg:text-[2.4rem]">
          Ontdek je <span className="text-highlight">besparing</span>
          <br />
          in enkele klikken.
        </h1>
        <p className="mt-3 max-w-[420px] text-sm leading-relaxed text-mint/80">
          Kies een simulatietool en bereken direct hoeveel je kunt besparen op energie.
        </p>
      </div>
    </header>
  );
}

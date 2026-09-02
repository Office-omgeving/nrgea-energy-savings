export function CalculatorBrandBar() {
  return (
    <div className="border-b border-border bg-white">
      <div className="mx-auto flex h-20 w-full max-w-[1280px] items-center justify-between px-6 lg:px-8">
        <img src="/nrgea-logo.png" alt="NRGEA" className="h-9 w-auto object-contain" />
        <span className="text-[11px] font-medium uppercase tracking-[0.16em] text-muted-foreground">
          Energiecalculator
        </span>
      </div>
    </div>
  );
}

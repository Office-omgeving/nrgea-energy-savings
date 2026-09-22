import { calculatorServices } from "@/config/calculatorServices";
import { ServiceCard } from "./ServiceCard";

export function CalculatorServiceGrid({ onOpen }: { onOpen: (slug: string) => void }) {
  const services = calculatorServices.filter((service) => service.enabled);

  if (services.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="mx-auto w-full max-w-[1100px] px-6 py-12 md:px-12 md:py-20">
        <div className="mb-7 max-w-[620px]">
          <p className="text-xs font-medium uppercase tracking-[0.16em] text-primary">
            Onze oplossingen
          </p>
          <h2 className="mt-2 font-display text-2xl font-medium tracking-tight text-foreground sm:text-3xl">
            Kies uw simulatie
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground sm:text-base">
            Elke berekening vertrekt van uw woning, verbruik en plannen.
          </p>
        </div>

        <div className="grid grid-cols-1 gap-4 min-[560px]:grid-cols-2 min-[900px]:grid-cols-3">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}

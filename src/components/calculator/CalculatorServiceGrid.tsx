import { calculatorServices } from "@/config/calculatorServices";
import { ServiceCard } from "./ServiceCard";

export function CalculatorServiceGrid({ onOpen }: { onOpen: (slug: string) => void }) {
  const services = calculatorServices.filter((service) => service.enabled);

  if (services.length === 0) return null;

  return (
    <section className="bg-background">
      <div className="mx-auto w-full max-w-[1100px] px-5 py-8 md:px-8 md:py-10">
        <div className="grid grid-cols-1 gap-4 min-[540px]:grid-cols-2 min-[900px]:grid-cols-4">
          {services.map((service) => (
            <ServiceCard key={service.id} service={service} onOpen={onOpen} />
          ))}
        </div>
      </div>
    </section>
  );
}

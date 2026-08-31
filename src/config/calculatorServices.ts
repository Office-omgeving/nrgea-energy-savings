import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import {
  AirVent,
  BatteryCharging,
  Droplets,
  Layers,
  PiggyBank,
  Sun,
  Thermometer,
} from "lucide-react";

import { GenericServiceWizard } from "@/components/calculator/GenericServiceWizard";
import { SolarWizard } from "@/components/calculator/solar/SolarWizard";

export type ServiceComponentProps = {
  service: CalculatorService;
  onBackToOverview: () => void;
};

export type CalculatorService = {
  id: string;
  slug: string;
  title: string;
  subtitle?: string;
  description: string;
  icon: LucideIcon;
  /** Tailwind gradient classes voor het icoonblok. */
  accent: string;
  badge?: string;
  enabled: boolean;
  component: ComponentType<ServiceComponentProps>;
};

/**
 * Centrale serviceregistratie.
 * Volgende prompts: (1) dienstflow implementeren, (2) hier registreren,
 * (3) pas daarna `enabled: true` zetten. Het raster toont enkel enabled diensten.
 */
export const calculatorServices: CalculatorService[] = [
  {
    id: "zonnepanelen",
    slug: "zonnepanelen",
    title: "Zonnepanelen",
    subtitle: "+ batterij optioneel",
    description: "Bespaar op je energiefactuur met zonnepanelen.",
    icon: Sun,
    accent: "from-[#3FAF7A] to-[#1E8F72]",
    enabled: true,
    component: SolarWizard,
  },
  {
    id: "thuisbatterij",
    slug: "thuisbatterij",
    title: "Thuisbatterij",
    description: "Optimaliseer eigen verbruik van bestaande zonnepanelen.",
    icon: BatteryCharging,
    accent: "from-[#2F80ED] to-[#1B5FBF]",
    enabled: true,
    component: GenericServiceWizard,
  },
  {
    id: "lucht-water-warmtepomp",
    slug: "lucht-waterwarmtepomp",
    title: "Lucht-waterwarmtepomp",
    description: "Vervang je gasketel door een lucht-waterwarmtepomp.",
    icon: Thermometer,
    accent: "from-[#F2745C] to-[#D4453A]",
    badge: "Nieuwe premies",
    enabled: true,
    component: GenericServiceWizard,
  },
  {
    id: "warmtepompboiler",
    slug: "warmtepompboiler",
    title: "Warmtepompboiler",
    description: "Energiezuinig warm water voor je woning.",
    icon: Droplets,
    accent: "from-[#6B8CF2] to-[#7A5AF0]",
    badge: "Nieuwe premies",
    enabled: true,
    component: GenericServiceWizard,
  },
  {
    id: "totaalpakket",
    slug: "totaalpakket",
    title: "Totaalpakket",
    subtitle: "Lucht-waterwarmtepomp + PV + batterij",
    description: "Maximale besparing met zonnepanelen en een lucht-waterwarmtepomp.",
    icon: Layers,
    accent: "from-[#8B5CF6] to-[#6D28D9]",
    badge: "Nieuwe premies",
    enabled: true,
    component: GenericServiceWizard,
  },
  {
    id: "airco",
    slug: "airco",
    title: "Airco",
    subtitle: "Koelen en verwarmen",
    description: "Vraag een vrijblijvend advies aan voor airco.",
    icon: AirVent,
    accent: "from-[#56C7F0] to-[#2C9BC7]",
    enabled: true,
    component: GenericServiceWizard,
  },
  {
    id: "premie-berekenen",
    slug: "premie-berekenen",
    title: "Premie berekenen",
    description: "Bereken je Vlaamse premie voor een warmtepomp.",
    icon: PiggyBank,
    accent: "from-[#F5A623] to-[#E07B12]",
    enabled: true,
    component: GenericServiceWizard,
  },
];

export function findServiceBySlug(slug: string | null): CalculatorService | undefined {
  if (!slug) return undefined;
  return calculatorServices.find((s) => s.slug === slug && s.enabled);
}

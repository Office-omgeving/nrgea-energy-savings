import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { AirVent, BatteryCharging, Droplets, Sun, Thermometer } from "lucide-react";

import {
  AircoWizard,
  BatteryWizard,
  HeatPumpBoilerWizard,
  HeatPumpWizard,
} from "@/components/calculator/services/ServiceWizards";
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
 * Registreer een dienst pas als de eigen vragen, berekening en resultaatflow
 * beschikbaar zijn. Het raster toont enkel enabled diensten.
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
    component: BatteryWizard,
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
    component: HeatPumpWizard,
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
    component: HeatPumpBoilerWizard,
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
    component: AircoWizard,
  },
];

export function findServiceBySlug(slug: string | null): CalculatorService | undefined {
  if (!slug) return undefined;
  return calculatorServices.find((s) => s.slug === slug && s.enabled);
}

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
    description: "Bespaar op uw energiefactuur met zonnepanelen.",
    icon: Sun,
    enabled: true,
    component: SolarWizard,
  },
  {
    id: "thuisbatterij",
    slug: "thuisbatterij",
    title: "Thuisbatterij",
    description: "Optimaliseer eigen verbruik van bestaande zonnepanelen.",
    icon: BatteryCharging,
    enabled: true,
    component: BatteryWizard,
  },
  {
    id: "lucht-water-warmtepomp",
    slug: "lucht-waterwarmtepomp",
    title: "Lucht-waterwarmtepomp",
    description: "Vervang uw gasketel door een lucht-waterwarmtepomp.",
    icon: Thermometer,
    badge: "Nieuwe premies",
    enabled: true,
    component: HeatPumpWizard,
  },
  {
    id: "warmtepompboiler",
    slug: "warmtepompboiler",
    title: "Warmtepompboiler",
    description: "Energiezuinig warm water voor uw woning.",
    icon: Droplets,
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
    enabled: true,
    component: AircoWizard,
  },
];

export function findServiceBySlug(slug: string | null): CalculatorService | undefined {
  if (!slug) return undefined;
  return calculatorServices.find((s) => s.slug === slug && s.enabled);
}

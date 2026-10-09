import type { ComponentType } from "react";
import type { LucideIcon } from "lucide-react";
import { AirVent, BadgeEuro, BatteryCharging, Droplets, Sun, Thermometer } from "lucide-react";

import {
  AircoWizard,
  HeatPumpBoilerWizard,
  HeatPumpWizard,
} from "@/components/calculator/services/ServiceWizards";
import { HomeBatteryWizard } from "@/components/calculator/battery/HomeBatteryWizard";
import { SolarWizard } from "@/components/calculator/solar/SolarWizard";
import { PremiumWizard } from "@/components/calculator/premium/PremiumWizard";

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
    id: "home-battery",
    slug: "thuisbatterij",
    title: "Thuisbatterij",
    description: "Optimaliseer eigen verbruik van bestaande zonnepanelen.",
    icon: BatteryCharging,
    enabled: true,
    component: HomeBatteryWizard,
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
  {
    id: "premie",
    slug: "premie-berekenen",
    title: "Premie berekenen",
    description: "Bereken je Vlaamse premie voor een warmtepomp of warmtepompboiler.",
    icon: BadgeEuro,
    badge: "Regeling 2026",
    enabled: true,
    component: PremiumWizard,
  },
];

export function findServiceBySlug(slug: string | null): CalculatorService | undefined {
  if (!slug) return undefined;
  return calculatorServices.find((s) => s.slug === slug && s.enabled);
}

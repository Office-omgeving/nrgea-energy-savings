import { createFileRoute } from "@tanstack/react-router";

import { EmbedApp } from "@/components/calculator/EmbedApp";

/**
 * De root rendert dezelfde iframe-widget als /embed, zodat de calculator
 * werkt ongeacht welke URL de hostpagina in het iframe zet.
 */
export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Nrgea energiecalculator — bereken je besparing" },
      {
        name: "description",
        content:
          "Simuleer je besparing op zonnepanelen, thuisbatterij, warmtepomp en meer met de Nrgea energiecalculator.",
      },
      { property: "og:title", content: "Nrgea energiecalculator" },
      {
        property: "og:description",
        content: "Kies een simulatietool en bereken direct hoeveel je kunt besparen op energie.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: EmbedApp,
});

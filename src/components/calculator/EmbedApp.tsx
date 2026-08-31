import { useCallback, useEffect, useState } from "react";

import { findServiceBySlug } from "@/config/calculatorServices";
import { CalculatorHero } from "./CalculatorHero";
import { CalculatorServiceGrid } from "./CalculatorServiceGrid";
import { IframeResizeReporter, measureAndPost } from "./IframeResizeReporter";

/**
 * Iframe-shell van de Nrgea energiecalculator.
 * Navigatie gebeurt via hashrouting (bv. /embed#/zonnepanelen) zodat de
 * hostpagina nooit navigeert wanneer een dienst wordt geopend.
 */
function readSlugFromHash(): string | null {
  if (typeof window === "undefined") return null;
  const raw = window.location.hash.replace(/^#\/?/, "").trim();
  return raw ? raw : null;
}

export function EmbedApp() {
  const [slug, setSlug] = useState<string | null>(null);

  useEffect(() => {
    setSlug(readSlugFromHash());
    const onHashChange = () => {
      setSlug(readSlugFromHash());
      window.scrollTo({ top: 0, behavior: "auto" });
      measureAndPost();
    };
    window.addEventListener("hashchange", onHashChange);
    return () => window.removeEventListener("hashchange", onHashChange);
  }, []);

  const openService = useCallback((nextSlug: string) => {
    window.location.hash = `#/${nextSlug}`;
    setSlug(nextSlug);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(measureAndPost);
  }, []);

  const backToOverview = useCallback(() => {
    window.location.hash = "";
    setSlug(null);
    window.scrollTo({ top: 0, behavior: "auto" });
    requestAnimationFrame(measureAndPost);
  }, []);

  const service = findServiceBySlug(slug);
  const ServiceComponent = service?.component;

  return (
    <div id="nrgea-calculator-root" className="w-full overflow-x-hidden bg-background">
      <IframeResizeReporter watch={slug} />

      {service && ServiceComponent ? (
        <ServiceComponent service={service} onBackToOverview={backToOverview} />
      ) : (
        <>
          <CalculatorHero />
          <CalculatorServiceGrid onOpen={openService} />
        </>
      )}
    </div>
  );
}

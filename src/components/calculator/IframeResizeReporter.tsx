import { useEffect } from "react";

/**
 * Rapporteert de werkelijke contenthoogte naar de hostpagina.
 *
 * Integratievoorbeeld voor de hostpagina (NIET tonen in de UI):
 *
 * <iframe
 *   id="nrgea-calculator"
 *   src="https://DE-CALCULATOR-URL/embed"
 *   title="Nrgea energiecalculator"
 *   width="100%"
 *   scrolling="no"
 *   loading="lazy"
 *   style="width:100%; border:0; display:block;"
 * ></iframe>
 * <script>
 *   window.addEventListener("message", function (event) {
 *     if (
 *       event.data &&
 *       event.data.type === "nrgea-calculator-resize" &&
 *       Number.isFinite(event.data.height)
 *     ) {
 *       const iframe = document.getElementById("nrgea-calculator");
 *       if (iframe) {
 *         iframe.style.height = Math.ceil(event.data.height) + "px";
 *       }
 *     }
 *   });
 * </script>
 */

const MIN_HEIGHT = 200;
const MAX_HEIGHT = 20000;

export function postCalculatorHeight(height: number) {
  if (typeof window === "undefined") return;
  if (!Number.isFinite(height)) return;
  const safe = Math.min(MAX_HEIGHT, Math.max(MIN_HEIGHT, Math.ceil(height)));
  window.parent?.postMessage({ type: "nrgea-calculator-resize", height: safe }, "*");
}

export function measureAndPost() {
  if (typeof document === "undefined") return;
  const el = document.getElementById("nrgea-calculator-root");
  const height = el
    ? el.getBoundingClientRect().height
    : document.documentElement.scrollHeight;
  postCalculatorHeight(height);
}

/** Observeert de contenthoogte en stuurt updates bij elke relevante wijziging. */
export function IframeResizeReporter({ watch }: { watch?: unknown }) {
  useEffect(() => {
    const el = document.getElementById("nrgea-calculator-root");
    if (!el) return;

    measureAndPost();

    const observer = new ResizeObserver(() => measureAndPost());
    observer.observe(el);

    const onWindowChange = () => measureAndPost();
    window.addEventListener("resize", onWindowChange);
    window.addEventListener("load", onWindowChange);

    // Afbeeldingen die later laden.
    const images = Array.from(document.images);
    images.forEach((img) => img.addEventListener("load", onWindowChange));

    const timers = [50, 150, 400, 1000].map((ms) => window.setTimeout(measureAndPost, ms));

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", onWindowChange);
      window.removeEventListener("load", onWindowChange);
      images.forEach((img) => img.removeEventListener("load", onWindowChange));
      timers.forEach((t) => window.clearTimeout(t));
    };
  }, []);

  useEffect(() => {
    measureAndPost();
  }, [watch]);

  return null;
}

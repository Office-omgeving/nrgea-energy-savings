import { useCallback, useEffect, useState } from "react";

/**
 * Wizardstate per dienst, gescheiden opgeslagen zodat antwoorden van
 * verschillende diensten nooit vermengd raken.
 *
 * Keuze (bewust en voorspelbaar):
 * - "Terug naar alle simulaties" BEWAART de state van die dienst,
 *   zodat de bezoeker kan terugkeren zonder alles opnieuw in te vullen.
 * - "Nieuwe simulatie" WIST enkel de state van de actieve dienst.
 */
const keyFor = (serviceId: string) => `nrgea-calculator:${serviceId}`;

export function useWizardState<T extends Record<string, unknown>>(
  serviceId: string,
  initial: T,
) {
  const [state, setState] = useState<T>(initial);

  useEffect(() => {
    if (typeof window === "undefined") return;
    try {
      const raw = window.sessionStorage.getItem(keyFor(serviceId));
      if (raw) setState({ ...initial, ...(JSON.parse(raw) as Partial<T>) });
    } catch {
      /* sessionStorage kan geblokkeerd zijn in een iframe: negeer stil. */
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  const update = useCallback(
    (patch: Partial<T>) => {
      setState((prev) => {
        const next = { ...prev, ...patch };
        try {
          window.sessionStorage.setItem(keyFor(serviceId), JSON.stringify(next));
        } catch {
          /* negeer */
        }
        return next;
      });
    },
    [serviceId],
  );

  const reset = useCallback(() => {
    try {
      window.sessionStorage.removeItem(keyFor(serviceId));
    } catch {
      /* negeer */
    }
    setState(initial);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [serviceId]);

  return { state, update, reset };
}

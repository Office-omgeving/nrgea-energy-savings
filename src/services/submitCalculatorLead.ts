export type CalculatorLead = {
  serviceId: string;
  contact: Record<string, unknown>;
  answers?: Record<string, unknown>;
};

export type CalculatorLeadResponse = {
  ok: true;
  reference: string;
  submittedAt: string;
};

/**
 * Lokale mock-submit.
 * Verstuurt bewust NIETS: geen webhook, geen e-mail, geen externe database.
 * Logt enkel in development en geeft een lokale succesresponse terug.
 */
export async function submitCalculatorLead(
  lead: CalculatorLead,
): Promise<CalculatorLeadResponse> {
  if (import.meta.env.DEV) {
    // eslint-disable-next-line no-console
    console.info("[nrgea-calculator] mock lead submit", lead);
  }

  await new Promise((resolve) => setTimeout(resolve, 700));

  return {
    ok: true,
    reference: `NRG-LOCAL-${Math.random().toString(36).slice(2, 8).toUpperCase()}`,
    submittedAt: new Date().toISOString(),
  };
}

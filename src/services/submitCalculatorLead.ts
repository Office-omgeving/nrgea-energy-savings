import type { ContactFormValues } from "@/lib/contactValidation";

export type CalculatorLead = {
  serviceId: string;
  contact: ContactFormValues;
  answers?: Record<string, unknown>;
  result: unknown;
};
export type CalculatorLeadResponse = {
  ok: true;
  reference: string;
  submittedAt: string;
};
const submissions = new Map<string, string>();
async function submissionId(body: string): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", new TextEncoder().encode(body));
  const key =
    "nrgea-submission:" +
    Array.from(new Uint8Array(digest), (b) => b.toString(16).padStart(2, "0")).join("");
  let id = submissions.get(key);
  try {
    id ||= sessionStorage.getItem(key) || undefined;
  } catch {
    /* Memory fallback. */
  }
  id ||= crypto.randomUUID();
  submissions.set(key, id);
  try {
    sessionStorage.setItem(key, id);
  } catch {
    /* No personal data in storage. */
  }
  return id;
}
export async function submitCalculatorLead(lead: CalculatorLead): Promise<CalculatorLeadResponse> {
  const id = await submissionId(JSON.stringify(lead));
  const response = await fetch("/api/calculator-lead", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ ...lead, submissionId: id }),
    signal: AbortSignal.timeout(25000),
  });
  const result: unknown = await response.json();
  if (
    !response.ok ||
    !result ||
    typeof result !== "object" ||
    !("ok" in result) ||
    result.ok !== true
  ) {
    throw new Error("De opslag is nog niet bevestigd.");
  }
  return result as CalculatorLeadResponse;
}

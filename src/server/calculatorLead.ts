import { formatCalculationNote } from "./calculatorNote";
import { z } from "zod";
import { normalizeContact, validateContact } from "@/lib/contactValidation";

const text = z.string().max(200);
const schema = z
  .object({
    submissionId: z.string().uuid(),
    serviceId: z.enum([
      "zonnepanelen",
      "home-battery",
      "lucht-water-warmtepomp",
      "warmtepompboiler",
      "airco",
      "gevelisolatie",
      "premie",
    ]),
    contact: z
      .object({
        firstName: text,
        lastName: text,
        email: text,
        phone: text,
        street: text,
        houseNumber: text,
        postalCode: text,
        city: text,
        message: z.string().max(1000),
        consent: z.literal(true),
      })
      .strict(),
    answers: z.record(z.unknown()).default({}),
    result: z.unknown().refine((value) => value !== undefined && value !== null),
  })
  .strict();
const json = (body: unknown, status = 200) =>
  Response.json(body, {
    status,
    headers: { "Cache-Control": "no-store" },
  });
const labels: Record<string, string> = {
  zonnepanelen: "Zonnepanelen",
  "home-battery": "Thuisbatterij",
  "lucht-water-warmtepomp": "Warmtepomp",
  warmtepompboiler: "Warmtepompboiler",
  airco: "Airco",
  gevelisolatie: "Gevelisolatie",
  premie: "Premie",
};
export async function handleCalculatorLead(
  request: Request,
  receiverUrl: string | undefined,
  fetcher: typeof fetch = fetch,
): Promise<Response> {
  const origin = request.headers.get("origin");
  if (origin && origin !== new URL(request.url).origin) return json({ ok: false }, 403);
  if (!request.headers.get("content-type")?.startsWith("application/json"))
    return json({ ok: false }, 415);
  if (
    !receiverUrl ||
    !/^https:\/\/[a-z]+\.supabase\.co\/functions\/v1\/inbound-lead-webhook\/receiver\/[a-z0-9-]{3,32}$/.test(
      receiverUrl,
    )
  )
    return json({ ok: false }, 503);
  // Limit the stream before parsing, including chunked requests.
  const reader = request.body?.getReader();
  if (!reader) return json({ ok: false }, 400);
  const chunks: Uint8Array[] = [];
  let size = 0;
  while (true) {
    const next = await reader.read();
    if (next.done) break;
    size += next.value.length;
    if (size > 24000) {
      await reader.cancel();
      return json({ ok: false }, 413);
    }
    chunks.push(next.value);
  }
  const bytes = new Uint8Array(size);
  let offset = 0;
  for (const chunk of chunks) {
    bytes.set(chunk, offset);
    offset += chunk.length;
  }
  let parsed;
  try {
    parsed = schema.safeParse(JSON.parse(new TextDecoder().decode(bytes)));
  } catch {
    return json({ ok: false }, 400);
  }
  if (!parsed.success) return json({ ok: false }, 422);
  const { submissionId, serviceId, answers, result } = parsed.data;
  const contact = normalizeContact(parsed.data.contact);
  if (Object.keys(validateContact(contact)).length) return json({ ok: false }, 422);
  const note = [
    `NRGEA calculator — ${labels[serviceId]}`,
    "Indicatie van de calculator; geen bindende offerte. Ingevulde gegevens nog te verifiëren.",
    `Referentie: ${submissionId}`,
    `Antwoorden:\n${formatCalculationNote(answers)}`,
    `Indicatief resultaat:\n${formatCalculationNote(result)}`,
    contact.message ? `Bericht: ${contact.message}` : "",
    "Toestemming: contact over berekening en persoonlijk advies.",
  ]
    .filter(Boolean)
    .join("\n\n");
  if (note.length > 5000) return json({ ok: false }, 422);
  const form = new FormData();
  const fields = {
    rzb_submission_id: submissionId,
    rzb_form_type: "contact",
    rzb_source_path: `/#/${serviceId}`,
    rzb_source_url: `${new URL(request.url).origin}/#/${serviceId}`,
    Voornaam: contact.firstName,
    Achternaam: contact.lastName,
    "E-mailadres": contact.email,
    Telefoonnummer: contact.phone,
    "Straat-huisnummer": `${contact.street} ${contact.houseNumber}`,
    Postcode: contact.postalCode,
    Gemeente: contact.city,
    Bericht: note,
    Aanvraag: "NRGEA calculator",
  };
  for (const [key, value] of Object.entries(fields)) form.set(key, value);
  try {
    const response = await fetcher(receiverUrl, {
      method: "POST",
      headers: { "Idempotency-Key": submissionId },
      body: form,
      signal: AbortSignal.timeout(20000),
      redirect: "error",
    });
    const receipt = await response.json();
    if (
      response.ok &&
      receipt?.status === "confirmed" &&
      receipt.submissionId === submissionId &&
      typeof receipt.reference === "string" &&
      receipt.reference
    ) {
      return json({ ok: true, reference: submissionId, submittedAt: new Date().toISOString() });
    }
    return json({ ok: false }, response.status === 422 ? 422 : 503);
  } catch {
    return json({ ok: false }, 503);
  }
}

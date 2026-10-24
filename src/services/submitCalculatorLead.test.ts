import { afterEach, expect, it, vi } from "vitest";
import { submitCalculatorLead, type CalculatorLead } from "./submitCalculatorLead";
const lead: CalculatorLead = {
  serviceId: "airco",
  contact: {
    firstName: "Dries",
    lastName: "Test",
    email: "dries.test@example.com",
    phone: "+32470123456",
    street: "Teststraat",
    houseNumber: "1",
    postalCode: "2000",
    city: "Antwerpen",
    message: "",
    consent: true,
  },
  answers: { rooms: 1 },
  result: { price: "indicatief" },
};
afterEach(() => vi.unstubAllGlobals());
it("hergebruikt een aanvraagreferentie bij herhaald verzenden", async () => {
  const send = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(Response.json({ ok: true, reference: "confirmed", submittedAt: "now" })),
    );
  vi.stubGlobal("fetch", send);
  await submitCalculatorLead(lead);
  await submitCalculatorLead(lead);
  expect(JSON.parse(send.mock.calls[0]![1].body).submissionId).toBe(
    JSON.parse(send.mock.calls[1]![1].body).submissionId,
  );
});
it("behoudt dezelfde aanvraag na een netwerkfout", async () => {
  const send = vi
    .fn()
    .mockRejectedValueOnce(new Error("network"))
    .mockResolvedValueOnce(Response.json({ ok: true, reference: "confirmed", submittedAt: "now" }));
  vi.stubGlobal("fetch", send);
  await expect(submitCalculatorLead(lead)).rejects.toThrow();
  await submitCalculatorLead(lead);
  expect(JSON.parse(send.mock.calls[0]![1].body).submissionId).toBe(
    JSON.parse(send.mock.calls[1]![1].body).submissionId,
  );
});
it("bevestigt een nog niet opgeslagen aanvraag niet", async () => {
  vi.stubGlobal("fetch", vi.fn().mockResolvedValue(Response.json({ ok: false }, { status: 202 })));
  await expect(submitCalculatorLead(lead)).rejects.toThrow();
});
it("geeft een gewijzigde berekening een eigen referentie", async () => {
  const send = vi
    .fn()
    .mockImplementation(() =>
      Promise.resolve(Response.json({ ok: true, reference: "confirmed", submittedAt: "now" })),
    );
  vi.stubGlobal("fetch", send);
  await submitCalculatorLead(lead);
  await submitCalculatorLead({ ...lead, answers: { rooms: 2 } });
  expect(JSON.parse(send.mock.calls[0]![1].body).submissionId).not.toBe(
    JSON.parse(send.mock.calls[1]![1].body).submissionId,
  );
});

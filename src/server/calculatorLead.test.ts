import { describe, expect, it, vi } from "vitest";
import { handleCalculatorLead } from "./calculatorLead";
const receiver =
  "https://example.supabase.co/functions/v1/inbound-lead-webhook/receiver/dries-test";
const submissionId = "a3bc098e-1876-4372-b645-af89e83bd3f7";
const payload = {
  submissionId,
  serviceId: "airco",
  contact: {
    firstName: "Dries",
    lastName: "Test",
    email: "dries.test@example.com",
    phone: "0470123456",
    street: "Teststraat",
    houseNumber: "1",
    postalCode: "2000",
    city: "Antwerpen",
    message: "",
    consent: true,
  },
  answers: { rooms: 2 },
  result: { price: "indicatie" },
};
const request = (body: unknown = payload) =>
  new Request("https://calculator.example/api/calculator-lead", {
    method: "POST",
    headers: { "content-type": "application/json", origin: "https://calculator.example" },
    body: JSON.stringify(body),
  });
describe("opslag calculator", () => {
  it("bevestigt alleen een duurzame ontvangst met dezelfde aanvraag", async () => {
    const send = vi
      .fn()
      .mockResolvedValue(
        Response.json({ status: "confirmed", submissionId, reference: "contact-1" }),
      );
    const response = await handleCalculatorLead(request(), receiver, send);
    expect(response.status).toBe(200);
    expect(await response.json()).toMatchObject({ ok: true, reference: submissionId });
    const form = send.mock.calls[0]![1].body as FormData;
    expect(form.get("Telefoonnummer")).toBe("+32470123456");
    expect(form.get("Bericht")).toContain("Antwoorden:");
    expect(form.get("Bericht")).toContain("Indicatief resultaat:");
    expect(send.mock.calls[0]![1].headers["Idempotency-Key"]).toBe(submissionId);
  });
  it.each(["pending", "not_found", "rejected"])("toont geen succes bij %s", async (status) => {
    const send = vi.fn().mockResolvedValue(Response.json({ status, submissionId }));
    expect((await handleCalculatorLead(request(), receiver, send)).status).toBe(503);
  });
  it("weigert een ontvangst voor een andere aanvraag", async () => {
    const send = vi
      .fn()
      .mockResolvedValue(
        Response.json({ status: "confirmed", submissionId: "other", reference: "contact-1" }),
      );
    expect((await handleCalculatorLead(request(), receiver, send)).status).toBe(503);
  });
  it("blokkeert slechte persoonsgegevens vóór de ontvanger", async () => {
    const send = vi.fn();
    expect(
      (
        await handleCalculatorLead(
          request({ ...payload, contact: { ...payload.contact, phone: "123" } }),
          receiver,
          send,
        )
      ).status,
    ).toBe(422);
    expect(send).not.toHaveBeenCalled();
  });
  it("weigert ontbrekende configuratie zonder externe call", async () => {
    const send = vi.fn();
    expect((await handleCalculatorLead(request(), undefined, send)).status).toBe(503);
    expect(send).not.toHaveBeenCalled();
  });
  it("vangt een netwerkstoring af", async () => {
    expect(
      (
        await handleCalculatorLead(
          request(),
          receiver,
          vi.fn().mockRejectedValue(new Error("timeout")),
        )
      ).status,
    ).toBe(503);
  });
  it("weigert cross-origin requests", async () => {
    const req = request();
    req.headers.set("origin", "https://other.example");
    expect((await handleCalculatorLead(req, receiver, vi.fn())).status).toBe(403);
  });
  it("weigert te grote aanvragen", async () => {
    expect(
      (
        await handleCalculatorLead(
          request({ ...payload, result: "x".repeat(25000) }),
          receiver,
          vi.fn(),
        )
      ).status,
    ).toBe(413);
  });
  it("weigert onverwachte tenantvelden", async () => {
    expect(
      (await handleCalculatorLead(request({ ...payload, tenantId: "another" }), receiver, vi.fn()))
        .status,
    ).toBe(422);
  });
});

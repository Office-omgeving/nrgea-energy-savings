import { describe, expect, it } from "vitest";
import {
  validateContact,
  normalizeContact,
  normalizedPhone,
  type ContactFormValues,
} from "./contactValidation";
export const valid: ContactFormValues = {
  firstName: "Dries",
  lastName: "Test",
  email: "dries.test@example.com",
  phone: "0470 12 34 56",
  street: "Teststraat",
  houseNumber: "1 bus 2",
  postalCode: "2000",
  city: "Antwerpen",
  message: "",
  consent: true,
};
describe("contactgegevens", () => {
  it("accepteert een geldig Belgisch adres en normaliseert telefoon", () => {
    expect(validateContact(valid)).toEqual({});
    expect(normalizeContact(valid).phone).toBe("+32470123456");
  });
  it.each(["123", "0470", "047012345678", "bel 0470123456", "0470123456 ext 2"])(
    "weigert onvolledige of vervuilde telefoon %s",
    (phone) => expect(validateContact({ ...valid, phone }).phone).toBeTruthy(),
  );
  it("behoudt internationale nummers", () =>
    expect(normalizedPhone("0031612345678")).toBe("+31612345678"));
  it.each(["123", "9999", "0000", "0612"])("weigert ongeldige postcode %s", (postalCode) =>
    expect(validateContact({ ...valid, postalCode }).postalCode).toBeTruthy(),
  );
  it("weigert een gemeente bij de verkeerde postcode", () =>
    expect(validateContact({ ...valid, city: "Gent" }).city).toBeTruthy());
  it("accepteert plaatsnamen zonder verschil in hoofdletters", () =>
    expect(validateContact({ ...valid, city: " antwerpen " })).toEqual({}));
  it("vereist toestemming en alle identiteitsvelden", () => {
    expect(validateContact({ ...valid, consent: false }).consent).toBeTruthy();
    expect(validateContact({ ...valid, email: "", firstName: "" })).toMatchObject({
      email: expect.any(String),
      firstName: expect.any(String),
    });
  });
});

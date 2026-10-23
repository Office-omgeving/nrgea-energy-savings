import parsePhoneNumber from "libphonenumber-js/max";
import postalCodes from "@/data/belgian-postcodes.json";

export type ContactFormValues = {
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  street: string;
  houseNumber: string;
  postalCode: string;
  city: string;
  message: string;
  consent: boolean;
};
export type ContactErrors = Partial<Record<keyof ContactFormValues, string>>;
const places: Record<string, string[]> = postalCodes;
const normalizeCity = (value: string) =>
  value
    .normalize("NFD")
    .replace(/\p{M}/gu, "")
    .toLocaleLowerCase("nl-BE")
    .replace(/[^\p{L}\p{N}]/gu, "");

export function citiesForPostalCode(value: string): string[] {
  return places[value.trim()] || [];
}
export function normalizedPhone(value: string): string | null {
  const number = parsePhoneNumber(value.trim().replace(/^00/, "+"), {
    defaultCountry: "BE",
    extract: false,
  });
  return number?.isValid() && !number.ext ? number.number : null;
}
export function normalizeContact(values: ContactFormValues): ContactFormValues {
  return Object.fromEntries(
    Object.entries(values).map(([key, value]) => [
      key,
      key === "phone"
        ? normalizedPhone(String(value)) || String(value).trim()
        : typeof value === "string"
          ? value.trim()
          : value,
    ]),
  ) as ContactFormValues;
}
export function validateContact(values: ContactFormValues): ContactErrors {
  const errors: ContactErrors = {};
  const required: (keyof ContactFormValues)[] = [
    "firstName",
    "lastName",
    "email",
    "phone",
    "street",
    "houseNumber",
    "postalCode",
    "city",
  ];
  for (const key of required)
    if (!String(values[key]).trim()) errors[key] = "Dit veld is verplicht.";
  if (values.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email.trim()))
    errors.email = "Vul een geldig e-mailadres in.";
  if (values.phone.trim() && !normalizedPhone(values.phone))
    errors.phone =
      "Vul een volledig telefoonnummer in, bijvoorbeeld 0470 12 34 56. Gebruik voor een buitenlands nummer de landcode.";
  if (values.street.trim() && !/\p{L}/u.test(values.street))
    errors.street = "Vul een straatnaam in.";
  if (values.houseNumber.trim() && !/\d/.test(values.houseNumber))
    errors.houseNumber = "Vul een huisnummer in, eventueel met busnummer.";
  const cities = citiesForPostalCode(values.postalCode);
  if (values.postalCode.trim() && cities.length === 0)
    errors.postalCode = "Vul een bestaande Belgische postcode in.";
  if (
    values.city.trim() &&
    cities.length > 0 &&
    !cities.some((city) => normalizeCity(city) === normalizeCity(values.city))
  )
    errors.city = `Deze gemeente hoort niet bij postcode ${values.postalCode.trim()}. Kies een plaats uit de suggesties.`;
  if (!values.consent) errors.consent = "Je moet akkoord gaan om verder te gaan.";
  return errors;
}

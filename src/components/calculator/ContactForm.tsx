import { useState } from "react";

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

const EMPTY: ContactFormValues = {
  firstName: "",
  lastName: "",
  email: "",
  phone: "",
  street: "",
  houseNumber: "",
  postalCode: "",
  city: "",
  message: "",
  consent: false,
};

type Errors = Partial<Record<keyof ContactFormValues, string>>;

function validate(values: ContactFormValues): Errors {
  const errors: Errors = {};
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
  required.forEach((key) => {
    if (!String(values[key]).trim()) errors[key] = "Dit veld is verplicht.";
  });
  if (values.email && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(values.email)) {
    errors.email = "Vul een geldig e-mailadres in.";
  }
  if (!values.consent) errors.consent = "Je moet akkoord gaan om verder te gaan.";
  return errors;
}

function Field({
  label,
  value,
  onChange,
  error,
  type = "text",
  required,
}: {
  label: string;
  value: string;
  onChange: (value: string) => void;
  error?: string | undefined;
  type?: string;
  required?: boolean;
}) {
  return (
    <div>
      <label className="mb-1.5 block text-sm font-semibold text-foreground">
        {label}
        {required ? " *" : ""}
      </label>
      <input
        type={type}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        aria-invalid={!!error}
        className="h-12 w-full rounded-xl border border-input bg-card px-4 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"
      />
      {error ? <p className="mt-1 text-xs font-medium text-destructive">{error}</p> : null}
    </div>
  );
}

export function ContactForm({
  onSubmit,
  submitting,
}: {
  onSubmit: (values: ContactFormValues) => void;
  submitting?: boolean;
}) {
  const [values, setValues] = useState<ContactFormValues>(EMPTY);
  const [errors, setErrors] = useState<Errors>({});

  const set = (key: keyof ContactFormValues, value: string | boolean) =>
    setValues((prev) => ({ ...prev, [key]: value }));

  return (
    <form
      noValidate
      onSubmit={(event) => {
        event.preventDefault();
        const next = validate(values);
        setErrors(next);
        if (Object.keys(next).length === 0) onSubmit(values);
      }}
      className="space-y-4"
    >
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        <Field
          label="Voornaam"
          required
          value={values.firstName}
          error={errors.firstName}
          onChange={(v) => set("firstName", v)}
        />
        <Field
          label="Achternaam"
          required
          value={values.lastName}
          error={errors.lastName}
          onChange={(v) => set("lastName", v)}
        />
        <Field
          label="E-mail"
          type="email"
          required
          value={values.email}
          error={errors.email}
          onChange={(v) => set("email", v)}
        />
        <Field
          label="Telefoon"
          type="tel"
          required
          value={values.phone}
          error={errors.phone}
          onChange={(v) => set("phone", v)}
        />
        <Field
          label="Straat"
          required
          value={values.street}
          error={errors.street}
          onChange={(v) => set("street", v)}
        />
        <Field
          label="Huisnummer"
          required
          value={values.houseNumber}
          error={errors.houseNumber}
          onChange={(v) => set("houseNumber", v)}
        />
        <Field
          label="Postcode"
          required
          value={values.postalCode}
          error={errors.postalCode}
          onChange={(v) => set("postalCode", v)}
        />
        <Field
          label="Gemeente"
          required
          value={values.city}
          error={errors.city}
          onChange={(v) => set("city", v)}
        />
      </div>

      <div>
        <label className="mb-1.5 block text-sm font-semibold text-foreground">
          Bericht (optioneel)
        </label>
        <textarea
          value={values.message}
          onChange={(event) => set("message", event.target.value)}
          rows={3}
          className="w-full rounded-xl border border-input bg-card px-4 py-3 text-sm text-foreground outline-none transition-colors focus:border-primary focus:ring-2 focus:ring-ring/40"
        />
      </div>

      <div>
        <label className="flex cursor-pointer items-start gap-3 text-sm leading-relaxed text-foreground">
          <input
            type="checkbox"
            checked={values.consent}
            onChange={(event) => set("consent", event.target.checked)}
            className="mt-0.5 h-5 w-5 shrink-0 rounded border-input accent-[var(--color-primary)]"
          />
          <span>
            Ik ga akkoord dat Nrgea mij mag contacteren met informatie over mijn berekening en
            persoonlijk advies op maat. *
          </span>
        </label>
        {errors.consent ? (
          <p className="mt-1 text-xs font-medium text-destructive">{errors.consent}</p>
        ) : null}
      </div>

      <button
        type="submit"
        disabled={submitting}
        className="inline-flex h-12 w-full items-center justify-center rounded-xl bg-primary px-6 text-sm font-semibold text-primary-foreground transition-opacity hover:opacity-90 disabled:opacity-60 sm:w-auto"
      >
        {submitting ? "Even geduld…" : "Bekijk mijn resultaat"}
      </button>
    </form>
  );
}

import { createFileRoute } from "@tanstack/react-router";
import { handleCalculatorLead } from "@/server/calculatorLead";

export const Route = createFileRoute("/api/calculator-lead")({
  server: {
    handlers: {
      POST: ({ request }) =>
        handleCalculatorLead(request, process.env["STRILIO_CALCULATOR_RECEIVER_URL"]),
    },
  },
});

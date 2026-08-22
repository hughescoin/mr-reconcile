import { getPayment } from "@/lib/acmecommerce-api-core";
import { paymentSchema } from "@/lib/reconciliation-schemas";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Retrieve authoritative AcmeCommerce payment details for a payment ID.",
  inputSchema: z.object({
    paymentId: z
      .string()
      .min(1)
      .describe("The AcmeCommerce payment ID, for example pay_2007."),
  }),
  outputSchema: paymentSchema,
  async execute({ paymentId }, ctx) {
    return getPayment(paymentId, { signal: ctx.abortSignal });
  },
});

import { getSettlement } from "@/lib/acmecommerce-api-core";
import { settlementSchema } from "@/lib/reconciliation-schemas";
import { defineTool } from "eve/tools";
import { z } from "zod";

export default defineTool({
  description:
    "Retrieve authoritative merchant settlement details, including status, fees, adjustments, and net amount.",
  inputSchema: z.object({
    paymentId: z
      .string()
      .min(1)
      .describe("The AcmeCommerce payment ID, for example pay_2007."),
  }),
  outputSchema: settlementSchema,
  async execute({ paymentId }, ctx) {
    return getSettlement(paymentId, { signal: ctx.abortSignal });
  },
});

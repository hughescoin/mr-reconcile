import { getSettlement } from "@/lib/acmecommerce-api-core";
import { defineTool } from "eve/tools";
import { z } from "zod";

const settlementSchema = z.object({
  settlementId: z.string(),
  paymentId: z.string(),
  grossUsd: z.number(),
  adjustments: z.object({
    quoteProtectionUsd: z.number(),
  }),
  fees: z.object({
    networkUsd: z.number(),
    platformUsd: z.number(),
  }),
  netUsd: z.number().nullable(),
  settlementStatus: z.enum(["COMPLETED", "PENDING"]),
  settledAt: z.string().nullable(),
});

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

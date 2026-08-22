import { getTransaction } from "@/lib/acmecommerce-api-core";
import { defineTool } from "eve/tools";
import { z } from "zod";

const transactionSchema = z.object({
  transactionHash: z.string(),
  paymentId: z.string(),
  network: z.string(),
  asset: z.string(),
  assetAmount: z.number(),
  quotePriceUsd: z.number(),
  executionPriceUsd: z.number(),
  grossUsd: z.number(),
  networkFeeUsd: z.number(),
  confirmationStatus: z.enum(["CONFIRMED", "PENDING"]),
  confirmations: z.number(),
  requiredConfirmations: z.number(),
  submittedAt: z.string(),
  confirmedAt: z.string().nullable(),
});

export default defineTool({
  description:
    "Retrieve authoritative blockchain transaction details using a transaction hash.",
  inputSchema: z.object({
    transactionHash: z
      .string()
      .min(1)
      .describe(
        "The blockchain transaction hash. Bitcoin hashes are 64 hexadecimal characters; Ethereum and Base hashes typically begin with 0x.",
      ),
  }),
  outputSchema: transactionSchema,
  async execute({ transactionHash }, ctx) {
    return getTransaction(transactionHash, { signal: ctx.abortSignal });
  },
});

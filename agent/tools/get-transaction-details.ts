import { getTransaction } from "@/lib/acmecommerce-api-core";
import { transactionSchema } from "@/lib/reconciliation-schemas";
import { defineTool } from "eve/tools";
import { z } from "zod";

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

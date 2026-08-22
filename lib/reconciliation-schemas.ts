import { z } from "zod";

export const paymentSchema = z.object({
  paymentId: z.string(),
  merchantOrderId: z.string(),
  transactionHash: z.string(),
  expectedUsd: z.number(),
  network: z.string(),
  paymentStatus: z.enum(["COMPLETED", "PENDING"]),
  createdAt: z.string(),
});

export const transactionSchema = z.object({
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

export const settlementSchema = z.object({
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

export type Payment = z.infer<typeof paymentSchema>;
export type Transaction = z.infer<typeof transactionSchema>;
export type Settlement = z.infer<typeof settlementSchema>;

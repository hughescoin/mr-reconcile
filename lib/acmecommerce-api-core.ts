function getBaseUrl(): string {
  const baseUrl = process.env.ACMECOMMERCE_API_BASE_URL;

  if (!baseUrl) {
    throw new Error("ACMECOMMERCE_API_BASE_URL is not configured");
  }

  return baseUrl;
}

export interface Payment {
  paymentId: string;
  merchantOrderId: string;
  transactionHash: string;
  expectedUsd: number;
  network: string;
  paymentStatus: "COMPLETED" | "PENDING";
  createdAt: string;
}

export interface Transaction {
  transactionHash: string;
  paymentId: string;
  network: string;
  asset: string;
  assetAmount: number;
  quotePriceUsd: number;
  executionPriceUsd: number;
  grossUsd: number;
  networkFeeUsd: number;
  confirmationStatus: "CONFIRMED" | "PENDING";
  confirmations: number;
  requiredConfirmations: number;
  submittedAt: string;
  confirmedAt: string | null;
}

export interface Settlement {
  settlementId: string;
  paymentId: string;
  grossUsd: number;
  adjustments: { quoteProtectionUsd: number };
  fees: { networkUsd: number; platformUsd: number };
  netUsd: number | null;
  settlementStatus: "COMPLETED" | "PENDING";
  settledAt: string | null;
}

export class AcmeCommerceApiError extends Error {
  constructor(
    public readonly status: number,
    message: string,
  ) {
    super(message);
    this.name = "AcmeCommerceApiError";
  }
}

interface AcmeCommerceRequestOptions {
  signal?: AbortSignal;
}

async function throwApiError(
  response: Response,
  resource: string,
): Promise<never> {
  let apiMessage: string | undefined;

  try {
    const body = (await response.json()) as { error?: string };
    apiMessage = body.error;
  } catch {
    // Fall back to the HTTP status text below when the body is not JSON.
  }

  const detail = apiMessage || response.statusText || "Unknown provider error";

  throw new AcmeCommerceApiError(
    response.status,
    `${resource} request failed (${response.status}): ${detail}`,
  );
}

export async function getPayment(
  paymentId: string,
  options: AcmeCommerceRequestOptions = {},
): Promise<Payment> {
  const response = await fetch(
    `${getBaseUrl()}/payments/${encodeURIComponent(paymentId)}`,
    { signal: options.signal },
  );

  if (!response.ok) {
    await throwApiError(response, "Payment");
  }

  return (await response.json()) as Payment;
}

export async function getTransaction(
  transactionHash: string,
  options: AcmeCommerceRequestOptions = {},
): Promise<Transaction> {
  const response = await fetch(
    `${getBaseUrl()}/transactions/${encodeURIComponent(transactionHash)}`,
    { signal: options.signal },
  );

  if (!response.ok) {
    await throwApiError(response, "Transaction");
  }

  return (await response.json()) as Transaction;
}

export async function getSettlement(
  paymentId: string,
  options: AcmeCommerceRequestOptions = {},
): Promise<Settlement> {
  const response = await fetch(
    `${getBaseUrl()}/settlements/${encodeURIComponent(paymentId)}`,
    { signal: options.signal },
  );

  if (!response.ok) {
    await throwApiError(response, "Settlement");
  }

  return (await response.json()) as Settlement;
}

import assert from "node:assert/strict";
import { test } from "node:test";

import type { ToolContext } from "eve/tools";

import getPaymentDetailsEve from "../agent/tools/get-payment-details";
import getSettlementDetailsEve from "../agent/tools/get-settlement-details";
import getTransactionDetailsEve from "../agent/tools/get-transaction-details";

const TEST_BASE_URL = "https://acmecommerce.example.test";

interface FetchCall {
  input: string | URL | Request;
  init?: RequestInit;
}

async function withMockedAcmeCommerce<T>(
  responseBody: unknown,
  run: (calls: FetchCall[]) => Promise<T>,
): Promise<T> {
  const originalBaseUrl = process.env.ACMECOMMERCE_API_BASE_URL;
  const originalFetch = globalThis.fetch;
  const calls: FetchCall[] = [];

  process.env.ACMECOMMERCE_API_BASE_URL = TEST_BASE_URL;
  globalThis.fetch = (async (
    input: string | URL | Request,
    init?: RequestInit,
  ) => {
    calls.push({ input, init });
    return Response.json(responseBody);
  }) as typeof fetch;

  try {
    return await run(calls);
  } finally {
    globalThis.fetch = originalFetch;

    if (originalBaseUrl === undefined) {
      delete process.env.ACMECOMMERCE_API_BASE_URL;
    } else {
      process.env.ACMECOMMERCE_API_BASE_URL = originalBaseUrl;
    }
  }
}

function eveContext(toolName: string, signal: AbortSignal): ToolContext {
  return {
    abortSignal: signal,
    callId: `parity-${toolName}`,
    toolName,
  } as ToolContext;
}

test("Eve payment tool returns the authoritative payment result", async () => {
  const fixture = {
    paymentId: "pay_2007",
    merchantOrderId: "order_9007",
    transactionHash:
      "db5950566eb16cc1a4084be79c9873317aafe46980693f4f69ade9b0ce9ac2c1",
    expectedUsd: 950,
    network: "bitcoin",
    paymentStatus: "COMPLETED" as const,
    createdAt: "2026-08-20T15:00:00.000Z",
  };
  const controller = new AbortController();

  await withMockedAcmeCommerce(fixture, async (calls) => {
    const eveResult = await getPaymentDetailsEve.execute(
      { paymentId: fixture.paymentId },
      eveContext("get-payment-details", controller.signal),
    );

    assert.deepEqual(eveResult, fixture);
    assert.equal(String(calls[0]?.input), `${TEST_BASE_URL}/payments/pay_2007`);
    assert.equal(calls[0]?.init?.signal, controller.signal);
    assert.equal(calls.length, 1);
  });
});

test("Eve transaction tool returns the authoritative transaction result", async () => {
  const fixture = {
    transactionHash: "0xtransaction",
    paymentId: "pay_2007",
    network: "base",
    asset: "USDC",
    assetAmount: 950,
    quotePriceUsd: 1,
    executionPriceUsd: 1,
    grossUsd: 950,
    networkFeeUsd: 0.02,
    confirmationStatus: "CONFIRMED" as const,
    confirmations: 18,
    requiredConfirmations: 12,
    submittedAt: "2026-08-20T15:01:00.000Z",
    confirmedAt: "2026-08-20T15:02:00.000Z",
  };
  const controller = new AbortController();

  await withMockedAcmeCommerce(fixture, async (calls) => {
    const eveResult = await getTransactionDetailsEve.execute(
      { transactionHash: fixture.transactionHash },
      eveContext("get-transaction-details", controller.signal),
    );

    assert.deepEqual(eveResult, fixture);
    assert.equal(
      String(calls[0]?.input),
      `${TEST_BASE_URL}/transactions/0xtransaction`,
    );
    assert.equal(calls[0]?.init?.signal, controller.signal);
    assert.equal(calls.length, 1);
  });
});

test("Eve settlement tool preserves null instead of inventing a net amount", async () => {
  const fixture = {
    settlementId: "set_2007",
    paymentId: "pay_2007",
    grossUsd: 950,
    adjustments: { quoteProtectionUsd: 0 },
    fees: { networkUsd: 0.02, platformUsd: 9.5 },
    netUsd: null,
    settlementStatus: "PENDING" as const,
    settledAt: null,
  };
  const controller = new AbortController();

  await withMockedAcmeCommerce(fixture, async (calls) => {
    const eveResult = await getSettlementDetailsEve.execute(
      { paymentId: fixture.paymentId },
      eveContext("get-settlement-details", controller.signal),
    );

    assert.deepEqual(eveResult, fixture);
    assert.equal(eveResult.netUsd, null);
    assert.equal(String(calls[0]?.input), `${TEST_BASE_URL}/settlements/pay_2007`);
    assert.equal(calls[0]?.init?.signal, controller.signal);
    assert.equal(calls.length, 1);
  });
});

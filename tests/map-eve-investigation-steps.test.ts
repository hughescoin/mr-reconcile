import assert from "node:assert/strict";
import { test } from "node:test";

import type { MessageStreamEvent } from "eve/client";

import { mapEveInvestigationSteps } from "../lib/map-eve-investigation-steps";

type UnstampedEvent = MessageStreamEvent extends infer Event
  ? Event extends MessageStreamEvent
    ? Omit<Event, "meta">
    : never
  : never;

function event(value: UnstampedEvent): MessageStreamEvent {
  return {
    ...value,
    meta: {
      at: "2026-08-22T12:00:00.000Z",
      id: `evt_${crypto.randomUUID()}`,
    },
  } as MessageStreamEvent;
}

test("maps Eve requests and authoritative results into investigation steps", () => {
  const events: MessageStreamEvent[] = [
    event({
      type: "turn.started",
      data: { sequence: 0, turnId: "turn_1" },
    }),
    event({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call_payment",
            input: { paymentId: "pay_2007" },
            kind: "tool-call",
            toolName: "get-payment-details",
          },
          {
            callId: "call_transaction",
            input: { transactionHash: "1234567890abcdef" },
            kind: "tool-call",
            toolName: "get-transaction-details",
          },
          {
            callId: "call_settlement",
            input: { paymentId: "pay_2007" },
            kind: "tool-call",
            toolName: "get-settlement-details",
          },
        ],
        sequence: 0,
        stepIndex: 0,
        turnId: "turn_1",
      },
    }),
    toolResult("turn_1", "call_payment", "get-payment-details", {
      paymentId: "pay_2007",
      merchantOrderId: "order_9007",
      transactionHash: "1234567890abcdef",
      expectedUsd: 950,
      network: "bitcoin",
      paymentStatus: "COMPLETED",
      createdAt: "2026-08-20T15:00:00.000Z",
    }),
    toolResult("turn_1", "call_transaction", "get-transaction-details", {
      transactionHash: "1234567890abcdef",
      paymentId: "pay_2007",
      network: "bitcoin",
      asset: "BTC",
      assetAmount: 0.0145,
      quotePriceUsd: 65_500,
      executionPriceUsd: 65_500,
      grossUsd: 949.75,
      networkFeeUsd: 0.25,
      confirmationStatus: "CONFIRMED",
      confirmations: 6,
      requiredConfirmations: 3,
      submittedAt: "2026-08-20T15:01:00.000Z",
      confirmedAt: "2026-08-20T15:20:00.000Z",
    }),
    toolResult("turn_1", "call_settlement", "get-settlement-details", {
      settlementId: "set_2007",
      paymentId: "pay_2007",
      grossUsd: 949.75,
      adjustments: { quoteProtectionUsd: 0 },
      fees: { networkUsd: 0.25, platformUsd: 9.5 },
      netUsd: null,
      settlementStatus: "PENDING",
      settledAt: null,
    }),
  ];

  assert.deepEqual(mapEveInvestigationSteps(events), [
    {
      type: "payment",
      label: "Payment lookup",
      detail: "Payment record retrieved",
      reference: "pay_2007",
      amount: "$950.00",
      status: "completed",
    },
    {
      type: "transaction",
      label: "Blockchain verification",
      detail: "6 confirmations · 3 required",
      reference: "123456…bcdef",
      amount: "0.0145 BTC",
      status: "confirmed",
    },
    {
      type: "settlement",
      label: "Settlement lookup",
      detail: "Merchant settlement has not completed",
      reference: "set_2007",
      amount: "—",
      status: "pending",
    },
  ]);
});

test("keeps a requested tool in checking state when output is malformed", () => {
  const events: MessageStreamEvent[] = [
    event({
      type: "turn.started",
      data: { sequence: 0, turnId: "turn_1" },
    }),
    event({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call_settlement",
            input: { paymentId: "pay_2007" },
            kind: "tool-call",
            toolName: "get-settlement-details",
          },
        ],
        sequence: 0,
        stepIndex: 0,
        turnId: "turn_1",
      },
    }),
    toolResult("turn_1", "call_settlement", "get-settlement-details", {
      settlementStatus: "COMPLETED",
      netUsd: "invented",
    }),
  ];

  assert.deepEqual(mapEveInvestigationSteps(events), [
    {
      type: "settlement",
      label: "Settlement lookup",
      detail: "Checking merchant settlement",
      reference: "pay_2007",
      amount: "—",
      status: "checking",
    },
  ]);
});

test("projects only the latest durable turn", () => {
  const events: MessageStreamEvent[] = [
    event({
      type: "turn.started",
      data: { sequence: 0, turnId: "turn_old" },
    }),
    toolResult("turn_old", "call_old", "get-payment-details", {
      paymentId: "pay_old",
      merchantOrderId: "order_old",
      transactionHash: "old_hash",
      expectedUsd: 1,
      network: "base",
      paymentStatus: "COMPLETED",
      createdAt: "2026-08-20T15:00:00.000Z",
    }),
    event({
      type: "turn.started",
      data: { sequence: 1, turnId: "turn_new" },
    }),
    event({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call_new",
            input: { paymentId: "pay_new" },
            kind: "tool-call",
            toolName: "get-payment-details",
          },
        ],
        sequence: 1,
        stepIndex: 0,
        turnId: "turn_new",
      },
    }),
  ];

  assert.equal(mapEveInvestigationSteps(events).length, 1);
  assert.equal(mapEveInvestigationSteps(events)[0]?.reference, "pay_new");
});

test("replaces retry events for the same call instead of duplicating a row", () => {
  const events: MessageStreamEvent[] = [
    event({
      type: "turn.started",
      data: { sequence: 0, turnId: "turn_retry" },
    }),
    event({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call_payment",
            input: { paymentId: "pay_2007" },
            kind: "tool-call",
            toolName: "get-payment-details",
          },
        ],
        sequence: 0,
        stepIndex: 0,
        turnId: "turn_retry",
      },
    }),
    event({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call_payment",
            input: { paymentId: "pay_2007" },
            kind: "tool-call",
            toolName: "get-payment-details",
          },
        ],
        sequence: 0,
        stepIndex: 0,
        turnId: "turn_retry",
      },
    }),
    toolResult("turn_retry", "call_payment", "get-payment-details", {
      paymentId: "pay_2007",
      merchantOrderId: "order_9007",
      transactionHash: "1234567890abcdef",
      expectedUsd: 890,
      network: "bitcoin",
      paymentStatus: "COMPLETED",
      createdAt: "2026-08-20T15:00:00.000Z",
    }),
  ];

  const steps = mapEveInvestigationSteps(events);

  assert.equal(steps.length, 1);
  assert.equal(steps[0]?.reference, "pay_2007");
  assert.equal(steps[0]?.amount, "$890.00");
});

test("removes a failed lookup when the model retries with a corrected payment ID", () => {
  const events: MessageStreamEvent[] = [
    event({
      type: "turn.started",
      data: { sequence: 0, turnId: "turn_corrected_id" },
    }),
    event({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call_invalid_payment",
            input: { paymentId: "2007" },
            kind: "tool-call",
            toolName: "get-payment-details",
          },
        ],
        sequence: 0,
        stepIndex: 0,
        turnId: "turn_corrected_id",
      },
    }),
    failedToolResult(
      "turn_corrected_id",
      "call_invalid_payment",
      "get-payment-details",
    ),
    event({
      type: "actions.requested",
      data: {
        actions: [
          {
            callId: "call_corrected_payment",
            input: { paymentId: "pay_2007" },
            kind: "tool-call",
            toolName: "get-payment-details",
          },
        ],
        sequence: 0,
        stepIndex: 1,
        turnId: "turn_corrected_id",
      },
    }),
    toolResult(
      "turn_corrected_id",
      "call_corrected_payment",
      "get-payment-details",
      {
        paymentId: "pay_2007",
        merchantOrderId: "order_9007",
        transactionHash: "1234567890abcdef",
        expectedUsd: 890,
        network: "bitcoin",
        paymentStatus: "COMPLETED",
        createdAt: "2026-08-20T15:00:00.000Z",
      },
    ),
  ];

  assert.deepEqual(mapEveInvestigationSteps(events), [
    {
      type: "payment",
      label: "Payment lookup",
      detail: "Payment record retrieved",
      reference: "pay_2007",
      amount: "$890.00",
      status: "completed",
    },
  ]);
});

function toolResult(
  turnId: string,
  callId: string,
  toolName: string,
  output: unknown,
): MessageStreamEvent {
  return event({
    type: "action.result",
    data: {
      result: {
        callId,
        kind: "tool-result",
        output,
        toolName,
      },
      sequence: 0,
      status: "completed",
      stepIndex: 0,
      turnId,
    },
  } as UnstampedEvent);
}

function failedToolResult(
  turnId: string,
  callId: string,
  toolName: string,
): MessageStreamEvent {
  return event({
    type: "action.result",
    data: {
      error: {
        code: "NOT_FOUND",
        message: "Payment not found",
      },
      result: {
        callId,
        isError: true,
        kind: "tool-result",
        output: { error: "Payment not found" },
        toolName,
      },
      sequence: 0,
      status: "failed",
      stepIndex: 0,
      turnId,
    },
  } as UnstampedEvent);
}

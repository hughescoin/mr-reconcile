import type { MessageStreamEvent } from "eve/client";

import type { InvestigationStep } from "@/components/InvestigationTrace";
import {
  paymentSchema,
  settlementSchema,
  transactionSchema,
} from "@/lib/reconciliation-schemas";

interface RequestedTool {
  callId: string;
  input: Record<string, unknown>;
  toolName: string;
}

interface ProjectedStep {
  callId: string;
  step: InvestigationStep;
}

const RECONCILIATION_TOOLS = new Set([
  "get-payment-details",
  "get-transaction-details",
  "get-settlement-details",
]);

export function mapEveInvestigationSteps(
  events: readonly MessageStreamEvent[],
): InvestigationStep[] {
  const latestTurnId = findLatestTurnId(events);

  if (!latestTurnId) {
    return [];
  }

  const projected: ProjectedStep[] = [];

  for (const event of events) {
    if (event.type === "actions.requested" && event.data.turnId === latestTurnId) {
      for (const action of event.data.actions) {
        if (
          action.kind !== "tool-call" ||
          !RECONCILIATION_TOOLS.has(action.toolName)
        ) {
          continue;
        }

        upsertStep(projected, {
          callId: action.callId,
          step: mapRequestedTool(action),
        });
      }
    }

    if (
      event.type !== "action.result" ||
      event.data.turnId !== latestTurnId ||
      event.data.status !== "completed" ||
      event.data.result.kind !== "tool-result" ||
      !RECONCILIATION_TOOLS.has(event.data.result.toolName)
    ) {
      continue;
    }

    const completedStep = mapCompletedTool(
      event.data.result.toolName,
      event.data.result.output,
    );

    if (completedStep) {
      upsertStep(projected, {
        callId: event.data.result.callId,
        step: completedStep,
      });
    }
  }

  return projected.map(({ step }) => step);
}

function findLatestTurnId(events: readonly MessageStreamEvent[]) {
  for (let index = events.length - 1; index >= 0; index -= 1) {
    const event = events[index];

    if (event.type === "turn.started") {
      return event.data.turnId;
    }
  }

  return undefined;
}

function mapRequestedTool(action: RequestedTool): InvestigationStep {
  switch (action.toolName) {
    case "get-payment-details":
      return {
        type: "payment",
        label: "Payment lookup",
        detail: "Checking payment record",
        reference: readString(action.input.paymentId),
        amount: "—",
        status: "checking",
      };
    case "get-transaction-details":
      return {
        type: "transaction",
        label: "Blockchain verification",
        detail: "Checking blockchain transaction",
        reference: shortenHash(readString(action.input.transactionHash)),
        amount: "—",
        status: "checking",
      };
    case "get-settlement-details":
      return {
        type: "settlement",
        label: "Settlement lookup",
        detail: "Checking merchant settlement",
        reference: readString(action.input.paymentId),
        amount: "—",
        status: "checking",
      };
    default:
      throw new Error(`Unsupported reconciliation tool: ${action.toolName}`);
  }
}

function mapCompletedTool(
  toolName: string,
  output: unknown,
): InvestigationStep | undefined {
  switch (toolName) {
    case "get-payment-details": {
      const parsed = paymentSchema.safeParse(output);

      if (!parsed.success) return undefined;

      return {
        type: "payment",
        label: "Payment lookup",
        detail: "Payment record retrieved",
        reference: parsed.data.paymentId,
        amount: `$${parsed.data.expectedUsd.toFixed(2)}`,
        status:
          parsed.data.paymentStatus === "COMPLETED" ? "completed" : "pending",
      };
    }
    case "get-transaction-details": {
      const parsed = transactionSchema.safeParse(output);

      if (!parsed.success) return undefined;

      return {
        type: "transaction",
        label: "Blockchain verification",
        detail: `${parsed.data.confirmations} confirmations · ${parsed.data.requiredConfirmations} required`,
        reference: shortenHash(parsed.data.transactionHash),
        amount: `${parsed.data.assetAmount} ${parsed.data.asset}`,
        status:
          parsed.data.confirmationStatus === "CONFIRMED"
            ? "confirmed"
            : "pending",
      };
    }
    case "get-settlement-details": {
      const parsed = settlementSchema.safeParse(output);

      if (!parsed.success) return undefined;

      return {
        type: "settlement",
        label: "Settlement lookup",
        detail:
          parsed.data.settlementStatus === "COMPLETED"
            ? "Merchant settlement completed"
            : "Merchant settlement has not completed",
        reference: parsed.data.settlementId,
        amount:
          parsed.data.netUsd === null
            ? "—"
            : `$${parsed.data.netUsd.toFixed(2)}`,
        status:
          parsed.data.settlementStatus === "COMPLETED"
            ? "completed"
            : "pending",
      };
    }
    default:
      return undefined;
  }
}

function upsertStep(steps: ProjectedStep[], next: ProjectedStep) {
  const existingIndex = steps.findIndex((step) => step.callId === next.callId);

  if (existingIndex === -1) {
    steps.push(next);
    return;
  }

  steps[existingIndex] = next;
}

function readString(value: unknown) {
  return typeof value === "string" && value.length > 0 ? value : "—";
}

function shortenHash(hash: string) {
  if (hash.length <= 14) {
    return hash;
  }

  return `${hash.slice(0, 6)}…${hash.slice(-5)}`;
}

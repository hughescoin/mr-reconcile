import assert from "node:assert/strict";
import { test } from "node:test";

import { reconciliationAgent } from "../agents/reconciliation-agent";

const STEP_LIMIT = 6;

test("reconciliationAgent investigates pay_2007 through its tools", async () => {
  const result = await reconciliationAgent.generate({
    prompt: "Where are my funds for pay_2007?",
  });

  const stepSummary = result.steps.map((step, index) => ({
    step: index + 1,
    finishReason: step.finishReason,
    tools: step.toolCalls.map((toolCall) => toolCall.toolName),
  }));
  const toolCallOrder = stepSummary.flatMap((step) => step.tools);

  console.log("Final response:", result.text);
  console.log("Steps:", JSON.stringify(stepSummary, null, 2));
  console.log("Tool-call order:", toolCallOrder.join(" → "));

  assert.ok(result.text.length > 0, "expected a final agent response");
  assert.ok(
    toolCallOrder.includes("get-payment-details"),
    "expected getPaymentDetails to be called",
  );
  assert.ok(
    toolCallOrder.includes("get-transaction-details"),
    "expected getTransactionDetails to be called",
  );
  assert.ok(
    toolCallOrder.includes("get-settlement-details"),
    "expected getSettlementDetails to be called",
  );
  assert.ok(
    result.steps.length <= STEP_LIMIT,
    `expected at most ${STEP_LIMIT} steps, received ${result.steps.length}`,
  );
  assert.match(
    result.text,
    /\bsettlement\b[\s\S]{0,100}\bpending\b|\bpending\b[\s\S]{0,100}\bsettlement\b/i,
    "expected the response to say the settlement is pending",
  );
  const saysNoAuthoritativeNetAmount =
    /\bno\s+(?:completed\s+)?authoritative\s+(?:(?:final\s+)?(?:net\s+)?settlement amount|net(?:\s+(?:amount|payout))?)\b/i.test(
      result.text,
    ) ||
    /\b(?:net(?:Usd|\s+(?:amount|payout))?|(?:final\s+)?(?:net\s+)?settlement amount)\b[\s\S]{0,120}\b(?:null|not (?:yet )?available|unavailable|not (?:been )?(?:calculated|finalized|recorded)|cannot provide)\b/i.test(
      result.text,
    );

  assert.ok(
    saysNoAuthoritativeNetAmount,
    "expected the response to explain that no authoritative net amount is available",
  );
  assert.doesNotMatch(
    result.text,
    /\bnet(?:Usd|\s+(?:amount|payout))?\s*(?:is|of|:|=)\s*(?:approximately\s*|about\s*|~\s*)?(?:\$|USD\s*)?\d/i,
    "must not claim a numeric net payout amount",
  );
  assert.doesNotMatch(
    result.text,
    /\b(?:expected|estimated|approximate|projected|final|completed)\s+(?:net\s+)?(?:amount|payout)\b[^\n]*\d|\bexpect(?:ed)?\s+(?:a\s+)?net\b[^\n]*(?:\$|USD)\s*\d/i,
    "must not estimate or claim a final net payout amount",
  );
});

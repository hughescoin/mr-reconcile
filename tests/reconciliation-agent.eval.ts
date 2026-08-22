import assert from "node:assert/strict";
import { test } from "node:test";

import { reconciliationAgent } from "../agents/reconciliation-agent";
import evalCasesJson from "./eval-cases.json";

interface ProhibitedClaim {
  description: string;
  pattern: string;
}

interface RequiredResponseFact {
  description: string;
  patterns: string[];
}

interface RequiredToolFact {
  tool: string;
  path: string;
  expected: unknown;
}

interface EvalCase {
  id: string;
  prompt: string;
  requiredTools: string[];
  requiredResponseFacts: RequiredResponseFact[];
  requiredToolFacts: RequiredToolFact[];
  prohibitedClaims: ProhibitedClaim[];
  maxSteps: number;
}

const evalCases = evalCasesJson as EvalCase[];

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

for (const evalCase of evalCases) {
  test(`reconciliationAgent eval: ${evalCase.id}`, async () => {
    const result = await reconciliationAgent.generate({
      prompt: evalCase.prompt,
    });
    const toolCalls = result.steps.flatMap((step) =>
      step.toolCalls.map((toolCall) => toolCall.toolName),
    );
    const toolResults = result.steps.flatMap((step) => step.toolResults);
    const response = result.text.toLowerCase();

    console.log(`\n[${evalCase.id}] Tools: ${toolCalls.join(" → ")}`);
    console.log(`[${evalCase.id}] Steps: ${result.steps.length}`);
    console.log(`[${evalCase.id}] Response:\n${result.text}\n`);

    for (const requiredTool of evalCase.requiredTools) {
      assert.ok(
        toolCalls.includes(requiredTool),
        `${evalCase.id}: expected tool ${requiredTool} to be called`,
      );
    }

    assert.ok(
      result.steps.length <= evalCase.maxSteps,
      `${evalCase.id}: expected at most ${evalCase.maxSteps} steps, received ${result.steps.length}`,
    );

    for (const requiredToolFact of evalCase.requiredToolFacts) {
      const toolResult = toolResults.find(
        (candidate) => candidate.toolName === requiredToolFact.tool,
      );

      assert.ok(
        toolResult,
        `${evalCase.id}: expected a result from ${requiredToolFact.tool}`,
      );
      assert.deepEqual(
        readPath(toolResult.output, requiredToolFact.path),
        requiredToolFact.expected,
        `${evalCase.id}: expected ${requiredToolFact.tool}.${requiredToolFact.path} to equal ${JSON.stringify(requiredToolFact.expected)}`,
      );
    }

    for (const requiredFact of evalCase.requiredResponseFacts) {
      assert.ok(
        requiredFact.patterns.every((pattern) =>
          new RegExp(pattern, "i").test(response),
        ),
        `${evalCase.id}: response must explain ${requiredFact.description}`,
      );
    }

    for (const prohibitedClaim of evalCase.prohibitedClaims) {
      assert.ok(
        !new RegExp(prohibitedClaim.pattern, "i").test(response),
        `${evalCase.id}: response must not claim ${prohibitedClaim.description}`,
      );
    }
  });
}

import { isDeepStrictEqual } from "node:util";

import { defineEval } from "eve/evals";
import { satisfies } from "eve/evals/expect";
import { loadJson } from "eve/evals/loaders";

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

function readPath(value: unknown, path: string): unknown {
  return path.split(".").reduce<unknown>((current, segment) => {
    if (typeof current !== "object" || current === null) {
      return undefined;
    }

    return (current as Record<string, unknown>)[segment];
  }, value);
}

function isEvalCase(value: unknown): value is EvalCase {
  return (
    typeof value === "object" &&
    value !== null &&
    typeof (value as Partial<EvalCase>).id === "string" &&
    typeof (value as Partial<EvalCase>).prompt === "string" &&
    Array.isArray((value as Partial<EvalCase>).requiredTools) &&
    Array.isArray((value as Partial<EvalCase>).requiredResponseFacts) &&
    Array.isArray((value as Partial<EvalCase>).requiredToolFacts) &&
    Array.isArray((value as Partial<EvalCase>).prohibitedClaims) &&
    typeof (value as Partial<EvalCase>).maxSteps === "number"
  );
}

const evalCasesDocument = await loadJson("tests/eval-cases.json");

if (!Array.isArray(evalCasesDocument) || !evalCasesDocument.every(isEvalCase)) {
  throw new TypeError("tests/eval-cases.json does not contain valid eval cases");
}

export default evalCasesDocument.map((evalCase) =>
  defineEval({
    description: `Eve parity: ${evalCase.id}`,
    tags: ["reconciliation", "parity"],
    metadata: { caseId: evalCase.id },
    async test(t) {
      await t.send(evalCase.prompt);

      t.succeeded();
      t.noFailedActions();
      t.maxToolCalls(evalCase.maxSteps).label("tool-call budget");

      for (const requiredTool of evalCase.requiredTools) {
        t.calledTool(requiredTool).label(`called ${requiredTool}`);
      }

      for (const requiredToolFact of evalCase.requiredToolFacts) {
        t.calledTool(requiredToolFact.tool, {
          output: (output) =>
            isDeepStrictEqual(
              readPath(output, requiredToolFact.path),
              requiredToolFact.expected,
            ),
        }).label(`${requiredToolFact.tool}.${requiredToolFact.path}`);
      }

      for (const requiredFact of evalCase.requiredResponseFacts) {
        t.check(
          t.reply,
          satisfies(
            (reply) =>
              typeof reply === "string" &&
              requiredFact.patterns.every((pattern) =>
                new RegExp(pattern, "i").test(reply),
              ),
            `response explains ${requiredFact.description}`,
          ),
        ).label(requiredFact.description);
      }

      for (const prohibitedClaim of evalCase.prohibitedClaims) {
        t.check(
          t.reply,
          satisfies(
            (reply) =>
              typeof reply === "string" &&
              !new RegExp(prohibitedClaim.pattern, "i").test(reply),
            `response avoids ${prohibitedClaim.description}`,
          ),
        ).label(prohibitedClaim.description);
      }
    },
  }),
);

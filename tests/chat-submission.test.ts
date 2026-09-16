import assert from "node:assert/strict";
import test from "node:test";

import { prepareChatSubmission } from "../lib/chat-submission";

test("prepares a trimmed question and clears the input", () => {
  assert.deepEqual(
    prepareChatSubmission("  Where are my funds for pay_2007?  ", false),
    {
      clearedInput: "",
      question: "Where are my funds for pay_2007?",
    },
  );
});

test("does not submit an empty question", () => {
  assert.equal(prepareChatSubmission("   ", false), null);
});

test("does not prepare a duplicate submission while a turn is active", () => {
  assert.equal(
    prepareChatSubmission("Where are my funds for pay_2007?", true),
    null,
  );
});

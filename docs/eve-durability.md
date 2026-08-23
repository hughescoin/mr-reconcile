# Eve durability experiment

Checkpoint 10 verifies two different layers of continuity:

1. Eve keeps the server-side agent session and resumes interrupted work.
2. Mr. Reconcile keeps the browser-side event prefix and session cursor needed to reconnect that UI to the same Eve session.

These are related, but they are not the same thing. Eve can durably finish a workflow without a browser being connected. The browser still needs enough state to find that workflow again.

## Browser persistence

`lib/eve-chat-persistence.ts` stores:

- the streamed `MessageStreamEvent[]` prefix used to rebuild the conversation and deterministic investigation trace
- Eve's `{ sessionId, streamIndex }` cursor used to request only later events

On page load, `ReconciliationChat` restores that state. If the saved event prefix ends inside an unfinished turn, it attaches to the existing session, streams from the saved index, de-duplicates events by `meta.id`, and stops after reaching the current turn boundary. Only then does it mount `useEveAgent()` with the recovered state.

Browser storage is deliberately a proof-of-concept choice. It is not a shared history or audit store, and it does not provide merchant identity, authorization, retention policy, or cross-device access.

## Checkpoint and retry semantics

An Eve step contains one model call and the tool calls requested by that model response. Completed steps are checkpointed and are not re-run after an interruption. An interrupted step may be attempted again.

That distinction matters for tools with side effects. The three Mr. Reconcile tools are read-only, so retrying them is safe. A future refund, payout, notification, or case-creation tool would need an idempotency key or an explicit side-effect guard before it could be considered retry-safe.

The deterministic mapper remains the authority for financial UI state. Retry events are projected by tool `callId`, so a repeated event updates the existing investigation row instead of creating a second amount or status row. The model continues to explain the result; it does not define the badge, amount, or settlement state.

## Manual experiment results

The local experiment used Eve 0.44.0 and Node 24.

| Scenario | Result | Evidence |
| --- | --- | --- |
| Reload after a completed `pay_2007` turn | Pass | The question, answer, and three deterministic investigation rows were restored without starting a new investigation. |
| Restart Next.js and the Eve dev runtime after a completed turn | Pass | The same conversation continued, and a `pay_2002` follow-up used the existing session context. |
| Kill the runtime after tool results but before the `pay_2003` explanation | Pass | The UI first showed the durable tool-result prefix; after restart the turn resumed and produced the final explanation with one row per tool. |
| Kill the runtime during `pay_2010`, close the tab, restart, and open a new tab | Pass | Browser catch-up used the saved cursor and restored the completed pending-confirmations answer and authoritative rows. |

A quick stop/start can briefly leave Eve's generated `.eve/next-dev-server.json` registry pointing at the old ephemeral child-process port. Eve's health check replaces that record on a clean restart. This is local development lifecycle behavior; `.eve/` is generated and ignored by Git.

## Automated coverage

- `tests/eve-chat-persistence.test.ts` verifies valid persistence, corrupt-state rejection, and non-fatal storage failures.
- `tests/map-eve-investigation-steps.test.ts` verifies that repeated retry events do not duplicate authoritative UI rows.
- `evals/durability/session-continuity.eval.ts` verifies two turns retain the same Eve session.
- `evals/durability/cancel-and-resume.eval.ts` verifies a cancelled turn returns to waiting and the session accepts a follow-up.

The Eve-native durability evals require a live model and agent runtime. They are discoverable through `eve eval --list`; run them with `npm run test:eve:eval` in an environment with the configured AI Gateway credentials and local server permissions.

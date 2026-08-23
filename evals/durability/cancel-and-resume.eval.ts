import { defineEval } from "eve/evals";
import { equals } from "eve/evals/expect";

export default defineEval({
  description: "A cancelled turn returns to waiting and accepts a follow-up.",
  tags: ["durability", "cancellation"],
  async test(t) {
    const live = await t.start(
      "Investigate the payment, transaction, and settlement for pay_2004.",
    );

    await live.waitForEvent("turn.started");
    await live.cancel();

    const cancelled = await live.result();
    cancelled.eventOrder([
      { type: "turn.cancelled" },
      { type: "session.waiting" },
    ]);

    const resumed = await live.session.send(
      "Where are my funds for pay_2007?",
    );
    resumed.expectOk();

    await t.require(resumed.sessionId, equals(live.sessionId));
    resumed.calledTool("get-payment-details", {
      input: { paymentId: "pay_2007" },
    });
    t.succeeded();
  },
});

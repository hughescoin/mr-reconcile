import { defineEval } from "eve/evals";
import { equals, includes } from "eve/evals/expect";

export default defineEval({
  description: "A follow-up continues the same durable reconciliation session.",
  tags: ["durability", "reconciliation"],
  async test(t) {
    const first = await t.send("Where are my funds for pay_2007?");
    first.expectOk();

    const second = await t.send(
      "Now explain why pay_2002 settled for less than expected.",
    );
    second.expectOk();

    await t.require(second.sessionId, equals(first.sessionId));
    second.calledTool("get-payment-details", {
      input: { paymentId: "pay_2002" },
    });
    second.calledTool("get-settlement-details", {
      input: { paymentId: "pay_2002" },
      output: { netUsd: 498.5, settlementStatus: "COMPLETED" },
    });
    t.check(second.message, includes(/498\.50|498\.5/));
    t.succeeded();
    t.noFailedActions();
  },
});

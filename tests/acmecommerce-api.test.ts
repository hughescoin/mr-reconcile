import assert from "node:assert/strict";
import { test } from "node:test";

import {
  AcmeCommerceApiError,
  getPayment,
  getSettlement,
  getTransaction,
} from "../lib/acmecommerce-api-core";

const KNOWN_PAYMENT_ID = "pay_2007";
const KNOWN_TRANSACTION_HASH =
  "db5950566eb16cc1a4084be79c9873317aafe46980693f4f69ade9b0ce9ac2c1";

test("getTransaction returns the known transaction", async () => {
  const transaction = await getTransaction(KNOWN_TRANSACTION_HASH);

  assert.equal(transaction.transactionHash, KNOWN_TRANSACTION_HASH);
  assert.equal(transaction.paymentId, KNOWN_PAYMENT_ID);
  assert.equal(transaction.confirmationStatus, "CONFIRMED");
});

test("getSettlement returns the pending pay_2007 settlement", async () => {
  const settlement = await getSettlement(KNOWN_PAYMENT_ID);

  assert.equal(settlement.paymentId, KNOWN_PAYMENT_ID);
  assert.equal(settlement.settlementStatus, "PENDING");
  assert.equal(settlement.netUsd, null);
  assert.equal(settlement.settledAt, null);
});

test("getPayment throws AcmeCommerceApiError for an unknown payment", async () => {
  await assert.rejects(
    getPayment("pay_9999"),
    (error: unknown) => {
      assert.ok(error instanceof AcmeCommerceApiError);
      assert.equal(error.name, "AcmeCommerceApiError");
      assert.equal(error.status, 404);
      assert.match(error.message, /Payment not found/);
      return true;
    },
  );
});

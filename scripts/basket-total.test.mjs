// node --test scripts/basket-total.test.mjs   (Node 22.6+ strips TS types on import)
import { test } from "node:test";
import assert from "node:assert/strict";
import { basketTotal } from "../app/basket-data.ts";

test("base price only", () => {
  assert.equal(basketTotal([{ size: "M", qty: 1 }], "kraft", []), 69000);
});

test("wrap and extras apply per basket", () => {
  // 2×S(39000) + 1×L(119000) = 197000; per basket 5000 + 2000 + 3000 = 10000 × 3
  assert.equal(basketTotal([{ size: "S", qty: 2 }, { size: "L", qty: 1 }], "bojagi-indigo", ["ribbon", "card"]), 227000);
});

test("empty order is free", () => {
  assert.equal(basketTotal([], "bojagi-ivory", ["flower"]), 0);
});

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

test("admin-edited basket prices are used when passed", () => {
  const custom = [{ id: "B1", price: 50000 }];
  assert.equal(basketTotal([{ size: "B1", qty: 2 }], "kraft", [], custom), 100000);
});

test("weight and cost follow composition", async () => {
  const { basketWeight, basketCost } = await import("../app/basket-data.ts");
  const b = { items: [{ productId: 1, kg: 1.5 }, { productId: 2, kg: 0.5 }] };
  assert.equal(basketWeight(b), 2);
  assert.equal(basketCost(b, (id) => (id === 1 ? 10000 : 7900)), 18950);
});

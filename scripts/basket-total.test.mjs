// node --test scripts/basket-total.test.mjs   (Node 22.6+ strips TS types on import)
import { test } from "node:test";
import assert from "node:assert/strict";
import { basketTotal, basketCost, basketWeight } from "../app/basket-data.ts";

test("base price only", () => {
  assert.equal(basketTotal([{ size: "handlebox-m", qty: 1 }], "basic", []), 65000);
});

test("wrap and extras apply per basket", () => {
  // 2×칠링백(20000) + 1×미디움바구니(100000) = 140000; per basket 겹보자기 10000 + 노리개 10000 = 20000 × 3
  assert.equal(basketTotal([{ size: "chilling-bag", qty: 2 }, { size: "basket-m", qty: 1 }], "double", ["norigae"]), 200000);
});

test("crystal bojagi adds 5000 each", () => {
  assert.equal(basketTotal([{ size: "cutting-bag", qty: 2 }], "crystal", []), 2 * (37000 + 5000));
});

test("empty order is free", () => {
  assert.equal(basketTotal([], "double", ["norigae"]), 0);
});

test("admin-edited basket prices are used when passed", () => {
  assert.equal(basketTotal([{ size: "B1", qty: 2 }], "basic", [], [{ id: "B1", price: 50000 }]), 100000);
});

test("weight and cost follow composition", () => {
  const b = { items: [{ productId: 1, kg: 1.5 }, { productId: 2, kg: 0.5 }] };
  assert.equal(basketWeight(b), 2);
  assert.equal(basketCost(b, (id) => (id === 1 ? 10000 : 7900)), 18950);
});

test("product addon (컷팅백 생화) is charged per unit of that line only", () => {
  // 2×컷팅백(37000 + 생화 3000) + 1×칠링백(20000) = 100000, no wrap
  assert.equal(basketTotal([{ size: "cutting-bag", qty: 2, addons: ["flower"] }, { size: "chilling-bag", qty: 1, addons: ["flower"] }], "basic", []), 100000);
});

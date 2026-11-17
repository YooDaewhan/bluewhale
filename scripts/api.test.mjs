// End-to-end check of the API against a running dev server + a throwaway DB (it writes and deletes rows).
//   npm run dev   (with .env.local pointing at the dev DB)
//   node --env-file=.env.local --test scripts/api.test.mjs
// Needs DEV_ADMIN_ID / DEV_ADMIN_PW of an HQ admin (create with scripts/set-admin.mjs).
import { test } from "node:test";
import assert from "node:assert/strict";

const BASE = process.env.BASE_URL || "http://localhost:3000";
let cookie = "";
async function api(path, method = "GET", body, { tenant = "hq", auth = true } = {}) {
  const form = body instanceof FormData;
  const res = await fetch(BASE + path, {
    method,
    headers: { "x-tenant": tenant, ...(auth && cookie ? { cookie } : {}), ...(body && !form ? { "content-type": "application/json" } : {}) },
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });
  const set = res.headers.get("set-cookie");
  if (set) cookie = set.split(";")[0];
  return { status: res.status, data: await res.json().catch(() => ({})) };
}
const slug = "t" + Date.now().toString(36);
const fruit = { id: 0, emoji: "🥭", image: "", photos: [], name: "테스트망고", origin: "테스트", pricePerKg: 10000, description: "d", saleStart: "2026-01-01", saleEnd: "2099-12-31" };

test("visitors see the menu but no personal data, and cannot write", async () => {
  const { data } = await api("/api/state", "GET", undefined, { auth: false });
  assert.equal(data.tenant, "hq");
  assert.ok(data.baskets.length >= 16);
  assert.equal(data.user, null);
  assert.deepEqual([data.orders, data.members, data.franchises], [[], [], []]);
  assert.ok(data.reservations.every((r) => r.name === "" && r.phone === ""));
  assert.equal((await api("/api/products", "PUT", { list: [] }, { auth: false })).status, 401);
  assert.equal((await api("/api/franchises", "POST", {}, { auth: false })).status, 401);
});

test("login: wrong password is rejected, right one opens the admin data", async () => {
  assert.equal((await api("/api/login", "POST", { id: process.env.DEV_ADMIN_ID, pw: "wrong" })).status, 401);
  assert.equal((await api("/api/login", "POST", { id: process.env.DEV_ADMIN_ID, pw: process.env.DEV_ADMIN_PW })).status, 200);
  assert.equal((await api("/api/state")).data.user.role, "admin");
});

test("photo upload stores a file and serves it back; links are refused", async () => {
  const jpeg = new Blob([new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 1, 2, 3])], { type: "image/jpeg" });
  const form = new FormData();
  form.append("file", jpeg, "a.jpg");
  const up = await api("/api/upload", "POST", form);
  assert.match(up.data.path, /^\/uploads\/hq\/[a-f0-9]{16}\.jpg$/);
  const got = await fetch(BASE + up.data.path);
  assert.equal(got.headers.get("content-type"), "image/jpeg");
  assert.equal((await got.arrayBuffer()).byteLength, 7);
  assert.equal((await fetch(BASE + "/uploads/hq/..%2f..%2fpackage.json")).status, 404);

  const png = new FormData();
  png.append("file", new Blob([new Uint8Array([0x89, 0x50, 0x4e, 0x47])]), "a.png");
  assert.equal((await api("/api/upload", "POST", png)).status, 400);
  const cur = (await api("/api/state")).data.products;
  assert.equal((await api("/api/products", "PUT", { list: [...cur, { ...fruit, image: "https://example.com/a.jpg" }] })).status, 400);

  const saved = await api("/api/products", "PUT", { list: [...cur, { ...fruit, image: up.data.path, photos: [up.data.path, "/slides/1.jpg"] }] });
  assert.equal(saved.data.products.at(-1).image, up.data.path);
  assert.deepEqual(saved.data.products.at(-1).photos, [up.data.path, "/slides/1.jpg"]);
  assert.equal((await api("/api/products", "PUT", { list: [...cur, { ...fruit, photos: ["https://example.com/a.jpg"] }] })).status, 400);
});

test("main slides: admin replaces the list, visitors read it, empty list = defaults", async () => {
  const before = (await api("/api/state")).data.slides;
  const s = { image: "/slides/2.jpg", eyebrow: "E", title: "제목\n둘째 줄", text: "설명", pos: "50% 15%" };
  assert.equal((await api("/api/slides", "PUT", { list: [s] }, { auth: false })).status, 401);
  assert.equal((await api("/api/slides", "PUT", { list: [{ ...s, image: "" }] })).status, 400);
  assert.deepEqual((await api("/api/slides", "PUT", { list: [s, { ...s, pos: "bad" }] })).data.slides, [s, { ...s, pos: "50% 50%" }]);
  assert.deepEqual((await api("/api/state", "GET", undefined, { auth: false })).data.slides.length, 2);
  assert.equal((await api("/api/slides", "PUT", { list: before })).status, 200); // restore
});

test("reservation and order are priced by the server, then handled by the admin", async () => {
  const { products, baskets } = (await api("/api/state")).data;
  const cut = baskets.find((b) => b.id === "cutting-bag");
  const r = await api("/api/reservations", "POST", {
    pickupDate: "2099-01-02", pickupTime: "11:00", name: "테스트", phone: "010-0000-0000", memo: "", message: "축하합니다",
    items: [{ size: "cutting-bag", qty: 2, addons: [cut.addons[0].id] }], wrap: "crystal", extras: ["norigae"], total: 1,
  }, { auth: false });
  assert.equal(r.data.reservation.total, (37000 + 3000 + 5000 + 10000) * 2);
  assert.equal((await api("/api/reservations", "POST", { pickupDate: "2099-01-02", pickupTime: "11:00", name: "a", phone: "1", items: [{ size: "nope", qty: 1 }], wrap: "basic", extras: [] }, { auth: false })).status, 400);
  assert.equal((await api("/api/reservations", "PATCH", { id: r.data.reservation.id, status: "취소" }, { auth: false })).status, 401);
  assert.equal((await api("/api/reservations", "PATCH", { id: r.data.reservation.id, status: "취소" })).status, 200);

  const p = products.at(-1);
  const o = await api("/api/orders", "POST", { name: "테스트", phone: "010-0000-0000", address: "(00000) 테스트", message: "-", lines: [{ productId: p.id, kg: 2 }], total: 1 }, { auth: false });
  assert.equal(o.data.order.total, 20000 + 3500);
  assert.equal((await api("/api/orders", "PATCH", { id: o.data.order.id, carrier: "한진택배", tracking: "123" })).status, 200);
  const mine = (await api("/api/state")).data.orders.find((x) => x.id === o.data.order.id);
  assert.deepEqual([mine.status, mine.carrier, mine.tracking], ["발송완료", "한진택배", "123"]);
  assert.equal((await api("/api/state")).data.reservations.find((x) => x.id === r.data.reservation.id).status, "취소");
});

test("a new franchise gets a copy of the HQ menu, its own admin, and nothing else", async () => {
  const made = await api("/api/franchises", "POST", { id: slug, name: "테스트점", adminId: slug + "-admin", adminPw: "testpass1234" });
  assert.equal(made.status, 200);
  const hq = (await api("/api/state")).data;
  const hqCookie = cookie;

  // the HQ session is not valid on the franchise
  const asVisitor = (await api("/api/state", "GET", undefined, { tenant: slug })).data;
  assert.equal(asVisitor.user, null);
  assert.equal(asVisitor.baskets.length, hq.baskets.length);
  assert.equal(asVisitor.products.length, hq.products.length);
  assert.equal(asVisitor.reservations.length, 0);
  assert.equal((await api("/api/products", "PUT", { list: [] }, { tenant: slug })).status, 401);

  // its own admin can edit its menu without touching HQ, and cannot manage franchises
  assert.equal((await api("/api/login", "POST", { id: slug + "-admin", pw: "testpass1234" }, { tenant: slug })).status, 200);
  assert.equal((await api("/api/products", "PUT", { list: [] }, { tenant: slug })).data.products.length, 0);
  assert.equal((await api("/api/franchises", "DELETE", { id: slug }, { tenant: slug })).status, 403);
  cookie = hqCookie;
  assert.equal((await api("/api/state")).data.products.length, hq.products.length);

  // cleanup: franchise (cascades) and the test fruit
  assert.equal((await api("/api/franchises", "DELETE", { id: slug })).status, 200);
  const left = (await api("/api/state")).data.products.filter((p) => p.name !== fruit.name);
  assert.equal((await api("/api/products", "PUT", { list: left })).status, 200);
  assert.equal((await api("/api/state", "GET", undefined, { tenant: slug })).status, 404);
});

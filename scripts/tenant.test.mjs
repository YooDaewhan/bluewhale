// node --test scripts/tenant.test.mjs
import { test } from "node:test";
import assert from "node:assert/strict";
import { tenantFrom } from "../app/tenant.ts";

test("subdomain is the tenant", () => {
  assert.equal(tenantFrom("seoul.a.com"), "seoul");
  assert.equal(tenantFrom("seoul.localhost"), "seoul");
});

test("www, apex, localhost and IPs are HQ", () => {
  for (const h of ["www.a.com", "a.com", "localhost", "192.168.0.5"]) assert.equal(tenantFrom(h), "hq");
});

test("?tenant= works only where there is no subdomain; bad/reserved names fall back to HQ", () => {
  assert.equal(tenantFrom("localhost", "busan"), "busan");
  assert.equal(tenantFrom("seoul.a.com", "busan"), "seoul");
  assert.equal(tenantFrom("localhost", "Bad Name!"), "hq");
  assert.equal(tenantFrom("localhost", "admin"), "hq");
});

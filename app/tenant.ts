// Multi-tenant (franchise) helpers. www.a.com = HQ, seoul.a.com = franchise "seoul".
// The server resolves the tenant from the Host header with the same tenantFrom() (app/server.ts) and scopes every
// query by franchise_id; the browser only uses it for the cart key and the ?tenant= test switch.

export const HQ = "hq";
export const TENANT_RE = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;
export const RESERVED = ["www", "hq", "admin", "api", "app"];

// localStorage key of a tenant's cart (HQ uses it as-is, franchises get a "<id>:" prefix)
export const tkey = (tenant: string, key: string) => (tenant === HQ ? key : `${tenant}:${key}`);

// hostname "seoul.a.com" / "seoul.localhost" → "seoul"; "www.a.com", "a.com", "localhost", IPs → HQ.
// `query` (?tenant=seoul) lets you test on plain localhost / an IP; callers remember it for the tab session.
export function tenantFrom(hostname: string, query?: string | null): string {
  const labels = hostname.toLowerCase().split(".");
  const isIp = /^\d+(\.\d+){3}$/.test(hostname);
  const sub = !isIp && labels.length >= (labels.at(-1) === "localhost" ? 2 : 3) ? labels[0] : "";
  const pick = sub && sub !== "www" ? sub : query ?? "";
  return TENANT_RE.test(pick) && !RESERVED.includes(pick) ? pick : HQ;
}

export function resolveTenant(): string {
  const q = new URLSearchParams(location.search).get("tenant");
  try {
    if (q !== null) sessionStorage.setItem("bw-tenant", q);
    return tenantFrom(location.hostname, q ?? sessionStorage.getItem("bw-tenant"));
  } catch {
    return tenantFrom(location.hostname, q);
  }
}


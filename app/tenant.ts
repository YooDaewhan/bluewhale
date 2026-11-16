// Multi-tenant (franchise) helpers. www.a.com = HQ, seoul.a.com = franchise "seoul".
// ponytail: tenants are separated by a localStorage key prefix (mock). With a real backend, resolve the tenant
// from the Host header on the server and use one DB per tenant instead; the rest of the app only sees `tenant`.

export const HQ = "hq";
export const TENANT_RE = /^[a-z0-9](?:[a-z0-9-]{0,28}[a-z0-9])?$/;
export const RESERVED = ["www", "hq", "admin", "api", "app"];

// storage keys of one tenant's database (HQ uses them as-is, franchises get a "<id>:" prefix)
export const K = {
  products: "bw-products-v2",
  baskets: "bw-baskets-v3",
  reservations: "bw-reservations-v2",
  orders: "bw-orders",
  cart: "bw-cart",
  user: "bw-user",
  settings: "bw-settings",
} as const;
export const FRANCHISES_KEY = "bw-franchises"; // HQ only: registry of franchises

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

export const readJson = <T,>(key: string, fallback: T): T => {
  try {
    const s = localStorage.getItem(key);
    return s ? (JSON.parse(s) as T) : fallback;
  } catch {
    return fallback;
  }
};

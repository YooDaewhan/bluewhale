"use client";

import { createContext, useCallback, useContext, useEffect, useState, type ReactNode } from "react";
import type { BasketSize, Reservation, ReservationStatus } from "./basket-data";
import type { Member } from "./member-data";
import type { Order, OrderStatus } from "./order-data";
import { HQ, resolveTenant, tkey } from "./tenant";

export type Settings = { fruitsEnabled: boolean }; // per tenant: show the individual-fruit section on the storefront

export type Product = {
  id: number;
  emoji: string;
  image: string; // uploaded photo path (/uploads/...), emoji is the fallback
  photos: string[]; // extra photos for the detail-page gallery (after `image`)
  name: string;
  origin: string;
  pricePerKg: number;
  description: string;
  saleStart: string; // YYYY-MM-DD
  saleEnd: string;
};
export type Slide = { image: string; eyebrow: string; title: string; text: string; pos: string }; // main hero slide
export type Role = "admin" | "customer";
export type User = { id: string; name: string; role: Role };
export type CartItem = { productId: number; kg: number };
export type FranchiseRow = { id: string; name: string; fruitsEnabled: boolean; createdAt: string };
export type NewFranchise = { id: string; name: string; adminId: string; adminPw: string };

export type SaleStatus = "upcoming" | "onsale" | "ended";
export const STATUS_EN: Record<SaleStatus, string> = { onsale: "Available", upcoming: "Coming Soon", ended: "Sold Out" };
export function saleStatus(p: Product, today: string): SaleStatus {
  if (today < p.saleStart) return "upcoming";
  if (today > p.saleEnd) return "ended";
  return "onsale";
}

export const won = (n: number) => n.toLocaleString("ko-KR") + "원";

// browser-only state (the cart). Everything else lives in MySQL behind /api.
export function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value, ready]);
  return [value, setValue, ready] as const;
}

export type Pay = { orderId: string; orderName: string; amount: number }; // what the Toss widget needs

// JSON call to our API. x-tenant carries the ?tenant= test switch (ignored by the server on real subdomains).
async function call<T = unknown>(tenant: string, path: string, method = "GET", body?: unknown): Promise<T> {
  const form = body instanceof FormData;
  const res = await fetch(path, {
    method,
    headers: { "x-tenant": tenant, ...(body && !form ? { "content-type": "application/json" } : {}) },
    body: form ? body : body ? JSON.stringify(body) : undefined,
  });
  const data = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(data.error ?? "요청에 실패했습니다.");
  return data as T;
}

type ServerState = {
  tenant: string;
  settings: Settings;
  products: Product[];
  baskets: BasketSize[];
  slides: Slide[]; // empty = show the built-in DEFAULT_SLIDES
  reservations: Reservation[]; // customers get date/time/qty only (slot load); admins get everything
  user: User | null;
  orders: Order[]; // admin only
  members: Member[]; // admin only
  franchises: FranchiseRow[]; // HQ admin only
};
const EMPTY: ServerState = { tenant: HQ, settings: { fruitsEnabled: false }, products: [], baskets: [], slides: [], reservations: [], user: null, orders: [], members: [], franchises: [] };

type Store = ServerState & {
  setSettings: (fn: (s: Settings) => Settings) => void;
  ready: boolean;
  today: string;
  setProducts: (fn: (p: Product[]) => Product[]) => void;
  setBaskets: (fn: (b: BasketSize[]) => BasketSize[]) => void;
  setSlides: (list: Slide[]) => Promise<void>;
  login: (id: string, pw: string) => Promise<User>; // admin login; rejects with the server message
  logout: () => void;
  cart: CartItem[];
  addToCart: (productId: number, kg: number) => void;
  setKg: (productId: number, kg: number) => void;
  clearCart: () => void;
  addReservation: (r: Omit<Reservation, "id" | "status" | "total">) => Promise<Reservation>;
  setReservationStatus: (id: string, status: ReservationStatus) => void;
  addOrder: (o: Pick<Order, "name" | "phone" | "address" | "message"> & { lines: CartItem[] }) => Promise<Pay>; // saved unpaid
  confirmPayment: (p: { paymentKey: string; orderId: string; amount: number }) => Promise<Order>; // Toss successUrl params
  shipOrder: (id: string, carrier: string, tracking: string) => void;
  setOrderStatus: (id: string, status: OrderStatus) => void;
  uploadImage: (file: File) => Promise<string>; // → "/uploads/<tenant>/<file>.jpg"
  addFranchise: (f: NewFranchise) => Promise<void>;
  removeFranchise: (id: string) => void;
  setFranchiseFruits: (id: string, on: boolean) => void;
};

const Ctx = createContext<Store | null>(null);

// downscale to a JPEG (max 1200px) in the browser so uploads stay small whatever the phone camera produced
function toJpeg(file: File): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const k = Math.min(1, 1200 / Math.max(img.width, img.height));
      const c = document.createElement("canvas");
      c.width = Math.round(img.width * k);
      c.height = Math.round(img.height * k);
      c.getContext("2d")!.drawImage(img, 0, 0, c.width, c.height);
      URL.revokeObjectURL(img.src);
      c.toBlob((b) => (b ? resolve(b) : reject(new Error("이미지 파일을 읽을 수 없습니다."))), "image/jpeg", 0.85);
    };
    img.onerror = () => reject(new Error("이미지 파일을 읽을 수 없습니다."));
    img.src = URL.createObjectURL(file);
  });
}

// The tenant comes from the hostname, known only in the browser, so nothing is fetched until it is resolved.
export function StoreProvider({ children }: { children: ReactNode }) {
  const [tenant, setTenant] = useState<string | null>(null);
  useEffect(() => setTenant(resolveTenant()), []);
  return <TenantStore key={tenant ?? ""} tenant={tenant}>{children}</TenantStore>;
}

function TenantStore({ tenant, children }: { tenant: string | null; children: ReactNode }) {
  const t = tenant ?? HQ;
  const [s, setS] = useState<ServerState>(EMPTY);
  const [loaded, setLoaded] = useState(false);
  const [cart, setCart, cartReady] = usePersisted<CartItem[]>(tkey(t, "bw-cart"), []);
  // read the clock after mount, not during prerender; sv-SE gives local YYYY-MM-DD (UTC would be a day off in KST mornings)
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toLocaleDateString("sv-SE")), []);

  const patch = (p: Partial<ServerState>) => setS((x) => ({ ...x, ...p }));
  const reload = useCallback(
    () =>
      call<ServerState>(t, "/api/state")
        .then(setS)
        .catch((e) => console.error(e))
        .finally(() => setLoaded(true)),
    [t],
  );
  useEffect(() => {
    if (tenant !== null) reload();
  }, [tenant, reload]);
  // a failed save: tell the admin and fall back to what the server really has
  const fail = (e: Error) => {
    alert(e.message);
    reload();
  };

  const store: Store = {
    ...s,
    tenant: t,
    ready: loaded && cartReady && today !== "",
    today,
    // the admin screens edit whole lists: show the edit at once, then replace it with the saved copy from the server (real ids)
    setProducts(fn) {
      const list = fn(s.products);
      patch({ products: list });
      call<Pick<ServerState, "products">>(t, "/api/products", "PUT", { list }).then(patch).catch(fail);
    },
    setBaskets(fn) {
      const list = fn(s.baskets);
      patch({ baskets: list });
      call<Pick<ServerState, "baskets">>(t, "/api/baskets", "PUT", { list }).then(patch).catch(fail);
    },
    async setSlides(list) {
      patch(await call<Pick<ServerState, "slides">>(t, "/api/slides", "PUT", { list }));
    },
    setSettings(fn) {
      const settings = fn(s.settings);
      patch({ settings });
      call(t, "/api/franchises", "PATCH", { id: t, fruitsEnabled: settings.fruitsEnabled }).catch(fail);
    },
    async login(id, pw) {
      const { user } = await call<{ user: User }>(t, "/api/login", "POST", { id, pw });
      await reload(); // admin-only data (orders, members, franchises)
      return user;
    },
    logout: () => void call(t, "/api/login", "DELETE").catch(() => {}).then(reload),
    cart,
    addToCart: (productId, kg) =>
      setCart((c) =>
        c.some((i) => i.productId === productId)
          ? c.map((i) => (i.productId === productId ? { ...i, kg: i.kg + kg } : i))
          : [...c, { productId, kg }],
      ),
    setKg: (productId, kg) =>
      setCart((c) => (kg <= 0 ? c.filter((i) => i.productId !== productId) : c.map((i) => (i.productId === productId ? { ...i, kg } : i)))),
    clearCart: () => setCart([]),
    async addReservation(data) {
      const { reservation } = await call<{ reservation: Reservation }>(t, "/api/reservations", "POST", data);
      setS((x) => ({ ...x, reservations: [...x.reservations, reservation] }));
      return reservation;
    },
    setReservationStatus(id, status) {
      patch({ reservations: s.reservations.map((x) => (x.id === id ? { ...x, status } : x)) });
      call(t, "/api/reservations", "PATCH", { id, status }).catch(fail);
    },
    async addOrder(data) {
      return (await call<{ pay: Pay }>(t, "/api/orders", "POST", data)).pay;
    },
    async confirmPayment(p) {
      return (await call<{ order: Order }>(t, "/api/orders", "PUT", p)).order;
    },
    shipOrder(id, carrier, tracking) {
      patch({ orders: s.orders.map((o) => (o.id === id ? { ...o, carrier, tracking, shippedAt: today, status: "발송완료" } : o)) });
      call(t, "/api/orders", "PATCH", { id, carrier, tracking }).catch(fail);
    },
    setOrderStatus(id, status) {
      patch({ orders: s.orders.map((o) => (o.id === id ? { ...o, status } : o)) });
      call(t, "/api/orders", "PATCH", { id, status }).catch(fail);
    },
    async uploadImage(file) {
      const form = new FormData();
      form.append("file", await toJpeg(file), "photo.jpg");
      return (await call<{ path: string }>(t, "/api/upload", "POST", form)).path;
    },
    async addFranchise(f) {
      patch(await call<Pick<ServerState, "franchises">>(t, "/api/franchises", "POST", f));
    },
    removeFranchise: (id) => void call<Pick<ServerState, "franchises">>(t, "/api/franchises", "DELETE", { id }).then(patch).catch(fail),
    setFranchiseFruits(id, on) {
      patch({ franchises: s.franchises.map((f) => (f.id === id ? { ...f, fruitsEnabled: on } : f)) });
      call(t, "/api/franchises", "PATCH", { id, fruitsEnabled: on }).catch(fail);
    },
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

// Photo with emoji fallback (empty or broken URL, e.g. admin typo)
export function FruitImage({ p, className = "" }: { p: Pick<Product, "image" | "emoji" | "name">; className?: string }) {
  const [broken, setBroken] = useState(false);
  if (!p.image || broken)
    return <div className={`grid place-items-center bg-gradient-to-br from-gold-300/40 to-ink-600/10 ${className}`}>{p.emoji}</div>;
  // eslint-disable-next-line @next/next/no-img-element
  return <img src={p.image} alt={p.name} loading="lazy" onError={() => setBroken(true)} className={`object-cover ${className}`} />;
}

// "애플망고 1.5kg · 골드 파인애플 1kg" (+ note)
export function compositionText(b: Pick<BasketSize, "items" | "note">, products: Product[]) {
  const fruits = b.items.map((i) => `${products.find((p) => p.id === i.productId)?.name ?? "삭제된 과일"} ${i.kg}kg`).join(" · ");
  return [fruits, b.note].filter(Boolean).join(" + "); // "" when neither is set
}
export const basketName = (baskets: BasketSize[], id: string) => baskets.find((b) => b.id === id)?.ko ?? "삭제된 바구니";
// "과일컷팅백 × 2 (생화 추가)"
export function lineText(baskets: BasketSize[], l: { size: string; qty: number; addons?: string[] }) {
  const b = baskets.find((x) => x.id === l.size);
  const extra = (l.addons ?? []).map((id) => b?.addons?.find((a) => a.id === id)?.name).filter(Boolean);
  return `${b?.ko ?? "삭제된 바구니"} × ${l.qty}${extra.length ? ` (${extra.join(", ")})` : ""}`;
}

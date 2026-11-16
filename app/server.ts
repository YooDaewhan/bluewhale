// Server-only helpers for the API routes: MySQL pool, tenant from Host, admin session, row → client-shape loaders.
// Never import this from a "use client" file.
import mysql, { type PoolConnection, type ResultSetHeader, type RowDataPacket } from "mysql2/promise";
import { createHmac, randomBytes, scryptSync, timingSafeEqual } from "node:crypto";
import path from "node:path";
import { cookies, headers } from "next/headers";
import type { BasketSize, Reservation } from "./basket-data";
import type { Member } from "./member-data";
import type { Order } from "./order-data";
import type { Product, User } from "./store";
import { HQ, tenantFrom } from "./tenant";

const env = (name: string) => {
  const v = process.env[name];
  if (!v) throw new Error(`환경변수 ${name} 가 없습니다 (.env.local 또는 서버 EnvironmentFile)`);
  return v;
};

// one pool per process (dev HMR re-evaluates this module, so park it on globalThis)
const g = globalThis as { bwPool?: mysql.Pool };
const pool = () => (g.bwPool ??= mysql.createPool({ uri: env("DATABASE_URL"), dateStrings: true, connectionLimit: 10, charset: "utf8mb4" }));

type Row = RowDataPacket;
export async function q<T = Row>(sql: string, params: unknown[] = [], conn?: PoolConnection): Promise<T[]> {
  const [rows] = await (conn ?? pool()).query(sql, params);
  return rows as T[];
}
export async function exec(sql: string, params: unknown[] = [], conn?: PoolConnection): Promise<ResultSetHeader> {
  const [r] = await (conn ?? pool()).query(sql, params);
  return r as ResultSetHeader;
}
export async function tx<T>(fn: (c: PoolConnection) => Promise<T>): Promise<T> {
  const c = await pool().getConnection();
  try {
    await c.beginTransaction();
    const r = await fn(c);
    await c.commit();
    return r;
  } catch (e) {
    await c.rollback();
    throw e;
  } finally {
    c.release();
  }
}

export class HttpError extends Error {
  constructor(public status: number, message: string) {
    super(message);
  }
}
export const bad = (msg: string, status = 400) => new HttpError(status, msg);

// wraps a route handler: returns JSON, turns HttpError into {error} with its status
export const api = (fn: (req: Request) => Promise<unknown>) => async (req: Request) => {
  try {
    const r = await fn(req);
    return r instanceof Response ? r : Response.json(r ?? { ok: true });
  } catch (e) {
    if (e instanceof HttpError) return Response.json({ error: e.message }, { status: e.status });
    console.error(e);
    return Response.json({ error: "서버 오류가 발생했습니다." }, { status: 500 });
  }
};

// ── tenant ──
export type Franchise = { id: number; slug: string; name: string; fruitsEnabled: boolean };
// Host decides the tenant (seoul.<domain>). `x-tenant` is the ?tenant= test switch and only counts where the host has
// no subdomain (see tenantFrom) — harmless because admin rights are tied to the session's franchise, not to this header.
export async function getTenant(): Promise<Franchise> {
  const h = await headers();
  const slug = tenantFrom((h.get("host") ?? "").replace(/:\d+$/, ""), h.get("x-tenant"));
  const [f] = await q("SELECT id, slug, name, fruits_enabled FROM franchises WHERE slug = ? AND active", [slug]);
  if (!f) throw bad("등록되지 않은 가맹점입니다.", 404);
  return { id: f.id, slug: f.slug, name: f.name, fruitsEnabled: !!f.fruits_enabled };
}

// ── admin session: signed cookie "<payload>.<hmac>" ──
const COOKIE = "bw_admin";
const WEEK = 7 * 24 * 3600;
const mac = (s: string) => createHmac("sha256", env("SESSION_SECRET")).update(s).digest("base64url");

export async function setSession(adminId: number, franchiseId: number) {
  const body = Buffer.from(JSON.stringify({ a: adminId, f: franchiseId, exp: Math.floor(Date.now() / 1000) + WEEK })).toString("base64url");
  (await cookies()).set(COOKIE, `${body}.${mac(body)}`, { httpOnly: true, sameSite: "lax", secure: process.env.NODE_ENV === "production", path: "/", maxAge: WEEK });
}
export async function clearSession() {
  (await cookies()).delete(COOKIE);
}
// the logged-in admin, only if the account belongs to this tenant
export async function getAdmin(t: Franchise): Promise<User | null> {
  const [body, sig] = ((await cookies()).get(COOKIE)?.value ?? "").split(".");
  if (!body || !sig) return null;
  const want = mac(body);
  if (sig.length !== want.length || !timingSafeEqual(Buffer.from(sig), Buffer.from(want))) return null;
  const s = JSON.parse(Buffer.from(body, "base64url").toString()) as { a: number; f: number; exp: number };
  if (s.exp < Date.now() / 1000 || s.f !== t.id) return null;
  const [a] = await q("SELECT login_id, name FROM admins WHERE id = ? AND franchise_id = ?", [s.a, t.id]);
  return a ? { id: a.login_id, name: a.name, role: "admin" } : null;
}
export async function requireAdmin(t: Franchise, hqOnly = false): Promise<User> {
  const a = await getAdmin(t);
  if (!a) throw bad("관리자 로그인이 필요합니다.", 401);
  if (hqOnly && t.slug !== HQ) throw bad("본사 관리자만 할 수 있습니다.", 403);
  return a;
}

// "scrypt$<salt hex>$<hash hex>" — same format as scripts/set-admin.mjs
export function hashPassword(pw: string) {
  const salt = randomBytes(16).toString("hex");
  return `scrypt$${salt}$${scryptSync(pw, salt, 64).toString("hex")}`;
}
export function verifyPassword(pw: string, stored: string) {
  const [, salt, hash] = stored.split("$");
  if (!salt || !hash) return false;
  const got = scryptSync(pw, salt, 64);
  const want = Buffer.from(hash, "hex");
  return got.length === want.length && timingSafeEqual(got, want);
}

// ── loaders (DB rows → the shapes the client store already uses) ──
export async function loadProducts(fid: number, conn?: PoolConnection): Promise<Product[]> {
  const rows = await q("SELECT * FROM products WHERE franchise_id = ? ORDER BY id", [fid], conn);
  return rows.map((r) => ({ id: r.id, emoji: r.emoji, image: r.image_path, name: r.name, origin: r.origin, pricePerKg: r.price_per_kg, description: r.description, saleStart: r.sale_start, saleEnd: r.sale_end }));
}

export async function loadBaskets(fid: number, conn?: PoolConnection): Promise<BasketSize[]> {
  const rows = await q("SELECT * FROM baskets WHERE franchise_id = ? ORDER BY sort_order, id", [fid], conn);
  const items = await q("SELECT i.* FROM basket_items i JOIN baskets b ON b.id = i.basket_id WHERE b.franchise_id = ?", [fid], conn);
  const addons = await q("SELECT a.* FROM basket_addons a JOIN baskets b ON b.id = a.basket_id WHERE b.franchise_id = ? ORDER BY a.id", [fid], conn);
  return rows.map((r) => ({
    id: r.slug, ko: r.name_ko, en: r.name_en, category: r.category, price: r.price, fruitCount: r.fruit_count, serves: r.serves, note: r.note, desc: r.description, image: r.image_path, active: !!r.active,
    items: items.filter((i) => i.basket_id === r.id).map((i) => ({ productId: i.product_id, kg: Number(i.kg) })),
    addons: addons.filter((a) => a.basket_id === r.id).map((a) => ({ id: String(a.id), name: a.name, price: a.price })),
  }));
}

export const resId = (id: number) => `R-${id}`;
export const orderId = (id: number) => `BW${String(id).padStart(8, "0")}`;
export const numId = (id: unknown) => Number(String(id).replace(/\D/g, "")) || 0;

// customers only need slot load (date, time, qty), so everything personal is blanked unless `full` (admin)
export async function loadReservations(fid: number, full: boolean, onlyId?: number): Promise<Reservation[]> {
  const rows = await q(`SELECT * FROM reservations WHERE franchise_id = ? ${onlyId ? "AND id = ?" : ""} ORDER BY id`, onlyId ? [fid, onlyId] : [fid]);
  const items = await q("SELECT i.* FROM reservation_items i JOIN reservations r ON r.id = i.reservation_id WHERE r.franchise_id = ? ORDER BY i.id", [fid]);
  return rows.map((r) => ({
    id: full ? resId(r.id) : "",
    userId: full && r.member_id ? String(r.member_id) : undefined,
    pickupDate: r.pickup_date,
    pickupTime: String(r.pickup_time).slice(0, 5),
    name: full ? r.name : "",
    phone: full ? r.phone : "",
    items: items.filter((i) => i.reservation_id === r.id).map((i) => ({ size: i.basket_slug, qty: i.qty, addons: (i.addons as { id: string }[]).map((a) => a.id) })),
    wrap: r.wrap,
    extras: full ? r.extras : [],
    message: full ? r.message : "",
    memo: full ? r.memo : "",
    total: full ? r.total : 0,
    status: r.status,
  }));
}

export async function loadOrders(fid: number, onlyId?: number): Promise<Order[]> {
  const rows = await q(`SELECT * FROM orders WHERE franchise_id = ? ${onlyId ? "AND id = ?" : ""} ORDER BY id`, onlyId ? [fid, onlyId] : [fid]);
  const items = await q("SELECT i.* FROM order_items i JOIN orders o ON o.id = i.order_id WHERE o.franchise_id = ? ORDER BY i.id", [fid]);
  return rows.map((r) => ({
    id: orderId(r.id),
    userId: r.member_id ? String(r.member_id) : "guest",
    orderedAt: String(r.ordered_at).slice(0, 10),
    lines: items.filter((i) => i.order_id === r.id).map((i) => ({ productId: i.product_id ?? 0, emoji: i.emoji, name: i.name, kg: Number(i.kg), pricePerKg: i.price_per_kg })),
    name: r.name, phone: r.phone, address: r.address, message: r.message, total: r.total, status: r.status,
    carrier: r.carrier ?? undefined, tracking: r.tracking ?? undefined, shippedAt: r.shipped_at ? String(r.shipped_at).slice(0, 10) : undefined,
  }));
}

// HQ sees every member; a franchise sees only members who ordered/reserved there
export async function loadMembers(t: Franchise): Promise<Member[]> {
  const where = t.slug === HQ ? "" : "WHERE id IN (SELECT member_id FROM orders WHERE franchise_id = ? UNION SELECT member_id FROM reservations WHERE franchise_id = ?)";
  const rows = await q(`SELECT * FROM members ${where} ORDER BY id`, t.slug === HQ ? [] : [t.id, t.id]);
  return rows.map((r) => ({ id: String(r.id), kakaoId: r.kakao_id ?? "", nickname: r.nickname, joinedAt: String(r.joined_at).slice(0, 10), lastLoginAt: String(r.last_login_at ?? r.joined_at).slice(0, 10), marketing: !!r.marketing }));
}

export type FranchiseRow = { id: string; name: string; fruitsEnabled: boolean; createdAt: string };
export async function loadFranchises(): Promise<FranchiseRow[]> {
  const rows = await q("SELECT * FROM franchises WHERE slug <> ? ORDER BY id", [HQ]);
  return rows.map((r) => ({ id: r.slug, name: r.name, fruitsEnabled: !!r.fruits_enabled, createdAt: String(r.created_at).slice(0, 10) }));
}

// where uploaded photos live; outside the app dir in production so a redeploy does not wipe them
export const uploadDir = () => process.env.UPLOAD_DIR || path.join(process.cwd(), "uploads");

export const str = (v: unknown, max: number) => String(v ?? "").trim().slice(0, max);
// uploaded files (/uploads/...) or bundled ones (/baskets/...). No external links, no data: URLs.
export const imagePath = (v: unknown) => {
  const s = String(v ?? "");
  if (s && !/^\/[\w\-./]{1,250}$/.test(s)) throw bad("사진은 직접 업로드한 파일만 쓸 수 있습니다.");
  return s;
};

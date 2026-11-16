import { api, bad, exec, getTenant, hashPassword, loadFranchises, q, requireAdmin, str, tx } from "../../server";
import { HQ, RESERVED, TENANT_RE } from "../../tenant";

// HQ only. New franchise = one franchises row + its admin account + a copy of the HQ menu (orders/reservations start empty).
export const POST = api(async (req) => {
  const hq = await getTenant();
  await requireAdmin(hq, true);
  const d = await req.json();
  const slug = str(d.id, 30).toLowerCase();
  const name = str(d.name, 100);
  const adminId = str(d.adminId, 50);
  const adminPw = String(d.adminPw ?? "");
  if (!TENANT_RE.test(slug) || RESERVED.includes(slug)) throw bad("서브도메인은 영문 소문자·숫자·하이픈(최대 30자)만 쓸 수 있습니다.");
  if (!name || !adminId || adminPw.length < 8) throw bad("가맹점 이름, 관리자 아이디, 8자 이상 비밀번호를 입력해주세요.");
  if ((await q("SELECT 1 FROM franchises WHERE slug = ?", [slug])).length) throw bad("이미 사용 중인 서브도메인입니다.");
  if ((await q("SELECT 1 FROM admins WHERE login_id = ?", [adminId])).length) throw bad("이미 사용 중인 관리자 아이디입니다.");

  await tx(async (c) => {
    const f = (await exec("INSERT INTO franchises (slug, name) VALUES (?, ?)", [slug, name], c)).insertId;
    await exec("INSERT INTO admins (franchise_id, login_id, password_hash, name) VALUES (?,?,?,?)", [f, adminId, hashPassword(adminPw), `${name} 관리자`], c);
    const pid = new Map<number, number>(); // HQ product id → copy id
    for (const p of await q("SELECT * FROM products WHERE franchise_id = ? ORDER BY id", [hq.id], c)) {
      const r = await exec(
        "INSERT INTO products (franchise_id, name, emoji, image_path, origin, price_per_kg, description, sale_start, sale_end) VALUES (?,?,?,?,?,?,?,?,?)",
        [f, p.name, p.emoji, p.image_path, p.origin, p.price_per_kg, p.description, p.sale_start, p.sale_end],
        c,
      );
      pid.set(p.id, r.insertId);
    }
    for (const b of await q("SELECT * FROM baskets WHERE franchise_id = ? ORDER BY id", [hq.id], c)) {
      const nb = (
        await exec(
          "INSERT INTO baskets (franchise_id, slug, name_ko, name_en, category, price, fruit_count, serves, note, description, image_path, active, sort_order) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)",
          [f, b.slug, b.name_ko, b.name_en, b.category, b.price, b.fruit_count, b.serves, b.note, b.description, b.image_path, b.active, b.sort_order],
          c,
        )
      ).insertId;
      for (const i of await q("SELECT * FROM basket_items WHERE basket_id = ?", [b.id], c))
        await exec("INSERT INTO basket_items (basket_id, product_id, kg) VALUES (?,?,?)", [nb, pid.get(i.product_id), i.kg], c);
      await exec("INSERT INTO basket_addons (basket_id, name, price) SELECT ?, name, price FROM basket_addons WHERE basket_id = ? ORDER BY id", [nb, b.id], c);
    }
  });
  return { franchises: await loadFranchises() };
});

// { id, fruitsEnabled } — id may be "hq"
export const PATCH = api(async (req) => {
  await requireAdmin(await getTenant(), true);
  const { id, fruitsEnabled } = await req.json();
  await exec("UPDATE franchises SET fruits_enabled = ? WHERE slug = ?", [!!fruitsEnabled, String(id)]);
});

// removes the franchise with its menu, orders, reservations and admin accounts (FK cascade)
export const DELETE = api(async (req) => {
  await requireAdmin(await getTenant(), true);
  const { id } = await req.json();
  if (id === HQ) throw bad("본사는 삭제할 수 없습니다.");
  await exec("DELETE FROM franchises WHERE slug = ?", [String(id)]);
  return { franchises: await loadFranchises() };
});

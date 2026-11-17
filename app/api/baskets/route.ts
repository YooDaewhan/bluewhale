import type { BasketSize } from "../../basket-data";
import { api, bad, exec, getTenant, imagePath, loadBaskets, q, requireAdmin, savePhotos, str, tx } from "../../server";

// ponytail: whole-list sync like /api/products. Baskets are matched by slug, add-ons by id (so ids on past reservations stay valid).
export const PUT = api(async (req) => {
  const t = await getTenant();
  await requireAdmin(t);
  const list = ((await req.json()).list ?? []) as BasketSize[];
  return tx(async (c) => {
    const have = new Map((await q("SELECT id, slug FROM baskets WHERE franchise_id = ?", [t.id], c)).map((r) => [String(r.slug).toLowerCase(), r.id as number]));
    const products = new Set((await q("SELECT id FROM products WHERE franchise_id = ?", [t.id], c)).map((r) => r.id as number));
    const keep: number[] = [];
    for (const [n, b] of list.entries()) {
      if (!/^[A-Za-z0-9-]{1,50}$/.test(b.id) || !str(b.ko, 100) || !(b.price >= 0)) throw bad("바구니 이름과 가격을 확인해주세요.");
      const v = [str(b.ko, 100), str(b.en, 100), str(b.category, 30), Math.round(b.price), str(b.fruitCount, 30), str(b.serves, 30), str(b.note, 255), str(b.desc, 5000), imagePath(b.image), !!b.active, n];
      let id = have.get(b.id.toLowerCase());
      if (id) await exec("UPDATE baskets SET name_ko=?, name_en=?, category=?, price=?, fruit_count=?, serves=?, note=?, description=?, image_path=?, active=?, sort_order=? WHERE id=?", [...v, id], c);
      else id = (await exec("INSERT INTO baskets (name_ko, name_en, category, price, fruit_count, serves, note, description, image_path, active, sort_order, franchise_id, slug) VALUES (?,?,?,?,?,?,?,?,?,?,?,?,?)", [...v, t.id, b.id], c)).insertId;
      keep.push(id);
      await savePhotos("basket_photos", "basket_id", id, b.photos, c);

      await exec("DELETE FROM basket_items WHERE basket_id = ?", [id], c);
      for (const i of (b.items ?? []).filter((i) => products.has(i.productId) && i.kg > 0))
        await exec("INSERT IGNORE INTO basket_items (basket_id, product_id, kg) VALUES (?,?,?)", [id, i.productId, i.kg], c);

      const oldAddons = new Set((await q("SELECT id FROM basket_addons WHERE basket_id = ?", [id], c)).map((r) => r.id as number));
      const keepAddons: number[] = [];
      for (const a of b.addons ?? []) {
        if (!str(a.name, 50) || !(a.price >= 0)) throw bad("옵션 이름과 가격을 확인해주세요.");
        const aid = Number(a.id);
        if (oldAddons.has(aid)) {
          await exec("UPDATE basket_addons SET name=?, price=? WHERE id=?", [str(a.name, 50), Math.round(a.price), aid], c);
          keepAddons.push(aid);
        } else await exec("INSERT INTO basket_addons (basket_id, name, price) VALUES (?,?,?)", [id, str(a.name, 50), Math.round(a.price)], c);
      }
      const goneAddons = [...oldAddons].filter((x) => !keepAddons.includes(x));
      if (goneAddons.length) await exec("DELETE FROM basket_addons WHERE id IN (?)", [goneAddons], c);
    }
    const gone = [...have.values()].filter((id) => !keep.includes(id));
    if (gone.length) await exec("DELETE FROM baskets WHERE id IN (?)", [gone], c);
    return { baskets: await loadBaskets(t.id, c) };
  });
});

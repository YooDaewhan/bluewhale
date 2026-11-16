import { api, bad, exec, getTenant, imagePath, loadProducts, q, requireAdmin, str, tx } from "../../server";
import type { Product } from "../../store";

const DATE = /^\d{4}-\d{2}-\d{2}$/;

// ponytail: the admin UI edits the whole list, so this syncs the whole list (update / insert / delete) in one
// transaction. Fine for a menu of tens of items; switch to per-item endpoints if lists get long or admins overlap.
export const PUT = api(async (req) => {
  const t = await getTenant();
  await requireAdmin(t);
  const list = ((await req.json()).list ?? []) as Product[];
  return tx(async (c) => {
    const have = new Set((await q("SELECT id FROM products WHERE franchise_id = ?", [t.id], c)).map((r) => r.id as number));
    const keep: number[] = [];
    for (const p of list) {
      if (!str(p.name, 100) || !(p.pricePerKg > 0) || !DATE.test(p.saleStart) || !DATE.test(p.saleEnd)) throw bad("상품명, 가격, 판매 기간을 확인해주세요.");
      const v = [str(p.name, 100), str(p.emoji, 16), imagePath(p.image), str(p.origin, 100), Math.round(p.pricePerKg), str(p.description, 5000), p.saleStart, p.saleEnd];
      if (have.has(p.id)) {
        await exec("UPDATE products SET name=?, emoji=?, image_path=?, origin=?, price_per_kg=?, description=?, sale_start=?, sale_end=? WHERE id=?", [...v, p.id], c);
        keep.push(p.id);
      } else await exec("INSERT INTO products (name, emoji, image_path, origin, price_per_kg, description, sale_start, sale_end, franchise_id) VALUES (?,?,?,?,?,?,?,?,?)", [...v, t.id], c);
    }
    const gone = [...have].filter((id) => !keep.includes(id));
    if (gone.length) await exec("DELETE FROM products WHERE id IN (?)", [gone], c);
    return { products: await loadProducts(t.id, c) };
  });
});

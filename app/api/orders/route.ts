import { CARRIERS, ORDER_STEPS, shippingFee } from "../../order-data";
import { api, bad, exec, getTenant, loadOrders, loadProducts, numId, requireAdmin, str, tx } from "../../server";

// guest checkout (member login comes with Kakao). Prices come from the DB, never from the request.
export const POST = api(async (req) => {
  const t = await getTenant();
  const d = await req.json();
  const name = str(d.name, 50);
  const phone = str(d.phone, 20);
  const address = str(d.address, 255);
  if (!name || !phone || !address) throw bad("받는 분 정보를 입력해주세요.");
  const products = await loadProducts(t.id);
  const lines = ((Array.isArray(d.lines) ? d.lines : []) as { productId: number; kg: number }[]).map((l) => {
    const p = products.find((x) => x.id === l.productId);
    const kg = Number(l.kg);
    if (!p || !(kg > 0 && kg <= 1000)) throw bad("장바구니의 상품을 확인해주세요. (메뉴가 변경되었을 수 있습니다)");
    return { p, kg };
  });
  if (!lines.length) throw bad("장바구니가 비어 있습니다.");
  const subtotal = lines.reduce((s, l) => s + l.p.pricePerKg * l.kg, 0);
  const total = Math.round(subtotal + shippingFee(subtotal));

  const id = await tx(async (c) => {
    const r = await exec("INSERT INTO orders (franchise_id, name, phone, address, message, total) VALUES (?,?,?,?,?,?)", [t.id, name, phone, address, str(d.message, 255), total], c);
    for (const l of lines)
      await exec("INSERT INTO order_items (order_id, product_id, name, emoji, kg, price_per_kg) VALUES (?,?,?,?,?,?)", [r.insertId, l.p.id, l.p.name, l.p.emoji, l.kg, l.p.pricePerKg], c);
    return r.insertId;
  });
  return { order: (await loadOrders(t.id, id))[0] };
});

// { id, carrier, tracking } → 발송완료, { id, status } → that status
export const PATCH = api(async (req) => {
  const t = await getTenant();
  await requireAdmin(t);
  const d = await req.json();
  if (d.carrier !== undefined) {
    if (!CARRIERS.includes(d.carrier) || !str(d.tracking, 50)) throw bad("택배사와 송장번호를 확인해주세요.");
    await exec("UPDATE orders SET carrier = ?, tracking = ?, shipped_at = NOW(), status = '발송완료' WHERE id = ? AND franchise_id = ?", [d.carrier, str(d.tracking, 50), numId(d.id), t.id]);
  } else {
    if (!ORDER_STEPS.includes(d.status)) throw bad("잘못된 상태입니다.");
    await exec("UPDATE orders SET status = ? WHERE id = ? AND franchise_id = ?", [d.status, numId(d.id), t.id]);
  }
});

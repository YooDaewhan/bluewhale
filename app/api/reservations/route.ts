import { EXTRAS, PICKUP_TIMES, WRAPS, basketTotal, type BasketLine, type ExtraId, type ReservationStatus, type WrapId } from "../../basket-data";
import { api, bad, exec, getTenant, loadBaskets, loadReservations, numId, q, requireAdmin, str, tx } from "../../server";

const STATUSES: ReservationStatus[] = ["예약", "준비완료", "픽업완료", "취소"];

// anyone can reserve (no login). Prices come from the DB, never from the request.
export const POST = api(async (req) => {
  const t = await getTenant();
  const d = await req.json();
  const name = str(d.name, 50);
  const phone = str(d.phone, 20);
  const wrap = d.wrap as WrapId;
  const extras = (Array.isArray(d.extras) ? d.extras : []) as ExtraId[];
  const items = (Array.isArray(d.items) ? d.items : []) as BasketLine[];
  if (!name || !phone) throw bad("이름과 연락처를 입력해주세요.");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(d.pickupDate) || !PICKUP_TIMES.includes(d.pickupTime)) throw bad("픽업 날짜와 시간을 확인해주세요.");
  if (!WRAPS.some((w) => w.id === wrap) || !extras.every((e) => EXTRAS.some((x) => x.id === e))) throw bad("포장 옵션을 확인해주세요.");

  const baskets = (await loadBaskets(t.id)).filter((b) => b.active);
  const dbId = new Map((await q("SELECT id, slug FROM baskets WHERE franchise_id = ?", [t.id])).map((r) => [r.slug as string, r.id as number]));
  const lines = items.map((l) => {
    const b = baskets.find((x) => x.id === l.size);
    const qty = Math.floor(Number(l.qty));
    const addons = (l.addons ?? []).map((id) => b?.addons.find((a) => a.id === id));
    if (!b || !(qty >= 1 && qty <= 20) || addons.some((a) => !a)) throw bad("선택한 바구니를 확인해주세요. (메뉴가 변경되었을 수 있습니다)");
    return { b, qty, addons: addons.map((a) => a!) };
  });
  if (!lines.length) throw bad("바구니를 1개 이상 선택해주세요.");
  const clean: BasketLine[] = lines.map((l) => ({ size: l.b.id, qty: l.qty, addons: l.addons.map((a) => a.id) }));
  const total = basketTotal(clean, wrap, extras, baskets);

  const id = await tx(async (c) => {
    const r = await exec(
      "INSERT INTO reservations (franchise_id, pickup_date, pickup_time, name, phone, wrap, extras, message, memo, total) VALUES (?,?,?,?,?,?,?,?,?,?)",
      [t.id, d.pickupDate, d.pickupTime, name, phone, wrap, JSON.stringify(extras), str(d.message, 255), str(d.memo, 500), total],
      c,
    );
    for (const l of lines)
      await exec(
        "INSERT INTO reservation_items (reservation_id, basket_id, basket_slug, basket_name, unit_price, qty, addons) VALUES (?,?,?,?,?,?,?)",
        [r.insertId, dbId.get(l.b.id), l.b.id, l.b.ko, l.b.price, l.qty, JSON.stringify(l.addons)],
        c,
      );
    return r.insertId;
  });
  return { reservation: (await loadReservations(t.id, true, id))[0] };
});

export const PATCH = api(async (req) => {
  const t = await getTenant();
  await requireAdmin(t);
  const { id, status } = await req.json();
  if (!STATUSES.includes(status)) throw bad("잘못된 상태입니다.");
  await exec("UPDATE reservations SET status = ? WHERE id = ? AND franchise_id = ?", [status, numId(id), t.id]);
});

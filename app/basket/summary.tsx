import { BASKETS, EXTRAS, WRAPS, type Reservation } from "../basket-data";
import { won } from "../store";

export function Summary({ r }: { r: Reservation }) {
  const w = WRAPS.find((x) => x.id === r.wrap)!;
  const rows: [string, string][] = [
    ["예약번호", r.id],
    ["픽업", `${r.pickupDate.replaceAll("-", ".")} ${r.pickupTime}`],
    ["예약자", `${r.name} · ${r.phone}`],
    ["바구니", r.items.map((l) => `${BASKETS.find((b) => b.id === l.size)!.ko} × ${l.qty}`).join(", ")],
    ["포장", [w.name, ...r.extras.map((e) => EXTRAS.find((x) => x.id === e)!.name)].join(" · ")],
    ["문구", `“${r.message}”`],
    ...(r.memo ? ([["요청사항", r.memo]] as [string, string][]) : []),
    ["결제예정", won(r.total)],
  ];
  return (
    <dl className="mt-8 divide-y divide-ink-900/10 border-y border-ink-900/10 text-left text-sm">
      {rows.map(([k, v]) => (
        <div key={k} className="flex gap-4 py-3">
          <dt className="w-20 shrink-0 text-ink-900/50">{k}</dt>
          <dd>{v}</dd>
        </div>
      ))}
    </dl>
  );
}

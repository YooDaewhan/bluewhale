"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useEffect, useState } from "react";
import { EXTRAS, MESSAGES, PICKUP_TIMES, RIBBON_SAMPLE, WRAPS, basketMeta, basketTotal, type ExtraId, type Reservation, type SizeId, type WrapId } from "../basket-data";
import { useStore, won } from "../store";
import { Summary } from "./summary";

const CUSTOM = "직접 입력";

export default function BasketOrderPage() {
  const { ready, today, user, reservations, addReservation, baskets } = useStore();
  const [qty, setQty] = useState<Record<SizeId, number>>({});
  const shown = baskets.filter((b) => b.active);
  const [wrap, setWrap] = useState<WrapId>("basic");
  const [extras, setExtras] = useState<ExtraId[]>([]);
  const [preset, setPreset] = useState(MESSAGES[0]);
  const [customMsg, setCustomMsg] = useState("");
  const [date, setDate] = useState("");
  const [time, setTime] = useState("");
  const [error, setError] = useState("");
  const [done, setDone] = useState<Reservation | null>(null);
  const [compact, setCompact] = useState(false);
  const [addons, setAddons] = useState<Record<SizeId, string[]>>({}); // product-specific options per line

  // /basket#M from the main page preselects one basket of that size
  useEffect(() => {
    if (!ready) return; // wait for admin-edited baskets from storage
    const id = location.hash.slice(1) as SizeId;
    if (baskets.some((b) => b.id === id && b.active)) {
      setQty((q) => ({ ...q, [id]: Math.max(1, (q[id] ?? 0)) }));
      setCompact(true);
    }
  }, [ready]); // eslint-disable-line react-hooks/exhaustive-deps -- run once when data is ready

  const items = shown.filter((b) => (qty[b.id] ?? 0) > 0).map((b) => ({ size: b.id, qty: qty[b.id] ?? 0, addons: (addons[b.id] ?? []).filter((id) => b.addons?.some((a) => a.id === id)) }));
  const compactMode = compact && items.length > 0; // falls back to the full list if everything was removed
  const addonToggles = (b: (typeof shown)[number]) =>
    b.addons?.length ? (
      <div className="mt-2 flex flex-wrap gap-1.5">
        {b.addons.map((a) => {
          const on = (addons[b.id] ?? []).includes(a.id);
          return (
            <label key={a.id} className={`cursor-pointer border px-2.5 py-1 text-[11px] transition ${on ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20 hover:border-ink-950"}`}>
              <input
                type="checkbox"
                className="sr-only"
                checked={on}
                onChange={() => setAddons((s) => ({ ...s, [b.id]: on ? (s[b.id] ?? []).filter((x) => x !== a.id) : [...(s[b.id] ?? []), a.id] }))}
              />
              {a.name} +{won(a.price)}
            </label>
          );
        })}
      </div>
    ) : null;
  const stepper = (id: SizeId, label: string) => (
    <div className="flex items-center justify-between gap-1">
      <button type="button" className="h-8 w-8 hover:bg-ink-900/5" onClick={() => setQty((q) => ({ ...q, [id]: Math.max(0, (q[id] ?? 0) - 1) }))} aria-label={`${label} 빼기`}>−</button>
      <span className="w-10 text-center text-sm">{qty[id] ?? 0}개</span>
      <button type="button" className="h-8 w-8 hover:bg-ink-900/5" onClick={() => setQty((q) => ({ ...q, [id]: Math.min(20, (q[id] ?? 0) + 1) }))} aria-label={`${label} 더하기`}>+</button>
    </div>
  );
  const count = items.reduce((s, l) => s + l.qty, 0);
  const total = basketTotal(items, wrap, extras, baskets);
  const message = preset === CUSTOM ? customMsg.trim() : preset;
  const wrapInfo = WRAPS.find((w) => w.id === wrap)!;
  // slots already holding 3+ baskets on that date are shown as full (mock capacity)
  const slotLoad = (t: string) =>
    reservations.filter((r) => r.pickupDate === date && r.pickupTime === t && r.status !== "취소").reduce((s, r) => s + r.items.reduce((a, l) => a + l.qty, 0), 0);

  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    if (count === 0) return fail("바구니를 1개 이상 선택해주세요.", "step-1");
    if (!message) return fail("바구니에 들어갈 문구를 입력해주세요.", "step-3");
    if (!date || !time) return fail("픽업 날짜와 시간을 선택해주세요.", "step-4");
    setDone(
      addReservation({
        pickupDate: date,
        pickupTime: time,
        name: String(f.get("name")).trim(),
        phone: String(f.get("phone")).trim(),
        memo: String(f.get("memo") ?? "").trim(),
        items,
        wrap,
        extras,
        message,
        total,
      }),
    );
    scrollTo({ top: 0 });
  }
  function fail(msg: string, anchor: string) {
    setError(msg);
    document.getElementById(anchor)?.scrollIntoView({ behavior: "smooth" });
  }

  if (!ready) return <div className="min-h-[60vh]" />;

  if (done)
    return (
      <div className="mx-auto max-w-xl px-4 py-20 text-center">
        <img src="/brand/whale-flower.webp" alt="" className="mx-auto h-36 w-auto" />
        <p className="eyebrow mt-8">Reservation Confirmed</p>
        <h1 className="mt-3 font-serif text-4xl">예약이 완료되었습니다</h1>
        <p className="mt-3 text-sm text-ink-600">픽업 시간에 맞춰 바구니를 준비해 두겠습니다. (데모: 이 브라우저에만 저장됩니다)</p>
        <Summary r={done} />
        <div className="mt-8 flex justify-center gap-3">
          <Link href="/" className="btn">홈으로</Link>
          <button className="border border-ink-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em]" onClick={() => location.reload()}>
            새 주문서
          </button>
        </div>
      </div>
    );

  return (
    <div className="mx-auto max-w-6xl px-4 py-12">
      <p className="eyebrow">Gift Basket Order</p>
      <h1 className="mt-2 font-serif text-4xl sm:text-5xl">과일 바구니 주문서</h1>
      <p className="mt-3 text-sm text-ink-600">한 장의 주문서로 상품, 포장, 리본 문구, 픽업 시간까지 한 번에 예약하세요.</p>

      <form onSubmit={submit} className="mt-12 grid gap-12 lg:grid-cols-[1fr_360px]">
        <div className="min-w-0 space-y-16">
          <Step id="step-1" no="01" title={compactMode ? "선택한 상품" : "상품 · 수량"}>
            {compactMode ? (
              // came from a product page: show only what was picked, full list on demand
              <div className="space-y-3">
                {items.map((l) => {
                  const b = shown.find((x) => x.id === l.size)!;
                  return (
                    <div key={b.id} className="flex items-center gap-4 border border-ink-950 bg-white p-3">
                      <img src={b.image} alt="" className="h-20 w-16 shrink-0 object-cover" />
                      <div className="min-w-0 flex-1">
                        <p className="font-serif text-xl">{b.ko}</p>
                        <p className="text-[11px] text-ink-900/50">{basketMeta(b)}</p>
                        <p className="mt-1 text-sm">{won(b.price)}</p>
                      </div>
                      <div className="text-right">
                        {stepper(b.id, b.ko)}
                        {addonToggles(b)}
                      </div>
                    </div>
                  );
                })}
                <button type="button" onClick={() => setCompact(false)} className="w-full border border-dashed border-ink-900/30 py-3 text-sm text-ink-600 hover:border-ink-950 hover:text-ink-950">
                  + 다른 상품도 함께 주문하기
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-2 gap-4 lg:grid-cols-4">
                {shown.map((b) => (
                  <div key={b.id} className={`border bg-white/60 transition ${(qty[b.id] ?? 0) ? "border-ink-950" : "border-ink-900/10"}`}>
                    <button type="button" className="block w-full text-left" onClick={() => setQty((q) => ({ ...q, [b.id]: (q[b.id] ?? 0) || 1 }))}>
                      <div className="aspect-[4/3] overflow-hidden">
                        <img src={b.image} alt={`${b.ko}`} className="h-full w-full object-cover" />
                      </div>
                      <div className="p-3">
                        <p className="font-serif text-lg">{b.ko}</p>
                        <p className="text-[11px] text-ink-900/50">{basketMeta(b)}</p>
                        <p className="mt-1 text-sm">{won(b.price)}</p>
                      </div>
                    </button>
                    <div className="border-t border-ink-900/10 px-3 py-2">
                      {stepper(b.id, b.ko)}
                      {(qty[b.id] ?? 0) > 0 && addonToggles(b)}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Step>

          <Step id="step-2" no="02" title="포장 옵션" note="선택한 포장과 추가 옵션은 모든 바구니에 동일하게 적용됩니다. 이바지과일선물은 겹보자기·노리개가 기본 포함되어 있어요.">
            <p className="eyebrow mb-3">Wrapping · 포장</p>
            <div className="grid gap-3 sm:grid-cols-2">
              {WRAPS.map((w) => (
                <label key={w.id} className={`flex cursor-pointer items-center gap-4 border p-4 transition ${wrap === w.id ? "border-ink-950 bg-white" : "border-ink-900/10 bg-white/50 hover:border-ink-900/40"}`}>
                  <input type="radio" name="wrap" className="sr-only" checked={wrap === w.id} onChange={() => setWrap(w.id)} />
                  {w.image ? (
                    <img src={w.image} alt="" className="h-16 w-14 shrink-0 object-cover" />
                  ) : (
                    <span className="grid h-16 w-14 shrink-0 place-items-center border border-ink-900/10 text-[10px] text-ink-900/40" style={{ background: w.color + "33" }}>기본</span>
                  )}
                  <span className="flex-1 text-sm">{w.name}</span>
                  <span className="text-xs text-ink-600">{w.price ? `+${won(w.price)}` : "무료"}</span>
                </label>
              ))}
            </div>
            <p className="eyebrow mb-3 mt-8">Add-ons · 추가 옵션</p>
            <div className="flex flex-wrap gap-2">
              {EXTRAS.map((x) => {
                const on = extras.includes(x.id);
                return (
                  <label key={x.id} className={`flex cursor-pointer items-center gap-3 border p-2 pr-4 text-sm transition ${on ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20 bg-white/50 hover:border-ink-950"}`}>
                    {x.image && <img src={x.image} alt="" className="h-12 w-10 object-cover" />}
                    <input type="checkbox" className="sr-only" checked={on} onChange={() => setExtras((s) => (on ? s.filter((e) => e !== x.id) : [...s, x.id]))} />
                    {x.name} <span className="opacity-60">+{won(x.price)}</span>
                  </label>
                );
              })}
            </div>
          </Step>

          <Step id="step-3" no="03" title="리본 문구" note="리본 문구는 무료입니다.">
            <div className="flex flex-wrap gap-2">
              {[...MESSAGES, CUSTOM].map((m) => (
                <button
                  key={m}
                  type="button"
                  onClick={() => setPreset(m)}
                  aria-pressed={preset === m}
                  className={`border px-4 py-2 text-sm transition ${preset === m ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20 hover:border-ink-950"}`}
                >
                  {m}
                </button>
              ))}
            </div>
            {preset === CUSTOM && (
              <input className="field mt-3" maxLength={30} placeholder="30자 이내로 입력해주세요" value={customMsg} onChange={(e) => setCustomMsg(e.target.value)} />
            )}
            {/* live preview of the tag that goes on the basket */}
            <div className="mt-6 flex flex-wrap items-center gap-6 border border-dashed border-ink-900/20 bg-white/60 p-6">
              <img src={RIBBON_SAMPLE} alt="리본 문구 예시" className="h-36 w-28 object-cover" />
              <div className="grid h-28 w-44 shrink-0 place-items-center border border-gold-400/60 bg-ivory px-3 text-center shadow-[0_8px_24px_-12px_rgba(0,0,0,0.25)]" style={{ borderTop: `6px solid ${wrapInfo.color}` }}>
                <p className="font-serif text-lg leading-snug">{message || "…"}</p>
                <p className="text-[9px] uppercase tracking-[0.3em] text-gold-600">Bluewhale</p>
              </div>
              <p className="text-xs leading-5 text-ink-600">
                바구니에 달리는 리본 문구 미리보기입니다.

              </p>
            </div>
          </Step>

          <Step id="step-4" no="04" title="픽업 정보">
            <div className="grid gap-4 sm:grid-cols-2">
              <Field label="픽업 날짜">
                <input type="date" className="field" min={today} value={date} onChange={(e) => { setDate(e.target.value); setTime(""); }} required />
              </Field>
              <Field label="받는 분 성함">
                <input name="name" className="field" defaultValue={user?.role === "customer" ? user.name : ""} placeholder="홍길동" required />
              </Field>
            </div>
            <p className="eyebrow mb-3 mt-6">픽업 시간</p>
            {date ? (
              <div className="grid grid-cols-3 gap-2 sm:grid-cols-5">
                {PICKUP_TIMES.map((t) => {
                  const full = slotLoad(t) >= 3;
                  return (
                    <button
                      key={t}
                      type="button"
                      disabled={full}
                      onClick={() => setTime(t)}
                      aria-pressed={time === t}
                      className={`border py-2.5 text-sm transition disabled:cursor-not-allowed disabled:border-ink-900/5 disabled:text-ink-900/25 disabled:line-through ${time === t ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20 hover:border-ink-950"}`}
                    >
                      {t}
                    </button>
                  );
                })}
              </div>
            ) : (
              <p className="text-sm text-ink-900/40">날짜를 먼저 선택해주세요.</p>
            )}
            <div className="mt-6 grid gap-4 sm:grid-cols-2">
              <Field label="연락처">
                <input name="phone" type="tel" className="field" placeholder="010-0000-0000" pattern="[0-9\-]{9,13}" required />
              </Field>
              <Field label="요청사항 (선택)">
                <input name="memo" className="field" maxLength={60} placeholder="예) 차량 픽업, 영수증 동봉" />
              </Field>
            </div>
            <p className="mt-4 text-xs text-ink-900/50">📍 픽업 장소: 블루웨일 성수 쇼룸 (서울 성동구 성수이로 00) · 마감된 시간은 선택할 수 없습니다. · 🛵 퀵 배송을 원하시면 요청사항에 적어주세요 (퀵 비용 별도).</p>
          </Step>
        </div>

        <aside>
          <div className="sticky top-24 border border-ink-900/10 bg-white p-6">
            <p className="eyebrow">Order Summary</p>
            <ul className="mt-4 space-y-2 text-sm">
              {items.length === 0 && <li className="text-ink-900/40">선택한 바구니가 없습니다.</li>}
              {items.map((l) => {
                const b = baskets.find((x) => x.id === l.size)!;
                return (
                  <li key={l.size} className="flex justify-between">
                    <span>
                      {b.ko} × {l.qty}
                      {(l.addons ?? []).map((id) => <span key={id} className="block text-xs text-ink-600">+ {b.addons.find((a) => a.id === id)?.name} × {l.qty}</span>)}
                    </span>
                    <span>{won((b.price + (l.addons ?? []).reduce((s, id) => s + (b.addons.find((a) => a.id === id)?.price ?? 0), 0)) * l.qty)}</span>
                  </li>
                );
              })}
              {count > 0 && (
                <li className="flex justify-between text-ink-600">
                  <span>{wrapInfo.name} × {count}</span>
                  <span>{won(wrapInfo.price * count)}</span>
                </li>
              )}
              {count > 0 &&
                extras.map((e) => {
                  const x = EXTRAS.find((y) => y.id === e)!;
                  return (
                    <li key={e} className="flex justify-between text-ink-600">
                      <span>{x.name} × {count}</span>
                      <span>{won(x.price * count)}</span>
                    </li>
                  );
                })}
            </ul>
            <dl className="mt-4 space-y-1 border-t border-ink-900/10 pt-4 text-xs text-ink-600">
              <div className="flex justify-between"><dt>문구</dt><dd className="max-w-[60%] truncate">{message || "-"}</dd></div>
              <div className="flex justify-between"><dt>픽업</dt><dd>{date && time ? `${date.replaceAll("-", ".")} ${time}` : "-"}</dd></div>
            </dl>
            <div className="mt-4 flex items-baseline justify-between border-t border-ink-900/10 pt-4">
              <span className="eyebrow">Total</span>
              <span className="font-serif text-3xl">{won(total)}</span>
            </div>
            {error && <p className="mt-4 text-sm text-coral-500">{error}</p>}
            <button className="btn mt-6 w-full">픽업 예약하기</button>
            <p className="mt-3 text-center text-[11px] text-ink-900/40">결제는 픽업 시 매장에서 진행됩니다.</p>
          </div>
        </aside>
      </form>
    </div>
  );
}

function Step({ id, no, title, note, children }: { id: string; no: string; title: string; note?: string; children: React.ReactNode }) {
  return (
    <section id={id} className="scroll-mt-24">
      <div className="mb-6 flex items-baseline gap-4 border-b border-ink-900/10 pb-4">
        <span className="font-serif text-3xl italic text-gold-600">{no}</span>
        <h2 className="font-serif text-2xl">{title}</h2>
      </div>
      {note && <p className="-mt-2 mb-5 text-xs text-ink-900/50">{note}</p>}
      {children}
    </section>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="eyebrow mb-2 block">{label}</span>
      {children}
    </label>
  );
}

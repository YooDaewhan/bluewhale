"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import type { Order } from "../order-data";
import { FruitImage, useStore, won } from "../store";

const SHIPPING_FEE = 3500;
const FREE_SHIPPING_OVER = 50000;
const MESSAGES = ["문 앞에 놓아주세요", "경비실에 맡겨주세요", "배송 전 연락 부탁드려요", "파손 주의 부탁드립니다", "직접 입력"];

type Done = Order;

export default function CartPage() {
  const { ready, user, products, cart, setKg, clearCart, addOrder } = useStore();
  const [msgPreset, setMsgPreset] = useState(MESSAGES[0]);
  const [done, setDone] = useState<Done | null>(null);

  const lines = cart
    .map((i) => ({ ...i, p: products.find((p) => p.id === i.productId) }))
    .filter((l) => l.p);
  const subtotal = lines.reduce((s, l) => s + l.p!.pricePerKg * l.kg, 0);
  const shipping = subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE;
  const total = subtotal + shipping;

  // ponytail: saved to localStorage only (mock), so admin/customer views in this browser can see it
  function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setDone(
      addOrder({
        name: String(f.get("name")),
        phone: String(f.get("phone")),
        address: `(${f.get("zip")}) ${f.get("addr1")} ${f.get("addr2")}`.trim(),
        message: msgPreset === "직접 입력" ? String(f.get("customMsg") || "-") : msgPreset,
        total,
        lines: lines.map((l) => ({ productId: l.p!.id, emoji: l.p!.emoji, name: l.p!.name, kg: l.kg, pricePerKg: l.p!.pricePerKg })),
      }),
    );
    clearCart();
  }

  if (done)
    return (
      <div className="mx-auto max-w-lg px-4 py-16 text-center">
        <img src="/brand/mascot.webp" alt="" className="mx-auto h-48 w-auto" />
        <h1 className="mt-4 font-serif text-3xl">Thank you — 주문이 접수되었습니다</h1>
        <p className="mt-1 text-sm text-ink-900/60">발송되면 내 주문에서 송장번호를 확인할 수 있어요. (데모: 이 브라우저에만 저장됩니다)</p>
        <dl className="mt-8 space-y-2 rounded-sm bg-white p-6 text-left text-sm border border-ink-900/10">
          {[
            ["주문번호", done.id],
            ["받는 분", `${done.name} · ${done.phone}`],
            ["배송지", done.address],
            ["배송 메시지", done.message],
            ["상품", done.lines.map((l) => `${l.emoji} ${l.name} ${l.kg}kg`).join(", ")],
            ["결제금액", won(done.total)],
          ].map(([k, v]) => (
            <div key={k} className="flex gap-4">
              <dt className="w-24 shrink-0 text-ink-900/50">{k}</dt>
              <dd className="font-medium">{v}</dd>
            </div>
          ))}
        </dl>
        <div className="mt-6 flex justify-center gap-3">
          <Link href="/orders" className="btn">내 주문 보기</Link>
          <Link href="/" className="border border-ink-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em]">쇼핑 계속하기</Link>
        </div>
      </div>
    );

  if (!ready) return null;

  if (lines.length === 0)
    return (
      <div className="px-4 py-24 text-center">
        <img src="/brand/whale-flower.webp" alt="" className="mx-auto h-40 w-auto" />
        <p className="mt-3 text-ink-900/60">장바구니가 비어 있어요.</p>
        <Link href="/" className="btn mt-6 inline-block">열대과일 보러가기</Link>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        <h1 className="mb-4 font-serif text-3xl">장바구니</h1>
        <ul className="space-y-3">
          {lines.map(({ p, kg }) => (
            <li key={p!.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-sm bg-white p-4 border border-ink-900/10">
              <FruitImage p={p!} className="h-16 w-16 shrink-0 rounded-sm text-3xl" />
              <div className="min-w-0 flex-1">
                <Link href={`/product/${p!.id}`} className="font-serif text-lg hover:underline">{p!.name}</Link>
                <p className="text-xs text-ink-900/50">{won(p!.pricePerKg)} / kg · {p!.origin}</p>
              </div>
              {/* mobile: drops to its own row under the name */}
              <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                <div className="flex items-center gap-1">
                  <button className="h-8 w-8 rounded-full bg-ink-900/5" onClick={() => setKg(p!.id, kg - 1)} aria-label="1kg 빼기">−</button>
                  <span className="w-12 text-center font-semibold">{kg}kg</span>
                  <button className="h-8 w-8 rounded-full bg-ink-900/5" onClick={() => setKg(p!.id, kg + 1)} aria-label="1kg 더하기">+</button>
                </div>
                <p className="whitespace-nowrap text-right font-bold sm:w-24">{won(p!.pricePerKg * kg)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside>
        <div className="sticky top-20 rounded-sm bg-white p-6 border border-ink-900/10">
          <h2 className="font-serif text-xl">주문서</h2>
          <div className="mt-3 space-y-1 border-b border-ink-900/10 pb-3 text-sm">
            <Row k="상품금액" v={won(subtotal)} />
            <Row k="배송비" v={shipping ? won(shipping) : "무료"} />
            <p className="text-xs text-ink-900/40">{won(FREE_SHIPPING_OVER)} 이상 무료배송 · 아이스박스 포장</p>
            <Row k="결제예정" v={won(total)} bold />
          </div>

          {!user ? (
            <div className="mt-4 text-center text-sm">
              <p className="text-ink-900/60">주문하려면 로그인이 필요해요.</p>
              <Link href="/login" className="btn mt-3 inline-block">로그인하기</Link>
            </div>
          ) : (
            <form onSubmit={submit} className="mt-4 space-y-2.5">
              <input name="name" className="field" placeholder="받는 분" defaultValue={user.name} required />
              <input name="phone" className="field" type="tel" placeholder="연락처 (010-0000-0000)" pattern="[0-9\-]{9,13}" required />
              <div className="flex gap-2">
                <input name="zip" className="field w-28" placeholder="우편번호" inputMode="numeric" pattern="[0-9]{5}" required />
                <span className="self-center text-xs text-ink-900/40">5자리</span>
              </div>
              <input name="addr1" className="field" placeholder="기본 주소" required />
              <input name="addr2" className="field" placeholder="상세 주소 (동·호수)" />
              <select className="field" value={msgPreset} onChange={(e) => setMsgPreset(e.target.value)} aria-label="배송 메시지">
                {MESSAGES.map((m) => <option key={m}>{m}</option>)}
              </select>
              {msgPreset === "직접 입력" && (
                <textarea name="customMsg" className="field" rows={2} maxLength={100} placeholder="배송 기사님께 전할 메시지 (100자)" />
              )}
              <button className="btn w-full py-3">{won(total)} 주문하기</button>
            </form>
          )}
        </div>
      </aside>
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "pt-2 text-base font-extrabold text-ink-800" : ""}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

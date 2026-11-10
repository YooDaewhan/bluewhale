"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useState } from "react";
import { BASKET_CATEGORIES, basketMeta } from "./basket-data";
import { compositionText, useStore, won } from "./store";

export default function GiftBaskets() {
  const { baskets, products } = useStore();
  const [cat, setCat] = useState("전체");
  const active = baskets.filter((b) => b.active);
  const cats = ["전체", ...new Set([...BASKET_CATEGORIES, ...active.map((b) => b.category)])].filter((c) => c === "전체" || active.some((b) => b.category === c));
  const shown = active.filter((b) => cat === "전체" || b.category === cat);

  return (
    <div>
      <div className="mt-10 flex flex-wrap items-end justify-between gap-6">
        <div>
          <p className="eyebrow">Gift Basket · Pickup Reservation</p>
          <h2 className="mt-2 font-serif text-3xl sm:text-4xl">마음을 담은 과일 바구니</h2>
          <p className="mt-3 max-w-lg text-sm leading-7 text-ink-600">
            사이즈를 고르고, 보자기와 메시지 문구, 픽업 시간까지 한 장의 주문서로 예약하세요. 예약하신 시간에 맞춰 당일 아침 직접 담아 둡니다.
          </p>
        </div>
        <Link href="/basket" className="btn">주문서 작성하기</Link>
      </div>

      <div className="mt-8 flex flex-wrap gap-2" role="tablist" aria-label="바구니 분류">
        {cats.map((c) => (
          <button
            key={c}
            role="tab"
            aria-selected={cat === c}
            onClick={() => setCat(c)}
            className={`border px-4 py-2 text-sm transition ${cat === c ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20 hover:border-ink-950"}`}
          >
            {c} <span className="opacity-50">{c === "전체" ? active.length : active.filter((b) => b.category === c).length}</span>
          </button>
        ))}
      </div>

      <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
        {shown.map((b) => (
          <Link key={b.id} href={`/gift/${b.id}`} className="group">
            <div className="relative aspect-[4/5] overflow-hidden bg-gold-300/30">
              {b.image ? (
                <img src={b.image} alt={`${b.ko} 과일 바구니`} loading="lazy" className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
              ) : (
                <div className="grid h-full place-items-center text-6xl">🧺</div>
              )}
              <span className="absolute left-3 top-3 bg-ivory/90 px-2 py-1 font-serif text-sm">{b.ko}</span>
            </div>
            <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-gold-600">
              {basketMeta(b)}
            </p>
            <p className="mt-1 font-serif text-2xl">{won(b.price)}</p>
            {compositionText(b, products) && <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-600">{compositionText(b, products)}</p>}
          </Link>
        ))}
      </div>

      <ol className="mt-14 grid gap-6 border-t border-ink-900/10 pt-8 text-sm sm:grid-cols-4">
        {["상품 · 수량 선택", "보자기 · 노리개 옵션", "리본 문구 (무료)", "픽업 · 퀵 예약"].map((t, n) => (
          <li key={t} className="flex items-baseline gap-3">
            <span className="font-serif text-2xl italic text-gold-600">0{n + 1}</span>
            <span className="text-ink-600">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

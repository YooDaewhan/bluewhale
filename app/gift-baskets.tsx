"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { basketWeight } from "./basket-data";
import { compositionText, useStore, won } from "./store";

export default function GiftBaskets() {
  const { baskets, products } = useStore();
  const shown = baskets.filter((b) => b.active);

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

      <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
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
              {b.en} · {b.serves} · 약 {basketWeight(b)}kg
            </p>
            <p className="mt-1 font-serif text-2xl">{won(b.price)}</p>
            <p className="mt-2 line-clamp-2 text-xs leading-5 text-ink-600">{compositionText(b, products)}</p>
          </Link>
        ))}
      </div>

      <ol className="mt-14 grid gap-6 border-t border-ink-900/10 pt-8 text-sm sm:grid-cols-4">
        {["사이즈 · 수량 선택", "보자기 · 리본 옵션", "메시지 문구 선택", "픽업 날짜 · 시간 예약"].map((t, n) => (
          <li key={t} className="flex items-baseline gap-3">
            <span className="font-serif text-2xl italic text-gold-600">0{n + 1}</span>
            <span className="text-ink-600">{t}</span>
          </li>
        ))}
      </ol>
    </div>
  );
}

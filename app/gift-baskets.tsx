/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { BASKETS } from "./basket-data";
import { won } from "./store";

export default function GiftBaskets() {
  return (
    <section id="gift" className="scroll-mt-24 bg-ink-950 text-ivory">
      <div className="mx-auto max-w-6xl px-4 py-24">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div>
            <p className="eyebrow text-gold-300">Gift Basket · Pickup Reservation</p>
            <h2 className="mt-3 font-serif text-4xl sm:text-5xl">마음을 담은 과일 바구니</h2>
            <p className="mt-4 max-w-lg text-sm leading-7 text-ivory/70">
              사이즈를 고르고, 보자기와 메시지 문구, 픽업 시간까지 한 장의 주문서로 예약하세요. 예약하신 시간에 맞춰 당일 아침 직접 담아 둡니다.
            </p>
          </div>
          <Link href="/basket" className="border border-ivory/60 px-7 py-3 text-[11px] uppercase tracking-[0.3em] transition hover:bg-ivory hover:text-ink-950">
            주문서 작성하기
          </Link>
        </div>

        <div className="mt-14 grid grid-cols-2 gap-x-4 gap-y-10 sm:gap-x-6 lg:grid-cols-4">
          {BASKETS.map((b) => (
            <Link key={b.id} href={`/basket#${b.id}`} className="group">
              <div className="relative aspect-[4/5] overflow-hidden bg-ink-900">
                <img src={b.image} alt={`${b.ko} 사이즈 과일 바구니`} loading="lazy" className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" />
                <span className="absolute left-3 top-3 bg-ivory/90 px-2 py-1 font-serif text-sm text-ink-950">{b.ko}</span>
              </div>
              <p className="mt-4 text-[10px] uppercase tracking-[0.25em] text-gold-300">
                {b.en} · {b.serves} · {b.weight}
              </p>
              <p className="mt-1 font-serif text-2xl">{won(b.price)}</p>
              <p className="mt-2 line-clamp-2 text-xs leading-5 text-ivory/60">{b.fruits}</p>
            </Link>
          ))}
        </div>

        <ol className="mt-16 grid gap-6 border-t border-ivory/15 pt-10 text-sm sm:grid-cols-4">
          {["사이즈 · 수량 선택", "보자기 · 리본 옵션", "메시지 문구 선택", "픽업 날짜 · 시간 예약"].map((t, n) => (
            <li key={t} className="flex items-baseline gap-3">
              <span className="font-serif text-2xl italic text-gold-400">0{n + 1}</span>
              <span className="text-ivory/80">{t}</span>
            </li>
          ))}
        </ol>
      </div>
    </section>
  );
}

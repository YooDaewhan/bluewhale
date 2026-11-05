"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import HeroSlider from "./hero-slider";
import Link from "next/link";
import { FruitImage, saleStatus, STATUS_EN as LABEL, useStore, won, type Product, type SaleStatus } from "./store";

const FILTERS: { key: SaleStatus | "all"; label: string }[] = [
  { key: "all", label: "All" },
  { key: "onsale", label: "Available" },
  { key: "upcoming", label: "Coming Soon" },
  { key: "ended", label: "Archive" },
];
const PROMISES = [
  { no: "01", title: "산지 완숙 수확", text: "나무에서 충분히 익힌 뒤 수확해 향과 당도가 가장 높을 때 보냅니다." },
  { no: "02", title: "당도 선별 인증", text: "비파괴 당도 선별기로 기준을 통과한 과일만 블루웨일 라벨을 붙입니다." },
  { no: "03", title: "72시간 콜드체인", text: "수확부터 문 앞까지 끊김 없는 저온 유통으로 신선함을 지킵니다." },
];

export default function Home() {
  const { products, ready, today } = useStore();
  const [filter, setFilter] = useState<SaleStatus | "all">("all");
  const order: SaleStatus[] = ["onsale", "upcoming", "ended"];
  const shown = ready
    ? [...products]
        .filter((p) => filter === "all" || saleStatus(p, today) === filter)
        .sort((a, b) => order.indexOf(saleStatus(a, today)) - order.indexOf(saleStatus(b, today)))
    : [];

  return (
    <>
      <HeroSlider />

      <section className="mx-auto max-w-3xl px-4 py-24 text-center">
        <p className="eyebrow">Since the Deep Blue</p>
        <p className="mt-6 font-serif text-2xl leading-relaxed text-ink-900 sm:text-3xl">
          고래가 대양을 건너듯, 우리는 가장 좋은 순간의 열대과일을
          <em className="text-gold-600"> 천천히, 그러나 신선하게 </em>
          당신의 식탁으로 옮깁니다.
        </p>
      </section>

      <section id="products" className="mx-auto max-w-6xl scroll-mt-24 px-4 pb-24">
        <div className="flex flex-wrap items-end justify-between gap-6 border-b border-ink-900/10 pb-6">
          <div>
            <p className="eyebrow">The Collection</p>
            <h2 className="mt-2 font-serif text-4xl">이번 시즌 열대과일</h2>
          </div>
          <div className="flex gap-5" role="tablist">
            {FILTERS.map((f) => (
              <button
                key={f.key}
                role="tab"
                aria-selected={filter === f.key}
                onClick={() => setFilter(f.key)}
                className={`pb-1 text-[11px] uppercase tracking-[0.2em] ${filter === f.key ? "border-b border-ink-950 text-ink-950" : "text-ink-900/40 hover:text-ink-950"}`}
              >
                {f.label}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-10 grid grid-cols-2 gap-x-4 gap-y-12 sm:gap-x-6 lg:grid-cols-3">
          {shown.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
        </div>
        {ready && shown.length === 0 && <p className="py-20 text-center font-serif text-xl italic text-ink-600">해당하는 상품이 없습니다.</p>}
      </section>

      <section className="border-y border-ink-900/10 bg-white/50">
        <div className="mx-auto grid max-w-6xl gap-10 px-4 py-20 sm:grid-cols-3">
          {PROMISES.map((x) => (
            <div key={x.no}>
              <p className="font-serif text-3xl italic text-gold-600">{x.no}</p>
              <h3 className="mt-3 font-serif text-xl">{x.title}</h3>
              <p className="mt-2 text-sm leading-6 text-ink-600">{x.text}</p>
            </div>
          ))}
        </div>
      </section>

      <section id="story" className="mx-auto grid max-w-6xl scroll-mt-24 items-center gap-12 px-4 py-24 md:grid-cols-2">
        <img src="/slides/3.jpg" alt="코코넛 스무디볼" className="aspect-[4/5] w-full object-cover" loading="lazy" />
        <div>
          <p className="eyebrow">Our Story</p>
          <h2 className="mt-3 font-serif text-4xl leading-tight">
            바다를 건너온
            <br />
            <em>한 마리 고래</em>의 약속
          </h2>
          <p className="mt-6 text-sm leading-7 text-ink-600">
            블루웨일은 필리핀의 망고 농장, 코스타리카의 파인애플 밭, 하와이의 파파야 과수원과 직접 계약합니다. 중간 유통을 줄인 만큼, 과일이 나무에 머무는 시간을 늘렸습니다.
          </p>
          <img src="/brand/mascot.webp" alt="" className="mt-10 h-36 w-auto" loading="lazy" />
        </div>
      </section>
    </>
  );
}

function ProductCard({ p }: { p: Product }) {
  const { addToCart, today } = useStore();
  const [kg, setKg] = useState(1);
  const [added, setAdded] = useState(false);
  const status = saleStatus(p, today);
  const buyable = status === "onsale";

  return (
    <article className="group flex flex-col">
      <div className="relative aspect-[4/5] overflow-hidden bg-gold-300/30">
        <Link href={`/product/${p.id}`} className="block h-full" aria-label={`${p.name} 상세 보기`}>
          <FruitImage p={p} className={`h-full w-full text-7xl transition duration-[1200ms] ease-out group-hover:scale-105 ${buyable ? "" : "opacity-60 grayscale"}`} />
        </Link>
        <span className="absolute left-3 top-3 bg-ivory/90 px-2 py-1 text-[10px] uppercase tracking-[0.2em] text-ink-900">{LABEL[status]}</span>
        {buyable && (
          <button
            onClick={() => {
              addToCart(p.id, kg);
              setAdded(true);
              setTimeout(() => setAdded(false), 1400);
            }}
            className="absolute inset-x-3 bottom-3 bg-ivory/95 py-3 text-[10px] uppercase tracking-[0.2em] sm:text-[11px] sm:tracking-[0.25em] text-ink-950 transition hover:bg-ink-950 hover:text-ivory sm:translate-y-[calc(100%+12px)] sm:group-hover:translate-y-0 sm:focus:translate-y-0"
          >
            {added ? "Added ✓" : "Add to Bag"}
          </button>
        )}
      </div>

      <div className="mt-4 flex flex-1 flex-col">
        <p className="text-[10px] uppercase tracking-[0.25em] text-ink-900/50">{p.origin}</p>
        <h3 className="mt-1 font-serif text-xl">
          <Link href={`/product/${p.id}`} className="underline-offset-4 hover:underline">{p.name}</Link>
        </h3>
        <p className="mt-1 line-clamp-2 text-xs leading-5 text-ink-600">{p.description}</p>
        <p className="mt-2 text-sm">
          {won(p.pricePerKg)} <span className="text-ink-900/50">/ kg</span>
        </p>
        <p className="mt-1 text-[11px] text-ink-900/40">
          {p.saleStart.replaceAll("-", ".")} — {p.saleEnd.replaceAll("-", ".")}
        </p>
        {buyable && (
          <div className="mt-3 flex flex-wrap gap-1.5" role="radiogroup" aria-label="수량(kg)">
            {[1, 2, 3, 5].map((n) => (
              <button
                key={n}
                role="radio"
                aria-checked={kg === n}
                onClick={() => setKg(n)}
                className={`min-w-10 border px-2 py-1 text-[11px] transition ${kg === n ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20 hover:border-ink-950"}`}
              >
                {n}kg
              </button>
            ))}
          </div>
        )}
      </div>
    </article>
  );
}

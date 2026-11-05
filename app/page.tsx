"use client";

import { useState } from "react";
import { saleStatus, useStore, won, type Product, type SaleStatus } from "./store";

const BADGE: Record<SaleStatus, { label: string; cls: string }> = {
  onsale: { label: "판매중", cls: "bg-lagoon-400 text-ocean-950" },
  upcoming: { label: "판매예정", cls: "bg-amber-300 text-ocean-950" },
  ended: { label: "판매종료", cls: "bg-ocean-900/20 text-ocean-900/60" },
};

export default function Home() {
  const { products, ready, today } = useStore();
  const order: SaleStatus[] = ["onsale", "upcoming", "ended"];
  const sorted = ready ? [...products].sort((a, b) => order.indexOf(saleStatus(a, today)) - order.indexOf(saleStatus(b, today))) : [];

  return (
    <>
      <section className="relative overflow-hidden bg-gradient-to-b from-ocean-950 via-ocean-900 to-ocean-600 text-white">
        <div className="mx-auto max-w-6xl px-4 pb-24 pt-16 sm:pt-24">
          <p className="text-sm font-semibold tracking-[0.3em] text-lagoon-300">FROM THE DEEP BLUE</p>
          <h1 className="mt-3 text-4xl font-extrabold leading-tight sm:text-5xl">
            바다 건너 온 열대의 맛,
            <br />
            고래가 실어 나릅니다 🐋
          </h1>
          <p className="mt-4 max-w-lg text-white/70">
            필리핀, 코스타리카, 하와이… 산지에서 완숙된 열대과일을 콜드체인으로 직송합니다. 모든 상품은 kg 단위로 판매돼요.
          </p>
        </div>
        <svg className="absolute bottom-0 left-0 w-full text-sand-50" viewBox="0 0 1440 80" preserveAspectRatio="none" aria-hidden>
          <path fill="currentColor" d="M0,40 C240,80 480,0 720,32 C960,64 1200,10 1440,40 L1440,80 L0,80 Z" />
        </svg>
      </section>

      <section className="mx-auto max-w-6xl px-4 py-12">
        <h2 className="mb-6 text-2xl font-bold">이번 시즌 열대과일</h2>
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {sorted.map((p) => (
            <ProductCard key={p.id} p={p} />
          ))}
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

  return (
    <article className="flex flex-col rounded-2xl bg-white p-5 shadow-sm ring-1 ring-ocean-900/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between">
        <div className="grid h-20 w-20 place-items-center rounded-2xl bg-gradient-to-br from-lagoon-300/40 to-ocean-600/10 text-5xl">
          {p.emoji}
        </div>
        <span className={`rounded-full px-2.5 py-1 text-xs font-bold ${BADGE[status].cls}`}>{BADGE[status].label}</span>
      </div>
      <h3 className="mt-4 text-lg font-bold">{p.name}</h3>
      <p className="text-xs text-ocean-600">📍 {p.origin}</p>
      <p className="mt-2 flex-1 text-sm text-ocean-900/70">{p.description}</p>
      <p className="mt-3 text-xs text-ocean-900/50">
        판매기간 {p.saleStart} ~ {p.saleEnd}
      </p>
      <p className="mt-1 text-xl font-extrabold text-ocean-800">
        {won(p.pricePerKg)} <span className="text-sm font-medium text-ocean-900/50">/ kg</span>
      </p>
      <div className="mt-4 flex gap-2">
        <select
          className="field w-24"
          value={kg}
          onChange={(e) => setKg(Number(e.target.value))}
          disabled={status !== "onsale"}
          aria-label="수량(kg)"
        >
          {[1, 2, 3, 5, 10].map((n) => (
            <option key={n} value={n}>{n}kg</option>
          ))}
        </select>
        <button
          className="btn flex-1"
          disabled={status !== "onsale"}
          onClick={() => {
            addToCart(p.id, kg);
            setAdded(true);
            setTimeout(() => setAdded(false), 1200);
          }}
        >
          {status !== "onsale" ? BADGE[status].label : added ? "담았어요 ✓" : `장바구니 · ${won(p.pricePerKg * kg)}`}
        </button>
      </div>
    </article>
  );
}

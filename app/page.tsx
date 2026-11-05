"use client";

import { useState } from "react";
import HeroSlider from "./hero-slider";
import { FruitImage, saleStatus, useStore, won, type Product, type SaleStatus } from "./store";

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
      <HeroSlider />

      <section id="products" className="mx-auto max-w-6xl scroll-mt-16 px-4 py-12">
        <div className="mb-6 flex items-end gap-3">
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img src="/brand/whale-flower.webp" alt="" className="h-20 w-auto" />
          <div>
            <p className="text-xs font-semibold tracking-[0.3em] text-brand">FROM THE DEEP BLUE</p>
            <h2 className="mt-1 text-2xl font-bold">이번 시즌 열대과일</h2>
          </div>
        </div>
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
    <article className="group flex flex-col overflow-hidden rounded-2xl bg-white shadow-sm ring-1 ring-ocean-900/5 transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="relative aspect-[4/3] overflow-hidden">
        <FruitImage p={p} className={`h-full w-full text-7xl transition duration-500 group-hover:scale-105 ${status !== "onsale" ? "grayscale-[60%]" : ""}`} />
        <span className={`absolute right-3 top-3 rounded-full px-2.5 py-1 text-xs font-bold shadow ${BADGE[status].cls}`}>{BADGE[status].label}</span>
      </div>
      <div className="flex flex-1 flex-col p-5">
      <h3 className="text-lg font-bold">{p.name}</h3>
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
      </div>
    </article>
  );
}

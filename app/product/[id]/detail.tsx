"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { FruitImage, saleStatus, STATUS_EN, useStore, won } from "../../store";

const KG_PRESETS = [1, 2, 3, 5];

export default function ProductDetail({ id }: { id: number }) {
  const { ready, today, products, addToCart } = useStore();
  const router = useRouter();
  const [kg, setKg] = useState(1);
  const [added, setAdded] = useState(false);

  if (!ready) return <div className="min-h-[60vh]" />;

  const p = products.find((x) => x.id === id);
  if (!p)
    return (
      <div className="px-4 py-32 text-center">
        <p className="eyebrow">Not Found</p>
        <p className="mt-4 font-serif text-3xl">찾으시는 상품이 없습니다.</p>
        <Link href="/#products" className="btn mt-8 inline-block">컬렉션으로 돌아가기</Link>
      </div>
    );

  const status = saleStatus(p, today);
  const buyable = status === "onsale";
  const related = products.filter((x) => x.id !== p.id && saleStatus(x, today) === "onsale").slice(0, 4);

  function add(goToBag: boolean) {
    addToCart(p!.id, kg);
    if (goToBag) return router.push("/cart");
    setAdded(true);
    setTimeout(() => setAdded(false), 1400);
  }

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <nav className="mb-8 text-[11px] uppercase tracking-[0.2em] text-ink-900/50" aria-label="breadcrumb">
        <Link href="/" className="hover:text-ink-950">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/#products" className="hover:text-ink-950">Collection</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-950">{p.name}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="relative aspect-[4/5] overflow-hidden bg-gold-300/30">
            <FruitImage p={{ ...p, image: p.image.replace("w=640&h=480", "w=1200&h=1500") }} className={`h-full w-full text-[8rem] ${buyable ? "" : "opacity-60 grayscale"}`} />
            <span className="absolute left-4 top-4 bg-ivory/90 px-2.5 py-1 text-[10px] uppercase tracking-[0.2em]">{STATUS_EN[status]}</span>
          </div>
        </div>

        <div>
          <p className="eyebrow">{p.origin}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{p.name}</h1>
          <p className="mt-4 text-lg">
            {won(p.pricePerKg)} <span className="text-sm text-ink-900/50">/ kg</span>
          </p>
          <p className="mt-6 text-sm leading-7 text-ink-600">{p.description}</p>

          <dl className="mt-8 grid grid-cols-2 border-y border-ink-900/10 text-sm">
            <div className="border-r border-ink-900/10 py-4 pr-4">
              <dt className="eyebrow">Origin</dt>
              <dd className="mt-1">{p.origin}</dd>
            </div>
            <div className="py-4 pl-4">
              <dt className="eyebrow">Season</dt>
              <dd className="mt-1">
                {p.saleStart.replaceAll("-", ".")} — {p.saleEnd.replaceAll("-", ".")}
              </dd>
            </div>
          </dl>

          {buyable ? (
            <>
              <p className="eyebrow mt-8">Quantity</p>
              <div className="mt-3 flex flex-wrap items-center gap-2">
                {KG_PRESETS.map((n) => (
                  <button
                    key={n}
                    onClick={() => setKg(n)}
                    aria-pressed={kg === n}
                    className={`min-w-14 border px-3 py-2 text-xs transition ${kg === n ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20 hover:border-ink-950"}`}
                  >
                    {n}kg
                  </button>
                ))}
                <div className="flex items-center border border-ink-900/20">
                  <button className="h-9 w-9 hover:bg-ink-900/5" onClick={() => setKg((k) => Math.max(1, k - 1))} aria-label="1kg 빼기">−</button>
                  <span className="w-12 text-center text-sm">{kg}kg</span>
                  <button className="h-9 w-9 hover:bg-ink-900/5" onClick={() => setKg((k) => Math.min(50, k + 1))} aria-label="1kg 더하기">+</button>
                </div>
              </div>

              <div className="mt-8 flex items-baseline justify-between border-t border-ink-900/10 pt-6">
                <span className="eyebrow">Total</span>
                <span className="font-serif text-3xl">{won(p.pricePerKg * kg)}</span>
              </div>
              <div className="mt-6 grid gap-3 sm:grid-cols-2">
                <button className="btn" onClick={() => add(false)}>{added ? "Added ✓" : "Add to Bag"}</button>
                <button
                  className="border border-ink-950 px-5 py-3 text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-ink-950 hover:text-ivory"
                  onClick={() => add(true)}
                >
                  Buy Now
                </button>
              </div>
            </>
          ) : (
            <p className="mt-8 border border-ink-900/15 bg-white/60 px-5 py-4 text-sm text-ink-600">
              {status === "upcoming"
                ? `${p.saleStart.replaceAll("-", ".")}부터 판매가 시작됩니다.`
                : "이번 시즌 판매가 종료되었습니다. 다음 시즌에 다시 만나요."}
            </p>
          )}

          <div className="mt-10 divide-y divide-ink-900/10 border-y border-ink-900/10">
            {[
              ["Tasting Notes", `${p.name}은(는) 산지에서 충분히 익힌 뒤 수확합니다. 받으신 후 상온에서 하루 정도 후숙하면 향이 더 진해집니다.`],
              ["Storage", "직사광선을 피해 서늘한 곳에 보관하고, 자른 과일은 밀폐 용기에 담아 냉장 보관 후 2일 안에 드세요."],
              ["Shipping & Returns", "결제 후 2–4일 내 아이스박스로 출고됩니다. 5만원 이상 무료배송, 당도 미달·파손 시 사진과 함께 문의 주시면 재배송해 드립니다."],
            ].map(([title, body], n) => (
              <details key={title} className="group py-4" open={n === 0}>
                <summary className="flex cursor-pointer list-none items-center justify-between text-[11px] uppercase tracking-[0.25em]">
                  {title}
                  <span className="text-lg transition group-open:rotate-45">+</span>
                </summary>
                <p className="mt-3 text-sm leading-7 text-ink-600">{body}</p>
              </details>
            ))}
          </div>
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-24">
          <p className="eyebrow">You May Also Like</p>
          <h2 className="mt-2 font-serif text-3xl">함께 보면 좋은 과일</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {related.map((r) => (
              <Link key={r.id} href={`/product/${r.id}`} className="group">
                <div className="aspect-[4/5] overflow-hidden bg-gold-300/30">
                  <FruitImage p={r} className="h-full w-full text-6xl transition duration-[1200ms] group-hover:scale-105" />
                </div>
                <p className="mt-3 text-[10px] uppercase tracking-[0.25em] text-ink-900/50">{r.origin}</p>
                <p className="mt-1 font-serif text-lg">{r.name}</p>
                <p className="text-sm">{won(r.pricePerKg)} <span className="text-ink-900/50">/ kg</span></p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

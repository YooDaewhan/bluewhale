"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { EXTRAS, OPTION_NOTES, WRAPS } from "../../basket-data";
import { FruitImage, useStore, won } from "../../store";

export default function BasketDetail({ id }: { id: string }) {
  const { ready, baskets, products } = useStore();
  if (!ready) return <div className="min-h-[60vh]" />;

  const b = baskets.find((x) => x.id === id && x.active);
  if (!b)
    return (
      <div className="px-4 py-32 text-center">
        <p className="eyebrow">Not Found</p>
        <p className="mt-4 font-serif text-3xl">찾으시는 바구니가 없습니다.</p>
        <Link href="/#products" className="btn mt-8 inline-block">바구니 보러가기</Link>
      </div>
    );

  const fruits = b.items.map((i) => ({ ...i, p: products.find((p) => p.id === i.productId) }));
  const others = baskets.filter((x) => x.active && x.id !== b.id);

  return (
    <div className="mx-auto max-w-6xl px-4 py-8 sm:py-12">
      <nav className="mb-8 text-[11px] uppercase tracking-[0.2em] text-ink-900/50" aria-label="breadcrumb">
        <Link href="/" className="hover:text-ink-950">Home</Link>
        <span className="mx-2">/</span>
        <Link href="/#products" className="hover:text-ink-950">Gift Basket</Link>
        <span className="mx-2">/</span>
        <span className="text-ink-950">{b.ko}</span>
      </nav>

      <div className="grid gap-10 md:grid-cols-[1.15fr_1fr] md:gap-16">
        <div className="md:sticky md:top-24 md:self-start">
          <div className="aspect-[4/5] overflow-hidden bg-gold-300/30">
            {b.image ? (
              <img src={b.image.replace("w=900&h=1100", "w=1200&h=1500")} alt={`${b.ko} 과일 바구니`} className="h-full w-full object-cover" />
            ) : (
              <div className="grid h-full place-items-center text-[8rem]">🧺</div>
            )}
          </div>
        </div>

        <div>
          <p className="eyebrow">{b.en || "Gift Basket"}</p>
          <h1 className="mt-3 font-serif text-4xl leading-tight sm:text-5xl">{b.ko}</h1>
          <p className="mt-4 font-serif text-3xl">{won(b.price)}</p>
          {b.addons?.length > 0 && (
            <p className="mt-2 text-sm text-gold-600">선택 옵션: {b.addons.map((a) => `${a.name} +${won(a.price)}`).join(", ")}</p>
          )}
          {b.desc && <p className="mt-6 text-sm leading-7 text-ink-600">{b.desc}</p>}

          <dl className="mt-8 grid grid-cols-3 border-y border-ink-900/10 text-sm">
            {[
              ["Category", b.category || "-"],
              ["Seasonal Fruits", b.fruitCount || (b.category === "컵과일" ? "손질 과일" : "-")],
              ["Ribbon", "문구 무료"],
            ].map(([k, v], n) => (
              <div key={k} className={`py-4 ${n ? "border-l border-ink-900/10 pl-4" : "pr-4"}`}>
                <dt className="eyebrow">{k}</dt>
                <dd className="mt-1">{v}</dd>
              </div>
            ))}
          </dl>

          {/* composition: each fruit with origin, linked to its own page */}
          <p className="eyebrow mt-10">What&apos;s Inside</p>
          <p className="mt-3 text-sm leading-7 text-ink-600">{b.fruitCount ? <>그날 입고된 가장 좋은 제철과일 <b className="font-semibold text-ink-950">{b.fruitCount}</b>로 직접 구성합니다.</> : "그날 입고된 가장 좋은 제철과일로 직접 손질해 담습니다."}</p>
          {(fruits.length > 0 || b.note) && (
          <ul className="mt-3 divide-y divide-ink-900/10 border-y border-ink-900/10">
            {fruits.map(({ productId, kg, p }) => (
              <li key={productId}>
                {p ? (
                  <Link href={`/product/${p.id}`} className="group flex items-center gap-4 py-3">
                    <FruitImage p={p} className="h-14 w-14 shrink-0 text-2xl" />
                    <div className="min-w-0 flex-1">
                      <p className="font-serif text-lg group-hover:underline">{p.name}</p>
                      <p className="text-[11px] text-ink-900/50">📍 {p.origin}</p>
                    </div>
                    <span className="text-sm">{kg}kg</span>
                  </Link>
                ) : (
                  <p className="py-3 text-sm text-ink-900/40">판매 종료된 과일 · {kg}kg</p>
                )}
              </li>
            ))}
            {b.note && (
              <li className="flex items-center gap-4 py-3">
                <span className="grid h-14 w-14 shrink-0 place-items-center bg-gold-300/30 text-2xl">✿</span>
                <p className="flex-1 text-sm">{b.note}</p>
              </li>
            )}
          </ul>
          )}
          <p className="mt-2 text-[11px] text-ink-900/40">시즌과 작황에 따라 일부 과일은 같은 등급의 다른 과일로 대체될 수 있습니다.</p>

          <div className="mt-8 grid gap-3 sm:grid-cols-2">
            <Link href={`/basket#${b.id}`} className="btn text-center">이 바구니로 주문서 작성</Link>
            <Link href="/basket" className="border border-ink-950 px-5 py-3 text-center text-xs font-semibold uppercase tracking-[0.2em] transition hover:bg-ink-950 hover:text-ivory">
              여러 바구니 함께 주문
            </Link>
          </div>

          <div className="mt-10 divide-y divide-ink-900/10 border-y border-ink-900/10">
            {[
              ["포장 옵션", `${WRAPS.map((w) => `${w.name}${w.price ? ` (+${won(w.price)})` : ""}`).join(", ")} 중 선택, ${EXTRAS.map((x) => `${x.name} 추가 +${won(x.price)}`).join(", ")}. ${OPTION_NOTES.join(" ")}`],
              ["픽업 안내", "주문서에서 픽업 날짜와 시간을 고르면 당일 아침 직접 담아 둡니다. 결제는 픽업 시 매장에서 진행됩니다."],
              ["보관 방법", "받으신 후 직사광선을 피해 서늘한 곳에 두고, 자른 과일은 냉장 보관 후 2일 안에 드세요."],
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

      {others.length > 0 && (
        <section className="mt-24">
          <p className="eyebrow">Other Baskets</p>
          <h2 className="mt-2 font-serif text-3xl">다른 바구니 보기</h2>
          <div className="mt-8 grid grid-cols-2 gap-x-4 gap-y-8 sm:gap-x-6 lg:grid-cols-4">
            {others.map((o) => (
              <Link key={o.id} href={`/gift/${o.id}`} className="group">
                <div className="aspect-[4/5] overflow-hidden bg-gold-300/30">
                  {o.image ? <img src={o.image} alt="" loading="lazy" className="h-full w-full object-cover transition duration-[1200ms] group-hover:scale-105" /> : <div className="grid h-full place-items-center text-6xl">🧺</div>}
                </div>
                <p className="mt-3 font-serif text-lg">{o.ko}</p>
                <p className="text-sm">{won(o.price)}</p>
              </Link>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

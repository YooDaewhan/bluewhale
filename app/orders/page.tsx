"use client";

import Link from "next/link";
import { useState } from "react";
import { ORDER_STEPS, type Order } from "../order-data";
import { basketName, useStore, won } from "../store";

export default function MyOrdersPage() {
  const { ready, user, orders, reservations, baskets } = useStore();

  if (!ready) return <div className="min-h-[60vh]" />;
  if (!user)
    return (
      <div className="px-4 py-32 text-center">
        <p className="eyebrow">My Orders</p>
        <p className="mt-4 font-serif text-3xl">로그인 후 주문 내역을 확인할 수 있어요.</p>
        <Link href="/login" className="btn mt-8 inline-block">로그인</Link>
      </div>
    );

  const mine = orders.filter((o) => o.userId === user.id).sort((a, b) => b.id.localeCompare(a.id));
  // reservations have no account link (mock), so match by the customer's name
  const myPickups = reservations.filter((r) => r.name === user.name).sort((a, b) => b.pickupDate.localeCompare(a.pickupDate));

  return (
    <div className="mx-auto max-w-4xl px-4 py-12">
      <p className="eyebrow">My Orders</p>
      <h1 className="mt-2 font-serif text-4xl">{user.name}님의 주문</h1>

      <section className="mt-10">
        <h2 className="border-b border-ink-900/10 pb-3 text-[11px] uppercase tracking-[0.25em] text-ink-900/60">택배 주문 · {mine.length}</h2>
        {mine.length === 0 && (
          <p className="py-16 text-center text-sm text-ink-900/40">
            아직 주문 내역이 없습니다. <Link href="/#fruits" className="underline">과일 보러가기</Link>
          </p>
        )}
        <ul className="mt-4 space-y-4">
          {mine.map((o) => <OrderCard key={o.id} o={o} />)}
        </ul>
      </section>

      {myPickups.length > 0 && (
        <section className="mt-14">
          <h2 className="border-b border-ink-900/10 pb-3 text-[11px] uppercase tracking-[0.25em] text-ink-900/60">바구니 픽업 예약 · {myPickups.length}</h2>
          <ul className="mt-4 space-y-3">
            {myPickups.map((r) => (
              <li key={r.id} className="flex flex-wrap items-center justify-between gap-3 border border-ink-900/10 bg-white p-5 text-sm">
                <div>
                  <p className="font-serif text-xl">{r.pickupDate.replaceAll("-", ".")} {r.pickupTime} 픽업</p>
                  <p className="text-ink-600">{r.items.map((l) => `${basketName(baskets, l.size)} × ${l.qty}`).join(", ")} · “{r.message}”</p>
                </div>
                <div className="text-right">
                  <span className="bg-gold-300/70 px-2 py-0.5 text-xs">{r.status}</span>
                  <p className="mt-1">{won(r.total)}</p>
                </div>
              </li>
            ))}
          </ul>
        </section>
      )}
    </div>
  );
}

function OrderCard({ o }: { o: Order }) {
  const [copied, setCopied] = useState(false);
  const step = ORDER_STEPS.indexOf(o.status);

  return (
    <li className="border border-ink-900/10 bg-white p-6">
      <div className="flex flex-wrap items-baseline justify-between gap-2">
        <p className="text-xs text-ink-900/50">
          {o.orderedAt.replaceAll("-", ".")} · <span className="font-mono">{o.id}</span>
        </p>
        <p className="font-serif text-2xl">{won(o.total)}</p>
      </div>
      <p className="mt-2 font-serif text-xl">{o.lines.map((l) => `${l.emoji} ${l.name} ${l.kg}kg`).join(" · ")}</p>

      <ol className="mt-6 grid grid-cols-3 text-center text-xs">
        {ORDER_STEPS.map((s, i) => (
          <li key={s} className="relative">
            <span className={`absolute left-0 right-0 top-[7px] h-px ${i === 0 ? "left-1/2" : ""} ${i === ORDER_STEPS.length - 1 ? "right-1/2" : ""} ${i <= step ? "bg-ink-950" : "bg-ink-900/15"}`} />
            <span className={`relative mx-auto block h-4 w-4 rounded-full border-2 ${i <= step ? "border-ink-950 bg-ink-950" : "border-ink-900/20 bg-white"}`} />
            <span className={`mt-2 block ${i === step ? "font-semibold" : i < step ? "" : "text-ink-900/40"}`}>{s}</span>
          </li>
        ))}
      </ol>

      {o.tracking ? (
        <div className="mt-6 flex flex-wrap items-center justify-between gap-3 bg-ivory px-4 py-3">
          <div>
            <p className="eyebrow">Tracking</p>
            <p className="mt-1 text-sm">
              {o.carrier} <span className="font-mono text-base">{o.tracking}</span>
            </p>
            <p className="text-[11px] text-ink-900/40">{o.shippedAt?.replaceAll("-", ".")} 발송</p>
          </div>
          <button
            className="border border-ink-950 px-4 py-2 text-xs hover:bg-ink-950 hover:text-ivory"
            onClick={() => {
              navigator.clipboard?.writeText(o.tracking!).catch(() => {});
              setCopied(true);
              setTimeout(() => setCopied(false), 1200);
            }}
          >
            {copied ? "복사됨 ✓" : "송장번호 복사"}
          </button>
        </div>
      ) : (
        <p className="mt-6 bg-ivory px-4 py-3 text-sm text-ink-600">상품을 준비하고 있어요. 발송되면 이곳에 송장번호가 표시됩니다.</p>
      )}

      <p className="mt-4 text-xs text-ink-900/50">
        {o.name} · {o.address} · {o.message}
      </p>
    </li>
  );
}

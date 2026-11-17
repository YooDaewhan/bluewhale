"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import type { Order } from "../../order-data";
import { useStore, won } from "../../store";

// Toss redirects here with ?paymentKey&orderId&amount; the server checks the amount and confirms with Toss.
export default function PaySuccess() {
  const { ready, confirmPayment, clearCart } = useStore();
  const [order, setOrder] = useState<Order | null>(null);
  const [error, setError] = useState("");
  const sent = useRef(false); // confirm exactly once (dev StrictMode re-runs effects)

  useEffect(() => {
    if (!ready || sent.current) return; // ready = tenant resolved, so the call goes to the right store
    sent.current = true;
    const q = new URLSearchParams(location.search);
    confirmPayment({ paymentKey: q.get("paymentKey") ?? "", orderId: q.get("orderId") ?? "", amount: Number(q.get("amount")) })
      .then((o) => {
        setOrder(o);
        clearCart();
      })
      .catch((e: Error) => setError(e.message));
  }, [ready, confirmPayment, clearCart]);

  if (error)
    return (
      <div className="px-4 py-24 text-center">
        <p className="font-serif text-2xl">결제를 완료하지 못했습니다</p>
        <p className="mt-2 text-sm text-coral-500">{error}</p>
        <Link href="/cart" className="btn mt-6 inline-block">장바구니로 돌아가기</Link>
      </div>
    );

  if (!order) return <p className="px-4 py-24 text-center text-ink-900/60">결제를 확인하고 있어요…</p>;

  return (
    <div className="mx-auto max-w-lg px-4 py-16 text-center">
      <img src="/brand/mascot.webp" alt="" className="mx-auto h-48 w-auto" />
      <h1 className="mt-4 font-serif text-3xl">Thank you — 결제가 완료되었습니다</h1>
      <p className="mt-1 text-sm text-ink-900/60">주문번호를 보관해 주세요. 발송되면 연락처로 송장번호를 안내해 드립니다.</p>
      <dl className="mt-8 space-y-2 rounded-sm bg-white p-6 text-left text-sm border border-ink-900/10">
        {[
          ["주문번호", order.id],
          ["받는 분", `${order.name} · ${order.phone}`],
          ["배송지", order.address],
          ["배송 메시지", order.message],
          ["상품", order.lines.map((l) => `${l.emoji} ${l.name} ${l.kg}kg`).join(", ")],
          ["결제금액", won(order.total)],
        ].map(([k, v]) => (
          <div key={k} className="flex gap-4">
            <dt className="w-24 shrink-0 text-ink-900/50">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
      <div className="mt-6 flex justify-center gap-3">
        <Link href="/" className="btn">쇼핑 계속하기</Link>
      </div>
    </div>
  );
}

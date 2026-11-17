"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { FREE_SHIPPING_OVER, shippingFee } from "../order-data";
import { FruitImage, useStore, won, type Pay } from "../store";

const MESSAGES = ["문 앞에 놓아주세요", "경비실에 맡겨주세요", "배송 전 연락 부탁드려요", "파손 주의 부탁드립니다", "직접 입력"];

export default function CartPage() {
  const { ready, products, cart, setKg, addOrder } = useStore();
  const [error, setError] = useState("");
  const [msgPreset, setMsgPreset] = useState(MESSAGES[0]);
  const [pay, setPay] = useState<(Pay & { name: string; phone: string }) | null>(null);

  const lines = cart
    .map((i) => ({ ...i, p: products.find((p) => p.id === i.productId) }))
    .filter((l) => l.p);
  const subtotal = lines.reduce((s, l) => s + l.p!.pricePerKg * l.kg, 0);
  const shipping = shippingFee(subtotal);
  const total = subtotal + shipping;

  // the server prices the order from its own product table; `total` above is only the preview
  async function submit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const f = new FormData(e.currentTarget);
    setError("");
    try {
      const p = await addOrder({
        name: String(f.get("name")),
        phone: String(f.get("phone")),
        address: `(${f.get("zip")}) ${f.get("addr1")} ${f.get("addr2")}`.trim(),
        message: msgPreset === "직접 입력" ? String(f.get("customMsg") || "-") : msgPreset,
        lines: lines.map((l) => ({ productId: l.p!.id, kg: l.kg })),
      });
      setPay({ ...p, name: String(f.get("name")), phone: String(f.get("phone")) });
    } catch (err) {
      setError((err as Error).message);
    }
  }

  if (!ready) return null;

  if (lines.length === 0)
    return (
      <div className="px-4 py-24 text-center">
        <img src="/brand/whale-flower.webp" alt="" className="mx-auto h-40 w-auto" />
        <p className="mt-3 text-ink-900/60">장바구니가 비어 있어요.</p>
        <Link href="/" className="btn mt-6 inline-block">열대과일 보러가기</Link>
      </div>
    );

  return (
    <div className="mx-auto grid max-w-6xl gap-8 px-4 py-10 lg:grid-cols-[1fr_380px]">
      <section className="min-w-0">
        <h1 className="mb-4 font-serif text-3xl">장바구니</h1>
        <ul className="space-y-3">
          {lines.map(({ p, kg }) => (
            <li key={p!.id} className="flex flex-wrap items-center gap-x-4 gap-y-3 rounded-sm bg-white p-4 border border-ink-900/10">
              <FruitImage p={p!} className="h-16 w-16 shrink-0 rounded-sm text-3xl" />
              <div className="min-w-0 flex-1">
                <Link href={`/product/${p!.id}`} className="font-serif text-lg hover:underline">{p!.name}</Link>
                <p className="text-xs text-ink-900/50">{won(p!.pricePerKg)} / kg · {p!.origin}</p>
              </div>
              {/* mobile: drops to its own row under the name */}
              <div className="flex w-full items-center justify-between gap-4 sm:w-auto">
                <div className="flex items-center gap-1">
                  <button className="h-8 w-8 rounded-full bg-ink-900/5" disabled={!!pay} onClick={() => setKg(p!.id, kg - 1)} aria-label="1kg 빼기">−</button>
                  <span className="w-12 text-center font-semibold">{kg}kg</span>
                  <button className="h-8 w-8 rounded-full bg-ink-900/5" disabled={!!pay} onClick={() => setKg(p!.id, kg + 1)} aria-label="1kg 더하기">+</button>
                </div>
                <p className="whitespace-nowrap text-right font-bold sm:w-24">{won(p!.pricePerKg * kg)}</p>
              </div>
            </li>
          ))}
        </ul>
      </section>

      <aside>
        <div className="sticky top-20 rounded-sm bg-white p-6 border border-ink-900/10">
          <h2 className="font-serif text-xl">주문서</h2>
          <div className="mt-3 space-y-1 border-b border-ink-900/10 pb-3 text-sm">
            <Row k="상품금액" v={won(subtotal)} />
            <Row k="배송비" v={shipping ? won(shipping) : "무료"} />
            <p className="text-xs text-ink-900/40">{won(FREE_SHIPPING_OVER)} 이상 무료배송 · 아이스박스 포장</p>
            <Row k="결제예정" v={won(total)} bold />
          </div>

          {pay ? <TossPay pay={pay} onBack={() => setPay(null)} /> : (
          <form onSubmit={submit} className="mt-4 space-y-2.5">
              <input name="name" className="field" placeholder="받는 분" required />
              <input name="phone" className="field" type="tel" placeholder="연락처 (010-0000-0000)" pattern="[0-9\-]{9,13}" required />
              <div className="flex gap-2">
                <input name="zip" className="field w-28" placeholder="우편번호" inputMode="numeric" pattern="[0-9]{5}" required />
                <span className="self-center text-xs text-ink-900/40">5자리</span>
              </div>
              <input name="addr1" className="field" placeholder="기본 주소" required />
              <input name="addr2" className="field" placeholder="상세 주소 (동·호수)" />
              <select className="field" value={msgPreset} onChange={(e) => setMsgPreset(e.target.value)} aria-label="배송 메시지">
                {MESSAGES.map((m) => <option key={m}>{m}</option>)}
              </select>
              {msgPreset === "직접 입력" && (
                <textarea name="customMsg" className="field" rows={2} maxLength={100} placeholder="배송 기사님께 전할 메시지 (100자)" />
              )}
              <button className="btn w-full py-3">{won(total)} 주문하기</button>
            </form>
          )}
          {error && <p className="mt-3 text-sm text-coral-500">{error}</p>}
        </div>
      </aside>
    </div>
  );
}

// ── 토스페이먼츠 결제위젯 (SDK v2) ──
type Widgets = {
  setAmount(a: { currency: "KRW"; value: number }): Promise<void>;
  renderPaymentMethods(o: { selector: string; variantKey: string }): Promise<unknown>;
  renderAgreement(o: { selector: string; variantKey: string }): Promise<unknown>;
  requestPayment(o: Record<string, string>): Promise<void>;
};
type TossSdk = ((clientKey: string) => { widgets(o: { customerKey: string }): Widgets }) & { ANONYMOUS: string };
declare global {
  interface Window {
    TossPayments?: TossSdk;
  }
}
const loadToss = () =>
  new Promise<TossSdk>((ok, no) => {
    if (window.TossPayments) return ok(window.TossPayments);
    const s = document.createElement("script");
    s.src = "https://js.tosspayments.com/v2/standard";
    s.onload = () => ok(window.TossPayments!);
    s.onerror = () => no(new Error("결제 모듈을 불러오지 못했습니다."));
    document.head.appendChild(s);
  });

function TossPay({ pay, onBack }: { pay: Pay & { name: string; phone: string }; onBack: () => void }) {
  const [widgets, setWidgets] = useState<Widgets | null>(null);
  const [error, setError] = useState("");
  const started = useRef(false); // dev StrictMode runs effects twice; the widget must render once

  useEffect(() => {
    if (started.current) return;
    started.current = true;
    (async () => {
      const toss = await loadToss();
      const w = toss(process.env.NEXT_PUBLIC_TOSS_CLIENT_KEY!).widgets({ customerKey: toss.ANONYMOUS });
      await w.setAmount({ currency: "KRW", value: pay.amount });
      await Promise.all([
        w.renderPaymentMethods({ selector: "#toss-methods", variantKey: "DEFAULT" }),
        w.renderAgreement({ selector: "#toss-agreement", variantKey: "AGREEMENT" }),
      ]);
      setWidgets(w);
    })().catch((e: Error) => setError(e.message));
  }, [pay.amount]);

  async function payNow() {
    setError("");
    try {
      await widgets!.requestPayment({
        orderId: pay.orderId,
        orderName: pay.orderName,
        customerName: pay.name,
        customerMobilePhone: pay.phone.replace(/\D/g, ""),
        successUrl: `${location.origin}/pay/success`,
        failUrl: `${location.origin}/pay/fail`,
      });
    } catch (e) {
      setError((e as Error).message); // e.g. the customer closed the payment window
    }
  }

  return (
    <div className="mt-4">
      <div id="toss-methods" />
      <div id="toss-agreement" />
      <button className="btn w-full py-3" disabled={!widgets} onClick={payNow}>{won(pay.amount)} 결제하기</button>
      <button className="mt-2 w-full text-sm text-ink-900/50 underline" onClick={onBack}>주문 정보 수정</button>
      {error && <p className="mt-3 text-sm text-coral-500">{error}</p>}
    </div>
  );
}

function Row({ k, v, bold }: { k: string; v: string; bold?: boolean }) {
  return (
    <div className={`flex justify-between ${bold ? "pt-2 text-base font-extrabold text-ink-800" : ""}`}>
      <span>{k}</span>
      <span>{v}</span>
    </div>
  );
}

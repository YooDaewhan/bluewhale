"use client";

import { useState } from "react";
import { CARRIERS, ORDER_STEPS, type Order, type OrderStatus } from "../order-data";
import { useStore, won } from "../store";
import ExcelButton from "./excel-button";

const STATUS_CLS: Record<OrderStatus, string> = {
  결제완료: "bg-gold-300/70 text-ink-950",
  발송완료: "bg-brand/15 text-brand",
  배송완료: "bg-ink-900/10 text-ink-900/50",
};

export default function ShippingAdmin() {
  const { orders } = useStore();
  const [filter, setFilter] = useState<OrderStatus | "all">("결제완료");
  const sorted = [...orders].sort((a, b) => b.id.localeCompare(a.id));
  const shown = sorted.filter((o) => filter === "all" || o.status === filter);
  const count = (s: OrderStatus) => orders.filter((o) => o.status === s).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Orders & Shipping</p>
          <h1 className="mt-1 font-serif text-3xl">주문 · 발송 관리</h1>
          <p className="text-sm text-ink-900/50">발송 버튼을 눌러 택배사와 송장번호를 입력하면 고객의 내 주문 화면에 바로 표시됩니다.</p>
        </div>
        <ExcelButton label="주문 엑셀 다운로드" />
      </div>

      <div className="mt-6 flex flex-wrap gap-2">
        {(["결제완료", "발송완료", "배송완료", "all"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`border px-4 py-2 text-sm transition ${filter === s ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/15 bg-white hover:border-ink-950"}`}
          >
            {s === "all" ? `전체 ${orders.length}` : `${s === "결제완료" ? "발송 대기" : s} ${count(s)}`}
          </button>
        ))}
      </div>

      <ul className="mt-6 space-y-3">
        {shown.length === 0 && <li className="border border-ink-900/10 bg-white py-16 text-center text-sm text-ink-900/40">해당 주문이 없습니다.</li>}
        {shown.map((o) => <OrderRow key={o.id} o={o} />)}
      </ul>
    </div>
  );
}

function OrderRow({ o }: { o: Order }) {
  const { shipOrder, setOrderStatus } = useStore();
  const [editing, setEditing] = useState(false);
  const [carrier, setCarrier] = useState(o.carrier ?? CARRIERS[0]);
  const [tracking, setTracking] = useState(o.tracking ?? "");
  const digits = tracking.replace(/\D/g, "");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (digits.length < 10) return; // input pattern shows the message
    shipOrder(o.id, carrier, tracking.trim());
    setEditing(false);
  }

  return (
    <li className="border border-ink-900/10 bg-white p-5">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div className="min-w-0">
          <div className="flex flex-wrap items-center gap-2">
            <span className={`px-2 py-0.5 text-xs ${STATUS_CLS[o.status]}`}>{o.status}</span>
            <span className="font-mono text-xs text-ink-900/50">{o.id}</span>
            <span className="text-xs text-ink-900/50">{o.orderedAt.replaceAll("-", ".")} 주문</span>
          </div>
          <p className="mt-2 font-serif text-xl">{o.lines.map((l) => `${l.emoji} ${l.name} ${l.kg}kg`).join(" · ")}</p>
          <p className="mt-1 text-sm">
            {o.name} <span className="text-ink-900/50">· {o.phone}</span>
          </p>
          <p className="text-sm text-ink-600">{o.address}</p>
          <p className="text-xs text-ink-900/50">배송 메시지: {o.message}</p>
        </div>
        <div className="text-right">
          <p className="font-serif text-2xl">{won(o.total)}</p>
          {o.tracking && !editing && (
            <p className="mt-1 text-xs text-ink-600">
              {o.carrier} <span className="font-mono">{o.tracking}</span>
              <br />
              <span className="text-ink-900/40">{o.shippedAt?.replaceAll("-", ".")} 발송</span>
            </p>
          )}
          <div className="mt-3 flex justify-end gap-2">
            {o.status === "결제완료" && !editing && (
              <button className="btn !py-2" onClick={() => setEditing(true)}>발송</button>
            )}
            {o.status === "발송완료" && !editing && (
              <>
                <button className="border border-ink-900/20 px-3 py-2 text-xs hover:border-ink-950" onClick={() => setEditing(true)}>송장 수정</button>
                <button className="border border-ink-950 px-3 py-2 text-xs hover:bg-ink-950 hover:text-ivory" onClick={() => setOrderStatus(o.id, "배송완료")}>배송완료 처리</button>
              </>
            )}
          </div>
        </div>
      </div>

      {editing && (
        <form onSubmit={submit} className="mt-4 grid gap-3 border-t border-ink-900/10 pt-4 sm:grid-cols-[160px_1fr_auto_auto]">
          <select className="field" value={carrier} onChange={(e) => setCarrier(e.target.value)} aria-label="택배사">
            {CARRIERS.map((c) => <option key={c}>{c}</option>)}
          </select>
          <input
            className="field font-mono"
            placeholder="송장번호 (숫자 10~14자리)"
            value={tracking}
            onChange={(e) => setTracking(e.target.value)}
            pattern="[0-9\- ]{10,17}"
            title="숫자 10~14자리 (하이픈 허용)"
            required
            autoFocus
          />
          <button className="btn !py-2">{o.status === "결제완료" ? "발송 처리" : "저장"}</button>
          <button type="button" className="px-3 py-2 text-xs text-ink-600 hover:text-ink-950" onClick={() => setEditing(false)}>취소</button>
        </form>
      )}

      {/* progress */}
      <ol className="mt-4 flex gap-1">
        {ORDER_STEPS.map((s, i) => (
          <li key={s} className={`h-1 flex-1 ${i <= ORDER_STEPS.indexOf(o.status) ? "bg-ink-950" : "bg-ink-900/10"}`} title={s} />
        ))}
      </ol>
    </li>
  );
}

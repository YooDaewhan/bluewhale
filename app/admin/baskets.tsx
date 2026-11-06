"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { INITIAL_BASKETS, basketCost, basketWeight, type BasketSize } from "../basket-data";
import { compositionText, useStore, won, type Product } from "../store";

const EMPTY: Omit<BasketSize, "id"> = { ko: "", en: "", price: 0, serves: "", items: [], note: "", desc: "", image: "", active: true };

const margin = (price: number, cost: number) => (price > 0 ? Math.round(((price - cost) / price) * 100) : 0);

export default function BasketsAdmin() {
  const { baskets, setBaskets, products } = useStore();
  const [editing, setEditing] = useState<BasketSize | Omit<BasketSize, "id"> | null>(null);
  const priceOf = (id: number) => products.find((p) => p.id === id)?.pricePerKg ?? 0;

  function save(b: BasketSize | Omit<BasketSize, "id">) {
    setBaskets((list) => ("id" in b ? list.map((x) => (x.id === b.id ? b : x)) : [...list, { ...b, id: "B" + Date.now().toString(36) }]));
    setEditing(null);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">과일 바구니 관리</h1>
          <p className="text-sm text-ink-900/50">구성 과일과 kg을 정하면 무게와 원가가 자동 계산됩니다. 판매가는 원가를 보고 정하세요.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="border border-ink-900/15 px-4 py-2 text-sm hover:bg-white"
            onClick={() => confirm("바구니 목록을 초기 데이터로 되돌릴까요?") && setBaskets(() => INITIAL_BASKETS)}
          >
            초기화
          </button>
          <button className="btn" onClick={() => setEditing(EMPTY)}>+ 바구니 등록</button>
        </div>
      </div>

      <ul className="mt-6 grid gap-4 md:grid-cols-2">
        {baskets.map((b) => {
          const cost = basketCost(b, priceOf);
          return (
            <li key={b.id} className={`flex gap-4 border bg-white p-4 ${b.active ? "border-ink-900/10" : "border-dashed border-ink-900/20 opacity-60"}`}>
              <div className="h-28 w-24 shrink-0 overflow-hidden bg-gold-300/30">
                {b.image ? <img src={b.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-4xl">🧺</div>}
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-start justify-between gap-2">
                  <p className="font-serif text-xl">
                    {b.ko} <span className="text-[10px] uppercase tracking-[0.2em] text-ink-900/40">{b.en}</span>
                  </p>
                  <span className={`shrink-0 px-2 py-0.5 text-[10px] ${b.active ? "bg-gold-300/70" : "bg-ink-900/10"}`}>{b.active ? "판매중" : "숨김"}</span>
                </div>
                <p className="mt-1 line-clamp-2 text-xs text-ink-600">{compositionText(b, products)}</p>
                <div className="mt-2 flex flex-wrap gap-x-4 text-xs">
                  <span>판매가 <b className="font-semibold">{won(b.price)}</b></span>
                  <span className="text-ink-900/50">원가 {won(cost)}</span>
                  <span className={margin(b.price, cost) < 20 ? "text-coral-500" : "text-ink-900/50"}>마진 {margin(b.price, cost)}%</span>
                  <span className="text-ink-900/50">{basketWeight(b)}kg · {b.serves}</span>
                </div>
                <div className="mt-3 flex gap-3 text-xs">
                  <button className="text-ink-950 underline" onClick={() => setEditing(b)}>수정</button>
                  <button className="text-ink-600 underline" onClick={() => setBaskets((l) => l.map((x) => (x.id === b.id ? { ...x, active: !x.active } : x)))}>
                    {b.active ? "숨기기" : "판매 재개"}
                  </button>
                  <button
                    className="text-coral-500 underline"
                    onClick={() => confirm(`'${b.ko}' 바구니를 삭제할까요? 기존 예약 내역에는 '삭제된 바구니'로 표시됩니다.`) && setBaskets((l) => l.filter((x) => x.id !== b.id))}
                  >
                    삭제
                  </button>
                </div>
              </div>
            </li>
          );
        })}
      </ul>

      {editing && <BasketForm key={"id" in editing ? editing.id : "new"} initial={editing} products={products} onSave={save} onCancel={() => setEditing(null)} />}
    </div>
  );
}

function BasketForm({
  initial,
  products,
  onSave,
  onCancel,
}: {
  initial: BasketSize | Omit<BasketSize, "id">;
  products: Product[];
  onSave: (b: BasketSize | Omit<BasketSize, "id">) => void;
  onCancel: () => void;
}) {
  const [b, setB] = useState(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof BasketSize>(k: K, v: BasketSize[K]) => setB((x) => ({ ...x, [k]: v }));
  const priceOf = (id: number) => products.find((p) => p.id === id)?.pricePerKg ?? 0;
  const cost = basketCost(b, priceOf);
  const unused = products.filter((p) => !b.items.some((i) => i.productId === p.id));
  const roundUp = (n: number) => Math.ceil(n / 1000) * 1000;

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (b.items.length === 0) return setError("구성 과일을 1개 이상 추가해주세요.");
    if (b.items.some((i) => !(i.kg > 0))) return setError("과일 kg은 0보다 커야 합니다.");
    if (!(b.price > 0)) return setError("판매가를 입력해주세요.");
    onSave(b);
  }

  return (
    <div className="fixed inset-0 z-30 overflow-y-auto bg-ink-950/60 p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="mx-auto my-8 w-full max-w-2xl space-y-5 bg-white p-6 shadow-xl">
        <h2 className="font-serif text-2xl">{"id" in initial ? "바구니 수정" : "바구니 등록"}</h2>

        <div className="grid gap-3 sm:grid-cols-3">
          <Label text="이름 (예: 소, 중, 명절 스페셜)">
            <input className="field" value={b.ko} onChange={(e) => set("ko", e.target.value)} required />
          </Label>
          <Label text="영문 표기">
            <input className="field" value={b.en} onChange={(e) => set("en", e.target.value)} placeholder="Classic" />
          </Label>
          <Label text="추천 인원">
            <input className="field" value={b.serves} onChange={(e) => set("serves", e.target.value)} placeholder="3–4인" />
          </Label>
        </div>

        {/* composition */}
        <div>
          <p className="eyebrow mb-2">구성 과일</p>
          <div className="space-y-2">
            {b.items.map((it, n) => {
              const p = products.find((x) => x.id === it.productId);
              return (
                <div key={n} className="flex items-center gap-2">
                  <select
                    className="field flex-1"
                    value={it.productId}
                    onChange={(e) => set("items", b.items.map((x, i) => (i === n ? { ...x, productId: Number(e.target.value) } : x)))}
                    aria-label="과일"
                  >
                    {!p && <option value={it.productId}>삭제된 과일</option>}
                    {products
                      .filter((x) => x.id === it.productId || !b.items.some((i) => i.productId === x.id))
                      .map((x) => <option key={x.id} value={x.id}>{x.emoji} {x.name} ({won(x.pricePerKg)}/kg)</option>)}
                  </select>
                  <input
                    className="field w-24 text-right"
                    type="number"
                    step={0.5}
                    min={0.5}
                    value={it.kg}
                    onChange={(e) => set("items", b.items.map((x, i) => (i === n ? { ...x, kg: Number(e.target.value) } : x)))}
                    aria-label="kg"
                  />
                  <span className="w-6 text-xs text-ink-900/50">kg</span>
                  <span className="hidden w-24 text-right text-xs text-ink-600 sm:block">{won(Math.round((p?.pricePerKg ?? 0) * it.kg))}</span>
                  <button type="button" className="h-9 w-9 text-ink-900/40 hover:text-coral-500" onClick={() => set("items", b.items.filter((_, i) => i !== n))} aria-label="과일 빼기">✕</button>
                </div>
              );
            })}
          </div>
          {unused.length > 0 && (
            <button
              type="button"
              className="mt-2 border border-dashed border-ink-900/30 px-4 py-2 text-sm hover:border-ink-950"
              onClick={() => set("items", [...b.items, { productId: unused[0].id, kg: 1 }])}
            >
              + 과일 추가
            </button>
          )}
          <Label text="과일 외 구성 (선택)">
            <input className="field mt-1" value={b.note} onChange={(e) => set("note", e.target.value)} placeholder="예) 생화 장식 + 원목 크레이트" />
          </Label>
        </div>

        {/* pricing */}
        <div className="grid gap-4 bg-ivory p-4 sm:grid-cols-[1fr_1.4fr]">
          <dl className="space-y-1 text-sm">
            <div className="flex justify-between"><dt className="text-ink-600">총 무게</dt><dd>{basketWeight(b)}kg</dd></div>
            <div className="flex justify-between"><dt className="text-ink-600">과일 원가</dt><dd>{won(cost)}</dd></div>
            <div className="flex justify-between font-semibold"><dt>마진</dt><dd className={margin(b.price, cost) < 20 ? "text-coral-500" : ""}>{margin(b.price, cost)}%</dd></div>
          </dl>
          <div>
            <Label text="판매가 (원)">
              <input className="field text-right font-serif text-xl" type="number" min={0} step={1000} value={b.price || ""} onChange={(e) => set("price", Number(e.target.value))} required />
            </Label>
            <div className="mt-2 flex flex-wrap gap-1.5">
              {[1.3, 1.5, 1.8].map((m) => (
                <button key={m} type="button" disabled={cost === 0} className="border border-ink-900/20 px-2.5 py-1 text-xs hover:border-ink-950 disabled:opacity-40" onClick={() => set("price", roundUp(cost * m))}>
                  원가 +{Math.round((m - 1) * 100)}%
                </button>
              ))}
            </div>
          </div>
        </div>

        <Label text="설명">
          <textarea className="field" rows={2} value={b.desc} onChange={(e) => set("desc", e.target.value)} />
        </Label>
        <div className="grid grid-cols-[80px_1fr] items-end gap-3">
          <div className="h-[84px] w-20 overflow-hidden bg-gold-300/30">
            {b.image ? <img src={b.image} alt="" className="h-full w-full object-cover" /> : <div className="grid h-full place-items-center text-3xl">🧺</div>}
          </div>
          <Label text="사진 URL (비우면 🧺 표시)">
            <input className="field" type="url" value={b.image} onChange={(e) => set("image", e.target.value)} placeholder="https://..." />
          </Label>
        </div>
        <label className="flex items-center gap-2 text-sm">
          <input type="checkbox" checked={b.active} onChange={(e) => set("active", e.target.checked)} />
          고객 화면에 판매중으로 표시
        </label>

        {error && <p className="text-sm text-coral-500">{error}</p>}
        <div className="flex justify-end gap-2 border-t border-ink-900/10 pt-4">
          <button type="button" className="px-4 py-2 text-sm hover:bg-ink-900/5" onClick={onCancel}>취소</button>
          <button className="btn">저장</button>
        </div>
      </form>
    </div>
  );
}

function Label({ text, children }: { text: string; children: React.ReactNode }) {
  return (
    <label className="block text-xs font-semibold text-ink-900/60">
      {text}
      <div className="mt-1">{children}</div>
    </label>
  );
}

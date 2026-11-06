"use client";

/* eslint-disable @next/next/no-img-element */

import Link from "next/link";
import { useState } from "react";
import { FruitImage, INITIAL_PRODUCTS, saleStatus, useStore, won, type Product } from "../store";
import ReservationCalendar from "./calendar";

const EMPTY: Omit<Product, "id"> = { emoji: "🍍", image: "", name: "", origin: "", pricePerKg: 10000, description: "", saleStart: "", saleEnd: "" };
const STATUS_LABEL = { onsale: "판매중", upcoming: "판매예정", ended: "판매종료" };

export default function AdminPage() {
  const { ready, today, user, products, setProducts } = useStore();
  const [editing, setEditing] = useState<Product | Omit<Product, "id"> | null>(null);
  const [tab, setTab] = useState<"reservations" | "products">("reservations");

  if (!ready) return null;
  if (user?.role !== "admin")
    return (
      <div className="px-4 py-24 text-center">
        <img src="/brand/whale-fruits.webp" alt="" className="mx-auto h-32 w-auto" />
        <p className="mt-3 text-ink-900/60">관리자만 접근할 수 있는 페이지입니다.</p>
        <Link href="/login" className="btn mt-6 inline-block">관리자 로그인</Link>
      </div>
    );

  function save(p: Product | Omit<Product, "id">) {
    setProducts((list) =>
      "id" in p ? list.map((x) => (x.id === p.id ? p : x)) : [...list, { ...p, id: Math.max(0, ...list.map((x) => x.id)) + 1 }],
    );
    setEditing(null);
  }

  const onsale = products.filter((p) => saleStatus(p, today) === "onsale").length;

  return (
    <div className="mx-auto max-w-6xl px-4 py-10">
      <div className="mb-10 flex gap-6 border-b border-ink-900/10" role="tablist">
        {([["reservations", "픽업 예약 캘린더"], ["products", "상품 관리"]] as const).map(([key, label]) => (
          <button
            key={key}
            role="tab"
            aria-selected={tab === key}
            onClick={() => setTab(key)}
            className={`-mb-px border-b-2 pb-3 text-sm ${tab === key ? "border-ink-950 font-semibold" : "border-transparent text-ink-900/40 hover:text-ink-950"}`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === "reservations" ? (
        <ReservationCalendar />
      ) : (
      <>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">상품 관리</h1>
          <p className="text-sm text-ink-900/50">목업 관리자 · 변경 내용은 이 브라우저에만 저장됩니다.</p>
        </div>
        <div className="flex gap-2">
          <button
            className="rounded-sm border border-ink-900/15 px-4 py-2 text-sm hover:bg-white"
            onClick={() => confirm("상품 목록을 초기 데이터로 되돌릴까요?") && setProducts(() => INITIAL_PRODUCTS)}
          >
            초기화
          </button>
          <button className="btn" onClick={() => setEditing(EMPTY)}>+ 상품 등록</button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="전체 상품" value={products.length} />
        <Stat label="판매중" value={onsale} />
        <Stat label="판매예정·종료" value={products.length - onsale} />
      </div>

      <div className="mt-6 overflow-x-auto rounded-sm bg-white border border-ink-900/10">
        <table className="w-full min-w-[720px] text-sm">
          <thead className="bg-ink-900/5 text-left text-xs text-ink-900/60">
            <tr>
              <th className="p-3">상품</th>
              <th className="p-3">원산지</th>
              <th className="p-3 text-right">kg당 가격</th>
              <th className="p-3">판매기간</th>
              <th className="p-3">상태</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {products.map((p) => (
              <tr key={p.id} className="border-t border-ink-900/5">
                <td className="p-3 font-semibold">
                  <FruitImage p={p} className="mr-3 inline-grid h-10 w-10 rounded-sm align-middle text-xl" />
                  {p.name}
                </td>
                <td className="p-3 text-ink-900/70">{p.origin}</td>
                <td className="p-3 text-right font-semibold">{won(p.pricePerKg)}</td>
                <td className="p-3 text-xs text-ink-900/70">{p.saleStart} ~ {p.saleEnd}</td>
                <td className="p-3 text-xs">{STATUS_LABEL[saleStatus(p, today)]}</td>
                <td className="whitespace-nowrap p-3 text-right">
                  <button className="mr-3 text-ink-600 hover:underline" onClick={() => setEditing(p)}>수정</button>
                  <button
                    className="text-coral-500 hover:underline"
                    onClick={() => confirm(`'${p.name}'을(를) 삭제할까요?`) && setProducts((l) => l.filter((x) => x.id !== p.id))}
                  >
                    삭제
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {editing && <ProductForm key={"id" in editing ? editing.id : "new"} initial={editing} onSave={save} onCancel={() => setEditing(null)} />}
      </>
      )}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: number }) {
  return (
    <div className="border border-ink-900/10 bg-white p-5">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-serif text-4xl">{value}</p>
    </div>
  );
}

function ProductForm({
  initial,
  onSave,
  onCancel,
}: {
  initial: Product | Omit<Product, "id">;
  onSave: (p: Product | Omit<Product, "id">) => void;
  onCancel: () => void;
}) {
  const [p, setP] = useState(initial);
  const [error, setError] = useState("");
  const set = <K extends keyof Product>(k: K, v: Product[K]) => setP((x) => ({ ...x, [k]: v }));

  function submit(e: React.FormEvent) {
    e.preventDefault();
    if (p.saleEnd < p.saleStart) return setError("판매 종료일이 시작일보다 빠릅니다.");
    if (p.pricePerKg <= 0) return setError("kg당 가격은 0보다 커야 합니다.");
    onSave(p);
  }

  return (
    <div className="fixed inset-0 z-30 grid place-items-center bg-ink-950/60 p-4" onClick={onCancel}>
      <form onSubmit={submit} onClick={(e) => e.stopPropagation()} className="w-full max-w-lg space-y-3 rounded-sm bg-white p-6 shadow-xl">
        <h2 className="font-serif text-xl">{"id" in initial ? "상품 수정" : "상품 등록"}</h2>
        <div className="grid grid-cols-[80px_1fr] gap-3">
          <Label text="이모지">
            <input className="field text-center text-2xl" value={p.emoji} onChange={(e) => set("emoji", e.target.value)} maxLength={4} required />
          </Label>
          <Label text="상품명">
            <input className="field" value={p.name} onChange={(e) => set("name", e.target.value)} required />
          </Label>
        </div>
        <div className="grid grid-cols-[80px_1fr] items-end gap-3">
          <FruitImage key={p.image} p={p} className="h-[68px] w-20 rounded-sm text-3xl" />
          <Label text="상품 사진 URL (비우면 이모지 표시)">
            <input className="field" type="url" placeholder="https://..." value={p.image} onChange={(e) => set("image", e.target.value)} />
          </Label>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Label text="원산지">
            <input className="field" value={p.origin} onChange={(e) => set("origin", e.target.value)} required />
          </Label>
          <Label text="kg당 가격 (원)">
            <input className="field" type="number" min={100} step={100} value={p.pricePerKg} onChange={(e) => set("pricePerKg", Number(e.target.value))} required />
          </Label>
          <Label text="판매 시작일">
            <input className="field" type="date" value={p.saleStart} onChange={(e) => set("saleStart", e.target.value)} required />
          </Label>
          <Label text="판매 종료일">
            <input className="field" type="date" value={p.saleEnd} min={p.saleStart} onChange={(e) => set("saleEnd", e.target.value)} required />
          </Label>
        </div>
        <Label text="상품 설명">
          <textarea className="field" rows={3} value={p.description} onChange={(e) => set("description", e.target.value)} required />
        </Label>
        {error && <p className="text-sm text-coral-500">{error}</p>}
        <div className="flex justify-end gap-2 pt-2">
          <button type="button" className="rounded-sm px-4 py-2 text-sm hover:bg-ink-900/5" onClick={onCancel}>취소</button>
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

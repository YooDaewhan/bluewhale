"use client";

import { useState } from "react";
import { EXTRAS, WRAPS, type Reservation, type ReservationStatus } from "../basket-data";
import { basketName, useStore, won } from "../store";
import ExcelButton from "./excel-button";

const WEEK = ["일", "월", "화", "수", "목", "금", "토"];
const STATUSES: ReservationStatus[] = ["예약", "준비완료", "픽업완료", "취소"];
const STATUS_CLS: Record<ReservationStatus, string> = {
  예약: "bg-gold-300/70 text-ink-950",
  준비완료: "bg-brand/15 text-brand",
  픽업완료: "bg-ink-900/10 text-ink-900/50",
  취소: "bg-coral-500/10 text-coral-500 line-through",
};

const pad = (n: number) => String(n).padStart(2, "0");
const key = (y: number, m: number, d: number) => `${y}-${pad(m + 1)}-${pad(d)}`;
const basketCount = (r: Reservation) => r.items.reduce((s, l) => s + l.qty, 0);

export default function ReservationCalendar() {
  const { today, reservations, setReservationStatus, baskets } = useStore();
  const sizeKo = (id: string) => basketName(baskets, id);
  const [ym, setYm] = useState(() => ({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }));
  const [selected, setSelected] = useState(today);

  const { y, m } = ym;
  const offset = new Date(y, m, 1).getDay();
  const days = new Date(y, m + 1, 0).getDate();
  const cells = [...Array(offset).fill(null), ...Array.from({ length: days }, (_, i) => i + 1)];

  const byDate = new Map<string, Reservation[]>();
  for (const r of [...reservations].sort((a, b) => a.pickupTime.localeCompare(b.pickupTime))) {
    byDate.set(r.pickupDate, [...(byDate.get(r.pickupDate) ?? []), r]);
  }
  const monthPrefix = `${y}-${pad(m + 1)}`;
  const monthActive = reservations.filter((r) => r.pickupDate.startsWith(monthPrefix) && r.status !== "취소");
  const dayList = byDate.get(selected) ?? [];
  const dayActive = dayList.filter((r) => r.status !== "취소");
  // prep sheet: how many of each size to assemble that day
  const prep = baskets.map((b) => ({ b, n: dayActive.reduce((s, r) => s + r.items.filter((l) => l.size === b.id).reduce((a, l) => a + l.qty, 0), 0) }));

  const move = (d: number) => setYm(({ y, m }) => ({ y: m + d < 0 ? y - 1 : m + d > 11 ? y + 1 : y, m: (m + d + 12) % 12 }));

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Pickup Reservations</p>
          <h1 className="mt-1 font-serif text-3xl">픽업 예약 캘린더</h1>
          <p className="text-sm text-ink-900/50">목업 데이터 + 이 브라우저에서 접수된 예약이 함께 표시됩니다.</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <ExcelButton label="예약 엑셀" />
          <button className="ml-2 h-10 w-10 border border-ink-900/15 hover:bg-white" onClick={() => move(-1)} aria-label="이전 달">‹</button>
          <span className="min-w-32 text-center font-serif text-2xl">{y}. {pad(m + 1)}</span>
          <button className="h-10 w-10 border border-ink-900/15 hover:bg-white" onClick={() => move(1)} aria-label="다음 달">›</button>
          <button
            className="ml-2 border border-ink-900/15 px-3 py-2 text-xs hover:bg-white"
            onClick={() => { setYm({ y: Number(today.slice(0, 4)), m: Number(today.slice(5, 7)) - 1 }); setSelected(today); }}
          >
            오늘
          </button>
        </div>
      </div>

      <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
        <Stat label="이달 예약" value={`${monthActive.length}건`} />
        <Stat label="이달 바구니" value={`${monthActive.reduce((s, r) => s + basketCount(r), 0)}개`} />
        <Stat label="이달 예상 매출" value={won(monthActive.reduce((s, r) => s + r.total, 0))} />
        <Stat label="오늘 픽업" value={`${(byDate.get(today) ?? []).filter((r) => r.status !== "취소").length}건`} />
      </div>

      <div className="mt-6 grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="min-w-0 border border-ink-900/10 bg-white">
          <div className="grid grid-cols-7 border-b border-ink-900/10 text-center text-[11px] uppercase tracking-[0.2em] text-ink-900/50">
            {WEEK.map((w, i) => (
              <div key={w} className={`py-2 ${i === 0 ? "text-coral-500" : i === 6 ? "text-brand" : ""}`}>{w}</div>
            ))}
          </div>
          <div className="grid grid-cols-7">
            {cells.map((d, i) => {
              if (d === null) return <div key={`e${i}`} className="min-h-16 border-b border-r border-ink-900/5 bg-ivory/50 sm:min-h-28" />;
              const k = key(y, m, d);
              const list = byDate.get(k) ?? [];
              const active = list.filter((r) => r.status !== "취소");
              return (
                <button
                  key={k}
                  onClick={() => setSelected(k)}
                  className={`flex min-h-16 flex-col items-stretch gap-1 border-b border-r border-ink-900/5 p-1.5 text-left transition hover:bg-gold-300/20 sm:min-h-28 ${selected === k ? "bg-gold-300/30 ring-1 ring-inset ring-ink-950" : ""}`}
                >
                  <span className="flex items-center justify-between text-xs">
                    <span className={`grid h-6 w-6 place-items-center ${k === today ? "rounded-full bg-ink-950 text-ivory" : i % 7 === 0 ? "text-coral-500" : ""}`}>{d}</span>
                    {active.length > 0 && <span className="text-[10px] text-ink-900/50 sm:hidden">{active.length}</span>}
                  </span>
                  {/* chips on desktop, dots on mobile */}
                  <span className="hidden flex-col gap-0.5 sm:flex">
                    {list.slice(0, 3).map((r) => (
                      <span key={r.id} className={`truncate px-1 py-0.5 text-[10px] ${STATUS_CLS[r.status]}`}>
                        {r.pickupTime} {r.name} · {r.items.map((l) => `${sizeKo(l.size)}${l.qty}`).join(" ")}
                      </span>
                    ))}
                    {list.length > 3 && <span className="text-[10px] text-ink-900/50">+{list.length - 3}건 더</span>}
                  </span>
                  <span className="flex flex-wrap gap-0.5 sm:hidden">
                    {list.map((r) => <span key={r.id} className={`h-1.5 w-1.5 rounded-full ${r.status === "취소" ? "bg-coral-500/40" : r.status === "픽업완료" ? "bg-ink-900/30" : "bg-gold-600"}`} />)}
                  </span>
                </button>
              );
            })}
          </div>
        </div>

        <aside className="border border-ink-900/10 bg-white p-5">
          <p className="eyebrow">Selected Day</p>
          <p className="mt-1 font-serif text-2xl">{selected.replaceAll("-", ".")}</p>

          <div className="mt-4 grid grid-cols-[repeat(auto-fit,minmax(64px,1fr))] border border-ink-900/10 text-center">
            {prep.map(({ b, n }) => (
              <div key={b.id} className="border-r border-ink-900/10 py-2 last:border-r-0">
                <p className="text-[10px] text-ink-900/50">{b.ko}</p>
                <p className={`font-serif text-xl ${n ? "" : "text-ink-900/20"}`}>{n}</p>
              </div>
            ))}
          </div>
          <p className="mt-1 text-[10px] text-ink-900/40">당일 준비 수량 (취소 제외)</p>

          <ul className="mt-5 space-y-4">
            {dayList.length === 0 && <li className="py-8 text-center text-sm text-ink-900/40">예약이 없습니다.</li>}
            {dayList.map((r) => (
              <li key={r.id} className="border-t border-ink-900/10 pt-4 text-sm">
                <div className="flex items-center justify-between gap-2">
                  <p className="font-serif text-xl">{r.pickupTime}</p>
                  <select
                    value={r.status}
                    onChange={(e) => setReservationStatus(r.id, e.target.value as ReservationStatus)}
                    className={`border-0 px-2 py-1 text-xs outline-none ${STATUS_CLS[r.status]}`}
                    aria-label={`${r.id} 상태`}
                  >
                    {STATUSES.map((s) => <option key={s}>{s}</option>)}
                  </select>
                </div>
                <p className="mt-1 font-medium">{r.name} <span className="font-normal text-ink-900/50">· {r.phone}</span></p>
                <p className="mt-1 text-ink-600">{r.items.map((l) => `${sizeKo(l.size)} × ${l.qty}`).join(", ")}</p>
                <p className="text-xs text-ink-600">
                  {WRAPS.find((w) => w.id === r.wrap)!.name}
                  {r.extras.length > 0 && ` · ${r.extras.map((e) => EXTRAS.find((x) => x.id === e)!.name).join(" · ")}`}
                </p>
                <p className="mt-1 text-xs">문구 “{r.message}”</p>
                {r.memo && <p className="mt-1 text-xs text-coral-500">요청: {r.memo}</p>}
                <p className="mt-1 text-xs text-ink-900/50">{r.id} · {won(r.total)}</p>
              </li>
            ))}
          </ul>
        </aside>
      </div>

      <div className="mt-4 flex flex-wrap gap-3 text-[11px]">
        {STATUSES.map((s) => <span key={s} className={`px-2 py-0.5 ${STATUS_CLS[s]}`}>{s}</span>)}
      </div>
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string }) {
  return (
    <div className="border border-ink-900/10 bg-white p-4">
      <p className="eyebrow">{label}</p>
      <p className="mt-2 font-serif text-2xl">{value}</p>
    </div>
  );
}

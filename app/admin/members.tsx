"use client";

import { useState } from "react";
import { MEMBERS } from "../member-data";
import { useStore, won } from "../store";
import ExcelButton from "./excel-button";

export default function MembersAdmin() {
  const { orders, reservations } = useStore();
  const [q, setQ] = useState("");

  const rows = MEMBERS.map((m) => {
    const myOrders = orders.filter((o) => o.userId === m.id);
    // reservations don't carry a user id yet, so match by nickname (mock)
    const myRes = reservations.filter((r) => r.name === m.nickname && r.status !== "취소");
    const spent = myOrders.reduce((s, o) => s + o.total, 0) + myRes.reduce((s, r) => s + r.total, 0);
    const lastAddress = [...myOrders].sort((a, b) => b.id.localeCompare(a.id))[0]?.address;
    return { m, orderCount: myOrders.length, resCount: myRes.length, spent, lastAddress };
  }).filter(({ m }) => !q || m.nickname.includes(q) || m.kakaoId.includes(q));

  const total = MEMBERS.length;
  const newThisMonth = MEMBERS.filter((m) => m.joinedAt >= "2026-11-01").length;
  const marketing = MEMBERS.filter((m) => m.marketing).length;

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-4">
        <div>
          <p className="eyebrow">Members</p>
          <h1 className="mt-1 font-serif text-3xl">회원 관리</h1>
          <p className="text-sm text-ink-900/50">카카오 로그인으로 가입한 회원 목록입니다. (목업)</p>
        </div>
        <ExcelButton label="회원 엑셀 다운로드" />
      </div>

      <div className="mt-6 grid grid-cols-3 gap-3">
        <Stat label="전체 회원" value={`${total}명`} />
        <Stat label="이달 신규" value={`${newThisMonth}명`} />
        <Stat label="마케팅 수신 동의" value={`${marketing}명`} />
      </div>

      <input className="field mt-6 max-w-xs" placeholder="닉네임 · 카카오 회원번호 검색" value={q} onChange={(e) => setQ(e.target.value)} />

      <div className="mt-4 overflow-x-auto border border-ink-900/10 bg-white">
        <table className="w-full min-w-[860px] text-sm">
          <thead className="bg-ink-900/5 text-left text-xs text-ink-900/60">
            <tr>
              <th className="p-3">닉네임</th>
              <th className="p-3">카카오 회원번호</th>
              <th className="p-3">가입일</th>
              <th className="p-3">최근 로그인</th>
              <th className="p-3 text-center">마케팅</th>
              <th className="p-3 text-right">주문 / 예약</th>
              <th className="p-3 text-right">누적 구매액</th>
              <th className="p-3">최근 배송지</th>
            </tr>
          </thead>
          <tbody>
            {rows.map(({ m, orderCount, resCount, spent, lastAddress }) => (
              <tr key={m.id} className="border-t border-ink-900/5">
                <td className="p-3">
                  <span className="mr-2 inline-grid h-7 w-7 place-items-center rounded-full bg-[#FEE500] text-xs font-bold text-black/70">{m.nickname.slice(0, 1)}</span>
                  {m.nickname}
                </td>
                <td className="p-3 font-mono text-xs text-ink-600">{m.kakaoId}</td>
                <td className="p-3 text-xs">{m.joinedAt.replaceAll("-", ".")}</td>
                <td className="p-3 text-xs">{m.lastLoginAt.replaceAll("-", ".")}</td>
                <td className="p-3 text-center text-xs">{m.marketing ? "동의" : <span className="text-ink-900/30">-</span>}</td>
                <td className="p-3 text-right">{orderCount} / {resCount}</td>
                <td className="p-3 text-right font-semibold">{spent ? won(spent) : <span className="font-normal text-ink-900/30">-</span>}</td>
                <td className="max-w-56 truncate p-3 text-xs text-ink-600" title={lastAddress}>{lastAddress ?? "-"}</td>
              </tr>
            ))}
            {rows.length === 0 && (
              <tr>
                <td colSpan={8} className="p-10 text-center text-ink-900/40">검색 결과가 없습니다.</td>
              </tr>
            )}
          </tbody>
        </table>
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

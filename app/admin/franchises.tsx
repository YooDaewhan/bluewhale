"use client";

import { useState } from "react";
import { useStore, usePersisted, type Settings } from "../store";
import { FRANCHISES_KEY, HQ, K, RESERVED, TENANT_RE, readJson, tkey } from "../tenant";

type Franchise = { id: string; name: string; createdAt: string };

// ponytail: all tenants live in this browser's localStorage (mock). With a backend: POST creates a DB from the HQ dump, PATCH flips settings.
export default function FranchisesAdmin() {
  const { tenant, products, baskets, settings, setSettings, today } = useStore();
  const [list, setList] = usePersisted<Franchise[]>(FRANCHISES_KEY, []);
  const [name, setName] = useState("");
  const [id, setId] = useState("");
  const [error, setError] = useState("");
  const [, refresh] = useState(0);

  if (tenant !== HQ) return <p className="py-20 text-center text-ink-900/60">프렌차이즈 관리는 본사에서만 할 수 있습니다.</p>;

  const settingsOf = (fid: string) => readJson<Settings>(tkey(fid, K.settings), { fruitsEnabled: false });
  const setFruits = (fid: string, on: boolean) => {
    localStorage.setItem(tkey(fid, K.settings), JSON.stringify({ ...settingsOf(fid), fruitsEnabled: on }));
    refresh((n) => n + 1);
  };
  // dev (localhost/IP) can't use subdomains → ?tenant=; real hosts → seoul.<root domain>
  const url = (fid: string) =>
    /^(localhost|\d)/.test(location.hostname) ? `/?tenant=${fid}` : `${location.protocol}//${fid}.${location.host.replace(/^www\./, "")}`;

  function create(e: React.FormEvent) {
    e.preventDefault();
    const sub = id.trim().toLowerCase();
    if (!TENANT_RE.test(sub)) return setError("서브도메인은 영문 소문자·숫자·하이픈(최대 30자)만 쓸 수 있습니다.");
    if (RESERVED.includes(sub) || list.some((f) => f.id === sub)) return setError("이미 사용 중이거나 사용할 수 없는 서브도메인입니다.");
    // DB dump: menu (fruits, baskets) is copied from HQ; orders, shipping(=orders), reservations, cart start empty and are separate from then on
    const dump: Record<string, unknown> = {
      [K.products]: products,
      [K.baskets]: baskets,
      [K.settings]: { fruitsEnabled: false },
      [K.orders]: [],
      [K.reservations]: [],
      [K.cart]: [],
    };
    try {
      for (const [k, v] of Object.entries(dump)) localStorage.setItem(tkey(sub, k), JSON.stringify(v));
    } catch {
      return setError("저장 공간이 부족해 DB를 만들지 못했습니다. (사진이 많으면 용량 초과)");
    }
    setList((l) => [...l, { id: sub, name: name.trim(), createdAt: today }]);
    setName("");
    setId("");
    setError("");
  }

  function remove(f: Franchise) {
    if (!confirm(`'${f.name}'(${f.id}) 프렌차이즈와 그 주문·메뉴 데이터를 모두 삭제할까요?`)) return;
    Object.values(K).forEach((k) => localStorage.removeItem(tkey(f.id, k)));
    setList((l) => l.filter((x) => x.id !== f.id));
  }

  const rows = [
    { id: HQ, name: "본사", sub: "www", fruits: settings.fruitsEnabled, toggle: (on: boolean) => setSettings((s) => ({ ...s, fruitsEnabled: on })), f: null },
    ...list.map((f) => ({ id: f.id, name: f.name, sub: f.id, fruits: settingsOf(f.id).fruitsEnabled, toggle: (on: boolean) => setFruits(f.id, on), f })),
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">프렌차이즈 관리</h1>
      <p className="text-sm text-ink-900/50">
        등록하면 본사의 메뉴(과일·바구니)가 복사된 별도 DB가 만들어집니다. 주문·배송·예약은 가맹점마다 따로 관리됩니다.
      </p>

      <form onSubmit={create} className="mt-6 flex flex-wrap items-end gap-3 border border-ink-900/10 bg-white p-5">
        <label className="block text-xs text-ink-900/60">
          가맹점 이름
          <input className="field mt-1 w-48" value={name} onChange={(e) => setName(e.target.value)} placeholder="서울점" required />
        </label>
        <label className="block text-xs text-ink-900/60">
          서브도메인
          <span className="mt-1 flex items-center gap-1">
            <input className="field w-36" value={id} onChange={(e) => setId(e.target.value)} placeholder="seoul" required />
            <span className="text-sm text-ink-900/50">.도메인</span>
          </span>
        </label>
        <button className="btn">+ 프렌차이즈 등록</button>
        {error && <p className="w-full text-sm text-coral-500">{error}</p>}
      </form>

      <div className="mt-6 overflow-x-auto rounded-sm border border-ink-900/10 bg-white">
        <table className="w-full min-w-[640px] text-sm">
          <thead className="bg-ink-900/5 text-left text-xs text-ink-900/60">
            <tr>
              <th className="p-3">가맹점</th>
              <th className="p-3">주소</th>
              <th className="p-3">개별 과일</th>
              <th className="p-3"></th>
            </tr>
          </thead>
          <tbody>
            {rows.map((r) => (
              <tr key={r.id} className="border-t border-ink-900/5">
                <td className="p-3 font-semibold">{r.name}</td>
                <td className="p-3 text-ink-900/70">{r.f ? `${r.sub}.도메인` : "www.도메인"}</td>
                <td className="p-3">
                  <label className="inline-flex cursor-pointer items-center gap-2">
                    <input type="checkbox" checked={r.fruits} onChange={(e) => r.toggle(e.target.checked)} />
                    {r.fruits ? "켜짐" : "꺼짐"}
                  </label>
                </td>
                <td className="whitespace-nowrap p-3 text-right">
                  {r.f && (
                    <>
                      <a className="mr-3 text-ink-600 hover:underline" href={url(r.id)} target="_blank" rel="noreferrer">열기</a>
                      <button className="text-coral-500 hover:underline" onClick={() => remove(r.f)}>삭제</button>
                    </>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

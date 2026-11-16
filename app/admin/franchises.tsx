"use client";

import { useState } from "react";
import { useStore, type FranchiseRow } from "../store";
import { HQ, RESERVED, TENANT_RE } from "../tenant";

const BLANK = { name: "", id: "", adminId: "", adminPw: "" };

export default function FranchisesAdmin() {
  const { tenant, settings, setSettings, franchises, addFranchise, removeFranchise, setFranchiseFruits } = useStore();
  const [f, setF] = useState(BLANK);
  const [error, setError] = useState("");
  const set = (k: keyof typeof BLANK, v: string) => setF((x) => ({ ...x, [k]: v }));

  if (tenant !== HQ) return <p className="py-20 text-center text-ink-900/60">프렌차이즈 관리는 본사에서만 할 수 있습니다.</p>;

  // dev (localhost/IP) can't use subdomains → ?tenant=; real hosts → seoul.<root domain>
  const url = (fid: string) =>
    /^(localhost|\d)/.test(location.hostname) ? `/?tenant=${fid}` : `${location.protocol}//${fid}.${location.host.replace(/^www\./, "")}`;

  async function create(e: React.FormEvent) {
    e.preventDefault();
    const id = f.id.trim().toLowerCase();
    if (!TENANT_RE.test(id) || RESERVED.includes(id)) return setError("서브도메인은 영문 소문자·숫자·하이픈(최대 30자)만 쓸 수 있습니다.");
    try {
      await addFranchise({ ...f, id });
      setF(BLANK);
      setError("");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  function remove(x: FranchiseRow) {
    if (confirm(`'${x.name}'(${x.id}) 프렌차이즈와 그 주문·예약·메뉴·관리자 계정을 모두 삭제할까요? 되돌릴 수 없습니다.`)) removeFranchise(x.id);
  }

  const rows = [
    { id: HQ, name: "본사", fruits: settings.fruitsEnabled, toggle: (on: boolean) => setSettings((s) => ({ ...s, fruitsEnabled: on })), f: null as FranchiseRow | null },
    ...franchises.map((x) => ({ id: x.id, name: x.name, fruits: x.fruitsEnabled, toggle: (on: boolean) => setFranchiseFruits(x.id, on), f: x })),
  ];

  return (
    <div>
      <h1 className="font-serif text-3xl">프렌차이즈 관리</h1>
      <p className="text-sm text-ink-900/50">
        등록하면 본사의 메뉴(과일·바구니)가 복사되고, 가맹점 관리자 계정이 만들어집니다. 주문·배송·예약은 가맹점마다 따로 관리됩니다.
      </p>

      <form onSubmit={create} className="mt-6 flex flex-wrap items-end gap-3 border border-ink-900/10 bg-white p-5">
        <label className="block text-xs text-ink-900/60">
          가맹점 이름
          <input className="field mt-1 w-40" value={f.name} onChange={(e) => set("name", e.target.value)} placeholder="서울점" required />
        </label>
        <label className="block text-xs text-ink-900/60">
          서브도메인
          <span className="mt-1 flex items-center gap-1">
            <input className="field w-32" value={f.id} onChange={(e) => set("id", e.target.value)} placeholder="seoul" required />
            <span className="text-sm text-ink-900/50">.도메인</span>
          </span>
        </label>
        <label className="block text-xs text-ink-900/60">
          관리자 아이디
          <input className="field mt-1 w-36" value={f.adminId} onChange={(e) => set("adminId", e.target.value)} autoComplete="off" required />
        </label>
        <label className="block text-xs text-ink-900/60">
          관리자 비밀번호 (8자 이상)
          <input className="field mt-1 w-44" type="password" minLength={8} value={f.adminPw} onChange={(e) => set("adminPw", e.target.value)} autoComplete="new-password" required />
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
                <td className="p-3 text-ink-900/70">{r.f ? `${r.id}.도메인` : "www.도메인"}</td>
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
                      <button className="text-coral-500 hover:underline" onClick={() => remove(r.f!)}>삭제</button>
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

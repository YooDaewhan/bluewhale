"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useState } from "react";
import { useStore, type Role } from "../store";

const DEMO: Record<Role, { id: string; pw: string; label: string }> = {
  customer: { id: "customer", pw: "1234", label: "고객" },
  admin: { id: "admin", pw: "admin1234", label: "관리자" },
};

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [role, setRole] = useState<Role>("customer");
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const u = login(id, pw, role);
    if (!u) return setError(`${DEMO[role].label} 아이디 또는 비밀번호가 올바르지 않습니다.`);
    router.push(u.role === "admin" ? "/admin" : "/");
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="mb-6 text-center">
        <img src="/brand/logo.webp" alt="Bluewhale The Fruit" className="mx-auto h-44 w-auto" />
        <h1 className="mt-4 font-serif text-2xl">로그인</h1>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-sm bg-ink-900/5 p-1 text-sm font-semibold">
        {(Object.keys(DEMO) as Role[]).map((r) => (
          <button
            key={r}
            type="button"
            onClick={() => { setRole(r); setError(""); }}
            className={`rounded-md py-2 ${role === r ? "bg-white shadow text-ink-800" : "text-ink-900/50"}`}
          >
            {DEMO[r].label}
          </button>
        ))}
      </div>

      <form onSubmit={submit} className="space-y-3 rounded-sm bg-white p-6 border border-ink-900/10">
        <input className="field" placeholder="아이디" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" />
        <input className="field" type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" />
        {error && <p className="text-sm text-coral-500">{error}</p>}
        <button className="btn w-full">로그인</button>
        <button
          type="button"
          onClick={() => { setId(DEMO[role].id); setPw(DEMO[role].pw); }}
          className="w-full text-xs text-ink-600 underline"
        >
          데모 {DEMO[role].label} 계정 채우기 ({DEMO[role].id} / {DEMO[role].pw})
        </button>
      </form>
    </div>
  );
}

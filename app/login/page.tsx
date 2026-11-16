"use client";

/* eslint-disable @next/next/no-img-element */

import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { useStore } from "../store";

export default function LoginPage() {
  const { login } = useStore();
  const router = useRouter();
  const [admin, setAdmin] = useState(false);
  const [id, setId] = useState("");
  const [pw, setPw] = useState("");
  const [error, setError] = useState("");
  // /login#admin opens the admin tab (hash read after mount to avoid hydration mismatch)
  useEffect(() => { if (location.hash === "#admin") setAdmin(true); }, []);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    try {
      await login(id, pw);
      router.push("/admin");
    } catch (err) {
      setError((err as Error).message);
    }
  }

  return (
    <div className="mx-auto max-w-sm px-4 py-16">
      <div className="mb-6 text-center">
        <img src="/brand/logo.webp" alt="Bluewhale The Fruit" className="mx-auto h-44 w-auto" />
        <h1 className="mt-4 font-serif text-2xl">로그인</h1>
      </div>

      <div className="mb-4 grid grid-cols-2 rounded-sm bg-ink-900/5 p-1 text-sm font-semibold">
        {[false, true].map((a) => (
          <button
            key={String(a)}
            type="button"
            onClick={() => { setAdmin(a); setError(""); }}
            className={`rounded-md py-2 ${admin === a ? "bg-white shadow text-ink-800" : "text-ink-900/50"}`}
          >
            {a ? "관리자" : "고객"}
          </button>
        ))}
      </div>

      {admin ? (
        <form onSubmit={submit} className="space-y-3 rounded-sm bg-white p-6 border border-ink-900/10">
          <input className="field" placeholder="아이디" value={id} onChange={(e) => setId(e.target.value)} autoComplete="username" required />
          <input className="field" type="password" placeholder="비밀번호" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="current-password" required />
          {error && <p className="text-sm text-coral-500">{error}</p>}
          <button className="btn w-full">로그인</button>
        </form>
      ) : (
        // ponytail: Kakao login is not wired yet (needs the Kakao app key); members.kakao_id is ready for it
        <div className="rounded-sm border border-ink-900/10 bg-white p-6 text-center">
          <button type="button" disabled className="flex w-full items-center justify-center gap-2 rounded-md bg-[#FEE500] py-3.5 text-sm font-semibold text-black/85 opacity-50">
            카카오로 시작하기 (준비 중)
          </button>
          <p className="mt-4 text-sm text-ink-900/60">지금은 로그인 없이 바구니 예약과 주문을 하실 수 있어요.</p>
        </div>
      )}
    </div>
  );
}

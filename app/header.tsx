"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useStore } from "./store";

export default function Header() {
  const { user, logout, cart } = useStore();
  const count = cart.length;
  const item = "rounded-full px-2 py-1.5 font-semibold hover:bg-brand/10 sm:px-3";

  return (
    <header className="sticky top-0 z-20 border-b border-brand/10 bg-white/90 text-ocean-950 backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-2">
        <Link href="/" className="flex shrink-0 items-center gap-2" aria-label="Bluewhale The Fruit 홈">
          <img src="/brand/whale-fruits.webp" alt="" className="h-10 w-auto" />
          <img src="/brand/wordmark.webp" alt="Bluewhale The Fruit" className="hidden h-9 w-auto min-[400px]:block" />
        </Link>
        <nav className="flex items-center gap-0.5 whitespace-nowrap text-sm sm:gap-2">
          <Link href="/" className={`hidden sm:inline ${item}`}>상품</Link>
          <Link href="/cart" className={item}>
            장바구니{count > 0 && <span className="ml-1 rounded-full bg-coral-500 px-1.5 text-xs text-white">{count}</span>}
          </Link>
          {user?.role === "admin" && <Link href="/admin" className={item}>관리자</Link>}
          {user ? (
            <button onClick={logout} className="rounded-full border border-brand/30 px-2.5 py-1.5 font-semibold hover:bg-brand/10 sm:px-3">
              <span className="hidden sm:inline">{user.name} · </span>로그아웃
            </button>
          ) : (
            <Link href="/login" className="rounded-full bg-brand px-3 py-1.5 font-bold text-white hover:bg-ocean-600">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

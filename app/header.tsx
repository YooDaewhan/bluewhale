"use client";

import Link from "next/link";
import { useStore } from "./store";

export default function Header() {
  const { user, logout, cart } = useStore();
  const count = cart.length;

  return (
    <header className="sticky top-0 z-20 bg-ocean-950/90 text-white backdrop-blur">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3">
        <Link href="/" className="flex shrink-0 items-center gap-2 text-base font-extrabold tracking-wide sm:text-lg">
          <span className="text-2xl">🐋</span>
          <span className="hidden min-[400px]:inline">BLUEWHALE</span>
          <span className="hidden text-xs font-medium text-lagoon-300 sm:inline">Tropical Fruit</span>
        </Link>
        <nav className="flex items-center gap-0.5 whitespace-nowrap text-sm sm:gap-3">
          <Link href="/" className="hidden rounded-full px-3 py-1.5 hover:bg-white/10 sm:inline">상품</Link>
          <Link href="/cart" className="rounded-full px-2 py-1.5 hover:bg-white/10 sm:px-3">
            장바구니{count > 0 && <span className="ml-1 rounded-full bg-coral-500 px-1.5 text-xs">{count}</span>}
          </Link>
          {user?.role === "admin" && (
            <Link href="/admin" className="rounded-full px-2 py-1.5 sm:px-3 hover:bg-white/10">관리자</Link>
          )}
          {user ? (
            <button onClick={logout} className="rounded-full border border-white/30 px-2.5 py-1.5 sm:px-3 hover:bg-white/10">
              <span className="hidden sm:inline">{user.name} · </span>로그아웃
            </button>
          ) : (
            <Link href="/login" className="rounded-full bg-lagoon-400 px-3 py-1.5 font-semibold text-ocean-950 hover:bg-lagoon-300">
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}

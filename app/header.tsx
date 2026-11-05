"use client";

/* eslint-disable @next/next/no-img-element */
import Link from "next/link";
import { useStore } from "./store";

const item = "py-1 text-[11px] font-medium uppercase tracking-[0.2em] text-ink-900/80 underline-offset-8 hover:text-ink-950 hover:underline";

export default function Header() {
  const { user, logout, cart } = useStore();
  const count = cart.length;

  return (
    <header className="sticky top-0 z-20 border-b border-ink-900/10 bg-ivory/85 backdrop-blur-md">
      <div className="mx-auto flex max-w-6xl items-center justify-between gap-2 px-4 py-3 sm:grid sm:grid-cols-[1fr_auto_1fr]">
        <nav className="hidden items-center gap-5 sm:flex">
          <Link href="/#products" className={`hidden sm:inline ${item}`}>Collection</Link>
          <Link href="/#story" className={`hidden sm:inline ${item}`}>Story</Link>
        </nav>

        <Link href="/" className="flex items-center gap-2" aria-label="Bluewhale The Fruit 홈">
          <img src="/brand/whale-fruits.webp" alt="" className="h-9 w-auto" />
          <span className="hidden font-serif text-2xl font-medium tracking-[0.18em] min-[400px]:inline">BLUEWHALE</span>
        </Link>

        <nav className="flex items-center justify-end gap-4 whitespace-nowrap sm:gap-5">
          {user?.role === "admin" && <Link href="/admin" className={item}>Admin</Link>}
          {user ? (
            <button onClick={logout} className={item}>
              <span className="hidden sm:inline">{user.name} · </span>Logout
            </button>
          ) : (
            <Link href="/login" className={item}>Login</Link>
          )}
          <Link href="/cart" className={item}>
            Bag ({count})
          </Link>
        </nav>
      </div>
    </header>
  );
}

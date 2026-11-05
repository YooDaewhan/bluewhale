"use client";

import { useEffect, useState } from "react";

const SLIDES = [
  { src: "/slides/1.jpg", pos: "50% 15%", eyebrow: "INTO THE JUNGLE", title: "열대의 숲에서\n막 깨어난 신선함", text: "산지에서 완숙된 과일만 골라 콜드체인으로 직송합니다." },
  { src: "/slides/2.jpg", pos: "50% 45%", eyebrow: "SUNSET ON THE SEA", title: "노을 지는 바다처럼\n달콤한 한 잔", text: "라즈베리, 라임, 패션프루트로 만드는 홈 칵테일." },
  { src: "/slides/3.jpg", pos: "50% 55%", eyebrow: "ISLAND BREAKFAST", title: "섬의 아침을\n그대로 식탁 위에", text: "코코넛·바나나·망고로 채우는 오늘의 스무디볼." },
];

export default function HeroSlider() {
  const [i, setI] = useState(0);
  const [paused, setPaused] = useState(false);

  useEffect(() => {
    if (paused) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), 5000);
    return () => clearTimeout(t);
  }, [i, paused]);

  const go = (n: number) => setI((n + SLIDES.length) % SLIDES.length);

  return (
    <section
      className="relative h-[70vh] min-h-[420px] overflow-hidden bg-ocean-950 text-white"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      aria-roledescription="carousel"
    >
      <div className="flex h-full transition-transform duration-700 ease-out" style={{ transform: `translateX(-${i * 100}%)` }}>
        {SLIDES.map((s, n) => (
          <div key={s.src} className="relative h-full w-full shrink-0" aria-hidden={n !== i}>
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src={s.src} alt="" style={{ objectPosition: s.pos }} className="h-full w-full object-cover" loading={n === 0 ? "eager" : "lazy"} />
            <div className="absolute inset-0 bg-gradient-to-r from-ocean-950/85 via-ocean-950/40 to-transparent" />
            <div className="absolute inset-0 mx-auto flex max-w-6xl flex-col justify-center px-4">
              <p className="text-xs font-semibold tracking-[0.3em] text-lagoon-300 sm:text-sm">{s.eyebrow}</p>
              <h1 className="mt-3 whitespace-pre-line text-3xl font-extrabold leading-tight drop-shadow sm:text-5xl">{s.title}</h1>
              <p className="mt-4 max-w-md text-white/80">{s.text}</p>
              <a href="#products" className="mt-6 w-fit rounded-full bg-lagoon-400 px-5 py-2.5 text-sm font-bold text-ocean-950 hover:bg-lagoon-300">
                시즌 과일 보러가기 →
              </a>
            </div>
          </div>
        ))}
      </div>

      {/* mascot runs across every slide */}
      <img src="/brand/mascot.webp" alt="" className="pointer-events-none absolute bottom-8 right-16 hidden h-60 w-auto drop-shadow-2xl md:block lg:right-24 lg:h-80" />

      <button onClick={() => go(i - 1)} className="absolute left-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-xl backdrop-blur hover:bg-white/35 sm:block" aria-label="이전 슬라이드">‹</button>
      <button onClick={() => go(i + 1)} className="absolute right-3 top-1/2 hidden h-10 w-10 -translate-y-1/2 rounded-full bg-white/20 text-xl backdrop-blur hover:bg-white/35 sm:block" aria-label="다음 슬라이드">›</button>
      <div className="absolute bottom-10 left-1/2 flex -translate-x-1/2 gap-2">
        {SLIDES.map((s, n) => (
          <button key={s.src} onClick={() => go(n)} aria-label={`${n + 1}번 슬라이드`} className={`h-2 rounded-full transition-all ${n === i ? "w-8 bg-white" : "w-2 bg-white/50"}`} />
        ))}
      </div>

      <svg className="absolute bottom-0 left-0 w-full text-sand-50" viewBox="0 0 1440 60" preserveAspectRatio="none" aria-hidden>
        <path fill="currentColor" d="M0,30 C240,60 480,0 720,24 C960,48 1200,8 1440,30 L1440,60 L0,60 Z" />
      </svg>
    </section>
  );
}

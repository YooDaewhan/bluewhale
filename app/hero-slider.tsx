"use client";

/* eslint-disable @next/next/no-img-element */
import { useEffect, useState } from "react";
import { useStore, type Slide } from "./store";

const DURATION = 6000;
// shown until the admin saves their own slides (admin → 메인 슬라이드)
export const DEFAULT_SLIDES: Slide[] = [
  { image: "/slides/1.jpg", pos: "50% 15%", eyebrow: "Collection No.01 — The Jungle", title: "열대의 숲에서\n막 깨어난 신선함", text: "산지에서 완숙된 과일만 골라 72시간 안에 식탁으로." },
  { image: "/slides/2.jpg", pos: "50% 45%", eyebrow: "Collection No.02 — Sunset", title: "노을 지는 바다처럼\n달콤한 한 잔", text: "라즈베리, 라임, 패션프루트로 완성하는 홈 칵테일." },
  { image: "/slides/3.jpg", pos: "50% 55%", eyebrow: "Collection No.03 — Island Morning", title: "섬의 아침을\n그대로 식탁 위에", text: "코코넛 · 바나나 · 망고로 채우는 오늘의 스무디볼." },
];

export default function HeroSlider() {
  const { ready, slides } = useStore();
  // nothing until the tenant's slides are loaded, so the defaults never flash before custom ones
  const SLIDES = !ready ? [] : slides.length ? slides : DEFAULT_SLIDES;
  const [at, setI] = useState(0);
  const i = SLIDES.length ? at % SLIDES.length : 0;

  useEffect(() => {
    if (SLIDES.length < 2) return;
    const t = setTimeout(() => setI((n) => (n + 1) % SLIDES.length), DURATION);
    return () => clearTimeout(t);
  }, [at, SLIDES.length]);

  return (
    <section className="relative h-[calc(100svh-96px)] min-h-[480px] overflow-hidden bg-ink-950 text-ivory" aria-roledescription="carousel">
      {/* slow crossfade + gentle zoom, restrained like luxury editorials */}
      {SLIDES.map((s, n) => (
        <div key={n} className={`absolute inset-0 transition-opacity duration-[1500ms] ${n === i ? "opacity-100" : "opacity-0"}`} aria-hidden={n !== i}>
          <img
            src={s.image}
            alt=""
            style={{ objectPosition: s.pos }}
            className={`h-full w-full object-cover transition-transform duration-[7000ms] ease-out ${n === i ? "scale-105" : "scale-100"}`}
            loading={n === 0 ? "eager" : "lazy"}
          />
          <div className="absolute inset-0 bg-gradient-to-t from-ink-950/85 via-ink-950/35 to-transparent" />
          <div className="absolute inset-0 bg-gradient-to-r from-ink-950/55 to-transparent" />
        </div>
      ))}

      {SLIDES.length > 0 && (
      <div className="absolute inset-x-0 bottom-0 mx-auto max-w-6xl px-4 pb-16 sm:pb-20">
        <p key={`e${i}`} className="text-[11px] uppercase tracking-[0.35em] text-gold-300">{SLIDES[i].eyebrow}</p>
        <h1 key={`t${i}`} className="mt-4 whitespace-pre-line font-serif text-4xl font-normal leading-[1.15] sm:text-6xl">{SLIDES[i].title}</h1>
        <p className="mt-4 max-w-md text-sm text-ivory/75">{SLIDES[i].text}</p>
        <a href="#products" className="mt-8 inline-block border border-ivory/70 px-7 py-3 text-[11px] uppercase tracking-[0.3em] transition hover:bg-ivory hover:text-ink-950">
          Discover the Collection
        </a>

        {SLIDES.length > 1 && <div className="mt-10 flex max-w-xs gap-2">
          {SLIDES.map((_, n) => (
            <button key={n} onClick={() => setI(n)} aria-label={`${n + 1}번 슬라이드`} className="h-6 flex-1">
              <span className="block h-px w-full bg-ivory/30">
                <span
                  key={n === i ? `on${i}` : "off"}
                  className="block h-px bg-ivory"
                  style={n === i ? { animation: `grow ${DURATION}ms linear forwards` } : { width: n < i ? "100%" : "0%" }}
                />
              </span>
            </button>
          ))}
        </div>}
      </div>
      )}
    </section>
  );
}

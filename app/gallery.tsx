"use client";

/* eslint-disable @next/next/no-img-element */
import { useRef, useState, type ReactNode } from "react";

// Detail-page photo slider. ponytail: native CSS scroll-snap does the swiping (touch, trackpad, keyboard);
// the arrows and dots just scroll the same strip.
export default function Gallery({ images, alt, className = "", children }: { images: string[]; alt: string; className?: string; children?: ReactNode }) {
  const strip = useRef<HTMLDivElement>(null);
  const [i, setI] = useState(0);
  const go = (n: number) => {
    const el = strip.current!;
    el.scrollTo({ left: Math.max(0, Math.min(images.length - 1, n)) * el.clientWidth, behavior: "smooth" });
  };
  const many = images.length > 1;

  return (
    <div className={`relative ${className}`} aria-roledescription="carousel">
      <div
        ref={strip}
        onScroll={(e) => setI(Math.round(e.currentTarget.scrollLeft / e.currentTarget.clientWidth))}
        className="flex h-full snap-x snap-mandatory overflow-x-auto overscroll-x-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
      >
        {images.map((src, n) => (
          <img key={src + n} src={src} alt={`${alt} ${n + 1}`} loading={n ? "lazy" : "eager"} className="h-full w-full shrink-0 snap-center object-cover" />
        ))}
      </div>
      {children}
      {many && (
        <>
          <button type="button" onClick={() => go(i - 1)} disabled={i === 0} aria-label="이전 사진" className="absolute left-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ivory/85 text-lg shadow transition hover:bg-ivory disabled:opacity-0">‹</button>
          <button type="button" onClick={() => go(i + 1)} disabled={i === images.length - 1} aria-label="다음 사진" className="absolute right-3 top-1/2 grid h-10 w-10 -translate-y-1/2 place-items-center rounded-full bg-ivory/85 text-lg shadow transition hover:bg-ivory disabled:opacity-0">›</button>
          <div className="absolute inset-x-0 bottom-4 flex justify-center gap-1.5">
            {images.map((_, n) => (
              <button key={n} type="button" onClick={() => go(n)} aria-label={`${n + 1}번 사진`} className={`h-1.5 rounded-full transition-all ${n === i ? "w-6 bg-ivory" : "w-1.5 bg-ivory/50"}`} />
            ))}
          </div>
          <span className="absolute right-4 top-4 bg-ink-950/60 px-2 py-0.5 text-[11px] text-ivory">{i + 1} / {images.length}</span>
        </>
      )}
    </div>
  );
}

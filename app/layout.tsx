import type { Metadata } from "next";
import { Cormorant_Garamond, Noto_Serif_KR } from "next/font/google";
import "./globals.css";
import { StoreProvider } from "./store";
import Header from "./header";

const cormorant = Cormorant_Garamond({ subsets: ["latin"], weight: ["400", "500", "600"], style: ["normal", "italic"], variable: "--font-cormorant" });
const notoSerifKr = Noto_Serif_KR({ subsets: ["latin"], weight: ["400", "600"], variable: "--font-noto-serif-kr", preload: false });

export const metadata: Metadata = {
  title: "Bluewhale The Fruit · 열대과일 직송",
  description: "바다 건너 온 열대과일, 블루웨일이 신선하게 실어 나릅니다.",
};

const NOTICE = ["산지 직송 · Farm to Table", "당도 선별 인증", "5만원 이상 무료배송", "72시간 콜드체인", "선물 포장 무료"];

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className={`h-full antialiased ${cormorant.variable} ${notoSerifKr.variable}`}>
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <div className="overflow-hidden bg-ink-950 py-2 text-[11px] uppercase tracking-[0.3em] text-ivory/80" aria-label="공지">
            <div className="flex w-max animate-[marquee_40s_linear_infinite] gap-12 whitespace-nowrap">
              {[...NOTICE, ...NOTICE, ...NOTICE, ...NOTICE].map((t, i) => (
                <span key={i} aria-hidden={i >= NOTICE.length}>✦ {t}</span>
              ))}
            </div>
          </div>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-ink-900/10 bg-ivory">
            <div className="mx-auto grid max-w-6xl gap-10 px-4 py-16 sm:grid-cols-[1.4fr_1fr_1fr]">
              <div>
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src="/brand/logo.webp" alt="Bluewhale The Fruit" className="h-28 w-auto" />
                <p className="mt-4 max-w-xs font-serif text-lg italic text-ink-600">
                  바다 건너 온 열대의 맛을, 가장 좋은 순간에.
                </p>
              </div>
              <div className="text-sm leading-7 text-ink-600">
                <p className="eyebrow mb-3">Customer Care</p>
                <p>평일 10:00 – 17:00</p>
                <p>hello@bluewhale.fruit</p>
                <p>교환 · 환불 안내</p>
              </div>
              <div className="text-sm leading-7 text-ink-600">
                <p className="eyebrow mb-3">Our Promise</p>
                <p>산지 완숙 수확</p>
                <p>72시간 콜드체인</p>
                <p>당도 미달 시 100% 재배송</p>
              </div>
            </div>
            <p className="border-t border-ink-900/10 py-5 text-center text-[11px] uppercase tracking-[0.3em] text-ink-900/40">
              © 2026 Bluewhale The Fruit · Demo (실제 주문/결제 없음)
            </p>
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}

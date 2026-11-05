import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "./store";
import Header from "./header";

export const metadata: Metadata = {
  title: "Bluewhale The Fruit · 열대과일 직송",
  description: "바다 건너 온 열대과일, 블루웨일이 신선하게 실어 나릅니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="border-t border-brand/10 bg-white py-10 text-center text-xs text-ocean-900/50">
            {/* eslint-disable-next-line @next/next/no-img-element */}
            <img src="/brand/logo.webp" alt="Bluewhale The Fruit" className="mx-auto mb-4 h-32 w-auto" />
            바다 건너 온 열대과일, 블루웨일이 신선하게 실어 나릅니다.
            <br />
            데모 사이트 (실제 주문/결제 없음)
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}

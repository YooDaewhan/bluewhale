import type { Metadata } from "next";
import "./globals.css";
import { StoreProvider } from "./store";
import Header from "./header";

export const metadata: Metadata = {
  title: "BLUEWHALE · 열대과일 직송",
  description: "바다 건너 온 열대과일, 블루웨일이 신선하게 실어 나릅니다.",
};

export default function RootLayout({ children }: LayoutProps<"/">) {
  return (
    <html lang="ko" className="h-full antialiased">
      <body className="flex min-h-full flex-col">
        <StoreProvider>
          <Header />
          <main className="flex-1">{children}</main>
          <footer className="bg-ocean-950 py-6 text-center text-xs text-white/50">
            🐋 BLUEWHALE Tropical Fruit · 데모 사이트 (실제 주문/결제 없음)
          </footer>
        </StoreProvider>
      </body>
    </html>
  );
}

"use client";

import { createContext, useContext, useEffect, useState, type ReactNode } from "react";

export type Product = {
  id: number;
  emoji: string;
  name: string;
  origin: string;
  pricePerKg: number;
  description: string;
  saleStart: string; // YYYY-MM-DD
  saleEnd: string;
};
export type Role = "admin" | "customer";
export type User = { id: string; name: string; role: Role };
export type CartItem = { productId: number; kg: number };

export const INITIAL_PRODUCTS: Product[] = [
  { id: 1, emoji: "🥭", name: "애플망고", origin: "필리핀 세부", pricePerKg: 18900, description: "나무에서 완숙시켜 항공 직송한 진한 향의 애플망고. 과즙이 풍부하고 섬유질이 적어요.", saleStart: "2026-10-01", saleEnd: "2026-12-31" },
  { id: 2, emoji: "🍍", name: "골드 파인애플", origin: "코스타리카", pricePerKg: 7900, description: "당도 15브릭스 이상만 선별한 골드 품종. 신맛이 적고 속까지 노랗게 익었습니다.", saleStart: "2026-09-15", saleEnd: "2027-01-31" },
  { id: 3, emoji: "🍌", name: "고산지 바나나", origin: "에콰도르", pricePerKg: 4900, description: "해발 800m 이상 고산지에서 천천히 자라 쫀득하고 단맛이 깊은 바나나.", saleStart: "2026-01-01", saleEnd: "2026-12-31" },
  { id: 4, emoji: "🥥", name: "영 코코넛", origin: "태국 남부", pricePerKg: 6500, description: "빨대 꽂아 바로 마시는 시원한 코코넛 워터. 속살은 숟가락으로 떠먹어요.", saleStart: "2026-10-10", saleEnd: "2026-11-30" },
  { id: 5, emoji: "🐉", name: "레드 용과", origin: "베트남 빈투언", pricePerKg: 12900, description: "속까지 붉은 레드 용과. 은은한 단맛과 아삭한 씨앗 식감이 매력입니다.", saleStart: "2026-08-01", saleEnd: "2026-11-20" },
  { id: 6, emoji: "🍈", name: "레인보우 파파야", origin: "하와이", pricePerKg: 9800, description: "버터처럼 부드러운 과육의 파파야. 라임즙을 살짝 뿌려 드시면 더 맛있어요.", saleStart: "2026-11-01", saleEnd: "2027-02-28" },
  { id: 7, emoji: "🍋", name: "키 라임", origin: "멕시코", pricePerKg: 8900, description: "작지만 향이 강한 키 라임. 모히토와 타코, 해산물 요리에 제격입니다.", saleStart: "2026-06-01", saleEnd: "2026-12-15" },
  { id: 8, emoji: "🥑", name: "하스 아보카도", origin: "페루", pricePerKg: 11500, description: "고소하고 크리미한 하스 품종. 껍질이 검게 변하면 먹기 좋게 익은 거예요.", saleStart: "2026-05-01", saleEnd: "2026-10-31" },
  { id: 9, emoji: "🍒", name: "생 리치", origin: "대만", pricePerKg: 21000, description: "얼리지 않은 생 리치. 장미 향 같은 화사한 향과 탱글한 과육.", saleStart: "2026-12-01", saleEnd: "2027-03-31" },
  { id: 10, emoji: "🟣", name: "패션프루트", origin: "브라질", pricePerKg: 15900, description: "새콤달콤한 열대의 향. 반으로 갈라 요거트에 올리거나 에이드로 즐기세요.", saleStart: "2026-10-20", saleEnd: "2027-01-15" },
];

// ponytail: mock accounts in client code, swap for real auth when there's a backend
export const ACCOUNTS: (User & { pw: string })[] = [
  { id: "admin", pw: "admin1234", name: "관리자", role: "admin" },
  { id: "customer", pw: "1234", name: "김고래", role: "customer" },
];

export type SaleStatus = "upcoming" | "onsale" | "ended";
export function saleStatus(p: Product, today: string): SaleStatus {
  if (today < p.saleStart) return "upcoming";
  if (today > p.saleEnd) return "ended";
  return "onsale";
}

export const won = (n: number) => n.toLocaleString("ko-KR") + "원";

// ponytail: localStorage only, mock — every browser has its own "DB"
function usePersisted<T>(key: string, initial: T) {
  const [value, setValue] = useState(initial);
  const [ready, setReady] = useState(false);
  useEffect(() => {
    try {
      const saved = localStorage.getItem(key);
      if (saved) setValue(JSON.parse(saved));
    } catch {}
    setReady(true);
  }, [key]);
  useEffect(() => {
    if (!ready) return;
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value, ready]);
  return [value, setValue, ready] as const;
}

type Store = {
  ready: boolean;
  today: string;
  products: Product[];
  setProducts: (fn: (p: Product[]) => Product[]) => void;
  user: User | null;
  login: (id: string, pw: string, role: Role) => User | null;
  logout: () => void;
  cart: CartItem[];
  addToCart: (productId: number, kg: number) => void;
  setKg: (productId: number, kg: number) => void;
  clearCart: () => void;
};

const Ctx = createContext<Store | null>(null);

export function StoreProvider({ children }: { children: ReactNode }) {
  const [products, setProducts, r1] = usePersisted("bw-products", INITIAL_PRODUCTS);
  const [user, setUser, r2] = usePersisted<User | null>("bw-user", null);
  const [cart, setCart, r3] = usePersisted<CartItem[]>("bw-cart", []);
  // read the clock after mount, not during prerender
  const [today, setToday] = useState("");
  useEffect(() => setToday(new Date().toISOString().slice(0, 10)), []);

  const store: Store = {
    ready: r1 && r2 && r3 && today !== "",
    today,
    products,
    setProducts,
    user,
    login(id, pw, role) {
      const acc = ACCOUNTS.find((a) => a.id === id && a.pw === pw && a.role === role);
      const u = acc ? { id: acc.id, name: acc.name, role: acc.role } : null;
      setUser(u);
      return u;
    },
    logout: () => setUser(null),
    cart,
    addToCart: (productId, kg) =>
      setCart((c) =>
        c.some((i) => i.productId === productId)
          ? c.map((i) => (i.productId === productId ? { ...i, kg: i.kg + kg } : i))
          : [...c, { productId, kg }],
      ),
    setKg: (productId, kg) =>
      setCart((c) => (kg <= 0 ? c.filter((i) => i.productId !== productId) : c.map((i) => (i.productId === productId ? { ...i, kg } : i)))),
    clearCart: () => setCart([]),
  };

  return <Ctx.Provider value={store}>{children}</Ctx.Provider>;
}

export function useStore() {
  const s = useContext(Ctx);
  if (!s) throw new Error("useStore outside StoreProvider");
  return s;
}

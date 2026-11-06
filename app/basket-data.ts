// Gift basket catalog, options and pricing. Pure data + functions (no React) so it can be tested with plain node.

const u = (id: string) => `https://images.unsplash.com/photo-${id}?w=900&h=1100&fit=crop&auto=format&q=80`;

export type SizeId = string; // S/M/L/XL for the defaults, generated ids for admin-added baskets
export type BasketFruit = { productId: number; kg: number }; // composition, references Product.id
export type BasketSize = {
  id: SizeId;
  ko: string; // display name (소/중/대/특대 or anything the admin types)
  en: string;
  price: number;
  serves: string;
  items: BasketFruit[];
  note: string; // non-fruit extras, e.g. "생화 장식 + 원목 크레이트"
  desc: string;
  image: string;
  active: boolean; // hidden from customers when false
};

const f = (productId: number, kg: number): BasketFruit => ({ productId, kg });

// product ids: 1 망고 2 파인애플 3 바나나 4 코코넛 5 용과 6 파파야 7 라임 8 아보카도 9 리치 10 패션프루트
export const INITIAL_BASKETS: BasketSize[] = [
  { id: "S", ko: "소", en: "Petite", price: 39000, serves: "1–2인", items: [f(1, 1), f(7, 0.5), f(10, 0.5)], note: "", desc: "가볍게 마음을 전하기 좋은 작은 바구니. 집들이, 병문안, 작은 감사 인사에.", image: u("1629905707362-03cf1a9f6e2d"), active: true },
  { id: "M", ko: "중", en: "Classic", price: 69000, serves: "3–4인", items: [f(1, 1.5), f(2, 1), f(3, 0.5), f(5, 0.5), f(9, 0.5)], note: "", desc: "가장 많이 찾는 시그니처 구성. 색감이 고르게 어우러지도록 직접 담습니다.", image: u("1773823307113-2dcc3609aa79"), active: true },
  { id: "L", ko: "대", en: "Grand", price: 119000, serves: "5–8인", items: [f(1, 2), f(2, 1), f(6, 1), f(4, 1), f(5, 1), f(8, 0.5), f(9, 0.5)], note: "", desc: "명절·기업 선물용 대형 바구니. 열대과일 7종을 풍성하게 담았습니다.", image: u("1619566636858-adf3ef46400b"), active: true },
  { id: "XL", ko: "특대", en: "Royal Hamper", price: 189000, serves: "10인 이상", items: [f(1, 3), f(2, 2), f(3, 1), f(4, 1), f(5, 1), f(6, 1), f(7, 0.5), f(8, 0.5), f(9, 0.5), f(10, 0.5)], note: "생화 장식 + 원목 크레이트", desc: "원목 크레이트에 생화와 함께 담는 최상위 구성. 행사, VIP 선물, 개업 축하에.", image: u("1773450970959-cef81e9b1053"), active: true },
];

export const basketWeight = (b: Pick<BasketSize, "items">) => b.items.reduce((s, i) => s + i.kg, 0);
// fruit cost at current per-kg prices, used by admin to set the basket price
export const basketCost = (b: Pick<BasketSize, "items">, priceOf: (productId: number) => number) =>
  Math.round(b.items.reduce((s, i) => s + priceOf(i.productId) * i.kg, 0));

export type WrapId = "kraft" | "bojagi-indigo" | "bojagi-blush" | "bojagi-ivory";
export const WRAPS: { id: WrapId; name: string; price: number; color: string }[] = [
  { id: "kraft", name: "기본 · 크라프트 포장", price: 0, color: "#c8a97e" },
  { id: "bojagi-indigo", name: "보자기 · 쪽빛", price: 5000, color: "#2f4170" },
  { id: "bojagi-blush", name: "보자기 · 연분홍", price: 5000, color: "#e6bcbc" },
  { id: "bojagi-ivory", name: "보자기 · 아이보리 실크", price: 8000, color: "#ece3cf" },
];

export type ExtraId = "ribbon" | "card" | "flower";
export const EXTRAS: { id: ExtraId; name: string; price: number }[] = [
  { id: "ribbon", name: "새틴 리본", price: 2000 },
  { id: "card", name: "손글씨 메시지 카드", price: 3000 },
  { id: "flower", name: "생화 한 송이 장식", price: 7000 },
];

export const MESSAGES = ["늘 고맙습니다", "축하합니다", "건강하세요", "사랑합니다", "새해 복 많이 받으세요", "개업을 축하드립니다", "쾌유를 빕니다"];
export const PICKUP_TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export type BasketLine = { size: SizeId; qty: number };
export type ReservationStatus = "예약" | "준비완료" | "픽업완료" | "취소";
export type Reservation = {
  id: string;
  pickupDate: string; // YYYY-MM-DD
  pickupTime: string;
  name: string;
  phone: string;
  items: BasketLine[];
  wrap: WrapId;
  extras: ExtraId[];
  message: string;
  memo: string;
  total: number;
  status: ReservationStatus;
};

// wrap and extras are applied to every basket in the order
export function basketTotal(items: BasketLine[], wrap: WrapId, extras: ExtraId[], baskets: BasketSize[] = INITIAL_BASKETS): number {
  const count = items.reduce((s, l) => s + l.qty, 0);
  const base = items.reduce((s, l) => s + (baskets.find((b) => b.id === l.size)?.price ?? 0) * l.qty, 0);
  const perBasket = (WRAPS.find((w) => w.id === wrap)?.price ?? 0) + extras.reduce((s, e) => s + (EXTRAS.find((x) => x.id === e)?.price ?? 0), 0);
  return base + perBasket * count;
}

const r = (id: string, pickupDate: string, pickupTime: string, name: string, phone: string, items: BasketLine[], wrap: WrapId, extras: ExtraId[], message: string, status: ReservationStatus, memo = ""): Reservation => ({
  id, pickupDate, pickupTime, name, phone, items, wrap, extras, message, memo, status, total: basketTotal(items, wrap, extras),
});

// ponytail: mock reservations seeded into localStorage; real ones need a backend
export const MOCK_RESERVATIONS: Reservation[] = [
  r("R-1101", "2026-11-02", "11:00", "박서연", "010-2231-8890", [{ size: "M", qty: 1 }], "bojagi-blush", ["card"], "생일 축하해", "픽업완료"),
  r("R-1102", "2026-11-04", "15:00", "(주)해온상사", "02-555-1200", [{ size: "L", qty: 3 }], "bojagi-indigo", ["ribbon", "card"], "늘 고맙습니다", "픽업완료", "세금계산서 발행 요청"),
  r("R-1103", "2026-11-06", "10:00", "김민준", "010-9012-3344", [{ size: "S", qty: 2 }], "kraft", [], "쾌유를 빕니다", "준비완료"),
  r("R-1104", "2026-11-06", "17:00", "이하은", "010-7788-1020", [{ size: "XL", qty: 1 }], "bojagi-ivory", ["flower", "card"], "개업을 축하드립니다", "예약", "오후 5시 정각 픽업, 차량 대기"),
  r("R-1105", "2026-11-08", "13:00", "정우성", "010-3456-7788", [{ size: "M", qty: 2 }, { size: "S", qty: 1 }], "bojagi-indigo", ["ribbon"], "감사합니다 선생님", "예약"),
  r("R-1106", "2026-11-11", "12:00", "최지아", "010-1111-2222", [{ size: "L", qty: 1 }], "bojagi-blush", ["card", "flower"], "사랑합니다", "예약"),
  r("R-1107", "2026-11-11", "16:00", "한빛병원 간호부", "031-777-0909", [{ size: "L", qty: 2 }], "kraft", ["card"], "건강하세요", "예약"),
  r("R-1108", "2026-11-14", "11:00", "윤도현", "010-6060-7070", [{ size: "M", qty: 1 }], "bojagi-ivory", [], "축하합니다", "예약"),
  r("R-1109", "2026-11-20", "14:00", "(주)블루오션", "02-312-4545", [{ size: "XL", qty: 2 }, { size: "L", qty: 5 }], "bojagi-indigo", ["ribbon", "card"], "새해 복 많이 받으세요", "예약", "로고 스티커 동봉"),
  r("R-1110", "2026-11-25", "10:00", "강예린", "010-4545-1212", [{ size: "S", qty: 1 }], "kraft", ["ribbon"], "늘 고맙습니다", "취소", "고객 요청 취소"),
  r("R-1111", "2026-11-28", "18:00", "오세훈", "010-8080-9090", [{ size: "M", qty: 1 }], "bojagi-blush", ["flower"], "결혼 축하해!", "예약"),
];

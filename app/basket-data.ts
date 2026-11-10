// Gift basket catalog, options and pricing. Pure data + functions (no React) so it can be tested with plain node.

const IMG = (name: string) => `/baskets/${name}.jpg`; // store photos in public/baskets

export type SizeId = string; // basket id (slug for the defaults, generated for admin-added ones)
export type BasketFruit = { productId: number; kg: number }; // optional sample composition, references Product.id
export const BASKET_CATEGORIES = ["백", "핸들박스", "바구니", "특별선물", "컵과일"] as const;
export type BasketAddon = { id: string; name: string; price: number }; // product-specific option, e.g. 컷팅백 생화 추가
export type BasketSize = {
  id: SizeId;
  ko: string; // display name
  en: string;
  category: string; // one of BASKET_CATEGORIES (free text allowed for admin)
  price: number;
  fruitCount: string; // 제철과일 가짓수, e.g. "6-7가지"
  serves: string;
  items: BasketFruit[];
  note: string; // 특이사항 / non-fruit extras
  addons: BasketAddon[];
  desc: string;
  image: string;
  active: boolean; // hidden from customers when false
};

const b = (id: string, ko: string, en: string, category: string, price: number, fruitCount: string, image: string, desc: string, note = "", addons: BasketAddon[] = []): BasketSize => ({
  id, ko, en, category, price, fruitCount, serves: "", items: [], note, addons, desc, image, active: true,
});

// 블루웨일 더 후르츠 2026 가격표
export const INITIAL_BASKETS: BasketSize[] = [
  b("chilling-bag", "칠링백", "Chilling Bag", "백", 20000, "3-4가지", IMG("chilling-bag"), "투명 칠링백에 제철과일과 생화를 담았습니다. 소풍, 운동 후, 작은 답례에."),
  b("halfmoon-bag", "반원핸들백", "Half-moon Bag", "백", 25000, "4-5가지", IMG("halfmoon-bag"), "반원 손잡이 투명백에 담아 들고 가기 좋은 구성."),
  b("handlebox-s", "스몰핸들박스", "Small Handle Box", "핸들박스", 45000, "6-7가지", IMG("handlebox-s"), "리본 손잡이 박스에 정갈하게 담은 실속형 선물."),
  b("handlebox-m", "미디움핸들박스", "Medium Handle Box", "핸들박스", 65000, "8-9가지", IMG("handlebox-m"), "투명 뚜껑 핸들박스. 감사 인사, 집들이에 가장 많이 찾는 구성."),
  b("handlebox-l", "라지핸들박스", "Large Handle Box", "핸들박스", 90000, "11-12가지", IMG("handlebox-l"), "넉넉한 구성의 대형 핸들박스. 가족 모임, 명절 선물에."),
  b("handlebox-xl", "엑스라지핸들박스", "XL Handle Box", "핸들박스", 120000, "16가지", IMG("handlebox-xl"), "16가지 제철과일과 생화를 가득 채운 최대 구성 핸들박스."),
  b("ibaji", "이바지과일선물", "Ibaji Gift", "특별선물", 200000, "16가지 이상", IMG("wrap-double-norigae"), "혼례 이바지 음식으로 준비하는 격식 있는 과일 선물.", "겹보자기 + 노리개 + 부직포가방 포함"),
  b("basket-s", "스몰바구니", "Small Basket", "바구니", 70000, "8-9가지", IMG("basket-s"), "라탄 바구니에 담은 아담한 과일 바구니."),
  b("basket-m", "미디움바구니", "Medium Basket", "바구니", 100000, "11-12가지", IMG("basket-m"), "멜론과 샤인머스캣을 중심으로 색감을 맞춰 담는 시그니처 바구니."),
  b("basket-l", "라지바구니", "Large Basket", "바구니", 130000, "16가지", IMG("basket-l"), "생화로 장식한 대형 바구니. 행사, 기업 선물에."),
  b("basket-xl", "엑스라지바구니", "XL Basket", "바구니", 160000, "16가지 이상", IMG("basket-xl"), "가장 풍성한 최상위 바구니. 개업, VIP 선물에."),
  b("birth", "출산바구니", "Baby Gift Basket", "특별선물", 65000, "6-7가지", IMG("birth"), "산모에게 좋은 제철과일과 화사한 생화로 구성한 출산 축하 선물."),
  b("cutting-bag", "과일컷팅백", "Fruit Cutting Bag", "백", 37000, "5가지", IMG("cutting-bag"), "당도 높은 과일 5가지를 바로 먹기 좋게 손질해 담았습니다.", "당도 높은 과일 5가지 컷팅", [{ id: "flower", name: "생화 추가", price: 3000 }]),
  b("cup-s", "컵과일 S", "Fruit Cup S", "컵과일", 4000, "", IMG("cutting-bag"), "한 컵에 담은 손질 과일. 간식, 단체 행사용으로 좋아요."),
  b("cup-m", "컵과일 M", "Fruit Cup M", "컵과일", 4700, "", IMG("cutting-bag"), "조금 더 넉넉한 한 컵 손질 과일."),
  b("cup-l", "컵과일 L", "Fruit Cup L", "컵과일", 5500, "", IMG("cutting-bag"), "든든하게 즐기는 대용량 컵과일."),
];

// "핸들박스 · 제철과일 8-9가지" (fruit count is optional, e.g. 컵과일)
export const basketMeta = (b: Pick<BasketSize, "category" | "fruitCount">) => [b.category, b.fruitCount && `제철과일 ${b.fruitCount}`].filter(Boolean).join(" · ");

export const basketWeight = (b: Pick<BasketSize, "items">) => b.items.reduce((s, i) => s + i.kg, 0);
// fruit cost at current per-kg prices, used by admin to set the basket price
export const basketCost = (b: Pick<BasketSize, "items">, priceOf: (productId: number) => number) =>
  Math.round(b.items.reduce((s, i) => s + priceOf(i.productId) * i.kg, 0));

// wrapping: pick one per order, applied to every basket
export type WrapId = "basic" | "crystal" | "double";
export const WRAPS: { id: WrapId; name: string; price: number; color: string; image?: string }[] = [
  { id: "basic", name: "기본 포장", price: 0, color: "#c8a97e" },
  { id: "crystal", name: "크리스탈보자기", price: 5000, color: "#f3e6dc", image: IMG("wrap-crystal") },
  { id: "double", name: "겹보자기", price: 10000, color: "#b8d4c0", image: IMG("wrap-double") },
];
export const RIBBON_SAMPLE = IMG("ribbon-crystal-round");

export type ExtraId = "norigae";
export const EXTRAS: { id: ExtraId; name: string; price: number; image?: string }[] = [{ id: "norigae", name: "노리개", price: 10000, image: IMG("wrap-double-norigae") }];

// shown as notes on the order form
export const OPTION_NOTES = ["리본 문구는 무료입니다.", "퀵 배송 비용은 별도입니다."];

export const MESSAGES = ["늘 고맙습니다", "축하합니다", "건강하세요", "사랑합니다", "새해 복 많이 받으세요", "개업을 축하드립니다", "출산을 축하합니다"];
export const PICKUP_TIMES = ["10:00", "11:00", "12:00", "13:00", "14:00", "15:00", "16:00", "17:00", "18:00"];

export type BasketLine = { size: SizeId; qty: number; addons?: string[] }; // addons: BasketAddon ids of that product
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
  const base = items.reduce((s, l) => {
    const b = baskets.find((x) => x.id === l.size);
    const addon = (l.addons ?? []).reduce((a, id) => a + (b?.addons?.find((x) => x.id === id)?.price ?? 0), 0);
    return s + ((b?.price ?? 0) + addon) * l.qty;
  }, 0);
  const perBasket = (WRAPS.find((w) => w.id === wrap)?.price ?? 0) + extras.reduce((s, e) => s + (EXTRAS.find((x) => x.id === e)?.price ?? 0), 0);
  return base + perBasket * count;
}

const r = (id: string, pickupDate: string, pickupTime: string, name: string, phone: string, items: BasketLine[], wrap: WrapId, extras: ExtraId[], message: string, status: ReservationStatus, memo = ""): Reservation => ({
  id, pickupDate, pickupTime, name, phone, items, wrap, extras, message, memo, status, total: basketTotal(items, wrap, extras),
});

// ponytail: mock reservations seeded into localStorage; real ones need a backend
export const MOCK_RESERVATIONS: Reservation[] = [
  r("R-1101", "2026-11-02", "11:00", "박서연", "010-2231-8890", [{ size: "handlebox-m", qty: 1 }], "crystal", [], "생일 축하해", "픽업완료"),
  r("R-1102", "2026-11-04", "15:00", "(주)해온상사", "02-555-1200", [{ size: "handlebox-l", qty: 3 }], "double", [], "늘 고맙습니다", "픽업완료", "세금계산서 발행 요청"),
  r("R-1103", "2026-11-06", "10:00", "김민준", "010-9012-3344", [{ size: "chilling-bag", qty: 2 }], "basic", [], "건강하세요", "준비완료"),
  r("R-1104", "2026-11-10", "17:00", "이하은", "010-7788-1020", [{ size: "ibaji", qty: 1 }], "basic", [], "축하합니다", "예약", "오후 5시 정각 픽업, 차량 대기"),
  r("R-1105", "2026-11-10", "13:00", "정우성", "010-3456-7788", [{ size: "basket-m", qty: 2 }, { size: "cutting-bag", qty: 1 }], "crystal", [], "감사합니다 선생님", "준비완료"),
  r("R-1106", "2026-11-11", "12:00", "최지아", "010-1111-2222", [{ size: "birth", qty: 1 }], "crystal", ["norigae"], "출산을 축하합니다", "예약"),
  r("R-1107", "2026-11-11", "16:00", "한빛병원 간호부", "031-777-0909", [{ size: "handlebox-s", qty: 4 }], "basic", [], "건강하세요", "예약", "퀵 배송 요청"),
  r("R-1108", "2026-11-14", "11:00", "윤도현", "010-6060-7070", [{ size: "basket-s", qty: 1 }], "double", [], "축하합니다", "예약"),
  r("R-1109", "2026-11-20", "14:00", "(주)블루오션", "02-312-4545", [{ size: "basket-xl", qty: 2 }, { size: "handlebox-xl", qty: 5 }], "double", [], "새해 복 많이 받으세요", "예약", "로고 스티커 동봉"),
  r("R-1110", "2026-11-25", "10:00", "강예린", "010-4545-1212", [{ size: "halfmoon-bag", qty: 1 }], "basic", [], "늘 고맙습니다", "취소", "고객 요청 취소"),
  r("R-1111", "2026-11-28", "18:00", "오세훈", "010-8080-9090", [{ size: "basket-l", qty: 1 }], "crystal", ["norigae"], "결혼 축하해!", "예약"),
];

// Delivery orders (cart checkout) and their shipping state. Pure data, no React.

export type OrderStatus = "결제완료" | "발송완료" | "배송완료";
export const ORDER_STEPS: OrderStatus[] = ["결제완료", "발송완료", "배송완료"];
export const CARRIERS = ["CJ대한통운", "한진택배", "롯데택배", "우체국택배", "로젠택배"];

export type OrderLine = { productId: number; emoji: string; name: string; kg: number; pricePerKg: number }; // snapshot at order time
export type Order = {
  id: string;
  userId: string;
  orderedAt: string; // YYYY-MM-DD
  lines: OrderLine[];
  name: string;
  phone: string;
  address: string;
  message: string;
  total: number;
  status: OrderStatus;
  carrier?: string;
  tracking?: string;
  shippedAt?: string;
};

const line = (productId: number, emoji: string, name: string, kg: number, pricePerKg: number): OrderLine => ({ productId, emoji, name, kg, pricePerKg });

// ponytail: mock orders seeded into localStorage; "customer" is the demo login
export const MOCK_ORDERS: Order[] = [
  { id: "BW26110201", userId: "customer", orderedAt: "2026-11-02", lines: [line(1, "🥭", "애플망고", 2, 18900), line(7, "🍋", "키 라임", 1, 8900)], name: "김고래", phone: "010-1234-5678", address: "(06236) 서울 강남구 테헤란로 1 101호", message: "문 앞에 놓아주세요", total: 50200, status: "배송완료", carrier: "CJ대한통운", tracking: "6812-3456-7790", shippedAt: "2026-11-03" },
  { id: "BW26110402", userId: "customer", orderedAt: "2026-11-04", lines: [line(5, "🐉", "레드 용과", 3, 12900)], name: "김고래", phone: "010-1234-5678", address: "(06236) 서울 강남구 테헤란로 1 101호", message: "경비실에 맡겨주세요", total: 42200, status: "발송완료", carrier: "한진택배", tracking: "5123-9988-0012", shippedAt: "2026-11-05" },
  { id: "BW26110503", userId: "customer", orderedAt: "2026-11-05", lines: [line(2, "🍍", "골드 파인애플", 5, 7900), line(3, "🍌", "고산지 바나나", 2, 4900)], name: "김고래", phone: "010-1234-5678", address: "(06236) 서울 강남구 테헤란로 1 101호", message: "배송 전 연락 부탁드려요", total: 52800, status: "결제완료" },
  { id: "BW26110504", userId: "guest-park", orderedAt: "2026-11-05", lines: [line(6, "🍈", "레인보우 파파야", 2, 9800)], name: "박서연", phone: "010-2231-8890", address: "(04524) 서울 중구 세종대로 110", message: "파손 주의 부탁드립니다", total: 23100, status: "결제완료" },
  { id: "BW26110605", userId: "guest-lee", orderedAt: "2026-11-06", lines: [line(1, "🥭", "애플망고", 5, 18900)], name: "이하은", phone: "010-7788-1020", address: "(48058) 부산 해운대구 해운대로 264", message: "문 앞에 놓아주세요", total: 94500, status: "결제완료" },
];

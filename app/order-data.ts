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

export const SHIPPING_FEE = 3500;
export const FREE_SHIPPING_OVER = 50000;
export const shippingFee = (subtotal: number) => (subtotal === 0 || subtotal >= FREE_SHIPPING_OVER ? 0 : SHIPPING_FEE);

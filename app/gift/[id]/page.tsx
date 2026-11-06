import { Suspense } from "react";
import BasketDetail from "./detail";

// same pattern as /product/[id]: ids are runtime data (admin can add baskets), so read params inside Suspense
export default function GiftBasketPage({ params }: PageProps<"/gift/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <BasketDetail id={decodeURIComponent(id)} />;
}

import { Suspense } from "react";
import ProductDetail from "./detail";

// params are runtime data under cacheComponents (admin can add new ids), so read them inside Suspense
export default function ProductPage({ params }: PageProps<"/product/[id]">) {
  return (
    <Suspense fallback={<div className="min-h-[60vh]" />}>
      <Resolved params={params} />
    </Suspense>
  );
}

async function Resolved({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  return <ProductDetail id={Number(id)} />;
}

"use client";

import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";

// Toss redirects here with ?code&message (card declined, window closed, ...). The order stays 결제대기 and unlisted.
export default function PayFail() {
  return (
    <div className="px-4 py-24 text-center">
      <p className="font-serif text-2xl">결제가 완료되지 않았습니다</p>
      <Suspense>
        <Message />
      </Suspense>
      <p className="mt-1 text-sm text-ink-900/60">장바구니는 그대로 있어요. 다시 시도해 주세요.</p>
      <Link href="/cart" className="btn mt-6 inline-block">장바구니로 돌아가기</Link>
    </div>
  );
}

function Message() {
  const message = useSearchParams().get("message");
  return message ? <p className="mt-2 text-sm text-coral-500">{message}</p> : null;
}

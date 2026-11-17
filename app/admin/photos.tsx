"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { useStore } from "../store";

// Ordered photo list for a product/basket. The first photo is the cover (list thumbnail); all of them
// make up the detail-page gallery. Files upload right away; only their paths are kept.
export default function PhotosField({ value, onChange, onError }: { value: string[]; onChange: (v: string[]) => void; onError: (msg: string) => void }) {
  const { uploadImage } = useStore();
  const [busy, setBusy] = useState(false);

  async function add(files: FileList | null) {
    if (!files?.length) return;
    setBusy(true);
    const added: string[] = [];
    try {
      for (const f of Array.from(files)) added.push(await uploadImage(f)); // one by one: keeps the order the admin picked
    } catch (e) {
      onError((e as Error).message);
    }
    onChange([...value, ...added]);
    setBusy(false);
  }
  const move = (n: number, d: number) => {
    const v = [...value];
    [v[n], v[n + d]] = [v[n + d], v[n]];
    onChange(v);
  };

  return (
    <div>
      <div className="flex flex-wrap gap-2">
        {value.map((src, n) => (
          <div key={src + n} className="relative h-24 w-20 overflow-hidden bg-gold-300/30">
            <img src={src} alt="" className="h-full w-full object-cover" />
            {n === 0 && <span className="absolute left-0 top-0 bg-ink-950 px-1.5 py-0.5 text-[10px] text-ivory">대표</span>}
            <div className="absolute inset-x-0 bottom-0 flex justify-between bg-ink-950/60 text-xs text-ivory">
              <button type="button" disabled={n === 0} onClick={() => move(n, -1)} className="px-1.5 py-0.5 disabled:opacity-30" aria-label="앞으로">◀</button>
              <button type="button" onClick={() => onChange(value.filter((_, i) => i !== n))} className="px-1.5 py-0.5" aria-label="사진 삭제">✕</button>
              <button type="button" disabled={n === value.length - 1} onClick={() => move(n, 1)} className="px-1.5 py-0.5 disabled:opacity-30" aria-label="뒤로">▶</button>
            </div>
          </div>
        ))}
        <label className={`grid h-24 w-20 cursor-pointer place-items-center border border-dashed border-ink-900/30 text-center text-[11px] text-ink-600 hover:border-ink-950 ${busy ? "pointer-events-none opacity-50" : ""}`}>
          {busy ? "올리는 중…" : "+ 사진 추가"}
          <input type="file" accept="image/*" multiple className="sr-only" onChange={(e) => { add(e.target.files); e.target.value = ""; }} />
        </label>
      </div>
      <p className="mt-1 text-[11px] font-normal text-ink-900/40">여러 장을 한 번에 고를 수 있어요. 첫 번째 사진이 대표 사진이고, 상세 페이지에서 순서대로 넘겨 볼 수 있습니다.</p>
    </div>
  );
}

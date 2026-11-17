"use client";

/* eslint-disable @next/next/no-img-element */
import { useState } from "react";
import { DEFAULT_SLIDES } from "../hero-slider";
import { useStore, type Slide } from "../store";

const POS = [["50% 15%", "위쪽"], ["50% 50%", "가운데"], ["50% 85%", "아래쪽"]] as const;
const BLANK: Slide = { image: "", eyebrow: "", title: "", text: "", pos: "50% 50%" };

// Main hero slides: edit a draft, then save the whole list at once.
export default function SlidesAdmin() {
  const { slides, setSlides, uploadImage } = useStore();
  const usingDefaults = slides.length === 0;
  const [list, setList] = useState<Slide[]>(usingDefaults ? DEFAULT_SLIDES : slides);
  const [dirty, setDirty] = useState(false);
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState("");

  const update = (v: Slide[]) => {
    setList(v);
    setDirty(true);
    setMsg("");
  };
  const set = (n: number, k: keyof Slide, v: string) => update(list.map((s, i) => (i === n ? { ...s, [k]: v } : s)));
  const move = (n: number, d: number) => {
    const v = [...list];
    [v[n], v[n + d]] = [v[n + d], v[n]];
    update(v);
  };
  function pick(n: number, file?: File) {
    if (file) uploadImage(file).then((p) => set(n, "image", p), (e: Error) => setMsg(e.message));
  }
  async function save() {
    setBusy(true);
    try {
      await setSlides(list);
      setDirty(false);
      setMsg("저장했습니다. 메인 화면에 바로 반영됩니다.");
    } catch (e) {
      setMsg((e as Error).message);
    }
    setBusy(false);
  }

  return (
    <div>
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div>
          <h1 className="font-serif text-3xl">메인 슬라이드</h1>
          <p className="text-sm text-ink-900/50">
            메인 화면 맨 위에서 넘어가는 사진입니다. 순서를 바꾸거나 추가·삭제한 뒤 저장을 눌러주세요.
            {usingDefaults && " (지금은 기본 슬라이드가 보이는 중)"}
          </p>
        </div>
        <div className="flex gap-2">
          <button className="border border-ink-950 px-4 py-2 text-sm hover:bg-ink-950 hover:text-ivory" onClick={() => update([...list, BLANK])} disabled={list.length >= 10}>
            + 슬라이드 추가
          </button>
          <button className="btn" onClick={save} disabled={busy || !dirty}>{busy ? "저장 중…" : "저장"}</button>
        </div>
      </div>
      {msg && <p className="mt-3 text-sm text-gold-600">{msg}</p>}
      {list.length === 0 && <p className="mt-6 text-sm text-ink-900/50">슬라이드를 모두 지우고 저장하면 기본 슬라이드가 보입니다.</p>}

      <ol className="mt-6 space-y-4">
        {list.map((s, n) => (
          <li key={n} className="grid gap-4 border border-ink-900/10 bg-white p-4 md:grid-cols-[240px_1fr]">
            <div>
              <div className="relative aspect-video overflow-hidden bg-ink-950">
                {s.image ? (
                  <img src={s.image} alt="" style={{ objectPosition: s.pos }} className="h-full w-full object-cover" />
                ) : (
                  <div className="grid h-full place-items-center text-xs text-ivory/60">사진을 올려주세요</div>
                )}
                <span className="absolute left-2 top-2 bg-ivory/90 px-2 py-0.5 text-xs">{n + 1}</span>
              </div>
              <label className="mt-2 block cursor-pointer border border-dashed border-ink-900/30 py-2 text-center text-xs hover:border-ink-950">
                {s.image ? "사진 바꾸기" : "+ 사진 올리기"}
                <input type="file" accept="image/*" className="sr-only" onChange={(e) => { pick(n, e.target.files?.[0]); e.target.value = ""; }} />
              </label>
            </div>
            <div className="space-y-2">
              <input className="field" value={s.eyebrow} onChange={(e) => set(n, "eyebrow", e.target.value)} placeholder="작은 영문 문구 (예: Collection No.01 — The Jungle)" aria-label="작은 문구" />
              <textarea className="field font-serif text-lg" rows={2} value={s.title} onChange={(e) => set(n, "title", e.target.value)} placeholder={"큰 제목 (엔터로 줄바꿈)"} aria-label="제목" />
              <input className="field" value={s.text} onChange={(e) => set(n, "text", e.target.value)} placeholder="설명 한 줄" aria-label="설명" />
              <div className="flex flex-wrap items-center gap-2 text-xs">
                <span className="text-ink-900/60">사진 기준</span>
                {POS.map(([v, l]) => (
                  <button key={v} type="button" onClick={() => set(n, "pos", v)} className={`border px-2.5 py-1 ${s.pos === v ? "border-ink-950 bg-ink-950 text-ivory" : "border-ink-900/20"}`}>{l}</button>
                ))}
                <span className="flex-1" />
                <button type="button" disabled={n === 0} onClick={() => move(n, -1)} className="px-2 py-1 disabled:opacity-30">▲ 위로</button>
                <button type="button" disabled={n === list.length - 1} onClick={() => move(n, 1)} className="px-2 py-1 disabled:opacity-30">▼ 아래로</button>
                <button type="button" onClick={() => update(list.filter((_, i) => i !== n))} className="px-2 py-1 text-coral-500">삭제</button>
              </div>
            </div>
          </li>
        ))}
      </ol>
    </div>
  );
}

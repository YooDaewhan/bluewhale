"use client";

// ponytail: UI only for now — wire to a CSV/XLSX export when the backend exists
export default function ExcelButton({ label = "엑셀 다운로드" }: { label?: string }) {
  return (
    <button
      type="button"
      onClick={() => alert("엑셀 다운로드는 준비 중입니다. (목업)")}
      className="inline-flex items-center gap-2 border border-[#1d6f42]/40 bg-white px-4 py-2 text-sm text-[#1d6f42] transition hover:bg-[#1d6f42] hover:text-white"
    >
      <svg width="16" height="16" viewBox="0 0 24 24" aria-hidden fill="none" stroke="currentColor" strokeWidth="1.8">
        <rect x="3" y="3" width="18" height="18" rx="2" />
        <path d="M8 8l8 8M16 8l-8 8" />
      </svg>
      {label}
    </button>
  );
}

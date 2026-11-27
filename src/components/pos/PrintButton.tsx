"use client";

export function PrintButton() {
  return (
    <button
      type="button"
      onClick={() => window.print()}
      className="no-print h-11 rounded-[6px] bg-green px-4 font-semibold text-white"
    >
      Print
    </button>
  );
}

"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="h-14 flex-1 border border-stone-300 rounded-xl text-stone-600 font-medium hover:bg-stone-50 active:bg-stone-100 transition-colors print:hidden"
    >
      🖨️ 印刷する
    </button>
  )
}

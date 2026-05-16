"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="h-14 flex-1 border-2 border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 print:hidden"
    >
      🖨️ 印刷する
    </button>
  )
}

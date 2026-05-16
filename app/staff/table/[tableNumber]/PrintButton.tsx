"use client"

export default function PrintButton() {
  return (
    <button
      onClick={() => window.print()}
      className="w-full py-3 border-2 border-gray-300 rounded-xl text-gray-600 font-medium hover:bg-gray-50 print:hidden"
    >
      🖨️ 印刷する
    </button>
  )
}

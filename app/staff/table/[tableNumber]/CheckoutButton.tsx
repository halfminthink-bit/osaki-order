"use client"

import { useRouter } from "next/navigation"
import { useState } from "react"

export default function CheckoutButton({
  tableNumber,
  grandTotal,
}: {
  tableNumber: number
  grandTotal: number
}) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  async function handleCheckout() {
    if (!confirm("会計を確定します。よろしいですか?")) return

    setLoading(true)
    setError(null)

    try {
      const res = await fetch(`/api/tables/${tableNumber}/checkout`, {
        method: "POST",
      })
      if (!res.ok) {
        throw new Error("会計処理に失敗しました")
      }
      router.refresh()
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="space-y-2 print:hidden">
      {error && (
        <p className="text-sm text-red-600 text-center">{error}</p>
      )}
      <button
        onClick={handleCheckout}
        disabled={loading}
        className="flex-1 h-14 bg-amber-600 hover:bg-amber-700 active:bg-amber-800 text-white text-base font-bold rounded-xl transition-colors disabled:opacity-50"
      >
        {loading ? "処理中..." : `会計する (合計 ¥${grandTotal.toLocaleString()})`}
      </button>
    </div>
  )
}

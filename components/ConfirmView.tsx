"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MENU_ITEMS } from "@/lib/menu"

type Props = {
  store?: string
  table?: string
  party?: string
  items?: string
}

export default function ConfirmView({ store, table, party, items }: Props) {
  const router = useRouter()
  const [submitting, setSubmitting] = useState(false)
  const [errorMsg, setErrorMsg] = useState<string | null>(null)

  const tableNum = table ? parseInt(table, 10) : null
  const partyNum = party ? parseInt(party, 10) : null

  const cartItems = items
    ? items
        .split(",")
        .map((s) => {
          const [id, qtyStr] = s.split(":")
          const menuItem = MENU_ITEMS.find((m) => m.id === id)
          const quantity = parseInt(qtyStr, 10)
          return menuItem && quantity > 0 ? { menuItem, quantity } : null
        })
        .filter((c): c is { menuItem: (typeof MENU_ITEMS)[0]; quantity: number } => c !== null)
    : []

  const totalPrice = cartItems.reduce(
    (sum, c) => sum + c.menuItem.price * c.quantity,
    0
  )

  const perPerson = partyNum && partyNum > 0 ? Math.ceil(totalPrice / partyNum) : null

  const handleOrder = async () => {
    if (!tableNum || !partyNum) return
    setSubmitting(true)
    setErrorMsg(null)
    try {
      const res = await fetch("/api/orders", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          storeId: store,
          tableNumber: tableNum,
          partySize: partyNum,
          items: cartItems.map((c) => ({
            menuItemId: c.menuItem.id,
            quantity: c.quantity,
          })),
        }),
      })
      if (!res.ok) {
        const data = await res.json()
        setErrorMsg(data.error ?? "注文に失敗しました")
        return
      }
      const { orderId } = await res.json()
      router.push(`/order/complete?store=${store}&orderId=${orderId}&table=${table}&party=${party}`)
    } catch {
      setErrorMsg("通信エラーが発生しました。もう一度お試しください。")
    } finally {
      setSubmitting(false)
    }
  }

  const backHref = `/order?store=${store ?? ""}&table=${table ?? ""}&party=${party ?? ""}`

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-stone-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wide">OSAKI 亭</h1>
          {tableNum && (
            <p className="text-xs text-stone-300">
              {tableNum} 番{partyNum ? ` / ${partyNum} 名様` : ""}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-6 space-y-5">
        <h2 className="text-lg font-semibold text-stone-900">注文内容の確認</h2>

        {cartItems.length === 0 ? (
          <p className="text-sm text-stone-500 text-center py-10">
            カートにアイテムがありません。
          </p>
        ) : (
          <Card className="border-stone-200">
            <CardContent className="py-4 px-4 space-y-3">
              {cartItems.map((c) => (
                <div key={c.menuItem.id} className="flex items-center gap-3">
                  <span className="text-xl">{c.menuItem.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-base font-medium text-stone-900">{c.menuItem.name}</p>
                    <p className="text-sm text-stone-500">
                      ¥{c.menuItem.price.toLocaleString()} × {c.quantity}
                    </p>
                  </div>
                  <p className="text-base font-semibold text-stone-900 shrink-0">
                    ¥{(c.menuItem.price * c.quantity).toLocaleString()}
                  </p>
                </div>
              ))}

              <div className="border-t border-stone-200 pt-3 flex justify-between items-center">
                <p className="font-semibold text-stone-900">合計</p>
                <p className="font-bold text-stone-900 text-base">
                  ¥{totalPrice.toLocaleString()}
                </p>
              </div>

              {perPerson && (
                <p className="text-sm text-center text-stone-600 bg-stone-100 rounded px-3 py-2">
                  割り勘で 1人あたり ¥{perPerson.toLocaleString()}
                  （{partyNum}名 / 小数点切り上げ）
                </p>
              )}
            </CardContent>
          </Card>
        )}

        {errorMsg && (
          <p className="text-sm text-red-600 text-center bg-red-50 rounded px-3 py-2">
            {errorMsg}
          </p>
        )}

        <Button
          className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white text-base font-semibold disabled:opacity-40"
          disabled={cartItems.length === 0 || submitting}
          onClick={handleOrder}
        >
          {submitting ? "送信中…" : "注文を確定する"}
        </Button>

        <div className="text-center">
          <Link href={backHref} className="text-sm text-stone-600 underline underline-offset-2">
            メニューに戻る
          </Link>
        </div>
      </main>
    </div>
  )
}

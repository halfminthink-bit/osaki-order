"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MENU_ITEMS, CATEGORY_LABELS, CATEGORIES } from "@/lib/menu"

type CartItem = {
  menuItemId: string
  quantity: number
}

export default function OrderMenu({
  tableNum,
  partyNum,
}: {
  tableNum: number | null
  partyNum: number | null
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const router = useRouter()

  const getQty = (id: string) => cart.find((c) => c.menuItemId === id)?.quantity ?? 0

  const addItem = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === id)
      if (existing) {
        return prev.map((c) =>
          c.menuItemId === id ? { ...c, quantity: c.quantity + 1 } : c
        )
      }
      return [...prev, { menuItemId: id, quantity: 1 }]
    })
  }

  const removeItem = (id: string) => {
    setCart((prev) => {
      const existing = prev.find((c) => c.menuItemId === id)
      if (!existing) return prev
      if (existing.quantity <= 1) return prev.filter((c) => c.menuItemId !== id)
      return prev.map((c) =>
        c.menuItemId === id ? { ...c, quantity: c.quantity - 1 } : c
      )
    })
  }

  const totalPrice = cart.reduce((sum, c) => {
    const item = MENU_ITEMS.find((m) => m.id === c.menuItemId)
    return sum + (item?.price ?? 0) * c.quantity
  }, 0)

  const cartCount = cart.reduce((sum, c) => sum + c.quantity, 0)

  const handleConfirm = () => {
    const itemsParam = cart
      .filter((c) => c.quantity > 0)
      .map((c) => `${c.menuItemId}:${c.quantity}`)
      .join(",")
    const params = new URLSearchParams()
    if (tableNum) params.set("table", String(tableNum))
    if (partyNum) params.set("party", String(partyNum))
    params.set("items", itemsParam)
    router.push(`/order/confirm?${params.toString()}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-amber-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold">OSAKI 亭</h1>
        {tableNum && (
          <p className="text-xs opacity-90 mt-0.5">
            テーブル {tableNum} 番{partyNum ? ` / ${partyNum} 名様` : ""}
          </p>
        )}
      </header>

      <main className="flex-1 px-4 py-4 space-y-6 pb-24">
        {CATEGORIES.map((category) => {
          const items = MENU_ITEMS.filter((item) => item.category === category)
          if (items.length === 0) return null
          return (
            <section key={category}>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-2">
                {items.map((item) => {
                  const qty = getQty(item.id)
                  return (
                    <Card
                      key={item.id}
                      className={`py-0 transition-opacity ${item.isSoldOut ? "opacity-60" : ""}`}
                    >
                      <CardContent className="flex items-center gap-3 py-3 px-4">
                        <span className="text-3xl leading-none">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-sm leading-tight">{item.name}</p>
                            {item.isSoldOut && (
                              <span className="text-xs bg-gray-200 text-gray-500 px-1.5 py-0.5 rounded font-medium shrink-0">
                                品切れ
                              </span>
                            )}
                          </div>
                          <p className="text-amber-600 font-bold text-sm mt-0.5">
                            ¥{item.price.toLocaleString()}
                          </p>
                        </div>

                        {item.isSoldOut ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-9 px-3"
                            disabled
                          >
                            ＋追加
                          </Button>
                        ) : qty === 0 ? (
                          <Button
                            size="sm"
                            variant="outline"
                            className="shrink-0 h-9 px-3 border-amber-600 text-amber-600 hover:bg-amber-50"
                            onClick={() => addItem(item.id)}
                          >
                            ＋追加
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 border-amber-600 text-amber-600 hover:bg-amber-50"
                              onClick={() => removeItem(item.id)}
                            >
                              −
                            </Button>
                            <span className="w-6 text-center font-bold text-sm">{qty}</span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 border-amber-600 text-amber-600 hover:bg-amber-50"
                              onClick={() => addItem(item.id)}
                            >
                              ＋
                            </Button>
                          </div>
                        )}
                      </CardContent>
                    </Card>
                  )
                })}
              </div>
            </section>
          )
        })}
      </main>

      <footer className="sticky bottom-0 z-10 bg-background border-t px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <Button
          className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold disabled:opacity-50"
          disabled={cartCount === 0}
          onClick={handleConfirm}
        >
          注文を確認する（合計 ¥{totalPrice.toLocaleString()}）
        </Button>
      </footer>
    </div>
  )
}

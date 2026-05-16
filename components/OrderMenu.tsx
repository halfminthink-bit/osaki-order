"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MENU_ITEMS, CATEGORIES } from "@/lib/menu"

type CartItem = {
  menuItemId: string
  quantity: number
}

const NAV_LABELS: Record<string, string> = {
  main: "主菜",
  noodles: "麺類",
  side: "一品",
  drink: "ドリンク",
  dessert: "デザート",
}

export default function OrderMenu({
  storeId,
  tableNum,
  partyNum,
}: {
  storeId: string
  tableNum: number | null
  partyNum: number | null
}) {
  const [cart, setCart] = useState<CartItem[]>([])
  const [flashItems, setFlashItems] = useState<Set<string>>(new Set())
  const router = useRouter()

  const getQty = (id: string) => cart.find((c) => c.menuItemId === id)?.quantity ?? 0

  const triggerFlash = (id: string) => {
    setFlashItems((prev) => new Set([...prev, id]))
    setTimeout(() => {
      setFlashItems((prev) => {
        const next = new Set(prev)
        next.delete(id)
        return next
      })
    }, 500)
  }

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
    triggerFlash(id)
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
    params.set("store", storeId)
    if (tableNum) params.set("table", String(tableNum))
    if (partyNum) params.set("party", String(partyNum))
    params.set("items", itemsParam)
    router.push(`/order/confirm?${params.toString()}`)
  }

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 max-w-md mx-auto">
      <div className="sticky top-0 z-10">
        <header className="bg-stone-900 text-white px-4 py-3">
          <div className="flex items-center justify-between">
            <h1 className="text-lg font-bold tracking-wide">OSAKI 亭</h1>
            {tableNum && (
              <p className="text-xs text-stone-300">
                {tableNum} 番{partyNum ? ` / ${partyNum} 名様` : ""}
              </p>
            )}
          </div>
        </header>
        <nav className="bg-white border-b border-stone-200 overflow-x-auto">
          <div className="flex px-2 py-1.5 gap-0.5 min-w-max">
            {CATEGORIES.map((cat) => {
              const hasItems = MENU_ITEMS.some((m) => m.category === cat)
              if (!hasItems) return null
              return (
                <a
                  key={cat}
                  href={`#${cat}`}
                  className="px-3 py-1.5 text-sm font-medium text-stone-700 rounded-full hover:bg-stone-100 whitespace-nowrap transition-colors"
                >
                  {NAV_LABELS[cat]}
                </a>
              )
            })}
          </div>
        </nav>
      </div>

      <main className="flex-1 px-4 py-6 space-y-8 pb-28">
        {CATEGORIES.map((category) => {
          const items = MENU_ITEMS.filter((item) => item.category === category)
          if (items.length === 0) return null
          return (
            <section key={category} id={category} className="scroll-mt-28">
              <h2 className="text-lg font-semibold text-stone-900 mb-3">
                {NAV_LABELS[category]}
              </h2>
              <div className="space-y-3">
                {items.map((item) => {
                  const qty = getQty(item.id)
                  const isFlashing = flashItems.has(item.id)
                  return (
                    <Card
                      key={item.id}
                      className={`py-0 border-stone-200 ${item.isSoldOut ? "opacity-60" : ""}`}
                    >
                      <CardContent className="flex items-center gap-3 py-3 px-4">
                        <span className="text-3xl leading-none">{item.emoji}</span>
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <p className="font-medium text-base leading-tight text-stone-900">
                              {item.name}
                            </p>
                            {item.isSoldOut && (
                              <span className="text-xs bg-stone-200 text-stone-500 px-1.5 py-0.5 rounded font-medium shrink-0">
                                品切れ
                              </span>
                            )}
                          </div>
                          <p className="text-stone-900 font-semibold text-base mt-0.5">
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
                            className="shrink-0 h-9 px-3 border-stone-900 text-stone-900 hover:bg-stone-100"
                            onClick={() => addItem(item.id)}
                          >
                            ＋追加
                          </Button>
                        ) : (
                          <div className="flex items-center gap-1 shrink-0">
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 border-stone-900 text-stone-900 hover:bg-stone-100"
                              onClick={() => removeItem(item.id)}
                            >
                              −
                            </Button>
                            <span
                              className={`w-7 text-center font-bold text-sm rounded transition-colors duration-150 ${
                                isFlashing
                                  ? "bg-amber-100 text-amber-700"
                                  : "text-stone-900"
                              }`}
                            >
                              {qty}
                            </span>
                            <Button
                              size="sm"
                              variant="outline"
                              className="h-9 w-9 p-0 border-stone-900 text-stone-900 hover:bg-stone-100"
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

      <footer className="sticky bottom-0 z-10 bg-white border-t border-stone-200 px-4 py-3 space-y-2">
        {tableNum && (
          <div className="text-center">
            <Link
              href={`/order/status?store=${storeId}&table=${tableNum}${partyNum ? `&party=${partyNum}` : ""}`}
              className="text-xs text-stone-600 underline underline-offset-2"
            >
              注文状況を見る
            </Link>
          </div>
        )}
        <Button
          className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white text-base font-semibold disabled:opacity-40"
          disabled={cartCount === 0}
          onClick={handleConfirm}
        >
          注文を確認する（合計 ¥{totalPrice.toLocaleString()}）
        </Button>
      </footer>
    </div>
  )
}

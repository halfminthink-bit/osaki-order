"use client"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { MENU_ITEMS } from "@/lib/menu"

type Props = {
  table?: string
  party?: string
  items?: string
}

export default function ConfirmView({ table, party, items }: Props) {
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

  const handleOrder = () => {
    console.log("Order confirmed:", {
      tableNum,
      partyNum,
      items: cartItems.map((c) => ({
        menuItemId: c.menuItem.id,
        menuItemName: c.menuItem.name,
        price: c.menuItem.price,
        quantity: c.quantity,
      })),
      totalPrice,
    })
    alert("注文を受け付けました（DB保存は次のブロックで実装）")
  }

  const backHref = `/order?table=${table ?? ""}&party=${party ?? ""}`

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

      <main className="flex-1 px-4 py-6 space-y-5">
        <h2 className="text-base font-bold">注文内容の確認</h2>

        {cartItems.length === 0 ? (
          <p className="text-sm text-muted-foreground text-center py-10">
            カートにアイテムがありません。
          </p>
        ) : (
          <Card>
            <CardContent className="py-4 px-4 space-y-3">
              {cartItems.map((c) => (
                <div key={c.menuItem.id} className="flex items-center gap-3">
                  <span className="text-xl">{c.menuItem.emoji}</span>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{c.menuItem.name}</p>
                    <p className="text-xs text-muted-foreground">
                      ¥{c.menuItem.price.toLocaleString()} × {c.quantity}
                    </p>
                  </div>
                  <p className="text-sm font-bold shrink-0">
                    ¥{(c.menuItem.price * c.quantity).toLocaleString()}
                  </p>
                </div>
              ))}

              <div className="border-t pt-3 flex justify-between items-center">
                <p className="font-bold">合計</p>
                <p className="font-bold text-amber-600 text-base">
                  ¥{totalPrice.toLocaleString()}
                </p>
              </div>

              {perPerson && (
                <p className="text-xs text-center text-muted-foreground bg-amber-50 rounded px-3 py-2">
                  割り勘で 1人あたり ¥{perPerson.toLocaleString()}
                  （{partyNum}名 / 小数点切り上げ）
                </p>
              )}
            </CardContent>
          </Card>
        )}

        <Button
          className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold"
          disabled={cartItems.length === 0}
          onClick={handleOrder}
        >
          注文を確定する
        </Button>

        <div className="text-center">
          <Link href={backHref} className="text-sm text-amber-600 underline">
            メニューに戻る
          </Link>
        </div>
      </main>
    </div>
  )
}

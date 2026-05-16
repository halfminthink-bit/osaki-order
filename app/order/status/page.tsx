export const dynamic = "force-dynamic"

import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Button } from "@/components/ui/button"

type Props = {
  searchParams: Promise<{ table?: string; party?: string }>
}

const STATUS_LABELS: Record<string, string> = {
  received: "受付済",
  preparing: "調理中",
  served: "提供済",
  canceled: "取消済",
}

const STATUS_COLORS: Record<string, string> = {
  received: "bg-gray-100 text-gray-600",
  preparing: "bg-amber-100 text-amber-800",
  served: "bg-green-100 text-green-800",
  canceled: "bg-gray-100 text-gray-400",
}

export default async function StatusPage({ searchParams }: Props) {
  const { table, party } = await searchParams
  const tableNumber = Number(table)

  if (!table || isNaN(tableNumber)) {
    return (
      <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-amber-600 text-white px-4 py-3 shadow-md">
          <h1 className="text-lg font-bold">OSAKI 亭</h1>
        </header>
        <main className="flex-1 px-4 py-10 text-center text-muted-foreground">
          <p className="text-sm">テーブル番号が指定されていません。</p>
          <Link href="/" className="text-amber-600 underline text-sm mt-4 block">
            トップへ戻る
          </Link>
        </main>
      </div>
    )
  }

  const orders = await prisma.order.findMany({
    where: { tableNumber, isPaid: false },
    include: { items: true },
    orderBy: { createdAt: "asc" },
  })

  const activeOrders = orders.filter((o) => o.status !== "canceled")
  const grandTotal = activeOrders.reduce((sum, o) => sum + o.totalPrice, 0)
  const partySize = party ? Number(party) : null
  const menuHref = party
    ? `/order?table=${table}&party=${party}`
    : `/order?table=${table}`

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-amber-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold">OSAKI 亭</h1>
        <p className="text-xs opacity-90 mt-0.5">
          テーブル {tableNumber} 番{partySize ? ` / ${partySize} 名様` : ""} — ご注文状況
        </p>
      </header>

      <main className="flex-1 px-4 py-4 pb-28 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-muted-foreground">
            <p className="text-4xl mb-3">🍽️</p>
            <p className="text-sm mb-6">まだご注文がありません</p>
            <Link href={menuHref}>
              <Button className="h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold">
                メニューを見る
              </Button>
            </Link>
          </div>
        ) : (
          <>
            {orders.map((order, idx) => {
              const isCanceled = order.status === "canceled"
              const timeStr = new Date(order.createdAt).toLocaleTimeString("ja-JP", {
                hour: "2-digit",
                minute: "2-digit",
              })

              return (
                <div
                  key={order.id}
                  className={`bg-white rounded-xl shadow border overflow-hidden ${
                    isCanceled ? "opacity-50 border-gray-200" : "border-gray-100"
                  }`}
                >
                  <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
                    <div className="flex items-center gap-2">
                      <span className="font-bold text-sm text-gray-800">注文 #{idx + 1}</span>
                      <span className="text-xs text-gray-400">{timeStr}</span>
                    </div>
                    <span
                      className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[order.status]}`}
                    >
                      {STATUS_LABELS[order.status]}
                    </span>
                  </div>

                  <div className="px-4 py-3 space-y-1">
                    {order.items.map((item) => (
                      <div key={item.id} className="flex justify-between text-sm">
                        <span className={isCanceled ? "text-gray-400 line-through" : "text-gray-700"}>
                          {item.menuItemName} × {item.quantity}
                        </span>
                        <span className={isCanceled ? "text-gray-400" : "text-gray-500"}>
                          ¥{(item.price * item.quantity).toLocaleString()}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="px-4 py-2 border-t border-gray-100 flex justify-between text-sm">
                    <span className="text-gray-500">小計</span>
                    <span
                      className={`font-semibold ${
                        isCanceled ? "text-gray-400 line-through" : "text-gray-800"
                      }`}
                    >
                      ¥{order.totalPrice.toLocaleString()}
                    </span>
                  </div>
                </div>
              )
            })}

            <div className="bg-amber-50 border border-amber-200 rounded-xl px-4 py-4 space-y-1.5">
              <div className="flex justify-between font-bold text-base">
                <span>合計（税込）</span>
                <span className="text-amber-700">¥{grandTotal.toLocaleString()}</span>
              </div>
              {partySize && partySize > 1 && (
                <div className="flex justify-between text-sm text-gray-500">
                  <span>割り勘（{partySize}名）</span>
                  <span>¥{Math.ceil(grandTotal / partySize).toLocaleString()} / 人</span>
                </div>
              )}
            </div>
          </>
        )}
      </main>

      {orders.length > 0 && (
        <footer className="sticky bottom-0 z-10 bg-background border-t px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
          <Link href={menuHref}>
            <Button className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold">
              メニューに戻る / 追加注文する
            </Button>
          </Link>
        </footer>
      )}
    </div>
  )
}

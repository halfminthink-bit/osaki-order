import { prisma } from "@/lib/prisma"
import Link from "next/link"
import PrintButton from "./PrintButton"
import CheckoutButton from "./CheckoutButton"

export const dynamic = "force-dynamic"

export default async function TableBillingPage({
  params,
  searchParams,
}: {
  params: Promise<{ tableNumber: string }>
  searchParams: Promise<{ store?: string }>
}) {
  const { tableNumber } = await params
  const { store } = await searchParams
  const tableNum = Number(tableNumber)

  const orders = await prisma.order.findMany({
    where: {
      ...(store ? { storeId: store } : {}),
      tableNumber: tableNum,
      isPaid: false,
      status: { not: "canceled" },
    },
    orderBy: { createdAt: "asc" },
    include: { items: true },
  })

  const grandTotal = orders.reduce((sum, o) => sum + o.totalPrice, 0)
  const latestPartySize = orders.length > 0 ? orders[orders.length - 1].partySize : 1
  const perPerson = Math.ceil(grandTotal / latestPartySize)

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10 print:hidden">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center gap-3">
          <Link
            href="/staff"
            className="text-sm text-stone-600 hover:text-stone-900 transition-colors"
          >
            ← 一覧に戻る
          </Link>
          <span className="text-stone-300">|</span>
          <h1 className="text-xl font-bold text-stone-900">
            テーブル {tableNum} — 会計
          </h1>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-3">🧾</p>
            <p className="text-sm">このテーブルの注文はありません</p>
          </div>
        ) : (
          <>
            {orders.map((order, i) => (
              <div
                key={order.id}
                className="bg-white rounded-xl border border-stone-200 overflow-hidden"
              >
                <div className="px-4 py-3 bg-stone-50 border-b border-stone-100">
                  <span className="text-sm font-semibold text-stone-700">注文 {i + 1}</span>
                  <span className="ml-3 text-xs text-stone-400">
                    {new Date(order.createdAt).toLocaleTimeString("ja-JP", {
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                  </span>
                </div>
                <div className="px-4 py-3 space-y-1">
                  {order.items.map((item) => (
                    <div key={item.id} className="flex justify-between text-sm">
                      <span className="text-stone-700">
                        {item.menuItemName} × {item.quantity}
                      </span>
                      <span className="text-stone-500">
                        ¥{(item.price * item.quantity).toLocaleString()}
                      </span>
                    </div>
                  ))}
                </div>
                <div className="px-4 py-2 border-t border-stone-100 text-right text-sm text-stone-500">
                  小計 ¥{order.totalPrice.toLocaleString()}
                </div>
              </div>
            ))}

            <div className="bg-stone-100 border border-stone-200 rounded-xl px-5 py-5">
              <div className="flex justify-between items-center mb-2">
                <span className="text-base font-semibold text-stone-700">合計金額</span>
                <span className="text-2xl font-bold text-stone-900">
                  ¥{grandTotal.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center text-sm text-stone-500">
                <span>割り勘 ({latestPartySize}名)</span>
                <span className="font-medium text-stone-700">
                  1人あたり ¥{perPerson.toLocaleString()}
                </span>
              </div>
            </div>

            <div className="flex gap-3 print:hidden">
              <PrintButton />
              <CheckoutButton tableNumber={tableNum} grandTotal={grandTotal} storeId={store} />
            </div>
          </>
        )}
      </main>
    </div>
  )
}

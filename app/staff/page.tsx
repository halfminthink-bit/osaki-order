import Link from "next/link"
import { prisma } from "@/lib/prisma"
import OrderCard from "./OrderCard"

export const dynamic = "force-dynamic"

export default async function StaffPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>
}) {
  const { store } = await searchParams

  if (!store) {
    return (
      <div className="min-h-screen bg-stone-50 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-lg font-semibold text-stone-900 mb-2">店舗が指定されていません</p>
          <p className="text-sm text-stone-500 mb-6 leading-relaxed">
            会計端末を起動するには、店舗を指定してください。
          </p>
          <Link
            href="/dashboard"
            className="inline-block text-sm bg-stone-900 hover:bg-stone-700 text-white px-5 py-2.5 rounded-lg transition-colors"
          >
            全店ダッシュボードへ →
          </Link>
        </div>
      </div>
    )
  }

  const [orders, stores] = await Promise.all([
    prisma.order.findMany({
      where: {
        storeId: store,
        isPaid: false,
        status: { not: "canceled" },
      },
      orderBy: { createdAt: "asc" },
      include: { items: true },
    }),
    prisma.store.findMany(),
  ])

  const storeNameMap: Record<string, string> = Object.fromEntries(
    stores.map((s) => [s.id, s.name])
  )

  type OrderWithItems = (typeof orders)[0]
  type Group = {
    key: string
    storeId: string
    storeName: string
    tableNumber: number
    partySize: number
    orders: OrderWithItems[]
    totalPrice: number
    oldestCreatedAt: Date
  }

  const groupMap = new Map<string, Group>()
  for (const order of orders) {
    const key = `${order.storeId}__${order.tableNumber}`
    if (!groupMap.has(key)) {
      groupMap.set(key, {
        key,
        storeId: order.storeId,
        storeName: storeNameMap[order.storeId] ?? order.storeId,
        tableNumber: order.tableNumber,
        partySize: order.partySize,
        orders: [],
        totalPrice: 0,
        oldestCreatedAt: order.createdAt,
      })
    }
    const group = groupMap.get(key)!
    group.orders.push(order)
    group.totalPrice += order.totalPrice
    group.partySize = order.partySize
  }

  const groups = Array.from(groupMap.values()).sort(
    (a, b) => a.oldestCreatedAt.getTime() - b.oldestCreatedAt.getTime()
  )

  const storeLabel = storeNameMap[store] ?? store

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">会計端末 — {storeLabel}</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              対応中 {groups.length} テーブル
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/kitchen?store=${store}`}
              className="text-sm text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg transition-colors"
            >
              キッチン端末へ →
            </Link>
            <Link
              href={`/dashboard/${store}`}
              className="text-sm text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg transition-colors"
            >
              ダッシュボード
            </Link>
          </div>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-6">
        {groups.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">現在進行中の注文はありません</p>
          </div>
        ) : (
          groups.map((group) => (
            <div
              key={group.key}
              className="bg-white rounded-xl border border-stone-200 overflow-hidden shadow-sm"
            >
              <div className="px-4 py-3 bg-amber-50 border-b border-amber-100 flex items-center justify-between">
                <div>
                  <span className="font-semibold text-amber-800">
                    テーブル {group.tableNumber}
                  </span>
                  <span className="ml-2 text-sm text-stone-500">{group.partySize}名</span>
                </div>
                <div className="text-right">
                  <span className="text-xs text-stone-500">合計 </span>
                  <span className="font-bold text-stone-900">
                    ¥{group.totalPrice.toLocaleString()}
                  </span>
                </div>
              </div>

              <div className="divide-y divide-stone-100">
                {group.orders.map((order) => (
                  <OrderCard key={order.id} order={order} storeId={store} />
                ))}
              </div>

              <div className="px-4 py-3 border-t border-amber-100 bg-amber-50">
                <Link
                  href={`/staff/table/${group.tableNumber}?store=${group.storeId}`}
                  className="block w-full text-center py-3 rounded-lg bg-amber-700 text-white font-semibold text-sm hover:bg-amber-600 active:bg-amber-800 transition-colors"
                >
                  会計する →
                </Link>
              </div>
            </div>
          ))
        )}
      </main>

      <div className="max-w-2xl mx-auto px-4 pb-10">
        <p className="text-xs text-stone-400 mb-2 text-center">テーブル番号で直接検索</p>
        <form action="/staff/table" className="flex gap-2 justify-center">
          <input type="hidden" name="store" value={store} />
          <input
            name="table"
            type="number"
            min="1"
            placeholder="テーブル番号"
            className="w-36 text-sm border border-stone-300 rounded-lg px-3 py-2 bg-white focus:outline-none focus:ring-2 focus:ring-stone-400"
          />
          <button
            type="submit"
            className="text-sm bg-stone-900 text-white px-4 py-2 rounded-lg font-medium hover:bg-stone-700 active:bg-stone-800 transition-colors"
          >
            会計ページへ
          </button>
        </form>
      </div>
    </div>
  )
}

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
  const orders = await prisma.order.findMany({
    where: store ? { storeId: store } : undefined,
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })

  const storeLabel = store ? `(store: ${store})` : "全店舗"

  return (
    <div className="min-h-screen bg-stone-50">
      <header className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">会計端末 — OSAKI 亭</h1>
            <p className="text-xs text-stone-500 mt-0.5">{storeLabel} / 全 {orders.length} 件</p>
          </div>
          <Link
            href="/kitchen"
            className="text-sm text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg transition-colors"
          >
            キッチン画面へ →
          </Link>
        </div>
        <div className="max-w-2xl mx-auto px-4 pb-4">
          <form action="/staff/table" className="flex gap-2">
            {store && <input type="hidden" name="store" value={store} />}
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
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-stone-400">
            <p className="text-4xl mb-3">📋</p>
            <p className="text-sm">注文がまだありません</p>
          </div>
        ) : (
          orders.map((order) => <OrderCard key={order.id} order={order} />)
        )}
      </main>
    </div>
  )
}

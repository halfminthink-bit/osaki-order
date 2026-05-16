import Link from "next/link"
import { prisma } from "@/lib/prisma"
import KitchenCard from "./KitchenCard"

export const dynamic = "force-dynamic"

export default async function KitchenPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string }>
}) {
  const { store } = await searchParams

  if (!store) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center px-6">
        <div className="text-center max-w-sm">
          <p className="text-5xl mb-4">⚠️</p>
          <p className="text-lg font-semibold text-white mb-2">店舗が指定されていません</p>
          <p className="text-sm text-gray-400 mb-6 leading-relaxed">
            キッチン端末を起動するには、店舗を指定してください。
          </p>
          <Link
            href="/dashboard"
            className="inline-block text-sm bg-stone-700 hover:bg-stone-600 text-white px-5 py-2.5 rounded-lg transition-colors"
          >
            全店ダッシュボードへ →
          </Link>
        </div>
      </div>
    )
  }

  const [orders, storeRecord] = await Promise.all([
    prisma.order.findMany({
      where: { storeId: store, status: "received" },
      orderBy: { createdAt: "asc" },
      include: { items: true },
    }),
    prisma.store.findUnique({ where: { id: store }, select: { name: true } }),
  ])

  const storeLabel = storeRecord?.name ?? store

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">キッチン端末 — {storeLabel}</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              未完了 {orders.length} 件 / 受付順
            </p>
          </div>
          <div className="flex gap-2">
            <Link
              href={`/staff?store=${store}`}
              className="text-sm text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 px-3 py-2 rounded-lg transition-colors"
            >
              会計端末へ →
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

      <main className="max-w-4xl mx-auto px-6 py-6">
        {orders.length === 0 ? (
          <div className="text-center py-24 text-gray-500">
            <p className="text-5xl mb-4">🍳</p>
            <p className="text-lg font-medium">現在の注文はありません</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {orders.map((order) => (
              <KitchenCard key={order.id} order={order} />
            ))}
          </div>
        )}
      </main>
    </div>
  )
}

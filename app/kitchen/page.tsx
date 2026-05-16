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
  const orders = await prisma.order.findMany({
    where: {
      ...(store ? { storeId: store } : {}),
      status: "received",
    },
    orderBy: { createdAt: "asc" },
    include: { items: true },
  })

  const storeLabel = store ? `(store: ${store})` : "全店舗"

  return (
    <div className="min-h-screen bg-gray-900">
      <header className="bg-stone-100 border-b border-stone-200 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-stone-900">キッチン端末 — OSAKI 亭</h1>
            <p className="text-xs text-stone-500 mt-0.5">
              {storeLabel} / 未完了 {orders.length} 件 / 受付順
            </p>
          </div>
          <Link
            href="/staff"
            className="text-sm text-stone-600 hover:text-stone-900 bg-white hover:bg-stone-50 border border-stone-200 px-4 py-2 rounded-lg transition-colors"
          >
            会計画面へ →
          </Link>
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

import { prisma } from "@/lib/prisma"
import OrderCard from "./OrderCard"

export const dynamic = "force-dynamic"

export default async function StaffPage() {
  const orders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    include: { items: true },
  })

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white border-b border-gray-200 sticky top-0 z-10">
        <div className="max-w-2xl mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-xl font-bold text-gray-800">注文管理</h1>
            <p className="text-xs text-gray-400">全 {orders.length} 件</p>
          </div>
          <form action="/staff/table" className="flex gap-2">
            <input
              name="table"
              type="number"
              min="1"
              placeholder="テーブル番号"
              className="w-32 text-sm border border-gray-300 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-amber-400"
            />
            <button
              type="submit"
              className="text-sm bg-amber-600 text-white px-3 py-2 rounded-lg font-medium hover:bg-amber-700 active:bg-amber-800"
            >
              会計
            </button>
          </form>
        </div>
      </header>

      <main className="max-w-2xl mx-auto px-4 py-6 space-y-4">
        {orders.length === 0 ? (
          <div className="text-center py-16 text-gray-400">
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

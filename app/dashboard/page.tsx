import Link from "next/link"
import { prisma } from "@/lib/prisma"
import { Prisma } from "@/lib/generated/prisma/client"

export const dynamic = "force-dynamic"

type RankingRow = {
  menuItemId: string
  menuItemName: string
  totalQuantity: bigint
  totalRevenue: bigint
}

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  received: { label: "受付済", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "調理中", color: "bg-amber-100 text-amber-700" },
  served: { label: "提供済", color: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "キャンセル", color: "bg-red-100 text-red-700" },
}

export default async function DashboardPage() {
  // ── 集計クエリ ───────────────────────────────────────────
  const summary = await prisma.order.aggregate({
    where: { status: { not: "canceled" } },
    _sum: { totalPrice: true, partySize: true },
    _count: true,
  })

  const totalRevenue = summary._sum.totalPrice ?? 0
  const totalOrders = summary._count
  const totalGuests = summary._sum.partySize ?? 0
  const perGuestAvg = totalGuests > 0 ? Math.round(totalRevenue / totalGuests) : 0

  // ── 売れ筋 TOP10 (raw SQL) ───────────────────────────────
  const ranking = await prisma.$queryRaw<RankingRow[]>(Prisma.sql`
    SELECT
      oi."menuItemId",
      oi."menuItemName",
      SUM(oi.quantity)::bigint          AS "totalQuantity",
      SUM(oi.price * oi.quantity)::bigint AS "totalRevenue"
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o.status != 'canceled'::"OrderStatus"
    GROUP BY oi."menuItemId", oi."menuItemName"
    ORDER BY "totalRevenue" DESC
    LIMIT 10
  `)

  // ── 時間帯別注文数 (JS 集計) ─────────────────────────────
  const allOrders = await prisma.order.findMany({
    where: { status: { not: "canceled" } },
    select: { createdAt: true },
  })

  const hourlyCounts: Record<number, number> = {}
  for (let h = 10; h <= 23; h++) hourlyCounts[h] = 0
  for (const o of allOrders) {
    const h = new Date(o.createdAt).getHours()
    if (h >= 10 && h <= 23) hourlyCounts[h] = (hourlyCounts[h] ?? 0) + 1
  }
  const maxHourlyCount = Math.max(...Object.values(hourlyCounts), 1)
  const peakHour = Object.entries(hourlyCounts).reduce(
    (a, [h, c]) => (c > a[1] ? [Number(h), c] : a),
    [0, 0]
  )[0]

  // ── 直近10件 ─────────────────────────────────────────────
  const recentOrders = await prisma.order.findMany({
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { items: true },
  })

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ヘッダー */}
      <header className="bg-stone-900 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">経営ダッシュボード — OSAKI 亭</h1>
            <p className="text-xs text-stone-400 mt-0.5">キャンセルを除く全注文の集計</p>
          </div>
          <nav className="flex gap-3">
            <Link
              href="/kitchen"
              className="text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-2 rounded-lg transition-colors"
            >
              キッチン端末
            </Link>
            <Link
              href="/staff"
              className="text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-2 rounded-lg transition-colors"
            >
              会計端末
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* ── サマリーカード 4枚 ── */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">サマリー</h2>
          <div className="grid grid-cols-4 gap-4">
            <SummaryCard
              label="総売上"
              value={`¥${totalRevenue.toLocaleString()}`}
              note="全注文の合計"
            />
            <SummaryCard
              label="注文件数"
              value={`${totalOrders} 件`}
              note="受付〜提供済"
            />
            <SummaryCard
              label="客単価"
              value={`¥${perGuestAvg.toLocaleString()}`}
              note="1人あたり平均"
            />
            <SummaryCard
              label="延べ客数"
              value={`${totalGuests} 名`}
              note="入店人数の合計"
            />
          </div>
        </section>

        {/* ── 売れ筋 TOP10 + 時間帯グラフ (横並び) ── */}
        <div className="grid grid-cols-2 gap-6">

          {/* 売れ筋 TOP10 */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">売れ筋メニュー TOP10</h2>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-left text-xs text-stone-400 border-b border-stone-100">
                  <th className="pb-2 font-medium w-8">#</th>
                  <th className="pb-2 font-medium">メニュー</th>
                  <th className="pb-2 font-medium text-right">注文数</th>
                  <th className="pb-2 font-medium text-right">売上</th>
                </tr>
              </thead>
              <tbody>
                {ranking.map((row, i) => (
                  <tr
                    key={row.menuItemId}
                    className={`border-b border-stone-50 ${i === 0 ? "bg-amber-50" : ""}`}
                  >
                    <td className={`py-2.5 text-xs font-bold ${i === 0 ? "text-amber-700" : "text-stone-400"}`}>
                      {i + 1}
                    </td>
                    <td className={`py-2.5 font-medium ${i === 0 ? "text-amber-900" : "text-stone-800"}`}>
                      {row.menuItemName}
                    </td>
                    <td className="py-2.5 text-right text-stone-600">{Number(row.totalQuantity)} 個</td>
                    <td className="py-2.5 text-right text-stone-800 font-medium">
                      ¥{Number(row.totalRevenue).toLocaleString()}
                    </td>
                  </tr>
                ))}
                {ranking.length === 0 && (
                  <tr>
                    <td colSpan={4} className="py-8 text-center text-stone-400 text-sm">データなし</td>
                  </tr>
                )}
              </tbody>
            </table>
          </section>

          {/* 時間帯別棒グラフ */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">時間帯別 注文件数</h2>
            <div className="space-y-1.5">
              {Object.entries(hourlyCounts).map(([h, count]) => {
                const hour = Number(h)
                const isPeak = hour === peakHour
                const barWidth = maxHourlyCount > 0 ? (count / maxHourlyCount) * 100 : 0
                return (
                  <div key={h} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-right text-stone-500 shrink-0">{h}時</span>
                    <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isPeak ? "bg-amber-600" : "bg-stone-800"}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className={`w-8 text-right font-medium shrink-0 ${isPeak ? "text-amber-700" : "text-stone-600"}`}>
                      {count}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── 直近10件 ── */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">直近の注文（最新10件）</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-400 border-b border-stone-100">
                <th className="pb-2 font-medium">時刻</th>
                <th className="pb-2 font-medium">テーブル</th>
                <th className="pb-2 font-medium">人数</th>
                <th className="pb-2 font-medium">注文品目</th>
                <th className="pb-2 font-medium text-right">金額</th>
                <th className="pb-2 font-medium text-center">ステータス</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const time = new Date(order.createdAt).toLocaleTimeString("ja-JP", {
                  hour: "2-digit",
                  minute: "2-digit",
                })
                const firstItems = order.items.slice(0, 2).map((i) => i.menuItemName).join("・")
                const rest = order.items.length > 2 ? ` 他${order.items.length - 2}品` : ""
                const st = STATUS_LABEL[order.status] ?? { label: order.status, color: "bg-stone-100 text-stone-600" }
                return (
                  <tr key={order.id} className="border-b border-stone-50">
                    <td className="py-2.5 text-stone-600 font-mono">{time}</td>
                    <td className="py-2.5 text-stone-800 font-medium">#{order.tableNumber}</td>
                    <td className="py-2.5 text-stone-600">{order.partySize}名</td>
                    <td className="py-2.5 text-stone-700">
                      {firstItems}{rest}
                    </td>
                    <td className="py-2.5 text-right font-medium text-stone-800">
                      ¥{order.totalPrice.toLocaleString()}
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>
                        {st.label}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={6} className="py-8 text-center text-stone-400">注文がまだありません</td>
                </tr>
              )}
            </tbody>
          </table>
        </section>

      </main>
    </div>
  )
}

function SummaryCard({ label, value, note }: { label: string; value: string; note: string }) {
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-6">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-3xl font-bold text-stone-900 leading-none mb-1">{value}</p>
      <p className="text-xs text-stone-400">{note}</p>
    </div>
  )
}

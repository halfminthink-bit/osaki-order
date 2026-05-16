import Link from "next/link"
import { notFound } from "next/navigation"
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

type CompareRow = {
  label: string
  storeValue: number
  avgValue: number
  format: (v: number) => string
}

function CompareCard({ label, storeValue, avgValue, format }: CompareRow) {
  const ratio = avgValue > 0 ? storeValue / avgValue : 1
  const pct = ((ratio - 1) * 100).toFixed(1)
  const above = ratio >= 1
  return (
    <div className="bg-white rounded-2xl border border-stone-200 p-5">
      <p className="text-xs font-semibold text-stone-400 uppercase tracking-wide mb-2">{label}</p>
      <p className="text-2xl font-bold text-stone-900 leading-none mb-1">{format(storeValue)}</p>
      <p className="text-xs text-stone-400 mb-2">全店平均 {format(avgValue)}</p>
      <span
        className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
          above ? "bg-emerald-100 text-emerald-700" : "bg-red-100 text-red-700"
        }`}
      >
        {above ? "+" : ""}{pct}%
      </span>
    </div>
  )
}

export default async function StoreDashboardPage({
  params,
}: {
  params: Promise<{ storeId: string }>
}) {
  const { storeId } = await params

  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) notFound()

  const PAID_COND = Prisma.sql`o."isPaid" = true AND o.status != 'canceled'::"OrderStatus"`

  // ── この店舗のサマリー（会計済のみ）─────────────────────
  const storeSummary = await prisma.order.aggregate({
    where: { storeId, isPaid: true, status: { not: "canceled" } },
    _sum: { totalPrice: true, partySize: true },
    _count: true,
  })
  const storeRevenue = storeSummary._sum.totalPrice ?? 0
  const storeOrders = storeSummary._count
  const storeGuests = storeSummary._sum.partySize ?? 0
  const storePerGuest = storeGuests > 0 ? Math.round(storeRevenue / storeGuests) : 0

  // ── 全店平均（会計済のみ）───────────────────────────────
  const allSummary = await prisma.order.aggregate({
    where: { isPaid: true, status: { not: "canceled" } },
    _sum: { totalPrice: true, partySize: true },
    _count: true,
  })
  const storeCount = await prisma.store.count()
  const allRevenue = allSummary._sum.totalPrice ?? 0
  const allOrders = allSummary._count
  const allGuests = allSummary._sum.partySize ?? 0
  const avgRevenue = storeCount > 0 ? Math.round(allRevenue / storeCount) : 0
  const avgOrders = storeCount > 0 ? Math.round(allOrders / storeCount) : 0
  const avgGuests = storeCount > 0 ? Math.round(allGuests / storeCount) : 0
  const avgPerGuest = allGuests > 0 ? Math.round(allRevenue / allGuests) : 0

  // ── 売れ筋 TOP10（会計済のみ）───────────────────────────
  const ranking = await prisma.$queryRaw<RankingRow[]>(Prisma.sql`
    SELECT
      oi."menuItemId",
      oi."menuItemName",
      SUM(oi.quantity)::bigint            AS "totalQuantity",
      SUM(oi.price * oi.quantity)::bigint AS "totalRevenue"
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE o."storeId" = ${storeId}
      AND ${PAID_COND}
    GROUP BY oi."menuItemId", oi."menuItemName"
    ORDER BY "totalRevenue" DESC
    LIMIT 10
  `)

  // ── 時間帯別売上（会計済のみ）───────────────────────────
  const paidOrders = await prisma.order.findMany({
    where: { storeId, isPaid: true, status: { not: "canceled" } },
    select: { createdAt: true, totalPrice: true },
  })
  const hourlyRevenue: Record<number, number> = {}
  const hourlyOrderCount: Record<number, number> = {}
  for (let h = 10; h <= 23; h++) { hourlyRevenue[h] = 0; hourlyOrderCount[h] = 0 }
  for (const o of paidOrders) {
    const h = (new Date(o.createdAt).getUTCHours() + 9) % 24
    if (h >= 10 && h <= 23) {
      hourlyRevenue[h] = (hourlyRevenue[h] ?? 0) + o.totalPrice
      hourlyOrderCount[h] = (hourlyOrderCount[h] ?? 0) + 1
    }
  }
  const maxHourlyRevenue = Math.max(...Object.values(hourlyRevenue), 1)
  const peakHour = Object.entries(hourlyRevenue).reduce(
    (a, [h, r]) => (r > a[1] ? [Number(h), r] : a),
    [0, 0]
  )[0]

  // ── 直近10件（isPaid 問わず、canceled 除く）──────────────
  const recentOrders = await prisma.order.findMany({
    where: { storeId, status: { not: "canceled" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { items: true },
  })

  const fmtYen = (v: number) => `¥${v.toLocaleString()}`
  const fmtCount = (v: number) => `${v} 件`
  const fmtGuests = (v: number) => `${v} 名`

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ヘッダー */}
      <header className="bg-stone-900 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold">{store.name}</h1>
                <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${store.isDirect ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                  {store.isDirect ? "直営" : "FC"}
                </span>
              </div>
              {store.location && (
                <p className="text-xs text-stone-400 mt-0.5">{store.location}</p>
              )}
            </div>
          </div>
          <nav className="flex gap-3">
            <Link
              href="/dashboard"
              className="text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-2 rounded-lg transition-colors"
            >
              ← 全店ダッシュボード
            </Link>
            <Link
              href={`/kitchen?store=${storeId}`}
              className="text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-2 rounded-lg transition-colors"
            >
              キッチン端末
            </Link>
            <Link
              href={`/staff?store=${storeId}`}
              className="text-sm text-stone-300 hover:text-white bg-stone-800 hover:bg-stone-700 px-3 py-2 rounded-lg transition-colors"
            >
              会計端末
            </Link>
          </nav>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* 補足テキスト */}
        <p className="text-xs text-stone-500 bg-stone-100 border border-stone-200 rounded-lg px-4 py-2.5">
          ※ 売上集計は会計済（isPaid）の注文のみを対象とします。リアルタイム状況は「直近の注文」をご確認ください。
        </p>

        {/* ── サマリーカード 4枚 ── */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">サマリー（この店舗）</h2>
          <div className="grid grid-cols-4 gap-4">
            <SummaryCard label="確定売上" value={fmtYen(storeRevenue)} note="会計済の合計" />
            <SummaryCard label="会計件数" value={fmtCount(storeOrders)} note="注文件数（会計済）" />
            <SummaryCard label="客単価" value={fmtYen(storePerGuest)} note="1人あたり平均" />
            <SummaryCard label="延べ客数" value={fmtGuests(storeGuests)} note="入店人数の合計" />
          </div>
        </section>

        {/* ── 全店平均との比較 ── */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">全店平均との比較（会計済ベース）</h2>
          <div className="grid grid-cols-4 gap-4">
            <CompareCard label="確定売上" storeValue={storeRevenue} avgValue={avgRevenue} format={fmtYen} />
            <CompareCard label="会計件数" storeValue={storeOrders} avgValue={avgOrders} format={fmtCount} />
            <CompareCard label="客単価" storeValue={storePerGuest} avgValue={avgPerGuest} format={fmtYen} />
            <CompareCard label="延べ客数" storeValue={storeGuests} avgValue={avgGuests} format={fmtGuests} />
          </div>
        </section>

        {/* ── 売れ筋 TOP10 + 時間帯グラフ ── */}
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
                  <tr key={row.menuItemId} className={`border-b border-stone-50 ${i === 0 ? "bg-amber-50" : ""}`}>
                    <td className={`py-2.5 text-xs font-bold ${i === 0 ? "text-amber-700" : "text-stone-400"}`}>{i + 1}</td>
                    <td className={`py-2.5 font-medium ${i === 0 ? "text-amber-900" : "text-stone-800"}`}>{row.menuItemName}</td>
                    <td className="py-2.5 text-right text-stone-600">{Number(row.totalQuantity)} 個</td>
                    <td className="py-2.5 text-right text-stone-800 font-medium">¥{Number(row.totalRevenue).toLocaleString()}</td>
                  </tr>
                ))}
                {ranking.length === 0 && (
                  <tr><td colSpan={4} className="py-8 text-center text-stone-400 text-sm">データなし</td></tr>
                )}
              </tbody>
            </table>
          </section>

          {/* 時間帯別売上グラフ */}
          <section className="bg-white rounded-2xl border border-stone-200 p-6">
            <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">時間帯別 合計売上</h2>
            <div className="space-y-1.5">
              {Object.entries(hourlyRevenue).map(([h, revenue]) => {
                const hour = Number(h)
                const count = hourlyOrderCount[hour] ?? 0
                const isPeak = hour === peakHour
                const barWidth = maxHourlyRevenue > 0 ? (revenue / maxHourlyRevenue) * 100 : 0
                return (
                  <div key={h} className="flex items-center gap-2 text-xs">
                    <span className="w-10 text-right text-stone-500 shrink-0">{h}時</span>
                    <div className="flex-1 bg-stone-100 rounded-full h-5 overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${isPeak ? "bg-amber-600" : "bg-stone-800"}`}
                        style={{ width: `${barWidth}%` }}
                      />
                    </div>
                    <span className={`w-36 text-right font-medium shrink-0 ${isPeak ? "text-amber-700" : "text-stone-600"}`}>
                      {revenue > 0 ? `¥${revenue.toLocaleString()} (${count}組)` : "—"}
                    </span>
                  </div>
                )
              })}
            </div>
          </section>
        </div>

        {/* ── 直近10件（未会計含む・canceled除く）── */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">
            直近の注文（最新10件）
            <span className="ml-2 text-xs font-normal text-stone-400 normal-case">未会計含む・リアルタイム状況確認用</span>
          </h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-400 border-b border-stone-100">
                <th className="pb-2 font-medium">時刻</th>
                <th className="pb-2 font-medium">テーブル</th>
                <th className="pb-2 font-medium">人数</th>
                <th className="pb-2 font-medium">注文品目</th>
                <th className="pb-2 font-medium text-right">金額</th>
                <th className="pb-2 font-medium text-center">ステータス</th>
                <th className="pb-2 font-medium text-center">会計</th>
              </tr>
            </thead>
            <tbody>
              {recentOrders.map((order) => {
                const time = new Date(order.createdAt).toLocaleTimeString("ja-JP", {
                  timeZone: "Asia/Tokyo",
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
                    <td className="py-2.5 text-stone-700">{firstItems}{rest}</td>
                    <td className="py-2.5 text-right font-medium text-stone-800">¥{order.totalPrice.toLocaleString()}</td>
                    <td className="py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${st.color}`}>{st.label}</span>
                    </td>
                    <td className="py-2.5 text-center">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${order.isPaid ? "bg-emerald-100 text-emerald-700" : "bg-stone-100 text-stone-500"}`}>
                        {order.isPaid ? "済" : "未"}
                      </span>
                    </td>
                  </tr>
                )
              })}
              {recentOrders.length === 0 && (
                <tr>
                  <td colSpan={7} className="py-8 text-center text-stone-400">注文がまだありません</td>
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

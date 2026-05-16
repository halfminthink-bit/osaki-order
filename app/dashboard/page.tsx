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

type StoreRow = {
  storeId: string
  storeName: string
  isDirect: boolean
  location: string | null
  totalRevenue: bigint
  orderCount: bigint
  totalGuests: bigint
}

const PAID_WHERE = Prisma.sql`o."isPaid" = true AND o.status != 'canceled'::"OrderStatus"`

const STATUS_LABEL: Record<string, { label: string; color: string }> = {
  received: { label: "受付済", color: "bg-blue-100 text-blue-700" },
  preparing: { label: "調理中", color: "bg-amber-100 text-amber-700" },
  served: { label: "提供済", color: "bg-emerald-100 text-emerald-700" },
  canceled: { label: "キャンセル", color: "bg-red-100 text-red-700" },
}

export default async function DashboardPage() {
  // ── 集計クエリ（会計済のみ）───────────────────────────────
  const summary = await prisma.order.aggregate({
    where: { isPaid: true, status: { not: "canceled" } },
    _sum: { totalPrice: true, partySize: true },
    _count: true,
  })

  const totalRevenue = summary._sum.totalPrice ?? 0
  const totalOrders = summary._count
  const totalGuests = summary._sum.partySize ?? 0
  const perGuestAvg = totalGuests > 0 ? Math.round(totalRevenue / totalGuests) : 0

  // ── 売れ筋 TOP10（会計済のみ）───────────────────────────
  const ranking = await prisma.$queryRaw<RankingRow[]>(Prisma.sql`
    SELECT
      oi."menuItemId",
      oi."menuItemName",
      SUM(oi.quantity)::bigint          AS "totalQuantity",
      SUM(oi.price * oi.quantity)::bigint AS "totalRevenue"
    FROM "OrderItem" oi
    JOIN "Order" o ON oi."orderId" = o.id
    WHERE ${PAID_WHERE}
    GROUP BY oi."menuItemId", oi."menuItemName"
    ORDER BY "totalRevenue" DESC
    LIMIT 10
  `)

  // ── 時間帯別売上（会計済のみ）───────────────────────────
  const paidOrders = await prisma.order.findMany({
    where: { isPaid: true, status: { not: "canceled" } },
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

  // ── 店舗別パフォーマンス（会計済のみ）───────────────────
  const storeStats = await prisma.$queryRaw<StoreRow[]>(Prisma.sql`
    SELECT
      s.id           AS "storeId",
      s.name         AS "storeName",
      s."isDirect",
      s.location,
      COALESCE(SUM(o."totalPrice"), 0)::bigint AS "totalRevenue",
      COUNT(o.id)::bigint                      AS "orderCount",
      COALESCE(SUM(o."partySize"), 0)::bigint  AS "totalGuests"
    FROM "Store" s
    LEFT JOIN "Order" o ON o."storeId" = s.id AND ${PAID_WHERE}
    GROUP BY s.id, s.name, s."isDirect", s.location
    ORDER BY "totalRevenue" DESC
  `)

  const allStoreRevenue = storeStats.reduce((s, r) => s + Number(r.totalRevenue), 0)

  // ── 直近10件（isPaid 問わず、canceled 除く）──────────────
  const recentOrders = await prisma.order.findMany({
    where: { status: { not: "canceled" } },
    orderBy: { createdAt: "desc" },
    take: 10,
    include: { items: true, store: { select: { name: true } } },
  })

  return (
    <div className="min-h-screen bg-stone-50">
      {/* ヘッダー */}
      <header className="bg-stone-900 text-white sticky top-0 z-10">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-lg font-bold">経営ダッシュボード — 全店舗</h1>
            <p className="text-xs text-stone-400 mt-0.5">会計済の確定売上のみ集計</p>
          </div>
          <p className="text-xs text-stone-400">店舗別ページから業務端末へ移動できます</p>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8 space-y-10">

        {/* 補足テキスト */}
        <p className="text-xs text-stone-500 bg-stone-100 border border-stone-200 rounded-lg px-4 py-2.5">
          ※ 売上集計は会計済（isPaid）の注文のみを対象とします。リアルタイム状況は「直近の注文」をご確認ください。
        </p>

        {/* ── サマリーカード 4枚 ── */}
        <section>
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">サマリー</h2>
          <div className="grid grid-cols-4 gap-4">
            <SummaryCard
              label="確定売上"
              value={`¥${totalRevenue.toLocaleString()}`}
              note="会計済の合計"
            />
            <SummaryCard
              label="会計件数"
              value={`${totalOrders} 件`}
              note="注文件数（会計済）"
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

        {/* ── 店舗別パフォーマンス ── */}
        <section className="bg-white rounded-2xl border border-stone-200 p-6">
          <h2 className="text-sm font-semibold text-stone-500 uppercase tracking-wide mb-4">店舗別パフォーマンス</h2>
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left text-xs text-stone-400 border-b border-stone-100">
                <th className="pb-2 font-medium w-8">順位</th>
                <th className="pb-2 font-medium">店舗名</th>
                <th className="pb-2 font-medium">地域</th>
                <th className="pb-2 font-medium text-right">確定売上</th>
                <th className="pb-2 font-medium text-right">会計件数</th>
                <th className="pb-2 font-medium text-right">客単価</th>
                <th className="pb-2 font-medium text-right">シェア</th>
              </tr>
            </thead>
            <tbody>
              {storeStats.map((row, i) => {
                const rev = Number(row.totalRevenue)
                const guests = Number(row.totalGuests)
                const perGuest = guests > 0 ? Math.round(rev / guests) : 0
                const share = allStoreRevenue > 0 ? ((rev / allStoreRevenue) * 100).toFixed(1) : "0.0"
                return (
                  <tr key={row.storeId} className={`border-b border-stone-50 ${i === 0 ? "bg-amber-50" : ""}`}>
                    <td className={`py-3 text-xs font-bold ${i === 0 ? "text-amber-700" : "text-stone-400"}`}>{i + 1}</td>
                    <td className="py-3">
                      <div className="flex items-center gap-2 flex-wrap">
                        <Link
                          href={`/dashboard/${row.storeId}`}
                          className={`font-medium hover:underline ${i === 0 ? "text-amber-900" : "text-stone-800"}`}
                        >
                          {row.storeName}
                        </Link>
                        <span className={`text-xs px-1.5 py-0.5 rounded font-medium ${row.isDirect ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-800"}`}>
                          {row.isDirect ? "直営" : "FC"}
                        </span>
                      </div>
                    </td>
                    <td className="py-3 text-stone-500 text-xs">{row.location ?? "—"}</td>
                    <td className="py-3 text-right font-medium text-stone-800">¥{rev.toLocaleString()}</td>
                    <td className="py-3 text-right text-stone-600">{Number(row.orderCount)} 件</td>
                    <td className="py-3 text-right text-stone-600">¥{perGuest.toLocaleString()}</td>
                    <td className="py-3 text-right text-stone-500 text-xs">{share}%</td>
                  </tr>
                )
              })}
            </tbody>
          </table>
        </section>

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
                <th className="pb-2 font-medium">店舗</th>
                <th className="pb-2 font-medium">テーブル</th>
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
                    <td className="py-2.5 text-stone-600 text-xs">{order.store.name}</td>
                    <td className="py-2.5 text-stone-800 font-medium">#{order.tableNumber}</td>
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

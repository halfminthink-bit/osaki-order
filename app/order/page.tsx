import OrderMenu from "@/components/OrderMenu"
import { prisma } from "@/lib/prisma"

export const dynamic = "force-dynamic"

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; table?: string; party?: string }>
}) {
  const { store, table, party } = await searchParams
  const tableNum = table ? parseInt(table, 10) : null
  const partyNum = party ? parseInt(party, 10) : null

  if (!store) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50 max-w-md mx-auto">
        <header className="sticky top-0 z-10 bg-stone-900 text-white px-4 py-3">
          <h1 className="text-lg font-bold tracking-wide">OSAKI 亭</h1>
        </header>
        <main className="flex-1 px-4 py-10 flex flex-col justify-center gap-4 text-center">
          <p className="text-4xl">⚠️</p>
          <p className="text-base font-semibold text-stone-800">店舗が指定されていません</p>
          <p className="text-sm text-stone-500 leading-relaxed">
            店舗のQRコードから再度アクセスしてください。
          </p>
        </main>
      </div>
    )
  }

  const storeRecord = await prisma.store.findUnique({ where: { id: store }, select: { name: true } })
  const storeName = storeRecord?.name ?? store

  return <OrderMenu storeId={store} storeName={storeName} tableNum={tableNum} partyNum={partyNum} />
}

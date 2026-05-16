export const dynamic = "force-dynamic"

import Link from "next/link"
import { Button } from "@/components/ui/button"
import { prisma } from "@/lib/prisma"

type Props = {
  searchParams: Promise<{ store?: string; orderId?: string; table?: string; party?: string }>
}

export default async function CompletePage({ searchParams }: Props) {
  const { store, orderId, table, party } = await searchParams
  const storeParam = store ? `store=${store}&` : ""

  const storeRecord = store
    ? await prisma.store.findUnique({ where: { id: store }, select: { name: true } })
    : null
  const storeName = storeRecord?.name ?? "OSAKI 亭"
  const statusHref = table
    ? `/order/status?${storeParam}table=${table}${party ? `&party=${party}` : ""}`
    : null
  const menuHref = table && party ? `/order?${storeParam}table=${table}&party=${party}` : "/"

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-stone-900 text-white px-4 py-3">
        <div className="flex items-center justify-between">
          <h1 className="text-lg font-bold tracking-wide">{storeName}</h1>
          {table && (
            <p className="text-xs text-stone-300">
              {table} 番{party ? ` / ${party} 名様` : ""}
            </p>
          )}
        </div>
      </header>

      <main className="flex-1 px-4 py-16 flex flex-col items-center gap-6 text-center">
        <div className="text-6xl leading-none">🍱</div>

        <div className="space-y-2">
          <h2 className="text-2xl font-bold text-stone-900">
            ご注文ありがとうございました
          </h2>
          <p className="text-sm text-stone-600 leading-relaxed">
            料理ができるまでお待ちください
          </p>
        </div>

        {orderId && (
          <p className="text-xs text-stone-400 font-mono bg-stone-100 rounded px-3 py-1.5">
            注文 ID: {orderId}
          </p>
        )}

        <div className="flex flex-col gap-3 w-full items-center mt-4">
          {statusHref && (
            <Link href={statusHref} className="w-full max-w-xs">
              <Button className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white text-base font-semibold">
                注文状況を見る
              </Button>
            </Link>
          )}
          <Link href={menuHref} className="w-full max-w-xs">
            <Button
              variant="outline"
              className="w-full h-12 border-stone-900 text-stone-900 hover:bg-stone-100 text-base font-semibold"
            >
              追加注文する
            </Button>
          </Link>
        </div>
      </main>
    </div>
  )
}

export const dynamic = "force-dynamic"

import Link from "next/link"
import { Button } from "@/components/ui/button"

type Props = {
  searchParams: Promise<{ orderId?: string; table?: string; party?: string }>
}

export default async function CompletePage({ searchParams }: Props) {
  const { orderId, table, party } = await searchParams
  const backHref = table && party ? `/order?table=${table}&party=${party}` : "/"

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
      <header className="sticky top-0 z-10 bg-amber-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold">OSAKI 亭</h1>
        {table && (
          <p className="text-xs opacity-90 mt-0.5">
            テーブル {table} 番{party ? ` / ${party} 名様` : ""}
          </p>
        )}
      </header>

      <main className="flex-1 px-4 py-10 flex flex-col items-center gap-6 text-center">
        <div className="text-5xl">✅</div>
        <div>
          <h2 className="text-xl font-bold mb-1">ご注文を受け付けました</h2>
          <p className="text-sm text-muted-foreground">
            まもなくお届けします。
          </p>
        </div>

        {orderId && (
          <p className="text-xs text-muted-foreground bg-muted rounded px-3 py-2 font-mono">
            注文 ID: {orderId}
          </p>
        )}

        <Link href={backHref}>
          <Button className="h-12 px-8 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold">
            追加注文する
          </Button>
        </Link>
      </main>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ store?: string; table?: string }>
}) {
  const { store, table } = await searchParams

  if (!store) {
    return (
      <div className="flex flex-col min-h-screen bg-stone-50 max-w-md mx-auto">
        <header className="bg-stone-900 text-white px-4 py-4">
          <h1 className="text-2xl font-bold tracking-wide">OSAKI 亭</h1>
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

  return (
    <div className="flex flex-col min-h-screen bg-stone-50 max-w-md mx-auto">
      <header className="bg-stone-900 text-white px-4 py-4">
        <h1 className="text-2xl font-bold tracking-wide">OSAKI 亭</h1>
      </header>

      <main className="flex-1 px-4 py-10 flex flex-col justify-center gap-6">
        <p className="text-sm text-stone-600 text-center leading-relaxed">
          ご来店ありがとうございます。<br />
          テーブル番号と人数を入力してください
        </p>

        <Card className="border-stone-200">
          <CardContent className="py-6 space-y-5">
            <form action="/order" method="GET" className="space-y-5">
              <input type="hidden" name="store" value={store} />
              <div className="space-y-1.5">
                <label htmlFor="table" className="text-sm font-medium text-stone-900">
                  テーブル番号
                </label>
                <Input
                  id="table"
                  name="table"
                  type="number"
                  min={1}
                  required
                  placeholder="例: 3"
                  defaultValue={table ?? ""}
                />
              </div>

              <div className="space-y-1.5">
                <label htmlFor="party" className="text-sm font-medium text-stone-900">
                  人数
                </label>
                <Input
                  id="party"
                  name="party"
                  type="number"
                  min={1}
                  max={10}
                  required
                  placeholder="1〜10"
                />
              </div>

              <Button
                type="submit"
                className="w-full h-12 bg-amber-700 hover:bg-amber-800 text-white text-base font-semibold"
              >
                メニューを見る
              </Button>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}

import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default async function LandingPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string }>
}) {
  const { table } = await searchParams

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
      <header className="bg-amber-600 text-white px-4 py-4 shadow-md">
        <h1 className="text-xl font-bold tracking-wide">OSAKI 亭</h1>
      </header>

      <main className="flex-1 px-4 py-10 flex flex-col justify-center gap-6">
        <p className="text-sm text-muted-foreground text-center leading-relaxed">
          ご来店ありがとうございます。<br />
          テーブル番号と人数を入力してください
        </p>

        <Card>
          <CardContent className="py-6 space-y-5">
            <form action="/order" method="GET" className="space-y-5">
              <div className="space-y-1.5">
                <label htmlFor="table" className="text-sm font-medium">
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
                <label htmlFor="party" className="text-sm font-medium">
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
                className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold"
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

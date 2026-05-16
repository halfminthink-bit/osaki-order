import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"

const DUMMY_MENU = [
  { id: 1, name: "唐揚げ定食" },
  { id: 2, name: "ラーメン" },
  { id: 3, name: "餃子(5個)" },
]

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
      {/* sticky header */}
      <header className="sticky top-0 z-10 bg-amber-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold tracking-wide">OSAKI 亭</h1>
      </header>

      {/* scrollable menu area */}
      <main className="flex-1 overflow-y-auto px-4 py-4 space-y-3 pb-24">
        {DUMMY_MENU.map((item) => (
          <Card key={item.id}>
            <CardHeader>
              <CardTitle className="text-base">{item.name}</CardTitle>
            </CardHeader>
            <CardContent>
              <p className="text-sm text-muted-foreground">価格・説明は準備中</p>
            </CardContent>
          </Card>
        ))}
      </main>

      {/* sticky footer */}
      <footer className="sticky bottom-0 z-10 bg-background border-t px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <Button className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold">
          注文リストを見る
        </Button>
      </footer>
    </div>
  )
}

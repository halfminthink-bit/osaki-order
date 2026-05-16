import { Button } from "@/components/ui/button"
import { Card, CardContent } from "@/components/ui/card"

type MenuCategory = "main" | "noodles" | "side" | "drink" | "dessert"

type MenuItem = {
  id: string
  name: string
  price: number
  category: MenuCategory
  description?: string
  emoji: string
  isSoldOut: boolean
}

const MENU_ITEMS: MenuItem[] = [
  { id: "main-001", name: "唐揚げ定食", price: 980, category: "main", emoji: "🍱", isSoldOut: false },
  { id: "main-002", name: "ハンバーグ定食", price: 1180, category: "main", emoji: "🍔", isSoldOut: false },
  { id: "noodles-001", name: "醤油ラーメン", price: 880, category: "noodles", emoji: "🍜", isSoldOut: false },
  { id: "noodles-002", name: "味噌ラーメン", price: 920, category: "noodles", emoji: "🍜", isSoldOut: false },
  { id: "side-001", name: "餃子", price: 480, category: "side", emoji: "🥟", isSoldOut: false },
  { id: "side-002", name: "枝豆", price: 380, category: "side", emoji: "🌱", isSoldOut: false },
  { id: "drink-001", name: "生ビール", price: 580, category: "drink", emoji: "🍺", isSoldOut: false },
  { id: "drink-002", name: "ウーロン茶", price: 280, category: "drink", emoji: "🍵", isSoldOut: false },
  { id: "dessert-001", name: "杏仁豆腐", price: 380, category: "dessert", emoji: "🍮", isSoldOut: false },
]

const CATEGORY_LABELS: Record<MenuCategory, string> = {
  main: "メイン",
  noodles: "麺類",
  side: "サイドメニュー",
  drink: "ドリンク",
  dessert: "デザート",
}

const CATEGORIES: MenuCategory[] = ["main", "noodles", "side", "drink", "dessert"]

export default async function OrderPage({
  searchParams,
}: {
  searchParams: Promise<{ table?: string; party?: string }>
}) {
  const { table, party } = await searchParams
  const tableNum = table ? parseInt(table, 10) : null
  const partyNum = party ? parseInt(party, 10) : null

  return (
    <div className="flex flex-col min-h-screen bg-background max-w-md mx-auto">
      {/* sticky header */}
      <header className="sticky top-0 z-10 bg-amber-600 text-white px-4 py-3 shadow-md">
        <h1 className="text-lg font-bold">OSAKI 亭</h1>
        {tableNum && (
          <p className="text-xs opacity-90 mt-0.5">
            テーブル {tableNum} 番{partyNum ? ` / ${partyNum} 名様` : ""}
          </p>
        )}
      </header>

      {/* scrollable menu area */}
      <main className="flex-1 px-4 py-4 space-y-6 pb-24">
        {CATEGORIES.map((category) => {
          const items = MENU_ITEMS.filter((item) => item.category === category)
          if (items.length === 0) return null
          return (
            <section key={category}>
              <h2 className="text-xs font-bold text-muted-foreground uppercase tracking-widest mb-2 px-1">
                {CATEGORY_LABELS[category]}
              </h2>
              <div className="space-y-2">
                {items.map((item) => (
                  <Card key={item.id} className="py-0">
                    <CardContent className="flex items-center gap-3 py-3 px-4">
                      <span className="text-3xl leading-none">{item.emoji}</span>
                      <div className="flex-1 min-w-0">
                        <p className="font-medium text-sm leading-tight">{item.name}</p>
                        <p className="text-amber-600 font-bold text-sm mt-0.5">
                          ¥{item.price.toLocaleString()}
                        </p>
                      </div>
                      <Button
                        size="sm"
                        variant="outline"
                        className="shrink-0 h-9 px-3 border-amber-600 text-amber-600 hover:bg-amber-50"
                        disabled
                      >
                        ＋追加
                      </Button>
                    </CardContent>
                  </Card>
                ))}
              </div>
            </section>
          )
        })}
      </main>

      {/* sticky footer */}
      <footer className="sticky bottom-0 z-10 bg-background border-t px-4 py-3 shadow-[0_-2px_8px_rgba(0,0,0,0.08)]">
        <Button
          className="w-full h-12 bg-amber-600 hover:bg-amber-700 text-white text-base font-semibold"
          disabled
        >
          注文を確認する（合計 ¥0）
        </Button>
      </footer>
    </div>
  )
}

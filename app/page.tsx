import { Button } from "@/components/ui/button"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Input } from "@/components/ui/input"

export default function Home() {
  return (
    <main className="min-h-screen flex items-center justify-center bg-background p-4">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-2xl font-bold text-center text-foreground">
          OSAKI 注文システム
        </h1>
        <Card>
          <CardHeader>
            <CardTitle>テーブル確認</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <Input placeholder="テーブル番号" />
            <Button className="w-full">注文を見る</Button>
          </CardContent>
        </Card>
      </div>
    </main>
  )
}

import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { MENU_ITEMS } from "../lib/menu"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const STORES = [
  { id: "tokyo-shinjuku",  name: "OSAKI亭 新宿店",      isDirect: true,  location: "東京・新宿" },
  { id: "tokyo-shibuya",   name: "OSAKI亭 渋谷店",      isDirect: true,  location: "東京・渋谷" },
  { id: "osaka-shinsai",   name: "OSAKI亭 心斎橋店",    isDirect: true,  location: "大阪・心斎橋" },
  { id: "fukuoka-tenjin",  name: "大崎ラーメン 天神店", isDirect: false, location: "福岡・天神" },
  { id: "nagoya-sakae",    name: "OSAKI亭 栄店",        isDirect: false, location: "名古屋・栄" },
]

// 過去注文の店舗別設定（合計42件 served+isPaid:true）
const PAST_STORE_CONFIG: Record<string, { count: number; biasIds: string[] }> = {
  "tokyo-shinjuku": { count: 15, biasIds: ["karaage", "karaage", "beer", "ramen-shoyu", "edamame"] },
  "tokyo-shibuya":  { count: 10, biasIds: ["ramen-shoyu", "ramen-miso", "beer", "gyoza"] },
  "osaka-shinsai":  { count: 10, biasIds: ["ramen-miso", "ramen-shoyu", "ramen-tonkotsu", "gyoza", "gyoza"] },
  "fukuoka-tenjin": { count: 4,  biasIds: ["ramen-tonkotsu", "beer", "karaage"] },
  "nagoya-sakae":   { count: 3,  biasIds: ["ramen-shoyu", "gyoza", "soft-drink"] },
}

// 今日の進行中注文（5件 received/preparing + isPaid:false）
// received → /kitchen と /staff に表示、preparing → /staff のみ表示
const TODAY_ORDERS = [
  { storeId: "tokyo-shinjuku", tableNumber: 3, partySize: 2, status: "received"  as const },
  { storeId: "tokyo-shinjuku", tableNumber: 5, partySize: 4, status: "preparing" as const },
  { storeId: "tokyo-shibuya",  tableNumber: 2, partySize: 3, status: "received"  as const },
  { storeId: "osaka-shinsai",  tableNumber: 1, partySize: 2, status: "received"  as const },
  { storeId: "fukuoka-tenjin", tableNumber: 7, partySize: 5, status: "preparing" as const },
]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomBusinessTime(daysAgo: number): Date {
  const base = new Date()
  base.setDate(base.getDate() - daysAgo)
  const rand = Math.random()
  let hour: number
  if (rand < 0.45) {
    hour = randomInt(11, 13)
  } else if (rand < 0.55) {
    hour = randomInt(14, 16)
  } else {
    hour = randomInt(17, 22)
  }
  base.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0)
  return base
}

// 今日の昼〜夕方(11〜20時)にランダムな時刻を生成
function todayBusinessTime(): Date {
  const base = new Date()
  const hour = randomInt(11, 20)
  base.setHours(hour, randomInt(0, 59), randomInt(0, 59), 0)
  return base
}

function pickItems(biasIds: string[]): typeof MENU_ITEMS {
  const available = MENU_ITEMS.filter((m) => !m.isSoldOut)
  const biased = biasIds
    .map((id) => available.find((m) => m.id === id))
    .filter(Boolean) as typeof MENU_ITEMS

  const itemCount = randomInt(1, 4)
  const pool = Math.random() < 0.6 && biased.length > 0 ? biased : available
  return [...pool].sort(() => Math.random() - 0.5).slice(0, itemCount)
}

async function main() {
  console.log("⚠️  既存データを全削除して 5店舗 + 約47件のダミー注文を投入します。")
  console.log("   中止する場合は Ctrl+C を押してください（3秒後に開始します）...")
  await new Promise((r) => setTimeout(r, 3000))

  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  await prisma.store.deleteMany()
  console.log("✅  既存データを削除しました。")

  for (const store of STORES) {
    await prisma.store.create({ data: store })
  }
  console.log("✅  5店舗を投入しました。")

  // 過去注文（42件: served + isPaid:true、集計・ダッシュボード用）
  let pastCount = 0
  for (const store of STORES) {
    const cfg = PAST_STORE_CONFIG[store.id]
    for (let i = 0; i < cfg.count; i++) {
      const selectedItems = pickItems(cfg.biasIds)
      const orderItems = selectedItems.map((item) => ({
        menuItemId: item.id,
        menuItemName: item.name,
        price: item.price,
        quantity: randomInt(1, 3),
      }))
      const totalPrice = orderItems.reduce((sum, oi) => sum + oi.price * oi.quantity, 0)
      const createdAt = randomBusinessTime(randomInt(1, 6))  // 1〜6日前

      await prisma.order.create({
        data: {
          storeId: store.id,
          tableNumber: randomInt(1, 20),
          partySize: randomInt(1, 5),
          totalPrice,
          status: "served",
          isPaid: true,
          createdAt,
          updatedAt: createdAt,
          items: { create: orderItems },
        },
      })
      pastCount++
    }
    console.log(`  [過去] ${store.name}: ${cfg.count} 件投入`)
  }
  console.log(`✅  過去注文 ${pastCount} 件（served/isPaid:true）を投入しました。`)

  // 今日の進行中注文（5件: received/preparing + isPaid:false）
  for (const order of TODAY_ORDERS) {
    const cfg = PAST_STORE_CONFIG[order.storeId]
    const selectedItems = pickItems(cfg.biasIds)
    const orderItems = selectedItems.map((item) => ({
      menuItemId: item.id,
      menuItemName: item.name,
      price: item.price,
      quantity: randomInt(1, 3),
    }))
    const totalPrice = orderItems.reduce((sum, oi) => sum + oi.price * oi.quantity, 0)
    const createdAt = todayBusinessTime()

    await prisma.order.create({
      data: {
        storeId: order.storeId,
        tableNumber: order.tableNumber,
        partySize: order.partySize,
        totalPrice,
        status: order.status,
        isPaid: false,
        createdAt,
        updatedAt: createdAt,
        items: { create: orderItems },
      },
    })
  }
  console.log(`✅  今日の進行中注文 ${TODAY_ORDERS.length} 件（received/preparing/isPaid:false）を投入しました。`)
  console.log(`✅  合計 ${pastCount + TODAY_ORDERS.length} 件のダミー注文を投入しました。`)

  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

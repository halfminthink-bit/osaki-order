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

// 店舗別の注文件数と傾向(menuItemId の重みリスト)
const STORE_CONFIG: Record<string, { count: number; biasIds: string[] }> = {
  "tokyo-shinjuku": { count: 15, biasIds: ["karaage", "karaage", "beer", "ramen-shoyu", "edamame"] },
  "tokyo-shibuya":  { count: 10, biasIds: ["ramen-shoyu", "ramen-miso", "beer", "gyoza"] },
  "osaka-shinsai":  { count: 10, biasIds: ["ramen-miso", "ramen-shoyu", "ramen-tonkotsu", "gyoza", "gyoza"] },
  "fukuoka-tenjin": { count: 7,  biasIds: ["ramen-tonkotsu", "beer", "karaage"] },
  "nagoya-sakae":   { count: 5,  biasIds: ["ramen-shoyu", "gyoza", "soft-drink"] },
}

const STATUSES = [
  "served", "served", "served", "served", "served",
  "served", "served", "served", "canceled", "received",
] as const
type Status = (typeof STATUSES)[number]

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

  // 店舗を投入
  for (const store of STORES) {
    await prisma.store.create({ data: store })
  }
  console.log("✅  5店舗を投入しました。")

  let totalOrders = 0
  for (const store of STORES) {
    const cfg = STORE_CONFIG[store.id]
    for (let i = 0; i < cfg.count; i++) {
      const status: Status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
      const selectedItems = pickItems(cfg.biasIds)

      const orderItems = selectedItems.map((item) => ({
        menuItemId: item.id,
        menuItemName: item.name,
        price: item.price,
        quantity: randomInt(1, 3),
      }))

      const totalPrice = orderItems.reduce((sum, oi) => sum + oi.price * oi.quantity, 0)
      const isPaid = status === "served" ? Math.random() < 0.9 : false
      const createdAt = randomBusinessTime(randomInt(0, 6))

      await prisma.order.create({
        data: {
          storeId: store.id,
          tableNumber: randomInt(1, 20),
          partySize: randomInt(1, 5),
          totalPrice,
          status,
          isPaid,
          createdAt,
          updatedAt: createdAt,
          items: { create: orderItems },
        },
      })
      totalOrders++
    }
    console.log(`  ${store.name}: ${cfg.count} 件投入`)
  }

  console.log(`✅  合計 ${totalOrders} 件のダミー注文を投入しました。`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

import "dotenv/config"
import { PrismaClient } from "../lib/generated/prisma/client"
import { PrismaNeon } from "@prisma/adapter-neon"
import { MENU_ITEMS } from "../lib/menu"

const adapter = new PrismaNeon({ connectionString: process.env.DATABASE_URL! })
const prisma = new PrismaClient({ adapter })

const STATUSES = ["served", "served", "served", "served", "served", "served", "served", "served", "canceled", "received"] as const
type Status = (typeof STATUSES)[number]

function randomInt(min: number, max: number) {
  return Math.floor(Math.random() * (max - min + 1)) + min
}

function randomBusinessTime(daysAgo: number): Date {
  const base = new Date()
  base.setDate(base.getDate() - daysAgo)
  // ランチ(11-14時)とディナー(17-22時)に偏らせる
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

async function main() {
  console.log("⚠️  既存の Order / OrderItem を全削除してから 40 件のダミー注文を投入します。")
  console.log("   中止する場合は Ctrl+C を押してください（3秒後に開始します）...")
  await new Promise((r) => setTimeout(r, 3000))

  // 外部キー制約の順序: OrderItem → Order
  await prisma.orderItem.deleteMany()
  await prisma.order.deleteMany()
  console.log("✅  既存データを削除しました。")

  const availableItems = MENU_ITEMS.filter((m) => !m.isSoldOut)
  const orderCount = randomInt(38, 45)

  for (let i = 0; i < orderCount; i++) {
    const status: Status = STATUSES[Math.floor(Math.random() * STATUSES.length)]
    const itemCount = randomInt(1, 4)
    const selectedItems = [...availableItems].sort(() => Math.random() - 0.5).slice(0, itemCount)

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
  }

  console.log(`✅  ${orderCount} 件のダミー注文を投入しました。`)
  await prisma.$disconnect()
}

main().catch((e) => {
  console.error(e)
  process.exit(1)
})

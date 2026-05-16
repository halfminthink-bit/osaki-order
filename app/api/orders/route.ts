import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { MENU_ITEMS } from "@/lib/menu"

type OrderItemInput = {
  menuItemId: string
  quantity: number
}

export async function POST(req: NextRequest) {
  const body = await req.json()
  const { storeId, tableNumber, partySize, items } = body as {
    storeId: string
    tableNumber: number
    partySize: number
    items: OrderItemInput[]
  }

  if (!storeId || !tableNumber || !partySize || !Array.isArray(items) || items.length === 0) {
    return NextResponse.json({ error: "invalid request" }, { status: 400 })
  }

  const store = await prisma.store.findUnique({ where: { id: storeId } })
  if (!store) {
    return NextResponse.json({ error: `store not found: ${storeId}` }, { status: 400 })
  }

  const resolvedItems = []
  for (const item of items) {
    const menuItem = MENU_ITEMS.find((m) => m.id === item.menuItemId)
    if (!menuItem) {
      return NextResponse.json({ error: `unknown item: ${item.menuItemId}` }, { status: 400 })
    }
    if (menuItem.isSoldOut) {
      return NextResponse.json({ error: `sold out: ${menuItem.name}` }, { status: 400 })
    }
    resolvedItems.push({
      menuItemId: menuItem.id,
      menuItemName: menuItem.name,
      price: menuItem.price,
      quantity: item.quantity,
    })
  }

  const totalPrice = resolvedItems.reduce((sum, i) => sum + i.price * i.quantity, 0)

  const order = await prisma.order.create({
    data: {
      storeId,
      tableNumber,
      partySize,
      totalPrice,
      items: { create: resolvedItems },
    },
  })

  return NextResponse.json({ orderId: order.id }, { status: 201 })
}

import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function POST(
  req: NextRequest,
  { params }: { params: Promise<{ tableNumber: string }> }
) {
  const { tableNumber } = await params
  const tableNum = Number(tableNumber)

  if (isNaN(tableNum)) {
    return NextResponse.json({ error: "invalid tableNumber" }, { status: 400 })
  }

  const body = await req.json().catch(() => ({}))
  const storeId: string | undefined = body?.storeId

  const unpaidOrders = await prisma.order.findMany({
    where: {
      ...(storeId ? { storeId } : {}),
      tableNumber: tableNum,
      isPaid: false,
      status: { not: "canceled" },
    },
    select: { id: true, totalPrice: true },
  })

  if (unpaidOrders.length === 0) {
    return NextResponse.json({ updatedCount: 0, totalAmount: 0 })
  }

  const totalAmount = unpaidOrders.reduce((sum, o) => sum + o.totalPrice, 0)

  await prisma.order.updateMany({
    where: {
      id: { in: unpaidOrders.map((o) => o.id) },
    },
    data: { isPaid: true },
  })

  return NextResponse.json({ updatedCount: unpaidOrders.length, totalAmount })
}

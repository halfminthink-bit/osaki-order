import { NextRequest, NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"
import { OrderStatus } from "@/lib/generated/prisma/client"

const VALID_STATUSES: OrderStatus[] = ["received", "preparing", "served", "canceled"]

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params
  const body = await req.json()
  const { status } = body as { status: string }

  if (!VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 })
  }

  const order = await prisma.order.update({
    where: { id },
    data: { status: status as OrderStatus },
  })

  return NextResponse.json({ orderId: order.id, status: order.status })
}

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
  const { status, isPaid } = body as { status?: string; isPaid?: boolean }

  if (status === undefined && isPaid === undefined) {
    return NextResponse.json({ error: "status or isPaid is required" }, { status: 400 })
  }

  if (status !== undefined && !VALID_STATUSES.includes(status as OrderStatus)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 })
  }

  const data: { status?: OrderStatus; isPaid?: boolean } = {}
  if (status !== undefined) data.status = status as OrderStatus
  if (isPaid !== undefined) data.isPaid = isPaid

  const order = await prisma.order.update({
    where: { id },
    data,
  })

  return NextResponse.json({ orderId: order.id, status: order.status, isPaid: order.isPaid })
}

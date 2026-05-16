"use client"

import { useState } from "react"

type OrderItem = {
  id: string
  menuItemName: string
  price: number
  quantity: number
}

type Order = {
  id: string
  tableNumber: number
  partySize: number
  totalPrice: number
  status: string
  createdAt: Date
  items: OrderItem[]
}

const STATUS_LABELS: Record<string, string> = {
  received: "受付済",
  cooking: "調理中",
  served: "提供済",
  canceled: "キャンセル",
}

const STATUS_COLORS: Record<string, string> = {
  received: "bg-amber-100 text-amber-800",
  cooking: "bg-blue-100 text-blue-800",
  served: "bg-green-100 text-green-800",
  canceled: "bg-gray-100 text-gray-500",
}

const NEXT_STATUSES = ["received", "cooking", "served", "canceled"] as const

export default function OrderCard({ order }: { order: Order }) {
  const [status, setStatus] = useState(order.status)
  const [loading, setLoading] = useState(false)

  async function changeStatus(newStatus: string) {
    setLoading(true)
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      setStatus(newStatus)
    }
    setLoading(false)
  }

  const createdAt = new Date(order.createdAt)
  const timeStr = createdAt.toLocaleTimeString("ja-JP", {
    hour: "2-digit",
    minute: "2-digit",
  })

  return (
    <div className="bg-white rounded-xl shadow border border-gray-100 overflow-hidden">
      {/* Header */}
      <div className="flex items-center justify-between px-4 py-3 bg-gray-50 border-b border-gray-100">
        <div className="flex items-center gap-3">
          <a
            href={`/staff/table/${order.tableNumber}`}
            className="text-lg font-bold text-amber-600 hover:underline"
          >
            テーブル {order.tableNumber}
          </a>
          <span className="text-sm text-gray-500">{order.partySize}名</span>
          <span className="text-sm text-gray-400">{timeStr}</span>
        </div>
        <span className={`text-xs font-semibold px-2 py-1 rounded-full ${STATUS_COLORS[status]}`}>
          {STATUS_LABELS[status]}
        </span>
      </div>

      {/* Items */}
      <div className="px-4 py-3 space-y-1">
        {order.items.map((item) => (
          <div key={item.id} className="flex justify-between text-sm">
            <span className="text-gray-700">
              {item.menuItemName} × {item.quantity}
            </span>
            <span className="text-gray-500">
              ¥{(item.price * item.quantity).toLocaleString()}
            </span>
          </div>
        ))}
      </div>

      {/* Footer */}
      <div className="px-4 py-3 border-t border-gray-100">
        <div className="flex items-center justify-between mb-3">
          <span className="text-sm text-gray-500">合計</span>
          <span className="font-bold text-gray-800">¥{order.totalPrice.toLocaleString()}</span>
        </div>
        <div className="flex gap-2 flex-wrap">
          {NEXT_STATUSES.map((s) => (
            <button
              key={s}
              disabled={status === s || loading}
              onClick={() => changeStatus(s)}
              className={`text-xs px-3 py-1.5 rounded-full border font-medium transition-colors
                ${status === s
                  ? "border-gray-200 bg-gray-100 text-gray-400 cursor-not-allowed"
                  : "border-gray-300 bg-white text-gray-600 hover:bg-gray-50 active:bg-gray-100"
                }`}
            >
              {STATUS_LABELS[s]}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}

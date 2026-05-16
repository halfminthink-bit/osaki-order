"use client"

import { useState, useEffect, useCallback } from "react"
import { useRouter } from "next/navigation"

type OrderItem = {
  id: string
  menuItemName: string
  quantity: number
}

type KitchenOrder = {
  id: string
  tableNumber: number
  partySize: number
  status: string
  createdAt: Date
  items: OrderItem[]
}

function ElapsedTimer({ createdAt }: { createdAt: Date }) {
  const [elapsed, setElapsed] = useState(0)

  useEffect(() => {
    const start = new Date(createdAt).getTime()
    const tick = () => setElapsed(Math.floor((Date.now() - start) / 1000))
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [createdAt])

  const m = Math.floor(elapsed / 60)
  const s = elapsed % 60
  const urgent = m >= 10

  return (
    <span className={`text-sm font-mono font-semibold ${urgent ? "text-red-600" : "text-gray-500"}`}>
      {m}:{String(s).padStart(2, "0")}
    </span>
  )
}

export default function KitchenCard({ order }: { order: KitchenOrder }) {
  const router = useRouter()
  const [loading, setLoading] = useState(false)

  const updateStatus = useCallback(async (newStatus: string) => {
    setLoading(true)
    const res = await fetch(`/api/orders/${order.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status: newStatus }),
    })
    if (res.ok) {
      router.refresh()
    }
    setLoading(false)
  }, [order.id, router])

  const isReceived = order.status === "received"
  const isPreparing = order.status === "preparing"

  return (
    <div className={`bg-white rounded-xl shadow border-2 overflow-hidden ${
      isPreparing ? "border-blue-300" : "border-amber-300"
    }`}>
      {/* Header */}
      <div className={`px-4 py-3 flex items-center justify-between ${
        isPreparing ? "bg-blue-50" : "bg-amber-50"
      }`}>
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold text-gray-800">
            T{order.tableNumber}
          </span>
          <span className="text-sm text-gray-500">{order.partySize}名</span>
          <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${
            isPreparing ? "bg-blue-100 text-blue-800" : "bg-amber-100 text-amber-800"
          }`}>
            {isPreparing ? "調理中" : "受付済"}
          </span>
        </div>
        <div className="flex items-center gap-2 text-sm text-gray-400">
          <span>経過</span>
          <ElapsedTimer createdAt={order.createdAt} />
        </div>
      </div>

      {/* Items */}
      <div className="px-4 py-4 space-y-2">
        {order.items.map((item) => (
          <div key={item.id} className="flex items-center gap-2 text-base">
            <span className="font-semibold text-gray-800 text-lg w-6 text-center">
              {item.quantity}
            </span>
            <span className="text-gray-400">×</span>
            <span className="text-gray-700">{item.menuItemName}</span>
          </div>
        ))}
      </div>

      {/* Action */}
      <div className="px-4 py-3 border-t border-gray-100">
        {isReceived && (
          <button
            disabled={loading}
            onClick={() => updateStatus("preparing")}
            className="w-full py-3 bg-amber-500 hover:bg-amber-600 active:bg-amber-700 text-white font-bold text-base rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? "更新中..." : "調理開始"}
          </button>
        )}
        {isPreparing && (
          <button
            disabled={loading}
            onClick={() => updateStatus("served")}
            className="w-full py-3 bg-green-500 hover:bg-green-600 active:bg-green-700 text-white font-bold text-base rounded-lg disabled:opacity-50 transition-colors"
          >
            {loading ? "更新中..." : "調理完了"}
          </button>
        )}
      </div>
    </div>
  )
}

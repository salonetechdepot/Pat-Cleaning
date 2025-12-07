"use client"
import { useState, useEffect } from "react"

export function Countdown({ date }: { date: Date }) {
  const [mounted, setMounted] = useState(false)

  useEffect(() => {
    setMounted(true) // only run on client
  }, [])

  if (!mounted) return null // server renders empty, client renders countdown

  const left = date.getTime() - Date.now()
  if (left < 0) return <span className="text-xs text-green-600 font-semibold">In progress</span>

  const d = Math.floor(left / (1000 * 60 * 60 * 24))
  const h = Math.floor((left / (1000 * 60 * 60)) % 24)
  const m = Math.floor((left / (1000 * 60)) % 60)

  return <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">{d}d {h}h {m}m</span>
}
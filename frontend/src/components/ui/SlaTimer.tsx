/**
 * SLA Timer Component
 * Displays countdown timer that shows time remaining or overdue status
 */

import { useState, useEffect } from 'react'

interface SlaTimerProps {
  createdAt: string
  slaMinutes: number
}

export function SlaTimer({ createdAt, slaMinutes }: SlaTimerProps) {
  const [now, setNow] = useState(Date.now())

  useEffect(() => {
    const interval = setInterval(() => setNow(Date.now()), 30000)
    return () => clearInterval(interval)
  }, [])

  const createdTime = new Date(createdAt).getTime()
  const deadlineTime = createdTime + slaMinutes * 60 * 1000
  const remainingMs = deadlineTime - now
  const remainingMinutes = Math.ceil(remainingMs / 60000)

  if (remainingMinutes > 0) {
    return (
      <span className="text-emerald-600 dark:text-emerald-400">
        {remainingMinutes} min
      </span>
    )
  } else {
    const overdueMinutes = Math.abs(remainingMinutes)
    return (
      <span className="text-red-600 dark:text-red-400 font-medium">
        {overdueMinutes} min overdue
      </span>
    )
  }
}

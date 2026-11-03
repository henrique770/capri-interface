import { useEffect, useState } from 'react'

export interface DemoMetrics {
  cpu: number
  ramUsed: number
  ramTotal: number
  services: { name: string; status: 'up' | 'degraded' | 'down' }[]
}

const drift = (v: number, step: number, min: number, max: number) =>
  Math.min(max, Math.max(min, v + (Math.random() - 0.5) * step))

/** Valores fictícios com leve variação — nada aqui vem de um servidor real. */
export function useDemoMetrics(intervalMs = 1600): DemoMetrics {
  const [m, setM] = useState<DemoMetrics>({
    cpu: 23,
    ramUsed: 11.4,
    ramTotal: 32,
    services: [
      { name: 'jellyfin', status: 'up' },
      { name: 'home-assistant', status: 'up' },
      { name: 'pihole', status: 'up' },
      { name: 'nextcloud', status: 'degraded' },
      { name: 'grafana', status: 'up' },
    ],
  })

  useEffect(() => {
    const id = setInterval(() => {
      setM((prev) => ({ ...prev, cpu: drift(prev.cpu, 9, 4, 92), ramUsed: drift(prev.ramUsed, 0.5, 6, 28) }))
    }, intervalMs)
    return () => clearInterval(id)
  }, [intervalMs])

  return m
}

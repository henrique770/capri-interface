import { motion } from 'motion/react'

interface MeterProps {
  label: string
  value: string
  unit?: string
  detail?: string
  ratio: number
  tone: 'green' | 'blue'
}

const TONE = { green: 'bg-capri-green', blue: 'bg-capri-blue' }

export function Meter({ label, value, unit, detail, ratio, tone }: MeterProps) {
  return (
    <div className="flex flex-col gap-5 rounded-[24px] bg-surface p-6">
      <div className="flex items-center justify-between text-[12px] text-mute">
        <span>{label}</span>
        {detail && <span className="tabular-nums">{detail}</span>}
      </div>
      <div className="flex items-baseline gap-1">
        <span className="text-[clamp(40px,5vw,64px)] leading-none font-light tracking-[-0.04em] tabular-nums">{value}</span>
        {unit && <span className="text-[16px] text-mute">{unit}</span>}
      </div>
      <div className="h-1 overflow-hidden rounded-full bg-paper-2">
        <motion.div
          className={`h-full rounded-full ${TONE[tone]}`}
          initial={{ width: 0 }}
          animate={{ width: `${Math.round(ratio * 100)}%` }}
          transition={{ duration: 1.1, ease: [0.22, 1, 0.36, 1] }}
        />
      </div>
    </div>
  )
}

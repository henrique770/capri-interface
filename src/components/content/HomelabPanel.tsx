import { motion } from 'motion/react'
import { useDemoMetrics } from '@/hooks/useDemoMetrics'
import { EASE_OUT } from '@/features/animation/timing'
import { Meter } from './Meter'

const STATUS = {
  up: { dot: 'bg-capri-green', label: 'ativo' },
  degraded: { dot: 'bg-capri-pink', label: 'instável' },
  down: { dot: 'bg-mute', label: 'parado' },
} as const

const item = {
  hidden: { opacity: 0, y: 16 },
  show: { opacity: 1, y: 0, transition: { duration: 0.55, ease: EASE_OUT } },
}

/** Painel demonstrativo para validar a transição personagem → conteúdo. */
export function HomelabPanel({ rightInset }: { rightInset: number }) {
  const m = useDemoMetrics()

  return (
    <motion.main
      initial="hidden"
      animate="show"
      exit={{ opacity: 0, y: 10, transition: { duration: 0.25 } }}
      variants={{ show: { transition: { staggerChildren: 0.06, delayChildren: 0.35 } } }}
      className="scroll-quiet absolute inset-y-0 left-0 overflow-y-auto pt-20 pb-10 pl-[clamp(16px,3.5vw,44px)]"
      style={{ right: rightInset }}
    >
      <motion.header variants={item} className="flex flex-wrap items-end justify-between gap-4">
        <h1 className="text-[clamp(44px,6vw,84px)] leading-[0.9] font-light tracking-[-0.045em]">Homelab</h1>
        <span className="rounded-full bg-paper-2 px-3 py-1 text-[11px] text-mute">dados demonstrativos</span>
      </motion.header>

      <motion.div variants={item} className="mt-12 grid grid-cols-1 gap-3 md:grid-cols-2">
        <Meter label="CPU" value={m.cpu.toFixed(0)} unit="%" detail="8 núcleos" ratio={m.cpu / 100} tone="green" />
        <Meter
          label="Memória"
          value={m.ramUsed.toFixed(1)}
          unit="GB"
          detail={`de ${m.ramTotal} GB`}
          ratio={m.ramUsed / m.ramTotal}
          tone="blue"
        />
      </motion.div>

      <motion.section variants={item} className="mt-3 rounded-[24px] bg-white p-6">
        <div className="flex items-center justify-between text-[12px] text-mute">
          <span>Serviços</span>
          <span className="tabular-nums">
            {m.services.filter((s) => s.status === 'up').length}/{m.services.length} ativos
          </span>
        </div>
        <ul className="mt-4">
          {m.services.map((s) => (
            <li key={s.name} className="flex items-center gap-3 border-t border-line py-3.5 first:border-t-0">
              <span className={`size-1.5 rounded-full ${STATUS[s.status].dot}`} />
              <span className="flex-1 font-mono text-[13px]">{s.name}</span>
              <span className="text-[12px] text-mute">{STATUS[s.status].label}</span>
            </li>
          ))}
        </ul>
      </motion.section>
    </motion.main>
  )
}

import { motion } from 'motion/react'
import type { ActivationPhase } from '@/features/activation/model'

const LABEL: Record<ActivationPhase, string> = {
  inactive: 'Desativada',
  activating: 'Ativando',
  active: 'Ativa',
  deactivating: 'Desativando',
}

export function StatusIndicator({ phase }: { phase: ActivationPhase }) {
  const lit = phase === 'active' || phase === 'activating'
  const moving = phase === 'activating' || phase === 'deactivating'

  return (
    <div className="flex items-center gap-2 text-[13px] text-mute" aria-live="polite">
      <span className="relative grid size-2 place-items-center">
        <motion.span
          className="size-2 rounded-full"
          animate={{
            backgroundColor: lit ? 'var(--color-capri-green)' : 'var(--color-mute)',
            opacity: moving ? [1, 0.35, 1] : 1,
          }}
          transition={{ backgroundColor: { duration: 0.5 }, opacity: { duration: 0.7, repeat: moving ? Infinity : 0 } }}
        />
      </span>
      <span className="tabular-nums">{LABEL[phase]}</span>
    </div>
  )
}

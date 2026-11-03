import { AnimatePresence, motion } from 'motion/react'
import { isOn, type ActivationPhase } from '@/features/activation/model'
import { EASE_OUT } from '@/features/animation/timing'
import { ActivationToggle } from '@/components/ui/ActivationToggle'
import { Kbd } from '@/components/ui/Kbd'

interface CharacterAsideProps {
  phase: ActivationPhase
  narrow: boolean
  onToggle: () => void
}

/** Texto mínimo ao lado da Capri no modo personagem. Quase vazio, de propósito. */
export function CharacterAside({ phase, narrow, onToggle }: CharacterAsideProps) {
  const on = isOn(phase)
  return (
    <motion.aside
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8, transition: { duration: 0.25 } }}
      transition={{ duration: 0.6, ease: EASE_OUT, delay: 0.25 }}
      className={`absolute flex flex-col justify-end gap-8 ${
        narrow ? 'inset-x-0 bottom-0 px-5 pb-6' : 'right-0 bottom-0 pr-11 pb-11'
      }`}
      style={narrow ? undefined : { width: 'min(34vw, 380px)' }}
    >
      <div>
        <h1 className="text-[clamp(44px,6vw,84px)] leading-[0.9] font-light tracking-[-0.045em]">Capri</h1>
        <div className="mt-4 h-5 overflow-hidden text-[14px] text-mute">
          <AnimatePresence mode="wait" initial={false}>
            <motion.p
              key={on ? 'on' : 'off'}
              initial={{ y: 14, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -14, opacity: 0 }}
              transition={{ duration: 0.35, ease: EASE_OUT }}
            >
              {on ? 'Ouvindo. Pronta quando você estiver.' : 'Em repouso.'}
            </motion.p>
          </AnimatePresence>
        </div>
      </div>

      <div className="flex flex-col items-start gap-4">
        <ActivationToggle phase={phase} onToggle={onToggle} />
        {!narrow && (
          <dl className="flex gap-4 text-[12px] text-mute">
            <div className="flex items-center gap-1.5">
              <Kbd>H</Kbd> homelab
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd>T</Kbd> tópicos
            </div>
            <div className="flex items-center gap-1.5">
              <Kbd>D</Kbd> tema
            </div>
          </dl>
        )}
      </div>
    </motion.aside>
  )
}

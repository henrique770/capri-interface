import { Power } from 'lucide-react'
import { isOn, type ActivationPhase } from '@/features/activation/model'
import { Kbd } from './Kbd'

export function ActivationToggle({ phase, onToggle }: { phase: ActivationPhase; onToggle: () => void }) {
  const on = isOn(phase)
  return (
    <button
      type="button"
      onClick={onToggle}
      className={`no-drag group inline-flex h-10 items-center gap-2.5 rounded-full pr-2 pl-4 text-[13px] transition-colors duration-300 ${
        on ? 'bg-ink text-paper' : 'bg-paper-2 text-ink hover:bg-line'
      }`}
    >
      <Power size={14} strokeWidth={2} className={on ? 'text-capri-green' : 'text-mute'} />
      <span>{on ? 'Desativar' : 'Ativar'}</span>
      <Kbd>espaço</Kbd>
    </button>
  )
}

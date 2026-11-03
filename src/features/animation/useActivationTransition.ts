import { useCallback, useEffect, useRef, useState } from 'react'
import { animate, useMotionValue, type MotionValue } from 'motion/react'
import type { TransitionRun } from '@/components/capri/TransitionOverlay'
import type { ActivationPhase } from '@/features/activation/model'
import { dispatch, getState } from '@/features/activation/store'
import { TRANSITION_CLIPS } from '@/features/transitions/clips'
import { EASE_OUT } from './timing'

export interface ActivationMotion {
  /** 0 = camada desligada visível, 1 = camada ligada visível. */
  reveal: MotionValue<number>
  activeAccent: MotionValue<number>
  inactiveAccent: MotionValue<number>
  /** Transição em tela cheia em andamento (ou null). */
  run: TransitionRun | null
  onCovered: (run: TransitionRun) => void
  onReveal: (run: TransitionRun) => void
  onDone: (run: TransitionRun) => void
}

/**
 * Orquestra a troca desligada ⇄ ligada:
 *  1. o clipe de transição toma a janela inteira, entrando em glitch;
 *  2. com a tela coberta, o estado troca por baixo (e o quadro muda de forma);
 *  3. o clipe sai em glitch e o novo estado aparece, assentando de 1.05 → 1.
 * Cada troca usa o próximo clipe (277 → 275 → 274 → …).
 */
export function useActivationTransition(phase: ActivationPhase): ActivationMotion {
  const reveal = useMotionValue(0)
  const activeAccent = useMotionValue(1)
  const inactiveAccent = useMotionValue(1)
  const [run, setRun] = useState<TransitionRun | null>(null)
  const counter = useRef(0)

  useEffect(() => {
    if (phase !== 'activating' && phase !== 'deactivating') return
    const id = ++counter.current
    setRun({ id, clip: (id - 1) % TRANSITION_CLIPS.length, turningOn: phase === 'activating' })
  }, [phase])

  const onCovered = useCallback(
    (r: TransitionRun) => {
      reveal.set(r.turningOn ? 1 : 0)
      ;(r.turningOn ? activeAccent : inactiveAccent).set(1.05)
    },
    [reveal, activeAccent, inactiveAccent],
  )

  const onReveal = useCallback(
    (r: TransitionRun) => {
      animate(r.turningOn ? activeAccent : inactiveAccent, 1, { duration: 0.9, ease: EASE_OUT })
      if (getState().phase === (r.turningOn ? 'activating' : 'deactivating')) dispatch({ type: 'transitionSettled' })
    },
    [activeAccent, inactiveAccent],
  )

  const onDone = useCallback((r: TransitionRun) => setRun((cur) => (cur?.id === r.id ? null : cur)), [])

  return { reveal, activeAccent, inactiveAccent, run, onCovered, onReveal, onDone }
}

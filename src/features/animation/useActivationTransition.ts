import { useEffect } from 'react'
import { animate, useMotionValue, useTransform, type MotionValue } from 'motion/react'
import type { ActivationPhase } from '@/features/activation/model'
import { dispatch, getState } from '@/features/activation/store'
import { ANTICIPATION_DELAY, WIPE_DURATION, WIPE_EASE, WIPE_SLANT } from './timing'

export interface ActivationMotion {
  /** 0 = desativada, 1 = ativada. Pode ser interrompido no meio. */
  reveal: MotionValue<number>
  activeAccent: MotionValue<number>
  inactiveAccent: MotionValue<number>
  /** clip-path da camada ativa: cortina diagonal guiada por `reveal`. */
  activeClip: MotionValue<string>
  /** Faixa fina na frente da cortina. */
  edgeClip: MotionValue<string>
  edgeOpacity: MotionValue<number>
}

const EDGE = 0.9 // largura da faixa, em % do quadro

function wipeEdge(p: number): [number, number] {
  const top = p * (1 + WIPE_SLANT) * 100
  return [top, top - WIPE_SLANT * 100]
}

/**
 * Orquestra a troca entre os frames desativado/ativado:
 *  1. antecipação curta (a imagem desativada avança levemente);
 *  2. cortina diagonal de baixo-esquerda para cima-direita revelando o frame ativo,
 *     no ângulo das mechas do cabelo, com uma faixa verde neon na frente;
 *  3. o frame ativo assenta (1.06 → 1) enquanto o desativado recua.
 * A desativação percorre o mesmo caminho ao contrário.
 * Nenhum frame intermediário é inventado: só composição de originais.
 */
export function useActivationTransition(phase: ActivationPhase): ActivationMotion {
  const reveal = useMotionValue(0)
  const activeAccent = useMotionValue(1.06)
  const inactiveAccent = useMotionValue(1)

  useEffect(() => {
    if (phase !== 'activating' && phase !== 'deactivating') return

    const turningOn = phase === 'activating'
    const target = turningOn ? 1 : 0
    const remaining = Math.abs(target - reveal.get())
    const fromRest = turningOn && reveal.get() === 0
    const duration = Math.max(0.25, WIPE_DURATION * remaining)
    const delay = fromRest ? ANTICIPATION_DELAY : 0

    if (fromRest) activeAccent.set(1.06)

    const controls = [
      animate(reveal, target, {
        duration,
        delay,
        ease: WIPE_EASE,
        onComplete: () => {
          if (getState().phase === phase) dispatch({ type: 'transitionSettled' })
        },
      }),
      animate(activeAccent, turningOn ? 1 : 1.03, { duration: duration + delay, ease: [0.22, 1, 0.36, 1] }),
      animate(inactiveAccent, turningOn ? [inactiveAccent.get(), 1.02, 1.035] : 1, {
        duration: duration + delay,
        ease: [0.22, 1, 0.36, 1],
      }),
    ]
    return () => controls.forEach((c) => c.stop())
  }, [phase, reveal, activeAccent, inactiveAccent])

  const activeClip = useTransform(reveal, (p) => {
    const [a, b] = wipeEdge(p)
    return `polygon(-10% -10%, ${a}% -10%, ${b}% 110%, -10% 110%)`
  })
  const edgeClip = useTransform(reveal, (p) => {
    const [a, b] = wipeEdge(p)
    return `polygon(${a}% -10%, ${a + EDGE}% -10%, ${b + EDGE}% 110%, ${b}% 110%)`
  })
  const edgeOpacity = useTransform(reveal, [0, 0.03, 0.97, 1], [0, 1, 1, 0])

  return { reveal, activeAccent, inactiveAccent, activeClip, edgeClip, edgeOpacity }
}

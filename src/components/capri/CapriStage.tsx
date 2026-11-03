import { useEffect, useRef, useState } from 'react'
import { motion, type Transition } from 'motion/react'
import { isOn } from '@/features/activation/model'
import { useCapri } from '@/features/activation/store'
import { stageLayout } from '@/features/animation/layout'
import { POSES } from '@/features/animation/poses'
import { LAYOUT_TRANSITION } from '@/features/animation/timing'
import { useActivationTransition } from '@/features/animation/useActivationTransition'
import { useViewportSize } from '@/hooks/useViewportSize'
import { PoseLayer } from './PoseLayer'

const INSTANT: Transition = { duration: 0 }

/**
 * A Capri: frames originais empilhados dentro de um quadro arredondado.
 * - desligada: still com a região branca (quadro retrato);
 * - ligada: S02E04 (255) — os olhos sobem para dentro do quadro (quadro 16:9);
 * - na lateral: após a entrada, corta para o loop do close dos olhos (65).
 * A ativação é uma cortina entre as camadas enquanto o quadro muda de forma.
 */
export function CapriStage() {
  const vp = useViewportSize()
  const phase = useCapri((s) => s.phase)
  const view = useCapri((s) => s.view)
  const motionState = useActivationTransition(phase)
  const on = isOn(phase)
  const docked = view === 'homelab'
  const { frame, radius, framing } = stageLayout(view, vp, on)

  // Mudança de modo ou de estado anima o quadro; redimensionar acompanha instantaneamente.
  const layoutKey = `${view}:${on}`
  const lastKey = useRef(layoutKey)
  const keyChangedAt = useRef(0)
  if (lastKey.current !== layoutKey) {
    lastKey.current = layoutKey
    keyChangedAt.current = performance.now()
  }
  const transition = performance.now() - keyChangedAt.current < 1000 ? LAYOUT_TRANSITION : INSTANT

  // Troca de tomada como um corte: no fim ao recolher, no início ao expandir.
  // Fora de uma mudança de layout (ex.: fim da entrada → loop), a troca é um corte seco.
  const cut: Transition =
    transition === INSTANT ? INSTANT : { duration: 0.14, ease: 'linear', delay: docked ? 0.6 : 0.04 }

  // A entrada (255) toca uma vez por ativação; depois segura o último desenho.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!on) setEntered(false)
  }, [on])
  const showLoop = docked && entered

  return (
    <motion.div
      aria-label={on ? 'Capri ativada' : 'Capri desativada'}
      role="img"
      className="absolute overflow-hidden bg-ink"
      initial={false}
      animate={{
        left: frame.x,
        top: frame.y,
        width: frame.w,
        height: frame.h,
        borderTopLeftRadius: radius[0],
        borderTopRightRadius: radius[1],
        borderBottomRightRadius: radius[2],
        borderBottomLeftRadius: radius[3],
      }}
      transition={transition}
    >
      <PoseLayer
        pose={POSES.inactive}
        frame={frame}
        framing={framing}
        transition={transition}
        accent={motionState.inactiveAccent}
        live={phase === 'inactive'}
      />
      {/* Camada "ligada": revelada pela cortina da ativação. */}
      <motion.div className="absolute inset-0" style={{ clipPath: motionState.activeClip }}>
        <PoseLayer
          pose={POSES.eyesPop}
          frame={frame}
          framing={framing}
          transition={transition}
          accent={motionState.activeAccent}
          live={on && !entered}
          visible={!showLoop}
          fade={cut}
          onSequenceEnd={() => setEntered(true)}
        />
        <PoseLayer
          pose={POSES.eyes}
          frame={frame}
          framing={framing}
          transition={transition}
          accent={motionState.activeAccent}
          live={phase === 'active' && showLoop}
          visible={showLoop}
          fade={cut}
        />
      </motion.div>
      <motion.div
        className={`pointer-events-none absolute inset-0 ${phase === 'deactivating' ? 'bg-paper' : 'bg-capri-green'}`}
        style={{ clipPath: motionState.edgeClip, opacity: motionState.edgeOpacity }}
      />
    </motion.div>
  )
}

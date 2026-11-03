import { useEffect, useRef, useState } from 'react'
import { motion, useTransform, type Transition } from 'motion/react'
import { isOn } from '@/features/activation/model'
import { useCapri } from '@/features/activation/store'
import { stageLayout } from '@/features/animation/layout'
import { POSES } from '@/features/animation/poses'
import { LAYOUT_TRANSITION } from '@/features/animation/timing'
import { useActivationTransition } from '@/features/animation/useActivationTransition'
import { stopDemoSpeech } from '@/features/speech/demo'
import { FACE_COLOR } from '@/features/speech/mouth'
import { useSpeaking } from '@/features/speech/store'
import { useViewportSize } from '@/hooks/useViewportSize'
import { GlitchBurst } from './GlitchBurst'
import { MouthLayer } from './MouthLayer'
import { PoseLayer } from './PoseLayer'
import { TransitionOverlay } from './TransitionOverlay'

const INSTANT: Transition = { duration: 0 }

/**
 * A Capri: frames originais empilhados dentro de um quadro arredondado.
 * - desligada: still com a região branca (quadro retrato);
 * - ligada: S02E04 (255) — os olhos sobem para dentro do quadro (quadro 16:9);
 * - após a entrada: corta para o loop do close dos olhos (65), no quadro grande e na lateral;
 * - ligada, o quadro se estende abaixo do clipe na cor do rosto, onde fica a boca.
 * A troca acontece por baixo de um clipe de transição em tela cheia com glitch.
 */
export function CapriStage() {
  const vp = useViewportSize()
  const phase = useCapri((s) => s.phase)
  const view = useCapri((s) => s.view)
  const motionState = useActivationTransition(phase)
  const on = isOn(phase)
  const docked = view === 'homelab'
  const { frame, radius, framing, imageH } = stageLayout(view, vp, on)
  const imageFrame = { ...frame, h: imageH }

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

  // A entrada (255) toca uma vez por ativação; depois corta para o loop dos olhos (65),
  // tanto na tela inicial quanto na lateral — a Capri ligada nunca fica estática.
  const [entered, setEntered] = useState(false)
  useEffect(() => {
    if (!on) {
      setEntered(false)
      setBurst(null)
    }
  }, [on])
  // Desligar corta a fala na hora.
  useEffect(() => {
    if (phase !== 'active') stopDemoSpeech()
  }, [phase])
  const showLoop = entered
  // Fim da entrada dos olhos → um glitch curto, e a boca surge no meio dele.
  const [burst, setBurst] = useState<number | null>(null)
  const finishEntrance = () => {
    setEntered(true)
    setBurst(performance.now())
  }
  // Se ela começar a falar durante a entrada, a entrada termina ali: a boca precisa aparecer.
  const speaking = useSpeaking()
  useEffect(() => {
    if (speaking && phase === 'active' && !entered) finishEntrance()
  }, [speaking, phase, entered])
  // O still desligado sai de cena quando a camada ligada cobre o quadro — nada vaza pelas bordas.
  const inactiveOpacity = useTransform(motionState.reveal, (v) => 1 - v)

  return (
    <>
      <motion.div
        aria-label={on ? 'Capri ativada' : 'Capri desativada'}
        role="img"
        className="absolute overflow-hidden bg-void"
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
        <motion.div className="absolute inset-0" style={{ opacity: inactiveOpacity }}>
          <PoseLayer
            pose={POSES.inactive}
            frame={frame}
            framing={framing}
            transition={transition}
            accent={motionState.inactiveAccent}
            live={phase === 'inactive'}
          />
        </motion.div>
        {/* Camada "ligada": trocada enquanto o clipe de transição cobre a janela.
            O fundo na cor do rosto continua o clipe para baixo, até a boca. */}
        <motion.div className="absolute inset-0" style={{ opacity: motionState.reveal, backgroundColor: FACE_COLOR }}>
          <motion.div
            className="absolute inset-x-0 top-0 overflow-hidden"
            initial={false}
            animate={{ height: imageFrame.h }}
            transition={transition}
          >
            <PoseLayer
              pose={POSES.eyesPop}
              frame={imageFrame}
              framing={framing}
              transition={transition}
              accent={motionState.activeAccent}
              live={phase === 'active' && !entered}
              visible={!showLoop}
              fade={cut}
              onSequenceEnd={finishEntrance}
            />
            <PoseLayer
              pose={POSES.eyes}
              frame={imageFrame}
              framing={framing}
              transition={transition}
              accent={motionState.activeAccent}
              live={phase === 'active' && showLoop}
              visible={showLoop}
              fade={cut}
            />
            <GlitchBurst burst={burst} pose={POSES.eyes} imageFrame={imageFrame} framing={framing} />
          </motion.div>
          <MouthLayer
            pose={POSES.eyes}
            imageFrame={imageFrame}
            framing={framing}
            transition={transition}
            visible={phase === 'active' && showLoop}
            glitchIn={burst}
          />
        </motion.div>
      </motion.div>
      <TransitionOverlay
        run={motionState.run}
        onCovered={motionState.onCovered}
        onReveal={motionState.onReveal}
        onDone={motionState.onDone}
      />
    </>
  )
}

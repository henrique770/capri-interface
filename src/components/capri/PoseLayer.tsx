import { motion, type MotionValue, type Transition } from 'motion/react'
import { cameraFor, type Framing, type Rect } from '@/features/animation/camera'
import type { Pose } from '@/features/animation/poses'
import { useFrameSequence } from '@/features/animation/useFrameSequence'

interface PoseLayerProps {
  pose: Pose
  frame: Rect
  framing: Framing
  transition: Transition
  accent: MotionValue<number>
  /** Se a pose está visível o bastante para tocar sua animação ociosa. */
  live: boolean
  /** Opacidade alvo — usada para trocar de tomada (retrato ↔ close dos olhos). */
  visible?: boolean
  /** Transição da troca de tomada (um corte curto, não um fade longo). */
  fade?: Transition
  /** Chamado quando uma animação `once` termina. */
  onSequenceEnd?: () => void
}

/**
 * Uma camada = um frame original da Capri, desenhado com escala uniforme
 * (sem distorção) e posicionado pela câmera alinhada aos olhos.
 */
export function PoseLayer({ pose, frame, framing, transition, accent, live, visible = true, fade, onSequenceEnd }: PoseLayerProps) {
  const camera = cameraFor(pose, frame, framing)
  const sequenceFrame = useFrameSequence(pose.idle, live, onSequenceEnd)

  return (
    <motion.div className="absolute inset-0" initial={false} animate={{ opacity: visible ? 1 : 0 }} transition={fade ?? transition}>
      <motion.div className="absolute inset-0" style={{ scale: accent, transformOrigin: '50% 45%' }}>
        <motion.div
          className="absolute top-0 left-0 origin-top-left will-change-transform"
          style={{ width: pose.width, height: pose.height }}
          initial={false}
          animate={{ x: camera.x, y: camera.y, scale: camera.scale }}
          transition={transition}
        >
          <div className="capri-breathe relative h-full w-full">
            <img src={pose.src} alt="" draggable={false} className="block h-full w-full" />
            {sequenceFrame && (
              <img src={sequenceFrame} alt="" draggable={false} className="absolute inset-0 h-full w-full" />
            )}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  )
}

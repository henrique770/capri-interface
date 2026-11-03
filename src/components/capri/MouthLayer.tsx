import { motion, type Transition } from 'motion/react'
import { cameraFor, eyeSpace, type Framing, type Rect } from '@/features/animation/camera'
import type { Pose } from '@/features/animation/poses'
import { MOUTH_SHAPES } from '@/features/speech/mouth'
import { useMouthIndex } from '@/features/speech/store'

interface MouthLayerProps {
  /** Pose visível — a boca se ancora nos olhos dela. */
  pose: Pose
  /** Área da imagem dentro do quadro (o clipe 16:9, sem a faixa da boca). */
  imageFrame: Rect
  framing: Framing
  transition: Transition
  visible: boolean
  /** Muda quando a boca deve surgir com glitch (fim da entrada dos olhos). */
  glitchIn?: number | null
}

/**
 * A boca da Capri: desenhos originais recortados, trocados como quadros de
 * animação (sem interpolar forma). Todas as formas ficam montadas e só a atual
 * aparece, para a troca ser instantânea. Acompanha a respiração da imagem.
 */
export function MouthLayer({ pose, imageFrame, framing, transition, visible, glitchIn }: MouthLayerProps) {
  const index = useMouthIndex()
  const camera = cameraFor(pose, imageFrame, framing)
  const { midX, midY, d, angle } = eyeSpace(pose)
  const unit = d * camera.scale

  return (
    <motion.div
      className="pointer-events-none absolute inset-x-0 top-0"
      style={{ height: imageFrame.h }}
      initial={false}
      animate={{ opacity: visible ? 1 : 0 }}
      transition={{ duration: 0 }}
    >
      <div className="capri-breathe absolute inset-0 overflow-visible">
        <div key={glitchIn ?? 'still'} className={`absolute inset-0 ${glitchIn ? 'capri-mouth-glitch-in' : ''}`}>
        {MOUTH_SHAPES.map((shape, i) => {
          const w = shape.w * unit
          const cx = camera.x + midX * camera.scale + shape.cx * unit
          const cy = camera.y + midY * camera.scale + shape.cy * unit
          return (
            <motion.img
              key={shape.src}
              src={shape.src}
              alt=""
              draggable={false}
              className="absolute top-0 left-0 max-w-none"
              style={{
                opacity: i === index ? 1 : 0,
                rotate: angle,
                x: '-50%',
                y: '-50%',
                // A linha fechada é fina demais em quadros pequenos; um halo mínimo a mantém legível.
                filter: i === 0 ? 'drop-shadow(0 0 0.5px rgb(244 242 247))' : undefined,
              }}
              initial={false}
              animate={{ left: cx, top: cy, width: w }}
              transition={transition}
            />
          )
        })}
        </div>
      </div>
    </motion.div>
  )
}

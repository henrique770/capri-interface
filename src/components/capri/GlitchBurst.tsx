import { useEffect, useState } from 'react'
import { cameraFor, type Framing, type Rect } from '@/features/animation/camera'
import type { Pose } from '@/features/animation/poses'

/** Duração do surto e cadência dos "quadros" do glitch (como o overlay de transição). */
export const BURST_MS = 420
const FPS = 24

interface Band {
  top: number
  height: number
  dx: number
}

interface Frame {
  bands: Band[]
  split: number
}

function randomFrame(t: number): Frame {
  // Forte no começo, some no fim.
  const k = 1 - t
  const count = 2 + Math.floor(Math.random() * 5 * k + 1)
  const bands: Band[] = []
  for (let i = 0; i < count; i++) {
    const height = 0.02 + Math.random() * 0.14
    bands.push({ top: Math.random() * (1 - height), height, dx: (Math.random() - 0.5) * 0.12 * k })
  }
  return { bands, split: (Math.random() - 0.5) * 0.03 * k }
}

interface GlitchBurstProps {
  /** Muda a cada surto; null = nada. */
  burst: number | null
  /** Pose sob o glitch — suas faixas são deslocadas como rasgos de sinal. */
  pose: Pose
  imageFrame: Rect
  framing: Framing
}

/**
 * Glitch curto sobre o quadro, feito com o próprio frame da Capri: faixas
 * horizontais deslocadas + cópias em rosa e azul (separação RGB), trocadas a
 * 24 qps. Marca o fim da entrada dos olhos e a chegada da boca.
 */
export function GlitchBurst({ burst, pose, imageFrame, framing }: GlitchBurstProps) {
  const [frame, setFrame] = useState<Frame | null>(null)

  useEffect(() => {
    if (burst === null) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return
    const t0 = performance.now()
    let raf = 0
    let lastStep = -1
    const tick = (now: number) => {
      const t = (now - t0) / BURST_MS
      if (t >= 1) return setFrame(null)
      const step = Math.floor(((now - t0) / 1000) * FPS)
      if (step !== lastStep) {
        lastStep = step
        setFrame(randomFrame(t))
      }
      raf = requestAnimationFrame(tick)
    }
    raf = requestAnimationFrame(tick)
    return () => {
      cancelAnimationFrame(raf)
      setFrame(null)
    }
  }, [burst])

  if (!frame) return null
  const camera = cameraFor(pose, imageFrame, framing)
  const { w, h } = imageFrame
  const image = (dx: number, extra?: React.CSSProperties) => (
    <img
      src={pose.src}
      alt=""
      draggable={false}
      className="absolute top-0 left-0 max-w-none origin-top-left"
      style={{
        width: pose.width,
        height: pose.height,
        transform: `translate(${camera.x + dx}px, ${camera.y}px) scale(${camera.scale})`,
        ...extra,
      }}
    />
  )

  return (
    <div className="pointer-events-none absolute inset-0 overflow-hidden">
      <ChannelFilters />
      {/* Separação RGB de verdade: canais isolados somados (screen) sobre preto.
          Sem deslocamento, a soma é exatamente o frame original. */}
      <div className="absolute inset-0 bg-black" style={{ isolation: 'isolate' }}>
        {image(frame.split * w, { filter: 'url(#capri-ch-r)', mixBlendMode: 'screen' })}
        {image(0, { filter: 'url(#capri-ch-g)', mixBlendMode: 'screen' })}
        {image(-frame.split * w, { filter: 'url(#capri-ch-b)', mixBlendMode: 'screen' })}
      </div>
      {/* Rasgos: faixas do frame deslocadas na horizontal. */}
      {frame.bands.map((b, i) => (
        <div key={i} className="absolute inset-x-0 overflow-hidden" style={{ top: b.top * h, height: b.height * h }}>
          <div className="absolute inset-x-0" style={{ top: -b.top * h, height: h }}>
            {image(b.dx * w)}
          </div>
        </div>
      ))}
    </div>
  )
}

const CHANNELS = {
  r: '1 0 0 0 0  0 0 0 0 0  0 0 0 0 0  0 0 0 1 0',
  g: '0 0 0 0 0  0 1 0 0 0  0 0 0 0 0  0 0 0 1 0',
  b: '0 0 0 0 0  0 0 0 0 0  0 0 1 0 0  0 0 0 1 0',
}

function ChannelFilters() {
  return (
    <svg width="0" height="0" className="absolute" aria-hidden>
      {Object.entries(CHANNELS).map(([c, values]) => (
        <filter key={c} id={`capri-ch-${c}`} colorInterpolationFilters="sRGB">
          <feColorMatrix type="matrix" values={values} />
        </filter>
      ))}
    </svg>
  )
}

import { useEffect, useRef } from 'react'
import { TRANSITION_CLIPS } from '@/features/transitions/clips'
import { GlitchRenderer } from '@/features/transitions/glitchRenderer'
import { envelope, GLITCH_OUT_MS, GLITCH_IN_MS, MAX_TRANSITION_MS } from '@/features/transitions/timeline'

export interface TransitionRun {
  id: number
  clip: number
  turningOn: boolean
}

interface TransitionOverlayProps {
  run: TransitionRun | null
  /** A tela está totalmente coberta — momento de trocar o estado por baixo. */
  onCovered: (run: TransitionRun) => void
  /** A saída começou — o novo estado passa a aparecer. */
  onReveal: (run: TransitionRun) => void
  onDone: (run: TransitionRun) => void
}

/** Clipe de transição em tela cheia, sobre toda a janela, com entrada/saída em glitch. */
export function TransitionOverlay({ run, onCovered, onReveal, onDone }: TransitionOverlayProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const videoRefs = useRef<(HTMLVideoElement | null)[]>([])
  const rendererRef = useRef<GlitchRenderer | null>(null)
  const callbacks = useRef({ onCovered, onReveal, onDone })
  callbacks.current = { onCovered, onReveal, onDone }

  useEffect(() => {
    try {
      rendererRef.current = new GlitchRenderer(canvasRef.current!)
    } catch (err) {
      console.warn('[capri] transição sem WebGL:', err)
    }
    return () => rendererRef.current?.dispose()
  }, [])

  useEffect(() => {
    if (!run) return
    const video = videoRefs.current[run.clip]
    const renderer = rendererRef.current
    let frame = 0
    let cancelled = false
    let covered = false
    let revealed = false

    const finish = () => {
      if (!covered) callbacks.current.onCovered(run)
      if (!revealed) callbacks.current.onReveal(run)
      callbacks.current.onDone(run)
    }

    if (!video || !renderer) {
      finish()
      return
    }

    video.currentTime = 0
    video
      .play()
      .then(() => {
        if (cancelled) return
        const start = performance.now()
        const total = Math.min(MAX_TRANSITION_MS, (video.duration || 2) * 1000)
        const loop = () => {
          const t = performance.now() - start
          renderer.render(video, envelope(t, total))
          if (!covered && t >= GLITCH_IN_MS) {
            covered = true
            callbacks.current.onCovered(run)
          }
          if (!revealed && t >= total - GLITCH_OUT_MS) {
            revealed = true
            callbacks.current.onReveal(run)
          }
          if (t >= total) {
            renderer.clear()
            video.pause()
            callbacks.current.onDone(run)
            return
          }
          frame = requestAnimationFrame(loop)
        }
        loop()
      })
      .catch((err) => {
        console.warn('[capri] não foi possível tocar a transição:', err)
        if (!cancelled) finish()
      })

    return () => {
      cancelled = true
      cancelAnimationFrame(frame)
      video.pause()
      renderer.clear()
    }
  }, [run])

  return (
    <>
      <canvas ref={canvasRef} className="pointer-events-none fixed inset-0 z-50 h-full w-full" aria-hidden />
      {TRANSITION_CLIPS.map((src, i) => (
        <video
          key={src}
          ref={(el) => {
            videoRefs.current[i] = el
          }}
          src={src}
          muted
          playsInline
          preload="auto"
          className="pointer-events-none fixed top-0 left-0 size-px opacity-0"
        />
      ))}
    </>
  )
}

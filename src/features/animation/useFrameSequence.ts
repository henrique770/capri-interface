import { useEffect, useMemo, useRef, useState } from 'react'
import { getSequence, type IdleAnimation } from './sequences'

/**
 * Toca a animação ociosa de uma pose enquanto `playing`.
 * Retorna o frame atual, ou null quando a pose deve mostrar o still original.
 */
export function useFrameSequence(idle: IdleAnimation | undefined, playing: boolean, onEnd?: () => void): string | null {
  const frames = useMemo(() => (idle ? getSequence(idle.sequence) : []), [idle])
  const [index, setIndex] = useState(-1)
  const onEndRef = useRef(onEnd)
  onEndRef.current = onEnd

  useEffect(() => {
    frames.forEach((src) => {
      new Image().src = src
    })
  }, [frames])

  useEffect(() => {
    if (!idle || !playing || frames.length === 0) return
    const stop =
      idle.mode === 'pingpong'
        ? runPingpong(frames.length, idle.durations, setIndex)
        : idle.mode === 'once'
          ? runOnce(frames.length, idle.durations, setIndex, () => onEndRef.current?.())
          : runInterval(frames.length, idle, setIndex)
    return () => {
      stop()
      setIndex(-1)
    }
  }, [idle, frames, playing])

  return index >= 0 ? frames[index] : null
}

/** 0 → n-1 → 0 → …, cada desenho pelo tempo original. Sem cortes na volta. */
function runPingpong(count: number, durations: number[], set: (i: number) => void) {
  let i = 0
  let step = 1
  let timeout: ReturnType<typeof setTimeout>
  const tick = () => {
    set(i)
    timeout = setTimeout(() => {
      if (i + step < 0 || i + step >= count) step = -step
      i += step
      tick()
    }, durations[i] ?? 125)
  }
  tick()
  return () => clearTimeout(timeout)
}

/** 0 → n-1 uma vez, segurando o último desenho; avisa ao terminar. */
function runOnce(count: number, durations: number[], set: (i: number) => void, done: () => void) {
  let i = 0
  let timeout: ReturnType<typeof setTimeout>
  const tick = () => {
    set(i)
    timeout = setTimeout(() => {
      if (i + 1 >= count) return done()
      i++
      tick()
    }, durations[i] ?? 125)
  }
  tick()
  return () => clearTimeout(timeout)
}

/** Toca a sequência inteira em intervalos aleatórios e volta ao still. */
function runInterval(
  count: number,
  { fps = 24, gap = [2.8, 6.5] }: Extract<IdleAnimation, { mode: 'interval' }>,
  set: (i: number) => void,
) {
  let timeout: ReturnType<typeof setTimeout>
  let interval: ReturnType<typeof setInterval>
  const schedule = () => {
    timeout = setTimeout(play, (gap[0] + Math.random() * (gap[1] - gap[0])) * 1000)
  }
  const play = () => {
    let i = 0
    interval = setInterval(() => {
      if (i >= count) {
        clearInterval(interval)
        set(-1)
        schedule()
        return
      }
      set(i++)
    }, 1000 / fps)
  }
  schedule()
  return () => {
    clearTimeout(timeout)
    clearInterval(interval)
  }
}

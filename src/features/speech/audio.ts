import { setSpeaking, setSpeechLevel } from './store'

/**
 * Liga um elemento de áudio (ex.: o retorno do text-to-speech) à boca da Capri.
 * Mede a energia (RMS) da voz a cada quadro e a converte em nível 0–1.
 * Retorna uma função que desliga a análise.
 */
export function attachSpeechAudio(audio: HTMLMediaElement): () => void {
  const ctx = new AudioContext()
  const source = ctx.createMediaElementSource(audio)
  const analyser = ctx.createAnalyser()
  analyser.fftSize = 1024
  source.connect(analyser)
  analyser.connect(ctx.destination)

  const buffer = new Float32Array(analyser.fftSize)
  let raf = 0
  let smooth = 0

  const tick = () => {
    analyser.getFloatTimeDomainData(buffer)
    let sum = 0
    for (const v of buffer) sum += v * v
    const rms = Math.sqrt(sum / buffer.length)
    // Ganho empírico para voz falada; ataque rápido, soltura mais lenta.
    const target = Math.min(1, rms * 5)
    smooth += (target - smooth) * (target > smooth ? 0.6 : 0.25)
    setSpeechLevel(smooth)
    raf = requestAnimationFrame(tick)
  }

  const onPlay = () => {
    void ctx.resume()
    setSpeaking(true)
    cancelAnimationFrame(raf)
    raf = requestAnimationFrame(tick)
  }
  const onStop = () => {
    cancelAnimationFrame(raf)
    setSpeaking(false)
  }

  audio.addEventListener('play', onPlay)
  audio.addEventListener('pause', onStop)
  audio.addEventListener('ended', onStop)
  if (!audio.paused) onPlay()

  return () => {
    onStop()
    audio.removeEventListener('play', onPlay)
    audio.removeEventListener('pause', onStop)
    audio.removeEventListener('ended', onStop)
    source.disconnect()
    analyser.disconnect()
    void ctx.close()
  }
}

/** Envelope temporal do overlay: entrada em blocos, vídeo limpo, saída em blocos. */

/** Duração da entrada em glitch (o vídeo toma a tela). */
export const GLITCH_IN_MS = 240
/** Duração da saída em glitch (o novo estado aparece pelos buracos). */
export const GLITCH_OUT_MS = 320
/** Teto da transição — os clipes têm 1,75–2 s; não deixamos a troca arrastar. */
export const MAX_TRANSITION_MS = 1700
/** O glitch muda em passos, como quadros de animação (24 por segundo). */
export const GLITCH_FPS = 24

const hash = (n: number) => {
  const x = Math.sin(n * 127.1) * 43758.5453
  return x - Math.floor(x)
}
const quantize = (v: number, steps: number) => Math.round(v * steps) / steps
const easeOut = (t: number) => 1 - (1 - t) ** 3

export function envelope(t: number, total: number) {
  const step = Math.floor((t / 1000) * GLITCH_FPS)
  const outStart = total - GLITCH_OUT_MS

  let cover = 1
  if (t < GLITCH_IN_MS) cover = quantize(easeOut(t / GLITCH_IN_MS), 6)
  else if (t > outStart) cover = quantize(1 - easeOut((t - outStart) / GLITCH_OUT_MS), 7)

  // Forte nas bordas, quase limpo no meio, com picos curtos ocasionais.
  const edge = Math.max(1 - t / GLITCH_IN_MS, (t - outStart) / GLITCH_OUT_MS, 0)
  const spike = hash(Math.floor(t / 110)) > 0.86 ? 0.45 : 0
  const glitch = Math.min(1, Math.max(edge * 1.1, 0.05, spike))

  return { cover: Math.max(0, Math.min(1, cover)), glitch, step }
}

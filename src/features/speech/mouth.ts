import closed from '@/assets/capri/mouth/closed.png'
import mid from '@/assets/capri/mouth/mid.png'
import open from '@/assets/capri/mouth/open.png'
import small from '@/assets/capri/mouth/small.png'
import wide from '@/assets/capri/mouth/wide.png'

/**
 * Formas da boca, recortadas dos desenhos originais (scripts/mouth) e ordenadas
 * da fechada à mais aberta. A geometria está em unidades da distância entre os
 * olhos (d), relativa ao ponto médio entre eles — a mesma âncora das poses —,
 * então a boca fica na proporção do original em qualquer enquadramento.
 *
 *  closed  captura enviada (linha em zigue-zague), nivelada pela linha dos olhos
 *  small…wide  evil-capri.mp4, frames 60, 66, 72, 84 (a boca abrindo)
 */
export interface MouthShape {
  src: string
  /** Centro do desenho em relação ao ponto médio dos olhos, em d. */
  cx: number
  cy: number
  /** Largura do desenho, em d (a altura segue a proporção do PNG). */
  w: number
}

export const MOUTH_SHAPES: MouthShape[] = [
  { src: closed, cx: -0.03, cy: 0.587, w: 0.641 },
  { src: small, cx: 0.051, cy: 0.596, w: 0.618 },
  { src: mid, cx: 0.042, cy: 0.611, w: 0.71 },
  { src: open, cx: 0.033, cy: 0.615, w: 0.737 },
  { src: wide, cx: 0.036, cy: 0.616, w: 0.751 },
]

/** Cor do rosto abaixo do painel verde — amostrada do close dos olhos (S02E04). */
export const FACE_COLOR = '#050215'

/**
 * Nível de voz (0–1) → forma da boca. Limiares com histerese simples para a
 * boca não tremer entre duas formas vizinhas.
 */
const THRESHOLDS = [0.08, 0.3, 0.52, 0.74]

export function mouthIndexFor(level: number, previous: number): number {
  let next = 0
  for (const t of THRESHOLDS) if (level >= t) next++
  // Fechar exige um pouco menos de voz do que abrir.
  if (next < previous && level >= (THRESHOLDS[next] ?? 1) - 0.05) return previous
  return next
}

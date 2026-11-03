import type { Pose } from './poses'

export interface Rect {
  x: number
  y: number
  w: number
  h: number
}

export interface CameraTransform {
  x: number
  y: number
  scale: number
}

export type Framing = 'portrait' | 'eyes'

/**
 * Meia-largura / meia-altura da área de foco, em múltiplos da distância
 * entre os olhos. Usar a mesma unidade em todas as poses é o que as alinha.
 */
const FRAMING: Record<Framing, { halfW: number; halfH: number; biasY: number }> = {
  portrait: { halfW: 1.3, halfH: 1.0, biasY: 0.12 },
  eyes: { halfW: 1.12, halfH: 0.42, biasY: 0 },
}

/** Ponto médio entre os olhos, distância (d) e inclinação da linha dos olhos, em px da imagem. */
export function eyeSpace(pose: Pose) {
  const { width: W, height: H, eyes } = pose
  const dx = (eyes.right.x - eyes.left.x) * W
  const dy = (eyes.right.y - eyes.left.y) * H
  return {
    midX: ((eyes.left.x + eyes.right.x) / 2) * W,
    midY: ((eyes.left.y + eyes.right.y) / 2) * H,
    d: Math.hypot(dx, dy),
    angle: (Math.atan2(dy, dx) * 180) / Math.PI,
  }
}

const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

/**
 * Calcula onde desenhar a imagem original (sem distorção — escala uniforme)
 * para que a região dos olhos ocupe o quadro `frame`, sempre cobrindo-o.
 * O resultado é relativo ao canto superior esquerdo do quadro.
 */
export function cameraFor(pose: Pose, frame: Pick<Rect, 'w' | 'h'>, framing: Framing): CameraTransform {
  const { width: W, height: H, eyes } = pose
  const { halfW, halfH, biasY } = FRAMING[framing]

  const midX = ((eyes.left.x + eyes.right.x) / 2) * W
  const midY = ((eyes.left.y + eyes.right.y) / 2) * H
  const d = Math.hypot((eyes.right.x - eyes.left.x) * W, (eyes.right.y - eyes.left.y) * H)

  const focusW = 2 * halfW * d
  const focusH = 2 * halfH * d
  const scale = Math.max(Math.min(frame.w / focusW, frame.h / focusH), frame.w / W, frame.h / H)

  // Olhos centralizados (levemente acima do centro no retrato).
  const x = frame.w / 2 - midX * scale
  const y = frame.h / 2 - (midY + biasY * d) * scale

  return {
    x: clamp(x, frame.w - W * scale, 0),
    y: clamp(y, frame.h - H * scale, 0),
    scale,
  }
}

import inactiveSrc from '@/assets/capri/capri-inactive.png'
import { getSequence, type IdleAnimation } from './sequences'

export interface Point {
  x: number
  y: number
}

/**
 * Uma pose é um frame original da Capri + metadados medidos à mão.
 * `eyes` são os centros dos anéis oculares, normalizados (0–1) sobre a imagem.
 * Eles servem de âncora: todas as poses são enquadradas pelos olhos, para que
 * a troca entre frames de tomadas diferentes mantenha o olhar no mesmo lugar.
 */
export interface Pose {
  id: PoseId
  src: string
  width: number
  height: number
  eyes: { left: Point; right: Point }
  idle?: IdleAnimation
}

export type PoseId = 'inactive' | 'eyes' | 'eyesPop'

const EYES_SEQUENCE = 'eyes-s02e04'
const EYES_POP_SEQUENCE = 'eyes-pop-s02e04'

/**
 * Duração (ms) de cada desenho do close dos olhos — S02E04, 0s → 17,4s —
 * medida a partir das trocas de desenho no clipe original (23,976 fps).
 * Termina com os olhos fechando; no vai-e-volta isso vira a piscada.
 */
const EYES_DURATIONS = [
  2961, 83, 42, 42, 125, 1543, 125, 125, 125, 3504, 83, 83, 83, 83, 584, 167, 167, 125, 125, 125, 2628, 167, 167,
  167, 1877, 83, 83, 83, 1877,
]

export const POSES: Record<PoseId, Pose> = {
  inactive: {
    id: 'inactive',
    src: inactiveSrc,
    width: 868,
    height: 686,
    eyes: { left: { x: 0.27, y: 0.455 }, right: { x: 0.65, y: 0.526 } },
    idle: { sequence: 'inactive-idle', mode: 'interval' },
  },
  /** Close dos olhos (painel verde) — loop do recorte lateral com a Capri ativa. */
  eyes: {
    id: 'eyes',
    src: getSequence(EYES_SEQUENCE)[0],
    width: 1280,
    height: 720,
    eyes: { left: { x: 0.244, y: 0.529 }, right: { x: 0.775, y: 0.507 } },
    idle: { sequence: EYES_SEQUENCE, mode: 'pingpong', durations: EYES_DURATIONS },
  },
  /**
   * Estado ligado — S02E04 (255): os olhos sobem para dentro do quadro com um
   * pequeno quique, nos tempos originais, e seguram o último desenho (o still).
   * Na lateral, depois da entrada, corta para o loop `eyes`.
   */
  eyesPop: {
    id: 'eyesPop',
    src: getSequence(EYES_POP_SEQUENCE).at(-1)!,
    width: 1280,
    height: 720,
    eyes: { left: { x: 0.19, y: 0.625 }, right: { x: 0.76, y: 0.625 } },
    idle: { sequence: EYES_POP_SEQUENCE, mode: 'once', durations: [1001, 125, 125, 1100] },
  },
}

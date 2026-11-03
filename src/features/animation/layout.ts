import type { View } from '@/features/activation/model'
import type { Size } from '@/hooks/useViewportSize'
import type { Framing, Rect } from './camera'

export interface StageLayout {
  frame: Rect
  /** Raios: superior-esquerdo, superior-direito, inferior-direito, inferior-esquerdo. */
  radius: [number, number, number, number]
  framing: Framing
}

export const HEADER_HEIGHT = 56
const clamp = (v: number, min: number, max: number) => Math.min(Math.max(v, min), max)

export const gutter = (vp: Size) => clamp(vp.width * 0.035, 16, 44)
export const isNarrow = (vp: Size) => vp.width < 860

/**
 * Largura do recorte lateral com os olhos (modo conteúdo).
 * Até 1800px (telas de MacBook) mantém o tamanho original; em monitores
 * maiores (ex.: 2560px, 1440p) cresce para não ficar perdido no canto.
 */
const DOCK_WIDE_FROM = 1800
export const dockWidth = (vp: Size) => {
  const base = clamp(vp.width * 0.22, 180, 340)
  if (vp.width <= DOCK_WIDE_FROM) return base
  return Math.min(base + (vp.width - DOCK_WIDE_FROM) * 0.45, 760)
}

export function stageLayout(view: View, vp: Size, on: boolean): StageLayout {
  const pad = gutter(vp)

  if (view === 'homelab') {
    // A Capri recolhe para a direita: só os olhos, num cartão com a mesma margem do conteúdo.
    const w = dockWidth(vp)
    const h = Math.round(w * 0.5625)
    return {
      frame: { x: vp.width - w - pad, y: HEADER_HEIGHT + (vp.height - HEADER_HEIGHT) * 0.08, w, h },
      radius: [22, 22, 22, 22],
      framing: 'eyes',
    }
  }

  const maxH = isNarrow(vp) ? vp.height - HEADER_HEIGHT - 250 : vp.height - HEADER_HEIGHT - pad
  const maxW = isNarrow(vp) ? vp.width - pad * 2 : vp.width * (on ? 0.66 : 0.62)

  // Ligada: o quadro assume o 16:9 do clipe, para os dois olhos caberem inteiros.
  // Desligada: retrato, no formato do still. Composição assimétrica, ancorada no topo.
  const aspect = on ? 16 / 9 : isNarrow(vp) ? 1.1 : 1.18
  const w = Math.min(maxW, maxH * aspect)
  const h = Math.max(200, w / aspect)
  return { frame: { x: pad, y: HEADER_HEIGHT, w, h }, radius: [28, 28, 28, 28], framing: 'portrait' }
}

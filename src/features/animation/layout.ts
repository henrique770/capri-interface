import type { View } from '@/features/activation/model'
import type { Size } from '@/hooks/useViewportSize'
import type { Framing, Rect } from './camera'

export interface StageLayout {
  frame: Rect
  /** Raios: superior-esquerdo, superior-direito, inferior-direito, inferior-esquerdo. */
  radius: [number, number, number, number]
  framing: Framing
  /**
   * Altura da área da imagem, a partir do topo do quadro. Com a Capri ligada,
   * abaixo dela fica a faixa do rosto onde a boca é desenhada.
   */
  imageH: number
}

export const HEADER_HEIGHT = 56

/**
 * Ligada, o quadro ganha uma faixa abaixo do clipe 16:9 para a boca: no
 * original ela fica ~0,6 d abaixo dos olhos, logo abaixo do painel verde —
 * fora do recorte do close. 720 → 900 px no espaço do clipe (1280 de largura).
 */
const ON_ASPECT = 1280 / 900
const IMAGE_ASPECT = 16 / 9
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
    const imageH = Math.round(w / IMAGE_ASPECT)
    const h = on ? Math.round(w / ON_ASPECT) : imageH
    return {
      frame: { x: vp.width - w - pad, y: HEADER_HEIGHT + (vp.height - HEADER_HEIGHT) * 0.08, w, h },
      radius: [22, 22, 22, 22],
      framing: 'eyes',
      imageH,
    }
  }

  // Ligada: o clipe 16:9 inteiro + a faixa da boca. Desligada: retrato, no formato
  // do still.
  const aspect = on ? ON_ASPECT : isNarrow(vp) ? 1.1 : 1.18

  // Janela em pé (vertical): sobra altura, então a Capri ocupa a largura toda e
  // fica centrada no espaço entre a barra superior e o texto, que desce para baixo dela.
  if (vp.height > vp.width) {
    const reserve = isNarrow(vp) ? 250 : 300
    const availH = vp.height - HEADER_HEIGHT - reserve
    const w = Math.min(vp.width - pad * 2, availH * aspect)
    const h = Math.max(200, w / aspect)
    const imageH = on ? w / IMAGE_ASPECT : h
    return {
      frame: { x: (vp.width - w) / 2, y: HEADER_HEIGHT + Math.max(0, (availH - h) / 2), w, h },
      radius: [28, 28, 28, 28],
      framing: 'portrait',
      imageH,
    }
  }

  const maxH = isNarrow(vp) ? vp.height - HEADER_HEIGHT - 250 : vp.height - HEADER_HEIGHT - pad
  // Nunca invade a coluna de texto à direita (CharacterAside: min(34vw, 380px) + 44px).
  const asideW = Math.min(vp.width * 0.34, 380) + 44
  const maxW = isNarrow(vp)
    ? vp.width - pad * 2
    : Math.min(vp.width * (on ? 0.66 : 0.62), vp.width - pad - asideW - 24)

  // Composição assimétrica: à esquerda, centrada na altura quando sobra espaço.
  const w = Math.min(maxW, maxH * aspect)
  const h = Math.max(200, w / aspect)
  const imageH = on ? w / IMAGE_ASPECT : h
  const y = HEADER_HEIGHT + Math.max(0, (maxH - h) / 2)
  return { frame: { x: pad, y, w, h }, radius: [28, 28, 28, 28], framing: 'portrait', imageH }
}

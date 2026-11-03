/** Curvas e durações centralizadas — ajuste fino da sensação da Capri. */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const

/** Recolher/expandir entre modos, e a mudança de forma do quadro ao ligar/desligar. */
export const LAYOUT_TRANSITION = { duration: 0.85, ease: EASE_IN_OUT }

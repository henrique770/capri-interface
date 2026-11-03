/** Curvas e durações centralizadas — ajuste fino da sensação da Capri. */

export const EASE_OUT = [0.22, 1, 0.36, 1] as const
export const EASE_IN_OUT = [0.76, 0, 0.24, 1] as const

/** Recolher/expandir entre modo personagem e modo conteúdo. */
export const LAYOUT_TRANSITION = { duration: 0.85, ease: EASE_IN_OUT }

/** Cortina diagonal da ativação (segundos para percorrer o quadro inteiro). */
export const WIPE_DURATION = 0.9
export const WIPE_EASE = [0.65, 0, 0.35, 1] as const

/** Pequena antecipação antes de acender (a Capri "respira" antes). */
export const ANTICIPATION_DELAY = 0.14

/** Inclinação da cortina, como fração da largura — segue o ângulo das mechas. */
export const WIPE_SLANT = 0.42

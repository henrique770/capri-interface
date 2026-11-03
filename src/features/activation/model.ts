/**
 * Modelo de estados da Capri — puro, sem React, sem DOM.
 *
 * phase: ciclo de vida visual da personagem.
 *   inactive ──activate──▶ activating ──settled──▶ active
 *   active ──deactivate──▶ deactivating ──settled──▶ inactive
 *   (uma transição pode ser invertida no meio: activating ⇄ deactivating)
 *
 * view: o que ocupa a janela. A personagem em destaque ou um painel de conteúdo
 *       (quando a Capri se recolhe para a lateral).
 */

export type ActivationPhase = 'inactive' | 'activating' | 'active' | 'deactivating'
export type View = 'character' | 'homelab'

export interface CapriState {
  phase: ActivationPhase
  view: View
  topicsOpen: boolean
}

/** Intenções vindas de qualquer fonte (teclado hoje, voz/wake word amanhã). */
export type CapriIntent =
  | { type: 'toggle' }
  | { type: 'activate' }
  | { type: 'deactivate' }
  | { type: 'toggleHomelab' }
  | { type: 'toggleTopics' }
  | { type: 'home' }

/** Eventos internos emitidos pela camada de animação. */
export type CapriEvent = CapriIntent | { type: 'transitionSettled' }

export const initialState: CapriState = {
  phase: 'inactive',
  view: 'character',
  topicsOpen: false,
}

export const isOn = (phase: ActivationPhase) => phase === 'activating' || phase === 'active'

export function reduce(state: CapriState, event: CapriEvent): CapriState {
  switch (event.type) {
    case 'toggle':
      return reduce(state, { type: isOn(state.phase) ? 'deactivate' : 'activate' })

    case 'activate':
      return isOn(state.phase) ? state : { ...state, phase: 'activating' }

    case 'deactivate':
      return isOn(state.phase) ? { ...state, phase: 'deactivating' } : state

    case 'transitionSettled':
      if (state.phase === 'activating') return { ...state, phase: 'active' }
      if (state.phase === 'deactivating') return { ...state, phase: 'inactive' }
      return state

    case 'toggleHomelab':
      return {
        ...state,
        view: state.view === 'homelab' ? 'character' : 'homelab',
        topicsOpen: false,
      }

    case 'toggleTopics':
      return { ...state, topicsOpen: !state.topicsOpen }

    case 'home':
      return { ...state, view: 'character', topicsOpen: false }
  }
}

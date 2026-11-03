import type { CapriIntent } from '../model'
import type { IntentSource } from './types'

/** Atalhos de desenvolvimento. Substituíveis por voz sem tocar na UI. */
const KEYMAP: Record<string, CapriIntent> = {
  Space: { type: 'toggle' },
  KeyH: { type: 'toggleHomelab' },
  KeyT: { type: 'toggleTopics' },
  Escape: { type: 'home' },
}

export const keyboardSource: IntentSource = {
  id: 'keyboard',
  start(emit) {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      const intent = KEYMAP[e.code]
      if (!intent) return
      e.preventDefault()
      emit(intent)
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  },
}

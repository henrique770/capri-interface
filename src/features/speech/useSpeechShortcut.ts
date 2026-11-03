import { useEffect } from 'react'
import { getState } from '@/features/activation/store'
import { stopDemoSpeech, toggleDemoSpeech } from './demo'

/** F: fala de demonstração (só com a Capri ativa). Desligar a Capri corta a fala. */
export function useSpeechShortcut() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyF' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      if (getState().phase !== 'active') return
      e.preventDefault()
      toggleDemoSpeech()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      stopDemoSpeech()
    }
  }, [])
}

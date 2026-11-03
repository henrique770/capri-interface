import { useEffect } from 'react'
import { cycleThemeMode } from './store'

/** D alterna o tema. Fica fora das fontes de intenção: é preferência de UI, não comando da Capri. */
export function useThemeShortcut() {
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.code !== 'KeyD' || e.repeat || e.metaKey || e.ctrlKey || e.altKey) return
      e.preventDefault()
      cycleThemeMode()
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])
}

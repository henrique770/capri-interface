import { useSyncExternalStore } from 'react'

/** Preferência do usuário. `system` acompanha o macOS/Windows em tempo real. */
export type ThemeMode = 'system' | 'light' | 'dark'
export type ResolvedTheme = 'light' | 'dark'

const STORAGE_KEY = 'capri.theme'
const ORDER: ThemeMode[] = ['system', 'light', 'dark']
const media = window.matchMedia('(prefers-color-scheme: dark)')
const listeners = new Set<() => void>()

let mode = readStored()

function readStored(): ThemeMode {
  try {
    const v = localStorage.getItem(STORAGE_KEY)
    return v === 'light' || v === 'dark' ? v : 'system'
  } catch {
    return 'system'
  }
}

function resolve(m: ThemeMode): ResolvedTheme {
  return m === 'system' ? (media.matches ? 'dark' : 'light') : m
}

function apply() {
  document.documentElement.dataset.theme = resolve(mode)
  // Mantém a moldura nativa (semáforo, menus, fundo da janela) no mesmo tema.
  window.capri?.setTheme?.(mode)
  listeners.forEach((l) => l())
}

export function setThemeMode(next: ThemeMode) {
  mode = next
  try {
    if (next === 'system') localStorage.removeItem(STORAGE_KEY)
    else localStorage.setItem(STORAGE_KEY, next)
  } catch {
    // Sem armazenamento: vale só para esta sessão.
  }
  apply()
}

/** Sistema → claro → escuro → sistema. */
export function cycleThemeMode() {
  setThemeMode(ORDER[(ORDER.indexOf(mode) + 1) % ORDER.length])
}

media.addEventListener('change', () => {
  if (mode === 'system') apply()
})
apply()

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export function useTheme(): { mode: ThemeMode; resolved: ResolvedTheme } {
  const m = useSyncExternalStore(subscribe, () => mode)
  return { mode: m, resolved: resolve(m) }
}

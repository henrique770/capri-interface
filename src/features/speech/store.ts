import { useSyncExternalStore } from 'react'
import { mouthIndexFor } from './mouth'

/**
 * Estado da fala da Capri. Qualquer fonte escreve o nível de voz (0–1):
 * a demonstração (tecla F) hoje, o áudio do text-to-speech amanhã
 * (`attachSpeechAudio`). A boca lê só o índice da forma, que muda no
 * máximo a 12 quadros por segundo — "nos dois", como no anime.
 */
const MOUTH_FPS = 12

let level = 0
let speaking = false
let mouth = 0
let lastStep = 0
const listeners = new Set<() => void>()
const emit = () => listeners.forEach((l) => l())

export function setSpeechLevel(next: number, now = performance.now()) {
  level = Math.max(0, Math.min(1, next))
  if (now - lastStep < 1000 / MOUTH_FPS) return
  lastStep = now
  const nextMouth = mouthIndexFor(level, mouth)
  if (nextMouth !== mouth) {
    mouth = nextMouth
    emit()
  }
}

export function setSpeaking(next: boolean) {
  if (next === speaking) return
  speaking = next
  if (!next) {
    level = 0
    mouth = 0
  }
  emit()
}

export const getSpeechLevel = () => level

function subscribe(l: () => void) {
  listeners.add(l)
  return () => listeners.delete(l)
}

export const useMouthIndex = () => useSyncExternalStore(subscribe, () => mouth)
export const useSpeaking = () => useSyncExternalStore(subscribe, () => speaking)

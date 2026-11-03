import { useSyncExternalStore } from 'react'
import { initialState, reduce, type CapriEvent, type CapriState } from './model'

type Listener = () => void

let state: CapriState = initialState
const listeners = new Set<Listener>()

export function dispatch(event: CapriEvent): void {
  const next = reduce(state, event)
  if (next === state) return
  state = next
  listeners.forEach((l) => l())
}

export function getState(): CapriState {
  return state
}

function subscribe(listener: Listener): () => void {
  listeners.add(listener)
  return () => listeners.delete(listener)
}

export function useCapri<T>(selector: (s: CapriState) => T): T {
  return useSyncExternalStore(subscribe, () => selector(state))
}

import type { CapriIntent } from '../model'

/**
 * Uma fonte de intenções. O teclado é a única implementada no MVP.
 *
 * Para a palavra de ativação "Capri" no futuro, basta criar outra fonte
 * (ex.: `wakeWordSource`) que escute o microfone — no renderer via Web Audio
 * ou no processo principal via preload — e chame `emit({ type: 'activate' })`
 * ao detectar a palavra. Nenhuma parte da animação precisa mudar.
 */
export interface IntentSource {
  id: string
  /** Começa a escutar; retorna a função de limpeza. */
  start(emit: (intent: CapriIntent) => void): () => void
}

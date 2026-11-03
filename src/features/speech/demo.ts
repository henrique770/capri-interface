import { setSpeaking, setSpeechLevel } from './store'

/**
 * Fala de demonstração (tecla F) enquanto o TTS do agente não está ligado.
 *
 * Usa a voz do sistema (Web Speech API, pt-BR) para a Capri falar de verdade.
 * A API não entrega o áudio para análise, então a boca segue um envelope de
 * sílabas gerado a cada palavra (evento `boundary`). Sem voz disponível, o
 * envelope roda sozinho, mudo.
 */
const PHRASES = [
  'Todos os serviços estão no ar. O Nextcloud está um pouco instável.',
  'Uso de memória em onze gigas. Nada fora do normal por enquanto.',
  'O backup noturno terminou sem erros às três da manhã.',
  'Encontrei duas atualizações de containers. Quer que eu aplique agora?',
  'Processador tranquilo, vinte e poucos por cento. Pode contar comigo.',
]

/** Vozes preferidas para a Capri, na ordem. Qualquer pt-BR serve de reserva. */
const PREFERRED_VOICES = ['Luciana', 'Flo', 'Sandy', 'Shelley']

/** Duração média de uma sílaba falada em velocidade normal (ms). */
const SYLLABLE_MS = 165

interface Syllable {
  start: number
  dur: number
  peak: number
}

let stopCurrent: (() => void) | null = null

export function isDemoSpeaking() {
  return stopCurrent !== null
}

export function toggleDemoSpeech() {
  if (isDemoSpeaking()) stopDemoSpeech()
  else startDemoSpeech()
}

export function stopDemoSpeech() {
  stopCurrent?.()
}

export function startDemoSpeech() {
  stopDemoSpeech()
  const text = PHRASES[Math.floor(Math.random() * PHRASES.length)]
  const voice = pickVoice()
  if (voice) speakWithVoice(text, voice)
  else speakSilently(text)
}

function pickVoice(): SpeechSynthesisVoice | null {
  if (!('speechSynthesis' in window)) return null
  const voices = speechSynthesis.getVoices().filter((v) => v.lang === 'pt-BR')
  for (const name of PREFERRED_VOICES) {
    const v = voices.find((x) => x.name.startsWith(name))
    if (v) return v
  }
  return voices[0] ?? null
}

/** Sílabas aproximadas de uma palavra: grupos de vogais. */
function syllablesOf(word: string, at: number): Syllable[] {
  const count = Math.max(1, (word.toLowerCase().match(/[aeiouáàâãéêíóôõú]+/g) ?? []).length)
  return Array.from({ length: count }, (_, i) => ({
    start: at + i * SYLLABLE_MS,
    dur: SYLLABLE_MS * (0.75 + Math.random() * 0.3),
    peak: 0.35 + Math.random() * 0.65,
  }))
}

/** Nível de voz no instante `t`: abre rápido, fecha devagar — como uma sílaba. */
function levelAt(syllables: Syllable[], t: number): number {
  let level = 0
  for (const s of syllables) {
    if (t < s.start || t > s.start + s.dur) continue
    const p = (t - s.start) / s.dur
    level = Math.max(level, s.peak * (p < 0.3 ? p / 0.3 : 1 - (p - 0.3) / 0.7))
  }
  return level
}

/** Roda o envelope a cada quadro até `stop`. */
function animate(syllables: Syllable[], t0: number) {
  let raf = 0
  const tick = (now: number) => {
    setSpeechLevel(levelAt(syllables, now - t0), now)
    raf = requestAnimationFrame(tick)
  }
  raf = requestAnimationFrame(tick)
  return () => cancelAnimationFrame(raf)
}

function speakWithVoice(text: string, voice: SpeechSynthesisVoice) {
  const utterance = new SpeechSynthesisUtterance(text)
  utterance.voice = voice
  utterance.lang = voice.lang
  utterance.rate = 1.05

  const syllables: Syllable[] = []
  const t0 = performance.now()
  let gotBoundary = false
  let stopAnim = () => {}
  let fallback: ReturnType<typeof setTimeout>

  utterance.onstart = () => {
    setSpeaking(true)
    stopAnim = animate(syllables, t0)
    // Algumas vozes não emitem `boundary`: nesse caso, envelope da frase inteira.
    fallback = setTimeout(() => {
      if (!gotBoundary) syllables.push(...phraseSyllables(text, performance.now() - t0))
    }, 350)
  }
  utterance.onboundary = (e) => {
    if (e.name && e.name !== 'word') return
    gotBoundary = true
    const word = text.slice(e.charIndex).match(/^[\p{L}\p{N}]+/u)?.[0] ?? ''
    syllables.push(...syllablesOf(word, performance.now() - t0))
  }
  const finish = () => {
    if (stopCurrent !== stop) return
    stop()
  }
  utterance.onend = finish
  utterance.onerror = finish

  const stop = () => {
    clearTimeout(fallback)
    stopAnim()
    stopCurrent = null
    utterance.onend = utterance.onerror = null
    speechSynthesis.cancel()
    setSpeaking(false)
  }
  stopCurrent = stop
  speechSynthesis.cancel()
  speechSynthesis.speak(utterance)
}

/** Envelope da frase inteira, com pausas entre palavras e nas vírgulas. */
function phraseSyllables(text: string, from: number): Syllable[] {
  const syllables: Syllable[] = []
  let t = from
  for (const token of text.split(/\s+/)) {
    const s = syllablesOf(token, t)
    syllables.push(...s)
    t += s.length * SYLLABLE_MS + (/[,.?!]$/.test(token) ? 320 : 70)
  }
  return syllables
}

function speakSilently(text: string) {
  const syllables = phraseSyllables(text, 120)
  const total = syllables.at(-1)!.start + SYLLABLE_MS + 150
  const t0 = performance.now()
  setSpeaking(true)
  const stopAnim = animate(syllables, t0)
  const timeout = setTimeout(() => stop(), total)
  const stop = () => {
    clearTimeout(timeout)
    stopAnim()
    stopCurrent = null
    setSpeaking(false)
  }
  stopCurrent = stop
}

// O Chromium carrega a lista de vozes de forma assíncrona: pede cedo para o
// primeiro F já encontrar a voz pt-BR.
if ('speechSynthesis' in window) speechSynthesis.getVoices()

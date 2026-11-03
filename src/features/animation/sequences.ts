/**
 * Sequências de frames, carregadas por convenção de pasta:
 *
 *   src/assets/capri/sequences/<nome>/01.jpg, 02.jpg, ...   (png/webp/jpg)
 *
 * Os frames devem ter exatamente as mesmas dimensões e enquadramento da pose
 * a que pertencem. Sem frames na pasta, a pose simplesmente fica estática.
 */
const files = import.meta.glob('../../assets/capri/sequences/*/*.{png,webp,jpg}', {
  eager: true,
  query: '?url',
  import: 'default',
}) as Record<string, string>

export function getSequence(name: string): string[] {
  return Object.keys(files)
    .filter((path) => path.includes(`/sequences/${name}/`))
    .sort()
    .map((path) => files[path])
}

/**
 * Como uma pose anima quando está parada na tela.
 * - `pingpong`: toca a sequência original para frente e para trás, sem cortes,
 *   respeitando a duração de cada desenho (timing do anime preservado).
 * - `interval`: toca a sequência de tempos em tempos (ex.: piscada) e volta ao still.
 * - `once`: toca uma vez (ex.: entrada) e segura o último desenho.
 */
export type IdleAnimation =
  | { sequence: string; mode: 'pingpong'; durations: number[] }
  | { sequence: string; mode: 'once'; durations: number[] }
  | { sequence: string; mode: 'interval'; fps?: number; gap?: [number, number] }

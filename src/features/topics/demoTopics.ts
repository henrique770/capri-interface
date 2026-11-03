export interface Topic {
  id: string
  title: string
  when: string
  accent: 'pink' | 'green' | 'blue'
}

/** Tópicos fictícios apenas para validar a apresentação do histórico. */
export const DEMO_TOPICS: Topic[] = [
  { id: 't1', title: 'Status geral do homelab', when: 'agora há pouco', accent: 'green' },
  { id: 't2', title: 'Uso de memória acima do normal', when: 'hoje, 14:20', accent: 'pink' },
  { id: 't3', title: 'Backup noturno concluído', when: 'hoje, 03:00', accent: 'blue' },
  { id: 't4', title: 'Atualização de containers', when: 'ontem', accent: 'green' },
]

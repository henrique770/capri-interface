import { motion } from 'motion/react'
import { X } from 'lucide-react'
import { DEMO_TOPICS, type Topic } from '@/features/topics/demoTopics'
import { HEADER_HEIGHT } from '@/features/animation/layout'
import { EASE_OUT } from '@/features/animation/timing'
import { IconButton } from '@/components/ui/IconButton'

const DOT: Record<Topic['accent'], string> = {
  pink: 'bg-capri-pink',
  green: 'bg-capri-green',
  blue: 'bg-capri-blue',
}

/** Histórico de tópicos: folha temporária, nunca uma barra lateral fixa. */
export function TopicsSheet({ onClose }: { onClose: () => void }) {
  return (
    <motion.section
      initial={{ opacity: 0, x: 24 }}
      animate={{ opacity: 1, x: 0 }}
      exit={{ opacity: 0, x: 24, transition: { duration: 0.2 } }}
      transition={{ duration: 0.45, ease: EASE_OUT }}
      className="absolute right-3 bottom-3 z-40 flex w-[min(340px,calc(100vw-24px))] flex-col rounded-[24px] bg-surface p-6 shadow-sheet"
      style={{ top: HEADER_HEIGHT }}
    >
      <div className="flex items-start justify-between">
        <div>
          <h2 className="text-[22px] font-normal tracking-[-0.02em]">Tópicos</h2>
          <p className="mt-1 text-[12px] text-mute">Histórico demonstrativo</p>
        </div>
        <IconButton label="Fechar" onClick={onClose} className="-mt-1 -mr-2">
          <X size={16} strokeWidth={1.75} />
        </IconButton>
      </div>
      <ul className="mt-8 flex flex-col">
        {DEMO_TOPICS.map((topic, i) => (
          <motion.li
            key={topic.id}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.08 + i * 0.05, duration: 0.4, ease: EASE_OUT }}
            className="flex items-baseline gap-3 border-t border-line py-4 first:border-t-0"
          >
            <span className={`size-1.5 shrink-0 translate-y-[-2px] rounded-full ${DOT[topic.accent]}`} />
            <span className="flex-1 text-[14px] leading-snug">{topic.title}</span>
            <span className="text-[11px] whitespace-nowrap text-mute">{topic.when}</span>
          </motion.li>
        ))}
      </ul>
    </motion.section>
  )
}

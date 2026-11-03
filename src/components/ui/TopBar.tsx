import { History, LayoutGrid } from 'lucide-react'
import type { ActivationPhase, View } from '@/features/activation/model'
import { HEADER_HEIGHT } from '@/features/animation/layout'
import { IconButton } from './IconButton'
import { StatusIndicator } from './StatusIndicator'

interface TopBarProps {
  phase: ActivationPhase
  view: View
  topicsOpen: boolean
  onHomelab: () => void
  onTopics: () => void
}

/** Navegação discreta. A barra inteira arrasta a janela (macOS). */
export function TopBar({ phase, view, topicsOpen, onHomelab, onTopics }: TopBarProps) {
  const isMac = window.capri?.platform === 'darwin'
  return (
    <header
      className="drag absolute inset-x-0 top-0 z-30 flex items-center justify-between pr-4"
      style={{ height: HEADER_HEIGHT, paddingLeft: isMac ? 92 : 20 }}
    >
      <div className="flex items-center gap-5">
        <span className="text-[13px] font-medium tracking-tight">capri</span>
        <StatusIndicator phase={phase} />
      </div>
      <nav className="flex items-center gap-1">
        <IconButton label="Homelab (H)" active={view === 'homelab'} onClick={onHomelab}>
          <LayoutGrid size={16} strokeWidth={1.75} />
        </IconButton>
        <IconButton label="Histórico de tópicos (T)" active={topicsOpen} onClick={onTopics}>
          <History size={16} strokeWidth={1.75} />
        </IconButton>
      </nav>
    </header>
  )
}

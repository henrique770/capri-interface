import { AnimatePresence } from 'motion/react'
import { CapriStage } from '@/components/capri/CapriStage'
import { CharacterAside } from '@/components/capri/CharacterAside'
import { HomelabPanel } from '@/components/content/HomelabPanel'
import { TopicsSheet } from '@/components/content/TopicsSheet'
import { TopBar } from '@/components/ui/TopBar'
import { keyboardSource } from '@/features/activation/sources/keyboard'
import { dispatch, useCapri } from '@/features/activation/store'
import { dockWidth, gutter, isNarrow } from '@/features/animation/layout'
import { useIntentSources } from '@/hooks/useIntentSources'
import { useViewportSize } from '@/hooks/useViewportSize'

// Fontes de intenção ativas. Adicione aqui a futura fonte de wake word "Capri".
const SOURCES = [keyboardSource]

export function App() {
  useIntentSources(SOURCES)
  const vp = useViewportSize()
  const phase = useCapri((s) => s.phase)
  const view = useCapri((s) => s.view)
  const topicsOpen = useCapri((s) => s.topicsOpen)

  return (
    <div className="relative h-full w-full overflow-hidden bg-paper">
      <TopBar
        phase={phase}
        view={view}
        topicsOpen={topicsOpen}
        onHomelab={() => dispatch({ type: 'toggleHomelab' })}
        onTopics={() => dispatch({ type: 'toggleTopics' })}
      />

      <AnimatePresence>
        {view === 'character' && (
          <CharacterAside
            key="aside"
            phase={phase}
            narrow={isNarrow(vp)}
            onToggle={() => dispatch({ type: 'toggle' })}
          />
        )}
        {view === 'homelab' && <HomelabPanel key="homelab" rightInset={dockWidth(vp) + gutter(vp)} />}
      </AnimatePresence>

      <CapriStage />

      <AnimatePresence>
        {topicsOpen && <TopicsSheet key="topics" onClose={() => dispatch({ type: 'toggleTopics' })} />}
      </AnimatePresence>
    </div>
  )
}

import type { ReactNode } from 'react'

export function Kbd({ children }: { children: ReactNode }) {
  return (
    <kbd className="inline-flex h-5 min-w-5 items-center justify-center rounded-md bg-paper-2 px-1.5 font-mono text-[10px] text-mute">
      {children}
    </kbd>
  )
}

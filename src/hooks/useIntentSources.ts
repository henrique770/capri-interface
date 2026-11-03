import { useEffect } from 'react'
import { dispatch } from '@/features/activation/store'
import type { IntentSource } from '@/features/activation/sources/types'

export function useIntentSources(sources: IntentSource[]): void {
  useEffect(() => {
    const stops = sources.map((s) => s.start(dispatch))
    return () => stops.forEach((stop) => stop())
  }, [sources])
}

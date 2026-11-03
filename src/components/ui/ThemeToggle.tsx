import { Monitor, Moon, Sun } from 'lucide-react'
import { cycleThemeMode, useTheme, type ThemeMode } from '@/features/theme/store'
import { IconButton } from './IconButton'

const META: Record<ThemeMode, { label: string; Icon: typeof Sun }> = {
  system: { label: 'Tema: sistema', Icon: Monitor },
  light: { label: 'Tema: claro', Icon: Sun },
  dark: { label: 'Tema: escuro', Icon: Moon },
}

export function ThemeToggle() {
  const { mode } = useTheme()
  const { label, Icon } = META[mode]
  return (
    <IconButton label={`${label} (D)`} onClick={cycleThemeMode}>
      <Icon size={16} strokeWidth={1.75} />
    </IconButton>
  )
}

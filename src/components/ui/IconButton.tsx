import type { ComponentProps, ReactNode } from 'react'

interface IconButtonProps extends ComponentProps<'button'> {
  label: string
  active?: boolean
  children: ReactNode
}

export function IconButton({ label, active, children, className = '', ...props }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      aria-pressed={active}
      className={`no-drag grid size-9 place-items-center rounded-full transition-colors duration-300 ${
        active ? 'bg-ink text-paper' : 'text-ink/70 hover:bg-paper-2 hover:text-ink'
      } ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

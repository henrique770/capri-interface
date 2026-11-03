export {}

declare global {
  interface Window {
    capri?: {
      platform: NodeJS.Platform
      setTheme?: (mode: 'system' | 'light' | 'dark') => void
    }
  }
}

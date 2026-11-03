export {}

declare global {
  interface Window {
    capri?: {
      platform: NodeJS.Platform
    }
  }
}

import { contextBridge, ipcRenderer } from 'electron'

// Superfície mínima exposta ao renderer. Futuras pontes (áudio, wake word,
// TTS nativo) devem entrar aqui como funções explícitas, nunca o ipcRenderer cru.
contextBridge.exposeInMainWorld('capri', {
  platform: process.platform,
  setTheme: (mode: 'system' | 'light' | 'dark') => ipcRenderer.send('capri:set-theme', mode),
})

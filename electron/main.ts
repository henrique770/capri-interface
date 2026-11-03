import { app, BrowserWindow, ipcMain, nativeTheme, shell } from 'electron'
import { join } from 'node:path'

const isMac = process.platform === 'darwin'
const BACKGROUND = { light: '#FAFAF8', dark: '#0C0C0E' }
const THEME_MODES = new Set(['system', 'light', 'dark'])

const background = () => (nativeTheme.shouldUseDarkColors ? BACKGROUND.dark : BACKGROUND.light)

function createWindow(): void {
  const win = new BrowserWindow({
    width: 1200,
    height: 780,
    minWidth: 560,
    minHeight: 440,
    show: false,
    title: 'Capri',
    backgroundColor: background(),
    // macOS: barra de título integrada (semáforo flutuando sobre o conteúdo).
    // Windows/Linux: moldura nativa padrão para manter o comportamento esperado.
    titleBarStyle: isMac ? 'hiddenInset' : 'default',
    trafficLightPosition: isMac ? { x: 18, y: 18 } : undefined,
    webPreferences: {
      preload: join(__dirname, '../preload/preload.js'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: true,
    },
  })

  win.once('ready-to-show', () => win.show())

  // Links externos nunca abrem dentro da janela da Capri.
  win.webContents.setWindowOpenHandler(({ url }) => {
    void shell.openExternal(url)
    return { action: 'deny' }
  })

  const devUrl = process.env['ELECTRON_RENDERER_URL']
  if (!app.isPackaged && devUrl) {
    void win.loadURL(devUrl)
  } else {
    void win.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// O renderer guarda a preferência; aqui só alinhamos a moldura nativa e o fundo da janela.
ipcMain.on('capri:set-theme', (_event, mode: unknown) => {
  if (typeof mode !== 'string' || !THEME_MODES.has(mode)) return
  nativeTheme.themeSource = mode as 'system' | 'light' | 'dark'
})

nativeTheme.on('updated', () => {
  for (const win of BrowserWindow.getAllWindows()) win.setBackgroundColor(background())
})

app.whenReady().then(() => {
  createWindow()
  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (!isMac) app.quit()
})

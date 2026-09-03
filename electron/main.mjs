import { app, BrowserWindow, Menu, net, protocol } from 'electron'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')

app.setPath(
  'userData',
  path.join(
    process.env.LOCALAPPDATA || process.env.APPDATA || os.tmpdir(),
    'VisualizadorPlanilhas',
  ),
)
app.commandLine.appendSwitch('disable-gpu-shader-disk-cache')

protocol.registerSchemesAsPrivileged([
  {
    scheme: 'app',
    privileges: {
      standard: true,
      secure: true,
      supportFetchAPI: true,
      corsEnabled: true,
      stream: true,
    },
  },
])

function resolveDistFile(requestUrl) {
  const url = new URL(requestUrl)
  let pathname = decodeURIComponent(url.pathname || '/')
  if (!pathname || pathname === '/') pathname = '/index.html'
  const relative = pathname.replace(/^\/+/, '')
  return path.join(DIST_DIR, relative)
}

function createWindow() {
  const win = new BrowserWindow({
    width: 1280,
    height: 840,
    minWidth: 800,
    minHeight: 520,
    title: 'Visualizador de planilhas',
    autoHideMenuBar: true,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  win.setMenuBarVisibility(false)
  win.loadURL('app://./index.html')

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) event.preventDefault()
  })
}

app.whenReady().then(() => {
  Menu.setApplicationMenu(null)

  protocol.handle('app', (request) => {
    const filePath = resolveDistFile(request.url)
    return net.fetch(pathToFileURL(filePath).href)
  })

  createWindow()
})

app.on('window-all-closed', () => {
  app.quit()
})

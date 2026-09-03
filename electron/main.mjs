import { app, BrowserWindow, Menu, net, protocol } from 'electron'
import os from 'node:os'
import path from 'node:path'
import { pathToFileURL, fileURLToPath } from 'node:url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DIST_DIR = path.join(__dirname, '..', 'dist')

function userDataDir() {
  if (process.platform === 'win32') {
    return path.join(
      process.env.LOCALAPPDATA || process.env.APPDATA || os.tmpdir(),
      'VisualizadorPlanilhas',
    )
  }
  if (process.platform === 'darwin') {
    return path.join(os.homedir(), 'Library', 'Application Support', 'VisualizadorPlanilhas')
  }
  return path.join(os.homedir(), '.config', 'VisualizadorPlanilhas')
}

app.setPath('userData', userDataDir())
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
    autoHideMenuBar: process.platform !== 'darwin',
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  })

  if (process.platform !== 'darwin') {
    win.setMenuBarVisibility(false)
  }
  win.loadURL('app://./index.html')

  win.webContents.setWindowOpenHandler(() => ({ action: 'deny' }))
  win.webContents.on('will-navigate', (event, url) => {
    if (!url.startsWith('app://')) event.preventDefault()
  })
}

function installMenu() {
  if (process.platform === 'darwin') {
    Menu.setApplicationMenu(
      Menu.buildFromTemplate([
        { role: 'appMenu' },
        { role: 'editMenu' },
        { role: 'viewMenu' },
        { role: 'windowMenu' },
      ]),
    )
    return
  }
  Menu.setApplicationMenu(null)
}

app.whenReady().then(() => {
  installMenu()

  protocol.handle('app', (request) => {
    const filePath = resolveDistFile(request.url)
    return net.fetch(pathToFileURL(filePath).href)
  })

  createWindow()

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit()
})

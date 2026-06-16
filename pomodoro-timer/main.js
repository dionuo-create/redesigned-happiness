const { app, BrowserWindow, ipcMain, Notification } = require('electron')
const path = require('path')

let mainWindow

app.whenReady().then(() => {
  mainWindow = new BrowserWindow({
    width: 340,
    height: 420,
    resizable: false,
    frame: false,
    alwaysOnTop: true,
    transparent: false,
    backgroundColor: '#1a1a2e',
    webPreferences: {
      preload: path.join(__dirname, 'renderer.js'),
      nodeIntegration: true,
      contextIsolation: false,
    },
  })

  mainWindow.loadFile('index.html')

  ipcMain.on('show-notification', (_event, title, body) => {
    if (Notification.isSupported()) {
      new Notification({ title, body }).show()
    }
  })

  ipcMain.on('flash-window', () => {
    mainWindow.flashFrame(true)
    setTimeout(() => mainWindow.flashFrame(false), 3000)
  })
})

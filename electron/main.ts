import { app, BrowserWindow } from 'electron'

app.on('ready', () => {
  const mainWindow = new BrowserWindow({
    width: 1200,
    height: 800,
    minWidth: 960,
    minHeight: 640,
    autoHideMenuBar: true,
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
    },
  })

  void mainWindow.loadURL('http://localhost:5173')
  mainWindow.webContents.openDevTools()
})

app.on('window-all-closed',()=>{
  if(process.platform !== 'darwin'){
    app.quit()
  }
})

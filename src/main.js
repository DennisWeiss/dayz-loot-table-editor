const electron = require('electron')

let win

const createWindow = () => {
  // Create the browser window.
  win = new electron.BrowserWindow({ width: 800, height: 600 })

  // and load the index.html of the app.
  win.loadURL('http://localhost:3000')

  win.webContents.openDevTools()

  win.on('close', () => win = null)
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
electron.app.on('ready', createWindow)

// Quit when all windows are closed.
electron.app.on('window-all-closed', () => {
  // On macOS it is common for applications and their menu bar
  // to stay active until the user quits explicitly with Cmd + Q
  if (process.platform !== 'darwin') {
    electron.app.quit()
  }
})

electron.app.on('activate', () => {
  // On OS X it's common to re-create a window in the app when the
  // dock icon is clicked and there are no other windows open.
  if (!win) {
    createWindow()
  }
})

const electron = require('electron')
const {ipcMain} = require('electron')
const app = electron.app
const BrowserWindow = electron.BrowserWindow
const keytar = require('keytar');
const path = require('path')
const url = require('url')
const shell = require('electron').shell;

let mainWindow
function createWindow () {
  mainWindow = new BrowserWindow({
    show: false, 
    width: 1024, 
    height: 768,
    minWidth: 1024,
    minHeight: 768,
    frame: true, 
    title: "TezBox Wallet",
    useContentSize: true, 
    icon : path.join(__dirname, 'app/icon.png'),
    webPreferences: {
      devTools: true
    }
  })
  mainWindow.webContents.on('new-window', function(event, url){
    event.preventDefault();
    shell.openExternal(url);
  });
  //mainWindow.setMenu(null);
  
  splash = new BrowserWindow({
    width: 400, 
    height: 300, 
    transparent : true,
    frame: false, 
    alwaysOnTop: true
  });
  splash.loadURL(url.format({
    pathname: path.join(__dirname, 'app/splash.html'),
    protocol: 'file:',
    slashes: true
  }));
  
  mainWindow.loadURL(url.format({
    pathname: path.join(__dirname, 'app/index.html'),
    protocol: 'file:',
    slashes: true
  }))
  mainWindow.webContents.on('did-finish-load', function(){
    splash.destroy();
    mainWindow.show();
    mainWindow.focus();
  });
  mainWindow.on('closed', function () {
    mainWindow = null
  })
}
app.on('ready', createWindow)
app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})
app.on('activate', function () {
  if (mainWindow === null) {
    createWindow()
  }
})
const { app, BrowserWindow, globalShortcut, ipcMain } = require('electron');
const path = require('path');
const sqlite3 = require('sqlite3').verbose();


let mainWindow;
let swearCount = 0;

const userDataPath = app.getPath('userData');
const dbPath = path.join(userDataPath, 'TSJ-main.db');

// Initialize your SQLite database using the new path
const db = new sqlite3.Database(dbPath, (err) => {
  if (err) {
    console.error('Error opening database', err);
  } else {
    db.run(
      `CREATE TABLE IF NOT EXISTS keypresses (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        date TEXT UNIQUE,
        count INTEGER
      )`,
      (err) => {
        if (err) {
          console.error('Error creating table:', err.message);
        }
      }
    );
    console.log('Database opened successfully');
  }
});

function saveKeyPressCount(count) {
  const today = new Date().toISOString().split('T')[0];
  db.run(
    `INSERT INTO keypresses (date, count)
     VALUES (?, ?)
     ON CONFLICT(date)
     DO UPDATE SET count = count + ?`,
    [today, count, count],
    (err) => {
      if (err) {
        console.error('Error saving keypress count:', err.message);
      }
    }
  );
}

function loadPastRecords(callback) {
  db.all(`SELECT date, count FROM keypresses`, (err, rows) => {
    if (err) {
      console.error('Error loading records:', err.message);
      callback([]);
    } else {
      callback(rows);
    }
  });
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 960,
    height: 700,
    autoHideMenuBar: true,
    frame:false,
    
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      enableRemoteModule: false,
      nodeIntegration: false,
    },
  });
  mainWindow.setIcon(path.join(__dirname,"assets/icon.png"));
  // mainWindow.webContents.openDevTools();
  mainWindow.loadFile(path.join(__dirname, 'index.html'));
}

app.whenReady().then(() => {
  createWindow();

  globalShortcut.register('`', () => {
    swearCount++;
    mainWindow.webContents.send('update-count', swearCount);
  });

  ipcMain.on('load-records', (event) => {
    loadPastRecords((records) => {
      event.reply('load-records', records);
    });
  });

  app.on('activate', function () {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', function () {
  if (process.platform !== 'darwin') app.quit();
});

app.on('will-quit', () => {
  globalShortcut.unregisterAll();
  // Save the current tildePressCount to the database when quitting
  if (swearCount > 0) {
    saveKeyPressCount(swearCount);
  }
});


  // Minimize the window
  ipcMain.on('minimize-window', () => {
    if (mainWindow) mainWindow.minimize();
  });

  // Maximize or restore the window
  ipcMain.on('maximize-window', () => {
    if (mainWindow) {
      if (mainWindow.isMaximized()) {
        mainWindow.restore();
      } else {
        mainWindow.maximize();
      }
    }
  });

  // Close the window
  ipcMain.on('close-window', () => {
    if (mainWindow) mainWindow.close();
  });


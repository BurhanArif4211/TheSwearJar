const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  minimizeWindow: () => ipcRenderer.send('minimize-window'),
  maximizeWindow: () => ipcRenderer.send('maximize-window'),
  closeWindow: () => ipcRenderer.send('close-window'),
  
  onUpdateCount: (callback) => ipcRenderer.on('update-count', callback),
  loadRecords: (callback) => {
    ipcRenderer.send('load-records');
    ipcRenderer.on('load-records', (event, records) => callback(event, records));
  },
});

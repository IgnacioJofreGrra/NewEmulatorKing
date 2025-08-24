const { contextBridge, ipcRenderer } = require('electron')

contextBridge.exposeInMainWorld('api', {
  selectDirectory: () => ipcRenderer.invoke('selectDirectory'),
  scanDirectory: (dir) => ipcRenderer.invoke('scanDirectory', dir),
  getSettings: () => ipcRenderer.invoke('getSettings'),
  setSettings: (patch) => ipcRenderer.invoke('setSettings', patch),
  selectEmulator: () => ipcRenderer.invoke('selectEmulator'),
  launchRom: (romPath) => ipcRenderer.invoke('launchRom', romPath),
  renameRom: (oldPath, newName) => ipcRenderer.invoke('renameRom', { oldPath, newName }),
  setCover: (romPath) => ipcRenderer.invoke('setCover', romPath),
  onRefresh: (handler) => {
    const wrapped = () => handler()
    ipcRenderer.on('action:refresh', wrapped)
    // devolver función para desuscribir si querés
    return () => ipcRenderer.removeListener('action:refresh', wrapped)
  }
})

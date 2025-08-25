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
  },
  compressRom: (romPath) => ipcRenderer.invoke('compress:rom', romPath),
  deleteFile: (targetPath) => ipcRenderer.invoke('delete:file', targetPath),
  onCompressProgress: (cb) => {
    const listener = (_e, perc) => cb(perc)
    ipcRenderer.on('compress:progress', listener)
    return () => ipcRenderer.removeListener('compress:progress', listener)
  }

})

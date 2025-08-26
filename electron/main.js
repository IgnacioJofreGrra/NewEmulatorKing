import { app, BrowserWindow, ipcMain, dialog, protocol, Menu, shell } from 'electron'
// abrimos la carpeta en el explorador
ipcMain.handle('openFolder', async (_e, folderPath) => {
  try {
    await shell.openPath(folderPath);
    return { ok: true };
  } catch (err) {
    return { ok: false, error: String(err) };
  }
});
import { fileURLToPath, pathToFileURL } from 'url'
import { dirname, join, extname, basename } from 'path'
import { spawn } from 'node:child_process'
import fs from 'fs'
import path from 'path'

const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

let win
const isDev = !app.isPackaged

const IMAGE_EXTS = ['.cue', '.bin', '.iso', '.img', '.mdf', '.pbp', '.chd']
const COVER_EXTS = ['.jpg', '.jpeg', '.png', '.webp']
// Normaliza el basename removiendo " (Track N)" al final, p.ej. "Juego (Track 01)" -> "Juego"
function normalizeBase(base) {
  return base.replace(/\s*\(track\s*\d+\)\s*$/i, '');
}

// ¿El archivo .bin es uno de los de "Track N"?
function isTrackBin(base, ext) {
  return ext === '.bin' && /\(track\s*\d+\)\s*$/i.test(base);
}


function createWindow() {
  win = new BrowserWindow({
    width: 1100,
    height: 700,
    minWidth: 900,
    minHeight: 600,
    backgroundColor: '#09090b',
    icon: join(__dirname, '../public/icons/logo.png'),
    webPreferences: {
      contextIsolation: true,
      nodeIntegration: false,
      preload: join(__dirname, 'preload.cjs')
    }
  })
  Menu.setApplicationMenu(null)

  win.webContents.on('context-menu', (e) => {
    e.preventDefault()
    const menu = Menu.buildFromTemplate([
      {
        label: 'Refrescar',
        click: () => win.webContents.send('action:refresh')
      }
    ])
    menu.popup({ window: win })
  })

  if (isDev) {
    win.loadURL('http://localhost:5173')
    win.webContents.openDevTools({ mode: 'detach' })
  } else {
    win.loadFile(join(__dirname, '../dist/index.html'))
  }
}

app.whenReady().then(() => {
  protocol.handle('cover', async (request) => {
    try {
      // 1) Quitar prefijo y query (?t=...) y decodificar %20, %27, etc.
      let raw = request.url.slice('cover://'.length)
      raw = decodeURIComponent(raw)
      raw = raw.split('?')[0]

      // 2) Normalizar a path de Windows
      const finalPath = path.normalize(raw)

      // 3) Leer el archivo y responder con el MIME correcto (no usamos fetch(file://))
      const data = await fs.promises.readFile(finalPath)
      const ext = path.extname(finalPath).toLowerCase()

      // MIME muy simple; ampliá si querés más tipos
      const mime =
        ext === '.png' ? 'image/png' :
          ext === '.webp' ? 'image/webp' :
            ext === '.jpg' || ext === '.jpeg' ? 'image/jpeg' :
              'application/octet-stream'

      return new Response(data, { headers: { 'Content-Type': mime } })
    } catch (err) {
      console.error('cover:// handler error', err)
      if (err && err.code === 'ENOENT') {
        return new Response('Not found', { status: 404 })
      }
      return new Response('Internal error', { status: 500 })
    }
  })
  createWindow()
})
app.on('window-all-closed', () => { if (process.platform !== 'darwin') app.quit() })
app.on('activate', () => { if (BrowserWindow.getAllWindows().length === 0) createWindow() })

// --- Settings (stored under userData) ---
const SETTINGS_FILE = join(app.getPath('userData'), 'config.json')

async function readSettings() {
  try {
    const raw = await fs.promises.readFile(SETTINGS_FILE, 'utf8')
    return JSON.parse(raw)
  } catch {
    return { emulatorPath: '', lastDir: '', fullscreen: true, extraArgs: '', activeProfile: '', isConfigured: false }
  }
}

async function writeSettings(patch) {
  const curr = await readSettings()
  const next = { ...curr, ...patch }
  await fs.promises.mkdir(dirname(SETTINGS_FILE), { recursive: true })
  await fs.promises.writeFile(SETTINGS_FILE, JSON.stringify(next, null, 2), 'utf8')
  return next
}

// --- Scanning ---
async function scanDirRecursive(root) {
  /** @type {Array<{path:string,name:string,ext:string,coverUrl:string|null}>} */
  const found = []

  async function walk(dir) {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true })
    for (const ent of entries) {
      const full = join(dir, ent.name)
      if (ent.isDirectory()) {
        await walk(full)
      } else {
        const ext = extname(ent.name).toLowerCase()
        if (IMAGE_EXTS.includes(ext)) {
          const name = ent.name
          found.push({ path: full, name, ext, coverUrl: null })
        }
      }
    }
  }

  await walk(root)
  const groups = new Map()
  for (const f of found) {
    const base = basename(f.path, f.ext)
    const key = normalizeBase(base)
    const entry = { ...f, base, normBase: key }
    const arr = groups.get(key) || []
    arr.push(entry)
    groups.set(key, arr)
  }

  function pickBest(entries) {
    // prioridad: cue > bin sin (Track N) > otros > primer track.bin
    const cue = entries.find(e => e.ext === '.cue')
    if (cue) return cue

    const nonTrackBin = entries.find(e => e.ext === '.bin' && !isTrackBin(e.base, e.ext))
    if (nonTrackBin) return nonTrackBin

    const order = ['.iso', '.img', '.mdf', '.pbp', '.chd']
    for (const ext of order) {
      const hit = entries.find(e => e.ext === ext)
      if (hit) return hit
    }

    const trackBins = entries.filter(e => isTrackBin(e.base, e.ext))
    if (trackBins.length) {
      const track01 = trackBins.find(e => /\(track\s*0*1\)\s*$/i.test(e.base))
      return track01 || trackBins[0]
    }

    return entries[0]
  }

  const result = []
  for (const [key, entries] of groups) {
    const chosen = pickBest(entries)

    // Carátula: busca tanto por basename real como por base normalizado
    let cover = null
    const tryBases = [join(dirname(chosen.path), chosen.base), join(dirname(chosen.path), chosen.normBase)]
    outer: for (const coverBase of tryBases) {
      for (const cext of COVER_EXTS) {
        const attempt = coverBase + cext
        try {
          const st = await fs.promises.stat(attempt)
          if (st.isFile()) {
            const encoded = encodeURIComponent(attempt)          // importante
            cover = `cover://${encoded}?t=${Date.now()}`         // opcional cache-buster
            break
          }

        } catch { }
      }
    }

    result.push({ ...chosen, coverUrl: cover })
  }

  result.sort((a, b) => a.name.localeCompare(b.name, 'es', { numeric: true }))
  return result
}

// --- IPC ---
ipcMain.handle('selectDirectory', async () => {
  const res = await dialog.showOpenDialog(win, { properties: ['openDirectory'] })
  if (res.canceled || !res.filePaths[0]) return null
  await writeSettings({ lastDir: res.filePaths[0] })
  return res.filePaths[0]
})

ipcMain.handle('scanDirectory', async (_e, dir) => {
  try {
    return await scanDirRecursive(dir)
  } catch (err) {
    dialog.showErrorBox('Error al escanear', String(err?.message || err))
    return []
  }
})

ipcMain.handle('getSettings', async () => readSettings())
ipcMain.handle('setSettings', async (_e, patch) => writeSettings(patch))

ipcMain.handle('selectEmulator', async () => {
  const res = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'pSX Emulator', extensions: ['exe'] },
      { name: 'Todos', extensions: ['*'] }
    ]
  })
  if (res.canceled || !res.filePaths[0]) return null
  const next = await writeSettings({ emulatorPath: res.filePaths[0] })
  return next
})

ipcMain.handle('launchRom', async (_e, romPath) => {
  const settings = await readSettings()
  if (!settings.emulatorPath) {
    dialog.showMessageBox(win, { type: 'warning', message: 'Primero configurá la ruta a psxfin.exe', buttons: ['OK'] })
    return { ok: false }
  }

  // Verificar si falta d3dx9_26.dll en la carpeta de Windows
  const system32 = process.env.WINDIR ? path.join(process.env.WINDIR, 'System32') : null;
  let directxMissing = false;
  if (system32) {
    try {
      await fs.promises.access(path.join(system32, 'd3dx9_26.dll'));
    } catch {
      directxMissing = true;
    }
  }

  if (directxMissing) {
    dialog.showMessageBox(win, {
      type: 'error',
      message: 'Falta el archivo d3dx9_26.dll (DirectX 9). Descarga e instala DirectX End-User Runtime desde el sitio oficial.',
      detail: 'https://www.microsoft.com/en-us/download/details.aspx?id=35',
      buttons: ['Abrir enlace', 'Cancelar']
    }).then(result => {
      if (result.response === 0) {
        require('electron').shell.openExternal('https://www.microsoft.com/en-us/download/details.aspx?id=35');
      }
    });
    return { ok: false }
  }

  const args = []
  if (settings.fullscreen) args.push('-f')
  if (settings.extraArgs && String(settings.extraArgs).trim().length) {
    args.push(...String(settings.extraArgs).split(' ').filter(Boolean))
  }
  args.push(romPath)

  try {
    const child = spawn(
      settings.emulatorPath,
      args,
      {
        cwd: dirname(settings.emulatorPath), // 👈 clave: trabajar dentro de la carpeta del emulador
        detached: true,
        stdio: 'ignore',
        windowsHide: true
      }
    )
    child.unref()
    return { ok: true }
  } catch (err) {
    dialog.showErrorBox('No se pudo abrir psxfin', String(err?.message || err))
    return { ok: false }
  }
})

ipcMain.handle('renameRom', async (_e, { oldPath, newName }) => {
  try {
    const dir = dirname(oldPath)
    const ext = extname(oldPath)
    const newPath = join(dir, newName + ext)

    // Renombrar ROM
    await fs.promises.rename(oldPath, newPath)

    // Si hay cover homónimo, renombrarlo también
    for (const cext of COVER_EXTS) {
      const oldCover = join(dir, basename(oldPath, ext) + cext)
      const newCover = join(dir, newName + cext)
      try {
        await fs.promises.rename(oldCover, newCover)
        break
      } catch { }
    }

    return { ok: true, newPath }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})

ipcMain.handle('setCover', async (_e, romPath) => {
  const dir = dirname(romPath)
  const base = basename(romPath, extname(romPath))

  const res = await dialog.showOpenDialog(win, {
    properties: ['openFile'],
    filters: [
      { name: 'Imágenes', extensions: ['jpg', 'jpeg', 'png', 'webp'] }
    ]
  })
  if (res.canceled || !res.filePaths[0]) return { ok: false }

  const src = res.filePaths[0]
  const dst = join(dir, base + extname(src).toLowerCase())

  try {
    await fs.promises.copyFile(src, dst)
    return { ok: true, coverPath: dst }
  } catch (err) {
    return { ok: false, error: String(err) }
  }
})
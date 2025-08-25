import TopBar from './components/TopBar'
import Sidebar from './components/Sidebar'
import Details from './components/Details'
import Cover from './components/Cover'
import SetupWizard from './components/SetupWizard'
import { AppProvider } from './context/AppContext'
import { useCallback, useEffect, useMemo, useState } from 'react'

export default function App() {
  const [settings, setSettings] = useState({ emulatorPath: '', lastDir: '', fullscreen: true, extraArgs: '', isConfigured: false })
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [dir, setDir] = useState('')
  const [selected, setSelected] = useState(null)
  const [showSetup, setShowSetup] = useState(false)
  const [step, setStep] = useState(1)
  const ctxValue = { settings, setSettings, dir, setDir }

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter(x => x.name.toLowerCase().includes(q))
  }, [items, filter])

  const refreshScan = useCallback(async (targetDir = dir) => {
    if (!targetDir) return
    const list = await window.api.scanDirectory(targetDir)
    setItems(list)
    if (selected) {
      const again = list.find(i => i.path === selected.path)
      setSelected(again || null)
    }
  }, [dir, selected])

  useEffect(() => {
    window.api.getSettings().then(async s => {
      setSettings(s)
      if (!s.isConfigured) setShowSetup(true)
      if (s.lastDir) {
        setDir(s.lastDir)
        const list = await window.api.scanDirectory(s.lastDir)
        setItems(list)
      }
    })
    // Context menu → “Refrescar”
    const off = window.api.onRefresh(async () => { await refreshScan() })
    return () => { if (typeof off === 'function') off() }
  }, [refreshScan])

  const pickDir = async () => {
    const d = await window.api.selectDirectory()
    if (!d) return
    setDir(d)
    await refreshScan(d)
  }

  const pickEmulator = async () => {
    const next = await window.api.selectEmulator()
    if (next) setSettings(next)
  }

  const toggleFullscreen = async () => {
    const next = await window.api.setSettings({ fullscreen: !settings.fullscreen })
    setSettings(next)
  }

  const setExtra = async (val) => {
    const next = await window.api.setSettings({ extraArgs: val })
    setSettings(next)
  }

  const onOpen = async (rom) => { await window.api.launchRom(rom.path) }

  const onRename = async (rom) => {
    const newName = prompt("Nuevo nombre:", rom.name.replace(rom.ext, ''))
    if (!newName) return
    const res = await window.api.renameRom(rom.path, newName)
    if (res.ok) refreshScan()
    else alert("Error al renombrar: " + res.error)
  }

  const onChangeCover = async (rom) => {
    const res = await window.api.setCover(rom.path)
    if (!res.ok && res.error) return alert("Error: " + res.error)
    await refreshScan()
    // re-seleccionar el mismo juego si sigue existiendo
    const again = (await window.api.scanDirectory(dir)).find(i => i.path === rom.path) || null
    setSelected(again)
  }
  const onCompress = async (rom) => {
    const res = await window.api.compressRom(rom.path)
    if (!res?.ok) return alert('No se pudo comprimir: ' + (res?.error || ''))

    await refreshScan()

    const list = await window.api.scanDirectory(dir)
    const base = rom.path.replace(/\.[^.]+$/, '')
    const cdz = list.find(i => i.path.toLowerCase() === (base + '.cdz').toLowerCase())
    setSelected(cdz || rom)

    if (cdz) {
      const ok = confirm('Compresión OK. ¿Borrar archivo original para liberar espacio?')
      if (ok) await window.api.deleteFile(rom.path) // necesitarías un IPC simple en main
      await refreshScan()
      //}
      alert('Juego comprimido a .cdz ✅')
    }
  }

  const onDeleteOriginal = async (rom) => {
    const ok = confirm('¿Mover a la Papelera el archivo original? Se conservará el .cdz homónimo.')
    if (!ok) return
    const res = await window.api.deleteFile(rom.path)
    if (!res?.ok) return alert(res?.error || 'No se pudo borrar')
    await refreshScan()
    // tras borrar, si existe el .cdz, re-seleccionarlo
    const list = await window.api.scanDirectory(dir)
    const base = rom.path.replace(/\.[^.]+$/, '')
    const cdz = list.find(i => i.path.toLowerCase() === (base + '.cdz').toLowerCase())
    setSelected(cdz || null)
    alert('Archivo original enviado a la Papelera ✅')
  }


  return (
    <AppProvider value={ctxValue}>
      <div className="h-screen w-screen flex">
        {/* Sidebar */}
        <Sidebar
          items={filtered}
          filter={filter}
          onFilterChange={setFilter}
          onPickDir={pickDir}
          selected={selected}
          onSelect={setSelected}
          onOpen={onOpen}
        />

        {/* Main */}
        <div className="flex-1 flex flex-col">
          <TopBar
            onOpenSetup={() => { setShowSetup(true); setStep(1) }}
            onPickEmulator={pickEmulator}
            onToggleFullscreen={toggleFullscreen}
            onExtraArgsChange={setExtra}
          />

          {/* actions under topbar */}
          {selected && (
            <div className="flex gap-2 mt-3 px-6">
              <button onClick={() => onRename(selected)} className="px-3 py-1 bg-zinc-700 rounded">
                Renombrar
              </button>
              <button onClick={() => onChangeCover(selected)} className="px-3 py-1 bg-zinc-700 rounded">
                Cambiar carátula
              </button>
            </div>
          )}

          <div className="p-6 grid grid-cols-2 gap-6 flex-1 overflow-auto">
            <Details
              selected={selected}
              onOpen={() => selected && onOpen(selected)}
              onCompress={() => selected && onCompress(selected)}
              onDeleteOriginal={() => selected && onDeleteOriginal(selected)}
            />
            <Cover coverUrl={selected?.coverUrl} />
          </div>
        </div>

        {/* Setup Wizard */}
        {showSetup && (
          <SetupWizard
            step={step}
            setStep={setStep}
            dir={dir}
            setDir={setDir}
            settings={settings}
            setSettings={setSettings}
            onPickDir={async () => {
              const d = await window.api.selectDirectory()
              if (d) {
                setDir(d)
                const next = await window.api.setSettings({ lastDir: d })
                setSettings(next)
              }
            }}
            onPickEmulator={async () => {
              const next = await window.api.selectEmulator()
              if (next) setSettings(next)
            }}
            onToggleFullscreen={async () => {
              const next = await window.api.setSettings({ fullscreen: !settings.fullscreen })
              setSettings(next)
            }}
            onExtraArgs={async (val) => {
              const next = await window.api.setSettings({ extraArgs: val })
              setSettings(next)
            }}
            onCancel={() => setShowSetup(false)}
            onFinish={async () => {
              if (!dir) return alert('Seleccioná la carpeta de juegos')
              if (!settings.emulatorPath) return alert('Seleccioná psxfin.exe')
              const next = await window.api.setSettings({ isConfigured: true })
              setSettings(next)
              setShowSetup(false)
              await refreshScan(dir)
            }}
          />
        )}
      </div>
    </AppProvider>
  )
}

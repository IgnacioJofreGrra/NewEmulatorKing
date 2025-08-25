import React, { useEffect, useMemo, useState } from 'react'
import Wizard from './Wizard'

export default function App() {
  const [settings, setSettings] = useState({ emulatorPath: '', lastDir: '', fullscreen: true, extraArgs: '' })
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [dir, setDir] = useState('')

  const [selected, setSelected] = useState(null)
  const [showSetup, setShowSetup] = useState(false);
  const [step, setStep] = useState(1);
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter(x => x.name.toLowerCase().includes(q))
  }, [items, filter])

  useEffect(() => {
    window.api.getSettings().then(s => {
      setSettings(s)
      if (!s.isConfigured) setShowSetup(true)
      if (s.lastDir) {
        setDir(s.lastDir)
        window.api.scanDirectory(s.lastDir).then(setItems)
      }
    })
    const off = window.api.onRefresh(async () => {
      if (dir) {
        const list = await window.api.scanDirectory(dir)
        setItems(list)
        if (selected) {
          const again = list.find(i => i.path === selected.path)
          setSelected(again || null)
        }
      }
    })
    return () => { if (typeof off === 'function') off() }
  }, [])

  const pickDir = async () => {
    const d = await window.api.selectDirectory()
    if (!d) return
    setDir(d)
    const list = await window.api.scanDirectory(d)
    setItems(list)
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

  const onOpen = async (rom) => {
    await window.api.launchRom(rom.path)
  }
  // Escuchar “Refrescar” del contexto

  return (
    <div className="h-screen w-screen flex">
      {/* Sidebar */}
      <div className="w-1/3 border-r border-zinc-800 flex flex-col">
        <div className="p-3 flex items-center gap-2 border-b border-zinc-800">
          <button onClick={pickDir} className="px-3 py-1.5 bg-zinc-800 rounded-xl hover:bg-zinc-700">Elegir carpeta</button>
          <input value={filter} onChange={e => setFilter(e.target.value)} placeholder="Filtrar..." className="flex-1 px-3 py-1.5 bg-zinc-900 rounded-xl outline-none border border-zinc-800" />
        </div>
        <div className="px-3 py-2 text-xs text-zinc-400">{dir || 'Sin carpeta seleccionada'}</div>
        <div className="flex-1 overflow-auto">
          {filtered.map(item => (
            <div key={item.path}
              onClick={() => setSelected(item)}
              onDoubleClick={() => onOpen(item)}
              className={`px-3 py-2 cursor-pointer hover:bg-zinc-800 ${selected?.path === item.path ? 'bg-zinc-800' : ''}`}>
              <div className="text-sm font-medium truncate">{item.name}</div>
              <div className="text-xs text-zinc-400 truncate">{item.path}</div>
            </div>
          ))}
          {filtered.length === 0 && (
            <div className="p-4 text-sm text-zinc-400">No se encontraron imágenes de disco en esta carpeta.</div>
          )}
        </div>
      </div>

      {/* Detail */}
      <div className="flex-1 flex flex-col">

        <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => { setShowSetup(true); setStep(1); }}
            className="px-3 py-1.5 bg-zinc-800 rounded-xl hover:bg-zinc-700"
          >
            Modo instalación
          </button>
          <button onClick={pickEmulator} className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500">Configurar psxfin.exe</button>
          <label className="flex items-center gap-2 text-sm">
            <input type="checkbox" checked={settings.fullscreen} onChange={toggleFullscreen} />
            Pantalla completa (-f)
          </label>
          <div className="flex items-center gap-2 text-sm">
            <span>Args extra:</span>
            <input value={settings.extraArgs || ''} onChange={e => setExtra(e.target.value)} placeholder="ej: -r"
              className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 w-64" />
          </div>
          <div className="ml-auto text-xs text-zinc-400">Doble click para abrir en pSX</div>
        </div>
        {selected && (
          <div className="flex gap-2 mt-3">
            <button
              onClick={async () => {
                const newName = prompt("Nuevo nombre:", selected.name.replace(selected.ext, ''))
                if (!newName) return
                const res = await window.api.renameRom(selected.path, newName)
                if (res.ok) {
                  // refrescar listado
                  const list = await window.api.scanDirectory(dir)
                  setItems(list)
                } else alert("Error al renombrar: " + res.error)
              }}
              className="px-3 py-1 bg-zinc-700 rounded"
            >Renombrar</button>

            <button
              onClick={async () => {
                const res = await window.api.setCover(selected.path)
                if (res.ok) {
                  const list = await window.api.scanDirectory(dir)
                  setItems(list)
                  setSelected(list.find(i => i.path === selected.path))
                } else if (res.error) alert("Error: " + res.error)
              }}
              className="px-3 py-1 bg-zinc-700 rounded"
            >Cambiar carátula</button>
          </div>
        )}
        <div className="p-6 grid grid-cols-2 gap-6 flex-1 overflow-auto">
          <div>
            <div className="text-lg font-semibold mb-2">Detalles</div>
            {selected ? (
              <div className="space-y-2 text-sm">
                <div><span className="text-zinc-400">Nombre:</span> {selected.name}</div>
                <div className="break-all"><span className="text-zinc-400">Ruta:</span> {selected.path}</div>
                <button onClick={() => onOpen(selected)} className="mt-4 px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500">Abrir ahora</button>
              </div>
            ) : (
              <div className="text-sm text-zinc-400">Elegí un juego a la izquierda…</div>
            )}
          </div>
          <div>
            <div className="text-lg font-semibold mb-2">Carátula</div>
            <div className="aspect-video w-full bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden">
              {selected?.coverUrl ? (
                <img src={selected.coverUrl} alt="cover" className="w-full h-full object-contain" />
              ) : (
                <div className="text-sm text-zinc-500">Sin carátula homónima</div>
              )}
            </div>
          </div>
        </div>
      </div>
      {showSetup && (
        <Wizard
          showSetup={showSetup}
          step={step}
          setStep={setStep}
          settings={settings}
          setSettings={setSettings}
          setShowSetup={setShowSetup}
          setItems={setItems}
        />
      )}

    </div>
  )
}

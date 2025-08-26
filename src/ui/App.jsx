import React, { useEffect, useMemo, useState } from 'react'
import Wizard from './Wizard'
import ControlsConfig from './ControlsConfig'
import GamepadConfig from './GamepadConfig'

export default function App() {
  const [settings, setSettings] = useState({ emulatorPath: '', lastDir: '', fullscreen: true, extraArgs: '' })
  const [items, setItems] = useState([])
  const [filter, setFilter] = useState('')
  const [dir, setDir] = useState('')

  const [selected, setSelected] = useState(null)
  const [showSetup, setShowSetup] = useState(false);
  const [step, setStep] = useState(1);
  const [showControls, setShowControls] = useState(false);
  const [showGamepad, setShowGamepad] = useState(false);
  const [biosMissing, setBiosMissing] = useState(false);
  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase()
    if (!q) return items
    return items.filter(x => x.name.toLowerCase().includes(q))
  }, [items, filter])

  useEffect(() => {
    window.api.getSettings().then(async s => {
      setSettings(s)
      if (!s.isConfigured) setShowSetup(true)
      if (s.lastDir) {
        setDir(s.lastDir)
        window.api.scanDirectory(s.lastDir).then(setItems)
      }
      if (s.emulatorPath) {
        // reconstruí la ruta biosDir sin usar path para evitar errores en npm run dev
        const exePath = s.emulatorPath;
        const biosDir = exePath ? exePath.replace(/\\[^\\]+$/, '\\bios') : '';
        try {
          const biosFiles = await window.api.listBiosFiles(biosDir);
          setBiosMissing(!biosFiles.some(f => f.endsWith('.bin')));
        } catch {
          setBiosMissing(true);
        }
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
  const handleOpenBiosDir = async () => {
    const exePath = settings.emulatorPath;
    const biosDir = exePath ? exePath.replace(/\\[^\\]+$/, '\\bios') : '';
    if (biosDir && window.api.openFolder) {
      await window.api.openFolder(biosDir);
    }
  };

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

      {/* Alerta BIOS */}
      {biosMissing && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl p-8 max-w-md">
            <div className="text-lg font-semibold mb-2">Falta el archivo BIOS</div>
            <div className="text-sm text-zinc-400 mb-4">El emulador requiere un archivo BIOS (por ejemplo, SCPH1001.bin) en la carpeta <b>bios</b> junto al ejecutable.<br/>Agrega el archivo y vuelve a intentar.</div>
            <button
              onClick={handleOpenBiosDir}
              className="px-4 py-2 bg-indigo-600 rounded-xl hover:bg-indigo-500 text-white"
            >
              Abrir carpeta BIOS
            </button>
          </div>
        </div>
      )}
      <div className="flex-1 flex flex-col">

        <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
          <button
            onClick={() => { setShowSetup(true); setStep(1); }}
            className="px-3 py-1.5 bg-zinc-800 rounded-xl hover:bg-zinc-700"
          >
            Modo instalación
          </button>
          <button onClick={pickEmulator} className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500">Configurar psxfin.exe</button>
          <button
            onClick={() => setShowControls(true)}
            className="px-3 py-1.5 bg-zinc-700 rounded-xl hover:bg-zinc-600"
          >
            Configurar controles
          </button>
          <button
            onClick={() => setShowGamepad(true)}
            className="px-3 py-1.5 bg-zinc-700 rounded-xl hover:bg-zinc-600"
          >
            Configurar gamepad
          </button>
      {showGamepad && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div>
            <GamepadConfig />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowGamepad(false)}
                className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 text-zinc-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
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
      {showControls && (
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div>
            <ControlsConfig />
            <div className="flex justify-end mt-4">
              <button
                onClick={() => setShowControls(false)}
                className="px-4 py-2 bg-zinc-800 rounded-xl hover:bg-zinc-700 text-zinc-300"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  )
}

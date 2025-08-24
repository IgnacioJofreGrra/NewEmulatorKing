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
        <div className="fixed inset-0 bg-black/70 z-50 flex items-center justify-center">
          <div className="w-[720px] bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl">
            <div className="p-5 border-b border-zinc-800 flex items-center justify-between">
              <div className="text-lg font-semibold">Instalación</div>
              <div className="text-sm text-zinc-400">Paso {step} de 3</div>
            </div>

            <div className="p-6 space-y-4">
              {step === 1 && (
                <>
                  <div className="text-base font-medium">1) Elegí la carpeta de juegos</div>
                  <div className="text-sm text-zinc-400">Se usará para escanear tus ISOs/CUEs.</div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={async () => {
                        const d = await window.api.selectDirectory()
                        if (!d) return
                        setDir(d)
                        const next = await window.api.setSettings({ lastDir: d })
                        setSettings(next)
                      }}
                      className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500"
                    >
                      Seleccionar carpeta
                    </button>
                    <div className="text-sm text-zinc-300 truncate max-w-[420px]">
                      {dir || 'Sin seleccionar'}
                    </div>
                  </div>
                </>
              )}

              {step === 2 && (
                <>
                  <div className="text-base font-medium">2) Seleccioná psxfin.exe</div>
                  <div className="text-sm text-zinc-400">Ruta del emulador pSX (psxfin.exe).</div>
                  <div className="flex gap-2 items-center">
                    <button
                      onClick={async () => {
                        const next = await window.api.selectEmulator()
                        if (next) setSettings(next)
                      }}
                      className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500"
                    >
                      Elegir ejecutable
                    </button>
                    <div className="text-sm text-zinc-300 truncate max-w-[420px]">
                      {settings.emulatorPath || 'Sin seleccionar'}
                    </div>
                  </div>
                </>
              )}

              {step === 3 && (
                <>
                  <div className="text-base font-medium">3) Opciones</div>
                  <div className="flex items-center gap-3 mt-2">
                    <label className="flex items-center gap-2 text-sm">
                      <input
                        type="checkbox"
                        checked={settings.fullscreen}
                        onChange={async () => {
                          const next = await window.api.setSettings({ fullscreen: !settings.fullscreen })
                          setSettings(next)
                        }}
                      />
                      Pantalla completa (-f)
                    </label>
                    <div className="flex items-center gap-2 text-sm">
                      <span>Args extra:</span>
                      <input
                        value={settings.extraArgs || ''}
                        onChange={async (e) => {
                          const next = await window.api.setSettings({ extraArgs: e.target.value })
                          setSettings(next)
                        }}
                        placeholder="ej: -r"
                        className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 w-64"
                      />
                    </div>
                  </div>
                </>
              )}
            </div>

            <div className="p-5 border-t border-zinc-800 flex items-center justify-between">
              <button onClick={() => setShowSetup(false)} className="px-3 py-1.5 text-zinc-300 hover:text-white">
                Cancelar
              </button>
              <div className="flex gap-2">
                <button
                  disabled={step === 1}
                  onClick={() => setStep(step - 1)}
                  className={`px-3 py-1.5 rounded-xl ${step === 1 ? 'bg-zinc-800 text-zinc-500' : 'bg-zinc-800 hover:bg-zinc-700'}`}
                >
                  Atrás
                </button>
                {step < 3 ? (
                  <button
                    onClick={() => setStep(step + 1)}
                    className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500"
                  >
                    Siguiente
                  </button>
                ) : (
                  <button
                    onClick={async () => {
                      // Validaciones mínimas
                      if (!dir) return alert('Seleccioná la carpeta de juegos')
                      if (!settings.emulatorPath) return alert('Seleccioná psxfin.exe')

                      const next = await window.api.setSettings({ isConfigured: true })
                      setSettings(next)
                      setShowSetup(false)

                      // Escaneo inicial
                      const list = await window.api.scanDirectory(dir)
                      setItems(list)
                    }}
                    className="px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500"
                  >
                    Finalizar
                  </button>
                )}
              </div>
            </div>
          </div>
        </div>
      )
      }

    </div>
  )
}

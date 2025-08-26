import React, { useEffect, useMemo, useState, useCallback } from 'react';

import Wizard from './Wizard';
import ControlsConfig from './ControlsConfig';
import GamepadConfig from './GamepadConfig';
import TopBar from './components/TopBar';
import Sidebar from './components/Sidebar';
import Details from './components/Details';
import Cover from './components/Cover';
import SetupWizard from './components/SetupWizard';
import { AppProvider } from './context/AppContext';

export default function App() {
  const [settings, setSettings] = useState({ emulatorPath: '', lastDir: '', fullscreen: true, extraArgs: '', isConfigured: false });
  const [items, setItems] = useState([]);
  const [filter, setFilter] = useState('');
  const [dir, setDir] = useState('');
  const [selected, setSelected] = useState(null);
  const [showSetup, setShowSetup] = useState(false);
  const [step, setStep] = useState(1);
  const ctxValue = { settings, setSettings, dir, setDir };

  const [showControls, setShowControls] = useState(false);
  const [showGamepad, setShowGamepad] = useState(false);
  const [biosMissing, setBiosMissing] = useState(false);

  const filtered = useMemo(() => {
    const q = filter.trim().toLowerCase();
    if (!q) return items;
    return items.filter(x => x.name.toLowerCase().includes(q));
  }, [items, filter]);

  const refreshScan = useCallback(async (targetDir = dir) => {
    if (!targetDir) return;
    const list = await window.api.scanDirectory(targetDir);
    setItems(list);
    if (selected) {
      const again = list.find(i => i.path === selected.path);
      setSelected(again || null);
    }
  }, [dir, selected]);

  useEffect(() => {
    window.api.getSettings().then(async s => {
      setSettings(s);
      if (!s.isConfigured) setShowSetup(true);
      if (s.lastDir) {
        setDir(s.lastDir);
        window.api.scanDirectory(s.lastDir).then(setItems);
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
    });
    const off = window.api.onRefresh(async () => {
      if (dir) {
        const list = await window.api.scanDirectory(dir);
        setItems(list);
      }
    });
    // Context menu → “Refrescar”
    const off2 = window.api.onRefresh(async () => { await refreshScan(); });
    return () => { if (typeof off === 'function') off(); if (typeof off2 === 'function') off2(); };
  }, [refreshScan]);

  const handleOpenBiosDir = async () => {
    const exePath = settings.emulatorPath;
    const biosDir = exePath ? exePath.replace(/\\[^\\]+$/, '\\bios') : '';
    if (biosDir && window.api.openFolder) {
      await window.api.openFolder(biosDir);
    }
  };

  const pickDir = async () => {
    const d = await window.api.selectDirectory();
    if (!d) return;
    setDir(d);
    await refreshScan(d);
  };

  const pickEmulator = async () => {
    const next = await window.api.selectEmulator();
    if (next) setSettings(next);
  };

  const toggleFullscreen = async () => {
    const next = await window.api.setSettings({ fullscreen: !settings.fullscreen });
    setSettings(next);
  };

  const setExtra = async (val) => {
    const next = await window.api.setSettings({ extraArgs: val });
    setSettings(next);
  };

  const onOpen = async (rom) => {
    await window.api.launchRom(rom.path);
  };

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
            onOpenSetup={() => { setShowSetup(true); setStep(1); }}
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
            <div className="text-sm text-zinc-400 mb-4">
              El emulador requiere un archivo BIOS (por ejemplo, SCPH1001.bin) en la carpeta <b>bios</b> junto al ejecutable.<br />
              Agrega el archivo y vuelve a intentar.
            </div>
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
                const newName = prompt("Nuevo nombre:", selected.name.replace(selected.ext, ''));
                if (!newName) return;
                const res = await window.api.renameRom(selected.path, newName);
                if (res.ok) {
                  const list = await window.api.scanDirectory(dir);
                  setItems(list);
                } else alert("Error al renombrar: " + res.error);
              }}
              className="px-3 py-1 bg-zinc-700 rounded"
            >Renombrar</button>
            <button
              onClick={async () => {
                const res = await window.api.setCover(selected.path);
                if (res.ok) {
                  const list = await window.api.scanDirectory(dir);
                  setItems(list);
                  setSelected(list.find(i => i.path === selected.path));
                } else if (res.error) alert("Error: " + res.error);
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
              const d = await window.api.selectDirectory();
              if (d) {
                setDir(d);
                const next = await window.api.setSettings({ lastDir: d });
                setSettings(next);
              }
            }}
            onPickEmulator={async () => {
              const next = await window.api.selectEmulator();
              if (next) setSettings(next);
            }}
            onToggleFullscreen={async () => {
              const next = await window.api.setSettings({ fullscreen: !settings.fullscreen });
              setSettings(next);
            }}
            onExtraArgs={async (val) => {
              const next = await window.api.setSettings({ extraArgs: val });
              setSettings(next);
            }}
            onCancel={() => setShowSetup(false)}
            onFinish={async () => {
              if (!dir) return alert('Seleccioná la carpeta de juegos');
              if (!settings.emulatorPath) return alert('Seleccioná psxfin.exe');
              const next = await window.api.setSettings({ isConfigured: true });
              setSettings(next);
              setShowSetup(false);
              await refreshScan(dir);
            }}
          />
        )}
      </div>
      {/* Wizard */}
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
      {/* Controls Config */}
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
    </AppProvider>
  );
}
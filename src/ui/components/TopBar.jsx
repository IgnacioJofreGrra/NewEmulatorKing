
import { useApp } from '../context/AppContext'

export default function TopBar({ onOpenSetup, onPickEmulator, onToggleFullscreen, onExtraArgsChange }) {
    const { settings } = useApp()
    return (
        <div className="p-3 border-b border-zinc-800 flex items-center gap-3">
            <button onClick={onOpenSetup} className="px-3 py-1.5 bg-zinc-800 rounded-xl hover:bg-zinc-700">
                Modo instalación
            </button>
            <button onClick={onPickEmulator} className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500">
                Configurar psxfin.exe
            </button>
            <label className="flex items-center gap-2 text-sm">
                <input type="checkbox" checked={settings.fullscreen} onChange={onToggleFullscreen} />
                Pantalla completa (-f)
            </label>
            <div className="flex items-center gap-2 text-sm">
                <span>Args extra:</span>
                <input
                    value={settings.extraArgs || ''}
                    onChange={e => onExtraArgsChange(e.target.value)}
                    placeholder="ej: -r"
                    className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 w-64"
                />
            </div>
            <div className="ml-auto text-xs text-zinc-400">Doble click para abrir en pSX</div>
        </div>
    )
}

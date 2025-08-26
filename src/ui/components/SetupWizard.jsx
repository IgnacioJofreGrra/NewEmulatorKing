import { useApp } from '../context/AppContext'

export default function SetupWizard({
    step, setStep,
    onPickDir, onPickEmulator, onToggleFullscreen, onExtraArgs,
    onCancel, onFinish
}) {
    const { dir, settings } = useApp()
    return (
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
                                <button onClick={onPickDir} className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500">
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
                                <button onClick={onPickEmulator} className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500">
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
                                    <input type="checkbox" checked={settings.fullscreen} onChange={onToggleFullscreen} />
                                    Pantalla completa (-f)
                                </label>
                                <div className="flex items-center gap-2 text-sm">
                                    <span>Args extra:</span>
                                    <input
                                        value={settings.extraArgs || ''}
                                        onChange={e => onExtraArgs(e.target.value)}
                                        placeholder="ej: -r"
                                        className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 w-64"
                                    />
                                </div>
                            </div>
                        </>
                    )}
                </div>

                <div className="p-5 border-t border-zinc-800 flex items-center justify-between">
                    <button onClick={onCancel} className="px-3 py-1.5 text-zinc-300 hover:text-white">
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
                            <button onClick={() => setStep(step + 1)} className="px-3 py-1.5 bg-indigo-600 rounded-xl hover:bg-indigo-500">
                                Siguiente
                            </button>
                        ) : (
                            <button onClick={onFinish} className="px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500">
                                Finalizar
                            </button>
                        )}
                    </div>
                </div>
            </div>
        </div>
    )
}

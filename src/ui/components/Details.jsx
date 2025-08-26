import { useEffect, useState } from 'react'

export default function Details({ selected, onOpen, onCompress, onDeleteOriginal }) {
    const [busy, setBusy] = useState(false)
    const isCdz = selected && /\.cdz$/i.test(selected.path)
    const [progress, setProgress] = useState(null)
    useEffect(() => {
        const off = window.api.onCompressProgress((p) => {
            setProgress(p)
        })
        return () => off && off()
    }, [])

    const handleCompress = async () => {
        try {
            setBusy(true)
            await onCompress()
        } finally {
            setBusy(false)
        }
    }

    const handleDelete = async () => {
        try { setBusy(true); await onDeleteOriginal() } finally { setBusy(false) }
    }

    return (
        <div>
            <div className="text-lg font-semibold mb-2">Detalles</div>
            {selected ? (
                <div className="space-y-2 text-sm">
                    <div><span className="text-zinc-400">Nombre:</span> {selected.name}</div>
                    <div className="break-all"><span className="text-zinc-400">Ruta:</span> {selected.path}</div>

                    <button
                        onClick={onOpen}
                        className="mt-4 px-3 py-1.5 bg-green-600 rounded-xl hover:bg-green-500 disabled:opacity-60"
                        disabled={busy}
                    >
                        Abrir ahora
                    </button>
                    &nbsp;

                    {!isCdz && (
                        <>
                            <button
                                onClick={handleCompress}
                                className="mt-2 px-3 py-1.5 bg-zinc-700 rounded-xl hover:bg-zinc-600 disabled:opacity-60"
                                title="Convierte el juego a .cdz usando pSX fin"
                                disabled={busy}
                            >
                                {busy ? 'Comprimiendo…' : 'Comprimir'}
                            </button>
                            <button
                                onClick={handleDelete}
                                className="mt-2 ml-2 px-3 py-1.5 bg-red-700 rounded-xl hover:bg-red-600 disabled:opacity-60"
                                title="Mover a la Papelera el archivo original (requiere .cdz homónimo)"
                                disabled={busy}
                            >
                                Eliminar original
                            </button>

                            <p className="text-zinc-400">
                                Comprimir te ahorra espacio. Después, podés eliminar el original: se conserva el .cdz.
                            </p>

                        </>
                    )}
                    {busy && (
                        <div className="mt-2 w-full bg-zinc-800 h-4 rounded overflow-hidden">
                            <div
                                className="bg-green-600 h-4"
                                style={{ width: `${progress || 0}%` }}
                            />
                        </div>
                    )}
                </div>
            ) : (
                <div className="text-sm text-zinc-400">Elegí un juego a la izquierda…</div>
            )}
        </div>
    )
}

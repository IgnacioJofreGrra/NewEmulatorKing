import { useApp } from '../context/AppContext'

export default function Sidebar({ items, filter, onFilterChange, onPickDir, selected, onSelect, onOpen }) {
    const { dir } = useApp()
    return (
        <div className="w-1/3 border-r border-zinc-800 flex flex-col">
            <div className="p-3 flex items-center gap-2 border-b border-zinc-800">
                <button onClick={onPickDir} className="px-3 py-1.5 bg-zinc-800 rounded-xl hover:bg-zinc-700">
                    Elegir carpeta
                </button>
                <input
                    value={filter}
                    onChange={e => onFilterChange(e.target.value)}
                    placeholder="Filtrar..."
                    className="flex-1 px-3 py-1.5 bg-zinc-900 rounded-xl outline-none border border-zinc-800"
                />
            </div>
            <div className="px-3 py-2 text-xs text-zinc-400">{dir || 'Sin carpeta seleccionada'}</div>
            <div className="flex-1 overflow-auto">
                {items.map(item => (
                    <div
                        key={item.path}
                        onClick={() => onSelect(item)}
                        onDoubleClick={() => onOpen(item)}
                        className={`px-3 py-2 cursor-pointer hover:bg-zinc-800 ${selected?.path === item.path ? 'bg-zinc-800' : ''}`}
                    >
                        <div className="text-sm font-medium truncate">{item.name}</div>
                        <div className="text-xs text-zinc-400 truncate">{item.path}</div>
                    </div>
                ))}
                {items.length === 0 && (
                    <div className="p-4 text-sm text-zinc-400">No se encontraron imágenes de disco en esta carpeta.</div>
                )}
            </div>
        </div>
    )
}

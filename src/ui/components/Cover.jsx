
export default function Cover({ coverUrl }) {
  return (
    <div>
      <div className="text-lg font-semibold mb-2">Carátula</div>
      <div className="aspect-video w-full bg-zinc-900 rounded-xl border border-zinc-800 flex items-center justify-center overflow-hidden">
        {coverUrl ? (
          <img src={coverUrl} alt="cover" className="w-full h-full object-contain" />
        ) : (
          <div className="text-sm text-zinc-500">Sin carátula homónima</div>
        )}
      </div>
    </div>
  )
}

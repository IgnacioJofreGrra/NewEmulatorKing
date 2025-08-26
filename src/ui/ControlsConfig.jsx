import React, { useEffect, useState } from "react";

const DEFAULT_KEYS = {
  "Up": "W",
  "Down": "S",
  "Left": "A",
  "Right": "D",
  "Triangle": "I",
  "Circle": "O",
  "Cross": "K",
  "Square": "J",
  "Start": "Enter",
  "Select": "Shift",
};

function parseIni(ini) {
  const lines = ini.split(/\r?\n/);
  const keys = { ...DEFAULT_KEYS };
  lines.forEach(line => {
    const match = line.match(/^(\w+)=(\w+)$/);
    if (match) keys[match[1]] = match[2];
  });
  return keys;
}

function serializeIni(keys) {
  return Object.entries(keys)
    .map(([k, v]) => `${k}=${v}`)
    .join("\n");
}

export default function ControlsConfig() {
  const [keys, setKeys] = useState(DEFAULT_KEYS);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    window.api.readIni().then(content => {
      setKeys(parseIni(content));
      setLoading(false);
    }).catch(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setKeys(prev => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setLoading(true);
    await window.api.writeIni(serializeIni(keys));
    setMsg("¡Controles guardados!");
    setLoading(false);
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl mt-8">
      <div className="text-lg font-semibold mb-4">Configurar controles</div>
      {loading ? (
        <div className="text-zinc-400">Cargando…</div>
      ) : (
        <form className="space-y-4">
          {Object.entries(keys).map(([key, value]) => (
            <div key={key} className="flex items-center gap-3">
              <label className="w-32 text-zinc-300">{key}</label>
              <input
                type="text"
                value={value}
                maxLength={1}
                onChange={e => handleChange(key, e.target.value.toUpperCase())}
                className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 w-16 text-center"
              />
            </div>
          ))}
          <button
            type="button"
            onClick={handleSave}
            className="mt-6 px-4 py-2 bg-green-600 rounded-xl hover:bg-green-500 text-white"
            disabled={loading}
          >
            Guardar cambios
          </button>
          {msg && <div className="mt-2 text-green-400">{msg}</div>}
        </form>
      )}
    </div>
  );
}

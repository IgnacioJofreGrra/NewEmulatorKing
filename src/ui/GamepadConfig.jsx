import React, { useEffect, useState } from "react";

const ACTIONS = [
  "Up", "Down", "Left", "Right",
  "Triangle", "Circle", "Cross", "Square",
  "Start", "Select"
];

export default function GamepadConfig() {
  const [gamepads, setGamepads] = useState([]);
  const [mapping, setMapping] = useState({});
  const [listening, setListening] = useState(null);
  const [msg, setMsg] = useState("");

  useEffect(() => {
    const updateGamepads = () => {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      setGamepads(pads);
    };
    window.addEventListener("gamepadconnected", updateGamepads);
    window.addEventListener("gamepaddisconnected", updateGamepads);
    updateGamepads();
    return () => {
      window.removeEventListener("gamepadconnected", updateGamepads);
      window.removeEventListener("gamepaddisconnected", updateGamepads);
    };
  }, []);

  useEffect(() => {
    if (!listening) return;
    const handle = setInterval(() => {
      const pads = navigator.getGamepads ? Array.from(navigator.getGamepads()).filter(Boolean) : [];
      if (pads.length) {
        const pad = pads[0];
        pad.buttons.forEach((btn, idx) => {
          if (btn.pressed) {
            setMapping(prev => ({ ...prev, [listening]: `Button ${idx}` }));
            setListening(null);
            setMsg(`Asignado a Button ${idx}`);
            setTimeout(() => setMsg(""), 1500);
          }
        });
        pad.axes.forEach((axis, idx) => {
          if (Math.abs(axis) > 0.7) {
            setMapping(prev => ({ ...prev, [listening]: `Axis ${idx} (${axis > 0 ? "+" : "-"})` }));
            setListening(null);
            setMsg(`Asignado a Axis ${idx}`);
            setTimeout(() => setMsg(""), 1500);
          }
        });
      }
    }, 100);
    return () => clearInterval(handle);
  }, [listening]);

  const handleListen = (action) => {
    setListening(action);
    setMsg(`Presiona el botón o mueve el eje para asignar a ${action}`);
  };

  const handleSave = async () => {
    setMsg("Configuración guardada (solo visual, falta integración con .ini)");
    setTimeout(() => setMsg(""), 2000);
  };

  return (
    <div className="p-6 max-w-xl mx-auto bg-zinc-950 border border-zinc-800 rounded-2xl shadow-xl mt-8">
      <div className="text-lg font-semibold mb-4">Configurar controles físicos (Gamepad)</div>
      {gamepads.length === 0 ? (
        <div className="text-zinc-400">Conecta un gamepad para comenzar…</div>
      ) : (
        <form className="space-y-4">
          {ACTIONS.map(action => (
            <div key={action} className="flex items-center gap-3">
              <label className="w-32 text-zinc-300">{action}</label>
              <input
                type="text"
                value={mapping[action] || ""}
                readOnly
                className="px-2 py-1 bg-zinc-900 rounded border border-zinc-800 w-32 text-center"
              />
              <button
                type="button"
                onClick={() => handleListen(action)}
                className="px-2 py-1 bg-indigo-600 rounded-xl hover:bg-indigo-500 text-white"
                disabled={!!listening}
              >
                Asignar
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={handleSave}
            className="mt-6 px-4 py-2 bg-green-600 rounded-xl hover:bg-green-500 text-white"
            disabled={!!listening}
          >
            Guardar configuración
          </button>
          {msg && <div className="mt-2 text-green-400">{msg}</div>}
        </form>
      )}
    </div>
  );
}

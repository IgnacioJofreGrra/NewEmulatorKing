# PSX Launcher (Electron + React) — Fixed

### Cambios clave
- **Preload en CommonJS (`electron/preload.cjs`)** para evitar `Cannot use import statement outside a module`.
- **`vite.config.js` con `base: './'`** para que los assets hashed carguen en el build empaquetado (file://).
- **Detección de entorno** con `app.isPackaged` en vez de `VITE_DEV_SERVER_URL`.

## Dev
```bash
npm i
npm run dev
```
## Build
```bash
npm run build
```

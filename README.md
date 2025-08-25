
# PSX Launcher (Electron + React)

## Instrucciones para instalar y jugar

### 1. Clona el repositorio

```sh
git clone https://github.com/rapis94/NewEmulatorKing.git
cd NewEmulatorKing
npm install
```

### 2. Descarga y descomprime el emulador pSX

- Descarga el archivo desde el siguiente enlace:
	[pSX_1_13.exe (Mediafire)](https://www.mediafire.com/file/7oye0hu8dn10dgk/pSX_1_13.exe/file)

- El archivo descargado estará comprimido. Para descomprimirlo:
	1. Instala [7zip](https://www.7-zip.org/download.html) si no lo tienes.
	2. Haz clic derecho sobre el archivo descargado (`pSX_1_13.exe`).
	3. Selecciona “7-Zip” > “Extraer aquí” o “Extraer en pSX_1_13”.
	4. Coloca el ejecutable descomprimido en una carpeta, por ejemplo:
		 `C:\Emuladores\pSX_1_13\psxfin.exe`

### 3. Descarga y descomprime los juegos

- Descarga el archivo desde el siguiente enlace:
	[psx.7z (Mediafire)](https://www.mediafire.com/file/wud0zd6g22l5b1o/psx.7z/file)

- Para descomprimirlo:
	1. Haz clic derecho sobre el archivo descargado (`psx.7z`).
	2. Selecciona “7-Zip” > “Extraer aquí” o “Extraer en psx”.
	3. Coloca la carpeta descomprimida en una ubicación, por ejemplo:
		 `C:\Juegos\PSX\psx\`

### 4. Ejecuta el launcher

```sh
npm run dev
```
o para la versión empaquetada:
```sh
npm run build
```

### 5. Configura el launcher

- Al abrir el launcher, sigue el asistente de instalación:
	1. Selecciona la carpeta de juegos:
		 `C:\Juegos\PSX\psx\`
	2. Selecciona el ejecutable del emulador:
		 `C:\Emuladores\pSX_1_13\psxfin.exe`
	3. Configura las opciones que prefieras (pantalla completa, argumentos extra).
	4. Finaliza la instalación.

### 6. ¡Juega!

- Verás la lista de tus juegos en la interfaz.
- Haz doble clic en el juego que quieras o pulsa “Abrir ahora”.

---

**Notas importantes:**
- Si el emulador muestra un error sobre DirectX, instala [DirectX End-User Runtime](https://www.microsoft.com/en-us/download/details.aspx?id=35).
- Si el emulador pide un archivo BIOS, colócalo en la carpeta `bios` dentro de la carpeta del emulador.
- Para descomprimir archivos `.7z`, siempre usa 7zip.

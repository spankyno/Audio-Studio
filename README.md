# 🎛️ Audio Studio

**Editor de audio online profesional** con Web Audio API, edición multipista, efectos en tiempo real, ecualizador gráfico paramétrico y exportación multiformato.

Procesamiento 100% local en el navegador — sin servidores externos, sin IA, con total privacidad.

## ✨ Características

- **Multipista**: Añade, edita, silencia (MUTE) y aísla (SOLO) pistas independientes
- **Edición completa**: Cortar, copiar, pegar, eliminar, silenciar, recortar, dividir y duplicar fragmentos
- **Rack de 11 efectos**: Reverb, Delay, Eco, Distorsión, Overdrive, Chorus, Flanger, Phaser, Trémolo, Vibrato, Bitcrusher
- **Ecualizador paramétrico 7 bandas** con curva de respuesta en frecuencia y presets profesionales
- **Procesamiento avanzado**: Normalización, fade in/out, cambio de velocidad y tono (pitch shift), compresor dinámico, puerta de ruido, eliminación de silencios, gestión de canales
- **Exportación WAV** (16-bit, 24-bit, 32-bit Float PCM), MP3, FLAC, OGG y AAC
- **Proyectos**: Guardado y carga mediante IndexedDB local + exportación/importación de archivo `.audiostudio.json`
- **Deshacer / Rehacer** (Ctrl+Z / Ctrl+Y) con historial de 15 pasos
- **Muestras de demostración**: Synthwave & Bass, Acústico & Acordes, Ambiente & Texturas

## 🚀 Ejecutar localmente

**Requisitos previos:** Node.js 18+ y pnpm (o npm)

```bash
# 1. Instalar dependencias
pnpm install

# 2. Iniciar servidor de desarrollo
pnpm run dev
```

La aplicación estará disponible en [http://localhost:3000](http://localhost:3000)

## 🏗️ Tecnologías

- **React 19** + **TypeScript** — UI reactiva y tipado estático
- **Vite 8** + **Tailwind CSS 4** — bundler rápido y estilos modernos
- **Web Audio API** — motor de procesamiento de audio nativo del navegador
- **OfflineAudioContext** — renderizado de efectos DSP sin reproducción
- **IndexedDB** — almacenamiento de proyectos local persistente
- **Canvas 2D** — visualización de forma de onda de alto rendimiento y ecualizador gráfico

## ⌨️ Atajos de teclado

| Tecla | Acción |
|-------|--------|
| `Espacio` | Play / Pause |
| `Ctrl+Z` | Deshacer |
| `Ctrl+Y` / `Ctrl+Shift+Z` | Rehacer |
| `Ctrl+X` | Cortar selección |
| `Ctrl+C` | Copiar selección |
| `Ctrl+V` | Pegar |
| `Ctrl+A` | Seleccionar todo |
| `Supr` / `Backspace` | Eliminar selección |
| `Esc` | Limpiar selección |
| `Ctrl+Rueda` | Zoom horizontal |

## 📄 Licencia

© 2026 Aitor Sánchez Gutiérrez — Todos los derechos reservados.

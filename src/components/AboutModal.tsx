import React from 'react';
import {
  X,
  Sliders,
  Cpu,
  Layers,
  Sparkles,
  Download,
  Keyboard,
  ExternalLink,
  Activity,
} from 'lucide-react';

interface AboutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const AboutModal: React.FC<AboutModalProps> = ({ isOpen, onClose }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm overflow-y-auto">
      <div className="w-full max-w-4xl bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden text-neutral-200 my-8">
        {/* Header Bar */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-neutral-800 bg-neutral-950/70">
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 flex items-center justify-center text-neutral-950 font-black shadow-md shadow-amber-500/20">
              <Sliders className="w-5 h-5 text-neutral-950 stroke-[2.5]" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-white tracking-tight">Acerca de Audio Studio</h2>
              <p className="text-xs text-neutral-400">Estación de trabajo y edición de audio digital profesional en el navegador</p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-1.5 text-neutral-400 hover:text-white rounded-lg hover:bg-neutral-800 transition-colors"
            title="Cerrar ventana"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="p-6 space-y-6 max-h-[80vh] overflow-y-auto">
          {/* Banner with OG Image */}
          <div className="relative rounded-xl overflow-hidden border border-neutral-800 shadow-xl bg-neutral-950">
            <img
              src="/og-image.png"
              alt="Audio Studio — Interfaz de edición digital de audio con ondas estéreo y ecualizador"
              className="w-full h-56 sm:h-72 object-cover"
              referrerPolicy="no-referrer"
            />
            <div className="absolute inset-0 bg-gradient-to-t from-neutral-950 via-neutral-950/40 to-transparent flex flex-col justify-end p-6">
              <span className="text-xs font-mono text-amber-400 font-semibold uppercase tracking-wider mb-1">
                Audio Digital · Web Audio API · 2026
              </span>
              <h3 className="text-xl sm:text-2xl font-bold text-white tracking-tight">
                Potencia de estudio, simplicidad web
              </h3>
              <p className="text-xs sm:text-sm text-neutral-300 max-w-2xl mt-1">
                Procesamiento de audio de nivel profesional en tiempo real ejecutado al 100% en tu navegador con cero latencia y total privacidad.
              </p>
            </div>
          </div>

          {/* Cards Grid: How It Works & Architecture */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Card 1: Motor Web Audio */}
            <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-4.5 space-y-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Cpu className="w-4 h-4 text-amber-500" />
                <span>100% Local & Privado</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Todos los archivos de audio se procesan de forma local en el navegador mediante la <strong className="text-neutral-200">Web Audio API</strong> y <strong className="text-neutral-200">OfflineAudioContext</strong>. Tus grabaciones y proyectos nunca se suben a ningún servidor externo.
              </p>
            </div>

            {/* Card 2: Visualización de Ondas */}
            <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-4.5 space-y-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Activity className="w-4 h-4 text-sky-400" />
                <span>Ondas Estéreo y Precisión Milimétrica</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Renderizado de alto rendimiento en Canvas mostrando canales izquierdo (L) y derecho (R), medición combinada de envolvente RMS y picos, zoom horizontal y selector con edición numérica de inicio, final y duración.
              </p>
            </div>

            {/* Card 3: Edición y Multipista */}
            <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-4.5 space-y-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Layers className="w-4 h-4 text-emerald-400" />
                <span>Edición Completa & Multipista</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Herramientas reales de cortar, copiar, pegar, silenciar, recortar a selección, dividir en el cursor, duplicar fragmentos e insertar silencio. Admite varias pistas con controles de volumen, panorámica, solo, silencio y mezcla final.
              </p>
            </div>

            {/* Card 4: Efectos & DSP */}
            <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-4.5 space-y-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Sparkles className="w-4 h-4 text-purple-400" />
                <span>Procesamiento & Rack de 11 Efectos</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Normalización de picos, fundidos (*fade-in / fade-out*), velocidad, afinación (*pitch shift*), compresión dinámica y puerta de ruido. Incluye rack con Reverb por convolución, Delay, Eco, Distorsión, Chorus, Flanger, Phaser y Bitcrusher.
              </p>
            </div>

            {/* Card 5: Ecualizador Paramétrico */}
            <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-4.5 space-y-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Sliders className="w-4 h-4 text-cyan-400" />
                <span>Ecualizador Visual de 7 Bandas</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Gráfica interactiva de respuesta en frecuencia (20 Hz - 20 kHz) en escala logarítmica con rejilla en dB. Filtros *Low Pass*, *High Pass*, *Shelving*, *Peaking* y *Notch* con presets profesionales listos para producción.
              </p>
            </div>

            {/* Card 6: Exportación & Almacenamiento */}
            <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-4.5 space-y-2">
              <div className="flex items-center gap-2.5 text-white font-bold text-sm">
                <Download className="w-4 h-4 text-orange-400" />
                <span>Codificador Multiformato & IndexedDB</span>
              </div>
              <p className="text-xs text-neutral-400 leading-relaxed">
                Exportación en WAV (16-bit, 24-bit y 32-bit Float PCM con cabecera RIFF binaria nativa), MP3, FLAC, OGG y AAC. Guarda y recupera proyectos completos directamente en la base de datos local IndexedDB del navegador.
              </p>
            </div>
          </div>

          {/* Keyboard Shortcuts Card */}
          <div className="bg-neutral-950/70 border border-neutral-800/90 rounded-xl p-4.5 space-y-3">
            <div className="flex items-center gap-2 text-white font-bold text-sm">
              <Keyboard className="w-4 h-4 text-amber-500" />
              <span>Atajos de Teclado Rápidos</span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 text-xs">
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Espacio</div>
                <div className="text-[11px] text-neutral-400">Play / Pause</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Ctrl + Z</div>
                <div className="text-[11px] text-neutral-400">Deshacer</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Ctrl + Y</div>
                <div className="text-[11px] text-neutral-400">Rehacer</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Ctrl + X / C / V</div>
                <div className="text-[11px] text-neutral-400">Cortar / Copiar / Pegar</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Supr / Backspace</div>
                <div className="text-[11px] text-neutral-400">Eliminar Selección</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Ctrl + A</div>
                <div className="text-[11px] text-neutral-400">Seleccionar Todo</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Esc</div>
                <div className="text-[11px] text-neutral-400">Limpiar Selección</div>
              </div>
              <div className="bg-neutral-900 border border-neutral-800 rounded-lg p-2">
                <div className="font-mono text-amber-400 font-bold">Ctrl + Rueda</div>
                <div className="text-[11px] text-neutral-400">Zoom Horizontal</div>
              </div>
            </div>
          </div>

          {/* Author & External Links Footer within Modal */}
          <div className="bg-gradient-to-r from-neutral-950 via-neutral-900 to-neutral-950 border border-neutral-800/90 rounded-xl p-5 flex flex-col sm:flex-row items-center justify-between gap-4">
            <div>
              <div className="text-sm font-bold text-white">Desarrollado por Aitor Sánchez Gutiérrez</div>
              <div className="text-xs text-neutral-400 mt-0.5">© 2026 Audio Studio · Todos los derechos reservados</div>
            </div>

            <div className="flex items-center gap-3 text-xs font-semibold">
              <a
                href="https://aitorsanchez.pages.dev/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg transition-colors"
              >
                <span>Blog</span>
                <ExternalLink className="w-3 h-3 text-amber-500" />
              </a>

              <a
                href="https://aitorhub.vercel.app/"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 text-neutral-200 hover:text-white rounded-lg transition-colors"
              >
                <span>Aitor Hub</span>
                <ExternalLink className="w-3 h-3 text-amber-500" />
              </a>

              <a
                href="https://aitorsanchez.pages.dev/contacto"
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-1.5 px-3 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 rounded-lg font-bold shadow-sm transition-colors"
              >
                <span>Contacto</span>
                <ExternalLink className="w-3 h-3 stroke-[2.5]" />
              </a>
            </div>
          </div>
        </div>

        {/* Modal Footer */}
        <div className="flex items-center justify-end px-6 py-3.5 border-t border-neutral-800 bg-neutral-950/70">
          <button
            onClick={onClose}
            className="px-5 py-2 text-xs font-semibold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 rounded-lg transition-colors"
          >
            Cerrar
          </button>
        </div>
      </div>
    </div>
  );
};

import React from 'react';
import {
  Play,
  Pause,
  Square,
  Repeat,
  Volume2,
  VolumeX,
  PlaySquare,
  ArrowRightCircle,
} from 'lucide-react';

interface TransportBarProps {
  isPlaying: boolean;
  currentTime: number;
  totalDuration: number;
  loop: boolean;
  masterVolume: number;
  levelL: number; // 0 to 1
  levelR: number; // 0 to 1
  hasSelection: boolean;
  onPlayPause: () => void;
  onStop: () => void;
  onPlaySelection: () => void;
  onPlayFromCursor: () => void;
  onToggleLoop: () => void;
  onMasterVolumeChange: (vol: number) => void;
}

export const TransportBar: React.FC<TransportBarProps> = ({
  isPlaying,
  currentTime,
  totalDuration,
  loop,
  masterVolume,
  levelL,
  levelR,
  hasSelection,
  onPlayPause,
  onStop,
  onPlaySelection,
  onPlayFromCursor,
  onToggleLoop,
  onMasterVolumeChange,
}) => {
  const formatTime = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
  };

  const isClippingL = levelL > 0.98;
  const isClippingR = levelR > 0.98;

  return (
    <div className="flex flex-wrap items-center justify-between gap-4 px-5 py-3 bg-neutral-900 border-t border-neutral-800 text-neutral-200 select-none">
      {/* Left: Playback Controls */}
      <div className="flex items-center gap-2">
        <button
          onClick={onPlayPause}
          className={`flex items-center justify-center w-11 h-11 rounded-full shadow-md transition-transform active:scale-95 ${
            isPlaying
              ? 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
              : 'bg-amber-500 text-neutral-950 hover:bg-amber-400'
          }`}
          title={isPlaying ? 'Pausar (Espacio)' : 'Reproducir (Espacio)'}
        >
          {isPlaying ? (
            <Pause className="w-5 h-5 fill-neutral-950" />
          ) : (
            <Play className="w-5 h-5 fill-neutral-950 ml-0.5" />
          )}
        </button>

        <button
          onClick={onStop}
          className="p-2.5 rounded-lg bg-neutral-800 hover:bg-neutral-700 text-neutral-300 hover:text-white transition-colors"
          title="Detener (Stop)"
        >
          <Square className="w-4 h-4 fill-neutral-400" />
        </button>

        <div className="h-5 w-px bg-neutral-800 mx-1" />

        <button
          onClick={onPlayFromCursor}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-xs text-neutral-300 hover:text-white transition-colors"
          title="Reproducir desde la posición actual del cursor"
        >
          <ArrowRightCircle className="w-3.5 h-3.5 text-sky-400" />
          <span className="hidden sm:inline">Desde cursor</span>
        </button>

        <button
          onClick={onPlaySelection}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-neutral-800/80 hover:bg-neutral-700 text-xs text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-neutral-800/80 disabled:cursor-not-allowed transition-colors"
          title="Reproducir únicamente la selección activa"
        >
          <PlaySquare className="w-3.5 h-3.5 text-amber-400" />
          <span className="hidden sm:inline">Selección</span>
        </button>

        <button
          onClick={onToggleLoop}
          className={`p-2.5 rounded-lg transition-colors ${
            loop
              ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40'
              : 'bg-neutral-800/80 text-neutral-400 hover:text-neutral-200'
          }`}
          title={loop ? 'Bucle activado' : 'Bucle desactivado'}
        >
          <Repeat className="w-4 h-4" />
        </button>
      </div>

      {/* Center: Timecode Counter */}
      <div className="flex items-center gap-3 bg-neutral-950 border border-neutral-800/90 px-4 py-2 rounded-xl shadow-inner font-mono">
        <div className="text-right">
          <div className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">TIEMPO ACTUAL</div>
          <div className="text-xl font-bold text-amber-400 tabular-nums tracking-wider">
            {formatTime(currentTime)}
          </div>
        </div>

        <span className="text-neutral-600 text-xl font-light">/</span>

        <div>
          <div className="text-[10px] text-neutral-400 font-semibold tracking-wider uppercase">DURACIÓN TOTAL</div>
          <div className="text-xl font-medium text-neutral-400 tabular-nums tracking-wider">
            {formatTime(totalDuration)}
          </div>
        </div>
      </div>

      {/* Right: Master Volume & Stereo VU Meter */}
      <div className="flex items-center gap-4">
        {/* Real-time Stereo VU Meter */}
        <div className="flex items-center gap-1.5 bg-neutral-950 border border-neutral-800 p-2 rounded-lg">
          {/* L Channel */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono font-bold text-neutral-400">L</span>
            <div className="w-2.5 h-10 bg-neutral-800/90 rounded-xs overflow-hidden flex flex-col-reverse p-0.5">
              <div
                style={{ height: `${Math.min(100, Math.round(levelL * 100))}%` }}
                className={`w-full rounded-xs transition-all duration-75 ${
                  levelL > 0.85 ? 'bg-rose-500' : levelL > 0.65 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div
              className={`w-2 h-1 rounded-xs ${
                isClippingL ? 'bg-rose-500 shadow-xs shadow-rose-500' : 'bg-neutral-800'
              }`}
              title="Clip indicator L"
            />
          </div>

          {/* R Channel */}
          <div className="flex flex-col items-center gap-1">
            <span className="text-[9px] font-mono font-bold text-neutral-400">R</span>
            <div className="w-2.5 h-10 bg-neutral-800/90 rounded-xs overflow-hidden flex flex-col-reverse p-0.5">
              <div
                style={{ height: `${Math.min(100, Math.round(levelR * 100))}%` }}
                className={`w-full rounded-xs transition-all duration-75 ${
                  levelR > 0.85 ? 'bg-rose-500' : levelR > 0.65 ? 'bg-amber-400' : 'bg-emerald-500'
                }`}
              />
            </div>
            <div
              className={`w-2 h-1 rounded-xs ${
                isClippingR ? 'bg-rose-500 shadow-xs shadow-rose-500' : 'bg-neutral-800'
              }`}
              title="Clip indicator R"
            />
          </div>
        </div>

        {/* Master Volume Slider */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => onMasterVolumeChange(masterVolume > 0 ? 0 : 1)}
            className="text-neutral-400 hover:text-white transition-colors"
            title={masterVolume > 0 ? 'Silenciar master' : 'Activar sonido master'}
          >
            {masterVolume > 0 ? <Volume2 className="w-4 h-4" /> : <VolumeX className="w-4 h-4 text-rose-400" />}
          </button>

          <div className="flex flex-col gap-0.5 w-24">
            <input
              type="range"
              min="0"
              max="1.5"
              step="0.02"
              value={masterVolume}
              onChange={(e) => onMasterVolumeChange(parseFloat(e.target.value))}
              className="w-full h-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer"
              title={`Volumen Master: ${Math.round(masterVolume * 100)}%`}
            />
            <div className="flex justify-between text-[9px] font-mono text-neutral-400">
              <span>0%</span>
              <span className="text-amber-400">{Math.round(masterVolume * 100)}%</span>
              <span>150%</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

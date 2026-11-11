import React, { useState } from 'react';
import {
  Volume2,
  Maximize,
  TrendingUp,
  TrendingDown,
  Gauge,
  RotateCcw,
  Sliders,
  ShieldAlert,
  MicOff,
  SplitSquareVertical,
} from 'lucide-react';

interface ProcessingViewProps {
  onAdjustGain: (gainDb: number) => void;
  onNormalize: (targetPeakDb: number) => void;
  onFade: (type: 'in' | 'out', curve: 'linear' | 'exponential' | 'logarithmic') => void;
  onSpeed: (speedRatio: number) => void;
  onPitch: (semitones: number) => void;
  onReverse: () => void;
  onCompress: (params: { threshold: number; ratio: number; attack: number; release: number; knee: number }) => void;
  onNoiseGate: (thresholdDb: number, reductionDb: number) => void;
  onRemoveSilence: (thresholdDb: number, minDurationSec: number) => void;
  onConvertChannels: (mode: 'toMono' | 'toStereo' | 'swap' | 'invertPhase') => void;
  hasAudio: boolean;
  isProcessing: boolean;
  hasSelection: boolean;
}

export const ProcessingView: React.FC<ProcessingViewProps> = ({
  onAdjustGain,
  onNormalize,
  onFade,
  onSpeed,
  onPitch,
  onReverse,
  onCompress,
  onNoiseGate,
  onRemoveSilence,
  onConvertChannels,
  hasAudio,
  isProcessing,
  hasSelection,
}) => {
  // Gain state
  const [gainDb, setGainDb] = useState(3);

  // Normalize state
  const [normPeakDb, setNormPeakDb] = useState(0);

  // Fade state
  const [fadeCurve, setFadeCurve] = useState<'linear' | 'exponential' | 'logarithmic'>('linear');

  // Speed & Pitch
  const [speedVal, setSpeedVal] = useState(1.25);
  const [pitchSemitones, setPitchSemitones] = useState(2);

  // Compressor params
  const [compThreshold, setCompThreshold] = useState(-20);
  const [compRatio, setCompRatio] = useState(4);
  const [compAttack, setCompAttack] = useState(0.01);
  const [compRelease, setCompRelease] = useState(0.25);

  // Noise reduction params
  const [noiseThreshold, setNoiseThreshold] = useState(-42);
  const [noiseReduction, setNoiseReduction] = useState(20);

  // Silence removal params
  const [silenceThreshold, setSilenceThreshold] = useState(-45);
  const [silenceDuration, setSilenceDuration] = useState(0.3);

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-200 p-4 space-y-4 overflow-y-auto">
      <div className="flex items-center justify-between border-b border-neutral-800 pb-2">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-white">Herramientas de Procesamiento</h3>
        </div>
        {hasSelection && (
          <span className="text-[11px] text-amber-400 font-semibold bg-amber-500/10 px-2 py-0.5 rounded border border-amber-500/30">
            Afectará a la selección
          </span>
        )}
      </div>

      {/* 1. Ganancia y Volumen */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
            <Volume2 className="w-3.5 h-3.5 text-amber-400" />
            <span>Ajuste de Ganancia / Volumen</span>
          </div>
          <span className="text-xs font-mono font-bold text-amber-400">
            {gainDb > 0 ? `+${gainDb}` : gainDb} dB
          </span>
        </div>

        <input
          type="range"
          min="-24"
          max="24"
          step="1"
          value={gainDb}
          onChange={(e) => setGainDb(parseInt(e.target.value, 10))}
          className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
        />

        <div className="flex items-center gap-2">
          <button
            onClick={() => onAdjustGain(gainDb)}
            disabled={!hasAudio || isProcessing}
            className="flex-1 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40"
          >
            Aplicar Ganancia
          </button>
          <button
            onClick={() => onAdjustGain(3)}
            disabled={!hasAudio || isProcessing}
            className="px-2.5 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 rounded-lg text-xs font-mono text-neutral-300 transition-colors disabled:opacity-40"
            title="Aumentar volumen +3 dB"
          >
            +3 dB
          </button>
          <button
            onClick={() => onAdjustGain(-3)}
            disabled={!hasAudio || isProcessing}
            className="px-2.5 py-1.5 bg-neutral-800/80 hover:bg-neutral-700 rounded-lg text-xs font-mono text-neutral-300 transition-colors disabled:opacity-40"
            title="Reducir volumen -3 dB"
          >
            -3 dB
          </button>
        </div>
      </div>

      {/* 2. Normalización de Picos */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
            <Maximize className="w-3.5 h-3.5 text-emerald-400" />
            <span>Normalizar Audio (Peak Normalize)</span>
          </div>
          <span className="text-xs font-mono font-bold text-emerald-400">{normPeakDb} dB</span>
        </div>

        <div className="grid grid-cols-4 gap-1.5">
          {[0, -0.5, -1, -3].map((val) => (
            <button
              key={val}
              onClick={() => setNormPeakDb(val)}
              className={`py-1 rounded text-xs font-mono transition-colors ${
                normPeakDb === val
                  ? 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/40 font-bold'
                  : 'bg-neutral-800 text-neutral-400 hover:text-white'
              }`}
            >
              {val} dB
            </button>
          ))}
        </div>

        <button
          onClick={() => onNormalize(normPeakDb)}
          disabled={!hasAudio || isProcessing}
          className="w-full py-1.5 px-3 bg-emerald-600 hover:bg-emerald-500 active:bg-emerald-700 rounded-lg text-xs font-semibold text-white shadow-sm transition-colors disabled:opacity-40"
        >
          Normalizar a {normPeakDb} dB
        </button>
      </div>

      {/* 3. Fundidos (Fade In / Fade Out) */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Fundidos (Fade In & Out)</span>
          </div>
          <select
            value={fadeCurve}
            onChange={(e) => setFadeCurve(e.target.value as any)}
            className="bg-neutral-800 border border-neutral-700 text-[10px] text-neutral-300 rounded px-2 py-0.5 outline-none"
          >
            <option value="linear">Lineal</option>
            <option value="exponential">Exponencial</option>
            <option value="logarithmic">Logarítmica</option>
          </select>
        </div>

        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => onFade('in', fadeCurve)}
            disabled={!hasAudio || isProcessing}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-40"
            title="Aplicar Fade-in a la selección o primeros segundos"
          >
            <TrendingUp className="w-3.5 h-3.5 text-amber-400" />
            <span>Fade In</span>
          </button>

          <button
            onClick={() => onFade('out', fadeCurve)}
            disabled={!hasAudio || isProcessing}
            className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 text-xs font-semibold text-white rounded-lg transition-colors disabled:opacity-40"
            title="Aplicar Fade-out a la selección o últimos segundos"
          >
            <TrendingDown className="w-3.5 h-3.5 text-amber-400" />
            <span>Fade Out</span>
          </button>
        </div>
      </div>

      {/* 4. Velocidad y Tono (Pitch Shift) */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
            <Gauge className="w-3.5 h-3.5 text-sky-400" />
            <span>Velocidad y Tono (Pitch)</span>
          </div>
        </div>

        {/* Speed */}
        <div className="space-y-1">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Velocidad de reproducción</span>
            <span className="font-mono text-sky-400">{speedVal.toFixed(2)}x</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="0.5"
              max="2.0"
              step="0.05"
              value={speedVal}
              onChange={(e) => setSpeedVal(parseFloat(e.target.value))}
              className="flex-1 h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
            />
            <button
              onClick={() => onSpeed(speedVal)}
              disabled={!hasAudio || isProcessing}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              Aplicar
            </button>
          </div>
        </div>

        {/* Pitch Shift */}
        <div className="space-y-1 pt-1 border-t border-neutral-800/60">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Cambio de Tono (Semitonos)</span>
            <span className="font-mono text-sky-400">{pitchSemitones > 0 ? `+${pitchSemitones}` : pitchSemitones} st</span>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="range"
              min="-12"
              max="12"
              step="1"
              value={pitchSemitones}
              onChange={(e) => setPitchSemitones(parseInt(e.target.value, 10))}
              className="flex-1 h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
            />
            <button
              onClick={() => onPitch(pitchSemitones)}
              disabled={!hasAudio || isProcessing}
              className="px-2.5 py-1 bg-neutral-800 hover:bg-neutral-700 rounded text-xs font-semibold text-white transition-colors disabled:opacity-40"
            >
              Ajustar
            </button>
          </div>
        </div>
      </div>

      {/* 5. Invertir Audio (Reverse) */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 flex items-center justify-between">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
          <RotateCcw className="w-3.5 h-3.5 text-purple-400" />
          <span>Invertir Dirección (Reverse)</span>
        </div>
        <button
          onClick={onReverse}
          disabled={!hasAudio || isProcessing}
          className="px-3 py-1.5 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold text-purple-300 hover:text-white transition-colors disabled:opacity-40"
        >
          Invertir
        </button>
      </div>

      {/* 6. Compresor Dinámico y Limitador */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-2.5">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
            <ShieldAlert className="w-3.5 h-3.5 text-amber-400" />
            <span>Compresor & Limitador de Picos</span>
          </div>
        </div>

        <div className="space-y-1.5 text-[11px] text-neutral-400">
          <div className="flex justify-between">
            <span>Umbral (Threshold)</span>
            <span className="font-mono text-amber-400">{compThreshold} dB</span>
          </div>
          <input
            type="range"
            min="-60"
            max="0"
            step="1"
            value={compThreshold}
            onChange={(e) => setCompThreshold(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
          />

          <div className="flex justify-between">
            <span>Ratio de compresión</span>
            <span className="font-mono text-amber-400">{compRatio}:1</span>
          </div>
          <input
            type="range"
            min="1"
            max="20"
            step="0.5"
            value={compRatio}
            onChange={(e) => setCompRatio(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
          />

          <div className="flex justify-between">
            <span>Ataque (Attack)</span>
            <span className="font-mono text-amber-400">{Math.round(compAttack * 1000)} ms</span>
          </div>
          <input
            type="range"
            min="0.001"
            max="0.5"
            step="0.001"
            value={compAttack}
            onChange={(e) => setCompAttack(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
          />

          <div className="flex justify-between">
            <span>Liberación (Release)</span>
            <span className="font-mono text-amber-400">{Math.round(compRelease * 1000)} ms</span>
          </div>
          <input
            type="range"
            min="0.01"
            max="1.0"
            step="0.01"
            value={compRelease}
            onChange={(e) => setCompRelease(parseFloat(e.target.value))}
            className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
          />
        </div>

        <button
          onClick={() =>
            onCompress({
              threshold: compThreshold,
              ratio: compRatio,
              attack: compAttack,
              release: compRelease,
              knee: 10,
            })
          }
          disabled={!hasAudio || isProcessing}
          className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40"
        >
          Aplicar Compresor Dinámico
        </button>
      </div>

      {/* 7. Reducción de Ruido & Eliminación de Silencios */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-3">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
          <MicOff className="w-3.5 h-3.5 text-teal-400" />
          <span>Puerta de Ruido & Silencios</span>
        </div>

        <div className="space-y-1.5">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Umbral de Ruido</span>
            <span className="font-mono text-teal-400">{noiseThreshold} dB</span>
          </div>
          <input
            type="range"
            min="-80"
            max="-20"
            step="1"
            value={noiseThreshold}
            onChange={(e) => setNoiseThreshold(parseInt(e.target.value, 10))}
            className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
          />
          <button
            onClick={() => onNoiseGate(noiseThreshold, noiseReduction)}
            disabled={!hasAudio || isProcessing}
            className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40"
          >
            Reducir Ruido de Fondo
          </button>
        </div>

        <div className="pt-2 border-t border-neutral-800/60 space-y-1.5">
          <div className="flex justify-between text-[11px] text-neutral-400">
            <span>Eliminar Silencios (&lt; {silenceThreshold} dB)</span>
            <span className="font-mono text-teal-400">{silenceDuration}s</span>
          </div>
          <button
            onClick={() => onRemoveSilence(silenceThreshold, silenceDuration)}
            disabled={!hasAudio || isProcessing}
            className="w-full py-1.5 px-3 bg-neutral-800 hover:bg-neutral-700 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40"
          >
            Eliminar Tramos de Silencio
          </button>
        </div>
      </div>

      {/* 8. Canales Estéreo / Mono */}
      <div className="bg-neutral-950/70 border border-neutral-800 rounded-xl p-3 space-y-2">
        <div className="flex items-center gap-2 text-xs font-bold text-neutral-200">
          <SplitSquareVertical className="w-3.5 h-3.5 text-cyan-400" />
          <span>Gestión de Canales</span>
        </div>

        <div className="grid grid-cols-2 gap-1.5">
          <button
            onClick={() => onConvertChannels('toMono')}
            disabled={!hasAudio || isProcessing}
            className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white transition-colors disabled:opacity-40"
          >
            Convertir a Mono
          </button>
          <button
            onClick={() => onConvertChannels('toStereo')}
            disabled={!hasAudio || isProcessing}
            className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white transition-colors disabled:opacity-40"
          >
            Convertir a Estéreo
          </button>
          <button
            onClick={() => onConvertChannels('swap')}
            disabled={!hasAudio || isProcessing}
            className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white transition-colors disabled:opacity-40"
          >
            Invertir Canales L/R
          </button>
          <button
            onClick={() => onConvertChannels('invertPhase')}
            disabled={!hasAudio || isProcessing}
            className="py-1.5 px-2 bg-neutral-800 hover:bg-neutral-700 rounded text-xs text-neutral-300 hover:text-white transition-colors disabled:opacity-40"
          >
            Invertir Fase (Phase)
          </button>
        </div>
      </div>
    </div>
  );
};

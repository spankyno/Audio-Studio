import React from 'react';
import { EffectConfig } from '../types/audio';
import { Sparkles, ArrowUp, ArrowDown, Power, Check } from 'lucide-react';

interface EffectsRackViewProps {
  effects: EffectConfig[];
  onEffectsChange: (effects: EffectConfig[]) => void;
  onApplyEffects: () => void;
  isProcessing: boolean;
  hasAudio: boolean;
}

export const DEFAULT_EFFECTS: EffectConfig[] = [
  {
    id: 'reverb-1',
    type: 'reverb',
    name: 'Reverberación (Reverb)',
    enabled: false,
    params: { roomSize: 2.2, decay: 2.8, wet: 0.35 },
  },
  {
    id: 'delay-1',
    type: 'delay',
    name: 'Delay Estéreo',
    enabled: false,
    params: { time: 0.3, feedback: 0.45, wet: 0.35 },
  },
  {
    id: 'echo-1',
    type: 'echo',
    name: 'Eco Analógico',
    enabled: false,
    params: { time: 0.4, feedback: 0.5, wet: 0.4 },
  },
  {
    id: 'distortion-1',
    type: 'distortion',
    name: 'Distorsión Armónica',
    enabled: false,
    params: { drive: 30 },
  },
  {
    id: 'overdrive-1',
    type: 'overdrive',
    name: 'Overdrive / Saturación',
    enabled: false,
    params: { drive: 12 },
  },
  {
    id: 'chorus-1',
    type: 'chorus',
    name: 'Chorus Envolvente',
    enabled: false,
    params: { rate: 1.6, depth: 0.008 },
  },
  {
    id: 'flanger-1',
    type: 'flanger',
    name: 'Flanger Espacial',
    enabled: false,
    params: { rate: 0.8, depth: 0.004 },
  },
  {
    id: 'phaser-1',
    type: 'phaser',
    name: 'Phaser Psicoacústico',
    enabled: false,
    params: { rate: 1.2, depth: 0.7 },
  },
  {
    id: 'tremolo-1',
    type: 'tremolo',
    name: 'Trémolo de Amplitud',
    enabled: false,
    params: { rate: 5.0, depth: 0.65 },
  },
  {
    id: 'vibrato-1',
    type: 'vibrato',
    name: 'Vibrato de Tono',
    enabled: false,
    params: { rate: 6.0, depth: 0.004 },
  },
  {
    id: 'bitcrusher-1',
    type: 'bitcrusher',
    name: 'Bitcrusher Lo-Fi',
    enabled: false,
    params: { bits: 6, downsample: 4 },
  },
];

export const EffectsRackView: React.FC<EffectsRackViewProps> = ({
  effects,
  onEffectsChange,
  onApplyEffects,
  isProcessing,
  hasAudio,
}) => {
  const handleToggleEffect = (id: string) => {
    const updated = effects.map(e => e.id === id ? { ...e, enabled: !e.enabled } : e);
    onEffectsChange(updated);
  };

  const handleParamChange = (id: string, paramKey: string, val: number) => {
    const updated = effects.map(e => {
      if (e.id === id) {
        return {
          ...e,
          params: { ...e.params, [paramKey]: val },
        };
      }
      return e;
    });
    onEffectsChange(updated);
  };

  const handleMoveUp = (idx: number) => {
    if (idx === 0) return;
    const copy = [...effects];
    const temp = copy[idx - 1];
    copy[idx - 1] = copy[idx];
    copy[idx] = temp;
    onEffectsChange(copy);
  };

  const handleMoveDown = (idx: number) => {
    if (idx === effects.length - 1) return;
    const copy = [...effects];
    const temp = copy[idx + 1];
    copy[idx + 1] = copy[idx];
    copy[idx] = temp;
    onEffectsChange(copy);
  };

  const enabledCount = effects.filter(e => e.enabled).length;

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-200 p-4 space-y-4 overflow-y-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Sparkles className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-white">Rack de Efectos de Estudio</h3>
        </div>
        <span className="text-xs text-neutral-400 font-medium">
          {enabledCount} activo{enabledCount !== 1 ? 's' : ''}
        </span>
      </div>

      {/* Effects list */}
      <div className="space-y-2.5">
        {effects.map((effect, idx) => {
          return (
            <div
              key={effect.id}
              className={`p-3 rounded-xl border transition-all ${
                effect.enabled
                  ? 'bg-neutral-950/90 border-amber-500/40 shadow-sm'
                  : 'bg-neutral-950/40 border-neutral-800/80 opacity-70'
              }`}
            >
              {/* Effect Header */}
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleToggleEffect(effect.id)}
                    className={`p-1.5 rounded-md transition-colors ${
                      effect.enabled
                        ? 'bg-amber-500 text-neutral-950 font-bold'
                        : 'bg-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                    title={effect.enabled ? 'Desactivar efecto' : 'Activar efecto'}
                  >
                    <Power className="w-3.5 h-3.5" />
                  </button>
                  <span className={`text-xs font-bold ${effect.enabled ? 'text-white' : 'text-neutral-400'}`}>
                    {effect.name}
                  </span>
                </div>

                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleMoveUp(idx)}
                    disabled={idx === 0}
                    className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                    title="Mover arriba en la cadena"
                  >
                    <ArrowUp className="w-3.5 h-3.5" />
                  </button>
                  <button
                    onClick={() => handleMoveDown(idx)}
                    disabled={idx === effects.length - 1}
                    className="p-1 rounded text-neutral-400 hover:text-white disabled:opacity-30 disabled:hover:text-neutral-400"
                    title="Mover abajo en la cadena"
                  >
                    <ArrowDown className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>

              {/* Dynamic Parameter Sliders */}
              <div className="space-y-2 pt-1 border-t border-neutral-800/60">
                {effect.type === 'reverb' && (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Tamaño de Sala (Room Size)</span>
                      <span className="font-mono text-amber-400">{effect.params.roomSize.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="5.0"
                      step="0.1"
                      value={effect.params.roomSize}
                      onChange={(e) => handleParamChange(effect.id, 'roomSize', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Decaimiento (Decay)</span>
                      <span className="font-mono text-amber-400">{effect.params.decay.toFixed(1)}s</span>
                    </div>
                    <input
                      type="range"
                      min="0.5"
                      max="6.0"
                      step="0.1"
                      value={effect.params.decay}
                      onChange={(e) => handleParamChange(effect.id, 'decay', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Mezcla Efecto (Wet / Dry)</span>
                      <span className="font-mono text-amber-400">{Math.round(effect.params.wet * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={effect.params.wet}
                      onChange={(e) => handleParamChange(effect.id, 'wet', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </>
                )}

                {(effect.type === 'delay' || effect.type === 'echo') && (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Tiempo de Retardo (Time)</span>
                      <span className="font-mono text-amber-400">{(effect.params.time * 1000).toFixed(0)} ms</span>
                    </div>
                    <input
                      type="range"
                      min="0.05"
                      max="1.5"
                      step="0.05"
                      value={effect.params.time}
                      onChange={(e) => handleParamChange(effect.id, 'time', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Retroalimentación (Feedback)</span>
                      <span className="font-mono text-amber-400">{Math.round(effect.params.feedback * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="0.9"
                      step="0.05"
                      value={effect.params.feedback}
                      onChange={(e) => handleParamChange(effect.id, 'feedback', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Nivel de Efecto (Wet)</span>
                      <span className="font-mono text-amber-400">{Math.round(effect.params.wet * 100)}%</span>
                    </div>
                    <input
                      type="range"
                      min="0"
                      max="1"
                      step="0.05"
                      value={effect.params.wet}
                      onChange={(e) => handleParamChange(effect.id, 'wet', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </>
                )}

                {(effect.type === 'distortion' || effect.type === 'overdrive') && (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Ganancia de Saturación (Drive)</span>
                      <span className="font-mono text-amber-400">{effect.params.drive.toFixed(0)}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="80"
                      step="1"
                      value={effect.params.drive}
                      onChange={(e) => handleParamChange(effect.id, 'drive', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </>
                )}

                {(effect.type === 'chorus' || effect.type === 'flanger' || effect.type === 'phaser' || effect.type === 'tremolo' || effect.type === 'vibrato') && (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Velocidad de Modulación (Rate)</span>
                      <span className="font-mono text-amber-400">{effect.params.rate?.toFixed(1)} Hz</span>
                    </div>
                    <input
                      type="range"
                      min="0.1"
                      max="12.0"
                      step="0.1"
                      value={effect.params.rate}
                      onChange={(e) => handleParamChange(effect.id, 'rate', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Profundidad (Depth)</span>
                      <span className="font-mono text-amber-400">{effect.params.depth?.toFixed(3)}</span>
                    </div>
                    <input
                      type="range"
                      min="0.001"
                      max="1.0"
                      step="0.005"
                      value={effect.params.depth}
                      onChange={(e) => handleParamChange(effect.id, 'depth', parseFloat(e.target.value))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </>
                )}

                {effect.type === 'bitcrusher' && (
                  <>
                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Resolución de Bits</span>
                      <span className="font-mono text-amber-400">{effect.params.bits} bits</span>
                    </div>
                    <input
                      type="range"
                      min="2"
                      max="16"
                      step="1"
                      value={effect.params.bits}
                      onChange={(e) => handleParamChange(effect.id, 'bits', parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />

                    <div className="flex items-center justify-between text-[11px] text-neutral-400">
                      <span>Submuestreo (Downsample)</span>
                      <span className="font-mono text-amber-400">x{effect.params.downsample}</span>
                    </div>
                    <input
                      type="range"
                      min="1"
                      max="16"
                      step="1"
                      value={effect.params.downsample}
                      onChange={(e) => handleParamChange(effect.id, 'downsample', parseInt(e.target.value, 10))}
                      className="w-full h-1 bg-neutral-800 rounded appearance-none cursor-pointer"
                    />
                  </>
                )}
              </div>
            </div>
          );
        })}
      </div>

      {/* Apply Effects Button */}
      <div className="pt-2 sticky bottom-0 bg-neutral-900 pb-1">
        <button
          onClick={onApplyEffects}
          disabled={!hasAudio || isProcessing || enabledCount === 0}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold text-xs shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{isProcessing ? 'Renderizando efectos...' : `Aplicar Efectos (${enabledCount} activos)`}</span>
        </button>
      </div>
    </div>
  );
};

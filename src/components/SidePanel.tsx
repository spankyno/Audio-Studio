import React, { useState } from 'react';
import { Sliders, Sparkles, Wand2, Layers, ChevronRight, ChevronLeft } from 'lucide-react';
import { EQBand, EffectConfig, AudioTrack } from '../types/audio';
import { EqualizerView } from './EqualizerView';
import { EffectsRackView } from './EffectsRackView';
import { ProcessingView } from './ProcessingView';

interface SidePanelProps {
  eqBands: EQBand[];
  onEQBandsChange: (bands: EQBand[]) => void;
  onApplyEQ: () => void;
  effects: EffectConfig[];
  onEffectsChange: (effects: EffectConfig[]) => void;
  onApplyEffects: () => void;
  tracks: AudioTrack[];
  activeTrackId: string;
  onSelectTrack: (id: string) => void;
  onAddTrack: () => void;
  onMergeTracks: () => void;
  hasAudio: boolean;
  isProcessing: boolean;
  hasSelection: boolean;
  // Processing handlers
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
}

export const SidePanel: React.FC<SidePanelProps> = ({
  eqBands,
  onEQBandsChange,
  onApplyEQ,
  effects,
  onEffectsChange,
  onApplyEffects,
  tracks,
  activeTrackId,
  onSelectTrack,
  onAddTrack,
  onMergeTracks,
  hasAudio,
  isProcessing,
  hasSelection,
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
}) => {
  const [activeTab, setActiveTab] = useState<'processing' | 'eq' | 'effects' | 'tracks'>('processing');
  const [isCollapsed, setIsCollapsed] = useState(false);

  if (isCollapsed) {
    return (
      <div className="w-12 bg-neutral-900 border-l border-neutral-800 flex flex-col items-center py-3 gap-4 shrink-0">
        <button
          onClick={() => setIsCollapsed(false)}
          className="p-1.5 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded-md transition-colors"
          title="Expandir panel lateral"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>

        <button
          onClick={() => { setIsCollapsed(false); setActiveTab('processing'); }}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'processing' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:text-white'}`}
          title="Procesamiento"
        >
          <Wand2 className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setIsCollapsed(false); setActiveTab('eq'); }}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'eq' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:text-white'}`}
          title="Ecualizador"
        >
          <Sliders className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setIsCollapsed(false); setActiveTab('effects'); }}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'effects' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:text-white'}`}
          title="Efectos"
        >
          <Sparkles className="w-4 h-4" />
        </button>
        <button
          onClick={() => { setIsCollapsed(false); setActiveTab('tracks'); }}
          className={`p-2 rounded-lg transition-colors ${activeTab === 'tracks' ? 'bg-amber-500/20 text-amber-400' : 'text-neutral-400 hover:text-white'}`}
          title="Pistas"
        >
          <Layers className="w-4 h-4" />
        </button>
      </div>
    );
  }

  return (
    <div className="w-80 md:w-96 bg-neutral-900 border-l border-neutral-800 flex flex-col shrink-0 overflow-hidden shadow-xl">
      {/* Panel Top Tabs */}
      <div className="flex items-center justify-between border-b border-neutral-800 px-3 bg-neutral-950/60">
        <div className="flex items-center gap-1 overflow-x-auto py-1">
          <button
            onClick={() => setActiveTab('processing')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'processing'
                ? 'bg-neutral-800 text-amber-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Wand2 className="w-3.5 h-3.5" />
            <span>Procesar</span>
          </button>

          <button
            onClick={() => setActiveTab('eq')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'eq'
                ? 'bg-neutral-800 text-amber-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span>Ecualizador</span>
          </button>

          <button
            onClick={() => setActiveTab('effects')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'effects'
                ? 'bg-neutral-800 text-amber-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span>Efectos</span>
          </button>

          <button
            onClick={() => setActiveTab('tracks')}
            className={`flex items-center gap-1.5 px-3 py-2 text-xs font-semibold rounded-lg transition-colors ${
              activeTab === 'tracks'
                ? 'bg-neutral-800 text-amber-400'
                : 'text-neutral-400 hover:text-neutral-200'
            }`}
          >
            <Layers className="w-3.5 h-3.5" />
            <span>Pistas</span>
          </button>
        </div>

        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1.5 text-neutral-400 hover:text-white rounded transition-colors"
          title="Colapsar panel"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>

      {/* Tab Contents */}
      <div className="flex-1 overflow-hidden">
        {activeTab === 'processing' && (
          <ProcessingView
            onAdjustGain={onAdjustGain}
            onNormalize={onNormalize}
            onFade={onFade}
            onSpeed={onSpeed}
            onPitch={onPitch}
            onReverse={onReverse}
            onCompress={onCompress}
            onNoiseGate={onNoiseGate}
            onRemoveSilence={onRemoveSilence}
            onConvertChannels={onConvertChannels}
            hasAudio={hasAudio}
            isProcessing={isProcessing}
            hasSelection={hasSelection}
          />
        )}

        {activeTab === 'eq' && (
          <EqualizerView
            bands={eqBands}
            onBandsChange={onEQBandsChange}
            onApplyEQ={onApplyEQ}
            isProcessing={isProcessing}
            hasAudio={hasAudio}
          />
        )}

        {activeTab === 'effects' && (
          <EffectsRackView
            effects={effects}
            onEffectsChange={onEffectsChange}
            onApplyEffects={onApplyEffects}
            isProcessing={isProcessing}
            hasAudio={hasAudio}
          />
        )}

        {activeTab === 'tracks' && (
          <div className="p-4 space-y-4 overflow-y-auto h-full text-neutral-200 text-xs">
            <div className="flex items-center justify-between">
              <h3 className="text-sm font-bold text-white">Edición Multipista</h3>
              <button
                onClick={onAddTrack}
                className="px-2.5 py-1 bg-amber-500 hover:bg-amber-400 text-neutral-950 font-bold rounded text-xs transition-colors"
              >
                + Añadir Pista
              </button>
            </div>

            <div className="space-y-2">
              {tracks.map((t) => (
                <div
                  key={t.id}
                  onClick={() => onSelectTrack(t.id)}
                  className={`p-3 rounded-xl border cursor-pointer transition-all ${
                    t.id === activeTrackId
                      ? 'bg-neutral-800/80 border-amber-500'
                      : 'bg-neutral-950 border-neutral-800 hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center gap-2 mb-1">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ backgroundColor: t.color }} />
                    <span className="font-semibold text-white">{t.name}</span>
                    <span className="ml-auto text-[10px] text-neutral-400 font-mono">
                      {t.buffer ? `${t.buffer.duration.toFixed(2)}s` : 'Sin audio'}
                    </span>
                  </div>
                  <div className="text-[11px] text-neutral-400 flex items-center justify-between">
                    <span>Vol: {Math.round(t.volume * 100)}%</span>
                    <span>Pan: {t.pan === 0 ? 'Centro' : t.pan < 0 ? `Izq ${Math.round(-t.pan * 100)}%` : `Der ${Math.round(t.pan * 100)}%`}</span>
                    <span>{t.mute ? 'Silenciada' : t.solo ? 'Solo' : 'Activa'}</span>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-4 border-t border-neutral-800">
              <button
                onClick={onMergeTracks}
                disabled={tracks.length < 2 || !hasAudio}
                className="w-full py-2 px-3 bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded-lg text-xs font-semibold text-white transition-colors disabled:opacity-40"
              >
                Mezclar y Unir Todas las Pistas
              </button>
              <p className="text-[10px] text-neutral-400 mt-1.5 text-center">
                Combina todas las pistas activas en una única pista master preservando volúmenes y panorámicas.
              </p>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

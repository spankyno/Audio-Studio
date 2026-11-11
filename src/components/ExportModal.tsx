import React, { useState } from 'react';
import { X, Download } from 'lucide-react';
import { WavBitDepth } from '../audio/exportWav';

interface ExportModalProps {
  isOpen: boolean;
  onClose: () => void;
  projectName: string;
  hasSelection: boolean;
  onExport: (options: {
    format: 'wav' | 'mp3' | 'flac' | 'ogg' | 'aac';
    bitDepth: WavBitDepth;
    sampleRate: number;
    channels: 'stereo' | 'mono';
    qualityKbps: number;
    rangeOnly: boolean;
    fileName: string;
  }) => Promise<void>;
}

export const ExportModal: React.FC<ExportModalProps> = ({
  isOpen,
  onClose,
  projectName,
  hasSelection,
  onExport,
}) => {
  const [format, setFormat] = useState<'wav' | 'mp3' | 'flac' | 'ogg' | 'aac'>('wav');
  const [bitDepth, setBitDepth] = useState<WavBitDepth>(16);
  const [sampleRate, setSampleRate] = useState<number>(44100);
  const [channels, setChannels] = useState<'stereo' | 'mono'>('stereo');
  const [qualityKbps, setQualityKbps] = useState<number>(320);
  const [rangeOnly, setRangeOnly] = useState<boolean>(false);
  const [fileName, setFileName] = useState<string>(projectName || 'audio_export');
  const [isExporting, setIsExporting] = useState<boolean>(false);

  if (!isOpen) return null;

  const handleStartExport = async () => {
    setIsExporting(true);
    try {
      await onExport({
        format,
        bitDepth,
        sampleRate,
        channels,
        qualityKbps,
        rangeOnly: hasSelection && rangeOnly,
        fileName: fileName.trim() || 'audio_export',
      });
      onClose();
    } catch (e) {
      console.error('Export failed:', e);
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-md bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-6 text-neutral-200">
        {/* Header */}
        <div className="flex items-center justify-between pb-4 border-b border-neutral-800">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Download className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-base font-bold text-white">Exportar Audio</h3>
              <p className="text-xs text-neutral-400">Configura la calidad y formato de salida</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-neutral-400 hover:text-white p-1 rounded-md transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Body */}
        <div className="space-y-4 py-4 text-xs">
          {/* File Name */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1">Nombre del Archivo</label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-medium outline-none focus:border-amber-500 transition-colors"
            />
          </div>

          {/* Formats Grid */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1">Formato</label>
            <div className="grid grid-cols-5 gap-1.5">
              {(['wav', 'mp3', 'flac', 'ogg', 'aac'] as const).map((fmt) => (
                <button
                  key={fmt}
                  onClick={() => setFormat(fmt)}
                  className={`py-2 rounded-lg font-bold uppercase transition-all ${
                    format === fmt
                      ? 'bg-amber-500 text-neutral-950 shadow-sm'
                      : 'bg-neutral-800/80 text-neutral-400 hover:text-white'
                  }`}
                >
                  {fmt}
                </button>
              ))}
            </div>
          </div>

          {/* Bit Depth (for WAV) or Quality (for MP3/AAC) */}
          {format === 'wav' ? (
            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Profundidad de Bits</label>
              <div className="grid grid-cols-3 gap-2">
                {[
                  { bits: 16, desc: '16-bit PCM (CD estándar)' },
                  { bits: 24, desc: '24-bit PCM (Estudio Pro)' },
                  { bits: 32, desc: '32-bit Float (Máxima dinámica)' },
                ].map(({ bits, desc }) => (
                  <button
                    key={bits}
                    onClick={() => setBitDepth(bits as WavBitDepth)}
                    className={`p-2 rounded-lg text-left transition-all ${
                      bitDepth === bits
                        ? 'bg-neutral-800 border border-amber-500 text-white'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    <div className="font-bold">{bits} bits</div>
                    <div className="text-[10px] text-neutral-400 truncate">{desc}</div>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Tasa de Bits (Bitrate)</label>
              <div className="grid grid-cols-4 gap-1.5">
                {[128, 192, 256, 320].map((kbps) => (
                  <button
                    key={kbps}
                    onClick={() => setQualityKbps(kbps)}
                    className={`py-1.5 rounded-lg font-mono transition-all ${
                      qualityKbps === kbps
                        ? 'bg-neutral-800 border border-amber-500 text-amber-400 font-bold'
                        : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                    }`}
                  >
                    {kbps} kbps
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Sample Rate & Channels Row */}
          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Frecuencia de Muestreo</label>
              <select
                value={sampleRate}
                onChange={(e) => setSampleRate(parseInt(e.target.value, 10))}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white outline-none focus:border-amber-500"
              >
                <option value={44100}>44.1 kHz (CD Audio)</option>
                <option value={48000}>48.0 kHz (Video & Pro)</option>
                <option value={96000}>96.0 kHz (Hi-Res)</option>
              </select>
            </div>

            <div>
              <label className="block font-semibold text-neutral-300 mb-1">Canales</label>
              <select
                value={channels}
                onChange={(e) => setChannels(e.target.value as 'stereo' | 'mono')}
                className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white outline-none focus:border-amber-500"
              >
                <option value="stereo">Estéreo (2 Canales L/R)</option>
                <option value="mono">Mono (1 Canal)</option>
              </select>
            </div>
          </div>

          {/* Range: Entire Project vs Selection */}
          <div>
            <label className="block font-semibold text-neutral-300 mb-1">Rango a Exportar</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={() => setRangeOnly(false)}
                className={`py-2 px-3 rounded-lg text-left transition-all ${
                  !rangeOnly
                    ? 'bg-neutral-800 border border-amber-500 text-white'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                <div className="font-semibold">Mezcla Completa</div>
                <div className="text-[10px] text-neutral-400">Todo el proyecto</div>
              </button>

              <button
                onClick={() => setRangeOnly(true)}
                disabled={!hasSelection}
                className={`py-2 px-3 rounded-lg text-left transition-all ${
                  rangeOnly && hasSelection
                    ? 'bg-neutral-800 border border-amber-500 text-white'
                    : 'bg-neutral-950 border border-neutral-800 text-neutral-400 hover:text-white disabled:opacity-40 disabled:cursor-not-allowed'
                }`}
              >
                <div className="font-semibold">Solo Selección</div>
                <div className="text-[10px] text-neutral-400">
                  {hasSelection ? 'Fragmento activo' : 'Sin selección'}
                </div>
              </button>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-4 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-4 py-2 text-xs font-semibold text-neutral-300 hover:text-white hover:bg-neutral-800 rounded-lg transition-colors"
          >
            Cancelar
          </button>
          <button
            onClick={handleStartExport}
            disabled={isExporting}
            className="flex items-center gap-1.5 px-5 py-2 text-xs font-bold text-neutral-950 bg-amber-500 hover:bg-amber-400 active:bg-amber-600 rounded-lg shadow-md transition-all disabled:opacity-50"
          >
            <Download className="w-4 h-4 stroke-[2.5]" />
            <span>{isExporting ? 'Exportando audio...' : 'Descargar Archivo'}</span>
          </button>
        </div>
      </div>
    </div>
  );
};

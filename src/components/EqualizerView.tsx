import React, { useRef, useEffect, useState, useCallback } from 'react';
import { EQBand, EQPreset } from '../types/audio';
import { Sliders, RotateCcw, Check } from 'lucide-react';

interface EqualizerViewProps {
  bands: EQBand[];
  onBandsChange: (bands: EQBand[]) => void;
  onApplyEQ: () => void;
  isProcessing: boolean;
  hasAudio: boolean;
}

export const EQ_PRESETS: EQPreset[] = [
  {
    name: 'Plano (Flat)',
    description: 'Respuesta plana sin alteración',
    bands: [
      { type: 'highpass', frequency: 30, gain: 0, q: 0.7 },
      { type: 'lowshelf', frequency: 100, gain: 0, q: 0.7 },
      { type: 'peaking', frequency: 500, gain: 0, q: 1.0 },
      { type: 'peaking', frequency: 1500, gain: 0, q: 1.0 },
      { type: 'peaking', frequency: 4000, gain: 0, q: 1.0 },
      { type: 'highshelf', frequency: 10000, gain: 0, q: 0.7 },
      { type: 'lowpass', frequency: 18000, gain: 0, q: 0.7 },
    ],
  },
  {
    name: 'Claridad Vocal',
    description: 'Realce de presencia vocal y corte de subgraves retumbantes',
    bands: [
      { type: 'highpass', frequency: 80, gain: 0, q: 0.7 },
      { type: 'lowshelf', frequency: 150, gain: -2.5, q: 0.7 },
      { type: 'peaking', frequency: 500, gain: -1.5, q: 1.2 },
      { type: 'peaking', frequency: 2500, gain: 3.5, q: 1.4 },
      { type: 'peaking', frequency: 5000, gain: 2.0, q: 1.0 },
      { type: 'highshelf', frequency: 12000, gain: 3.0, q: 0.7 },
      { type: 'lowpass', frequency: 18000, gain: 0, q: 0.7 },
    ],
  },
  {
    name: 'Potenciador de Graves',
    description: 'Bajos profundos y contundentes para música electrónica y hip-hop',
    bands: [
      { type: 'highpass', frequency: 25, gain: 0, q: 0.7 },
      { type: 'lowshelf', frequency: 80, gain: 6.0, q: 0.8 },
      { type: 'peaking', frequency: 250, gain: 2.5, q: 1.0 },
      { type: 'peaking', frequency: 1000, gain: -1.0, q: 1.0 },
      { type: 'peaking', frequency: 3500, gain: 0.5, q: 1.0 },
      { type: 'highshelf', frequency: 9000, gain: 1.0, q: 0.7 },
      { type: 'lowpass', frequency: 19000, gain: 0, q: 0.7 },
    ],
  },
  {
    name: 'Realce de Agudos (Air)',
    description: 'Brillo y apertura de frecuencias altas',
    bands: [
      { type: 'highpass', frequency: 30, gain: 0, q: 0.7 },
      { type: 'lowshelf', frequency: 100, gain: -1.0, q: 0.7 },
      { type: 'peaking', frequency: 800, gain: 0, q: 1.0 },
      { type: 'peaking', frequency: 3000, gain: 2.0, q: 1.0 },
      { type: 'peaking', frequency: 7000, gain: 4.0, q: 1.0 },
      { type: 'highshelf', frequency: 12000, gain: 6.0, q: 0.8 },
      { type: 'lowpass', frequency: 20000, gain: 0, q: 0.7 },
    ],
  },
  {
    name: 'Podcast Profesional',
    description: 'Voz definida, inteligible y sin zumbidos',
    bands: [
      { type: 'highpass', frequency: 90, gain: 0, q: 0.7 },
      { type: 'lowshelf', frequency: 180, gain: -2.0, q: 0.7 },
      { type: 'peaking', frequency: 400, gain: -3.0, q: 1.5 },
      { type: 'peaking', frequency: 2800, gain: 3.0, q: 1.2 },
      { type: 'peaking', frequency: 6500, gain: 1.5, q: 1.0 },
      { type: 'highshelf', frequency: 11000, gain: -1.0, q: 0.7 },
      { type: 'lowpass', frequency: 16000, gain: 0, q: 0.7 },
    ],
  },
  {
    name: 'Efecto Teléfono',
    description: 'Filtro pasa-banda estrecho estilo llamada retro',
    bands: [
      { type: 'highpass', frequency: 450, gain: 0, q: 1.4 },
      { type: 'lowshelf', frequency: 500, gain: -12, q: 1.0 },
      { type: 'peaking', frequency: 1200, gain: 4.0, q: 2.0 },
      { type: 'peaking', frequency: 2200, gain: 6.0, q: 2.0 },
      { type: 'peaking', frequency: 3200, gain: -2.0, q: 1.5 },
      { type: 'highshelf', frequency: 3500, gain: -18, q: 1.0 },
      { type: 'lowpass', frequency: 3800, gain: 0, q: 1.4 },
    ],
  },
];

export const EqualizerView: React.FC<EqualizerViewProps> = ({
  bands,
  onBandsChange,
  onApplyEQ,
  isProcessing,
  hasAudio,
}) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selectedPreset, setSelectedPreset] = useState<string>('Plano (Flat)');

  // Helper to compute biquad response at frequency f
  const computeFilterResponse = (
    band: EQBand,
    f: number,
    sampleRate = 44100
  ): { mag: number; phase: number } => {
    // Web Audio Biquad standard math
    const w0 = (2 * Math.PI * band.frequency) / sampleRate;
    const alpha = Math.sin(w0) / (2 * (band.q || 0.707));
    const A = Math.pow(10, band.gain / 40);

    let b0 = 1, b1 = 0, b2 = 0, a0 = 1, a1 = 0, a2 = 0;

    switch (band.type) {
      case 'peaking':
        b0 = 1 + alpha * A;
        b1 = -2 * Math.cos(w0);
        b2 = 1 - alpha * A;
        a0 = 1 + alpha / A;
        a1 = -2 * Math.cos(w0);
        a2 = 1 - alpha / A;
        break;
      case 'lowshelf': {
        const sq = 2 * Math.sqrt(A) * alpha;
        b0 = A * ((A + 1) - (A - 1) * Math.cos(w0) + sq);
        b1 = 2 * A * ((A - 1) - (A + 1) * Math.cos(w0));
        b2 = A * ((A + 1) - (A - 1) * Math.cos(w0) - sq);
        a0 = (A + 1) + (A - 1) * Math.cos(w0) + sq;
        a1 = -2 * ((A - 1) + (A + 1) * Math.cos(w0));
        a2 = (A + 1) + (A - 1) * Math.cos(w0) - sq;
        break;
      }
      case 'highshelf': {
        const sq = 2 * Math.sqrt(A) * alpha;
        b0 = A * ((A + 1) + (A - 1) * Math.cos(w0) + sq);
        b1 = -2 * A * ((A - 1) + (A + 1) * Math.cos(w0));
        b2 = A * ((A + 1) + (A - 1) * Math.cos(w0) - sq);
        a0 = (A + 1) - (A - 1) * Math.cos(w0) + sq;
        a1 = 2 * ((A - 1) - (A + 1) * Math.cos(w0));
        a2 = (A + 1) - (A - 1) * Math.cos(w0) - sq;
        break;
      }
      case 'highpass':
        b0 = (1 + Math.cos(w0)) / 2;
        b1 = -(1 + Math.cos(w0));
        b2 = (1 + Math.cos(w0)) / 2;
        a0 = 1 + alpha;
        a1 = -2 * Math.cos(w0);
        a2 = 1 - alpha;
        break;
      case 'lowpass':
        b0 = (1 - Math.cos(w0)) / 2;
        b1 = 1 - Math.cos(w0);
        b2 = (1 - Math.cos(w0)) / 2;
        a0 = 1 + alpha;
        a1 = -2 * Math.cos(w0);
        a2 = 1 - alpha;
        break;
      case 'bandpass':
        b0 = alpha;
        b1 = 0;
        b2 = -alpha;
        a0 = 1 + alpha;
        a1 = -2 * Math.cos(w0);
        a2 = 1 - alpha;
        break;
      case 'notch':
        b0 = 1;
        b1 = -2 * Math.cos(w0);
        b2 = 1;
        a0 = 1 + alpha;
        a1 = -2 * Math.cos(w0);
        a2 = 1 - alpha;
        break;
      default:
        return { mag: 1, phase: 0 };
    }

    // Evaluate frequency response at frequency f
    const phi = (2 * Math.PI * f) / sampleRate;
    const cosPhi = Math.cos(phi);
    const cos2Phi = Math.cos(2 * phi);
    const sinPhi = Math.sin(phi);
    const sin2Phi = Math.sin(2 * phi);

    const numReal = b0 + b1 * cosPhi + b2 * cos2Phi;
    const numImag = -b1 * sinPhi - b2 * sin2Phi;
    const denReal = a0 + a1 * cosPhi + a2 * cos2Phi;
    const denImag = -a1 * sinPhi - a2 * sin2Phi;

    const numMagSq = numReal * numReal + numImag * numImag;
    const denMagSq = denReal * denReal + denImag * denImag;

    const mag = Math.sqrt(numMagSq / (denMagSq || 0.0001));
    return { mag, phase: 0 };
  };

  // Draw EQ Response Curve on Canvas
  const drawEQCurve = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // Grid lines for frequencies (20Hz, 50, 100, 200, 500, 1k, 2k, 5k, 10k, 20k)
    const minFreq = 20;
    const maxFreq = 20000;
    const logMin = Math.log10(minFreq);
    const logMax = Math.log10(maxFreq);

    const freqToX = (f: number) => {
      return ((Math.log10(f) - logMin) / (logMax - logMin)) * width;
    };

    const dbToY = (db: number) => {
      // Scale from +24dB at top to -24dB at bottom, 0dB in center
      const normalized = (db + 24) / 48; // 0 to 1
      return height - normalized * height;
    };

    // Draw dB horizontal grid lines (-18, -12, -6, 0, +6, +12, +18)
    const dbSteps = [-18, -12, -6, 0, 6, 12, 18];
    ctx.strokeStyle = '#1e1e1e';
    ctx.lineWidth = 1;
    ctx.fillStyle = '#525252';
    ctx.font = '9px "JetBrains Mono", monospace';

    dbSteps.forEach(db => {
      const y = dbToY(db);
      ctx.beginPath();
      ctx.strokeStyle = db === 0 ? '#333333' : '#171717';
      ctx.moveTo(0, y);
      ctx.lineTo(width, y);
      ctx.stroke();

      ctx.fillText(`${db > 0 ? '+' : ''}${db} dB`, 5, y - 2);
    });

    // Draw Frequency vertical grid lines
    const gridFreqs = [50, 100, 250, 500, 1000, 2500, 5000, 10000, 20000];
    gridFreqs.forEach(f => {
      const x = freqToX(f);
      ctx.beginPath();
      ctx.strokeStyle = '#171717';
      ctx.moveTo(x, 0);
      ctx.lineTo(x, height);
      ctx.stroke();

      const label = f >= 1000 ? `${f / 1000}k` : `${f}`;
      ctx.fillText(label, x + 2, height - 4);
    });

    // Compute curve points
    const points: Array<{ x: number; y: number }> = [];
    const numPoints = width;

    for (let px = 0; px < numPoints; px += 2) {
      const frac = px / width;
      const freq = Math.pow(10, logMin + frac * (logMax - logMin));

      // Multiply magnitude of all active bands
      let totalMag = 1.0;
      bands.forEach(band => {
        const { mag } = computeFilterResponse(band, freq);
        totalMag *= mag;
      });

      const totalDb = 20 * Math.log10(Math.max(0.0001, totalMag));
      const clampedDb = Math.max(-24, Math.min(24, totalDb));
      const py = dbToY(clampedDb);
      points.push({ x: px, y: py });
    }

    // Draw Filled Gradient under curve
    if (points.length > 0) {
      ctx.beginPath();
      ctx.moveTo(points[0].x, dbToY(0));
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.lineTo(points[points.length - 1].x, dbToY(0));
      ctx.closePath();

      const gradient = ctx.createLinearGradient(0, 0, 0, height);
      gradient.addColorStop(0, 'rgba(245, 158, 11, 0.35)');
      gradient.addColorStop(0.5, 'rgba(245, 158, 11, 0.08)');
      gradient.addColorStop(1, 'rgba(245, 158, 11, 0.25)');
      ctx.fillStyle = gradient;
      ctx.fill();

      // Stroke curve line
      ctx.beginPath();
      ctx.moveTo(points[0].x, points[0].y);
      points.forEach(p => ctx.lineTo(p.x, p.y));
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 2.5;
      ctx.stroke();
    }

    // Draw Band Control Nodes
    bands.forEach((band) => {
      const x = freqToX(band.frequency);
      const y = dbToY(band.gain);

      ctx.fillStyle = '#f59e0b';
      ctx.beginPath();
      ctx.arc(x, y, 4.5, 0, Math.PI * 2);
      ctx.fill();
      ctx.strokeStyle = '#ffffff';
      ctx.lineWidth = 1.5;
      ctx.stroke();
    });
  }, [bands]);

  useEffect(() => {
    drawEQCurve();
  }, [drawEQCurve]);

  // Handle Preset Selection
  const handleSelectPreset = (presetName: string) => {
    setSelectedPreset(presetName);
    const found = EQ_PRESETS.find(p => p.name === presetName);
    if (!found) return;

    const newBands: EQBand[] = bands.map((band, idx) => {
      if (idx < found.bands.length) {
        return {
          ...band,
          type: found.bands[idx].type,
          frequency: found.bands[idx].frequency,
          gain: found.bands[idx].gain,
          q: found.bands[idx].q,
        };
      }
      return band;
    });

    onBandsChange(newBands);
  };

  const handleUpdateBand = (bandId: string, updates: Partial<EQBand>) => {
    const newBands = bands.map(b => b.id === bandId ? { ...b, ...updates } : b);
    onBandsChange(newBands);
  };

  const handleResetFlat = () => {
    handleSelectPreset('Plano (Flat)');
  };

  return (
    <div className="flex flex-col h-full bg-neutral-900 text-neutral-200 p-4 space-y-4 overflow-y-auto">
      {/* Header and Preset Dropdown */}
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <Sliders className="w-4 h-4 text-amber-500" />
          <h3 className="text-sm font-bold text-white">Ecualizador Gráfico & Paramétrico</h3>
        </div>

        <div className="flex items-center gap-2">
          <select
            value={selectedPreset}
            onChange={(e) => handleSelectPreset(e.target.value)}
            className="px-2.5 py-1 bg-neutral-800 border border-neutral-700 text-xs text-neutral-200 rounded-md outline-none focus:border-amber-500"
          >
            {EQ_PRESETS.map(p => (
              <option key={p.name} value={p.name}>{p.name}</option>
            ))}
          </select>

          <button
            onClick={handleResetFlat}
            className="p-1 text-neutral-400 hover:text-white hover:bg-neutral-800 rounded transition-colors"
            title="Restablecer plano"
          >
            <RotateCcw className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>

      {/* Visual EQ Response Curve Canvas */}
      <div className="w-full bg-neutral-950 border border-neutral-800 rounded-xl overflow-hidden p-2 shadow-inner">
        <canvas
          ref={canvasRef}
          width={600}
          height={160}
          className="w-full h-36 block rounded-lg"
        />
      </div>

      {/* Interactive Band Faders Grid */}
      <div className="grid grid-cols-7 gap-2">
        {bands.map((band) => (
          <div
            key={band.id}
            className="flex flex-col items-center bg-neutral-950/70 border border-neutral-800/80 p-2 rounded-xl text-center"
          >
            <span className="text-[10px] font-bold text-amber-400 tracking-wider">
              {band.label}
            </span>
            <span className="text-[9px] font-mono text-neutral-400">
              {band.frequency >= 1000 ? `${(band.frequency / 1000).toFixed(1)}k` : `${Math.round(band.frequency)}`}Hz
            </span>

            {/* Vertical Gain Slider */}
            <div className="h-28 flex items-center justify-center my-2">
              <input
                type="range"
                min="-20"
                max="20"
                step="0.5"
                value={band.gain}
                onChange={(e) => handleUpdateBand(band.id, { gain: parseFloat(e.target.value) })}
                className="h-24 w-1.5 bg-neutral-800 rounded-lg appearance-none cursor-pointer [writing-mode:vertical-lr] [direction:rtl]"
              />
            </div>

            <span className="text-[10px] font-mono font-semibold text-neutral-200">
              {band.gain > 0 ? `+${band.gain.toFixed(1)}` : band.gain.toFixed(1)} dB
            </span>

            {/* Filter type badge */}
            <select
              value={band.type}
              onChange={(e) => handleUpdateBand(band.id, { type: e.target.value as BiquadFilterType })}
              className="mt-1.5 w-full bg-neutral-900 border border-neutral-800 text-[9px] text-neutral-400 rounded px-1 py-0.5 outline-none"
            >
              <option value="peaking">Peak</option>
              <option value="lowshelf">LowShelf</option>
              <option value="highshelf">HighShelf</option>
              <option value="highpass">HighPass</option>
              <option value="lowpass">LowPass</option>
              <option value="notch">Notch</option>
              <option value="bandpass">BandPass</option>
            </select>
          </div>
        ))}
      </div>

      {/* Apply EQ Button */}
      <div className="pt-2">
        <button
          onClick={onApplyEQ}
          disabled={!hasAudio || isProcessing}
          className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg bg-amber-500 hover:bg-amber-400 active:bg-amber-600 text-neutral-950 font-bold text-xs shadow-md transition-all disabled:opacity-40 disabled:cursor-not-allowed"
        >
          <Check className="w-4 h-4 stroke-[2.5]" />
          <span>{isProcessing ? 'Procesando ecualización...' : 'Aplicar Ecualización al Audio'}</span>
        </button>
      </div>
    </div>
  );
};

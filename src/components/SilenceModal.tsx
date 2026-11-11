import React, { useState } from 'react';
import { X, Clock, Check } from 'lucide-react';

interface SilenceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onInsertSilence: (durationSec: number) => void;
}

export const SilenceModal: React.FC<SilenceModalProps> = ({
  isOpen,
  onClose,
  onInsertSilence,
}) => {
  const [duration, setDuration] = useState<number>(1.0);

  if (!isOpen) return null;

  const handleConfirm = () => {
    if (duration > 0) {
      onInsertSilence(duration);
      onClose();
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-xs">
      <div className="w-full max-w-sm bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl p-5 text-neutral-200">
        <div className="flex items-center justify-between pb-3 border-b border-neutral-800">
          <div className="flex items-center gap-2">
            <Clock className="w-4 h-4 text-purple-400" />
            <h3 className="text-sm font-bold text-white">Insertar Silencio</h3>
          </div>
          <button onClick={onClose} className="text-neutral-400 hover:text-white">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="py-4 space-y-3 text-xs">
          <p className="text-neutral-400">
            Inserta un intervalo de silencio en la posición actual del cursor.
          </p>

          <div>
            <label className="block font-semibold text-neutral-300 mb-1">Duración (segundos)</label>
            <input
              type="number"
              min="0.1"
              max="60"
              step="0.1"
              value={duration}
              onChange={(e) => setDuration(Math.max(0.01, parseFloat(e.target.value) || 0))}
              className="w-full px-3 py-2 bg-neutral-950 border border-neutral-800 rounded-lg text-white font-mono font-bold outline-none focus:border-amber-500"
            />
          </div>

          <div className="grid grid-cols-4 gap-1.5">
            {[0.5, 1.0, 2.0, 5.0].map((s) => (
              <button
                key={s}
                onClick={() => setDuration(s)}
                className={`py-1 rounded font-mono transition-colors ${
                  duration === s
                    ? 'bg-purple-500/20 text-purple-300 border border-purple-500/40 font-bold'
                    : 'bg-neutral-800 text-neutral-400 hover:text-white'
                }`}
              >
                {s}s
              </button>
            ))}
          </div>
        </div>

        <div className="flex items-center justify-end gap-2 pt-3 border-t border-neutral-800">
          <button
            onClick={onClose}
            className="px-3 py-1.5 text-xs text-neutral-400 hover:text-white"
          >
            Cancelar
          </button>
          <button
            onClick={handleConfirm}
            className="flex items-center gap-1.5 px-4 py-1.5 bg-amber-500 hover:bg-amber-400 text-neutral-950 text-xs font-bold rounded-lg shadow-sm transition-all"
          >
            <Check className="w-3.5 h-3.5 stroke-[2.5]" />
            <span>Insertar</span>
          </button>
        </div>
      </div>
    </div>
  );
};

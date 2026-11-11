import React, { useState, useEffect } from 'react';
import {
  Scissors,
  Copy,
  ClipboardPaste,
  Trash2,
  CheckSquare,
  VolumeX,
  Crop,
  Split,
  CopyPlus,
  Clock,
  Layers,
  ZoomIn,
  ZoomOut,
  Maximize2,
  XCircle,
} from 'lucide-react';
import { AudioSelection } from '../types/audio';

interface ToolbarProps {
  selection: AudioSelection | null;
  totalDuration: number;
  hasClipboard: boolean;
  onCut: () => void;
  onCopy: () => void;
  onPaste: () => void;
  onDelete: () => void;
  onSelectAll: () => void;
  onClearSelection: () => void;
  onMuteSelection: () => void;
  onTrimToSelection: () => void;
  onSplit: () => void;
  onDuplicate: () => void;
  onOpenInsertSilence: () => void;
  onMergeTracks: () => void;
  onZoomIn: () => void;
  onZoomOut: () => void;
  onZoomFit: () => void;
  onUpdateSelection: (start: number, end: number) => void;
}

export const Toolbar: React.FC<ToolbarProps> = ({
  selection,
  totalDuration,
  hasClipboard,
  onCut,
  onCopy,
  onPaste,
  onDelete,
  onSelectAll,
  onClearSelection,
  onMuteSelection,
  onTrimToSelection,
  onSplit,
  onDuplicate,
  onOpenInsertSilence,
  onMergeTracks,
  onZoomIn,
  onZoomOut,
  onZoomFit,
  onUpdateSelection,
}) => {
  const [startInput, setStartInput] = useState('0.000');
  const [endInput, setEndInput] = useState('0.000');
  const [durInput, setDurInput] = useState('0.000');

  useEffect(() => {
    if (selection) {
      setStartInput(selection.start.toFixed(3));
      setEndInput(selection.end.toFixed(3));
      setDurInput(Math.max(0, selection.end - selection.start).toFixed(3));
    } else {
      setStartInput('0.000');
      setEndInput(totalDuration > 0 ? totalDuration.toFixed(3) : '0.000');
      setDurInput('0.000');
    }
  }, [selection, totalDuration]);

  const handleApplyInputs = (type: 'start' | 'end' | 'dur', valStr: string) => {
    const val = parseFloat(valStr);
    if (isNaN(val)) return;

    const currentStart = selection ? selection.start : 0;
    const currentEnd = selection ? selection.end : totalDuration;

    if (type === 'start') {
      const newStart = Math.max(0, Math.min(val, currentEnd - 0.001));
      onUpdateSelection(newStart, currentEnd);
    } else if (type === 'end') {
      const newEnd = Math.max(currentStart + 0.001, Math.min(val, totalDuration));
      onUpdateSelection(currentStart, newEnd);
    } else if (type === 'dur') {
      const newEnd = Math.min(totalDuration, currentStart + Math.max(0.001, val));
      onUpdateSelection(currentStart, newEnd);
    }
  };

  const hasSelection = selection !== null && selection.end > selection.start;

  return (
    <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-2 bg-neutral-900/90 border-b border-neutral-800 text-neutral-300 text-xs">
      {/* Edit Operations Group */}
      <div className="flex items-center gap-1 overflow-x-auto py-0.5">
        <button
          onClick={onCut}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Cortar selección (Ctrl+X)"
        >
          <Scissors className="w-3.5 h-3.5 text-amber-400" />
          <span>Cortar</span>
        </button>

        <button
          onClick={onCopy}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Copiar selección (Ctrl+C)"
        >
          <Copy className="w-3.5 h-3.5 text-sky-400" />
          <span>Copiar</span>
        </button>

        <button
          onClick={onPaste}
          disabled={!hasClipboard}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Pegar audio copiado (Ctrl+V)"
        >
          <ClipboardPaste className="w-3.5 h-3.5 text-emerald-400" />
          <span>Pegar</span>
        </button>

        <button
          onClick={onDelete}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Eliminar selección (Delete)"
        >
          <Trash2 className="w-3.5 h-3.5 text-rose-400" />
          <span>Eliminar</span>
        </button>

        <div className="h-4 w-px bg-neutral-800 mx-1" />

        <button
          onClick={onSelectAll}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Seleccionar todo el audio (Ctrl+A)"
        >
          <CheckSquare className="w-3.5 h-3.5 text-neutral-400" />
          <span>Todo</span>
        </button>

        <button
          onClick={onMuteSelection}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Silenciar la selección"
        >
          <VolumeX className="w-3.5 h-3.5 text-orange-400" />
          <span>Silenciar</span>
        </button>

        <button
          onClick={onTrimToSelection}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Recortar manteniendo únicamente la selección"
        >
          <Crop className="w-3.5 h-3.5 text-indigo-400" />
          <span>Recortar</span>
        </button>

        <button
          onClick={onSplit}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Dividir pista en el cursor"
        >
          <Split className="w-3.5 h-3.5 text-teal-400" />
          <span>Dividir</span>
        </button>

        <button
          onClick={onDuplicate}
          disabled={!hasSelection}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white disabled:opacity-40 disabled:hover:bg-transparent disabled:cursor-not-allowed transition-colors"
          title="Duplicar fragmento seleccionado"
        >
          <CopyPlus className="w-3.5 h-3.5 text-yellow-400" />
          <span>Duplicar</span>
        </button>

        <button
          onClick={onOpenInsertSilence}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Insertar silencio en el cursor"
        >
          <Clock className="w-3.5 h-3.5 text-purple-400" />
          <span>Insertar silencio</span>
        </button>

        <button
          onClick={onMergeTracks}
          className="flex items-center gap-1.5 px-2.5 py-1.5 rounded hover:bg-neutral-800 text-neutral-300 hover:text-white transition-colors"
          title="Mezclar y unir todas las pistas en una sola"
        >
          <Layers className="w-3.5 h-3.5 text-cyan-400" />
          <span>Unir Pistas</span>
        </button>
      </div>

      {/* Selection Values Editor & Clear Selection Button */}
      <div className="flex items-center gap-3 shrink-0">
        <div className="flex items-center gap-2 bg-neutral-950/70 border border-neutral-800 px-3 py-1 rounded-md text-[11px]">
          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">Inicio:</span>
            <input
              type="text"
              value={startInput}
              onChange={(e) => setStartInput(e.target.value)}
              onBlur={() => handleApplyInputs('start', startInput)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyInputs('start', startInput)}
              className="w-16 px-1.5 py-0.5 bg-neutral-800/90 border border-neutral-700 rounded text-amber-400 font-mono text-center font-medium focus:border-amber-500 outline-none"
              title="Inicio de selección en segundos"
            />
            <span className="text-neutral-400">s</span>
          </div>

          <span className="text-neutral-600">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">Final:</span>
            <input
              type="text"
              value={endInput}
              onChange={(e) => setEndInput(e.target.value)}
              onBlur={() => handleApplyInputs('end', endInput)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyInputs('end', endInput)}
              className="w-16 px-1.5 py-0.5 bg-neutral-800/90 border border-neutral-700 rounded text-amber-400 font-mono text-center font-medium focus:border-amber-500 outline-none"
              title="Final de selección en segundos"
            />
            <span className="text-neutral-400">s</span>
          </div>

          <span className="text-neutral-600">·</span>

          <div className="flex items-center gap-1.5">
            <span className="text-neutral-400 uppercase tracking-wider text-[10px] font-semibold">Duración:</span>
            <input
              type="text"
              value={durInput}
              onChange={(e) => setDurInput(e.target.value)}
              onBlur={() => handleApplyInputs('dur', durInput)}
              onKeyDown={(e) => e.key === 'Enter' && handleApplyInputs('dur', durInput)}
              className="w-16 px-1.5 py-0.5 bg-neutral-800/90 border border-neutral-700 rounded text-emerald-400 font-mono text-center font-medium focus:border-emerald-500 outline-none"
              title="Duración de selección en segundos"
            />
            <span className="text-neutral-400">s</span>
          </div>

          {hasSelection && (
            <button
              onClick={onClearSelection}
              className="ml-2 flex items-center gap-1 px-2 py-0.5 text-[10px] font-bold text-neutral-300 hover:text-white bg-neutral-800 hover:bg-neutral-700 active:bg-neutral-600 rounded transition-colors whitespace-nowrap"
              title="Limpiar selección sin modificar el audio"
            >
              <XCircle className="w-3 h-3 text-neutral-400" />
              <span>CLEAR SELECTION</span>
            </button>
          )}
        </div>

        {/* Zoom Controls */}
        <div className="flex items-center gap-1 bg-neutral-950/70 border border-neutral-800 p-0.5 rounded-md">
          <button
            onClick={onZoomOut}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Reducir Zoom (-)"
          >
            <ZoomOut className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomIn}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Aumentar Zoom (+)"
          >
            <ZoomIn className="w-3.5 h-3.5" />
          </button>
          <button
            onClick={onZoomFit}
            className="p-1 rounded hover:bg-neutral-800 text-neutral-400 hover:text-white transition-colors"
            title="Ajustar a pantalla"
          >
            <Maximize2 className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
};

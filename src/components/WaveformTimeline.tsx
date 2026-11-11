import React, { useRef, useEffect, useState, useCallback } from 'react';
import { AudioTrack, AudioSelection } from '../types/audio';
import { Trash2, Plus, Upload, Music } from 'lucide-react';

interface WaveformTimelineProps {
  tracks: AudioTrack[];
  activeTrackId: string;
  onSelectTrack: (trackId: string) => void;
  selection: AudioSelection | null;
  onSelectionChange: (sel: AudioSelection | null) => void;
  currentTime: number;
  onSeek: (time: number) => void;
  zoom: number; // pixels per second
  onZoomChange: (newZoom: number) => void;
  onTrackUpdate: (trackId: string, updates: Partial<AudioTrack>) => void;
  onRemoveTrack: (trackId: string) => void;
  onAddTrack: () => void;
  onDropFiles: (files: FileList) => void;
}

export const WaveformTimeline: React.FC<WaveformTimelineProps> = ({
  tracks,
  activeTrackId,
  onSelectTrack,
  selection,
  onSelectionChange,
  currentTime,
  onSeek,
  zoom,
  onZoomChange,
  onTrackUpdate,
  onRemoveTrack,
  onAddTrack,
  onDropFiles,
}) => {
  const containerRef = useRef<HTMLDivElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [isDraggingSelection, setIsDraggingSelection] = useState(false);
  const [dragType, setDragType] = useState<'create' | 'moveStart' | 'moveEnd' | 'scrub' | null>(null);
  const [dragAnchorTime, setDragAnchorTime] = useState(0);
  const [isDragOver, setIsDragOver] = useState(false);

  // Determine total timeline length
  let maxDuration = 10;
  tracks.forEach(t => {
    if (t.buffer) {
      const end = (t.startTime || 0) + t.buffer.duration;
      if (end > maxDuration) maxDuration = end;
    }
  });
  maxDuration = Math.max(10, Math.ceil(maxDuration + 2));

  const totalPixelWidth = Math.max(1200, Math.round(maxDuration * zoom));
  const trackHeight = 110;
  const rulerHeight = 28;
  const totalCanvasHeight = rulerHeight + Math.max(1, tracks.length) * trackHeight;

  // Format time in mm:ss.mmm
  const formatTimeRuler = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const secs = Math.floor(sec % 60);
    const ms = Math.floor((sec % 1) * 1000);
    if (zoom > 150) {
      return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}.${ms.toString().padStart(3, '0')}`;
    }
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  // Redraw canvas
  const drawTimeline = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const width = canvas.width;
    const height = canvas.height;

    // Background
    ctx.fillStyle = '#0a0a0a';
    ctx.fillRect(0, 0, width, height);

    // 1. Draw Ruler Background
    ctx.fillStyle = '#141414';
    ctx.fillRect(0, 0, width, rulerHeight);
    ctx.strokeStyle = '#262626';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(0, rulerHeight);
    ctx.lineTo(width, rulerHeight);
    ctx.stroke();

    // Determine grid step based on zoom
    let majorStepSec = 1.0;
    if (zoom < 30) majorStepSec = 10.0;
    else if (zoom < 70) majorStepSec = 5.0;
    else if (zoom < 150) majorStepSec = 2.0;
    else if (zoom < 350) majorStepSec = 1.0;
    else if (zoom < 800) majorStepSec = 0.5;
    else majorStepSec = 0.1;

    const minorStepSec = majorStepSec / 5;

    // Draw ruler tick marks
    ctx.fillStyle = '#737373';
    ctx.font = '10px "JetBrains Mono", monospace';
    ctx.textBaseline = 'top';

    for (let t = 0; t <= maxDuration; t += minorStepSec) {
      const x = Math.round(t * zoom);
      const isMajor = Math.abs((t / majorStepSec) - Math.round(t / majorStepSec)) < 0.001;

      if (isMajor) {
        ctx.strokeStyle = '#525252';
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight - 12);
        ctx.lineTo(x, rulerHeight);
        ctx.stroke();

        ctx.fillText(formatTimeRuler(t), x + 3, 4);

        // Vertical faint grid line across tracks
        ctx.strokeStyle = '#1a1a1a';
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight);
        ctx.lineTo(x, height);
        ctx.stroke();
      } else {
        ctx.strokeStyle = '#333333';
        ctx.beginPath();
        ctx.moveTo(x, rulerHeight - 6);
        ctx.lineTo(x, rulerHeight);
        ctx.stroke();
      }
    }

    // 2. Draw Tracks & Waveforms
    tracks.forEach((track, idx) => {
      const trackTop = rulerHeight + idx * trackHeight;
      const trackBottom = trackTop + trackHeight;
      const isActive = track.id === activeTrackId;

      // Track background
      ctx.fillStyle = isActive ? '#121212' : '#0c0c0c';
      ctx.fillRect(0, trackTop, width, trackHeight);

      // Track border line
      ctx.strokeStyle = '#1e1e1e';
      ctx.strokeRect(0, trackTop, width, trackHeight);

      if (!track.buffer) {
        // Empty track placeholder
        ctx.fillStyle = '#525252';
        ctx.font = '11px "Plus Jakarta Sans", sans-serif';
        ctx.fillText('Arrastra un archivo de audio aquí...', 20, trackTop + trackHeight / 2 - 5);
        return;
      }

      const buffer = track.buffer;
      const numChannels = buffer.numberOfChannels;
      const trackStartPx = Math.round((track.startTime || 0) * zoom);
      const trackDurationPx = Math.round(buffer.duration * zoom);
      const sampleRate = buffer.sampleRate;

      const channelHeight = (trackHeight - 6) / numChannels;

      // Draw each channel (Stereo or Mono)
      for (let ch = 0; ch < numChannels; ch++) {
        const channelData = buffer.getChannelData(ch);
        const chTop = trackTop + 3 + ch * channelHeight;
        const chCenter = chTop + channelHeight / 2;
        const chHalfHeight = (channelHeight / 2) * 0.92;

        // Channel center line
        ctx.strokeStyle = '#262626';
        ctx.beginPath();
        ctx.moveTo(trackStartPx, chCenter);
        ctx.lineTo(trackStartPx + trackDurationPx, chCenter);
        ctx.stroke();

        // Waveform styling
        const baseColor = track.color || '#f59e0b';
        ctx.fillStyle = baseColor;
        ctx.strokeStyle = baseColor;
        ctx.lineWidth = 1;

        const step = Math.max(1, Math.floor(sampleRate / zoom));

        // Peak and RMS bars
        for (let px = 0; px < trackDurationPx; px++) {
          const sampleStart = Math.floor((px / zoom) * sampleRate);
          const sampleEnd = Math.min(channelData.length, sampleStart + step);

          let min = 1.0;
          let max = -1.0;
          let sumSquares = 0;
          let count = 0;

          for (let s = sampleStart; s < sampleEnd; s++) {
            const val = channelData[s];
            if (val < min) min = val;
            if (val > max) max = val;
            sumSquares += val * val;
            count++;
          }

          if (count === 0) continue;

          const rms = Math.sqrt(sumSquares / count);
          const drawX = trackStartPx + px;

          // Outer peak stroke
          const peakTop = chCenter - max * chHalfHeight;
          const peakBottom = chCenter - min * chHalfHeight;
          ctx.globalAlpha = 0.45;
          ctx.beginPath();
          ctx.moveTo(drawX, peakTop);
          ctx.lineTo(drawX, peakBottom);
          ctx.stroke();

          // Inner RMS solid core
          const rmsTop = chCenter - rms * chHalfHeight;
          const rmsBottom = chCenter + rms * chHalfHeight;
          ctx.globalAlpha = 0.9;
          ctx.beginPath();
          ctx.moveTo(drawX, rmsTop);
          ctx.lineTo(drawX, rmsBottom);
          ctx.stroke();
        }

        ctx.globalAlpha = 1.0;

        // Channel label indicator (L / R)
        ctx.fillStyle = '#737373';
        ctx.font = '9px "JetBrains Mono", monospace';
        ctx.fillText(numChannels === 1 ? 'MONO' : ch === 0 ? 'L' : 'R', trackStartPx + 6, chTop + 2);
      }
    });

    // 3. Selection Region Highlight & Drag Handles
    if (selection && selection.end > selection.start) {
      const selStartPx = Math.round(selection.start * zoom);
      const selEndPx = Math.round(selection.end * zoom);
      const selWidth = Math.max(2, selEndPx - selStartPx);

      // Translucent amber highlight
      ctx.fillStyle = 'rgba(245, 158, 11, 0.18)';
      ctx.fillRect(selStartPx, rulerHeight, selWidth, height - rulerHeight);

      // Ruler selection range
      ctx.fillStyle = 'rgba(245, 158, 11, 0.45)';
      ctx.fillRect(selStartPx, 0, selWidth, rulerHeight);

      // Left boundary line & handle
      ctx.strokeStyle = '#f59e0b';
      ctx.lineWidth = 1.5;
      ctx.beginPath();
      ctx.moveTo(selStartPx, 0);
      ctx.lineTo(selStartPx, height);
      ctx.stroke();

      // Right boundary line & handle
      ctx.beginPath();
      ctx.moveTo(selEndPx, 0);
      ctx.lineTo(selEndPx, height);
      ctx.stroke();

      // Glowing markers in ruler
      ctx.fillStyle = '#f59e0b';
      ctx.fillRect(selStartPx - 2, 0, 4, rulerHeight);
      ctx.fillRect(selEndPx - 2, 0, 4, rulerHeight);
    }

    // 4. Playhead Line & Cursor Handle
    const playheadPx = Math.round(currentTime * zoom);
    ctx.strokeStyle = '#ef4444';
    ctx.lineWidth = 2;
    ctx.beginPath();
    ctx.moveTo(playheadPx, 0);
    ctx.lineTo(playheadPx, height);
    ctx.stroke();

    // Playhead arrow indicator at the ruler
    ctx.fillStyle = '#ef4444';
    ctx.beginPath();
    ctx.moveTo(playheadPx - 6, 0);
    ctx.lineTo(playheadPx + 6, 0);
    ctx.lineTo(playheadPx, 10);
    ctx.closePath();
    ctx.fill();
  }, [tracks, activeTrackId, selection, currentTime, zoom, maxDuration, totalPixelWidth, totalCanvasHeight]);

  useEffect(() => {
    drawTimeline();
  }, [drawTimeline]);

  // Handle canvas sizing for crisp Retina display
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.width = totalPixelWidth;
    canvas.height = totalCanvasHeight;
    drawTimeline();
  }, [totalPixelWidth, totalCanvasHeight, drawTimeline]);

  // Mouse coordinate to timeline seconds
  const getTimelineTimeFromEvent = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return 0;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    return Math.max(0, x / zoom);
  };

  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const time = getTimelineTimeFromEvent(e);
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const y = e.clientY - rect.top;

    // Check if clicked in ruler or near playhead
    if (y < rulerHeight) {
      onSeek(time);
      setDragType('scrub');
      setIsDraggingSelection(true);
      return;
    }

    // Check if clicked near selection bounds
    if (selection) {
      const startPx = selection.start * zoom;
      const endPx = selection.end * zoom;
      const clickPx = time * zoom;

      if (Math.abs(clickPx - startPx) < 8) {
        setDragType('moveStart');
        setDragAnchorTime(selection.end);
        setIsDraggingSelection(true);
        return;
      }
      if (Math.abs(clickPx - endPx) < 8) {
        setDragType('moveEnd');
        setDragAnchorTime(selection.start);
        setIsDraggingSelection(true);
        return;
      }
    }

    // If shift key held down, extend selection
    if (e.shiftKey && selection) {
      if (time > selection.start) {
        onSelectionChange({ start: selection.start, end: time });
      } else {
        onSelectionChange({ start: time, end: selection.end });
      }
      return;
    }

    // Otherwise, start creating new selection or set cursor
    onSeek(time);
    setDragType('create');
    setDragAnchorTime(time);
    setIsDraggingSelection(true);
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (!isDraggingSelection || !dragType) return;
    const time = getTimelineTimeFromEvent(e);

    if (dragType === 'scrub') {
      onSeek(time);
    } else if (dragType === 'create') {
      const s = Math.min(dragAnchorTime, time);
      const end = Math.max(dragAnchorTime, time);
      if (end - s > 0.02) {
        onSelectionChange({ start: s, end });
      }
    } else if (dragType === 'moveStart') {
      const newStart = Math.min(time, dragAnchorTime - 0.01);
      onSelectionChange({ start: Math.max(0, newStart), end: dragAnchorTime });
    } else if (dragType === 'moveEnd') {
      const newEnd = Math.max(time, dragAnchorTime + 0.01);
      onSelectionChange({ start: dragAnchorTime, end: newEnd });
    }
  };

  const handleMouseUp = () => {
    setIsDraggingSelection(false);
    setDragType(null);
  };

  // Wheel zoom / scroll
  const handleWheel = (e: React.WheelEvent) => {
    if (e.ctrlKey || e.altKey) {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.25 : 0.8;
      const newZoom = Math.max(10, Math.min(1000, zoom * zoomFactor));
      onZoomChange(newZoom);
    }
  };

  // Drag and Drop files onto waveform
  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      onDropFiles(e.dataTransfer.files);
    }
  };

  const hasAnyAudio = tracks.some(t => t.buffer !== null);

  return (
    <div
      className="flex-1 flex flex-col bg-neutral-950 overflow-hidden relative select-none"
      onWheel={handleWheel}
      onDragOver={handleDragOver}
      onDragLeave={handleDragLeave}
      onDrop={handleDrop}
    >
      {/* Drag & Drop Visual Scrim */}
      {isDragOver && (
        <div className="absolute inset-0 bg-amber-500/20 border-2 border-dashed border-amber-400 z-50 flex items-center justify-center backdrop-blur-xs">
          <div className="bg-neutral-900/90 px-6 py-4 rounded-xl border border-amber-400 text-center shadow-2xl">
            <Upload className="w-10 h-10 text-amber-400 mx-auto mb-2 animate-bounce" />
            <div className="text-base font-bold text-white">Suelta tus archivos de audio aquí</div>
            <div className="text-xs text-neutral-400 mt-1">MP3, WAV, FLAC, OGG, M4A, AAC, OPUS, AIFF</div>
          </div>
        </div>
      )}

      {/* Main Track View Layout: Track Headers Left, Canvas Timeline Right */}
      <div className="flex-1 flex overflow-hidden">
        {/* Track Headers Column */}
        <div className="w-56 shrink-0 bg-neutral-900 border-r border-neutral-800 flex flex-col z-10 shadow-lg">
          {/* Top ruler filler */}
          <div className="h-7 border-b border-neutral-800 flex items-center justify-between px-3 text-[11px] font-semibold text-neutral-400">
            <span>PISTAS ({tracks.length})</span>
            <button
              onClick={onAddTrack}
              className="flex items-center gap-1 text-[10px] text-amber-400 hover:text-amber-300 font-medium px-1.5 py-0.5 rounded hover:bg-neutral-800 transition-colors"
              title="Añadir nueva pista"
            >
              <Plus className="w-3 h-3" />
              <span>Añadir</span>
            </button>
          </div>

          {/* Track Headers List */}
          <div className="flex-1 overflow-y-auto">
            {tracks.map((track) => {
              const isActive = track.id === activeTrackId;
              return (
                <div
                  key={track.id}
                  onClick={() => onSelectTrack(track.id)}
                  style={{ height: `${trackHeight}px` }}
                  className={`p-2.5 border-b border-neutral-800 cursor-pointer transition-colors flex flex-col justify-between ${
                    isActive ? 'bg-neutral-800/80 border-l-2 border-l-amber-500' : 'hover:bg-neutral-800/40'
                  }`}
                >
                  <div className="flex items-center justify-between gap-1.5">
                    <div className="flex items-center gap-1.5 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0"
                        style={{ backgroundColor: track.color }}
                      />
                      <input
                        type="text"
                        value={track.name}
                        onChange={(e) => onTrackUpdate(track.id, { name: e.target.value })}
                        className="bg-transparent text-xs font-semibold text-neutral-200 outline-none hover:bg-neutral-700/50 px-1 py-0.5 rounded truncate"
                      />
                    </div>
                    {tracks.length > 1 && (
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          onRemoveTrack(track.id);
                        }}
                        className="text-neutral-500 hover:text-rose-400 p-1 rounded transition-colors"
                        title="Eliminar pista"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                  </div>

                  {/* Mute and Solo */}
                  <div className="flex items-center gap-1.5">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackUpdate(track.id, { mute: !track.mute });
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                        track.mute
                          ? 'bg-rose-500/20 text-rose-400 border border-rose-500/40'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Silenciar pista"
                    >
                      MUTE
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onTrackUpdate(track.id, { solo: !track.solo });
                      }}
                      className={`px-2 py-0.5 text-[10px] font-bold rounded transition-colors ${
                        track.solo
                          ? 'bg-amber-500 text-neutral-950 font-black'
                          : 'bg-neutral-800 text-neutral-400 hover:text-white'
                      }`}
                      title="Solo pista"
                    >
                      SOLO
                    </button>
                    <span className="text-[10px] text-neutral-400 ml-auto font-mono">
                      {track.buffer ? `${track.buffer.duration.toFixed(1)}s` : 'Vacía'}
                    </span>
                  </div>

                  {/* Volume & Pan Faders */}
                  <div className="space-y-1">
                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <span className="w-5 font-mono text-[9px]">VOL</span>
                      <input
                        type="range"
                        min="0"
                        max="2"
                        step="0.05"
                        value={track.volume}
                        onChange={(e) => onTrackUpdate(track.id, { volume: parseFloat(e.target.value) })}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-7 text-right font-mono text-[9px] text-neutral-300">
                        {Math.round(track.volume * 100)}%
                      </span>
                    </div>

                    <div className="flex items-center gap-1.5 text-[10px] text-neutral-400">
                      <span className="w-5 font-mono text-[9px]">PAN</span>
                      <input
                        type="range"
                        min="-1"
                        max="1"
                        step="0.1"
                        value={track.pan}
                        onChange={(e) => onTrackUpdate(track.id, { pan: parseFloat(e.target.value) })}
                        onClick={(e) => e.stopPropagation()}
                        className="flex-1 h-1 bg-neutral-700 rounded-lg appearance-none cursor-pointer"
                      />
                      <span className="w-7 text-right font-mono text-[9px] text-neutral-300">
                        {track.pan === 0 ? 'C' : track.pan < 0 ? `L${Math.round(-track.pan * 50)}` : `R${Math.round(track.pan * 50)}`}
                      </span>
                    </div>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Waveform Scrollable Canvas Viewport */}
        <div
          ref={containerRef}
          className="flex-1 overflow-x-auto overflow-y-auto relative bg-neutral-950"
        >
          {!hasAnyAudio && (
            <div className="absolute inset-0 flex flex-col items-center justify-center p-8 text-center pointer-events-none z-20">
              <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-4 text-amber-500 shadow-xl">
                <Music className="w-8 h-8 stroke-[1.5]" />
              </div>
              <h3 className="text-base font-bold text-neutral-200">Arrastra un archivo de audio o carga una muestra</h3>
              <p className="text-xs text-neutral-400 max-w-sm mt-1">
                Soporta MP3, WAV, FLAC, OGG, M4A, AAC, OPUS y AIFF con edición directa en el navegador.
              </p>
            </div>
          )}

          <canvas
            ref={canvasRef}
            onMouseDown={handleMouseDown}
            onMouseMove={handleMouseMove}
            onMouseUp={handleMouseUp}
            className="block cursor-crosshair"
          />
        </div>
      </div>
    </div>
  );
};

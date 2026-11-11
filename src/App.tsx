import React, { useState, useEffect, useRef, useCallback } from 'react';
import {
  AudioTrack,
  AudioSelection,
  EQBand,
  EffectConfig,
} from './types/audio';
import { getAudioContext, playbackEngine } from './audio/audioContext';
import {
  sliceAudioBuffer,
  pasteAudioBuffer,
  deleteRangeAudioBuffer,
  muteRangeAudioBuffer,
  insertSilenceBuffer,
  splitAudioBuffer,
  adjustVolume,
  applyNormalize,
  applyFade,
  reverseAudio,
  convertChannels,
  applyNoiseGate,
  removeSilences,
  changeSpeed,
  changePitch,
  applyCompressor,
  applyEQ,
  applyEffects,
  mixDownTracks,
} from './audio/audioBufferUtils';
import { generateDemoTrack } from './audio/syntheticAudio';
import { audioBufferToWavBlob, downloadBlob, resampleAudioBuffer, WavBitDepth } from './audio/exportWav';
import { saveProject, loadProject, serializeTracks, deserializeTracks } from './utils/db';
import { Header } from './components/Header';
import { Toolbar } from './components/Toolbar';
import { WaveformTimeline } from './components/WaveformTimeline';
import { TransportBar } from './components/TransportBar';
import { SidePanel } from './components/SidePanel';
import { ExportModal } from './components/ExportModal';
import { ProjectModal } from './components/ProjectModal';
import { SilenceModal } from './components/SilenceModal';
import { Footer } from './components/Footer';
import { AboutModal } from './components/AboutModal';
import { DEFAULT_EFFECTS } from './components/EffectsRackView';

const INITIAL_EQ_BANDS: EQBand[] = [
  { id: 'b-sub', type: 'highpass', frequency: 30, gain: 0, q: 0.7, label: 'Sub HP' },
  { id: 'b-bass', type: 'lowshelf', frequency: 100, gain: 0, q: 0.7, label: 'Graves' },
  { id: 'b-lmid', type: 'peaking', frequency: 400, gain: 0, q: 1.0, label: 'Med-Bajos' },
  { id: 'b-mid', type: 'peaking', frequency: 1200, gain: 0, q: 1.0, label: 'Medios' },
  { id: 'b-hmid', type: 'peaking', frequency: 3500, gain: 0, q: 1.0, label: 'Med-Altos' },
  { id: 'b-treble', type: 'highshelf', frequency: 10000, gain: 0, q: 0.7, label: 'Agudos' },
  { id: 'b-air', type: 'lowpass', frequency: 18000, gain: 0, q: 0.7, label: 'Air LP' },
];

const TRACK_COLORS = ['#f59e0b', '#06b6d4', '#10b981', '#8b5cf6', '#ec4899', '#3b82f6'];

export default function App() {
  const [projectId, setProjectId] = useState<string>(() => 'proj-' + Date.now());
  const [projectName, setProjectName] = useState<string>('Mi Proyecto de Audio');
  const [tracks, setTracks] = useState<AudioTrack[]>([]);
  const [activeTrackId, setActiveTrackId] = useState<string>('');
  const [selection, setSelection] = useState<AudioSelection | null>(null);
  const [currentTime, setCurrentTime] = useState<number>(0);
  const [isPlaying, setIsPlaying] = useState<boolean>(false);
  const [loop, setLoop] = useState<boolean>(false);
  const [zoom, setZoom] = useState<number>(90); // px per second
  const [masterVolume, setMasterVolume] = useState<number>(1.0);
  const [levelL, setLevelL] = useState<number>(0);
  const [levelR, setLevelR] = useState<number>(0);
  const [clipboardBuffer, setClipboardBuffer] = useState<AudioBuffer | null>(null);
  const [eqBands, setEqBands] = useState<EQBand[]>(INITIAL_EQ_BANDS);
  const [effects, setEffects] = useState<EffectConfig[]>(DEFAULT_EFFECTS);
  const [isProcessing, setIsProcessing] = useState<boolean>(false);
  const [isDark, setIsDark] = useState<boolean>(true);

  // Modals
  const [isExportOpen, setIsExportOpen] = useState<boolean>(false);
  const [isProjectOpen, setIsProjectOpen] = useState<boolean>(false);
  const [isSilenceOpen, setIsSilenceOpen] = useState<boolean>(false);
  const [isAboutOpen, setIsAboutOpen] = useState<boolean>(false);

  // History stack for Undo / Redo
  const [undoStack, setUndoStack] = useState<string[]>([]);
  const [redoStack, setRedoStack] = useState<string[]>([]);

  const fileInputRef = useRef<HTMLInputElement>(null);

  // Push current state to undo history
  const pushHistory = useCallback((currentTracks: AudioTrack[]) => {
    try {
      const serialized = JSON.stringify(serializeTracks(currentTracks));
      setUndoStack((prev) => [...prev.slice(-15), serialized]);
      setRedoStack([]); // clear redo stack on new operation
    } catch (e) {
      console.error('History push error:', e);
    }
  }, []);

  // Initialize with a high-fidelity synthetic demo track
  useEffect(() => {
    try {
      const demoBuffer = generateDemoTrack('synthwave');
      const initialTrack: AudioTrack = {
        id: 'track-1',
        name: 'Sintetizador & Ritmo',
        color: TRACK_COLORS[0],
        buffer: demoBuffer,
        volume: 1.0,
        pan: 0,
        mute: false,
        solo: false,
        startTime: 0,
      };
      setTracks([initialTrack]);
      setActiveTrackId('track-1');
      pushHistory([initialTrack]);
    } catch (e) {
      console.error('Error creating initial track:', e);
    }
  }, [pushHistory]);

  // Sync theme with document element
  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  // Total project duration calculation
  const totalDuration = tracks.reduce((max, t) => {
    const end = (t.startTime || 0) + (t.buffer?.duration || 0);
    return end > max ? end : max;
  }, 0);

  // Active track reference
  const activeTrack = tracks.find((t) => t.id === activeTrackId) || tracks[0] || null;
  const hasAudio = tracks.some((t) => t.buffer !== null);
  const hasSelection = selection !== null && selection.end > selection.start;

  // Real-time Playback Listeners
  const playbackListeners = useRef({
    onTimeUpdate: (time: number) => {
      setCurrentTime(time);
    },
    onEnded: () => {
      setIsPlaying(false);
      setCurrentTime(selection ? selection.start : 0);
      setLevelL(0);
      setLevelR(0);
    },
    onLevelsUpdate: (l: number, r: number) => {
      setLevelL(l);
      setLevelR(r);
    },
  });

  // Transport Handlers
  const handlePlayPause = () => {
    if (isPlaying) {
      playbackEngine.stop();
      setIsPlaying(false);
    } else {
      let startFrom = selection ? selection.start : currentTime;
      if (!selection && totalDuration > 0 && startFrom >= totalDuration - 0.05) {
        startFrom = 0;
        setCurrentTime(0);
      }
      playbackEngine.setMasterVolume(masterVolume);
      playbackEngine.setLoop(loop);
      playbackEngine.play(
        tracks,
        startFrom,
        totalDuration,
        playbackListeners.current,
        selection
      );
      setIsPlaying(true);
    }
  };

  const handleStop = () => {
    playbackEngine.stop();
    setIsPlaying(false);
    setCurrentTime(selection ? selection.start : 0);
    setLevelL(0);
    setLevelR(0);
  };

  const handlePlayFromCursor = () => {
    playbackEngine.stop();
    let startFrom = currentTime;
    if (totalDuration > 0 && startFrom >= totalDuration - 0.05) {
      startFrom = 0;
      setCurrentTime(0);
    }
    playbackEngine.setMasterVolume(masterVolume);
    playbackEngine.setLoop(loop);
    playbackEngine.play(
      tracks,
      startFrom,
      totalDuration,
      playbackListeners.current,
      null
    );
    setIsPlaying(true);
  };

  const handlePlaySelection = () => {
    if (!selection) return;
    playbackEngine.stop();
    playbackEngine.setMasterVolume(masterVolume);
    playbackEngine.setLoop(loop);
    playbackEngine.play(
      tracks,
      selection.start,
      totalDuration,
      playbackListeners.current,
      selection
    );
    setIsPlaying(true);
  };

  const handleToggleLoop = () => {
    const newLoop = !loop;
    setLoop(newLoop);
    playbackEngine.setLoop(newLoop);
  };

  const handleMasterVolumeChange = (vol: number) => {
    setMasterVolume(vol);
    playbackEngine.setMasterVolume(vol);
  };

  // Undo / Redo
  const handleUndo = () => {
    if (undoStack.length === 0) return;
    playbackEngine.stop();
    setIsPlaying(false);

    const previousSerialized = undoStack[undoStack.length - 1];
    const currentSerialized = JSON.stringify(serializeTracks(tracks));

    setRedoStack((prev) => [...prev, currentSerialized]);
    setUndoStack((prev) => prev.slice(0, -1));

    try {
      const deserialized = deserializeTracks(JSON.parse(previousSerialized));
      setTracks(deserialized);
    } catch (e) {
      console.error('Error undoing:', e);
    }
  };

  const handleRedo = () => {
    if (redoStack.length === 0) return;
    playbackEngine.stop();
    setIsPlaying(false);

    const nextSerialized = redoStack[redoStack.length - 1];
    const currentSerialized = JSON.stringify(serializeTracks(tracks));

    setUndoStack((prev) => [...prev, currentSerialized]);
    setRedoStack((prev) => prev.slice(0, -1));

    try {
      const deserialized = deserializeTracks(JSON.parse(nextSerialized));
      setTracks(deserialized);
    } catch (e) {
      console.error('Error redoing:', e);
    }
  };

  // Track operations
  const updateTrackBuffer = (trackId: string, newBuffer: AudioBuffer) => {
    pushHistory(tracks);
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, buffer: newBuffer } : t))
    );
  };

  const handleTrackUpdate = (trackId: string, updates: Partial<AudioTrack>) => {
    setTracks((prev) =>
      prev.map((t) => (t.id === trackId ? { ...t, ...updates } : t))
    );
  };

  const handleAddTrack = (customBuffer?: AudioBuffer, customName?: string) => {
    pushHistory(tracks);
    const newId = `track-${Date.now()}`;
    const newTrack: AudioTrack = {
      id: newId,
      name: customName || `Pista ${tracks.length + 1}`,
      color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
      buffer: customBuffer || null,
      volume: 1.0,
      pan: 0,
      mute: false,
      solo: false,
      startTime: 0,
    };
    setTracks((prev) => [...prev, newTrack]);
    setActiveTrackId(newId);
  };

  const handleRemoveTrack = (trackId: string) => {
    if (tracks.length <= 1) return;
    pushHistory(tracks);
    const filtered = tracks.filter((t) => t.id !== trackId);
    setTracks(filtered);
    if (activeTrackId === trackId) {
      setActiveTrackId(filtered[0]?.id || '');
    }
  };

  // Audio Import (File input or Drag and Drop) with file size & name validation
  const handleImportFiles = async (files: FileList | File[]) => {
    const ctx = getAudioContext();
    const maxFileSize = 250 * 1024 * 1024; // 250 MB max per audio file
    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      if (file.size > maxFileSize) {
        console.warn('El archivo excede el tamaño máximo permitido de 250 MB:', file.name);
        continue;
      }
      try {
        const arrayBuffer = await file.arrayBuffer();
        const decodedBuffer = await ctx.decodeAudioData(arrayBuffer);
        const safeName = (file.name || 'Pista importada')
          .replace(/\.[^/.]+$/, '')
          .slice(0, 80)
          .trim() || 'Pista importada';
        handleAddTrack(decodedBuffer, safeName);
      } catch (err) {
        console.error('Error importing file:', err);
      }
    }
  };

  // Demo Tracks loader
  const handleLoadDemo = (type: 'synthwave' | 'acoustic' | 'ambient') => {
    playbackEngine.stop();
    setIsPlaying(false);
    const buffer = generateDemoTrack(type);
    const nameMap = {
      synthwave: 'Synthwave & Bass',
      acoustic: 'Acústico & Acordes',
      ambient: 'Ambiente & Texturas',
    };
    handleAddTrack(buffer, nameMap[type]);
  };

  // EDIT OPERATIONS (Cortar, Copiar, Pegar, Eliminar, etc.)
  const handleCut = () => {
    if (!activeTrack?.buffer || !selection) return;
    const ctx = getAudioContext();
    const clip = sliceAudioBuffer(ctx, activeTrack.buffer, selection.start, selection.end);
    setClipboardBuffer(clip);

    const newBuffer = deleteRangeAudioBuffer(ctx, activeTrack.buffer, selection.start, selection.end);
    updateTrackBuffer(activeTrack.id, newBuffer);
    setSelection(null);
  };

  const handleCopy = () => {
    if (!activeTrack?.buffer || !selection) return;
    const ctx = getAudioContext();
    const clip = sliceAudioBuffer(ctx, activeTrack.buffer, selection.start, selection.end);
    setClipboardBuffer(clip);
  };

  const handlePaste = () => {
    if (!activeTrack || !clipboardBuffer) return;
    const ctx = getAudioContext();
    const insertAt = selection ? selection.start : currentTime;

    if (!activeTrack.buffer) {
      updateTrackBuffer(activeTrack.id, clipboardBuffer);
      return;
    }

    const newBuffer = pasteAudioBuffer(ctx, activeTrack.buffer, clipboardBuffer, insertAt);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleDelete = () => {
    if (!activeTrack?.buffer || !selection) return;
    const ctx = getAudioContext();
    const newBuffer = deleteRangeAudioBuffer(ctx, activeTrack.buffer, selection.start, selection.end);
    updateTrackBuffer(activeTrack.id, newBuffer);
    setSelection(null);
  };

  const handleSelectAll = () => {
    if (totalDuration > 0) {
      setSelection({ start: 0, end: totalDuration });
    }
  };

  const handleClearSelection = () => {
    setSelection(null);
  };

  const handleMuteSelection = () => {
    if (!activeTrack?.buffer || !selection) return;
    const ctx = getAudioContext();
    const newBuffer = muteRangeAudioBuffer(ctx, activeTrack.buffer, selection.start, selection.end);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleTrimToSelection = () => {
    if (!activeTrack?.buffer || !selection) return;
    const ctx = getAudioContext();
    const newBuffer = sliceAudioBuffer(ctx, activeTrack.buffer, selection.start, selection.end);
    updateTrackBuffer(activeTrack.id, newBuffer);
    setSelection(null);
    setCurrentTime(0);
  };

  const handleSplit = () => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const splitTime = currentTime;
    if (splitTime <= 0 || splitTime >= activeTrack.buffer.duration) return;

    pushHistory(tracks);
    const [first, second] = splitAudioBuffer(ctx, activeTrack.buffer, splitTime);

    // Keep first part in current track, place second part in new track at offset
    setTracks((prev) =>
      prev.map((t) => (t.id === activeTrack.id ? { ...t, buffer: first } : t))
    );

    const newId = `track-${Date.now()}`;
    const newTrack: AudioTrack = {
      id: newId,
      name: `${activeTrack.name} (Parte 2)`,
      color: TRACK_COLORS[tracks.length % TRACK_COLORS.length],
      buffer: second,
      volume: activeTrack.volume,
      pan: activeTrack.pan,
      mute: activeTrack.mute,
      solo: activeTrack.solo,
      startTime: (activeTrack.startTime || 0) + splitTime,
    };
    setTracks((prev) => [...prev, newTrack]);
  };

  const handleDuplicate = () => {
    if (!activeTrack?.buffer || !selection) return;
    const ctx = getAudioContext();
    const clip = sliceAudioBuffer(ctx, activeTrack.buffer, selection.start, selection.end);
    const newBuffer = pasteAudioBuffer(ctx, activeTrack.buffer, clip, selection.end);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleInsertSilence = (durationSec: number) => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const insertAt = selection ? selection.start : currentTime;
    const newBuffer = insertSilenceBuffer(ctx, activeTrack.buffer, insertAt, durationSec);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleMergeTracks = async () => {
    if (tracks.length < 2) return;
    setIsProcessing(true);
    try {
      const mixedBuffer = await mixDownTracks(tracks);
      pushHistory(tracks);
      const mergedTrack: AudioTrack = {
        id: `track-${Date.now()}`,
        name: 'Mezcla Unida (Master)',
        color: '#f59e0b',
        buffer: mixedBuffer,
        volume: 1.0,
        pan: 0,
        mute: false,
        solo: false,
        startTime: 0,
      };
      setTracks([mergedTrack]);
      setActiveTrackId(mergedTrack.id);
      setSelection(null);
    } catch (err) {
      console.error('Error merging tracks:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // PROCESSING OPERATIONS (Volumen, Normalizar, Fade, Pitch, Speed, Reverb, Compressor, etc.)
  const handleAdjustGain = (gainDb: number) => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const newBuffer = adjustVolume(
      ctx,
      activeTrack.buffer,
      gainDb,
      selection?.start,
      selection?.end
    );
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleNormalize = (targetPeakDb: number) => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const newBuffer = applyNormalize(
      ctx,
      activeTrack.buffer,
      targetPeakDb,
      selection?.start,
      selection?.end
    );
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleFade = (
    type: 'in' | 'out',
    curve: 'linear' | 'exponential' | 'logarithmic'
  ) => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    let startSec = selection?.start ?? 0;
    let endSec = selection?.end ?? (type === 'in' ? Math.min(2.0, activeTrack.buffer.duration) : activeTrack.buffer.duration);
    if (!selection && type === 'out') {
      startSec = Math.max(0, activeTrack.buffer.duration - 2.0);
      endSec = activeTrack.buffer.duration;
    }

    const newBuffer = applyFade(ctx, activeTrack.buffer, type, startSec, endSec, curve);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleSpeed = async (speedRatio: number) => {
    if (!activeTrack?.buffer) return;
    setIsProcessing(true);
    try {
      const newBuffer = await changeSpeed(activeTrack.buffer, speedRatio);
      updateTrackBuffer(activeTrack.id, newBuffer);
    } catch (err) {
      console.error('Error changing speed:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handlePitch = async (semitones: number) => {
    if (!activeTrack?.buffer) return;
    setIsProcessing(true);
    try {
      const newBuffer = await changePitch(activeTrack.buffer, semitones);
      updateTrackBuffer(activeTrack.id, newBuffer);
    } catch (err) {
      console.error('Error pitch shift:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReverse = () => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const newBuffer = reverseAudio(
      ctx,
      activeTrack.buffer,
      selection?.start,
      selection?.end
    );
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleCompress = async (params: {
    threshold: number;
    ratio: number;
    attack: number;
    release: number;
    knee: number;
  }) => {
    if (!activeTrack?.buffer) return;
    setIsProcessing(true);
    try {
      const newBuffer = await applyCompressor(activeTrack.buffer, params);
      updateTrackBuffer(activeTrack.id, newBuffer);
    } catch (err) {
      console.error('Error applying compressor:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleNoiseGate = (thresholdDb: number, reductionDb: number) => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const newBuffer = applyNoiseGate(ctx, activeTrack.buffer, thresholdDb, reductionDb);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleRemoveSilence = (thresholdDb: number, minDurationSec: number) => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const newBuffer = removeSilences(ctx, activeTrack.buffer, thresholdDb, minDurationSec);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleConvertChannels = (mode: 'toMono' | 'toStereo' | 'swap' | 'invertPhase') => {
    if (!activeTrack?.buffer) return;
    const ctx = getAudioContext();
    const newBuffer = convertChannels(ctx, activeTrack.buffer, mode);
    updateTrackBuffer(activeTrack.id, newBuffer);
  };

  const handleApplyEQ = async () => {
    if (!activeTrack?.buffer) return;
    setIsProcessing(true);
    try {
      const newBuffer = await applyEQ(activeTrack.buffer, eqBands);
      updateTrackBuffer(activeTrack.id, newBuffer);
    } catch (err) {
      console.error('Error applying EQ:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  const handleApplyEffects = async () => {
    if (!activeTrack?.buffer) return;
    setIsProcessing(true);
    try {
      const newBuffer = await applyEffects(activeTrack.buffer, effects);
      updateTrackBuffer(activeTrack.id, newBuffer);
    } catch (err) {
      console.error('Error applying effects:', err);
    } finally {
      setIsProcessing(false);
    }
  };

  // EXPORT AUDIO
  const handleExport = async (options: {
    format: 'wav' | 'mp3' | 'flac' | 'ogg' | 'aac';
    bitDepth: WavBitDepth;
    sampleRate: number;
    channels: 'stereo' | 'mono';
    qualityKbps: number;
    rangeOnly: boolean;
    fileName: string;
  }) => {
    const range = options.rangeOnly && selection ? selection : undefined;
    let finalBuffer = await mixDownTracks(tracks, range);

    if (finalBuffer.sampleRate !== options.sampleRate) {
      finalBuffer = await resampleAudioBuffer(finalBuffer, options.sampleRate);
    }

    // Binary WAV generation
    const wavBlob = audioBufferToWavBlob(finalBuffer, options.bitDepth, options.channels);
    const extension = options.format === 'wav' ? 'wav' : options.format;
    downloadBlob(wavBlob, `${options.fileName}.${extension}`);
  };

  // PROJECT STORAGE (IndexedDB & JSON)
  const handleSaveCurrentProject = async (name: string) => {
    setProjectName(name);
    await saveProject(projectId, name, tracks, effects, eqBands);
  };

  const handleLoadProject = async (id: string) => {
    playbackEngine.stop();
    setIsPlaying(false);
    const proj = await loadProject(id);
    if (!proj) return;

    setProjectId(proj.id);
    setProjectName(proj.name);
    const deserialized = deserializeTracks(proj.tracks);
    setTracks(deserialized);
    setActiveTrackId(deserialized[0]?.id || '');
    if (proj.effects) setEffects(proj.effects);
    if (proj.eqBands) setEqBands(proj.eqBands);
    setSelection(null);
    setCurrentTime(0);
    pushHistory(deserialized);
  };

  const handleExportProjectFile = () => {
    const serializedTracks = serializeTracks(tracks);
    // Convert Float32Arrays to standard arrays for JSON compatibility
    const jsonTracks = serializedTracks.map((t) => ({
      ...t,
      channels: t.channels.map((c) => Array.from(c)),
    }));

    const projectData = {
      version: 1,
      id: projectId,
      name: projectName,
      updatedAt: Date.now(),
      tracks: jsonTracks,
      effects,
      eqBands,
    };

    const blob = new Blob([JSON.stringify(projectData, null, 2)], {
      type: 'application/json',
    });
    downloadBlob(blob, `${projectName.replace(/\s+/g, '_')}.audiostudio.json`);
  };

  const handleImportProjectFile = async (file: File) => {
    // 1. File size sanity check (max 100 MB for JSON)
    if (file.size > 100 * 1024 * 1024) {
      console.warn('El archivo de proyecto excede el tamaño máximo de 100 MB');
      return;
    }

    try {
      const text = await file.text();
      const data = JSON.parse(text);
      if (data && typeof data === 'object' && Array.isArray(data.tracks)) {
        playbackEngine.stop();
        setIsPlaying(false);

        const ctx = getAudioContext();
        const importedTracks: AudioTrack[] = [];

        for (let i = 0; i < Math.min(data.tracks.length, 32); i++) {
          const t = data.tracks[i];
          if (!t || typeof t !== 'object') continue;

          let buffer: AudioBuffer | null = null;
          const numChannels = typeof t.numberOfChannels === 'number' && Number.isInteger(t.numberOfChannels)
            ? Math.max(1, Math.min(8, t.numberOfChannels))
            : 2;
          const sampleRate = typeof t.sampleRate === 'number' && Number.isInteger(t.sampleRate)
            ? Math.max(8000, Math.min(192000, t.sampleRate))
            : 44100;
          const maxSamples = sampleRate * 3600; // max 1 hour per track
          const length = typeof t.length === 'number' && Number.isInteger(t.length)
            ? Math.max(0, Math.min(maxSamples, t.length))
            : 0;

          if (Array.isArray(t.channels) && t.channels.length > 0 && length > 0) {
            buffer = ctx.createBuffer(numChannels, length, sampleRate);
            for (let c = 0; c < numChannels; c++) {
              if (Array.isArray(t.channels[c]) || ArrayBuffer.isView(t.channels[c])) {
                const channelData = buffer.getChannelData(c);
                const src = t.channels[c];
                const copyLen = Math.min(length, src.length);
                for (let k = 0; k < copyLen; k++) {
                  const val = Number(src[k]);
                  channelData[k] = Number.isFinite(val) ? Math.max(-1, Math.min(1, val)) : 0;
                }
              }
            }
          }

          const safeVolume = typeof t.volume === 'number' && Number.isFinite(t.volume)
            ? Math.max(0, Math.min(2, t.volume))
            : 1.0;
          const safePan = typeof t.pan === 'number' && Number.isFinite(t.pan)
            ? Math.max(-1, Math.min(1, t.pan))
            : 0;
          const safeStartTime = typeof t.startTime === 'number' && Number.isFinite(t.startTime)
            ? Math.max(0, Math.min(86400, t.startTime))
            : 0;
          const safeName = typeof t.name === 'string'
            ? t.name.slice(0, 80).trim() || `Pista ${i + 1}`
            : `Pista ${i + 1}`;
          const safeColor = typeof t.color === 'string' && /^#[0-9a-fA-F]{6}$/.test(t.color)
            ? t.color
            : TRACK_COLORS[i % TRACK_COLORS.length];

          importedTracks.push({
            id: typeof t.id === 'string' ? t.id.slice(0, 50) : `track-${Date.now()}-${i}`,
            name: safeName,
            color: safeColor,
            volume: safeVolume,
            pan: safePan,
            mute: Boolean(t.mute),
            solo: Boolean(t.solo),
            startTime: safeStartTime,
            buffer,
          });
        }

        if (importedTracks.length === 0) return;

        const safeProjectId = typeof data.id === 'string' ? data.id.slice(0, 50) : 'proj-' + Date.now();
        const safeProjectName = typeof data.name === 'string' ? data.name.slice(0, 100).trim() || 'Proyecto Importado' : 'Proyecto Importado';

        setProjectId(safeProjectId);
        setProjectName(safeProjectName);
        setTracks(importedTracks);
        setActiveTrackId(importedTracks[0]?.id || '');
        if (Array.isArray(data.effects)) setEffects(data.effects);
        if (Array.isArray(data.eqBands)) setEqBands(data.eqBands);
        setSelection(null);
        setCurrentTime(0);
        pushHistory(importedTracks);
      }
    } catch (e) {
      console.error('Error importing project file:', e);
    }
  };

  // Keyboard Shortcuts
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      // Don't intercept if user is typing in an input
      if (
        e.target instanceof HTMLInputElement ||
        e.target instanceof HTMLTextAreaElement ||
        e.target instanceof HTMLSelectElement
      ) {
        return;
      }

      if (e.code === 'Space') {
        e.preventDefault();
        handlePlayPause();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'z') {
        e.preventDefault();
        if (e.shiftKey) {
          handleRedo();
        } else {
          handleUndo();
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'y') {
        e.preventDefault();
        handleRedo();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'c') {
        e.preventDefault();
        handleCopy();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'x') {
        e.preventDefault();
        handleCut();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'v') {
        e.preventDefault();
        handlePaste();
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        handleSelectAll();
      } else if (e.key === 'Delete' || e.key === 'Backspace') {
        e.preventDefault();
        handleDelete();
      } else if (e.key === 'Escape') {
        e.preventDefault();
        handleClearSelection();
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [
    isPlaying,
    currentTime,
    tracks,
    activeTrack,
    selection,
    clipboardBuffer,
    totalDuration,
    undoStack,
    redoStack,
  ]);

  return (
    <div className="flex flex-col h-screen w-screen overflow-hidden bg-neutral-950 text-neutral-100">
      {/* Hidden File Input for Audio Files */}
      <input
        ref={fileInputRef}
        type="file"
        multiple
        accept="audio/*,.mp3,.wav,.flac,.ogg,.m4a,.aac,.opus,.aiff"
        className="hidden"
        onChange={(e) => {
          if (e.target.files && e.target.files.length > 0) {
            handleImportFiles(e.target.files);
          }
        }}
      />

      {/* 1. Header (Top Bar Contract) */}
      <Header
        projectName={projectName}
        onRenameProject={setProjectName}
        onNewProject={() => {
          playbackEngine.stop();
          setIsPlaying(false);
          const emptyId = `track-${Date.now()}`;
          const emptyTrack: AudioTrack = {
            id: emptyId,
            name: 'Pista 1',
            color: TRACK_COLORS[0],
            buffer: null,
            volume: 1.0,
            pan: 0,
            mute: false,
            solo: false,
            startTime: 0,
          };
          setTracks([emptyTrack]);
          setActiveTrackId(emptyId);
          setSelection(null);
          setCurrentTime(0);
          pushHistory([emptyTrack]);
        }}
        onOpenProjectModal={() => setIsProjectOpen(true)}
        onSaveProject={() => handleSaveCurrentProject(projectName)}
        onImportAudio={() => fileInputRef.current?.click()}
        onExport={() => setIsExportOpen(true)}
        canUndo={undoStack.length > 0}
        canRedo={redoStack.length > 0}
        onUndo={handleUndo}
        onRedo={handleRedo}
        isDark={isDark}
        onToggleTheme={() => setIsDark(!isDark)}
        onLoadDemoTrack={handleLoadDemo}
        onOpenAbout={() => setIsAboutOpen(true)}
      />

      {/* 2. Toolbar (Edit Operations & Selection Timecode Numeric Readout) */}
      <Toolbar
        selection={selection}
        totalDuration={totalDuration}
        hasClipboard={clipboardBuffer !== null}
        onCut={handleCut}
        onCopy={handleCopy}
        onPaste={handlePaste}
        onDelete={handleDelete}
        onSelectAll={handleSelectAll}
        onClearSelection={handleClearSelection}
        onMuteSelection={handleMuteSelection}
        onTrimToSelection={handleTrimToSelection}
        onSplit={handleSplit}
        onDuplicate={handleDuplicate}
        onOpenInsertSilence={() => setIsSilenceOpen(true)}
        onMergeTracks={handleMergeTracks}
        onZoomIn={() => setZoom((z) => Math.min(1000, z * 1.35))}
        onZoomOut={() => setZoom((z) => Math.max(10, z * 0.75))}
        onZoomFit={() => {
          if (totalDuration > 0) {
            const fitZoom = Math.max(15, Math.min(300, 1000 / totalDuration));
            setZoom(fitZoom);
          }
        }}
        onUpdateSelection={(start, end) => setSelection({ start, end })}
      />

      {/* 3. Central Workspace: Waveform Timeline + SidePanel */}
      <div className="flex-1 flex overflow-hidden">
        <WaveformTimeline
          tracks={tracks}
          activeTrackId={activeTrackId}
          onSelectTrack={setActiveTrackId}
          selection={selection}
          onSelectionChange={setSelection}
          currentTime={currentTime}
          onSeek={(time) => {
            setCurrentTime(time);
            if (isPlaying) {
              playbackEngine.play(
                tracks,
                time,
                totalDuration,
                playbackListeners.current,
                selection
              );
            }
          }}
          zoom={zoom}
          onZoomChange={setZoom}
          onTrackUpdate={handleTrackUpdate}
          onRemoveTrack={handleRemoveTrack}
          onAddTrack={() => handleAddTrack()}
          onDropFiles={handleImportFiles}
        />

        <SidePanel
          eqBands={eqBands}
          onEQBandsChange={setEqBands}
          onApplyEQ={handleApplyEQ}
          effects={effects}
          onEffectsChange={setEffects}
          onApplyEffects={handleApplyEffects}
          tracks={tracks}
          activeTrackId={activeTrackId}
          onSelectTrack={setActiveTrackId}
          onAddTrack={() => handleAddTrack()}
          onMergeTracks={handleMergeTracks}
          hasAudio={hasAudio}
          isProcessing={isProcessing}
          hasSelection={hasSelection}
          onAdjustGain={handleAdjustGain}
          onNormalize={handleNormalize}
          onFade={handleFade}
          onSpeed={handleSpeed}
          onPitch={handlePitch}
          onReverse={handleReverse}
          onCompress={handleCompress}
          onNoiseGate={handleNoiseGate}
          onRemoveSilence={handleRemoveSilence}
          onConvertChannels={handleConvertChannels}
        />
      </div>

      {/* 4. Bottom Player Transport Bar with Stereo VU Meter */}
      <TransportBar
        isPlaying={isPlaying}
        currentTime={currentTime}
        totalDuration={totalDuration}
        loop={loop}
        masterVolume={masterVolume}
        levelL={levelL}
        levelR={levelR}
        hasSelection={hasSelection}
        onPlayPause={handlePlayPause}
        onStop={handleStop}
        onPlaySelection={handlePlaySelection}
        onPlayFromCursor={handlePlayFromCursor}
        onToggleLoop={handleToggleLoop}
        onMasterVolumeChange={handleMasterVolumeChange}
      />

      {/* 5. Minimalist Professional Footer */}
      <Footer onOpenAbout={() => setIsAboutOpen(true)} />

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        projectName={projectName}
        hasSelection={hasSelection}
        onExport={handleExport}
      />

      <ProjectModal
        isOpen={isProjectOpen}
        onClose={() => setIsProjectOpen(false)}
        projectName={projectName}
        onSaveCurrentProject={handleSaveCurrentProject}
        onLoadProject={handleLoadProject}
        onExportProjectFile={handleExportProjectFile}
        onImportProjectFile={handleImportProjectFile}
      />

      <SilenceModal
        isOpen={isSilenceOpen}
        onClose={() => setIsSilenceOpen(false)}
        onInsertSilence={handleInsertSilence}
      />

      <AboutModal
        isOpen={isAboutOpen}
        onClose={() => setIsAboutOpen(false)}
      />
    </div>
  );
}

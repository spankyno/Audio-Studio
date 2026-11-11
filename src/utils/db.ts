import { AudioTrack, EffectConfig, EQBand, ProjectMetadata, SerializedProject, SerializedTrack } from '../types/audio';
import { getAudioContext } from '../audio/audioContext';

const DB_NAME = 'AudioStudioDB';
const DB_VERSION = 1;
const STORE_PROJECTS = 'projects';

function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_PROJECTS)) {
        const store = db.createObjectStore(STORE_PROJECTS, { keyPath: 'id' });
        store.createIndex('updatedAt', 'updatedAt', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

/**
 * Serializes AudioTracks into serializable structures with Float32Array copies
 */
export function serializeTracks(tracks: AudioTrack[]): SerializedTrack[] {
  return tracks.map(track => {
    const channels: Float32Array[] = [];
    let sampleRate = 44100;
    let length = 0;
    let numberOfChannels = 2;

    if (track.buffer) {
      sampleRate = track.buffer.sampleRate;
      length = track.buffer.length;
      numberOfChannels = track.buffer.numberOfChannels;
      for (let c = 0; c < numberOfChannels; c++) {
        // Create an explicit detached copy
        channels.push(new Float32Array(track.buffer.getChannelData(c)));
      }
    }

    return {
      id: track.id,
      name: track.name,
      color: track.color,
      volume: track.volume,
      pan: track.pan,
      mute: track.mute,
      solo: track.solo,
      startTime: track.startTime,
      channels,
      sampleRate,
      length,
      numberOfChannels,
    };
  });
}

/**
 * Deserializes SerializedTracks into functional AudioTracks with AudioBuffers
 */
export function deserializeTracks(serialized: SerializedTrack[]): AudioTrack[] {
  const ctx = getAudioContext();

  return serialized.map((s, idx) => {
    let buffer: AudioBuffer | null = null;

    if (s.channels && s.channels.length > 0 && s.length > 0) {
      const numChannels = typeof s.numberOfChannels === 'number' && Number.isInteger(s.numberOfChannels)
        ? Math.max(1, Math.min(8, s.numberOfChannels))
        : 2;
      const sampleRate = typeof s.sampleRate === 'number' && Number.isInteger(s.sampleRate)
        ? Math.max(8000, Math.min(192000, s.sampleRate))
        : 44100;
      const maxSamples = sampleRate * 3600;
      const length = typeof s.length === 'number' && Number.isInteger(s.length)
        ? Math.max(1, Math.min(maxSamples, s.length))
        : 1;

      buffer = ctx.createBuffer(numChannels, length, sampleRate);
      for (let c = 0; c < numChannels; c++) {
        if (s.channels[c]) {
          buffer.getChannelData(c).set(s.channels[c]);
        }
      }
    }

    const safeVolume = typeof s.volume === 'number' && Number.isFinite(s.volume)
      ? Math.max(0, Math.min(2, s.volume))
      : 1.0;
    const safePan = typeof s.pan === 'number' && Number.isFinite(s.pan)
      ? Math.max(-1, Math.min(1, s.pan))
      : 0;
    const safeStartTime = typeof s.startTime === 'number' && Number.isFinite(s.startTime)
      ? Math.max(0, Math.min(86400, s.startTime))
      : 0;

    return {
      id: typeof s.id === 'string' ? s.id.slice(0, 50) : `track-${Date.now()}-${idx}`,
      name: typeof s.name === 'string' ? s.name.slice(0, 80) : `Pista ${idx + 1}`,
      color: typeof s.color === 'string' ? s.color : '#f59e0b',
      volume: safeVolume,
      pan: safePan,
      mute: Boolean(s.mute),
      solo: Boolean(s.solo),
      startTime: safeStartTime,
      buffer,
    };
  });
}

/**
 * Saves a project to IndexedDB
 */
export async function saveProject(
  id: string,
  name: string,
  tracks: AudioTrack[],
  effects: EffectConfig[],
  eqBands: EQBand[]
): Promise<void> {
  const db = await openDB();
  const serializedTracks = serializeTracks(tracks);

  const project: SerializedProject = {
    id,
    name,
    updatedAt: Date.now(),
    tracks: serializedTracks,
    effects,
    eqBands,
  };

  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.put(project);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

/**
 * Loads a project by ID from IndexedDB
 */
export async function loadProject(id: string): Promise<SerializedProject | null> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.get(id);

    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

/**
 * Lists all saved projects metadata
 */
export async function listProjects(): Promise<ProjectMetadata[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readonly');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.getAll();

    req.onsuccess = () => {
      const items = (req.result as SerializedProject[]) || [];
      const list: ProjectMetadata[] = items.map(p => {
        let maxDuration = 0;
        p.tracks.forEach(t => {
          const dur = t.startTime + (t.length / t.sampleRate || 0);
          if (dur > maxDuration) maxDuration = dur;
        });

        return {
          id: p.id,
          name: p.name,
          updatedAt: p.updatedAt,
          trackCount: p.tracks.length,
          duration: maxDuration,
        };
      });
      list.sort((a, b) => b.updatedAt - a.updatedAt);
      resolve(list);
    };
    req.onerror = () => reject(req.error);
  });
}

/**
 * Deletes a project from IndexedDB
 */
export async function deleteProject(id: string): Promise<void> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction(STORE_PROJECTS, 'readwrite');
    const store = tx.objectStore(STORE_PROJECTS);
    const req = store.delete(id);

    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

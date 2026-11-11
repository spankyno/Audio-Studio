export interface AudioSelection {
  start: number; // in seconds
  end: number;   // in seconds
}

export interface AudioTrack {
  id: string;
  name: string;
  color: string;
  buffer: AudioBuffer | null;
  volume: number; // 0.0 to 2.0 (1.0 = 0dB)
  pan: number;    // -1.0 (Left) to +1.0 (Right)
  mute: boolean;
  solo: boolean;
  startTime: number; // offset in timeline in seconds
}

export type EffectType =
  | 'distortion'
  | 'overdrive'
  | 'delay'
  | 'echo'
  | 'reverb'
  | 'chorus'
  | 'flanger'
  | 'phaser'
  | 'tremolo'
  | 'vibrato'
  | 'bitcrusher';

export interface EffectConfig {
  id: string;
  type: EffectType;
  name: string;
  enabled: boolean;
  params: Record<string, number>;
}

export interface EQBand {
  id: string;
  type: BiquadFilterType;
  frequency: number; // Hz
  gain: number;      // dB (-24 to +24)
  q: number;         // Quality factor
  label: string;
}

export interface EQPreset {
  name: string;
  description: string;
  bands: Array<{
    type: BiquadFilterType;
    frequency: number;
    gain: number;
    q: number;
  }>;
}

export interface ProjectMetadata {
  id: string;
  name: string;
  updatedAt: number;
  trackCount: number;
  duration: number;
}

export interface SerializedTrack {
  id: string;
  name: string;
  color: string;
  volume: number;
  pan: number;
  mute: boolean;
  solo: boolean;
  startTime: number;
  channels: Float32Array[];
  sampleRate: number;
  length: number;
  numberOfChannels: number;
}

export interface SerializedProject {
  id: string;
  name: string;
  updatedAt: number;
  tracks: SerializedTrack[];
  effects: EffectConfig[];
  eqBands: EQBand[];
}

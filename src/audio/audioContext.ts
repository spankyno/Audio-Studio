import { AudioTrack } from '../types/audio';

let sharedAudioContext: AudioContext | null = null;

export function getAudioContext(): AudioContext {
  if (!sharedAudioContext) {
    const AudioContextClass = window.AudioContext || (window as unknown as { webkitAudioContext: typeof AudioContext }).webkitAudioContext;
    sharedAudioContext = new AudioContextClass({
      latencyHint: 'interactive',
    });
  }
  if (sharedAudioContext.state === 'suspended') {
    sharedAudioContext.resume().catch(() => {});
  }
  return sharedAudioContext;
}

export interface PlaybackStateListener {
  onTimeUpdate: (currentTime: number) => void;
  onEnded: () => void;
  onLevelsUpdate: (levelL: number, levelR: number) => void;
}

class PlaybackEngine {
  private activeSources: AudioBufferSourceNode[] = [];
  private masterGain: GainNode | null = null;
  private analyserL: AnalyserNode | null = null;
  private analyserR: AnalyserNode | null = null;
  private splitter: ChannelSplitterNode | null = null;
  private isPlaying = false;
  private startTimelineTime = 0;
  private startContextTime = 0;
  private duration = 0;
  private loop = false;
  private animFrameId: number | null = null;
  private listeners: PlaybackStateListener | null = null;
  private masterVolume = 1.0;

  // Store params for loop restart
  private lastTracks: AudioTrack[] = [];
  private lastFromTime = 0;
  private lastTotalDuration = 0;
  private lastSelection: { start: number; end: number } | null | undefined = null;

  constructor() {
    // Initialized on play
  }

  public setMasterVolume(vol: number) {
    this.masterVolume = Math.max(0, Math.min(2, vol));
    if (this.masterGain && sharedAudioContext) {
      this.masterGain.gain.setValueAtTime(this.masterVolume, sharedAudioContext.currentTime);
    }
  }

  public getMasterVolume() {
    return this.masterVolume;
  }

  public setLoop(loop: boolean) {
    this.loop = loop;
  }

  public getIsPlaying() {
    return this.isPlaying;
  }

  public async play(
    tracks: AudioTrack[],
    fromTime: number,
    totalDuration: number,
    listeners: PlaybackStateListener,
    selection?: { start: number; end: number } | null
  ) {
    const ctx = getAudioContext();
    this.stop();

    if (tracks.length === 0 || totalDuration <= 0) return;

    if (ctx.state === 'suspended') {
      try {
        await ctx.resume();
      } catch (e) {
        console.error('AudioContext resume error:', e);
      }
    }

    // Store for potential loop restart
    this.lastTracks = tracks;
    this.lastFromTime = selection ? selection.start : fromTime;
    this.lastTotalDuration = totalDuration;
    this.lastSelection = selection;

    this.listeners = listeners;
    this.isPlaying = true;
    this.startTimelineTime = fromTime;
    this.startContextTime = ctx.currentTime;
    this.duration = selection ? (selection.end - fromTime) : (totalDuration - fromTime);

    if (this.duration <= 0) {
      this.isPlaying = false;
      return;
    }

    // Master nodes
    this.masterGain = ctx.createGain();
    this.masterGain.gain.setValueAtTime(this.masterVolume, ctx.currentTime);

    this.splitter = ctx.createChannelSplitter(2);
    this.analyserL = ctx.createAnalyser();
    this.analyserR = ctx.createAnalyser();
    this.analyserL.fftSize = 256;
    this.analyserR.fftSize = 256;

    this.masterGain.connect(ctx.destination);
    this.masterGain.connect(this.splitter);
    this.splitter.connect(this.analyserL, 0);
    this.splitter.connect(this.analyserR, 1);

    const hasSolo = tracks.some(t => t.solo && !t.mute && t.buffer);

    tracks.forEach(track => {
      if (!track.buffer) return;
      if (track.mute) return;
      if (hasSolo && !track.solo) return;

      const trackOffset = track.startTime || 0;
      const trackBuffer = track.buffer;
      const trackDuration = trackBuffer.duration;
      const trackEnd = trackOffset + trackDuration;

      // Determine when this track should start relative to fromTime
      if (trackEnd <= fromTime) return; // already ended

      const trackSource = ctx.createBufferSource();
      trackSource.buffer = trackBuffer;

      // Track Pan and Volume
      const trackGain = ctx.createGain();
      trackGain.gain.setValueAtTime(track.volume, ctx.currentTime);

      // Connect buffer source to track gain
      trackSource.connect(trackGain);

      let lastNode: AudioNode = trackGain;

      // Stereo panner if supported
      if (ctx.createStereoPanner) {
        const panner = ctx.createStereoPanner();
        panner.pan.setValueAtTime(Math.max(-1, Math.min(1, track.pan)), ctx.currentTime);
        trackGain.connect(panner);
        lastNode = panner;
      }

      lastNode.connect(this.masterGain!);

      // Calculate schedule
      let startOffsetInTrack = 0;
      let delayToStart = 0;

      if (fromTime >= trackOffset) {
        startOffsetInTrack = fromTime - trackOffset;
        delayToStart = 0;
      } else {
        startOffsetInTrack = 0;
        delayToStart = trackOffset - fromTime;
      }

      let playLength = trackDuration - startOffsetInTrack;
      if (selection) {
        const remainingToSelectionEnd = selection.end - Math.max(fromTime, trackOffset);
        if (remainingToSelectionEnd < playLength) {
          playLength = Math.max(0, remainingToSelectionEnd);
        }
      }

      if (playLength > 0) {
        try {
          trackSource.start(ctx.currentTime + delayToStart, startOffsetInTrack, playLength);
          this.activeSources.push(trackSource);
        } catch (e) {
          console.error('Error starting audio source:', e);
        }
      }
    });

    this.startTickLoop();
  }

  private startTickLoop() {
    const ctx = getAudioContext();
    const dataL = new Uint8Array(128);
    const dataR = new Uint8Array(128);

    const tick = () => {
      if (!this.isPlaying) return;

      const elapsed = ctx.currentTime - this.startContextTime;
      const currentPos = this.startTimelineTime + elapsed;

      // Audio levels calculation
      let lvlL = 0;
      let lvlR = 0;

      if (this.analyserL && this.analyserR) {
        this.analyserL.getByteTimeDomainData(dataL);
        this.analyserR.getByteTimeDomainData(dataR);

        let sumL = 0;
        let sumR = 0;
        for (let i = 0; i < 128; i++) {
          const valL = (dataL[i] - 128) / 128;
          const valR = (dataR[i] - 128) / 128;
          sumL += valL * valL;
          sumR += valR * valR;
        }
        lvlL = Math.min(1, Math.sqrt(sumL / 128) * 2.8);
        lvlR = Math.min(1, Math.sqrt(sumR / 128) * 2.8);
      }

      if (this.listeners) {
        this.listeners.onLevelsUpdate(lvlL, lvlR);
        this.listeners.onTimeUpdate(currentPos);
      }

      if (elapsed >= this.duration) {
        if (this.loop) {
          // Properly restart loop by replaying from the beginning of the loop range
          const loopFromTime = this.lastFromTime;
          const loopTracks = this.lastTracks;
          const loopDuration = this.lastTotalDuration;
          const loopSelection = this.lastSelection;
          const loopListeners = this.listeners;

          // Stop current sources but keep isPlaying = true intent
          this.stopSources();

          // Re-invoke play with the saved params
          this.play(loopTracks, loopFromTime, loopDuration, loopListeners!, loopSelection);
          return;
        } else {
          this.stop();
          if (this.listeners) {
            this.listeners.onEnded();
          }
          return;
        }
      }

      this.animFrameId = requestAnimationFrame(tick);
    };

    this.animFrameId = requestAnimationFrame(tick);
  }

  private stopSources() {
    if (this.animFrameId) {
      cancelAnimationFrame(this.animFrameId);
      this.animFrameId = null;
    }
    this.activeSources.forEach(src => {
      try {
        src.stop();
        src.disconnect();
      } catch {
        // already stopped
      }
    });
    this.activeSources = [];

    if (this.masterGain) {
      try {
        this.masterGain.disconnect();
      } catch {
        // ignore
      }
      this.masterGain = null;
    }
  }

  public stop() {
    this.isPlaying = false;
    this.stopSources();

    if (this.listeners) {
      this.listeners.onLevelsUpdate(0, 0);
    }
  }
}

export const playbackEngine = new PlaybackEngine();

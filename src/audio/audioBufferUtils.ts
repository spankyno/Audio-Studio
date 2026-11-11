import { AudioTrack, EffectConfig, EQBand } from '../types/audio';
import { getAudioContext } from './audioContext';

/**
 * Creates an exact clone of an AudioBuffer
 */
export function cloneAudioBuffer(ctx: BaseAudioContext, buffer: AudioBuffer): AudioBuffer {
  const clone = ctx.createBuffer(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );
  for (let c = 0; c < buffer.numberOfChannels; c++) {
    clone.copyToChannel(buffer.getChannelData(c), c);
  }
  return clone;
}

/**
 * Create a silent audio buffer
 */
export function createSilentBuffer(
  ctx: BaseAudioContext,
  durationSec: number,
  sampleRate = 44100,
  numberOfChannels = 2
): AudioBuffer {
  const length = Math.max(1, Math.round(durationSec * sampleRate));
  return ctx.createBuffer(numberOfChannels, length, sampleRate);
}

/**
 * Slices a slice of an AudioBuffer between startSec and endSec
 */
export function sliceAudioBuffer(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const startSample = Math.max(0, Math.floor(startSec * buffer.sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil(endSec * buffer.sampleRate));
  const newLength = Math.max(1, endSample - startSample);

  const newBuffer = ctx.createBuffer(
    buffer.numberOfChannels,
    newLength,
    buffer.sampleRate
  );

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const srcData = buffer.getChannelData(c);
    const dstData = newBuffer.getChannelData(c);
    dstData.set(srcData.subarray(startSample, endSample));
  }

  return newBuffer;
}

/**
 * Concatenates two AudioBuffers
 */
export function concatAudioBuffers(
  ctx: BaseAudioContext,
  bufA: AudioBuffer,
  bufB: AudioBuffer
): AudioBuffer {
  const sampleRate = bufA.sampleRate;
  const numChannels = Math.max(bufA.numberOfChannels, bufB.numberOfChannels);
  const totalLength = bufA.length + bufB.length;

  const newBuffer = ctx.createBuffer(numChannels, totalLength, sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const dst = newBuffer.getChannelData(c);
    const srcA = c < bufA.numberOfChannels ? bufA.getChannelData(c) : bufA.getChannelData(0);
    const srcB = c < bufB.numberOfChannels ? bufB.getChannelData(c) : bufB.getChannelData(0);

    dst.set(srcA, 0);
    dst.set(srcB, bufA.length);
  }

  return newBuffer;
}

/**
 * Inserts audio into targetBuffer at insertTimeSec
 */
export function pasteAudioBuffer(
  ctx: BaseAudioContext,
  targetBuffer: AudioBuffer,
  insertBuffer: AudioBuffer,
  insertTimeSec: number
): AudioBuffer {
  const sampleRate = targetBuffer.sampleRate;
  const insertSample = Math.max(0, Math.min(targetBuffer.length, Math.round(insertTimeSec * sampleRate)));
  const totalLength = targetBuffer.length + insertBuffer.length;
  const numChannels = Math.max(targetBuffer.numberOfChannels, insertBuffer.numberOfChannels);

  const newBuffer = ctx.createBuffer(numChannels, totalLength, sampleRate);

  for (let c = 0; c < numChannels; c++) {
    const dst = newBuffer.getChannelData(c);
    const srcT = c < targetBuffer.numberOfChannels ? targetBuffer.getChannelData(c) : targetBuffer.getChannelData(0);
    const srcI = c < insertBuffer.numberOfChannels ? insertBuffer.getChannelData(c) : insertBuffer.getChannelData(0);

    // Part before insert
    dst.set(srcT.subarray(0, insertSample), 0);
    // Inserted content
    dst.set(srcI, insertSample);
    // Part after insert
    dst.set(srcT.subarray(insertSample), insertSample + insertBuffer.length);
  }

  return newBuffer;
}

/**
 * Deletes a range from startSec to endSec
 */
export function deleteRangeAudioBuffer(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil(endSec * sampleRate));

  if (startSample >= endSample) return cloneAudioBuffer(ctx, buffer);

  const deletedLength = endSample - startSample;
  const newLength = Math.max(1, buffer.length - deletedLength);
  const newBuffer = ctx.createBuffer(buffer.numberOfChannels, newLength, sampleRate);

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = newBuffer.getChannelData(c);

    dst.set(src.subarray(0, startSample), 0);
    dst.set(src.subarray(endSample), startSample);
  }

  return newBuffer;
}

/**
 * Mutes a range from startSec to endSec
 */
export function muteRangeAudioBuffer(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  startSec: number,
  endSec: number
): AudioBuffer {
  const newBuffer = cloneAudioBuffer(ctx, buffer);
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil(endSec * sampleRate));

  for (let c = 0; c < newBuffer.numberOfChannels; c++) {
    const data = newBuffer.getChannelData(c);
    for (let i = startSample; i < endSample; i++) {
      data[i] = 0;
    }
  }

  return newBuffer;
}

/**
 * Inserts silence at insertTimeSec
 */
export function insertSilenceBuffer(
  ctx: BaseAudioContext,
  targetBuffer: AudioBuffer,
  insertTimeSec: number,
  silenceDurationSec: number
): AudioBuffer {
  const silence = createSilentBuffer(ctx, silenceDurationSec, targetBuffer.sampleRate, targetBuffer.numberOfChannels);
  return pasteAudioBuffer(ctx, targetBuffer, silence, insertTimeSec);
}

/**
 * Splits an audio buffer at splitTimeSec into two buffers
 */
export function splitAudioBuffer(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  splitTimeSec: number
): [AudioBuffer, AudioBuffer] {
  const first = sliceAudioBuffer(ctx, buffer, 0, splitTimeSec);
  const second = sliceAudioBuffer(ctx, buffer, splitTimeSec, buffer.duration);
  return [first, second];
}

/**
 * Adjust volume in dB (or linear multiplier) on entire buffer or within selection
 */
export function adjustVolume(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  gainDb: number,
  startSec?: number,
  endSec?: number
): AudioBuffer {
  const newBuffer = cloneAudioBuffer(ctx, buffer);
  const multiplier = Math.pow(10, gainDb / 20);

  const startSample = startSec !== undefined ? Math.max(0, Math.floor(startSec * buffer.sampleRate)) : 0;
  const endSample = endSec !== undefined ? Math.min(buffer.length, Math.ceil(endSec * buffer.sampleRate)) : buffer.length;

  for (let c = 0; c < newBuffer.numberOfChannels; c++) {
    const data = newBuffer.getChannelData(c);
    for (let i = startSample; i < endSample; i++) {
      data[i] = Math.max(-1, Math.min(1, data[i] * multiplier));
    }
  }

  return newBuffer;
}

/**
 * Normalize audio to peak dB (e.g. 0dB, -0.5dB, -1dB, -3dB)
 */
export function applyNormalize(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  targetPeakDb = 0,
  startSec?: number,
  endSec?: number
): AudioBuffer {
  const newBuffer = cloneAudioBuffer(ctx, buffer);
  const startSample = startSec !== undefined ? Math.max(0, Math.floor(startSec * buffer.sampleRate)) : 0;
  const endSample = endSec !== undefined ? Math.min(buffer.length, Math.ceil(endSec * buffer.sampleRate)) : buffer.length;

  let currentPeak = 0;
  for (let c = 0; c < newBuffer.numberOfChannels; c++) {
    const data = newBuffer.getChannelData(c);
    for (let i = startSample; i < endSample; i++) {
      const absVal = Math.abs(data[i]);
      if (absVal > currentPeak) {
        currentPeak = absVal;
      }
    }
  }

  if (currentPeak <= 0.000001) return newBuffer;

  const targetLinear = Math.pow(10, targetPeakDb / 20);
  const factor = targetLinear / currentPeak;

  for (let c = 0; c < newBuffer.numberOfChannels; c++) {
    const data = newBuffer.getChannelData(c);
    for (let i = startSample; i < endSample; i++) {
      data[i] = Math.max(-1, Math.min(1, data[i] * factor));
    }
  }

  return newBuffer;
}

/**
 * Apply Fade-in or Fade-out
 */
export function applyFade(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  fadeType: 'in' | 'out',
  startSec: number,
  endSec: number,
  curve: 'linear' | 'exponential' | 'logarithmic' = 'linear'
): AudioBuffer {
  const newBuffer = cloneAudioBuffer(ctx, buffer);
  const sampleRate = buffer.sampleRate;
  const startSample = Math.max(0, Math.floor(startSec * sampleRate));
  const endSample = Math.min(buffer.length, Math.ceil(endSec * sampleRate));
  const length = endSample - startSample;

  if (length <= 0) return newBuffer;

  for (let c = 0; c < newBuffer.numberOfChannels; c++) {
    const data = newBuffer.getChannelData(c);
    for (let i = 0; i < length; i++) {
      const idx = startSample + i;
      const progress = i / length; // 0 to 1
      let gain = fadeType === 'in' ? progress : 1 - progress;

      if (curve === 'exponential') {
        gain = fadeType === 'in' ? Math.pow(progress, 2) : Math.pow(1 - progress, 2);
      } else if (curve === 'logarithmic') {
        gain = fadeType === 'in' ? Math.sqrt(progress) : Math.sqrt(1 - progress);
      }

      data[idx] *= gain;
    }
  }

  return newBuffer;
}

/**
 * Reverse audio within selection or full buffer
 */
export function reverseAudio(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  startSec?: number,
  endSec?: number
): AudioBuffer {
  const newBuffer = cloneAudioBuffer(ctx, buffer);
  const startSample = startSec !== undefined ? Math.max(0, Math.floor(startSec * buffer.sampleRate)) : 0;
  const endSample = endSec !== undefined ? Math.min(buffer.length, Math.ceil(endSec * buffer.sampleRate)) : buffer.length;

  for (let c = 0; c < newBuffer.numberOfChannels; c++) {
    const data = newBuffer.getChannelData(c);
    let left = startSample;
    let right = endSample - 1;
    while (left < right) {
      const temp = data[left];
      data[left] = data[right];
      data[right] = temp;
      left++;
      right--;
    }
  }

  return newBuffer;
}

/**
 * Convert Mono <-> Stereo, swap channels, or invert phase
 */
export function convertChannels(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  mode: 'toMono' | 'toStereo' | 'swap' | 'invertPhase'
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  if (mode === 'toMono') {
    const monoBuffer = ctx.createBuffer(1, length, sampleRate);
    const monoData = monoBuffer.getChannelData(0);

    if (buffer.numberOfChannels === 1) {
      monoData.set(buffer.getChannelData(0));
    } else {
      const ch0 = buffer.getChannelData(0);
      const ch1 = buffer.getChannelData(1);
      for (let i = 0; i < length; i++) {
        monoData[i] = (ch0[i] + ch1[i]) * 0.5;
      }
    }
    return monoBuffer;
  }

  if (mode === 'toStereo') {
    const stereoBuffer = ctx.createBuffer(2, length, sampleRate);
    const left = stereoBuffer.getChannelData(0);
    const right = stereoBuffer.getChannelData(1);

    if (buffer.numberOfChannels === 1) {
      left.set(buffer.getChannelData(0));
      right.set(buffer.getChannelData(0));
    } else {
      left.set(buffer.getChannelData(0));
      right.set(buffer.getChannelData(1));
    }
    return stereoBuffer;
  }

  if (mode === 'swap') {
    if (buffer.numberOfChannels < 2) return cloneAudioBuffer(ctx, buffer);
    const swapped = ctx.createBuffer(2, length, sampleRate);
    swapped.getChannelData(0).set(buffer.getChannelData(1));
    swapped.getChannelData(1).set(buffer.getChannelData(0));
    return swapped;
  }

  if (mode === 'invertPhase') {
    const inverted = cloneAudioBuffer(ctx, buffer);
    for (let c = 0; c < inverted.numberOfChannels; c++) {
      const data = inverted.getChannelData(c);
      for (let i = 0; i < length; i++) {
        data[i] = -data[i];
      }
    }
    return inverted;
  }

  return cloneAudioBuffer(ctx, buffer);
}

/**
 * Dynamic Noise Gate / Background noise reduction
 */
export function applyNoiseGate(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  thresholdDb: number, // e.g. -45 dB
  reductionDb: number  // e.g. -24 dB
): AudioBuffer {
  const newBuffer = cloneAudioBuffer(ctx, buffer);
  const thresholdLinear = Math.pow(10, thresholdDb / 20);
  const attenuation = Math.pow(10, -Math.abs(reductionDb) / 20);

  const windowSize = Math.floor(buffer.sampleRate * 0.01); // 10ms window

  for (let c = 0; c < newBuffer.numberOfChannels; c++) {
    const data = newBuffer.getChannelData(c);
    let envelope = 0;

    for (let i = 0; i < data.length; i++) {
      const absSample = Math.abs(data[i]);
      envelope = Math.max(absSample, envelope * 0.995 + absSample * 0.005);

      if (envelope < thresholdLinear) {
        data[i] *= attenuation;
      }
    }
  }

  return newBuffer;
}

/**
 * Remove silent sections (strips intervals where RMS < thresholdDb)
 */
export function removeSilences(
  ctx: BaseAudioContext,
  buffer: AudioBuffer,
  thresholdDb = -45,
  minSilenceSec = 0.3
): AudioBuffer {
  const sampleRate = buffer.sampleRate;
  const thresholdLinear = Math.pow(10, thresholdDb / 20);
  const blockSize = Math.floor(sampleRate * 0.02); // 20ms blocks
  const numBlocks = Math.floor(buffer.length / blockSize);
  const isSilentBlock: boolean[] = new Array(numBlocks).fill(false);

  // Compute energy per block
  for (let b = 0; b < numBlocks; b++) {
    let sumSquares = 0;
    const start = b * blockSize;
    for (let c = 0; c < buffer.numberOfChannels; c++) {
      const ch = buffer.getChannelData(c);
      for (let i = 0; i < blockSize; i++) {
        const val = ch[start + i];
        sumSquares += val * val;
      }
    }
    const rms = Math.sqrt(sumSquares / (blockSize * buffer.numberOfChannels));
    if (rms < thresholdLinear) {
      isSilentBlock[b] = true;
    }
  }

  const minSilenceBlocks = Math.ceil((minSilenceSec * sampleRate) / blockSize);
  const keepBlock: boolean[] = new Array(numBlocks).fill(true);

  let currentRun = 0;
  for (let b = 0; b < numBlocks; b++) {
    if (isSilentBlock[b]) {
      currentRun++;
    } else {
      if (currentRun >= minSilenceBlocks) {
        for (let k = b - currentRun; k < b; k++) {
          keepBlock[k] = false;
        }
      }
      currentRun = 0;
    }
  }
  if (currentRun >= minSilenceBlocks) {
    for (let k = numBlocks - currentRun; k < numBlocks; k++) {
      keepBlock[k] = false;
    }
  }

  // Count retained length
  let keptBlocks = 0;
  for (let b = 0; b < numBlocks; b++) {
    if (keepBlock[b]) keptBlocks++;
  }

  if (keptBlocks === 0) {
    // Keep at least a small portion
    return cloneAudioBuffer(ctx, buffer);
  }

  const newLength = keptBlocks * blockSize;
  const result = ctx.createBuffer(buffer.numberOfChannels, newLength, sampleRate);

  for (let c = 0; c < buffer.numberOfChannels; c++) {
    const src = buffer.getChannelData(c);
    const dst = result.getChannelData(c);
    let dstOffset = 0;

    for (let b = 0; b < numBlocks; b++) {
      if (keepBlock[b]) {
        dst.set(src.subarray(b * blockSize, (b + 1) * blockSize), dstOffset);
        dstOffset += blockSize;
      }
    }
  }

  return result;
}

/**
 * Change speed with resample or pitch alteration
 */
export async function changeSpeed(
  buffer: AudioBuffer,
  speedRatio: number // 0.5 to 2.0
): Promise<AudioBuffer> {
  const newLength = Math.max(1, Math.round(buffer.length / speedRatio));
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    newLength,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(speedRatio, 0);
  source.connect(offlineCtx.destination);
  source.start(0);

  return await offlineCtx.startRendering();
}

/**
 * Pitch shifting using OfflineAudioContext playback rate + resampling
 */
export async function changePitch(
  buffer: AudioBuffer,
  semitones: number // -12 to +12
): Promise<AudioBuffer> {
  const pitchRatio = Math.pow(2, semitones / 12);
  const targetLength = buffer.length;

  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    targetLength,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.playbackRate.setValueAtTime(pitchRatio, 0);
  source.connect(offlineCtx.destination);
  source.start(0);

  return await offlineCtx.startRendering();
}

/**
 * Apply Dynamics Compressor & Peak Limiter via OfflineAudioContext
 */
export async function applyCompressor(
  buffer: AudioBuffer,
  params: {
    threshold: number; // dB (-100 to 0)
    ratio: number;     // 1 to 20
    attack: number;    // seconds (0.001 to 1)
    release: number;   // seconds (0.01 to 1)
    knee: number;      // dB (0 to 40)
  }
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  const compressor = offlineCtx.createDynamicsCompressor();
  compressor.threshold.setValueAtTime(params.threshold, 0);
  compressor.ratio.setValueAtTime(params.ratio, 0);
  compressor.attack.setValueAtTime(params.attack, 0);
  compressor.release.setValueAtTime(params.release, 0);
  compressor.knee.setValueAtTime(params.knee, 0);

  source.connect(compressor);
  compressor.connect(offlineCtx.destination);

  source.start(0);
  return await offlineCtx.startRendering();
}

/**
 * Synthetic impulse response generator for algorithmic Reverb
 */
function createReverbImpulse(
  ctx: BaseAudioContext,
  durationSec: number,
  decay: number
): AudioBuffer {
  const sampleRate = ctx.sampleRate;
  const length = Math.round(sampleRate * durationSec);
  const impulse = ctx.createBuffer(2, length, sampleRate);
  const left = impulse.getChannelData(0);
  const right = impulse.getChannelData(1);

  for (let i = 0; i < length; i++) {
    const t = i / length;
    const factor = Math.exp(-t * decay);
    left[i] = (Math.random() * 2 - 1) * factor;
    right[i] = (Math.random() * 2 - 1) * factor;
  }
  return impulse;
}

/**
 * Distortion curve generator
 */
function makeDistortionCurve(amount = 20): Float32Array {
  const k = typeof amount === 'number' ? amount : 20;
  const n_samples = 44100;
  const curve = new Float32Array(n_samples);
  const deg = Math.PI / 180;
  for (let i = 0; i < n_samples; ++i) {
    const x = (i * 2) / n_samples - 1;
    curve[i] = ((3 + k) * x * 20 * deg) / (Math.PI + k * Math.abs(x));
  }
  return curve;
}

/**
 * Apply Parametric & Graphic EQ
 */
export async function applyEQ(
  buffer: AudioBuffer,
  bands: EQBand[]
): Promise<AudioBuffer> {
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    buffer.length,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  let lastNode: AudioNode = source;

  bands.forEach(band => {
    const filter = offlineCtx.createBiquadFilter();
    filter.type = band.type;
    filter.frequency.setValueAtTime(band.frequency, 0);
    filter.gain.setValueAtTime(band.gain, 0);
    filter.Q.setValueAtTime(band.q, 0);

    lastNode.connect(filter);
    lastNode = filter;
  });

  lastNode.connect(offlineCtx.destination);
  source.start(0);

  return await offlineCtx.startRendering();
}

/**
 * Apply Effects Rack (Distortion, Delay, Echo, Reverb, Chorus, Flanger, Phaser, Tremolo, Bitcrusher)
 */
export async function applyEffects(
  buffer: AudioBuffer,
  effects: EffectConfig[]
): Promise<AudioBuffer> {
  const enabledEffects = effects.filter(e => e.enabled);
  if (enabledEffects.length === 0) {
    return cloneAudioBuffer(getAudioContext(), buffer);
  }

  // Extend duration slightly if delay or reverb are active to capture tail
  const hasTail = enabledEffects.some(e => ['delay', 'echo', 'reverb'].includes(e.type));
  const tailDuration = hasTail ? 1.5 : 0;
  const extraSamples = Math.round(tailDuration * buffer.sampleRate);
  const totalLength = buffer.length + extraSamples;

  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    totalLength,
    buffer.sampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;

  let currentNode: AudioNode = source;

  for (const effect of enabledEffects) {
    switch (effect.type) {
      case 'distortion':
      case 'overdrive': {
        const drive = effect.params.drive ?? (effect.type === 'distortion' ? 25 : 12);
        const shaper = offlineCtx.createWaveShaper();
        shaper.curve = makeDistortionCurve(drive);
        shaper.oversample = '4x';
        currentNode.connect(shaper);
        currentNode = shaper;
        break;
      }

      case 'delay':
      case 'echo': {
        const time = effect.params.time ?? (effect.type === 'echo' ? 0.35 : 0.25);
        const feedbackVal = effect.params.feedback ?? 0.4;
        const wetVal = effect.params.wet ?? 0.4;

        const delayNode = offlineCtx.createDelay(2.0);
        delayNode.delayTime.setValueAtTime(time, 0);

        const feedback = offlineCtx.createGain();
        feedback.gain.setValueAtTime(feedbackVal, 0);

        const dryGain = offlineCtx.createGain();
        dryGain.gain.setValueAtTime(1 - wetVal, 0);

        const wetGain = offlineCtx.createGain();
        wetGain.gain.setValueAtTime(wetVal, 0);

        const merger = offlineCtx.createGain();

        currentNode.connect(dryGain);
        dryGain.connect(merger);

        currentNode.connect(delayNode);
        delayNode.connect(feedback);
        feedback.connect(delayNode);

        delayNode.connect(wetGain);
        wetGain.connect(merger);

        currentNode = merger;
        break;
      }

      case 'reverb': {
        const roomSize = effect.params.roomSize ?? 2.0;
        const decay = effect.params.decay ?? 3.0;
        const wet = effect.params.wet ?? 0.35;

        const convolver = offlineCtx.createConvolver();
        convolver.buffer = createReverbImpulse(offlineCtx, roomSize, decay);

        const dryGain = offlineCtx.createGain();
        dryGain.gain.setValueAtTime(1 - wet, 0);

        const wetGain = offlineCtx.createGain();
        wetGain.gain.setValueAtTime(wet, 0);

        const merger = offlineCtx.createGain();

        currentNode.connect(dryGain);
        dryGain.connect(merger);

        currentNode.connect(convolver);
        convolver.connect(wetGain);
        wetGain.connect(merger);

        currentNode = merger;
        break;
      }

      case 'chorus':
      case 'flanger': {
        const rate = effect.params.rate ?? 1.5;
        const depth = effect.params.depth ?? (effect.type === 'flanger' ? 0.003 : 0.008);
        const baseDelay = effect.type === 'flanger' ? 0.002 : 0.015;

        const delay = offlineCtx.createDelay(0.05);
        delay.delayTime.setValueAtTime(baseDelay, 0);

        const osc = offlineCtx.createOscillator();
        const oscGain = offlineCtx.createGain();
        osc.frequency.setValueAtTime(rate, 0);
        oscGain.gain.setValueAtTime(depth, 0);

        osc.connect(oscGain);
        oscGain.connect(delay.delayTime);
        osc.start(0);

        const dry = offlineCtx.createGain();
        dry.gain.setValueAtTime(0.7, 0);

        const wet = offlineCtx.createGain();
        wet.gain.setValueAtTime(0.6, 0);

        const merger = offlineCtx.createGain();
        currentNode.connect(dry);
        dry.connect(merger);

        currentNode.connect(delay);
        delay.connect(wet);
        wet.connect(merger);

        currentNode = merger;
        break;
      }

      case 'phaser': {
        // 4 allpass filter stages
        const stages = 4;
        let lastFilter: AudioNode = currentNode;
        for (let s = 0; s < stages; s++) {
          const filter = offlineCtx.createBiquadFilter();
          filter.type = 'allpass';
          filter.frequency.setValueAtTime(800 + s * 300, 0);
          lastFilter.connect(filter);
          lastFilter = filter;
        }

        const merger = offlineCtx.createGain();
        currentNode.connect(merger);
        lastFilter.connect(merger);
        currentNode = merger;
        break;
      }

      case 'tremolo': {
        const rate = effect.params.rate ?? 5.0;
        const depth = effect.params.depth ?? 0.6;

        const gainNode = offlineCtx.createGain();
        const osc = offlineCtx.createOscillator();
        const oscGain = offlineCtx.createGain();

        gainNode.gain.setValueAtTime(1 - depth / 2, 0);
        osc.frequency.setValueAtTime(rate, 0);
        oscGain.gain.setValueAtTime(depth / 2, 0);

        osc.connect(oscGain);
        oscGain.connect(gainNode.gain);
        osc.start(0);

        currentNode.connect(gainNode);
        currentNode = gainNode;
        break;
      }

      case 'vibrato': {
        const rate = effect.params.rate ?? 6.0;
        const depth = effect.params.depth ?? 0.003;

        const delay = offlineCtx.createDelay(0.05);
        delay.delayTime.setValueAtTime(0.01, 0);

        const osc = offlineCtx.createOscillator();
        const oscGain = offlineCtx.createGain();

        osc.frequency.setValueAtTime(rate, 0);
        oscGain.gain.setValueAtTime(depth, 0);

        osc.connect(oscGain);
        oscGain.connect(delay.delayTime);
        osc.start(0);

        currentNode.connect(delay);
        currentNode = delay;
        break;
      }

      case 'bitcrusher': {
        // Bit reduction & sample rate decimation can be rendered directly into buffer
        break;
      }
    }
  }

  currentNode.connect(offlineCtx.destination);
  source.start(0);

  let rendered = await offlineCtx.startRendering();

  // Apply Bitcrusher if enabled
  const bitcrushEffect = enabledEffects.find(e => e.type === 'bitcrusher');
  if (bitcrushEffect) {
    const bits = bitcrushEffect.params.bits ?? 6;
    const downsample = Math.max(1, Math.round(bitcrushEffect.params.downsample ?? 4));
    const step = Math.pow(0.5, bits);

    rendered = cloneAudioBuffer(getAudioContext(), rendered);
    for (let c = 0; c < rendered.numberOfChannels; c++) {
      const data = rendered.getChannelData(c);
      let lastVal = 0;
      for (let i = 0; i < data.length; i++) {
        if (i % downsample === 0) {
          lastVal = step * Math.floor(data[i] / step + 0.5);
        }
        data[i] = lastVal;
      }
    }
  }

  return rendered;
}

/**
 * Mixes down all active/unmuted tracks into a single master AudioBuffer
 */
export async function mixDownTracks(
  tracks: AudioTrack[],
  range?: { start: number; end: number }
): Promise<AudioBuffer> {
  const activeTracks = tracks.filter(t => t.buffer && !t.mute);
  const hasSolo = activeTracks.some(t => t.solo);
  const tracksToMix = activeTracks.filter(t => (hasSolo ? t.solo : true));

  if (tracksToMix.length === 0) {
    return createSilentBuffer(getAudioContext(), 1, 44100, 2);
  }

  // Calculate project boundary
  let maxEnd = 0;
  tracksToMix.forEach(t => {
    const end = (t.startTime || 0) + (t.buffer?.duration || 0);
    if (end > maxEnd) maxEnd = end;
  });

  const startTime = range ? Math.max(0, range.start) : 0;
  const endTime = range ? Math.min(maxEnd, range.end) : maxEnd;
  const mixDuration = Math.max(0.1, endTime - startTime);

  const sampleRate = 44100;
  const totalSamples = Math.round(mixDuration * sampleRate);

  const offlineCtx = new OfflineAudioContext(2, totalSamples, sampleRate);

  tracksToMix.forEach(track => {
    if (!track.buffer) return;

    const trackStart = track.startTime || 0;
    const trackEnd = trackStart + track.buffer.duration;

    if (trackEnd <= startTime || trackStart >= endTime) return;

    const source = offlineCtx.createBufferSource();
    source.buffer = track.buffer;

    const gain = offlineCtx.createGain();
    gain.gain.setValueAtTime(track.volume, 0);

    source.connect(gain);

    let lastNode: AudioNode = gain;

    if (offlineCtx.createStereoPanner) {
      const panner = offlineCtx.createStereoPanner();
      panner.pan.setValueAtTime(Math.max(-1, Math.min(1, track.pan)), 0);
      gain.connect(panner);
      lastNode = panner;
    }

    lastNode.connect(offlineCtx.destination);

    // Schedule position relative to render start
    const offsetInMix = trackStart - startTime;
    if (offsetInMix >= 0) {
      source.start(offsetInMix);
    } else {
      const trackOffset = -offsetInMix;
      source.start(0, trackOffset);
    }
  });

  return await offlineCtx.startRendering();
}

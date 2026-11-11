/**
 * Professional WAV Audio Encoder
 * Encodes AudioBuffer into binary RIFF WAV format (16-bit, 24-bit, or 32-bit float).
 */

export type WavBitDepth = 16 | 24 | 32;

export interface ExportOptions {
  format: 'wav' | 'mp3' | 'ogg' | 'flac' | 'aac';
  bitDepth: WavBitDepth;
  sampleRate: number;
  channels: 'stereo' | 'mono';
  qualityKbps: number;
  rangeOnly: boolean;
}

export function audioBufferToWavBlob(
  buffer: AudioBuffer,
  bitDepth: WavBitDepth = 16,
  targetChannels: 'stereo' | 'mono' = 'stereo'
): Blob {
  const numChannels = targetChannels === 'mono' ? 1 : 2;
  const sampleRate = buffer.sampleRate;
  const length = buffer.length;

  const bytesPerSample = bitDepth / 8;
  const blockAlign = numChannels * bytesPerSample;
  const byteRate = sampleRate * blockAlign;
  const dataSize = length * blockAlign;
  const headerSize = 44;
  const totalSize = headerSize + dataSize;

  const arrayBuffer = new ArrayBuffer(totalSize);
  const view = new DataView(arrayBuffer);

  // Helper to write ASCII strings
  const writeString = (offset: number, str: string) => {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  };

  // RIFF header
  writeString(0, 'RIFF');
  view.setUint32(4, totalSize - 8, true);
  writeString(8, 'WAVE');

  // fmt chunk
  writeString(12, 'fmt ');
  view.setUint32(16, 16, true); // SubChunk1Size (16 for PCM)
  const audioFormat = bitDepth === 32 ? 3 : 1; // 1 = PCM, 3 = IEEE Float
  view.setUint16(20, audioFormat, true);
  view.setUint16(22, numChannels, true);
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, byteRate, true);
  view.setUint16(32, blockAlign, true);
  view.setUint16(34, bitDepth, true);

  // data chunk
  writeString(36, 'data');
  view.setUint32(40, dataSize, true);

  // Sample data encoding
  let offset = 44;

  const ch0 = buffer.getChannelData(0);
  const ch1 = buffer.numberOfChannels > 1 ? buffer.getChannelData(1) : ch0;

  if (bitDepth === 16) {
    for (let i = 0; i < length; i++) {
      if (numChannels === 1) {
        const sample = buffer.numberOfChannels > 1 ? (ch0[i] + ch1[i]) * 0.5 : ch0[i];
        const s = Math.max(-1, Math.min(1, sample));
        view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7fff, true);
        offset += 2;
      } else {
        const s0 = Math.max(-1, Math.min(1, ch0[i]));
        const s1 = Math.max(-1, Math.min(1, ch1[i]));
        view.setInt16(offset, s0 < 0 ? s0 * 0x8000 : s0 * 0x7fff, true);
        view.setInt16(offset + 2, s1 < 0 ? s1 * 0x8000 : s1 * 0x7fff, true);
        offset += 4;
      }
    }
  } else if (bitDepth === 24) {
    for (let i = 0; i < length; i++) {
      if (numChannels === 1) {
        const sample = buffer.numberOfChannels > 1 ? (ch0[i] + ch1[i]) * 0.5 : ch0[i];
        const s = Math.max(-1, Math.min(1, sample));
        const val = Math.floor(s < 0 ? s * 0x800000 : s * 0x7fffff);
        view.setUint8(offset, val & 0xff);
        view.setUint8(offset + 1, (val >> 8) & 0xff);
        view.setUint8(offset + 2, (val >> 16) & 0xff);
        offset += 3;
      } else {
        const s0 = Math.max(-1, Math.min(1, ch0[i]));
        const s1 = Math.max(-1, Math.min(1, ch1[i]));
        const val0 = Math.floor(s0 < 0 ? s0 * 0x800000 : s0 * 0x7fffff);
        const val1 = Math.floor(s1 < 0 ? s1 * 0x800000 : s1 * 0x7fffff);

        view.setUint8(offset, val0 & 0xff);
        view.setUint8(offset + 1, (val0 >> 8) & 0xff);
        view.setUint8(offset + 2, (val0 >> 16) & 0xff);

        view.setUint8(offset + 3, val1 & 0xff);
        view.setUint8(offset + 4, (val1 >> 8) & 0xff);
        view.setUint8(offset + 5, (val1 >> 16) & 0xff);
        offset += 6;
      }
    }
  } else {
    // 32-bit IEEE Float
    for (let i = 0; i < length; i++) {
      if (numChannels === 1) {
        const sample = buffer.numberOfChannels > 1 ? (ch0[i] + ch1[i]) * 0.5 : ch0[i];
        view.setFloat32(offset, sample, true);
        offset += 4;
      } else {
        view.setFloat32(offset, ch0[i], true);
        view.setFloat32(offset + 4, ch1[i], true);
        offset += 8;
      }
    }
  }

  return new Blob([arrayBuffer], { type: 'audio/wav' });
}

/**
 * Resamples an AudioBuffer to a target sample rate
 */
export async function resampleAudioBuffer(
  buffer: AudioBuffer,
  targetSampleRate: number
): Promise<AudioBuffer> {
  if (buffer.sampleRate === targetSampleRate) return buffer;

  const targetLength = Math.round((buffer.length * targetSampleRate) / buffer.sampleRate);
  const offlineCtx = new OfflineAudioContext(
    buffer.numberOfChannels,
    targetLength,
    targetSampleRate
  );

  const source = offlineCtx.createBufferSource();
  source.buffer = buffer;
  source.connect(offlineCtx.destination);
  source.start(0);

  return await offlineCtx.startRendering();
}

/**
 * Trigger browser file download for a given Blob
 */
export function downloadBlob(blob: Blob, fileName: string) {
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.style.display = 'none';
  a.href = url;
  a.download = fileName;
  document.body.appendChild(a);
  a.click();
  setTimeout(() => {
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, 300);
}

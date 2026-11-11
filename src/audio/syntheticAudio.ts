import { getAudioContext } from './audioContext';

/**
 * Procedurally generates pleasant musical and rhythmic audio samples
 * for instant testing of Audio Studio capabilities.
 */
export function generateDemoTrack(
  type: 'synthwave' | 'acoustic' | 'ambient'
): AudioBuffer {
  const ctx = getAudioContext();
  const sampleRate = ctx.sampleRate || 44100;
  const duration = 8.0; // 8 seconds loop
  const totalSamples = Math.floor(sampleRate * duration);

  const buffer = ctx.createBuffer(2, totalSamples, sampleRate);
  const left = buffer.getChannelData(0);
  const right = buffer.getChannelData(1);

  const bpm = 120;
  const beatSec = 60 / bpm; // 0.5s per beat
  const totalBeats = Math.floor(duration / beatSec);

  if (type === 'synthwave') {
    // Synthwave Beat: Kick on 1 & 3, Snare on 2 & 4, 16th Hi-hats, and Synth Bass
    const bassNotes = [55, 55, 65.41, 73.42, 55, 55, 82.41, 73.42]; // A1, C2, D2, E2 notes

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const beat = (t / beatSec);
      const beatFrac = beat % 1.0;
      const beatIndex = Math.floor(beat) % 4;

      let sampleL = 0;
      let sampleR = 0;

      // Kick drum on beats 0 and 2
      if (beatIndex === 0 || beatIndex === 2) {
        const kickTime = beatFrac * beatSec;
        if (kickTime < 0.25) {
          const kickFreq = Math.max(45, 140 * Math.exp(-kickTime * 22));
          const kickEnv = Math.exp(-kickTime * 14);
          const kick = Math.sin(2 * Math.PI * kickFreq * kickTime) * kickEnv * 0.85;
          sampleL += kick;
          sampleR += kick;
        }
      }

      // Snare drum on beats 1 and 3
      if (beatIndex === 1 || beatIndex === 3) {
        const snareTime = beatFrac * beatSec;
        if (snareTime < 0.22) {
          const noise = (Math.random() * 2 - 1) * Math.exp(-snareTime * 18);
          const tone = Math.sin(2 * Math.PI * 180 * snareTime) * Math.exp(-snareTime * 25);
          const snare = (noise * 0.45 + tone * 0.35);
          sampleL += snare * 0.9;
          sampleR += snare * 1.1;
        }
      }

      // Hi-hats (every 16th note)
      const sub16th = (t / (beatSec / 4)) % 1.0;
      const hatTime = sub16th * (beatSec / 4);
      if (hatTime < 0.06) {
        const hatEnv = Math.exp(-hatTime * 65);
        const hat = (Math.random() * 2 - 1) * hatEnv * 0.18;
        sampleL += hat * 0.8;
        sampleR += hat * 1.2;
      }

      // Synth Bassline (8th notes)
      const sub8th = Math.floor(t / (beatSec / 2)) % bassNotes.length;
      const noteTime = (t % (beatSec / 2));
      const freq = bassNotes[sub8th];
      const bassEnv = Math.exp(-noteTime * 6);
      // Sawtooth + square with filter sweep
      const saw = 2 * ((freq * t) % 1) - 1;
      const sub = Math.sin(2 * Math.PI * (freq / 2) * t);
      const bass = (saw * 0.4 + sub * 0.3) * bassEnv * 0.45;
      sampleL += bass;
      sampleR += bass;

      // Synth Arp Melody
      const arpFreqs = [220, 261.63, 329.63, 392, 440, 523.25, 659.25, 783.99];
      const arpIndex = Math.floor(t / (beatSec / 4)) % arpFreqs.length;
      const arpTime = (t % (beatSec / 4));
      const arpEnv = Math.exp(-arpTime * 8);
      const arp = Math.sin(2 * Math.PI * arpFreqs[arpIndex] * t) * arpEnv * 0.22;

      sampleL += arp * 0.7;
      sampleR += arp * 1.3;

      left[i] = Math.max(-0.95, Math.min(0.95, sampleL * 0.75));
      right[i] = Math.max(-0.95, Math.min(0.95, sampleR * 0.75));
    }
  } else if (type === 'acoustic') {
    // Acoustic chords and soft gentle progression (Em - C - G - D)
    const chords = [
      [164.81, 196.00, 246.94, 329.63], // Em
      [130.81, 164.81, 196.00, 261.63], // C
      [196.00, 246.94, 293.66, 392.00], // G
      [146.83, 220.00, 293.66, 369.99]  // D
    ];

    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;
      const chordIdx = Math.floor(t / (duration / 4)) % 4;
      const chord = chords[chordIdx];
      const chordTime = t % (duration / 4);

      let sampleL = 0;
      let sampleR = 0;

      // Arpeggiated guitar strings
      chord.forEach((freq, stringIdx) => {
        const strumDelay = stringIdx * 0.04;
        if (chordTime >= strumDelay) {
          const noteT = chordTime - strumDelay;
          const env = Math.exp(-noteT * 2.5);
          // Harmonic overtone synthesis
          const harmonic1 = Math.sin(2 * Math.PI * freq * noteT);
          const harmonic2 = 0.5 * Math.sin(2 * Math.PI * freq * 2 * noteT);
          const harmonic3 = 0.25 * Math.sin(2 * Math.PI * freq * 3 * noteT);
          const stringSound = (harmonic1 + harmonic2 + harmonic3) * env * 0.2;

          const pan = (stringIdx - 1.5) / 2.5; // -0.6 to +0.6
          sampleL += stringSound * (0.5 - pan * 0.4);
          sampleR += stringSound * (0.5 + pan * 0.4);
        }
      });

      // Warm background sub pad
      const padFreq = chord[0] * 0.5;
      const pad = (Math.sin(2 * Math.PI * padFreq * t) + 0.3 * Math.sin(2 * Math.PI * padFreq * 2 * t)) * 0.12;
      sampleL += pad;
      sampleR += pad;

      left[i] = Math.max(-0.95, Math.min(0.95, sampleL * 1.1));
      right[i] = Math.max(-0.95, Math.min(0.95, sampleR * 1.1));
    }
  } else {
    // Ambient soundscape: shimmering pads, gentle binaural beat, wind resonance
    for (let i = 0; i < totalSamples; i++) {
      const t = i / sampleRate;

      // Slowly evolving drone with binaural frequency shift (432Hz vs 436Hz)
      const droneL = (Math.sin(2 * Math.PI * 108 * t) + 0.4 * Math.sin(2 * Math.PI * 216 * t) + 0.2 * Math.sin(2 * Math.PI * 324 * t)) * 0.25;
      const droneR = (Math.sin(2 * Math.PI * 110 * t) + 0.4 * Math.sin(2 * Math.PI * 218 * t) + 0.2 * Math.sin(2 * Math.PI * 326 * t)) * 0.25;

      // Shimmer swell
      const swell = (Math.sin(2 * Math.PI * 0.25 * t) + 1) * 0.5;
      const shimmerL = Math.sin(2 * Math.PI * 528 * t) * (0.1 * swell);
      const shimmerR = Math.sin(2 * Math.PI * 660 * t) * (0.1 * (1 - swell));

      // Wind texture
      const noise = (Math.random() * 2 - 1) * 0.035 * Math.sin(2 * Math.PI * 0.12 * t);

      left[i] = Math.max(-0.95, Math.min(0.95, (droneL + shimmerL + noise) * 0.85));
      right[i] = Math.max(-0.95, Math.min(0.95, (droneR + shimmerR + noise) * 0.85));
    }
  }

  return buffer;
}

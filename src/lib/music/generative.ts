type AudioContextCtor = typeof AudioContext;

export type GenerativeMusic = {
  stream: MediaStream;
  resume: () => Promise<void>;
  mute: () => void;
  stop: () => void;
};

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

type SawVoice = {
  osc: OscillatorNode;
  gain: GainNode;
  detune: number;
};

const PUNCHY_STIM = {
  root: 98,
  stepMs: 122,
  vocalPhrase: [
    { step: 8, degree: 7, hold: 5, lift: 0.38 },
    { step: 44, degree: 10, hold: 4, lift: 0.32 },
  ],
  bassAccents: [
    { step: 0, degree: 0, amount: 1 },
    { step: 8, degree: -2, amount: 0.86 },
    { step: 12, degree: 3, amount: 0.72 },
    { step: 15, degree: 5, amount: 0.52, pickup: true },
  ],
  kickPattern: [
    0.95, 0, 0, 0.48, 0, 0.68, 0, 0,
    0.82, 0, 0.34, 0, 0, 0.72, 0.38, 0,
    0.92, 0, 0, 0.42, 0.62, 0, 0, 0.3,
    0.78, 0, 0.46, 0, 0, 0.54, 0.86, 0,
  ],
  fillClicks: [0, 0.45, 0, 0.6, 0.2, 0, 0.72, 0.38],
  hatPattern: [0.42, 0, 0.7, 0.25, 0.55, 0, 0.78, 0, 0.48, 0.22, 0.68, 0, 0.6, 0, 0.82, 0.32],
  accents: [1, 0.22, 0.58, 0.28, 0.88, 0.24, 0.68, 0.34, 0.96, 0.26, 0.56, 0.3, 0.82, 0.26, 0.64, 0.38],
};

const createNoiseBuffer = (audioContext: AudioContext, seconds: number, decay: number) => {
  const buffer = audioContext.createBuffer(1, audioContext.sampleRate * seconds, audioContext.sampleRate);
  const data = buffer.getChannelData(0);
  for (let i = 0; i < data.length; i++) {
    data[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / data.length, decay);
  }
  return buffer;
};

const midiRatio = (semitones: number) => Math.pow(2, semitones / 12);

export const createGenerativeMusic = (): GenerativeMusic => {
  const AudioContextConstructor = (window.AudioContext || window.webkitAudioContext) as AudioContextCtor | undefined;
  if (!AudioContextConstructor) throw new Error("Web Audio is not available.");

  const audioContext = new AudioContextConstructor();
  const master = audioContext.createGain();
  const destination = audioContext.createMediaStreamDestination();
  const delay = audioContext.createDelay(0.24);
  const feedback = audioContext.createGain();
  const toneBus = audioContext.createGain();
  const tickBus = audioContext.createGain();
  const roomBus = audioContext.createGain();
  const filter = audioContext.createBiquadFilter();
  const sawFilter = audioContext.createBiquadFilter();
  const sawGain = audioContext.createGain();
  const strumBus = audioContext.createGain();
  const stringSheen = audioContext.createBiquadFilter();
  const bell = audioContext.createBiquadFilter();
  const compressor = audioContext.createDynamicsCompressor();
  const sawVoices: SawVoice[] = [];
  const tickNoise = createNoiseBuffer(audioContext, 0.07, 3.2);
  const snareNoise = createNoiseBuffer(audioContext, 0.11, 2.1);
  const hatNoise = createNoiseBuffer(audioContext, 0.13, 1.25);

  master.gain.value = 0;
  toneBus.gain.value = 0.3;
  tickBus.gain.value = 0.9;
  roomBus.gain.value = 0.12;
  sawGain.gain.value = 0;
  filter.type = "lowpass";
  filter.frequency.value = 740;
  filter.Q.value = 0.9;
  sawFilter.type = "lowpass";
  sawFilter.frequency.value = 620;
  sawFilter.Q.value = 0.2;
  strumBus.gain.value = 0.48;
  stringSheen.type = "highshelf";
  stringSheen.frequency.value = 2200;
  stringSheen.gain.value = -12;
  bell.type = "bandpass";
  bell.frequency.value = 2400;
  bell.Q.value = 10;
  delay.delayTime.value = 0.14;
  feedback.gain.value = 0.11;
  compressor.threshold.value = -30;
  compressor.knee.value = 12;
  compressor.ratio.value = 7;
  compressor.attack.value = 0.008;
  compressor.release.value = 0.18;

  toneBus.connect(filter);
  toneBus.connect(roomBus);
  filter.connect(delay);
  delay.connect(feedback);
  feedback.connect(delay);
  filter.connect(compressor);
  delay.connect(compressor);
  roomBus.connect(compressor);
  tickBus.connect(bell);
  bell.connect(compressor);
  compressor.connect(master);
  master.connect(destination);
  master.connect(audioContext.destination);

  const now = audioContext.currentTime;
  [-14, -5, 6, 15].forEach((detune, i) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const pan = audioContext.createStereoPanner();
    osc.type = "sawtooth";
    osc.detune.value = detune;
    gain.gain.value = 0;
    pan.pan.value = (i - 1.5) * 0.18;
    osc.connect(gain);
    gain.connect(pan);
    pan.connect(sawFilter);
    osc.start(now + i * 0.012);
    sawVoices.push({ osc, gain, detune });
  });
  sawFilter.connect(sawGain);
  sawGain.connect(toneBus);
  strumBus.connect(stringSheen);
  stringSheen.connect(toneBus);

  const triggerKick = (t: number, amount: number, ghost = false) => {
    const osc = audioContext.createOscillator();
    const gain = audioContext.createGain();
    const click = audioContext.createOscillator();
    const clickGain = audioContext.createGain();
    const clickFilter = audioContext.createBiquadFilter();
    osc.type = "sine";
    osc.frequency.setValueAtTime(ghost ? 108 : 136, t);
    osc.frequency.exponentialRampToValueAtTime(ghost ? 54 : 46, t + (ghost ? 0.055 : 0.085));
    gain.gain.setValueAtTime((ghost ? 0.042 : 0.12) * amount, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + (ghost ? 0.07 : 0.115));
    click.type = "triangle";
    click.frequency.setValueAtTime(ghost ? 900 : 1300, t);
    clickFilter.type = "bandpass";
    clickFilter.frequency.value = ghost ? 850 : 1250;
    clickFilter.Q.value = 4;
    clickGain.gain.setValueAtTime((ghost ? 0.008 : 0.018) * amount, t);
    clickGain.gain.exponentialRampToValueAtTime(0.001, t + 0.018);
    osc.connect(gain);
    gain.connect(compressor);
    click.connect(clickFilter);
    clickFilter.connect(clickGain);
    clickGain.connect(compressor);
    osc.start(t);
    click.start(t);
    osc.stop(t + (ghost ? 0.08 : 0.13));
    click.stop(t + 0.025);
  };

  const triggerClick = (t: number, amount: number, step: number) => {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const clickFilter = audioContext.createBiquadFilter();
    const pan = audioContext.createStereoPanner();
    source.buffer = tickNoise;
    clickFilter.type = "bandpass";
    clickFilter.frequency.value = 3600 + (step % 6) * 610;
    clickFilter.Q.value = 13;
    pan.pan.value = ((step % 8) - 3.5) * 0.11;
    gain.gain.setValueAtTime(0.045 * amount, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.028);
    source.connect(clickFilter);
    clickFilter.connect(gain);
    gain.connect(pan);
    pan.connect(tickBus);
    source.start(t);
    source.stop(t + 0.04);
  };

  const triggerHat = (t: number, amount: number, step: number) => {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const hatFilter = audioContext.createBiquadFilter();
    const pan = audioContext.createStereoPanner();
    source.buffer = hatNoise;
    hatFilter.type = "highpass";
    hatFilter.frequency.value = 5200 + (step % 4) * 360;
    hatFilter.Q.value = 0.8;
    pan.pan.value = ((step % 4) - 1.5) * 0.08;
    gain.gain.setValueAtTime(0.001, t);
    gain.gain.exponentialRampToValueAtTime(0.036 * amount, t + 0.006);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.082);
    source.connect(hatFilter);
    hatFilter.connect(gain);
    gain.connect(pan);
    pan.connect(tickBus);
    source.start(t);
    source.stop(t + 0.095);
  };

  const triggerSnare = (t: number, amount: number, step: number) => {
    const source = audioContext.createBufferSource();
    const gain = audioContext.createGain();
    const snareFilter = audioContext.createBiquadFilter();
    source.buffer = snareNoise;
    snareFilter.type = "highpass";
    snareFilter.frequency.value = 1200 + (step % 3) * 220;
    gain.gain.setValueAtTime(0.037 * amount, t);
    gain.gain.exponentialRampToValueAtTime(0.001, t + 0.07);
    source.connect(snareFilter);
    snareFilter.connect(gain);
    gain.connect(tickBus);
    source.start(t);
    source.stop(t + 0.08);
  };

  const triggerStrumImpulse = (t: number, amount: number, degree: number) => {
    const baseFreq = PUNCHY_STIM.root * 1.5 * midiRatio(degree);
    [0, 7, 12, 16].forEach((interval, i) => {
      const osc = audioContext.createOscillator();
      const gain = audioContext.createGain();
      const pan = audioContext.createStereoPanner();
      osc.type = "triangle";
      osc.frequency.setValueAtTime(baseFreq * midiRatio(interval), t + i * 0.012);
      osc.detune.setValueAtTime((i - 1.5) * 8, t);
      gain.gain.setValueAtTime(0.001, t + i * 0.012);
      gain.gain.exponentialRampToValueAtTime(0.0035 * amount, t + i * 0.012 + 0.024);
      gain.gain.exponentialRampToValueAtTime(0.001, t + i * 0.012 + 0.18);
      pan.pan.value = (i - 1.5) * 0.16;
      osc.connect(gain);
      gain.connect(pan);
      pan.connect(strumBus);
      osc.start(t + i * 0.012);
      osc.stop(t + i * 0.012 + 0.11);
    });
  };

  const triggerDoubleBassNote = (t: number, degree: number, amount: number, noteIndex: number) => {
    const noteGain = audioContext.createGain();
    const bodyGain = audioContext.createGain();
    const bodyFilter = audioContext.createBiquadFilter();
    const woodGain = audioContext.createGain();
    const woodFilter = audioContext.createBiquadFilter();
    const fingerGain = audioContext.createGain();
    const fingerFilter = audioContext.createBiquadFilter();
    const bodyOsc = audioContext.createOscillator();
    const stringOsc = audioContext.createOscillator();
    const finger = audioContext.createBufferSource();
    const freq = PUNCHY_STIM.root * 0.25 * midiRatio(degree);
    const noteStart = t + (noteIndex % 2) * 0.006;

    bodyOsc.type = "sine";
    stringOsc.type = "triangle";
    finger.buffer = tickNoise;
    bodyOsc.frequency.setValueAtTime(freq * 1.035, noteStart);
    bodyOsc.frequency.exponentialRampToValueAtTime(freq, noteStart + 0.055);
    stringOsc.frequency.setValueAtTime(freq * 2.01, noteStart);
    stringOsc.detune.setValueAtTime(-5 + noteIndex * 1.5, noteStart);
    bodyFilter.type = "lowpass";
    bodyFilter.frequency.setValueAtTime(420 + amount * 110, noteStart);
    bodyFilter.frequency.exponentialRampToValueAtTime(185, noteStart + 0.24);
    bodyFilter.Q.value = 1.1;
    woodFilter.type = "bandpass";
    woodFilter.frequency.value = 145 + noteIndex * 18;
    woodFilter.Q.value = 2.7;
    fingerFilter.type = "bandpass";
    fingerFilter.frequency.value = 620 + noteIndex * 80;
    fingerFilter.Q.value = 1.8;
    bodyGain.gain.setValueAtTime(0.001, t);
    bodyGain.gain.exponentialRampToValueAtTime(0.15 * amount, noteStart + 0.012);
    bodyGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.31);
    woodGain.gain.setValueAtTime(0.001, t);
    woodGain.gain.exponentialRampToValueAtTime(0.05 * amount, noteStart + 0.018);
    woodGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.2);
    fingerGain.gain.setValueAtTime(0.001, t);
    fingerGain.gain.exponentialRampToValueAtTime(0.022 * amount, noteStart + 0.004);
    fingerGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.036);
    noteGain.gain.setValueAtTime(0.001, t);
    noteGain.gain.exponentialRampToValueAtTime(1, noteStart + 0.01);
    noteGain.gain.exponentialRampToValueAtTime(0.001, noteStart + 0.34);

    bodyOsc.connect(bodyFilter);
    stringOsc.connect(bodyFilter);
    bodyFilter.connect(bodyGain);
    bodyGain.connect(noteGain);
    bodyFilter.connect(woodFilter);
    woodFilter.connect(woodGain);
    woodGain.connect(noteGain);
    finger.connect(fingerFilter);
    fingerFilter.connect(fingerGain);
    fingerGain.connect(noteGain);
    noteGain.connect(compressor);
    bodyOsc.start(noteStart);
    stringOsc.start(noteStart);
    finger.start(noteStart);
    bodyOsc.stop(noteStart + 0.38);
    stringOsc.stop(noteStart + 0.26);
    finger.stop(noteStart + 0.045);
  };

  let step = 0;
  const schedule = () => {
    const t = audioContext.currentTime + 0.035;
    const phraseStep = step % 32;
    const phrase = Math.floor(step / 32);
    const phraseLift = phrase % 4 === 3 ? 1.16 : phrase % 4 === 1 ? 0.92 : 1;
    const accent = PUNCHY_STIM.accents[step % PUNCHY_STIM.accents.length];

    const kickAmount = PUNCHY_STIM.kickPattern[step % PUNCHY_STIM.kickPattern.length];
    if (kickAmount) triggerKick(t, Math.max(kickAmount, accent * kickAmount) * phraseLift, kickAmount < 0.65);
    if (phraseStep === 30) triggerKick(t + PUNCHY_STIM.stepMs / 2000, 0.46 * phraseLift, true);
    if (step % 4 === 2 || step % 8 === 7) triggerSnare(t + 0.01, accent * phraseLift, step);
    const hatAmount = PUNCHY_STIM.hatPattern[step % PUNCHY_STIM.hatPattern.length];
    if (hatAmount) triggerHat(t + 0.012, hatAmount * phraseLift, step);
    if (step % 4 === 0 || step % 8 === 5) {
      triggerClick(t + (step % 2 ? 0.018 : 0.006), (step % 2 ? accent * 0.42 : accent * 0.62) * phraseLift, step);
    }

    if (phraseStep >= 24) {
      const fill = PUNCHY_STIM.fillClicks[phraseStep - 24];
      if (fill && phraseStep % 2 === 1) triggerClick(t + 0.052, fill * 0.65 * phraseLift, step + 11);
    }

    const vocalStep = step % 64;
    const vocalNote = PUNCHY_STIM.vocalPhrase.find((note) => note.step === vocalStep);
    if (vocalNote) {
      const freq = PUNCHY_STIM.root * midiRatio(vocalNote.degree);
      const phraseAmount = vocalNote.lift * phraseLift;
      triggerStrumImpulse(t, phraseAmount, vocalNote.degree);
      sawVoices.forEach((voice) => {
        voice.gain.gain.cancelScheduledValues(t);
        voice.osc.frequency.setTargetAtTime(freq, t, 0.18);
        voice.osc.detune.setTargetAtTime(voice.detune + Math.sin(step * 0.11) * 2.2, t, 0.7);
        voice.gain.gain.setTargetAtTime(0.003 + phraseAmount * 0.004, t + 0.08, 0.24);
        voice.gain.gain.setTargetAtTime(0.0001, t + vocalNote.hold * PUNCHY_STIM.stepMs / 1000, 0.22);
      });
      sawFilter.frequency.cancelScheduledValues(t);
      sawFilter.frequency.setValueAtTime(580 + phraseAmount * 40, t);
      sawFilter.frequency.exponentialRampToValueAtTime(940 + phraseAmount * 220, t + 0.42);
      sawFilter.frequency.setTargetAtTime(620, t + vocalNote.hold * PUNCHY_STIM.stepMs / 1000, 0.22);
      stringSheen.gain.setTargetAtTime(-14 + phraseAmount * 2, t, 0.25);
      sawGain.gain.setTargetAtTime(0.14 * phraseLift, t + 0.08, 0.24);
      sawGain.gain.setTargetAtTime(0.0001, t + vocalNote.hold * PUNCHY_STIM.stepMs / 1000, 0.22);
    }

    const bassAccent = PUNCHY_STIM.bassAccents.find((bassNote) => bassNote.step === phraseStep % 16);
    if (bassAccent && (!bassAccent.pickup || phrase % 2 === 1)) {
      const kickWeight = kickAmount || 0.34;
      const bassAmount = bassAccent.amount * (0.76 + kickWeight * 0.28) * phraseLift;
      triggerDoubleBassNote(t + (bassAccent.pickup ? 0.04 : 0.012), bassAccent.degree, bassAmount, phraseStep % 16);
    }

    filter.frequency.setTargetAtTime(560 + accent * 520 + ((step * 137) % 180), t, 0.05);
    bell.frequency.setTargetAtTime(2200 + ((step * 389) % 3200), t, 0.018);
    step += 1;
  };

  const timer = window.setInterval(schedule, PUNCHY_STIM.stepMs);
  schedule();

  return {
    stream: destination.stream,
    resume: async () => {
      if (audioContext.state === "suspended") await audioContext.resume();
      master.gain.setTargetAtTime(0.7, audioContext.currentTime, 0.045);
    },
    mute: () => {
      master.gain.setTargetAtTime(0, audioContext.currentTime, 0.035);
    },
    stop: () => {
      window.clearInterval(timer);
      master.gain.setTargetAtTime(0, audioContext.currentTime, 0.035);
    },
  };
};

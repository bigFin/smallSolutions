import * as THREE from "three/webgpu";

export type ChromeLabSpectrogramOptions = {
  palette: {
    low: string;
    mid: string;
    high: string;
    peak: string;
  };
  width?: number;
  height?: number;
};

type AudioContextCtor = typeof AudioContext;

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: ((value >> 16) & 255) / 255,
    g: ((value >> 8) & 255) / 255,
    b: (value & 255) / 255,
  };
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const samplePalette = (palette: ChromeLabSpectrogramOptions["palette"], signal: number) => {
  const low = hexToRgb(palette.low);
  const mid = hexToRgb(palette.mid);
  const high = hexToRgb(palette.high);
  const peak = hexToRgb(palette.peak);
  const clamped = Math.max(0, Math.min(1, signal));

  if (clamped < 0.42) {
    const t = clamped / 0.42;
    return {
      r: mix(low.r, mid.r, t),
      g: mix(low.g, mid.g, t),
      b: mix(low.b, mid.b, t),
    };
  }

  if (clamped < 0.78) {
    const t = (clamped - 0.42) / 0.36;
    return {
      r: mix(mid.r, high.r, t),
      g: mix(mid.g, high.g, t),
      b: mix(mid.b, high.b, t),
    };
  }

  const t = (clamped - 0.78) / 0.22;
  return {
    r: mix(high.r, peak.r, t),
    g: mix(high.g, peak.g, t),
    b: mix(high.b, peak.b, t),
  };
};

export class ChromeLabSpectrogram {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera;

  private readonly frequencyBins: number;
  private readonly historyBins: number;
  private readonly history: Float32Array;
  private readonly displayHistory: Float32Array;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly geometry: THREE.BufferGeometry;
  private readonly palette: ChromeLabSpectrogramOptions["palette"];
  private readonly binData: Uint8Array<ArrayBuffer>;
  private readonly smoothBins: Float32Array;
  private readonly mesh: THREE.Mesh;
  private readonly wire: THREE.Mesh;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(options: ChromeLabSpectrogramOptions) {
    this.palette = options.palette;
    this.frequencyBins = options.height ?? 192;
    this.historyBins = options.width ?? 256;
    this.history = new Float32Array(this.frequencyBins * this.historyBins);
    this.displayHistory = new Float32Array(this.frequencyBins * this.historyBins);
    this.binData = new Uint8Array(1024) as Uint8Array<ArrayBuffer>;
    this.smoothBins = new Float32Array(1024);

    this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
    this.camera.position.set(0, 5.2, 10.5);
    this.camera.lookAt(0, 0.65, 0);

    const terrainWidth = 11.2;
    const terrainDepth = 9.2;
    this.positions = new Float32Array(this.frequencyBins * this.historyBins * 3);
    this.colors = new Float32Array(this.frequencyBins * this.historyBins * 3);
    const indices: number[] = [];

    for (let z = 0; z < this.historyBins; z++) {
      for (let x = 0; x < this.frequencyBins; x++) {
        const index = z * this.frequencyBins + x;
        this.positions[index * 3] = (x / (this.frequencyBins - 1) - 0.5) * terrainWidth;
        this.positions[index * 3 + 1] = 0;
        this.positions[index * 3 + 2] = (z / (this.historyBins - 1) - 0.5) * terrainDepth;

        const color = samplePalette(this.palette, 0);
        this.colors[index * 3] = color.r;
        this.colors[index * 3 + 1] = color.g;
        this.colors[index * 3 + 2] = color.b;
      }
    }

    for (let z = 0; z < this.historyBins - 1; z++) {
      for (let x = 0; x < this.frequencyBins - 1; x++) {
        const a = z * this.frequencyBins + x;
        const b = a + 1;
        const c = (z + 1) * this.frequencyBins + x + 1;
        const d = (z + 1) * this.frequencyBins + x;
        indices.push(a, b, c, a, c, d);
      }
    }

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 3));
    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
    });
    this.mesh = new THREE.Mesh(this.geometry, material);
    this.mesh.rotation.x = -0.08;
    this.scene.add(this.mesh);

    const wireMaterial = new THREE.MeshBasicMaterial({
      color: 0xe9ffe5,
      wireframe: true,
      transparent: true,
      opacity: 0.2,
    });
    this.wire = new THREE.Mesh(this.geometry, wireMaterial);
    this.wire.rotation.copy(this.mesh.rotation);
    this.scene.add(this.wire);
  }

  async setStream(stream: MediaStream) {
    if (!this.audioContext) {
      const AudioContextConstructor = (window.AudioContext || window.webkitAudioContext) as AudioContextCtor | undefined;
      if (!AudioContextConstructor) throw new Error("Web Audio is not available.");
      this.audioContext = new AudioContextConstructor();
    }

    if (this.audioContext.state === "suspended") {
      await this.audioContext.resume();
    }

    this.source?.disconnect();
    this.analyser = this.audioContext.createAnalyser();
    this.analyser.fftSize = 2048;
    this.analyser.smoothingTimeConstant = 0.82;
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  resize(width: number, height: number) {
    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update(time: number) {
    this.pushAudioFrame(time);
    const positionAttr = this.geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = this.geometry.getAttribute("color") as THREE.BufferAttribute;

    for (let z = 0; z < this.historyBins; z++) {
      const age = z / (this.historyBins - 1);
      const sourceZ = z;
      const depthFade = 0.18 + age * 0.82;

      for (let x = 0; x < this.frequencyBins; x++) {
        const index = z * this.frequencyBins + x;
        const sourceIndex = sourceZ * this.frequencyBins + x;
        const target = this.history[sourceIndex];
        const displayed = this.displayHistory[index] * 0.82 + target * 0.18;
        this.displayHistory[index] = displayed;

        const height = Math.pow(displayed, 0.72) * 3.35;
        positionAttr.setY(index, height);

        const color = samplePalette(this.palette, displayed);
        colorAttr.setXYZ(index, color.r * depthFade, color.g * depthFade, color.b * depthFade);
      }
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  private pushAudioFrame(time: number) {
    this.history.copyWithin(0, this.frequencyBins);

    const writeOffset = (this.historyBins - 1) * this.frequencyBins;
    if (!this.analyser) {
      for (let x = 0; x < this.frequencyBins; x++) {
        this.history[writeOffset + x] = 0;
      }
      return;
    }

    this.analyser.getByteFrequencyData(this.binData);

    for (let x = 0; x < this.frequencyBins; x++) {
      const freq = x / (this.frequencyBins - 1);
      const logFreq = Math.pow(freq, 2.15);
      const bin = logFreq * (this.binData.length - 1);
      const low = Math.floor(bin);
      const high = Math.min(this.binData.length - 1, low + 1);
      const amount = bin - low;
      const value = this.binData[low] * (1 - amount) + this.binData[high] * amount;
      const previous = this.smoothBins[low] * (1 - amount) + this.smoothBins[high] * amount;
      const smoothed = previous * 0.78 + value * 0.22;

      this.smoothBins[low] = this.smoothBins[low] * 0.74 + this.binData[low] * 0.26;
      this.smoothBins[high] = this.smoothBins[high] * 0.74 + this.binData[high] * 0.26;

      const floor = 5 + Math.sin(time * 0.0002 + freq * 5) * 2;
      const signal = Math.max(0, (smoothed - floor) / 132);
      this.history[writeOffset + x] = Math.min(1, Math.pow(signal, 0.74));
    }
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

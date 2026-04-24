import * as THREE from "three/webgpu";

export type ChromeLabSpectrogramOptions = {
  palette: {
    low: string;
    deep?: string;
    lowMid?: string;
    cool?: string;
    mid: string;
    upperMid?: string;
    high: string;
    warm?: string;
    hot?: string;
    ember?: string;
    peak: string;
  };
  variant?: "topDown" | "perspective";
  width?: number;
  height?: number;
  maxUpdateFps?: number;
  wireOpacity?: number;
};

type AudioContextCtor = typeof AudioContext;
type Rgb = { r: number; g: number; b: number };

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

const getPaletteStops = (palette: ChromeLabSpectrogramOptions["palette"]) => [
  { at: 0, color: hexToRgb(palette.low) },
  { at: 0.05, color: hexToRgb(palette.deep ?? palette.lowMid ?? palette.mid) },
  { at: 0.11, color: hexToRgb(palette.lowMid ?? palette.mid) },
  { at: 0.19, color: hexToRgb(palette.cool ?? palette.mid) },
  { at: 0.29, color: hexToRgb(palette.mid) },
  { at: 0.41, color: hexToRgb(palette.upperMid ?? palette.high) },
  { at: 0.54, color: hexToRgb(palette.high) },
  { at: 0.68, color: hexToRgb(palette.warm ?? palette.hot ?? palette.peak) },
  { at: 0.81, color: hexToRgb(palette.hot ?? palette.peak) },
  { at: 0.92, color: hexToRgb(palette.ember ?? palette.peak) },
  { at: 1, color: hexToRgb(palette.peak) },
];

const samplePaletteStops = (stops: Array<{ at: number; color: Rgb }>, signal: number): Rgb => {
  const clamped = Math.max(0, Math.min(1, Math.pow(signal, 0.52) * 1.18));

  for (let i = 1; i < stops.length; i++) {
    const previous = stops[i - 1];
    const next = stops[i];
    if (clamped > next.at) continue;

    const t = (clamped - previous.at) / (next.at - previous.at);
    return {
      r: mix(previous.color.r, next.color.r, t),
      g: mix(previous.color.g, next.color.g, t),
      b: mix(previous.color.b, next.color.b, t),
    };
  }

  return stops[stops.length - 1].color;
};

const buildPaletteLut = (palette: ChromeLabSpectrogramOptions["palette"]) => {
  const stops = getPaletteStops(palette);
  const lut = new Float32Array(256 * 3);
  for (let i = 0; i < 256; i++) {
    const color = samplePaletteStops(stops, i / 255);
    lut[i * 3] = color.r;
    lut[i * 3 + 1] = color.g;
    lut[i * 3 + 2] = color.b;
  }
  return lut;
};

export class ChromeLabSpectrogram {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

  private readonly frequencyBins: number;
  private readonly historyBins: number;
  private readonly history: Float32Array;
  private readonly displayHistory: Float32Array;
  private readonly positions: Float32Array;
  private readonly colors: Float32Array;
  private readonly geometry: THREE.BufferGeometry;
  private readonly paletteLut: Float32Array;
  private readonly variant: "topDown" | "perspective";
  private readonly minUpdateInterval: number;
  private readonly visibleThreshold: number;
  private readonly terrainWidth: number;
  private readonly terrainDepth: number;
  private readonly binData: Uint8Array<ArrayBuffer>;
  private readonly smoothBins: Float32Array;
  private readonly noiseFloor: Float32Array;
  private readonly mesh: THREE.Mesh;
  private readonly wire: THREE.Mesh | null = null;
  private lastUpdateTime = -Infinity;

  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(options: ChromeLabSpectrogramOptions) {
    this.paletteLut = buildPaletteLut(options.palette);
    this.variant = options.variant ?? "topDown";
    this.minUpdateInterval = options.maxUpdateFps ? 1000 / options.maxUpdateFps : 0;
    this.visibleThreshold = this.variant === "topDown" ? 0.004 : 0;
    this.frequencyBins = options.height ?? (this.variant === "topDown" ? 360 : 192);
    this.historyBins = options.width ?? (this.variant === "topDown" ? 420 : 256);
    this.history = new Float32Array(this.frequencyBins * this.historyBins);
    this.displayHistory = new Float32Array(this.frequencyBins * this.historyBins);
    this.binData = new Uint8Array(1024) as Uint8Array<ArrayBuffer>;
    this.smoothBins = new Float32Array(1024);
    this.noiseFloor = new Float32Array(1024);
    this.noiseFloor.fill(28);

    if (this.variant === "topDown") {
      const aspect = window.innerWidth / window.innerHeight;
      const viewHeight = 8.9;
      this.camera = new THREE.OrthographicCamera(
        -viewHeight * aspect * 0.5,
        viewHeight * aspect * 0.5,
        viewHeight * 0.5,
        -viewHeight * 0.5,
        0.1,
        50,
      );
      this.camera.position.set(0, 10, 2.2);
      this.camera.up.set(0, 0, 1);
      this.camera.lookAt(0, 0, 0);
    } else {
      this.camera = new THREE.PerspectiveCamera(46, window.innerWidth / window.innerHeight, 0.1, 120);
      this.camera.position.set(0, 5.2, 10.5);
      this.camera.lookAt(0, 0.65, 0);
    }

    this.terrainWidth = this.variant === "topDown" ? 12.6 : 11.2;
    this.terrainDepth = this.variant === "topDown" ? 7.2 : 9.2;
    this.positions = new Float32Array(this.frequencyBins * this.historyBins * 3);
    this.colors = new Float32Array(this.frequencyBins * this.historyBins * 4);
    const indices: number[] = [];

    for (let z = 0; z < this.historyBins; z++) {
      for (let x = 0; x < this.frequencyBins; x++) {
        const index = z * this.frequencyBins + x;
        this.positions[index * 3] =
          this.variant === "topDown"
            ? (z / (this.historyBins - 1) - 0.5) * this.terrainWidth
            : (x / (this.frequencyBins - 1) - 0.5) * this.terrainWidth;
        this.positions[index * 3 + 1] = 0;
        this.positions[index * 3 + 2] =
          this.variant === "topDown"
            ? (x / (this.frequencyBins - 1) - 0.5) * this.terrainDepth
            : (z / (this.historyBins - 1) - 0.5) * this.terrainDepth;

        this.colors[index * 4] = this.paletteLut[0];
        this.colors[index * 4 + 1] = this.paletteLut[1];
        this.colors[index * 4 + 2] = this.paletteLut[2];
        this.colors[index * 4 + 3] = 0;
      }
    }

    this.writeVisibleIndices(indices);

    this.geometry = new THREE.BufferGeometry();
    this.geometry.setAttribute("position", new THREE.BufferAttribute(this.positions, 3));
    this.geometry.setAttribute("color", new THREE.BufferAttribute(this.colors, 4));
    this.geometry.setIndex(indices);
    this.geometry.computeVertexNormals();

    const material = new THREE.MeshBasicMaterial({
      vertexColors: true,
      transparent: true,
      opacity: 0.7,
      side: THREE.DoubleSide,
      alphaTest: this.variant === "topDown" ? 0.02 : 0,
    });
    this.mesh = new THREE.Mesh(this.geometry, material);
    if (this.variant === "perspective") this.mesh.rotation.x = -0.08;
    this.scene.add(this.mesh);

    const wireOpacity = options.wireOpacity ?? (this.variant === "topDown" ? 0 : 0.2);
    if (wireOpacity > 0) {
      const wireMaterial = new THREE.MeshBasicMaterial({
        color: 0xe9ffe5,
        wireframe: true,
        transparent: true,
        opacity: wireOpacity,
      });
      this.wire = new THREE.Mesh(this.geometry, wireMaterial);
      this.wire.rotation.copy(this.mesh.rotation);
      this.scene.add(this.wire);
    }
    this.addAxes();
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
    this.analyser.minDecibels = -82;
    this.analyser.maxDecibels = -18;
    this.analyser.smoothingTimeConstant = 0.82;
    this.source = this.audioContext.createMediaStreamSource(stream);
    this.source.connect(this.analyser);
  }

  resize(width: number, height: number) {
    if (this.camera instanceof THREE.OrthographicCamera) {
      const aspect = width / height;
      const viewHeight = 8.9;
      this.camera.left = -viewHeight * aspect * 0.5;
      this.camera.right = viewHeight * aspect * 0.5;
      this.camera.top = viewHeight * 0.5;
      this.camera.bottom = -viewHeight * 0.5;
      this.camera.updateProjectionMatrix();
      return;
    }

    this.camera.aspect = width / height;
    this.camera.updateProjectionMatrix();
  }

  update(time: number) {
    if (this.minUpdateInterval > 0 && time - this.lastUpdateTime < this.minUpdateInterval) return;
    this.lastUpdateTime = time;

    this.pushAudioFrame(time);
    const positionAttr = this.geometry.getAttribute("position") as THREE.BufferAttribute;
    const colorAttr = this.geometry.getAttribute("color") as THREE.BufferAttribute;
    const positions = positionAttr.array as Float32Array;
    const colors = colorAttr.array as Float32Array;
    const heightScale = this.variant === "topDown" ? 1.85 : 3.35;
    const topDown = this.variant === "topDown";

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

        positions[index * 3 + 1] = Math.pow(displayed, 0.72) * heightScale;

        const colorOffset = index * 4;
        if (topDown && displayed < this.visibleThreshold) {
          colors[colorOffset] = 0;
          colors[colorOffset + 1] = 0;
          colors[colorOffset + 2] = 0;
          colors[colorOffset + 3] = 0;
        } else {
          const paletteIndex = Math.max(0, Math.min(255, (displayed * 255) | 0));
          const paletteOffset = paletteIndex * 3;
          colors[colorOffset] = this.paletteLut[paletteOffset] * depthFade;
          colors[colorOffset + 1] = this.paletteLut[paletteOffset + 1] * depthFade;
          colors[colorOffset + 2] = this.paletteLut[paletteOffset + 2] * depthFade;
          colors[colorOffset + 3] = topDown ? Math.min(1, displayed * 7) : 1;
        }
      }
    }

    positionAttr.needsUpdate = true;
    colorAttr.needsUpdate = true;
  }

  private writeVisibleIndices(indices: number[]) {
    for (let z = 0; z < this.historyBins - 1; z++) {
      for (let x = 0; x < this.frequencyBins - 1; x++) {
        const a = z * this.frequencyBins + x;
        const b = a + 1;
        const c = (z + 1) * this.frequencyBins + x + 1;
        const d = (z + 1) * this.frequencyBins + x;

        indices.push(a, b, c, a, c, d);
      }
    }
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

      const floorBin = low;
      const floorTarget = Math.max(10, value);
      const floorRate = floorTarget < this.noiseFloor[floorBin] ? 0.035 : 0.0025;
      this.noiseFloor[floorBin] = this.noiseFloor[floorBin] * (1 - floorRate) + floorTarget * floorRate;

      const lowFrequencyGate = Math.pow(1 - freq, 4.4);
      const subBassMute = freq < 0.018 ? 1 : 0;
      const adaptiveFloor = this.noiseFloor[floorBin] + 2 + lowFrequencyGate * 44;
      const gain = 94 + lowFrequencyGate * 100;
      const signal = subBassMute ? 0 : Math.max(0, (smoothed - adaptiveFloor) / gain);
      this.history[writeOffset + x] = Math.min(1, Math.pow(signal, 0.68));
    }
  }

  private addAxes() {
    const tickColor = 0xcfe7ce;
    const tickOpacity = this.variant === "topDown" ? 0.32 : 0.24;
    const y = this.variant === "topDown" ? 0.035 : 0.045;
    const xMin = -this.terrainWidth * 0.5;
    const xMax = this.terrainWidth * 0.5;
    const zMin = -this.terrainDepth * 0.5;
    const zMax = this.terrainDepth * 0.5;
    const positions: number[] = [];

    const addLine = (x1: number, z1: number, x2: number, z2: number) => {
      positions.push(x1, y, z1, x2, y, z2);
    };

    if (this.variant === "topDown") return;

    for (let i = 0; i <= 8; i++) {
      const z = zMin + (i / 8) * this.terrainDepth;
      const major = i % 2 === 0;
      addLine(xMin, z, xMin + (major ? 0.16 : 0.08), z);
      if (major) this.scene.add(this.createLabel(i === 8 ? "now" : `-${8 - i}`, xMin - 0.28, y + 0.01, z, 0.2));
    }

    const freqLabels = [
      { label: "100", ratio: 0.18 },
      { label: "500", ratio: 0.38 },
      { label: "1k", ratio: 0.52 },
      { label: "4k", ratio: 0.72 },
      { label: "8k", ratio: 0.86 },
    ];
    for (const item of freqLabels) {
      const x = xMin + item.ratio * this.terrainWidth;
      addLine(x, zMax, x, zMax - 0.13);
      this.scene.add(this.createLabel(item.label, x, y + 0.01, zMax + 0.18, 0.18));
    }

    this.scene.add(this.createLineSegments(positions, tickColor, tickOpacity));
  }

  private createLineSegments(positions: number[], color: number, opacity: number) {
    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color,
      transparent: true,
      opacity,
    });
    return new THREE.LineSegments(geometry, material);
  }

  private createLabel(text: string, x: number, y: number, z: number, scale: number) {
    const canvas = document.createElement("canvas");
    canvas.width = 128;
    canvas.height = 48;
    const ctx = canvas.getContext("2d");
    if (ctx) {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      ctx.font = '500 12px "Iosevka Aile", "Iosevka", monospace';
      ctx.fillStyle = "rgba(211, 198, 170, 0.82)";
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      ctx.fillText(text, canvas.width / 2, canvas.height / 2);
    }

    const texture = new THREE.CanvasTexture(canvas);
    const material = new THREE.SpriteMaterial({
      map: texture,
      transparent: true,
      opacity: 0.72,
      depthWrite: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.position.set(x, y, z);
    sprite.scale.set(scale * 2.2, scale * 0.82, 1);
    return sprite;
  }
}

declare global {
  interface Window {
    webkitAudioContext?: typeof AudioContext;
  }
}

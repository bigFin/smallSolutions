import * as THREE from "three/webgpu";
import { Fn, float, positionLocal, texture, uniform, uv, vec2, vec3 } from "three/tsl";
import type { ChromeLabSpectrogramOptions } from "./chrome-lab-spectrogram";

type AudioContextCtor = typeof AudioContext;

const hexToRgb = (hex: string) => {
  const normalized = hex.replace("#", "");
  const value = Number.parseInt(normalized, 16);
  return {
    r: (value >> 16) & 255,
    g: (value >> 8) & 255,
    b: value & 255,
  };
};

const mix = (a: number, b: number, t: number) => a + (b - a) * t;

const buildPaletteTexture = (palette: ChromeLabSpectrogramOptions["palette"]) => {
  const stops = [
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
  const data = new Uint8Array(256 * 4);

  for (let i = 0; i < 256; i++) {
    const signal = i / 255;
    const clamped = Math.max(0, Math.min(1, Math.pow(signal, 0.52) * 1.18));
    let color = stops[stops.length - 1].color;

    for (let j = 1; j < stops.length; j++) {
      const previous = stops[j - 1];
      const next = stops[j];
      if (clamped > next.at) continue;

      const t = (clamped - previous.at) / (next.at - previous.at);
      color = {
        r: mix(previous.color.r, next.color.r, t),
        g: mix(previous.color.g, next.color.g, t),
        b: mix(previous.color.b, next.color.b, t),
      };
      break;
    }

    data[i * 4] = color.r;
    data[i * 4 + 1] = color.g;
    data[i * 4 + 2] = color.b;
    data[i * 4 + 3] = 255;
  }

  const texture = new THREE.DataTexture(data, 256, 1, THREE.RGBAFormat, THREE.UnsignedByteType);
  texture.minFilter = THREE.LinearFilter;
  texture.magFilter = THREE.LinearFilter;
  texture.generateMipmaps = false;
  texture.needsUpdate = true;
  return texture;
};

export class GpuSpectrogram {
  readonly scene = new THREE.Scene();
  readonly camera: THREE.PerspectiveCamera | THREE.OrthographicCamera;

  private readonly frequencyBins: number;
  private readonly historyBins: number;
  private readonly binData: Uint8Array<ArrayBuffer>;
  private readonly smoothBins: Float32Array;
  private readonly noiseFloor: Float32Array;
  private readonly historyData: Uint8Array;
  private readonly historyTexture: THREE.DataTexture;
  private readonly writeUUniform = uniform(float(0));
  private readonly variant: "topDown" | "perspective";
  private readonly terrainWidth: number;
  private readonly terrainDepth: number;

  private writeColumn = 0;
  private audioContext: AudioContext | null = null;
  private analyser: AnalyserNode | null = null;
  private source: MediaStreamAudioSourceNode | null = null;

  constructor(options: ChromeLabSpectrogramOptions) {
    this.variant = options.variant ?? "topDown";
    this.frequencyBins = options.height ?? (this.variant === "topDown" ? 360 : 192);
    this.historyBins = options.width ?? (this.variant === "topDown" ? 420 : 256);
    this.binData = new Uint8Array(1024) as Uint8Array<ArrayBuffer>;
    this.smoothBins = new Float32Array(1024);
    this.noiseFloor = new Float32Array(1024);
    this.noiseFloor.fill(28);

    this.terrainWidth = this.variant === "topDown" ? 12.6 : 11.2;
    this.terrainDepth = this.variant === "topDown" ? 7.2 : 9.2;

    this.historyData = new Uint8Array(this.frequencyBins * this.historyBins);
    this.historyTexture = new THREE.DataTexture(
      this.historyData,
      this.historyBins,
      this.frequencyBins,
      THREE.RedFormat,
      THREE.UnsignedByteType,
    );
    this.historyTexture.minFilter = THREE.LinearFilter;
    this.historyTexture.magFilter = THREE.LinearFilter;
    this.historyTexture.generateMipmaps = false;
    this.historyTexture.needsUpdate = true;

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

    const geometry = this.createGeometry();
    const paletteTexture = buildPaletteTexture(options.palette);
    const historyTextureNode = texture(this.historyTexture);
    const paletteTextureNode = texture(paletteTexture);
    const historySpan = float((this.historyBins - 1) / this.historyBins);
    const topDown = this.variant === "topDown";
    const heightScale = float(topDown ? 1.85 : 3.35);

    const sampleUv = Fn(() => {
      const meshUv = uv();
      const age = float(1).sub(meshUv.x);
      const sampleU = this.writeUUniform.sub(age.mul(historySpan)).add(float(2)).fract();
      return vec2(sampleU, meshUv.y);
    });

    const amplitude = Fn(() => texture(this.historyTexture, sampleUv()).r);
    const displacedPosition = Fn(() => {
      const amp = amplitude();
      return positionLocal.add(vec3(0, amp.pow(0.72).mul(heightScale), 0));
    });

    const colorNode = Fn(() => {
      const amp = amplitude();
      const meshUv = uv();
      const depthFade = float(0.18).add(meshUv.x.mul(0.82));
      const color = texture(paletteTexture, vec2(amp, 0.5)).rgb.mul(depthFade);
      return color;
    });

    const material = new THREE.MeshBasicNodeMaterial({
      transparent: true,
      side: THREE.DoubleSide,
      opacity: topDown ? 0.95 : 0.72,
    });
    material.positionNode = displacedPosition();
    material.colorNode = colorNode();
    material.opacityNode = topDown ? amplitude().mul(7).clamp(0, 1) : float(1);
    material.alphaTest = topDown ? 0.02 : 0;

    const mesh = new THREE.Mesh(geometry, material);
    if (this.variant === "perspective") mesh.rotation.x = -0.08;
    this.scene.add(mesh);

    if (this.variant === "perspective") {
      const wireMaterial = new THREE.MeshBasicNodeMaterial({
        wireframe: true,
        transparent: true,
        opacity: 0.18,
      });
      wireMaterial.positionNode = displacedPosition();
      wireMaterial.colorNode = vec3(0.82, 0.93, 0.82);
      const wire = new THREE.Mesh(geometry, wireMaterial);
      wire.rotation.copy(mesh.rotation);
      this.scene.add(wire);
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

  update(_time: number) {
    this.pushAudioFrame();
  }

  private createGeometry() {
    const positions = new Float32Array(this.frequencyBins * this.historyBins * 3);
    const uvs = new Float32Array(this.frequencyBins * this.historyBins * 2);
    const indices: number[] = [];

    for (let z = 0; z < this.historyBins; z++) {
      for (let x = 0; x < this.frequencyBins; x++) {
        const index = z * this.frequencyBins + x;
        const timeRatio = z / (this.historyBins - 1);
        const freqRatio = x / (this.frequencyBins - 1);

        positions[index * 3] =
          this.variant === "topDown"
            ? (timeRatio - 0.5) * this.terrainWidth
            : (freqRatio - 0.5) * this.terrainWidth;
        positions[index * 3 + 1] = 0;
        positions[index * 3 + 2] =
          this.variant === "topDown"
            ? (freqRatio - 0.5) * this.terrainDepth
            : (timeRatio - 0.5) * this.terrainDepth;

        uvs[index * 2] = timeRatio;
        uvs[index * 2 + 1] = freqRatio;
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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
    geometry.setAttribute("uv", new THREE.BufferAttribute(uvs, 2));
    geometry.setIndex(indices);
    return geometry;
  }

  private pushAudioFrame() {
    this.writeColumn = (this.writeColumn + 1) % this.historyBins;
    this.writeUUniform.value = (this.writeColumn + 0.5) / this.historyBins;

    if (!this.analyser) {
      for (let x = 0; x < this.frequencyBins; x++) {
        this.historyData[x * this.historyBins + this.writeColumn] = 0;
      }
      this.historyTexture.needsUpdate = true;
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

      const floorTarget = Math.max(10, value);
      const floorRate = floorTarget < this.noiseFloor[low] ? 0.035 : 0.0025;
      this.noiseFloor[low] = this.noiseFloor[low] * (1 - floorRate) + floorTarget * floorRate;

      const lowFrequencyGate = Math.pow(1 - freq, 4.4);
      const subBassMute = freq < 0.018 ? 1 : 0;
      const adaptiveFloor = this.noiseFloor[low] + 2 + lowFrequencyGate * 44;
      const gain = 94 + lowFrequencyGate * 100;
      const signal = subBassMute ? 0 : Math.max(0, (smoothed - adaptiveFloor) / gain);
      this.historyData[x * this.historyBins + this.writeColumn] = Math.min(255, Math.round(Math.pow(Math.min(1, signal), 0.68) * 255));
    }

    this.historyTexture.needsUpdate = true;
  }

  private addAxes() {
    if (this.variant === "topDown") return;

    const tickColor = 0xcfe7ce;
    const tickOpacity = 0.24;
    const y = 0.045;
    const xMin = -this.terrainWidth * 0.5;
    const zMin = -this.terrainDepth * 0.5;
    const zMax = this.terrainDepth * 0.5;
    const positions: number[] = [];

    const addLine = (x1: number, z1: number, x2: number, z2: number) => {
      positions.push(x1, y, z1, x2, y, z2);
    };

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

    const geometry = new THREE.BufferGeometry();
    geometry.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    const material = new THREE.LineBasicMaterial({
      color: tickColor,
      transparent: true,
      opacity: tickOpacity,
    });
    this.scene.add(new THREE.LineSegments(geometry, material));
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

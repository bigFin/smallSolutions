import { float, floor, select, sin, smoothstep, uv } from "three/tsl";

type Node = any;

export function syntheticSpectrogramShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const t = noiseTime.mul(0.42);
  const frequency = uvNode.y.pow(1.75).toVar();
  const time = uvNode.x.add(t).toVar();
  const lane = floor(frequency.mul(34.0)).toVar();
  const lanePhase = lane.mul(0.23).toVar();
  const harmonicA = sin(time.mul(18.0).add(lanePhase)).mul(0.5).add(0.5).toVar();
  const harmonicB = sin(time.mul(37.0).sub(frequency.mul(19.0))).mul(0.5).add(0.5).toVar();
  const harmonicC = sin(time.mul(9.0).add(frequency.mul(46.0))).mul(0.5).add(0.5).toVar();
  const envelope = harmonicA.mul(0.52).add(harmonicB.mul(0.3)).add(harmonicC.mul(0.18)).toVar();
  const fundamental = sin(time.mul(5.0).add(mousePos.x.mul(4.0))).mul(0.18).add(0.24).toVar();
  const overtone2 = fundamental.mul(1.9).add(0.09).toVar();
  const overtone3 = fundamental.mul(2.85).add(0.02).toVar();
  const overtone4 = fundamental.mul(3.7).sub(0.03).toVar();
  const bandWidth = float(0.028).add(float(0.018).mul(float(1.0).sub(frequency))).toVar();
  const peak1 = float(1.0)
    .sub(frequency.sub(fundamental).mul(frequency.sub(fundamental)).div(bandWidth.mul(bandWidth)))
    .clamp(0, 1)
    .pow(2.0)
    .toVar();
  const peak2 = float(1.0)
    .sub(frequency.sub(overtone2).mul(frequency.sub(overtone2)).div(bandWidth.mul(bandWidth).mul(1.6)))
    .clamp(0, 1)
    .pow(2.0)
    .mul(0.72)
    .toVar();
  const peak3 = float(1.0)
    .sub(frequency.sub(overtone3).mul(frequency.sub(overtone3)).div(bandWidth.mul(bandWidth).mul(2.1)))
    .clamp(0, 1)
    .pow(2.0)
    .mul(0.5)
    .toVar();
  const peak4 = float(1.0)
    .sub(frequency.sub(overtone4).mul(frequency.sub(overtone4)).div(bandWidth.mul(bandWidth).mul(2.8)))
    .clamp(0, 1)
    .pow(2.0)
    .mul(0.34)
    .toVar();
  const harmonicStack = peak1.add(peak2).add(peak3).add(peak4).clamp(0, 1).toVar();
  const scanline = smoothstep(0.45, 0.92, sin(frequency.mul(220.0)).mul(0.5).add(0.5)).mul(0.24).toVar();
  const historyRidges = smoothstep(0.68, 0.98, sin(time.mul(68.0).sub(frequency.mul(18.0))).mul(0.5).add(0.5)).mul(0.34).toVar();
  const cursorBand = float(1.0)
    .sub(frequency.sub(mousePos.y).mul(frequency.sub(mousePos.y)).div(0.012))
    .clamp(0, 1)
    .pow(2.0)
    .mul(float(1.0).sub(smoothstep(0.0, 0.42, uvNode.x.sub(mousePos.x).abs())))
    .toVar();
  const sonogram = envelope
    .mul(0.28)
    .add(historyRidges)
    .add(scanline)
    .add(harmonicStack.mul(0.95))
    .add(cursorBand.mul(0.65))
    .clamp(0, 1)
    .toVar();
  const horizonFade = smoothstep(0.02, 0.16, uvNode.y).mul(float(1.0).sub(smoothstep(0.96, 1.0, uvNode.y))).toVar();

  return select(sonogram.greaterThan(0.78), sonogram, sonogram.mul(0.62)).mul(horizonFade).clamp(0, 1);
}

import * as THREE from "three/webgpu";
import {
  float,
  sin,
  cos,
  uv,
  smoothstep,
  vec2,
} from "three/tsl";
import { stochasticShader } from "./stochastic";

export { stochasticShader };

type Node = any; // Simplification for TSL functions

export function smokeShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const smokeP = uvNode.mul(4.0);
  const distToMouse = uvNode.sub(mousePos).length();
  const mouseAmplitude = float(1.0).sub(smoothstep(0.0, 0.45, distToMouse)).mul(2.2).add(1.0);
  const st = noiseTime.mul(0.25);
  const sn1 = sin(smokeP.x.add(st)).mul(cos(smokeP.y.sub(st.mul(0.6))));
  const sn2 = sin(smokeP.x.mul(2.1).add(sn1.mul(0.8)).sub(st.mul(1.2))).mul(cos(smokeP.y.mul(2.1).add(sn1.mul(0.8)).add(st.mul(0.8))));
  return sn1.mul(0.5).add(sn2.mul(0.25)).mul(mouseAmplitude).mul(0.5).add(0.5);
}

export function warpShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const wt = noiseTime.mul(0.3);
  const wp = uvNode.mul(3.5);
  const wq = vec2(sin(wp.x.add(wt).add(mousePos.x.mul(2.0))), cos(wp.y.add(wt).add(mousePos.y.mul(2.0)))).mul(0.5);
  const wr = vec2(sin(wp.x.add(wq.x).mul(1.2).add(wt.mul(0.8))), cos(wp.y.add(wq.y).mul(1.4).add(wt.mul(0.3)))).mul(0.8);
  return sin(wp.x.add(wr.x)).mul(cos(wp.y.add(wr.y))).mul(0.5).add(0.5);
}

export function gridShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  const mouseAmplitude = float(1.0).sub(smoothstep(0.0, 0.45, distToMouse)).mul(2.2).add(1.0);
  const gp = uvNode.mul(18.0);
  const gridVal = sin(gp.x.add(noiseTime)).mul(cos(gp.y.sub(noiseTime)));
  return gridVal.mul(mouseAmplitude.mul(0.4)).add(0.5).clamp(0, 1);
}

export function topoShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  const tp = uvNode.mul(3.0);
  const tt = noiseTime.mul(0.1);
  const h1 = sin(tp.x.add(tt)).mul(cos(tp.y.sub(tt)));
  const h2 = sin(tp.x.mul(2.1).sub(tt)).mul(cos(tp.y.mul(1.8).add(tt))).mul(0.5);
  const baseH = h1.add(h2).mul(0.5).add(0.5);
  const mPeak = float(1.0).sub(distToMouse.mul(2.0)).clamp(0, 1).pow(2.0).mul(0.8);
  const totalH = baseH.add(mPeak).clamp(0, 1);
  const contours = sin(totalH.mul(30.0));
  return totalH.mul(0.7).add(contours.mul(0.3)).clamp(0, 1).pow(1.2);
}

export function topoLinesShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  const tp = uvNode.mul(2.5);
  const tt = noiseTime.mul(0.05);

  const n = sin(tp.x.add(tt)).mul(cos(tp.y.sub(tt)))
    .add(sin(tp.x.mul(2.0).sub(tt)).mul(cos(tp.y.mul(1.5).add(tt))).mul(0.5))
    .add(sin(tp.x.mul(4.0).add(tt)).mul(cos(tp.y.mul(3.0).sub(tt))).mul(0.25));

  const mousePeak = float(1.0).sub(distToMouse.mul(2.0)).clamp(0, 1).pow(3.0).mul(1.5);
  const h = n.add(mousePeak).add(0.5).mul(0.5);
  
  // Sharp contour lines
  const contour = sin(h.mul(40.0));
  const lines = smoothstep(0.8, 0.95, contour);
  
  return lines.mul(h.add(0.2)).clamp(0, 1);
}

export function topoLines2Shader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  
  const t = noiseTime.mul(0.08);
  const p = uvNode.mul(2.2);

  // Cleaner, smoother heightmap layers
  const n1 = sin(p.x.add(t)).mul(cos(p.y.sub(t.mul(0.8))));
  const n2 = sin(p.x.mul(1.8).sub(t.mul(1.2))).mul(cos(p.y.mul(1.5).add(t.mul(0.5)))).mul(0.4);
  
  const mousePeak = float(1.0).sub(distToMouse.mul(1.6)).clamp(0, 1).pow(3.0).mul(1.4);
  const h = n1.add(n2).add(mousePeak).add(0.5).mul(0.5);
  
  // Sin-based contours: mathematically impossible to intersect
  const frequency = float(60.0);
  const contour = sin(h.mul(frequency));
  
  // Higher contrast lines
  const lines = smoothstep(0.85, 0.98, contour);
  
  return lines.mul(h.add(0.5)).clamp(0, 1).pow(0.8);
}

export function vibeShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  
  const t = noiseTime.mul(0.2);
  const p = uvNode.mul(3.0);

  // Layered noise for smoke
  const n1 = sin(p.x.add(t)).mul(cos(p.y.sub(t.mul(0.7))));
  const n2 = sin(p.x.mul(2.2).sub(t.mul(1.1))).mul(cos(p.y.mul(1.9).add(t.mul(0.6)))).mul(0.5);
  const smoke = n1.add(n2).mul(0.5).add(0.5);

  // Cursor 'excitation'
  const mouseInfluence = float(1.0).sub(smoothstep(0.0, 0.4, distToMouse)).mul(2.5);
  
  // High contrast thresholds
  const highRes = smoke.add(mouseInfluence).clamp(0, 1);
  
  // Create 'chunky' steps by posterizing the signal
  const chunky = highRes.mul(10.0).floor().div(10.0);
  
  return chunky.mul(highRes.pow(0.5)).clamp(0, 1);
}

export function nexusShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  
  const t = noiseTime.mul(0.15);
  const p = uvNode.mul(5.0);

  // Cross-hatch / circuit board base
  const sx = sin(p.x.add(t).mul(4.0));
  const sy = sin(p.y.sub(t.mul(0.8)).mul(4.0));
  const circuit = sx.mul(sy);
  
  // Cellular displacement
  const q = vec2(
    sin(p.y.add(t).mul(2.0)),
    cos(p.x.add(t).mul(2.0))
  ).mul(0.5);

  const cx = sin(p.x.add(q.x).mul(5.0));
  const cy = sin(p.y.add(q.y).mul(5.0));
  const cell = cx.add(cy).mul(0.5);

  // Mouse distortion wave (ripple effect)
  const mouseWarp = float(1.0).sub(smoothstep(0.0, 0.5, distToMouse)).pow(2.0).mul(2.5);
  const wave = sin(distToMouse.mul(20.0).sub(noiseTime.mul(5.0))).mul(mouseWarp);
  
  const combined = circuit.add(cell).add(wave).mul(0.3).add(0.5);
  
  // High contrast posterization for a chunky data/tech feel
  const steps = float(8.0);
  const posterized = combined.mul(steps).floor().div(steps);
  
  return posterized.clamp(0, 1);
}

import { cos, float, sin, smoothstep, uv } from "three/tsl";

type Node = any;

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
  const contour = sin(h.mul(40.0));
  const lines = smoothstep(0.8, 0.95, contour);

  return lines.mul(h.add(0.2)).clamp(0, 1);
}

export function topoLines2Shader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  const t = noiseTime.mul(0.08);
  const p = uvNode.mul(2.2);
  const n1 = sin(p.x.add(t)).mul(cos(p.y.sub(t.mul(0.8))));
  const n2 = sin(p.x.mul(1.8).sub(t.mul(1.2))).mul(cos(p.y.mul(1.5).add(t.mul(0.5)))).mul(0.4);
  const mousePeak = float(1.0).sub(distToMouse.mul(1.6)).clamp(0, 1).pow(3.0).mul(1.4);
  const h = n1.add(n2).add(mousePeak).add(0.5).mul(0.5);
  const contour = sin(h.mul(float(60.0)));
  const lines = smoothstep(0.85, 0.98, contour);

  return lines.mul(h.add(0.5)).clamp(0, 1).pow(0.8);
}

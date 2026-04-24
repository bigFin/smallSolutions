import { cos, float, sin, smoothstep, uv, vec2 } from "three/tsl";

type Node = any;

export function vibeShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  const t = noiseTime.mul(0.2);
  const p = uvNode.mul(3.0);
  const n1 = sin(p.x.add(t)).mul(cos(p.y.sub(t.mul(0.7))));
  const n2 = sin(p.x.mul(2.2).sub(t.mul(1.1))).mul(cos(p.y.mul(1.9).add(t.mul(0.6)))).mul(0.5);
  const smoke = n1.add(n2).mul(0.5).add(0.5);
  const mouseInfluence = float(1.0).sub(smoothstep(0.0, 0.4, distToMouse)).mul(2.5);
  const highRes = smoke.add(mouseInfluence).clamp(0, 1);
  const chunky = highRes.mul(10.0).floor().div(10.0);

  return chunky.mul(highRes.pow(0.5)).clamp(0, 1);
}

export function nexusShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const distToMouse = uvNode.sub(mousePos).length();
  const t = noiseTime.mul(0.15);
  const p = uvNode.mul(5.0);
  const sx = sin(p.x.add(t).mul(4.0));
  const sy = sin(p.y.sub(t.mul(0.8)).mul(4.0));
  const circuit = sx.mul(sy);
  const q = vec2(
    sin(p.y.add(t).mul(2.0)),
    cos(p.x.add(t).mul(2.0)),
  ).mul(0.5);
  const cx = sin(p.x.add(q.x).mul(5.0));
  const cy = sin(p.y.add(q.y).mul(5.0));
  const cell = cx.add(cy).mul(0.5);
  const mouseWarp = float(1.0).sub(smoothstep(0.0, 0.5, distToMouse)).pow(2.0).mul(2.5);
  const wave = sin(distToMouse.mul(20.0).sub(noiseTime.mul(5.0))).mul(mouseWarp);
  const combined = circuit.add(cell).add(wave).mul(0.3).add(0.5);
  const posterized = combined.mul(float(8.0)).floor().div(float(8.0));

  return posterized.clamp(0, 1);
}

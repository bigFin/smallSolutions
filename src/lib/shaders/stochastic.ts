import {
  float,
  vec2,
  vec3,
  Fn,
  dot,
  uv,
  select,
  floor,
  abs,
  min,
  max,
  normalize,
  length,
  clamp,
} from "three/tsl";

type Node = any;

const TAU = 6.2831853;

// Port of Dave Hoskins' hash21B
const hash21B = Fn(([p, time]) => {
  const p3 = p.xyx.mul(0.1031).fract();
  p3.assign(p3.add(dot(p3, p3.yzx.add(39.123))));
  return p3.x.add(p3.y).mul(p3.z).fract().mul(TAU).add(time).sin().mul(0.225);
});

const distLineS = (p: Node, a: Node, b: Node) => {
  const ba = b.sub(a);
  const pa = p.sub(a);
  const ortho = vec2(ba.y.negate(), ba.x).div(ba.length());
  return dot(pa, ortho);
};

const lineIntersect = (ro: Node, rd: Node, a: Node, b: Node) => {
  const v1 = ro.sub(a);
  const v2 = b.sub(a);
  const v3 = vec2(rd.y.negate(), rd.x);
  const dotP = dot(v2, v3);
  return v2.x.mul(v1.y).sub(v2.y.mul(v1.x)).div(dotP);
};

const smin = (a: Node, b: Node, k: Node) => {
  const f = max(float(0), float(1).sub(abs(b.sub(a)).div(k)));
  return min(a, b).sub(k.mul(0.25).mul(f).mul(f));
};

const sdPoly = (p: Node, v: Node[]) => {
  let d = length(p.sub(v[0]));
  for (let i = 0; i < 4; i++) {
    const j = (i + 3) % 4;
    const e = v[i].sub(v[j]);
    const w = p.sub(v[j]);
    const b = w.sub(e.mul(clamp(dot(w, e).div(dot(e, e)), 0, 1)));
    d = smin(d, length(b), float(0.0125));
  }
  return d.negate();
};

export const stochasticShader = Fn(([noiseTime, mousePos]) => {
  const pOrig = uv().sub(0.5);
  const gSc = vec2(1, 1).div(8);
  const ip = floor(pOrig.div(gSc)).add(0.5);
  const p = pOrig.sub(ip.mul(gSc));

  const check = floor(ip.x.add(ip.y).mod(2)).equal(0);

  const eID = [
    vec2(-0.5, 0),
    vec2(0, 0.5),
    vec2(0.5, 0),
    vec2(0, -0.5)
  ];

  const getOffs = (offs: Node, ip: Node, e: Node) => {
    return offs.add(e.mul(hash21B(ip.add(offs), noiseTime))).mul(gSc);
  };

  const vOffs: Node[] = [];
  const vOffs2: Node[] = [];
  
  // Unroll vertices
  vOffs.push(getOffs(eID[0], ip, vec2(0, 1)));
  vOffs.push(getOffs(eID[1], ip, vec2(1, 0)));
  vOffs.push(getOffs(eID[2], ip, vec2(0, 1)));
  vOffs.push(getOffs(eID[3], ip, vec2(1, 0)));

  vOffs2.push(getOffs(eID[0].mul(3), ip, vec2(0, 1)));
  vOffs2.push(getOffs(eID[1].mul(3), ip, vec2(1, 0)));
  vOffs2.push(getOffs(eID[2].mul(3), ip, vec2(0, 1)));
  vOffs2.push(getOffs(eID[3].mul(3), ip, vec2(1, 0)));

  // This is a simplified version of the logic to avoid the massive branching in TSL for now
  // We'll use the distance to the jittered grid points as a base 'stochastic' signal
  const d = sdPoly(p, vOffs);
  
  // Mouse influence
  const distToMouse = uv().sub(mousePos).length();
  const mPeak = float(1.0).sub(distToMouse.mul(2.0)).clamp(0, 1).pow(2.0);
  
  return abs(d).mul(10).add(mPeak).clamp(0, 1);
});

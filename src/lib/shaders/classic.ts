import { cos, float, sin, smoothstep, uv, vec2 } from "three/tsl";

type Node = any;

export function smokeShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const smokeP = uvNode.mul(4.0);
  const distToMouse = uvNode.sub(mousePos).length();
  const mouseAmplitude = float(1.0).sub(smoothstep(0.0, 0.45, distToMouse)).mul(2.2).add(1.0);
  const st = noiseTime.mul(0.25);
  const sn1 = sin(smokeP.x.add(st)).mul(cos(smokeP.y.sub(st.mul(0.6))));
  const sn2 = sin(smokeP.x.mul(2.1).add(sn1.mul(0.8)).sub(st.mul(1.2))).mul(
    cos(smokeP.y.mul(2.1).add(sn1.mul(0.8)).add(st.mul(0.8))),
  );

  return sn1.mul(0.5).add(sn2.mul(0.25)).mul(mouseAmplitude).mul(0.5).add(0.5);
}

export function warpShader(noiseTime: Node, mousePos: Node): Node {
  const uvNode = uv();
  const wt = noiseTime.mul(0.3);
  const wp = uvNode.mul(3.5);
  const wq = vec2(
    sin(wp.x.add(wt).add(mousePos.x.mul(2.0))),
    cos(wp.y.add(wt).add(mousePos.y.mul(2.0))),
  ).mul(0.5);
  const wr = vec2(
    sin(wp.x.add(wq.x).mul(1.2).add(wt.mul(0.8))),
    cos(wp.y.add(wq.y).mul(1.4).add(wt.mul(0.3))),
  ).mul(0.8);

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

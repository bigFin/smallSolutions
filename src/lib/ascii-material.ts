import * as THREE from "three/webgpu";
import { MeshBasicNodeMaterial } from "three/webgpu";
import {
  Fn,
  clamp,
  cos,
  exp,
  float,
  floor,
  max,
  select,
  sin,
  smoothstep,
  texture,
  uv,
  vec2,
  vec3,
} from "three/tsl";

export type AsciiMaterialOptions = {
  atlasTexture: THREE.Texture;
  glyphTexture: THREE.Texture;
  colorTexture: THREE.Texture;
  sourceTexture: THREE.Texture;
  gradientTexture: THREE.DataTexture;
  gradientRowCount: number;
  useRampDither: boolean;
  useGradientSignal: boolean;
  invertGradient: boolean;
  glyphRampIndices: number[];
  viewportSizeUniform: any;
  gridSizeUniform: any;
  gridOriginUniform: any;
  gridDisplaySizeUniform: any;
  displayCellSizeUniform: any;
  atlasSizeUniform: any;
  tileSizeUniform: any;
  atlasColsUniform: any;
  gradientIndexUniform: any;
  debugTimeUniform: any;
  emailDyeDebugEnabledUniform: any;
  emailDyeDebugModeUniform: any;
  emailDyeDebugCenterUniform: any;
  emailDyeDebugHalfSizeUniform: any;
  emailDyeColorLowUniform: any;
  emailDyeColorMidUniform: any;
  emailDyeColorHighUniform: any;
  emailDyeColorPeakUniform: any;
};

export function buildAsciiMaterial(opts: AsciiMaterialOptions): MeshBasicNodeMaterial {
  const {
    atlasTexture,
    glyphTexture,
    colorTexture,
    sourceTexture,
    gradientTexture,
    gradientRowCount: gradientRowCountValue,
    useRampDither,
    useGradientSignal,
    invertGradient,
    glyphRampIndices,
    viewportSizeUniform,
    gridSizeUniform,
    gridOriginUniform,
    gridDisplaySizeUniform,
    displayCellSizeUniform,
    atlasSizeUniform,
    tileSizeUniform,
    atlasColsUniform,
    gradientIndexUniform,
    debugTimeUniform,
    emailDyeDebugEnabledUniform: debugEnabled,
    emailDyeDebugModeUniform: debugMode,
    emailDyeDebugCenterUniform: debugCenter,
    emailDyeDebugHalfSizeUniform: debugHalfSize,
    emailDyeColorLowUniform: debugLow,
    emailDyeColorMidUniform: debugMid,
    emailDyeColorHighUniform: debugHigh,
    emailDyeColorPeakUniform: debugPeak,
  } = opts;

  const background = vec3(0, 0, 0);
  const gradientRowCount = float(Math.max(1, gradientRowCountValue));
  const [ramp0, ramp1, ramp2, ramp3, ramp4, ramp5] = glyphRampIndices;

  const sampleGlyphMask = (glyphIndex: any, localUv: any) => {
    const glyphColumn = glyphIndex.mod(atlasColsUniform);
    const glyphRow = floor(glyphIndex.div(atlasColsUniform));
    const atlasUv = vec2(glyphColumn, glyphRow)
      .mul(tileSizeUniform)
      .add(localUv.mul(tileSizeUniform))
      .div(atlasSizeUniform);

    return texture(atlasTexture, atlasUv).a;
  };

  const getBayer4Threshold = (cellCoord: any) => {
    const x = cellCoord.x.mod(float(4));
    const y = cellCoord.y.mod(float(4));

    const row0 = select(
      x.lessThan(float(0.5)),
      float(0.03125),
      select(
        x.lessThan(float(1.5)),
        float(0.53125),
        select(x.lessThan(float(2.5)), float(0.15625), float(0.65625)),
      ),
    );
    const row1 = select(
      x.lessThan(float(0.5)),
      float(0.78125),
      select(
        x.lessThan(float(1.5)),
        float(0.28125),
        select(x.lessThan(float(2.5)), float(0.90625), float(0.40625)),
      ),
    );
    const row2 = select(
      x.lessThan(float(0.5)),
      float(0.21875),
      select(
        x.lessThan(float(1.5)),
        float(0.71875),
        select(x.lessThan(float(2.5)), float(0.09375), float(0.59375)),
      ),
    );
    const row3 = select(
      x.lessThan(float(0.5)),
      float(0.96875),
      select(
        x.lessThan(float(1.5)),
        float(0.46875),
        select(x.lessThan(float(2.5)), float(0.84375), float(0.34375)),
      ),
    );

    return select(
      y.lessThan(float(0.5)),
      row0,
      select(y.lessThan(float(1.5)), row1, select(y.lessThan(float(2.5)), row2, row3)),
    );
  };

  const material = new MeshBasicNodeMaterial();
  material.depthTest = false;
  material.depthWrite = false;
  material.transparent = true;

  material.colorNode = Fn(() => {
    const screenUv = vec2(uv().x, float(1).sub(uv().y));
    const pixel = screenUv.mul(viewportSizeUniform);
    const gridPixel = pixel.sub(gridOriginUniform);
    const inBounds = gridPixel.x
      .greaterThanEqual(float(0))
      .and(gridPixel.y.greaterThanEqual(float(0)))
      .and(gridPixel.x.lessThan(gridDisplaySizeUniform.x))
      .and(gridPixel.y.lessThan(gridDisplaySizeUniform.y));

    const cellCoord = gridPixel.div(displayCellSizeUniform);
    const cell = floor(cellCoord);
    const localUv = cellCoord.sub(cell);
    const cellSampleUv = cell.add(vec2(0.5, 0.5)).div(gridSizeUniform);

    const sourceSampleUv = vec2(cellSampleUv.x, float(1).sub(cellSampleUv.y));
    const sourceState = texture(sourceTexture, sourceSampleUv);
    const sourceLuma = sourceState.r
      .mul(0.2126)
      .add(sourceState.g.mul(0.7152))
      .add(sourceState.b.mul(0.0722))
      .toVar();
    const sourceDensity = max(max(sourceState.r, sourceState.g), sourceState.b).toVar();
    const sourceSignal = (useGradientSignal ? sourceDensity : sourceLuma).toVar();
    const overlayGlyphState = texture(glyphTexture, cellSampleUv);
    const overlayColorState = texture(colorTexture, cellSampleUv);
    const overlayGlyphIndex = floor(overlayGlyphState.r.mul(float(255)).add(float(0.5)));
    const overlayMeta = floor(overlayGlyphState.b.mul(float(255)).add(float(0.5)));
    const overlayScale = overlayMeta.mod(float(4)).add(float(1));
    const overlaySubX = floor(overlayMeta.div(float(4))).mod(float(4));
    const overlaySubY = floor(overlayMeta.div(float(16))).mod(float(4));
    const overlayLocalUv = localUv.add(vec2(overlaySubX, overlaySubY)).div(overlayScale);
    const overlayGlyphMask = sampleGlyphMask(overlayGlyphIndex, overlayLocalUv);
    const overlayInk = overlayGlyphMask.mul(overlayGlyphState.g);
    const overlayActive = overlayGlyphState.g.greaterThan(float(0.001));
    const overlayCompositeMode = floor(overlayColorState.a.mul(float(255)).add(float(0.5)));
    const overlayFillBlack = overlayCompositeMode.greaterThan(float(31)).and(
      overlayCompositeMode.lessThan(float(96)),
    );
    const overlayFillScene = overlayCompositeMode.greaterThan(float(95));
    const overlayColorOverride = overlayCompositeMode.greaterThan(float(159));
    
    // Direct signal mapping for higher contrast
    const gradientSignal = clamp(
      invertGradient ? float(1).sub(sourceSignal) : sourceSignal,
      float(0),
      float(1),
    ).toVar();
    
    const gradientSampleUv = vec2(
      gradientSignal,
      gradientIndexUniform.add(float(0.5)).div(gradientRowCount),
    ).toVar();

    const sceneGlyphIndex = float(ramp0 ?? 0).toVar();
    if (useRampDither) {
      const ditherThreshold = getBayer4Threshold(cell).toVar();
      const scaledLevel = sourceSignal.mul(float(5)).toVar();
      const baseLevel = floor(scaledLevel).toVar();
      const fraction = scaledLevel.sub(baseLevel).toVar();
      const rampLevel = baseLevel
        .add(select(fraction.greaterThan(ditherThreshold), float(1), float(0)))
        .toVar();

      rampLevel.assign(select(rampLevel.greaterThan(float(5)), float(5), rampLevel));

      sceneGlyphIndex.assign(
        select(rampLevel.greaterThanEqual(float(1)), float(ramp1 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(rampLevel.greaterThanEqual(float(2)), float(ramp2 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(rampLevel.greaterThanEqual(float(3)), float(ramp3 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(rampLevel.greaterThanEqual(float(4)), float(ramp4 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(rampLevel.greaterThanEqual(float(5)), float(ramp5 ?? 0), sceneGlyphIndex),
      );
    } else {
      sceneGlyphIndex.assign(
        select(sourceSignal.greaterThan(float(0.08)), float(ramp1 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(sourceSignal.greaterThan(float(0.18)), float(ramp2 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(sourceSignal.greaterThan(float(0.34)), float(ramp3 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(sourceSignal.greaterThan(float(0.52)), float(ramp4 ?? 0), sceneGlyphIndex),
      );
      sceneGlyphIndex.assign(
        select(sourceSignal.greaterThan(float(0.72)), float(ramp5 ?? 0), sceneGlyphIndex),
      );
    }

    const sceneGlyphMask = sampleGlyphMask(sceneGlyphIndex, localUv);
    const scenePresence = smoothstep(0.02, 0.08, sourceSignal); // Lower threshold for sharper appearance
    const gradientColor = texture(gradientTexture, gradientSampleUv).rgb;
    const sceneColor = (useGradientSignal ? gradientColor : sourceState.rgb).toVar();
    const sceneInk = sceneGlyphMask.mul(scenePresence);
    const baseOutput = sceneColor.mul(sceneInk);
    const baseCellOutput = select(
      overlayFillBlack,
      background,
      select(overlayFillScene, sceneColor, baseOutput),
    );
    const overlayColor = select(overlayColorOverride, overlayColorState.rgb, sceneColor);
    const overlayOutput = overlayColor.mul(overlayInk);
    const compositedOutput = select(
      overlayActive,
      baseCellOutput.mul(float(1).sub(overlayInk)).add(overlayOutput),
      baseCellOutput,
    ).toVar();

    const debugRotorOffset = debugHalfSize.x.mul(float(0.5)).toVar();
    const debugRotorRadiusX = max(debugHalfSize.x.mul(float(1.0)), debugHalfSize.y.mul(float(2.0))).toVar();
    const debugRotorRadiusY = max(debugHalfSize.y.mul(float(2.2)), debugRotorRadiusX.mul(float(0.82))).toVar();
    const debugSafeRadiusX = max(debugRotorRadiusX, float(1e-5)).toVar();
    const debugSafeRadiusY = max(debugRotorRadiusY, float(1e-5)).toVar();

    const debugLeftCenter = vec2(
      debugCenter.x.sub(debugRotorOffset),
      debugCenter.y.add(debugRotorRadiusY.mul(float(0.12))),
    ).toVar();
    const debugLeftRel = cellSampleUv.sub(debugLeftCenter).toVar();
    const debugLeftQ = vec2(
      debugLeftRel.x.div(debugSafeRadiusX.mul(float(1.05))),
      debugLeftRel.y.div(debugSafeRadiusY.mul(float(0.72))),
    ).toVar();
    const debugLeftLen2 = debugLeftQ.x.mul(debugLeftQ.x).add(debugLeftQ.y.mul(debugLeftQ.y)).toVar();
    const debugLeftRadius = debugLeftLen2.sqrt().toVar();
    const debugLeftRingDelta = debugLeftRadius.sub(float(0.94)).toVar();
    const debugLeftRing = exp(debugLeftRingDelta.mul(debugLeftRingDelta).mul(float(-16.0))).toVar();
    const debugLeftSide = clamp(debugLeftQ.x.mul(float(-2.8)).sub(float(0.7)), float(0), float(1)).toVar();
    const debugLeftArcHeight = exp(debugLeftQ.y.mul(debugLeftQ.y).mul(float(-4.6))).toVar();
    const debugLeftArc = debugLeftRing.mul(debugLeftSide).mul(debugLeftArcHeight).toVar();

    const debugRightCenter = vec2(
      debugCenter.x.add(debugRotorOffset),
      debugCenter.y.add(debugRotorRadiusY.mul(float(0.12))),
    ).toVar();
    const debugRightRel = cellSampleUv.sub(debugRightCenter).toVar();
    const debugRightQ = vec2(
      debugRightRel.x.div(debugSafeRadiusX.mul(float(1.05))),
      debugRightRel.y.div(debugSafeRadiusY.mul(float(0.72))),
    ).toVar();
    const debugRightLen2 = debugRightQ.x.mul(debugRightQ.x).add(debugRightQ.y.mul(debugRightQ.y)).toVar();
    const debugRightRadius = debugRightLen2.sqrt().toVar();
    const debugRightRingDelta = debugRightRadius.sub(float(0.94)).toVar();
    const debugRightRing = exp(debugRightRingDelta.mul(debugRightRingDelta).mul(float(-16.0))).toVar();
    const debugRightSide = clamp(debugRightQ.x.mul(float(2.8)).sub(float(0.7)), float(0), float(1)).toVar();
    const debugRightArcHeight = exp(debugRightQ.y.mul(debugRightQ.y).mul(float(-4.6))).toVar();
    const debugRightArc = debugRightRing.mul(debugRightSide).mul(debugRightArcHeight).toVar();

    const debugNoise = sin(
      cellSampleUv.x.mul(float(17.0))
        .add(cellSampleUv.y.mul(float(11.0)))
        .add(debugTimeUniform.mul(float(0.41))),
    )
      .mul(
        cos(
          cellSampleUv.x.mul(float(13.0))
            .sub(cellSampleUv.y.mul(float(19.0)))
            .sub(debugTimeUniform.mul(float(0.29))),
        ),
      )
      .toVar();
    const debugModulation = debugNoise.mul(float(0.18)).add(float(0.92)).toVar();
    const debugRotorFeed = debugLeftArc
      .add(debugRightArc)
      .mul(float(1.35))
      .mul(debugModulation)
      .toVar();

    const debugCursorRel = cellSampleUv.sub(debugCenter).toVar();
    const debugCursorRadius = debugCursorRel.length().toVar();
    const debugVeinBand = smoothstep(float(0.035), float(0.16), sourceSignal)
      .mul(float(1).sub(smoothstep(float(0.28), float(0.5), sourceSignal)))
      .toVar();
    const debugPulseA = sin(debugCursorRadius.mul(float(72.0)).sub(debugTimeUniform.mul(float(6.2))))
      .mul(float(0.5))
      .add(float(0.5))
      .toVar();
    const debugPulseB = sin(debugCursorRadius.mul(float(43.0)).sub(debugTimeUniform.mul(float(3.7))).add(debugNoise.mul(float(0.9))))
      .mul(float(0.5))
      .add(float(0.5))
      .toVar();
    const debugBreath = sin(debugTimeUniform.mul(float(1.7)))
      .mul(float(0.5))
      .add(float(0.5))
      .toVar();
    const debugPulseBand = smoothstep(float(0.54), float(0.9), debugPulseA.mul(float(0.62)).add(debugPulseB.mul(float(0.38))))
      .mul(exp(debugCursorRadius.mul(debugCursorRadius).mul(float(-2.15))))
      .mul(float(0.72).add(debugBreath.mul(float(0.28))))
      .toVar();
    const debugCursorFeed = debugPulseBand
      .mul(debugVeinBand)
      .mul(float(0.92))
      .toVar();

    const debugFeed = select(
      debugMode.greaterThan(float(0.5)),
      debugCursorFeed,
      debugRotorFeed,
    )
      .mul(debugEnabled)
      .toVar();
    const debugSignal = float(clamp(debugFeed.mul(select(debugMode.greaterThan(float(0.5)), float(0.85), float(1.1))), float(0), float(1))).toVar();
    
    // Smooth interpolation across 4 colors
    const t1 = clamp(debugSignal.mul(float(3.0)), float(0), float(1)).toVar();
    const t2 = clamp(debugSignal.mul(float(3.0)).sub(float(1.0)), float(0), float(1)).toVar();
    const t3 = clamp(debugSignal.mul(float(3.0)).sub(float(2.0)), float(0), float(1)).toVar();

    const color12 = debugLow.mul(float(1).sub(t1)).add(debugMid.mul(t1)).toVar();
    const color23 = debugMid.mul(float(1).sub(t2)).add(debugHigh.mul(t2)).toVar();
    const color34 = debugHigh.mul(float(1).sub(t3)).add(debugPeak.mul(t3)).toVar();

    const debugColor = select(
      debugSignal.lessThan(float(0.333)),
      color12,
      select(debugSignal.lessThan(float(0.666)), color23, color34)
    ).toVar();
    const debugVeinColorBlend = clamp(debugSignal.mul(float(2.1)), float(0), float(1)).toVar();
    const debugVeinColor = debugMid
      .mul(float(1).sub(debugVeinColorBlend))
      .add(debugHigh.mul(debugVeinColorBlend))
      .toVar();
    const debugResolvedColor = select(debugMode.greaterThan(float(0.5)), debugVeinColor, debugColor).toVar();
    const debugAlpha = float(smoothstep(float(0.02), float(0.72), debugSignal))
      .mul(select(debugMode.greaterThan(float(0.5)), float(0.58), float(0.85)))
      .toVar();
    const finalOutput = compositedOutput
      .mul(float(1).sub(debugAlpha.mul(float(0.55))))
      .add(debugResolvedColor.mul(debugAlpha))
      .toVar();

    return select(inBounds, finalOutput, background);
  })();

  material.opacityNode = float(1);
  return material;
}

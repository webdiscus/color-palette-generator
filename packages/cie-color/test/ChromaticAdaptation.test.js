import { xyToXYZ } from '../src/ColorUtils';
import { invertMatrix, linearTransform, multiplyMatrices, roundMatrix } from '../src/ColorMatrix';
import { ChromaticAdaptation } from '../src/ChromaticAdaptation';

describe('Make chromatic adaptation matrix', () => {
  const chromaticAdaptationMatrix = [
    {
      srcIlluminant: 'D50',
      srcChromaticity: [0.3457, 0.3585],
      dstIlluminant: 'D65',
      type: 'bradford',
      digits: 5,
      // https://drafts.csswg.org/css-color-4/#color-conversion-code function D50_to_D65()
      expected: [
        [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
        [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
        [0.012314001688319899, -0.020507696433477912, 1.3303659366080753],
      ],
    },

    {
      srcIlluminant: 'D65',
      dstIlluminant: 'D50',
      type: 'bradford',
      digits: 6,
      // https://drafts.csswg.org/css-color-4/#color-conversion-code function D65_to_D50()
      expected: [
        [1.0479298208405488, 0.022946793341019088, -0.05019222954313557],
        [0.029627815688159344, 0.990434484573249, -0.01707382502938514],
        [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008],
      ],
    },
  ];

  chromaticAdaptationMatrix.map((item) => {
    let { srcIlluminant, dstIlluminant, type, digits, expected } = item;
    test(`from ${srcIlluminant} to ${dstIlluminant} type ${type}`, () => {
      let result = ChromaticAdaptation.getMatrix({ illuminant: srcIlluminant }, { illuminant: dstIlluminant }, type);

      if (digits > 0) {
        expected = roundMatrix(expected, digits);
        result = roundMatrix(result, digits);
      }
      expect(result).toEqual(expected);
    });
  });
});

// Makes the chromatic adaptation matrix from the chromaticity coordinates using the standard IEC 61966-2-1
// and the W3C/CSS4 method (intermediate calculations use the inverse Bradford matrix rounded to 7 decimal places).
describe('Chromatic adaptation matrix CSS4 (IEC 61966-2-1)', () => {
  // sample data are precalculated matrices from https://drafts.csswg.org/css-color-4/#color-conversion-code
  const chromaticAdaptationMatrix = [
    {
      srcIlluminant: 'D50',
      srcChromaticity: [0.3457, 0.3585],
      dstIlluminant: 'D65',
      dstChromaticity: [0.3127, 0.329],
      // see function D50_to_D65() in #color-conversion-code
      expected: [
        [0.9554734527042182, -0.023098536874261423, 0.0632593086610217],
        [-0.028369706963208136, 1.0099954580058226, 0.021041398966943008],
        [0.012314001688319899, -0.020507696433477912, 1.3303659366080753],
      ],
    },
    {
      srcIlluminant: 'D65',
      srcChromaticity: [0.3127, 0.329],
      dstIlluminant: 'D50',
      dstChromaticity: [0.3457, 0.3585],
      // see function D65_to_D50() in #color-conversion-code
      expected: [
        [1.0479298208405488, 0.022946793341019088, -0.05019222954313557],
        [0.029627815688159344, 0.990434484573249, -0.01707382502938514],
        [-0.009243058152591178, 0.015055144896577895, 0.7518742899580008],
      ],
    },
  ];

  const makeCatMatrix = (srcWhitepoint, dstWhitepoint) => {
    // Bradford
    const coneMatrix = [
        [0.8951, 0.2664, -0.1614],
        [-0.7502, 1.7135, 0.0367],
        [0.0389, -0.0685, 1.0296],
      ],
      // Note 1: inverse matrix is exact rounded to 7 digits to match with precalculated matrices from CSS4.
      // That is absolutely illogical:
      // - the source xy chromaticity coordinates used with only 4 decimal points (for D65 xy [0.3127, 0.329]),
      //   why don't used more precise values, e.g. with 5 places (for D65 xy [0.31271, 0.32902])?
      // - the whitepoint is calculated from xy chromaticity coordinates with precision 16 decimal points
      // - the Bradford matrix is inverted with precision 16 decimal points, but will be rounded to 7 digits (WHY?!)
      // - the result of the adapted matrix is not rounded,
      //   then why is the inverse Bradford matrix rounded in the intermediate calculation?
      inverseConeMatrix = roundMatrix(invertMatrix(coneMatrix), 7),
      [Rsw, Gsw, Bsw] = linearTransform(coneMatrix, srcWhitepoint),
      [Rdw, Gdw, Bdw] = linearTransform(coneMatrix, dstWhitepoint),
      diagonalMatrix = [
        [Rdw / Rsw, 0, 0],
        [0, Gdw / Gsw, 0],
        [0, 0, Bdw / Bsw],
      ],
      scaledConeMatrix = multiplyMatrices(diagonalMatrix, coneMatrix);

    return multiplyMatrices(inverseConeMatrix, scaledConeMatrix);
  };

  chromaticAdaptationMatrix.map((item) => {
    let { srcIlluminant, srcChromaticity, dstIlluminant, dstChromaticity, type, expected } = item;

    test(`from ${srcIlluminant} to ${dstIlluminant}`, () => {
      const srcWhitepoint = xyToXYZ(...srcChromaticity),
        dstWhitepoint = xyToXYZ(...dstChromaticity),
        result = makeCatMatrix(srcWhitepoint, dstWhitepoint, type);
      // the method ChromaticAdaptation.makeMatrix() does not round the inverse cone matrix
      //result = ChromaticAdaptation.makeMatrix(srcWhitepoint, dstWhitepoint, type);

      // Note 2: don't round the matrix values to match with precalculated matrices from CSS4.
      expect(result).toEqual(expected);
    });
  });
});

// Makes the chromatic adaptation matrix from the chromaticity coordinates using the standard ASTM E308
// and Lindbloom method (intermediate calculations use the calculated non-rounded inverse Bradford matrix).
describe('Chromatic adaptation matrix by Lindbloom (ASTM E308)', () => {
  // sample data are precalculated matrices from http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
  const chromaticAdaptationMatrix = [
    {
      srcIlluminant: 'A',
      srcWhitepoint: [1.0985, 1, 0.35585],
      dstIlluminant: 'D65',
      dstWhitepoint: [0.95047, 1, 1.08883],
      expected: [
        [0.8446965, -0.1179225, 0.3948108],
        [-0.1366303, 1.1041226, 0.1291718],
        [0.0798489, -0.1348999, 3.1924009],
      ],
    },
    {
      srcIlluminant: 'D65',
      srcWhitepoint: [0.95047, 1, 1.08883],
      dstIlluminant: 'A',
      dstWhitepoint: [1.0985, 1, 0.35585],
      expected: [
        [1.2164557, 0.1109905, -0.1549325],
        [0.1533326, 0.9152313, -0.0559953],
        [-0.0239469, 0.0358984, 0.3147529],
      ],
    },
    {
      srcIlluminant: 'D50',
      srcWhitepoint: [0.96422, 1, 0.82521],
      dstIlluminant: 'D65',
      dstWhitepoint: [0.95047, 1, 1.08883],
      expected: [
        [0.9555766, -0.0230393, 0.0631636],
        [-0.0282895, 1.0099416, 0.0210077],
        [0.0122982, -0.020483, 1.3299098],
      ],
    },
    {
      srcIlluminant: 'D65',
      srcWhitepoint: [0.95047, 1, 1.08883],
      dstIlluminant: 'D50',
      dstWhitepoint: [0.96422, 1, 0.82521],
      expected: [
        [1.0478112, 0.0228866, -0.050127],
        [0.0295424, 0.9904844, -0.0170491],
        [-0.0092345, 0.0150436, 0.7521316],
      ],
    },
  ];

  chromaticAdaptationMatrix.map((item) => {
    let { srcIlluminant, srcWhitepoint, dstIlluminant, dstWhitepoint, type, expected } = item;

    test(`from ${srcIlluminant} to ${dstIlluminant}`, () => {
      let result = ChromaticAdaptation.makeMatrix(srcWhitepoint, dstWhitepoint, type);

      // Note 2: use exact 7 digits rounding of the matrix values to match with precalculated matrices from Lindbloom.
      result = roundMatrix(result, 7);
      expect(result).toEqual(expected);
    });
  });
});
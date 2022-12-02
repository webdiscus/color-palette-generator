import { roundFloat } from '../packages/math-utils/index.js';
import { xyToXYZ } from '../src/ColorUtils';

describe('xy to XYZ', () => {
  // Note
  // An RGB space is normally defined by the xy chromaticities of the 3 primaries and the white point.
  // Lindbloom use the ’official’ XYZ values of the white point from ASTM E308.
  // Using this XYZ of the white point makes the color space a little more consistent with other areas of color.
  // The standard IEC 61966-2-1 use source xy chromaticities for calculation of XYZ values.
  // For example, by IEC 61966-2-1 from D65 xyY=[0.3127, 0.3290, 1] is XYZ=[0.9504559, 1, 1.0890578].
  // But by ASTM E308, D65 XYZ=[0.95047, 1, 1.08883], which is a little different.

  // See different white points:
  // https://ninedegreesbelow.com/photography/well-behaved-profiles-quest.html#white-point-values

  const illuminants = [
    {
      illuminant: 'D50 ASTM E308 Lindbloom',
      xy: [0.345669187, 0.35849618],
      XYZ: [0.96422, 1, 0.82521],
      digits: 5,
    },
    {
      illuminant: 'D50 IEC 61966-2-1 sRGB',
      xy: [0.3457, 0.3585],
      XYZ: [0.9643, 1, 0.8251],
      digits: 5,
    },
    {
      illuminant: 'D65 ASTM E308 Lindbloom',
      xy: [0.312726615, 0.32902313],
      XYZ: [0.95047, 1, 1.08883],
      digits: 5,
    },
    {
      illuminant: 'D65 IEC 61966-2-1 sRGB',
      xy: [0.3127, 0.329],
      XYZ: [0.9505, 1, 1.0891],
      digits: 4,
    },
    {
      illuminant: 'D65 IEC 61966-2-1 sRGB',
      xy: [0.3127, 0.329],
      XYZ: [0.95045593, 1, 1.08905775],
      digits: 8,
    },
  ];

  illuminants.map((item) => {
    test(`${item.illuminant} ${JSON.stringify(item.xy)}, round to ${item.digits} digits`, () => {
      const [X, Y, Z] = xyToXYZ(...item.xy);
      const result = item.digits > 0 ? [roundFloat(X, item.digits), Y, roundFloat(Z, item.digits)] : [X, Y, Z];
      const expected = item.XYZ;
      expect(result).toEqual(expected);
    });
  });
});
// todo Test data from https://drafts.csswg.org/css-color-4/workings/

import { roundFloat } from '@webdiscus/math-utils';
import Color from '../src/Color.js';
import ColorChecker2005 from './data/ColorChecker2005.js';

describe('Color Checker 2005', () => {
  ColorChecker2005.map((data) => {
    /*test(`Color.fromHex('${data.hex}').toValues()`, () => {
      const [r, g, b] = Color.fromHex(data.hex).toValues();
      const result = [r, g, b];
      const expected = data.sRGB;
      expect(result).toEqual(expected);
    });

    test(`Color.fromRgb(${data.sRGB}).toHex()`, () => {
      const result = '#' + Color.fromRgb(...data.sRGB).toHex();
      const expected = data.hex.toUpperCase();
      expect(result).toEqual(expected);
    });*/
    /*test(`Color.fromRgb(${data.sRGB}).toLab()`, () => {
      const { L, a, b } = Color.fromRgb(...data.sRGB).toLab();
      const result = [L, a, b];
      const expected = data.Lab;
      expect(result).toEqual(expected);
    });*/
    /*test(`Color.fromHex('${data.hex}').toLab()`, () => {
      const rgb = Color.fromHex(data.hex);
      const xyzD50 = rgb.toXyz();
      const xyzD65Values = Color.adaptChromatic([xyzD50.X, xyzD50.Y, xyzD50.Z], 2, 'D50', 2, 'D65');
      const xyzD65 = new Color.Xyz(...xyzD65Values);

      //const { L, a, b } = Color.fromHex(data.hex).toLab();
      const { L, a, b } = xyzD65.toLab();
      const expected = data.Lab;
      const result = [roundFloat(L, 4), roundFloat(a, 4), roundFloat(b, 4)];
      expect(result).toEqual(expected);
    });*/
    /*test(`Color.Yxy(${data.xyY}).toLab()`, () => {
      const { L, a, b } = new Color.Yxy(...data.xyY, Illuminant.D50).toXyz().toLab();
      //const xyz = new Color.Yxy(...data.xyY).toXyz();
      const xyz = new Color.Lab(...data.Lab).toXyz();

      const xyY = xyz.toYxy();

      const expected = data.Lab;
      const result = [roundFloat(L, 4), roundFloat(a, 4), roundFloat(b, 4)];
      expect(result).toEqual(expected);
    });*/
    // todo check the precision issue by some values after 3th decimal point,
    //   possible ColorChecker2005 data (xyY/Lab) are not correct, e.g. received 0.3015 but expected 0.3016
    /*test(`Color.Lab(${data.xyY}).toYxy()`, () => {
      const labValues = [...data.Lab, 1];
      const { Y, x, y } = new Color.Lab(...labValues, Illuminant.D50).toXyz().toYxy();
      const expected = data.xyY;
      const result = [roundFloat(x, 4), roundFloat(y, 4), roundFloat(Y * 100, 2)];
      expect(result).toEqual(expected);
    });*/
  });
});

describe('Color helpers', () => {
  test(`contrastRatio()`, () => {
    const rgb1 = Color.fromHex('#444');
    const rgb2 = Color.fromHex('#EEAAAA');
    const expected = 5.085910156430268;
    const result = rgb1.contrastRatio(rgb2);
    expect(result).toEqual(expected);
  });
});

describe('Color.isHexColor', () => {
  const valideHexCodes = ['#123', '#123f', '#123a', '#123456', '#123456bb'];
  for (let hex of valideHexCodes) {
    test(`isHexColor('${hex}')`, () => {
      const expected = true;
      const result = Color.isHexColor(hex);
      expect(result).toEqual(expected);
    });
  }

  const invalideHexCodes = ['#12', '#123h', '#12345', '#12345k', '#123456b'];
  for (let hex of invalideHexCodes) {
    test(`!isHexColor('${hex}')`, () => {
      const expected = false;
      const result = Color.isHexColor(hex);
      expect(result).toEqual(expected);
    });
  }
});

describe('Color from ...', () => {
  const valideHexCodes = {
    '#123': '112233',
    '#123f': '112233',
    '#123a': '112233AA',
    '#123456': '123456',
    '#123456bb': '123456BB',
  };
  for (let hex in valideHexCodes) {
    test(`fromHex('${hex}')`, () => {
      const expected = valideHexCodes[hex];
      const result = Color.fromHex(hex).toHex();
      expect(result).toEqual(expected);
    });
  }

  test(`Error fromHex()`, () => {
    expect(() => {
      Color.fromHex('#12');
    }).toThrow(Error);
  });

  test(`fromRgb()`, () => {
    const result = Color.fromRgb(255, 255, 255, 0.5);
    const expected = { r: 1, g: 1, b: 1, alpha: 0.5, space: 'sRGB' };
    expect(result).toEqual(expected);
  });

  test(`fromHsv()`, () => {
    const result = Color.fromHsv(60, 50, 50, 0.5);
    const expected = { r: 0.75, g: 0.75, b: 0.25, alpha: 0.5, space: 'sRGB' };
    expect(result).toEqual(expected);
  });

  test(`fromHsl()`, () => {
    const result = Color.fromHsl(60, 50, 50, 0.5);
    const expected = { r: 0.75, g: 0.75, b: 0.25, alpha: 0.5, space: 'sRGB' };
    expect(result).toEqual(expected);
  });

  test(`fromHex('#FFF').toLab()`, () => {
    const digits = 4;
    const lab = Color.fromHex('#FFF').toLab();
    const result = {
      L: roundFloat(lab.L, digits),
      a: roundFloat(lab.a, digits),
      b: roundFloat(lab.b, digits),
    };
    const expected = { L: 100, a: 0, b: 0 };
    expect(result).toEqual(expected);
  });
});

describe('Color.Rgb', () => {
  test('RangeError Rgb(2, 3, 4, 1)', () => {
    expect(() => new Color.Rgb(2, 3, 4, 1)).toThrow(RangeError);
  });

  test('rgb.check()', () => {
    const rgb = new Color.Rgb(1, 1, 1);
    rgb.red = 1.01;
    rgb.green = 1.02;
    rgb.blue = 1.03;

    const expected = 'FFFFFF';
    const result = rgb.check().toHex();
    expect(result).toEqual(expected);
  });

  test('rgb.toCss()', () => {
    const rgb = new Color.Rgb(1, 1, 1);
    const expected = 'rgba(255, 255, 255, 1)';
    const result = rgb.toCss();
    expect(result).toEqual(expected);
  });
});

describe('Convert color spaces', () => {
  const hexColors = [
    '#000000',
    '#000001',
    '#010001',
    '#FFFFFE',
    '#FFFFFF',
    '#E8E7E9',
    '#232226',
    '#D5B9FD',
    '#210250',
    '#FF8000',
    '#80FF00',
    '#00FFAA',
    '#0080FF',
    '#8000FF',
    '#FF0080',
  ];

  test('Rgb.toHsv().toRgb().toHex()', () => {
    hexColors.map((hex) => {
      hex = hex.replace('#', '');
      const rgb = Color.fromHex(hex);
      const result = rgb.toHsv().toRgb().toHex();
      const expected = hex;
      expect(result).toEqual(expected);
    });
  });

  test('Rgb.toHsl().toRgb().toHex()', () => {
    hexColors.map((hex) => {
      hex = hex.replace('#', '');
      const rgb = Color.fromHex(hex);
      const result = rgb.toHsl().toRgb().toHex();
      const expected = hex;
      expect(result).toEqual(expected);
    });
  });

  test('Rgb.toLab().toRgb().toHex()', () => {
    hexColors.map((hex) => {
      hex = hex.replace('#', '');
      const rgb = Color.fromHex(hex);
      const result = rgb.toLab().toRgb().toHex();
      const expected = hex;
      expect(result).toEqual(expected);
    });
  });

  test('Rgb.toXyz().toRgb().toHex()', () => {
    hexColors.map((hex) => {
      hex = hex.replace('#', '');
      const rgb = Color.fromHex(hex);
      const result = rgb.toXyz().toRgb().toHex();
      const expected = hex;
      expect(result).toEqual(expected);
    });
  });

  test('Rgb.toXyz()', () => {
    const rgb = Color.fromHex('#aa88ee');
    const { X, Y, Z } = rgb.toXyz();
    const result = { X, Y, Z };
    const expected = { X: 0.4081067468970102, Y: 0.32327029210186853, Z: 0.8496200077006107 };
    expect(result).toEqual(expected);
  });

  test('Rgb.toLCHab().toRgb().toHex()', () => {
    hexColors.map((hex) => {
      hex = hex.replace('#', '');
      const rgb = Color.fromHex(hex);
      const result = rgb.toLCHab().toRgb().toHex();
      const expected = hex;
      expect(result).toEqual(expected);
    });
  });

  test('Hsv.toHsl()', () => {
    const result = new Color.Hsv(60, 0.7, 0.6).toHsl();
    const expected = { h: 60, s: 0.5384615384615383, l: 0.39, alpha: 1 };
    expect(result).toEqual(expected);
  });

  test('Hsv.toCss()', () => {
    const result = new Color.Hsv(60, 0.5, 0.5).toCss();
    const expected = 'rgba(128, 128, 64, 1)';
    expect(result).toEqual(expected);
  });

  test('Hsv.rotate()', () => {
    const hsv = Color.fromHex('#FF0000').toHsv();
    const result = hsv.rotate(120).toRgb().toHex();
    const expected = '00FF00';
    expect(result).toEqual(expected);
  });

  test('Hsl.toHsv()', () => {
    const result = new Color.Hsl(60, 0.54, 0.38).toHsv();
    const expected = { h: 60, s: 0.7012987012987013, v: 0.5852, alpha: 1 };
    expect(result).toEqual(expected);
  });

  test('Hsl.rotate()', () => {
    const hsl = Color.fromHex('#FF0000').toHsl();
    const result = hsl.rotate(120).toRgb().toHex();
    const expected = '00FF00';
    expect(result).toEqual(expected);
  });

  test('Hsl.toCss()', () => {
    const result = new Color.Rgb(0.2, 0.3, 0.5).toHsl().toCss();
    const expected = 'hsla(220, 43%, 35%, 1)';
    expect(result).toEqual(expected);
  });

  test('Lab.toXyz()', () => {
    const { X, Y, Z } = new Color.Lab(50, 100, -100).toXyz();
    const result = { X, Y, Z };
    const expected = { X: 0.43217437149903665, Y: 0.18418651851244416, Z: 1.3299985456558288 };
    expect(result).toEqual(expected);
  });

  test('Lab.deltaE', () => {
    const lab1 = new Color.Lab(100, 100, 100),
      lab2 = new Color.Lab(100, 50, 50);
    const result = lab1.deltaE(lab2);
    const expected = 12.248587906607298;
    expect(result).toEqual(expected);
  });

  test('Lab.toLCHab()', () => {
    const result = new Color.Lab(50, 100, -100).toLCHab();
    const expected = { l: 50, c: 141.4213562373095, h: 315, alpha: 1 };
    expect(result).toEqual(expected);
  });

  test('Lab.toCss()', () => {
    const result = new Color.Lab(50, 100, -100).toCss();
    const expected = 'rgba(180, 0, 255, 1)';
    expect(result).toEqual(expected);
  });

  test('Xyz.toLab()', () => {
    const { L, a, b } = new Color.Xyz(0.5, 0.5, 0.5).toLab();
    const result = { L, a, b };
    const expected = { L: 76.06926101415557, a: 6.777038667061586, b: 4.4398523641493215 };
    expect(result).toEqual(expected);
  });

  test('Xyz.toRgb()', () => {
    const result = new Color.Xyz(0.5, 0.5, 0.5).toRgb();
    const expected = { alpha: 1, b: 0.7044985157025837, g: 0.7180676680115904, r: 0.7991526701664677 };
    expect(result).toEqual(expected);
  });

  test('Xyz.toCss()', () => {
    const result = new Color.Xyz(0.4, 0.2, 0.6).toCss();
    const expected = 'rgba(216, 29, 206, 1)';
    expect(result).toEqual(expected);
  });

  test('LCHab.toLab()', () => {
    const { L, a, b } = new Color.LCHab(50, 142, 315).toLab();
    const result = { L, a, b };
    const expected = { L: 50, a: 100.40916292848972, b: -100.40916292848978 };
    expect(result).toEqual(expected);
  });

  test('LCHab.toCss()', () => {
    const result = new Color.LCHab(60, 60, 90).toCss();
    const expected = 'rgba(171, 142, 24, 1)';
    expect(result).toEqual(expected);
  });
});

describe('Lab', () => {
  // todo
  test('...', () => {
    let qq = 1;
  });
});

describe('Luv', () => {
  const LuvColors = [
    { luv: [41.52787529, 96.83626054, 17.75210149], xyz: [0.20653874, 0.12197225, 0.05134621] },
    { luv: [55.11636304, -37.59308176, 44.13768458], xyz: [0.14222533, 0.23042768, 0.10491583] },
    { luv: [29.8056552, -10.96316802, -65.0675186], xyz: [0.07818808, 0.06157201, 0.28095978] },
    { luv: [41.52787529, 65.4518094, -12.46626977], xyz: [0.19667145, 0.12197225, 0.14641445] },
    { luv: [41.52787529, 90.70925962, 7.08455273], xyz: [0.2085462, 0.12197225, 0.08063948] },
  ];

  const XyzColors = [
    { xyz: [0.20653874, 0.12197225, 0.05134621], luv: [41.52787529, 96.83626543, 17.75210237] },
    { xyz: [0.14222533, 0.23042768, 0.10491583], luv: [55.11636304, -37.59308081, 44.13768534] },
    { xyz: [0.07818808, 0.06157201, 0.28095978], luv: [29.8056552, -10.9631702, -65.06751759] },
    { xyz: [0.19667145, 0.12197225, 0.14641445], luv: [41.52787529, 65.45181003, -12.46626847] },
    { xyz: [0.2085462, 0.12197225, 0.08063948], luv: [41.52787529, 90.70926222, 7.08455279] },
  ];

  LuvColors.map((item) => {
    test('Luv to XYZ: ' + JSON.stringify(item.luv), () => {
      const expected = { X: item.xyz[0], Y: item.xyz[1], Z: item.xyz[2] };
      const xyz = new Color.Luv(...item.luv).toXyz();
      const result = {
        X: parseFloat(xyz.X.toFixed(8)),
        Y: parseFloat(xyz.Y.toFixed(8)),
        Z: parseFloat(xyz.Z.toFixed(8)),
      };
      expect(result).toEqual(expected);
    });
  });

  XyzColors.map((item) => {
    test('XYZ to Luv: ' + JSON.stringify(item.xyz), () => {
      const expected = { L: item.luv[0], u: item.luv[1], v: item.luv[2] };
      const luv = new Color.Xyz(...item.xyz).toLuv();
      const result = {
        L: parseFloat(luv.L.toFixed(8)),
        u: parseFloat(luv.u.toFixed(8)),
        v: parseFloat(luv.v.toFixed(8)),
      };
      expect(result).toEqual(expected);
    });
  });
});

describe('Color blending', () => {
  const blendColors = [
    {
      source: [[255, 0, 0, 0.9]],
      expected: [255, 25, 25, 1],
    },
    {
      source: ['#FFFFFF', '#FF0000E6', '#00FF0080', '#0000FF4D'],
      expected: [89, 98, 85, 1],
    },
    {
      source: [
        [255, 0, 0, 0.9],
        [0, 255, 0, 0.5],
        [0, 0, 255, 0.3],
      ],
      expected: [89, 98, 85, 1],
    },
  ];

  test('alpha blend', () => {
    blendColors.map((item) => {
      const expected = item.expected;
      let source = item.source;

      if (Array.isArray(source[0])) {
        // scale the range [0, 255] to [0, 1] for Color.Rgb()
        source = item.source.map(
          (values) => new Color.Rgb(values[0] / 255, values[1] / 255, values[2] / 255, values[3])
        );
      }

      const result = Color.fromRgb(255, 255, 255, 1)
        .blend(...source)
        .toValues();
      expect(result).toEqual(expected);
    });
  });

  test('alpha blend precision', () => {
    const expected = [89, 98, 85, 1];
    let source = ['#FF0000E6', '#00FF0080', '#0000FF4D'];

    const result = Color.fromHex('#FFFFFF')
      .blend(...source)
      .toValues();
    expect(result).toEqual(expected);
  });
});
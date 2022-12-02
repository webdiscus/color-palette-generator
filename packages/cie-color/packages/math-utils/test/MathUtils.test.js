import * as MathUtils from '../MathUtils';

describe('MathUtils', () => {
  test('isOdd()', () => {
    const expected = true;
    const result = MathUtils.isOdd(1);
    expect(result).toEqual(expected);
  });

  test('isOdd()', () => {
    const expected = true;
    const result = MathUtils.isEven(2);
    expect(result).toEqual(expected);
  });

  test('isHex()', () => {
    const expected = true;
    const result = MathUtils.isHex('FF80AA');
    expect(result).toEqual(expected);
  });

  test('!isHex()', () => {
    const expected = false;
    const result = MathUtils.isHex('FF80GG');
    expect(result).toEqual(expected);
  });

  test('inRange()', () => {
    const expected = true;
    const result = MathUtils.inRange(1, 0, 2);
    expect(result).toEqual(expected);
  });

  test('!inRange()', () => {
    const expected = false;
    const result = MathUtils.inRange(-1, 0, 2);
    expect(result).toEqual(expected);
  });

  test('inRanges(1, [0, 10], [30, 40])', () => {
    const expected = true;
    const result = MathUtils.inRanges(1, [0, 10], [30, 40]);
    expect(result).toEqual(expected);
  });

  test('inRanges(39, [0, 10], [30, 40])', () => {
    const expected = true;
    const result = MathUtils.inRanges(1, [0, 10], [30, 40]);
    expect(result).toEqual(expected);
  });

  test('!inRanges(15, [0, 10], [30, 40])', () => {
    const expected = false;
    const result = MathUtils.inRanges(15, [0, 10], [30, 40]);
    expect(result).toEqual(expected);
  });

  test('clamp(0, 1, 9)', () => {
    const expected = 1;
    const result = MathUtils.clamp(0, 1, 9);
    expect(result).toEqual(expected);
  });

  test('clamp(10, 1, 9)', () => {
    const expected = 9;
    const result = MathUtils.clamp(10, 1, 9);
    expect(result).toEqual(expected);
  });

  test('clamp(5, 1, 9)', () => {
    const expected = 5;
    const result = MathUtils.clamp(5, 1, 9);
    expect(result).toEqual(expected);
  });

  test('minOfArray()', () => {
    const expected = 1;
    const result = MathUtils.minOfArray([4, 3, 6, 2, 7, 1, 8, 9]);
    expect(result).toEqual(expected);
  });

  test('maxOfArray()', () => {
    const expected = 9;
    const result = MathUtils.maxOfArray([4, 3, 6, 2, 7, 1, 8, 9]);
    expect(result).toEqual(expected);
  });

  test('hexToDec()', () => {
    const expected = 16744686;
    const result = MathUtils.hexToDec('ff80ee');
    expect(result).toEqual(expected);
  });

  test('hexToDec() => Error', () => {
    expect(() => MathUtils.hexToDec('ff80gg')).toThrow(Error);
  });

  test('decToHex()', () => {
    const expected = '0f';
    const result = MathUtils.decToHex(15);
    expect(result).toEqual(expected);
  });

  test('decToHex()', () => {
    const expected = 'ff80ee';
    const result = MathUtils.decToHex(16744686);
    expect(result).toEqual(expected);
  });

  test('toNumber(undefined) => 0', () => {
    const expected = 0;
    const result = MathUtils.toNumber(undefined);
    expect(result).toEqual(expected);
  });

  test('toNumber("16px") => 16', () => {
    const expected = 16;
    const result = MathUtils.toNumber('16px');
    expect(result).toEqual(expected);
  });

  test('format() => 10,000,000.01', () => {
    const expected = '10,000,000.01';
    const result = MathUtils.numberFormat(10000000.01);
    expect(result).toEqual(expected);
  });

  test('format() => 10 000 000', () => {
    const expected = '10 000 000';
    const result = MathUtils.numberFormat(10000000, ' ');
    expect(result).toEqual(expected);
  });

  test('intlFormat() => 10,000,000.01', () => {
    const expected = '10,000,000.01';
    const result = MathUtils.intlNumberFormat(10000000.01);
    expect(result).toEqual(expected);
  });

  test('intlFormat() => 10.000.000,01', () => {
    const expected = '10.000.000,01';
    const result = MathUtils.intlNumberFormat(10000000.01, { locales: 'de-DE' });
    expect(result).toEqual(expected);
  });

  test('degToRad()', () => {
    const expected = Math.PI / 180;
    const result = MathUtils.degToRad(1);
    expect(result).toEqual(expected);
  });

  test('radToDeg()', () => {
    const expected = 180 / Math.PI;
    const result = MathUtils.radToDeg(1);
    expect(result).toEqual(expected);
  });

  test('pointToDeg(100, -100) => 45', () => {
    const expected = 45;
    const result = MathUtils.pointToDeg(100, -100);
    expect(result).toEqual(expected);
  });

  test('pointToDeg(100, 100) => 315', () => {
    const expected = 315;
    const result = MathUtils.pointToDeg(100, 100);
    expect(result).toEqual(expected);
  });

  test('pointToDeg(100, -100) => 45', () => {
    const expected = 315;
    const result = MathUtils.pointToDeg(100, -100, true);
    expect(result).toEqual(expected);
  });

  test('polarToCart()', () => {
    const expected = { x: 80.71067811865476, y: -60.71067811865474 };
    const result = MathUtils.polarToCart(100, 45, 10, 10);
    expect(result).toEqual(expected);
  });
});

describe('roundFloat()', () => {
  const floatRoundData = [
    { num: 1.5, digits: 0, expected: 2 },
    { num: 1.45, digits: 1, expected: 1.5 },
    { num: 1.449, digits: 1, expected: 1.4 },
    { num: 1.5678, digits: 2, expected: 1.57 },
    { num: 1.564, digits: 2, expected: 1.56 },
    { num: 0.1 + 0.2, digits: 4, expected: 0.3 },
    { num: 0.7 + 0.1, digits: 4, expected: 0.8 },
    { num: 1.005, digits: 2, expected: 1.01 },
    { num: 1.3549999999999998, digits: 2, expected: 1.35 },
    { num: 1.3555, digits: 3, expected: 1.356 },
    { num: 0.005 - 0.009, digits: 2, expected: +0 },
    { num: 7.131826240680539e-6, digits: 8, expected: 0.00000713 },
    { num: 7.131826240680539e-7, digits: 10, expected: 0.0000007132 },
    { num: 7.131826240680539e-7, digits: 5, expected: 0 },
    // bug 0.4986107602930035.toFixed(15) -> 0.498610760293003
    { num: 0.4986107602930035, digits: 15, expected: 0.498610760293004 },
    { num: 0.0035, digits: 3, expected: 0.004 },
  ];

  floatRoundData.map((data) => {
    test(`roundFloat(${data.num}, ${data.digits})`, () => {
      const expected = data.expected;
      const result = MathUtils.roundFloat(data.num, data.digits);
      expect(result).toEqual(expected);
    });
  });
});
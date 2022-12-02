import Color from '../src/Color.js';
import {deltaECMC, deltaE2000, deltaE1994, deltaE1976} from '../src/ColorDifference.js';

describe('CIEDE1976 color difference', () => {
  const testData = [
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 426.67945353, 72.39590835], dE: 451.7133019736 },
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 74.05216981, 276.45318193], dE: 52.6498611564 },
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 8.32281957, -73.58297716], dE: 346.0648917179 },
  ];

  testData.map((data) => {
    test('data: ' + JSON.stringify(data), () => {
      const lab1 = new Color.Lab(...data.lab1),
        lab2 = new Color.Lab(...data.lab2),
        dE = deltaE1976(lab1, lab2);
      const expected = data.dE;
      const result = parseFloat(dE.toFixed(10));
      expect(result).toEqual(expected);
    });
  });
});

describe('CIEDE1994 color difference', () => {
  const testData = [
    {
      lab1: [100.0, 21.57210357, 272.2281935],
      lab2: [100.0, 426.67945353, 72.39590835],
      textiles: true,
      dE: 88.3355530575,
    },
    {
      lab1: [100.0, 21.57210357, 272.2281935],
      lab2: [100.0, 74.05216981, 276.45318193],
      textiles: true,
      dE: 10.61265789,
    },
    {
      lab1: [100.0, 21.57210357, 272.2281935],
      lab2: [100.0, 8.32281957, -73.58297716],
      textiles: true,
      dE: 60.3686872611,
    },
    {
      lab1: [100.0, 21.57210357, 272.2281935],
      lab2: [100.0, 426.67945353, 72.39590835],
      textiles: false,
      dE: 83.7792255009,
    },
    {
      lab1: [100.0, 21.57210357, 272.2281935],
      lab2: [100.0, 74.05216981, 276.45318193],
      textiles: false,
      dE: 10.0539319546,
    },
    {
      lab1: [100.0, 21.57210357, 272.2281935],
      lab2: [100.0, 8.32281957, -73.58297716],
      textiles: false,
      dE: 57.5354537067,
    },
  ];

  testData.map((data) => {
    test('data: ' + JSON.stringify(data), () => {
      const lab1 = new Color.Lab(...data.lab1),
        lab2 = new Color.Lab(...data.lab2),
        dE = deltaE1994(lab1, lab2, data.textiles);
      const expected = data.dE;
      const result = parseFloat(dE.toFixed(10));
      expect(result).toEqual(expected);
    });
  });

  test('default option textiles', () => {
    const lab1 = new Color.Lab(100.0, 21.57210357, 272.2281935),
      lab2 = new Color.Lab(100.0, 426.67945353, 72.39590835),
      dE = deltaE1994(lab1, lab2);
    const expected = 88.3355530575;
    const result = parseFloat(dE.toFixed(10));
    expect(result).toEqual(expected);
  });
});

describe('CIEDE2000 color difference', () => {
  const testData = [
    // white / black
    { lab1: [100, 0, 0], lab2: [0, 0, 0], dE: 100 },
    // white / white
    { lab1: [100, 0, 0], lab2: [100, 0, 0], dE: 0 },

    // barely off-white #fffffe, #ffffff
    { lab1: [99.975, -0.175, 0.476], lab2: [100, 0, 0], dE: 0.5372054377464148 },

    // low chroma
    { lab1: [100, 0, 50], lab2: [100, 1, 1], dE: 23.1963586164947 },

    // normal chroma
    { lab1: [100, 100, 100], lab2: [100, 50, 50], dE: 12.248587906607298 },

    // accuracy
    { lab1: [0.9, 16.3, -2.22], lab2: [0.7, 14.2, -1.8], dE: 1.5225852571085088 },

    // Pythagoream 3,4,5 triangle
    { lab1: [50.0, 30, 40], lab2: [50.0, 0.0, 0.0], dE: 24.12185793977042 },

    // CIE2000 bug
    { lab1: [32.8911, -53.0107, -43.3182], lab2: [77.1797, 25.5928, 17.9412], dE: 78.77184579441716 },
    { lab1: [100, 21.57210357, 272.2281935], lab2: [100, 426.67945353, 72.39590835], dE: 94.03564902665948 },
    { lab1: [100, 21.57210357, 272.2281935], lab2: [100, 74.05216981, 276.45318193], dE: 14.879064193718968 },

    // avgHueDeg must be in range [0, 360]
    // Achtung: Bruce Lindbloom's formula gives an erroneous calculation of dE = 68.2309..
    // but G. Sharma's formula gives correct result of dE = 68.2311..
    { lab1: [100, 21.57210357, 272.2281935], lab2: [100, 8.32281957, -73.58297716], dE: 68.23111251060233 },

    // Sharma dE    = 45.69699725982907; avgHueDeg =   0.0224736482822 [0, 360] is Ok
    // Lindbloom dE = 45.69720390481548; avgHueDeg = 360.0224736482822 [0, 360] is not OK
    // dE Error = 0.00020664498641309592
    { lab1: [100, 0, 10], lab2: [100, 0.1, -127.5], dE: 41.69699725982907 },
  ];

  testData.map((data) => {
    test('data: ' + JSON.stringify(data), () => {
      const lab1 = new Color.Lab(...data.lab1),
        lab2 = new Color.Lab(...data.lab2);
      const expected = data.dE;
      const result = deltaE2000(lab1, lab2);
      expect(result).toEqual(expected);
    });
  });
});

describe('CIEDE2000 color difference with G. Sharma test data', () => {
  // https://colorjs.io/tests/delta.html
  // Reference test data: http://www2.ece.rochester.edu/~gsharma/ciede2000/dataNprograms/CIEDE2000.xls
  const testData = [
    { lab1: [50.0, 2.6772, -79.7751], lab2: [50.0, 0.0, -82.7485], dE: 2.0425 },
    { lab1: [50.0, 3.1571, -77.2803], lab2: [50.0, 0.0, -82.7485], dE: 2.8615 },
    { lab1: [50.0, 2.8361, -74.02], lab2: [50.0, 0.0, -82.7485], dE: 3.4412 },
    { lab1: [50.0, -1.3802, -84.2814], lab2: [50.0, 0.0, -82.7485], dE: 1 },
    { lab1: [50.0, -1.1848, -84.8006], lab2: [50.0, 0.0, -82.7485], dE: 1 },
    { lab1: [50.0, -0.9009, -85.5211], lab2: [50.0, 0.0, -82.7485], dE: 1 },
    { lab1: [50.0, 0.0, 0.0], lab2: [50.0, -1.0, 2.0], dE: 2.3669 },
    { lab1: [50.0, -1.0, 2.0], lab2: [50.0, 0.0, 0.0], dE: 2.3669 },
    { lab1: [50.0, 2.49, -0.001], lab2: [50.0, -2.49, 0.0009], dE: 7.1792 },
    { lab1: [50.0, 2.49, -0.001], lab2: [50.0, -2.49, 0.001], dE: 7.1792 },
    { lab1: [50.0, 2.49, -0.001], lab2: [50.0, -2.49, 0.0011], dE: 7.2195 },
    { lab1: [50.0, 2.49, -0.001], lab2: [50.0, -2.49, 0.0012], dE: 7.2195 },
    { lab1: [50.0, -0.001, 2.49], lab2: [50.0, 0.0009, -2.49], dE: 4.8045 },
    { lab1: [50.0, -0.001, 2.49], lab2: [50.0, 0.001, -2.49], dE: 4.8045 },
    { lab1: [50.0, -0.001, 2.49], lab2: [50.0, 0.0011, -2.49], dE: 4.7461 },
    { lab1: [50.0, 2.5, 0.0], lab2: [50.0, 0.0, -2.5], dE: 4.3065 },
    { lab1: [50.0, 2.5, 0.0], lab2: [73.0, 25.0, -18.0], dE: 27.1492 },
    { lab1: [50.0, 2.5, 0.0], lab2: [61.0, -5.0, 29.0], dE: 22.8977 },
    { lab1: [50.0, 2.5, 0.0], lab2: [56.0, -27.0, -3.0], dE: 31.903 },
    { lab1: [50.0, 2.5, 0.0], lab2: [58.0, 24.0, 15.0], dE: 19.4535 },
    { lab1: [50.0, 2.5, 0.0], lab2: [50.0, 3.1736, 0.5854], dE: 1 },
    { lab1: [50.0, 2.5, 0.0], lab2: [50.0, 3.2972, 0.0], dE: 1 },
    { lab1: [50.0, 2.5, 0.0], lab2: [50.0, 1.8634, 0.5757], dE: 1 },
    { lab1: [50.0, 2.5, 0.0], lab2: [50.0, 3.2592, 0.335], dE: 1 },
    { lab1: [60.2574, -34.0099, 36.2677], lab2: [60.4626, -34.1751, 39.4387], dE: 1.2644 },
    { lab1: [63.0109, -31.0961, -5.8663], lab2: [62.8187, -29.7946, -4.0864], dE: 1.263 },
    { lab1: [61.2901, 3.7196, -5.3901], lab2: [61.4292, 2.248, -4.962], dE: 1.8731 },
    { lab1: [35.0831, -44.1164, 3.7933], lab2: [35.0232, -40.0716, 1.5901], dE: 1.8645 },
    { lab1: [22.7233, 20.0904, -46.694], lab2: [23.0331, 14.973, -42.5619], dE: 2.0373 },
    { lab1: [36.4612, 47.858, 18.3852], lab2: [36.2715, 50.5065, 21.2231], dE: 1.4146 },
    { lab1: [90.8027, -2.0831, 1.441], lab2: [91.1528, -1.6435, 0.0447], dE: 1.4441 },
    { lab1: [90.9257, -0.5406, -0.9208], lab2: [88.6381, -0.8985, -0.7239], dE: 1.5381 },
    { lab1: [6.7747, -0.2908, -2.4247], lab2: [5.8714, -0.0985, -2.2286], dE: 0.6377 },
    { lab1: [2.0776, 0.0795, -1.135], lab2: [0.9033, -0.0636, -0.5514], dE: 0.9082 },
  ];
  // the result must be rounded to 4 digits for expected dE from reference test data
  const digits = 4;

  testData.map((data) => {
    test('data: ' + JSON.stringify(data), () => {
      const lab1 = new Color.Lab(...data.lab1),
        lab2 = new Color.Lab(...data.lab2),
        dE = deltaE2000(lab1, lab2);
      const expected = data.dE;
      const result = parseFloat(dE.toFixed(digits));
      expect(result).toEqual(expected);
    });
  });
});

describe('CMC color difference', () => {
  const testData = [
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 426.67945353, 72.39590835], l: 2, dE: 172.7047712866 },
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 74.05216981, 276.45318193], l: 2, dE: 20.5973271674 },
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 8.32281957, -73.58297716], l: 2, dE: 121.7184147912 },
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 426.67945353, 72.39590835], l: 1, dE: 172.7047712866 },
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 74.05216981, 276.45318193], l: 1, dE: 20.5973271674 },
    { lab1: [100.0, 21.57210357, 272.2281935], lab2: [100.0, 8.32281957, -73.58297716], l: 1, dE: 121.7184147912 },
  ];

  testData.map((data) => {
    test('data: ' + JSON.stringify(data), () => {
      const lab1 = new Color.Lab(...data.lab1),
        lab2 = new Color.Lab(...data.lab2),
        dE = deltaECMC(lab1, lab2, data.l);
      const expected = data.dE;
      const result = parseFloat(dE.toFixed(10));
      expect(result).toEqual(expected);
    });
  });

  test('default option l', () => {
    const lab1 = new Color.Lab(100.0, 21.57210357, 272.2281935),
      lab2 = new Color.Lab(100.0, 426.67945353, 72.39590835),
      dE = deltaECMC(lab1, lab2);
    const expected = 172.7047712866;
    const result = parseFloat(dE.toFixed(10));
    expect(result).toEqual(expected);
  });
});
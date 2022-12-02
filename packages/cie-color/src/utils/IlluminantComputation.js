import { Chromaticity } from '../data/Illuminant.js';
import Color from '../Color.js';

const xyToXYZ = function (x, y, digits) {
  const Yxy = new Color.Yxy(1, x, y);
  let { X, Y, Z } = Yxy.toXyz();

  if (digits > 1) {
    X = parseFloat(X.toFixed(digits)) + 0;
    Y = parseFloat(Y.toFixed(digits)) + 0;
    Z = parseFloat(Z.toFixed(digits)) + 0;
  }

  return { X, Y, Z };
};

const computeWhitepointXYZ = function (observer = 2, digits = 5) {
  const data = Chromaticity[observer];

  let whitepoint = {},
    whitepointKey,
    xy;

  for (whitepointKey in data) {
    xy = data[whitepointKey];
    whitepoint[whitepointKey] = xyToXYZ(xy[0], xy[1], digits);
  }

  return whitepoint;
};

export { computeWhitepointXYZ };
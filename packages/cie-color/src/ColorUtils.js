import { clamp } from '@webdiscus/math-utils';
import { Chromaticity, Illuminant, IlluminantMethod } from './data/Illuminant.js';
import { invertMatrix, linearTransform, roundMatrix } from './ColorMatrix.js';

/**
 * Convert chromaticity coordinates x,y to XYZ values, normalized by Y=1.
 *
 * @param {number} x
 * @param {number} y
 * @return {[number, number, number]}
 */
export const xyToXYZ = (x, y) => [x / y, 1, (1 - x - y) / y];

/**
 * @typedef {Object} MetaWhitepoint
 * @property {string?} illuminant The illuminant name. Can be undefined if xy is defined.
 *  Available values: A, B, C, D50, D55, D65, D75, E, F1..F12.
 * @property {number?} observer The standard observer degrees. Can be undefined if xy is defined. Values: 2 or 10.
 * @property {[x: number, y: number]|null?} xy The chromaticity coordinates of whitepoint.
 *   Can be undefined if illuminant and observer are defined.
 *   If xy is null when XYZ values will be calculated from CIE constant coordinates defined by illuminant and observer.
 * @property {string?} method The method how is XYZ calculated. Values see in IlluminantMethod.
 */

/**
 * Get whitepoint tristimulus by xy chromaticity coordinates or illuminant and standard observer degrees.
 *
 * @param {MetaWhitepoint} metaWhitepoint
 * @return {Tristimulus} The XYZ values in range [0.0, 1.x] by Y = 1.
 */
export const getWhitepoint = function ({
  illuminant = 'D65',
  observer = 2,
  xy = null,
  method = IlluminantMethod.IEC_61966,
}) {
  if (method === IlluminantMethod.ASTM_E308) return Illuminant[observer][illuminant];

  const [x, y] = xy ? xy : Chromaticity[observer][illuminant];

  return xyToXYZ(x, y);
};

/**
 * Whether is valid hex color value.
 *
 * @param {string} hex A string that contains the hexadecimal (A)RGB color representation.
 * @return {boolean}
 */
export const isHexColor = (hex) => /(^[0-9A-F]{3,4}$)|(^[0-9A-F]{6}$)|(^[0-9A-F]{8}$)/i.test(hex.replace('#', ''));

/**
 * Convert hex color string to a RGBA values.
 *
 * A hexadecimal color code can be 3, 4, 6, or 8 digits with an optional "#" prefix.
 *
 * Note: the fully expanded color description is of the format, RRGGBBAA.
 * The first pair specifies the red channel.
 * The second pair specifies the green channel.
 * The third pair specifies the blue channel.
 * The final pair of hexadecimal digits specifies the alpha channel.
 *
 * The 3 digits specifies a RGB doublet data as a fully opaque color.
 * For example, "#123" specifies the color that is represented by "#112233".
 *
 * The 4 digits specifies a RGB doublet data with the last digit as the alpha channel.
 * For example, "#123A" specifies the color that is represented by "#112233AA".
 *
 * The 6 digits specifies a fully opaque color.
 * For example, "#112233".
 *
 * The 8 digits completely specifies the red, green, blue, and alpha channels.
 * For example, "#112233AA".
 *
 * @param {string} hex A string that contains the hexadecimal RGB(A) color representation.
 * @param {null|number?} digits The is number of digits after the decimal point to which the value is rounded
 *   at scale the decimal values from range [0, 255] in [0, 1]. Defaults used max possible precision.
 * @return {[number, number, number, number]} The red, green, blue and alpha values.
 */
export const hexToRgba = function (hex, digits = null) {
  let rgb;
  hex = hex.replace('#', '');

  if (3 === hex.length || 4 === hex.length) {
    rgb = /^(.)(.)(.)(.)?$/
      .exec(hex)
      .slice(1, 5)
      .map(function (a) {
        return a ? a + a : 'ff';
      });
  } else if (6 === hex.length || 8 === hex.length) {
    rgb = /^(..)(..)(..)(..)?$/.exec(hex).slice(1, 5);
    if (null == rgb[3]) rgb[3] = 'ff';
  } else throw Error('Invalid hex color string: ' + hex);

  // Note: the input RGB values must be scaled from range [0, 255] to [0, 1] by divide each value by 255.
  let red = parseInt(rgb[0], 16) / 255,
    green = parseInt(rgb[1], 16) / 255,
    blue = parseInt(rgb[2], 16) / 255,
    alpha = parseInt(rgb[3], 16) / 255;

  // The precision of serialized RGB values must contain at least 2 decimal places, which must be rounded towards +.
  // For example, rgb(146.064 107.457 131.223) conforms serialized string "rgb(146.06, 107.46, 131.2)"
  // @see https://www.w3.org/TR/css-color-4/#serializing-sRGB-values
  // @see https://www.w3.org/TR/css-color-4/#serializing-alpha-values
  if (digits > 0) {
    red = +red.toFixed(digits);
    green = +green.toFixed(digits);
    blue = +blue.toFixed(digits);
    alpha = +alpha.toFixed(digits);
  }

  return [red, green, blue, alpha];
};

/**
 * Convert hex color string to RGB values.
 *
 * todo This function is reserved for feature.
 *
 * A hexadecimal color code can be 3 or 6 digits with an optional "#" prefix.
 *
 * The 3 digits specifies a RGB doublet data as a fully opaque color.
 * For example, "#123" specifies the color that is represented by "#112233".
 *
 * The 6 digits specifies a fully opaque color.
 * For example, "#112233".
 *
 * @param {string} hex A string that contains the hexadecimal RGB color representation.
 * @return {[number, number, number]} The red, green, blue values in range [0, 255] .
 */
export const hexToRgb = function (hex) {
  let [, color] = /([a-f\d]{3,6})/i.exec(hex) || [];
  const len = color ? color.length : 0;

  if (len === 3) {
    color = color[0] + color[0] + color[1] + color[1] + color[2] + color[2];
  } else if (len !== 6) {
    return [0, 0, 0];
  }

  const num = parseInt(color, 16);

  return [(num >> 16) & 0xff, (num >> 8) & 0xff, num & 0xff];
};

/**
 * Convert the wavelength of monochromatic light to the CIE XYZ color space.
 *
 * todo This function is reserved for feature.
 *
 * @param {number} lambda The wavelength nm, in range [380, 780].
 * @return {[number, number, number]} The XYZ values.
 */
const fromWavelength = function (lambda) {
  const gaussian = (x, a, m, s1, s2) => {
    const t = (x - m) / (x < m ? s1 : s2);
    return a * Math.exp(-(t * t) / 2);
  };

  lambda = clamp(lambda, 380, 780);

  const X =
      gaussian(lambda, 1.056, 5998, 379, 310) +
      gaussian(lambda, 0.362, 4420, 160, 267) +
      gaussian(lambda, -0.065, 5011, 204, 262),
    Y = gaussian(lambda, 0.821, 5688, 469, 405) + gaussian(lambda, 0.286, 5309, 163, 311),
    Z = gaussian(lambda, 1.217, 4370, 118, 360) + gaussian(lambda, 0.681, 4590, 260, 138);

  return [X, Y, Z];
};

/**
 * Calculate transform 3x3 matrices between RGB space and CIE 1931 XYZ values.
 * @note The matrices are relative to origin illuminant. For transform in other illuminant use chromatic adaptation.
 *
 * @param {[Matrix1x3, Matrix1x3, Matrix1x3]} primary The XYZ values for each whitepoint component: XYZr, XYZg, XYZb.
 * @param {[number, number, number]} whitepoint The XYZ values of reference whitepoint.
 * @param {number} digits The rounding accuracy to decimal point, in range [4, 20].
 *   If digits is not defined or is < 0, then don't round the values.
 * @return {{toRgb: Matrix3x3, toXyz: Matrix3x3}}
 */
export const makeTransformMatrices = function (primary, whitepoint, digits = -1) {
  const [[Xr, Yr, Zr], [Xg, Yg, Zg], [Xb, Yb, Zb]] = primary,
    inverseMatrix = invertMatrix([
      [Xr, Xg, Xb],
      [Yr, Yg, Yb],
      [Zr, Zg, Zb],
    ]),
    [Sr, Sg, Sb] = linearTransform(inverseMatrix, whitepoint);

  let toXyz = [
      [Sr * Xr, Sg * Xg, Sb * Xb],
      [Sr * Yr, Sg * Yg, Sb * Yb],
      [Sr * Zr, Sg * Zg, Sb * Zb],
    ],
    toRgb = invertMatrix(toXyz);

  if (digits > 3) {
    toXyz = roundMatrix(toXyz, digits);
    toRgb = roundMatrix(toRgb, digits);
  }

  return {
    toXyz,
    toRgb,
  };
};
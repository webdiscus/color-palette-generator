import { clamp } from '@webdiscus/math-utils';
import { invertMatrix, linearTransform, multiplyMatrices, roundMatrix } from './ColorMatrix.js';
import { xyToXYZ, getWhitepoint, makeTransformMatrices } from './ColorUtils.js';
import { Illuminant } from './data/Illuminant.js';
import { ChromaticAdaptation } from './ChromaticAdaptation.js';

import * as RgbColorSpaces from './RgbColorSpaces.js';

/**
 * @typedef {Object} TransferFunction The transfer functions.
 * @property {(function(number): number)} toGamma The electro-optical conversion function (EOCF).
 *   Applying the color component transfer function defines the conversion
 *   from radiometrically linear values to gamma corrected color component values.
 *   For negative values, linear portion extends on reflection of axis, then uses reflected power.
 * @property {(function(number): number)} toLinear The opto-electronic conversion function (OECF).
 *   The inverse color component transfer function defines the conversion
 *   from gamma corrected color component values to radiometrically linear values.
 *   For negative values, linear portion extends on reflection of axis, then uses reflected power.
 */

/**
 * The chromaticity coordinates of RGB primaries.
 * @typedef {[rx: number, ry: number, gx: number, gy: number, bx: number, by: number]} RGBPrimary
 */

/**
 * @param {string} illuminant
 */
const validateIlluminant = (illuminant) => {
  if (illuminant && !Illuminant[2][illuminant])
    throw Error(`Invalid illuminant type: ${illuminant}. Available: ${Object.keys(Illuminant[2]).join(', ')}`);
};

/**
 * The abstract RGB color space.
 */
class RgbSpace {
  /**
   * @param {RGBPrimary} primaries The chromaticity coordinates of RGB primaries.
   * @param {MetaWhitepoint} metaWhitepoint The meta whitepoint of RGB color space.
   * @param {TransferFunction} transferFunctions The transfer functions.
   * @param {{toRgb: Matrix3x3, toXyz: Matrix3x3}|null} transform The transform matrices.
   *   If transform matrices not defined then they will be lazy generated.
   */
  constructor([rx, ry, gx, gy, bx, by], metaWhitepoint, transferFunctions, transform = null) {
    const self = this;

    self.primary = [xyToXYZ(rx, ry), xyToXYZ(gx, gy), xyToXYZ(bx, by)];
    self.whitepoint = getWhitepoint(metaWhitepoint);
    self.illuminant = metaWhitepoint.illuminant;
    self.toGamma = transferFunctions.toGamma;
    self.toLinear = transferFunctions.toLinear;
    self.transform = transform;
  }

  /**
   * Apply gamma correction to linear RGB values.
   *
   * @param {[number, number, number]} rgb
   * @return {[number, number, number]}
   */
  applyGamma([r, g, b]) {
    const gamma = this.toGamma;
    return [clamp(gamma(r), 0, 1), clamp(gamma(g), 0, 1), clamp(gamma(b), 0, 1)];
  }

  /**
   * Inverse gamma correction from RGB values.
   *
   * @param {[number, number, number]} rgb
   * @return {[number, number, number]}
   */
  invertGamma([r, g, b]) {
    const linear = this.toLinear;
    return [linear(r), linear(g), linear(b)];
  }

  /**
   * Convert values from XYZ to RGB color space.
   *
   * @param {[number, number, number]} xyz The XYZ tristimulus.
   * @param {string} illuminant The illuminant type of whitepoint of source XYZ color space.
   * @return {[number, number, number]}
   */
  toRgb(xyz, illuminant = '') {
    validateIlluminant(illuminant);

    if (illuminant && illuminant !== this.illuminant) {
      xyz = ChromaticAdaptation.adapt(xyz, illuminant, this.illuminant);
    }

    const transformMatrix = this.getTransformMatrix('toRgb'),
      rgb = linearTransform(transformMatrix, xyz);

    return this.applyGamma(rgb);
  }

  /**
   * Convert values from RGB to XYZ color space.
   *
   * @param {[number, number, number]} rgb The RGB tristimulus.
   * @param {string} illuminant The illuminant type of whitepoint of destination XYZ color space.
   *   Defaults is same as illuminant type of RGB space.
   * @return {[number, number, number]}
   */
  toXyz(rgb, illuminant = '') {
    validateIlluminant(illuminant);

    const transformMatrix = this.getTransformMatrix('toXyz'),
      invertRgb = this.invertGamma(rgb);

    let xyz = linearTransform(transformMatrix, invertRgb);

    if (illuminant && illuminant !== this.illuminant) {
      xyz = ChromaticAdaptation.adapt(xyz, this.illuminant, illuminant);
    }

    return xyz;
  }

  /**
   * Converts from current RGB color space to output RGB color space using given chromatic adaptation method.
   *
   * @param {[number, number, number]} rgb The RGB tristimulus.
   * @param {string} space The output RGB color space.
   * @param {string} catMethod The chromatic adaptation transform method.
   *   Values: 'XYZScaling', 'vonkries', 'bradford', 'cat02', 'cat016'.
   * @return {[number, number, number]}
   */
  toRgbSpace(rgb, space, catMethod = 'cat02') {
    const outputColorspace = RgbColorSpaces[space];

    const srcWhitepoint = this.whitepoint,
      dstWhitepoint = outputColorspace.whitepoint,
      catMatrix = ChromaticAdaptation.getMatrix(srcWhitepoint, dstWhitepoint, catMethod),
      inputRgbToXyzMatrix = this.getTransformMatrix('toXyz'),
      outputXyzToRgbMatrix = outputColorspace.getTransformMatrix('toRgb');

    let matrix = multiplyMatrices(catMatrix, inputRgbToXyzMatrix);
    matrix = multiplyMatrices(outputXyzToRgbMatrix, matrix);

    return linearTransform(matrix, rgb);
  }

  /**
   * Get transform matrix between RGB space and CIE 1931 XYZ values.
   *
   * Note:
   * The original definition of sRGB standard 1996 has a small numerical error caused by rounding to 4 decimal places.
   * The normative definition of sRGB standard IEC 61966-2-1:1999 has the rounding to 8 decimal places.
   * For web (8-bits/channel) is enough the precision with 4 decimal points, but for image use minimum 7 decimal points.
   * In this matrix used the whitepoint calculated directly from chromaticity coordinates by IEC 61966-2-1 standard.
   * See https://github.com/w3c/csswg-drafts/issues/5922
   *
   * @param {string} type The type of transform matrix. Values: 'toXyz', 'toRgb'.
   * @param {number} [digits=8] The number of digits after the decimal points, in range [4, 20].
   *   The minimal precision by sRGB 1996 standard is 4 digits.
   *   The actual sRGB standard has the precision with 8 decimal points.
   *   Use -1 to avoid the rounding.
   * @return {Matrix3x3} The transform matrix 3x3.
   */
  getTransformMatrix(type, digits = 8) {
    if (!this.transform || !this.transform[type]) {
      this.transform = makeTransformMatrices(this.primary, this.whitepoint, digits);
    }

    return this.transform[type];
  }
}

export { RgbSpace };
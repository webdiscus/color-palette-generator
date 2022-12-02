import { linearTransform, invertMatrix, multiplyMatrices, roundMatrix } from './ColorMatrix.js';
import Color from './Color.js';

// Chromatic Adaptation Transforms (CAT).
const CAT = {
  // XYZ scaling
  XYZScaling: [
    [1.0, 0.0, 0.0],
    [0.0, 1.0, 0.0],
    [0.0, 0.0, 1.0],
  ],
  // von Kries, see http://brucelindbloom.com/Eqn_ChromAdapt.html
  vonkries: [
    [0.40024, 0.7076, -0.08081],
    [-0.2263, 1.16532, 0.0457],
    [0.0, 0.0, 0.91822],
  ],
  // Bradford, see http://brucelindbloom.com/Eqn_ChromAdapt.html
  bradford: [
    [0.8951, 0.2664, -0.1614],
    [-0.7502, 1.7135, 0.0367],
    [0.0389, -0.0685, 1.0296],
  ],
  // CAT02, see https://en.wikipedia.org/wiki/CIECAM02#CAT02
  cat02: [
    [0.7328, 0.4296, -0.1624],
    [-0.7036, 1.6975, 0.0061],
    [0.003, 0.0136, 0.9834],
  ],
  // CAT16, see https://observablehq.com/@jrus/cam16
  cat16: [
    [0.401288, 0.650173, -0.051461],
    [-0.250268, 1.204414, 0.045854],
    [-0.002079, 0.048952, 0.953127],
  ],
};

// The cache of computed adaptation matrices.
let cache = {};

class ChromaticAdaptation {
  /**
   * Chromatic adaptation transform the tristimulus values from one illuminant to another illuminant.
   * E.g. transform XYZ values from CIE 1931 D50 illuminant to CIE 1931 D65 illuminant.
   *
   * @param {[number, number, number]} values The tristimulus values.
   * @param {string} srcIlluminant The source CIE illuminant. Available values:
   *   A, B, C, D50, D55, D65, D75, E, F1..F12.
   * @param {string} dstIlluminant The destination CIE illuminant. Available values:
   *   A, B, C, D50, D55, D65, D75, E, F1..F12.
   * @param {string} [method=bradford] The chromatic adaptation transform method.
   *   Values: 'XYZScaling', 'vonkries', 'bradford', 'cat02', 'cat016'.
   * @return {[number, number, number]}
   */
  static adapt(values, srcIlluminant, dstIlluminant, method = 'bradford') {
    const matrix = this.getMatrix({ illuminant: srcIlluminant }, { illuminant: dstIlluminant }, method);

    return linearTransform(matrix, values);
  }

  /**
   * Get the chromatic adaptation transform matrix.
   * Note: the matrix is created lazily only if it is not in the cache.
   *
   * @param {MetaWhitepoint} srcMetaWhitepoint The source whitepoint.
   * @param {MetaWhitepoint} dstMetaWhitepoint The destination whitepoint.
   * @param {string} [method=bradford] The chromatic adaptation transform method.
   *   Values: 'XYZScaling', 'vonkries', 'bradford', 'cat02', 'cat016'.
   * @return {Matrix3x3} The adaptation matrix.
   */
  static getMatrix(srcMetaWhitepoint, dstMetaWhitepoint, method = 'bradford') {
    const { illuminant: srcIlluminant, observer: srcObserver = 2 } = srcMetaWhitepoint,
      { illuminant: dstIlluminant, observer: dstObserver = 2 } = dstMetaWhitepoint,
      cacheKey = `from${srcObserver}${srcIlluminant}To${dstObserver}${dstIlluminant}`;

    if (cache.hasOwnProperty(cacheKey)) return cache[cacheKey];

    const srcWhitepoint = Color.getWhitepoint(srcMetaWhitepoint),
      dstWhitepoint = Color.getWhitepoint(dstMetaWhitepoint),
      adaptMatrix = this.makeMatrix(srcWhitepoint, dstWhitepoint, method);

    return (cache[cacheKey] = adaptMatrix);
  }

  /**
   * Add the new chromatic adaptation transform matrix.
   *
   * @param {string} method
   * @param {Matrix3x3} matrix
   */
  static addMatrix(method, matrix) {
    if (this.hasMatrix(method)) throw new Error(`The CAT matrix with type '${method}' is exist.`);
    CAT[method] = matrix;
  }

  /**
   * @param {string} type
   * @return {boolean}
   */
  static hasMatrix(type) {
    return CAT.hasOwnProperty(type);
  }

  /**
   * Computes the chromatic adaptation transform 3x3 matrix from one whitepoint to another.
   * @see https://www.babelcolor.com/index_htm_files/A%20review%20of%20RGB%20color%20spaces.pdf A Review of RGB Color Spaces, p.16
   *
   * @param {[X: number, Y: number, Z: number]} srcWhitepoint The source whitepoint as XYZ values.
   * @param {[X: number, Y: number, Z: number]} dstWhitepoint The destination whitepoint as XYZ values.
   * @param {string} method The chromatic adaptation transform method.
   *   Values: 'XYZScaling', 'vonkries', 'bradford', 'cat02', 'cat016'.
   * @return {Matrix3x3} The adaptation matrix.
   */
  static makeMatrix(srcWhitepoint, dstWhitepoint, method = 'bradford') {
    const catMatrix = CAT[method],
      // inverse matrix should not be rounded to match this matrix
      // with calculated matrix in http://www.brucelindbloom.com/index.html?Eqn_ChromAdapt.html
      inverseCatMatrix = invertMatrix(catMatrix),
      // inverse matrix should be rounded exact to 7 digits
      // to match this matrix with calculated matrix in function D65_to_D50(XYZ),
      // see https://drafts.csswg.org/css-color-4/#color-conversion-code,
      //inverseCatMatrix = roundMatrix(invertMatrix(catMatrix), 7),
      [Rsw, Gsw, Bsw] = linearTransform(catMatrix, srcWhitepoint),
      [Rdw, Gdw, Bdw] = linearTransform(catMatrix, dstWhitepoint),
      diagonalMatrix = [
        [Rdw / Rsw, 0, 0],
        [0, Gdw / Gsw, 0],
        [0, 0, Bdw / Bsw],
      ],
      matrix = multiplyMatrices(diagonalMatrix, catMatrix);

    return multiplyMatrices(inverseCatMatrix, matrix);
  }
}

export { ChromaticAdaptation };

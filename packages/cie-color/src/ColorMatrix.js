import { roundFloat } from '@webdiscus/math-utils';

/**
 * @typedef {[number, number, number]} Matrix1x3
 */

/**
 * @typedef {[[number, number, number], [number, number, number], [number, number, number]]} Matrix3x3
 */

/**
 * The linear transformation is multiplying the matrix 3x3 by the vector 1x3.
 *
 * @param {Matrix3x3} a The matrix 3x3.
 * @param {Matrix1x3} v The vector 1x3.
 * @return {number[]} The 1x3 result of multiply matrix and vector.
 */
const linearTransform = (a, v) => [
  a[0][0] * v[0] + a[0][1] * v[1] + a[0][2] * v[2],
  a[1][0] * v[0] + a[1][1] * v[1] + a[1][2] * v[2],
  a[2][0] * v[0] + a[2][1] * v[1] + a[2][2] * v[2],
];

/**
 * Multiply two matrices 3x3.
 * Used by chromatic adaptation.
 *
 * @param {Matrix3x3} a The matrix 3x3.
 * @param {Matrix3x3} b The matrix 3x3.
 * @return {Matrix3x3} The 3x3 result of multiply two matrices.
 */
const multiplyMatrices = (a, b) => [
  [
    a[0][0] * b[0][0] + a[0][1] * b[1][0] + a[0][2] * b[2][0],
    a[0][0] * b[0][1] + a[0][1] * b[1][1] + a[0][2] * b[2][1],
    a[0][0] * b[0][2] + a[0][1] * b[1][2] + a[0][2] * b[2][2],
  ],
  [
    a[1][0] * b[0][0] + a[1][1] * b[1][0] + a[1][2] * b[2][0],
    a[1][0] * b[0][1] + a[1][1] * b[1][1] + a[1][2] * b[2][1],
    a[1][0] * b[0][2] + a[1][1] * b[1][2] + a[1][2] * b[2][2],
  ],
  [
    a[2][0] * b[0][0] + a[2][1] * b[1][0] + a[2][2] * b[2][0],
    a[2][0] * b[0][1] + a[2][1] * b[1][1] + a[2][2] * b[2][1],
    a[2][0] * b[0][2] + a[2][1] * b[1][2] + a[2][2] * b[2][2],
  ],
];

/**
 * Invert matrix 3x3.
 *
 * @param {Matrix3x3} a The matrix 3x3.
 * @return {Matrix3x3}
 */
const invertMatrix = (a) => {
  const detA =
      a[0][0] * (a[2][2] * a[1][1] - a[2][1] * a[1][2]) -
      a[1][0] * (a[2][2] * a[0][1] - a[2][1] * a[0][2]) +
      a[2][0] * (a[1][2] * a[0][1] - a[1][1] * a[0][2]),
    invertDetA = 1 / detA;

  return [
    [
      invertDetA * (a[2][2] * a[1][1] - a[2][1] * a[1][2]),
      -invertDetA * (a[2][2] * a[0][1] - a[2][1] * a[0][2]),
      invertDetA * (a[1][2] * a[0][1] - a[1][1] * a[0][2]),
    ],
    [
      -invertDetA * (a[2][2] * a[1][0] - a[2][0] * a[1][2]),
      invertDetA * (a[2][2] * a[0][0] - a[2][0] * a[0][2]),
      -invertDetA * (a[1][2] * a[0][0] - a[1][0] * a[0][2]),
    ],
    [
      invertDetA * (a[2][1] * a[1][0] - a[2][0] * a[1][1]),
      -invertDetA * (a[2][1] * a[0][0] - a[2][0] * a[0][1]),
      invertDetA * (a[1][1] * a[0][0] - a[1][0] * a[0][1]),
    ],
  ];
};

/**
 * Float round matrix values.
 *
 * @param {Matrix3x3} a The matrix 3x3.
 * @param {number} [digits=0] The precision for rounding of float values after the decimal point, in range [0, 20].
 *   If digits is -1, then return matrix w/o rounding.
 * @return {Matrix3x3}
 */
const roundMatrix = (a, digits = 0) =>
  digits < 0
    ? a
    : [
        [roundFloat(a[0][0], digits), roundFloat(a[0][1], digits), roundFloat(a[0][2], digits)],
        [roundFloat(a[1][0], digits), roundFloat(a[1][1], digits), roundFloat(a[1][2], digits)],
        [roundFloat(a[2][0], digits), roundFloat(a[2][1], digits), roundFloat(a[2][2], digits)],
      ];

export { linearTransform, multiplyMatrices, invertMatrix, roundMatrix };
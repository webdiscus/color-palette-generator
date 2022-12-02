/**
 * Usage
 *
 * Import all functions under the namespace:
 * <pre>
 *   import * as MathUtils from './MathUtils';
 *   MathUtils.isHex('#fff');
 *   MathUtils.roundFloat(1.3555, 3);
 * </pre>
 *
 * Import one or more function w/o a namespace:
 * <pre>
 *   import { isHex, roundFloat } from './MathUtils';
 *   isHex('#fff');
 *   roundFloat(1.3555, 3);
 * </pre>
 *
 * @type {number}
 */

// The degrees to radians conversion constant, 1 degrees is PI / 180 radians.
export const DEG2RAD = Math.PI / 180;
// The radians to degrees conversion constant, 1 radian is 180 / PI degrees.
export const RAD2DEG = 180 / Math.PI;

/**
 * Whether the number is odd.
 *
 * @param {number} num
 * @return {boolean}
 */
export const isOdd = (num) => (num & 1) === 1;

/**
 * Whether the number is even.
 *
 * @param {number} num
 * @return {boolean}
 */
export const isEven = (num) => (num & 1) === 0;

/**
 * Determines whether the value is hex string.
 *
 * @param {string} value
 * @return {boolean}
 */
export const isHex = (value) => /^[a-fA-F0-9]+$/.test(value);

/**
 * Whether the number is in the range.
 *
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @return {boolean}
 */
export const inRange = (num, min, max) => min <= num && num <= max;

/**
 * Whether the number is in a range from the range list.
 * Usage: inRanges(charCode, [0, 5], [30, 40], [90, 99], ...).
 *
 * @param {number} num
 * @param {...[number, number]} ranges The list of ranges, e.g.: `[0, 10], [80, 99]`.
 * @returns {boolean}
 */
export const inRanges = (num, ...ranges) => {
  let i;
  for (i in ranges) {
    if (ranges[i][0] <= num && num <= ranges[i][1]) return true;
  }
  return false;
};

/**
 * Clamp a number within the inclusive range specified by min and max.
 * @note: The ternary operator is a tick quicker than Math.min(Math.max(num, min), max).
 *
 * @param {number} num
 * @param {number} min
 * @param {number} max
 * @returns {number} The number if is between min - max, or min/max.
 */
export const clamp = (num, min, max) => (min > num ? min : num > max ? max : num);

/**
 * Find the maximum value of an array.
 *
 * Performance:
 * <pre>
 *   Firefox - Math.min.apply(null, arr) is x4 faster than Math.min(...arr)
 *   Chrome  - Math.min.apply(null, arr) is x0.1 slow than Math.min(...arr)
 * </pre>
 *
 * @param {[]} arr
 * @return {number}
 */
export const minOfArray = (arr) => Math.min.apply(null, arr);

/**
 * Find the minimal value of an array.
 *
 * Performance:
 * <pre>
 *   Firefox - Math.max.apply(null, arr) is x4 faster than Math.max(...arr)
 *   Chrome  - Math.max.apply(null, arr) is x0.1 slow than Math.max(...arr)
 * </pre>
 *
 * @param {[]} arr
 * @return {number}
 */
export const maxOfArray = (arr) => Math.max.apply(null, arr);

/**
 * Convert the hex string to decimal.
 *
 * @param {string} hex
 * @return {number}
 */
export const hexToDec = (hex) => {
  if (!isHex(hex)) throw Error('Invalid hex string: ' + hex);
  return parseInt(hex, 16);
};

/**
 * Convert the decimal to hex string.
 *
 * @param {number} num
 * @return {string}
 */
export const decToHex = (num) => {
  let hex = num.toString(16);
  return 2 <= hex.length ? hex : '0' + hex;
};

/**
 * Convert the string to number.
 * If argument is NaN then return 0.
 *
 * @param {string} value
 * @returns {number}
 */
export const toNumber = (value) => parseInt(value, 10) || 0;

/**
 * Formats the numbers as a string with thousands separators.
 *
 * Note: the negative lookbehind assertion `(?<!y)x` in regex not supported in safari.
 * Don't use some like this /\B(?<!\.\d*)(?=(\d{3})+(?!\d))/g.
 *
 * @param {number} num
 * @param {string} [separator = ',']
 * @return {string}
 */
export const numberFormat = (num, separator = ',') =>
    num.toString().replace(/(\d)(?=(\d{3})+(?!\d))/g, `$1${separator}`);

/**
 * @typedef {Object} IntlFormatOptions
 * @property {string} [locales = 'en-US']  A locale identifier, see http://www.lingoes.net/en/translator/langcode.htm.
 * @property {string} [style = 'decimal'] The formatting style to use.
 *
 *   - "decimal" for plain number formatting
 *   - "currency" for currency formatting
 *   - "percent" for percent formatting
 *   - "unit" for unit formatting
 */

/**
 * Formats a number according to the locale and formatting option - style.
 * @see https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/Global_Objects/Intl/NumberFormat/NumberFormat
 *
 * @param {number} num
 * @param {IntlFormatOptions} options
 * @return {string}
 */
export const intlNumberFormat = (num, {locales = 'en-US', style = 'decimal'} = {}) =>
    new Intl.NumberFormat(locales, {style: style}).format(num);

/**
 * Converts radians to degrees.
 *
 * @param {number} radians
 * @returns {number}
 */
export const radToDeg = (radians) => radians * RAD2DEG;
/**
 * Converts degrees to radians.
 *
 * @param {number} degrees
 * @returns {number}
 */
export const degToRad = (degrees) => degrees * DEG2RAD;

/**
 * Convert point coordinate to angle between [x,0] and [x,y].
 * Note: The 0/360 point is at 3 hour of clock.
 *
 * @param {number} x
 * @param {number} y
 * @param {boolean} [clockwise=false] The direction in degrees, if true, then clockwise otherwise anticlockwise.
 * @returns {number} The degrees in range [0, 360].
 */
export const pointToDeg = (x, y, clockwise = false) => {
  let sign = clockwise ? 1 : -1,
      deg = Math.atan2(sign * y, x) * RAD2DEG;

  return 0 > deg ? deg + 360 : deg;
};

/**
 * Convert polar coordinates to cartesian coordinates.
 * @see https://en.wikipedia.org/wiki/Polar_coordinate_system
 *
 * @param {number} magnitude The radius.
 * @param {number} angle The angle in degrees.
 * @param {?number} [x=0] The offset by axis x.
 * @param {?number} [y=0] The offset by axis y.
 * @return {{x: {number}, y: {number}}}
 */
export const polarToCart = (magnitude, angle, x = 0, y = 0) => {
  let rad = degToRad(angle);

  return {
    x: x + magnitude * Math.cos(rad),
    y: y + magnitude * Math.sin(-rad),
  };
};

/**
 * Return float number with a precision after point.
 * This method fix the problem: 0.1 + 0.2 == 0.30000000000000004 or 0.7 + 0.1 == 0.7999999999999999
 * When, e.g., -0.001 is fixed with 2 digits, then to avoid '-0' add to result '+0'.
 * See tests for more issues samples.
 *
 * @param {number} num
 * @param {?number} [digits=8] The precision for rounding of float values after the decimal point, in range [0, 20].
 * @returns {number} A rounded float number.
 */
export const roundFloat = (num, digits = 6) => {
  // shift with exponential notation to avoid floating-point issues
  const [floatNum, exp] = (num + '').split('e'),
      numExp = +exp + digits,
      sign = numExp >= 0 ? '+' : '',
      value = exp ? floatNum + 'e' + sign + numExp : num + 'e+' + digits;

  return +(Math.round(+value) + 'e-' + digits);
};
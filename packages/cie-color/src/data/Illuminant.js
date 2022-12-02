/**
 * References:
 * CIE 015:2004 Colorimetry, 3rd Edition. ISBN:978-3-901906-33-6
 * Standard Colorimetry: Definitions, Algorithms and Software
 * https://books.google.de/books?id=D9aOCQAAQBAJ&pg=PA202&lpg=PA202&dq=illuminant+XYZ+F12&source=bl&ots=4-X8g7SS5W&sig=ACfU3U1eTk2WUBeYDgKCwXrv0BArPXZNTg&hl=ru&sa=X&ved=2ahUKEwjyv9rx5uPyAhVCgf0HHWXuD1AQ6AF6BAgCEAM#v=onepage&q=illuminant%20XYZ%20F12&f=false
 * https://github.com/colour-science/colour/blob/develop/colour/colorimetry/datasets/illuminants/chromaticity_coordinates.py
 *
 * Different whitepoint standards is a large part of the problem.
 * https://ninedegreesbelow.com/photography/well-behaved-profiles-quest.html#white-point-values
 * https://github.com/w3c/csswg-drafts/issues/6618
 *
 * Note:
 * 1. The official illuminants XYZ values are calculated from reference spectral wavelengths using ASTM E308 method.
 * 2. By the standard IEC 61966-2-1 the XYZ values are calculated from xy chromaticity coordinates.
 */

/**
 * @typedef {[number, number, number]} Tristimulus The tristimulus values.
 */

/**
 * @typedef {[number, number]} ChromaticityCoordinate The chromaticity coordinates x, y.
 */

/**
 * @typedef {ChromaticityCoordinate} IlluminantValue The chromaticity coordinates x, y.
 */

/**
 * @type {{ASTM_E308: string, IEC_61966: string}}
 */
const IlluminantMethod = {
  IEC_61966: 'IEC-61966-2-1',
  ASTM_E308: 'ASTM-E308',
};

/**
 * The XYZ values of white point are normalized by Y=1.
 *
 * Standard Observers according to CIE S 014-1:2006 and ISO 11664-1:2007:
 *   -  2 degrees (CIE 1931)
 *   - 10 degrees (CIE 1964)
 *
 * Standard Illuminants:
 *   - A, D50, D55, D65, D75 (ISO 11664-2:2007 bzw. CIE S014-2/E:2006)
 *   - ID50, ID65 (CIE 184:2009)
 *   - C, E (CIE 15:2018)
 *   - F1 ,F2, F3, F4, F5, F6, F7, F8, F9, F10, F11, F12 (CIE S014-2/E:2006)
 *
 * @typedef {Object} IlluminantWhitepoint Standard illuminants defined by CIE.
 * @property {IlluminantValue} A Incandescent / Tungsten. Correlated color temperature (CCT) 2856 K.
 * @property {IlluminantValue} B Old direct sunlight at noon. CCT 4874 K. Obsolete by CIE.
 * @property {IlluminantValue} C Average / North sky Daylight. CCT 6774 K. Obsolete by CIE.
 *    Was used for original standard NTSC video.
 * @property {IlluminantValue} D50 Warm Daylight at Sunrise or Sunset, Horizon Light. CCT 5000 K.
 *   ICC profile PCS used for color rendering und by printing.
 * @property {IlluminantValue} D55 Mid-morning / Mid-afternoon Daylight. CCT 5500 K. Used for photography.
 * @property {IlluminantValue} D65 New version of North sky Daylight, Noon Daylight. CCT 6504 K.
 *   Default standard for television, monitor, sRGB color space.
 * @property {IlluminantValue} D75 Overcast Daylight, North sky Daylight. CCT 7500 K.
 * @property {IlluminantValue} E Virtual uniform energy illuminant. CCT 5400 K. Defaults used as a theoretical reference.
 * @property {IlluminantValue} F1 Standard fluorescent lamp. Daylight Fluorescent. CCT 6430 K.
 * @property {IlluminantValue} F2 Standard fluorescent lamp. Cool White Fluorescent. CCT 4230 K.
 * @property {IlluminantValue} F3 Standard fluorescent lamp. White Fluorescent. CCT 3450 K.
 * @property {IlluminantValue} F4 Standard fluorescent lamp. Warm White Fluorescent. CCT 2940 K.
 * @property {IlluminantValue} F5 Standard fluorescent lamp. Daylight Fluorescent. CCT 6350 K.
 * @property {IlluminantValue} F6 Standard fluorescent lamp. Lite White Fluorescent. CCT 4150 K.
 * @property {IlluminantValue} F7 Broadband fluorescent lamp. D65 simulator, Daylight simulator. CCT 6500 K.
 * @property {IlluminantValue} F8 Broadband fluorescent lamp. D50 simulator, Sylvania F40 Design 50. CCT 5000 K.
 * @property {IlluminantValue} F9 Broadband fluorescent lamp. Cool White Deluxe Fluorescent. CCT 4150 K.
 * @property {IlluminantValue} F10 Narrow tri-band fluorescent lamp. Philips TL85, Ultralume 50. CCT 5000 K.
 * @property {IlluminantValue} F11 Narrow tri-band fluorescent lamp. Philips TL84, Ultralume 40, CCT 4000 K.
 * @property {IlluminantValue} F12 Narrow tri-band fluorescent lamp. Philips TL83, Ultralume 30, CCT 3000 K.
 */

/**
 * Standard Illuminants for the CIE 1931 2 degree standard observer calculated by ASTM E308 method
 * and rounded to right number of decimal places.
 *
 * @type {IlluminantWhitepoint}
 */
const IlluminantObserver2Degree = {
  A: [1.0985, 1, 0.3558],
  B: [0.9909, 1, 0.8531],
  C: [0.98074, 1, 1.18232],
  ICC: [0.9642, 1, 0.8249], // ICC PCS (approx D50)
  D50: [0.96422, 1, 0.82521],
  D55: [0.95682, 1, 0.92149],
  D65: [0.95047, 1, 1.08883],
  D75: [0.94972, 1, 1.22638],
  E: [1, 1, 1],
  F1: [0.9287, 1, 1.0378],
  F2: [0.99186, 1, 0.67393],
  F3: [1.038, 1, 0.4993],
  F4: [1.092, 1, 0.3888],
  F5: [0.909, 1, 0.9882],
  F6: [0.9734, 1, 0.6026],
  F7: [0.95041, 1, 1.08747],
  F8: [0.9643, 1, 0.8242],
  F9: [1.0038, 1, 0.6794],
  F10: [0.9638, 1, 0.8235],
  F11: [1.0095, 1, 0.6435],
  F12: [1.0812, 1, 0.3927],
};

/**
 * Standard Illuminants for the CIE 1931 10 degree standard observer calculated by ASTM E308 method
 * and rounded to right number of decimal places.
 *
 * @type {IlluminantWhitepoint}
 */
const IlluminantObserver10Degree = {
  A: [1.1114, 1, 0.352],
  B: [0.9919, 1, 0.8435],
  C: [0.9729, 1, 1.1615],
  D50: [0.9671, 1, 0.8141],
  D55: [0.958, 1, 0.9093],
  D65: [0.9481, 1, 1.0733],
  D75: [0.9442, 1, 1.206],
  E: [1, 1, 1],
  F1: [0.9482, 1, 1.0326],
  F2: [1.0328, 1, 0.6903],
  F3: [1.0901, 1, 0.52],
  F4: [1.1501, 1, 0.41],
  F5: [0.9339, 1, 0.987],
  F6: [1.0218, 1, 0.6211],
  F7: [0.9579, 1, 1.0769],
  F8: [0.9712, 1, 0.8119],
  F9: [1.0213, 1, 0.6787],
  F10: [0.9896, 1, 0.8329],
  F11: [1.0386, 1, 0.6561],
  F12: [1.148, 1, 0.4037],
};

/**
 * Chromaticity coordinates for the CIE 1931 2 degree standard observer.
 * This used for convert from xy to XYZ by IEC 61966-2-1 standard.
 * The precision 5 decimal points used in w3c/csswg.
 *
 * Sample data: https://github.com/colour-science/colour/blob/develop/colour/colorimetry/datasets/illuminants/chromaticity_coordinates.py
 * Sample data for F1..F12: https://web.archive.org/web/20050523033826/http://www.hunterlab.com:80/appnotes/an05_05.pdf
 *
 * @type {IlluminantWhitepoint}
 */
const ChromaticityObserver2Degree = {
  A: [0.44758, 0.40745],
  B: [0.34842, 0.35161],
  C: [0.31006, 0.31616],
  D50: [0.3457, 0.3585],
  D55: [0.33243, 0.34744],
  D65: [0.3127, 0.329],
  D75: [0.29903, 0.31488],
  E: [1 / 3, 1 / 3],
  F1: [0.3131, 0.3371],
  F2: [0.3721, 0.3751],
  F3: [0.4091, 0.3941],
  F4: [0.4402, 0.4031],
  F5: [0.3138, 0.3452],
  F6: [0.3779, 0.3882],
  F7: [0.3129, 0.3292],
  F8: [0.3458, 0.3586],
  F9: [0.3741, 0.3727],
  F10: [0.3458, 0.3588],
  F11: [0.3805, 0.3769],
  F12: [0.437, 0.4042],
};

/**
 * Chromaticity coordinates for the CIE 1931 2 degree standard observer.
 * The values are from CIE Technical Report (2004) Colorimetry, 3rd ed., Publication 15:2004.
 */
const ChromaticityObserver2Degree2004 = {
  A: [0.44758, 0.40745],
  B: [0.34842, 0.35161],
  C: [0.31006, 0.46089],
  D50: [0.34567, 0.3585], // diff*
  D55: [0.33243, 0.34744],
  D65: [0.31272, 0.32903], // diff*
  D75: [0.29903, 0.3148], // diff*
  E: [1 / 3, 1 / 3],
  F1: [0.3131, 0.3371],
  F2: [0.3721, 0.3751],
  F3: [0.4091, 0.3941],
  F4: [0.4402, 0.4031],
  F5: [0.3138, 0.3452],
  F6: [0.3779, 0.3882],
  F7: [0.3129, 0.3292],
  F8: [0.3458, 0.3586],
  F9: [0.3741, 0.3727],
  F10: [0.3458, 0.3588],
  F11: [0.3805, 0.3769],
  F12: [0.437, 0.4042],
};

/**
 * The values calculated with ASTM E308-01 method as XYZ and converted to xy.
 * These values used by Lindbloom for calculation between XYZ and sRGB.
 *
 * Sample data: https://ninedegreesbelow.com/photography/well-behaved-profiles-quest.html#white-point-values
 *
 * Note: use it only for experiments to compare difference with IEC 61966-2-1 standard.
 *
 * @type {{D65: number[], D50: number[]}}
 */
const ASTMChromaticityObserver2Degree = {
  D50: [0.345669187, 0.35849618], // equal to XYZ [0.96422, 1, 0.82521],
  D65: [0.312726615, 0.32902313], // equal to XYZ [0.95047, 1, 1.08883]
};

/**
 * Chromaticity coordinates for the CIE 1964 10 degree standard observer.
 * These values are precision 5 digits after the decimal point and are used in w3c/csswg.
 *
 * Sample data: https://github.com/colour-science/colour/blob/develop/colour/colorimetry/datasets/illuminants/chromaticity_coordinates.py
 * See precise sample data: https://en.wikipedia.org/wiki/Standard_illuminant
 *
 * @type {IlluminantWhitepoint}
 */
const ChromaticityObserver10Degree = {
  A: [0.45117, 0.40594],
  B: [0.3498, 0.3527],
  C: [0.31039, 0.31905],
  D50: [0.34773, 0.35952],
  D55: [0.33412, 0.34877],
  D60: [0.32298692671582, 0.339275732345997],
  D65: [0.31382, 0.331],
  D75: [0.29968, 0.3174],
  E: [1 / 3, 1 / 3],
  F1: [0.31811, 0.33559],
  F2: [0.37925, 0.36733],
  F3: [0.41761, 0.38324],
  F4: [0.4492, 0.39074],
  F5: [0.31975, 0.34246],
  F6: [0.3866, 0.37847],
  F7: [0.31569, 0.3296],
  F8: [0.34902, 0.35939],
  F9: [0.37829, 0.37045],
  F10: [0.3509, 0.35444],
  F11: [0.38541, 0.37123],
  F12: [0.44256, 0.39717],
};

/**
 * @type {{'2': IlluminantWhitepoint, '10': IlluminantWhitepoint}}
 */
const Illuminant = {
  2: IlluminantObserver2Degree,
  10: IlluminantObserver10Degree,
};

/**
 * @type {{'2': IlluminantWhitepoint, '10': IlluminantWhitepoint}}
 */
const Chromaticity = {
  2: ChromaticityObserver2Degree,
  10: ChromaticityObserver10Degree,
};

export { Illuminant, Chromaticity, ASTMChromaticityObserver2Degree, IlluminantMethod };

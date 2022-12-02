/**
 * RGB color spaces.
 *
 * Note: all values of RGB spaces based on CIE 1931 2 degree standard observer.
 * See the colorimetric specifications of various RGB working spaces:
 * https://www.babelcolor.com/index_htm_files/A%20review%20of%20RGB%20color%20spaces.pdf p.21, Table 5.
 *
 * CIE 15.3:2004 https://haralick.org/DV/cie_2004_colorimetry.pdf
 * https://en.wikipedia.org/wiki/RGB_color_space
 */

import { RgbSpace } from './RgbSpace.js';

/**
 * Adobe RGB (1998)
 *
 * https://www.adobe.com/digitalimag/pdfs/AdobeRGB1998.pdf, p.10
 * https://en.wikipedia.org/wiki/Adobe_RGB_color_space
 *
 * @type {RgbSpace}
 */
export const a98RGB = new RgbSpace(
  [0.64, 0.33, 0.21, 0.71, 0.15, 0.06],
  { illuminant: 'D65', xy: [0.3127, 0.329] },
  {
    toGamma: (value) => Math.sign(value) * Math.pow(Math.abs(value), 256 / 563),
    toLinear: (value) => Math.sign(value) * Math.pow(Math.abs(value), 563 / 256),
  }
);

/**
 * CIE RGB
 * https://en.wikipedia.org/wiki/CIE_1931_color_space#CIE_RGB_color_space
 *
 * @type {RgbSpace}
 */
export const cieRGB = new RgbSpace(
  [0.7347, 0.2653, 0.2738, 0.7174, 0.1666, 0.0089],
  { illuminant: 'E', xy: [1 / 3, 1 / 3] },
  {
    toGamma: (value) => Math.sign(value) * Math.pow(Math.abs(value), 1 / 2.2),
    toLinear: (value) => Math.sign(value) * Math.pow(Math.abs(value), 2.2),
  }
);

/**
 * sRGB IEC 61966-2-1
 * https://www.w3.org/Graphics/Color/sRGB
 *
 * @type {RgbSpace}
 */
export const sRGB = new RgbSpace(
  [0.64, 0.33, 0.3, 0.6, 0.15, 0.06],
  { illuminant: 'D65', xy: [0.3127, 0.329] },
  {
    toGamma: (value) => {
      const abs = Math.abs(value);

      return 0.0031308 < abs ? Math.sign(value) * (1.055 * Math.pow(abs, 1 / 2.4) - 0.055) : value * 12.92;
    },

    // Note: The IEC 61966-2-1 standard use the correct threshold 0.04045.
    // @see https://www.w3.org/WAI/GL/wiki/Relative_luminance
    toLinear: (value) => {
      const abs = Math.abs(value);

      return 0.04045 < abs ? Math.sign(value) * Math.pow((abs + 0.055) / 1.055, 2.4) : value / 12.92;
    },
  }
);

/**
 * Display P3
 * https://en.wikipedia.org/wiki/DCI-P3#Display_P3
 *
 * @type {RgbSpace}
 */
export const displayP3 = new RgbSpace(
  [0.68, 0.32, 0.265, 0.69, 0.15, 0.06],
  { illuminant: 'D65', xy: [0.3127, 0.329] },
  {
    // similar to sRGB
    toGamma: sRGB.toGamma,
    toLinear: sRGB.toLinear,
  }
);

/**
 * Rec. 2020
 * https://en.wikipedia.org/wiki/Rec._2020
 *
 * @type {RgbSpace}
 */
export const rec2020 = new RgbSpace(
  [0.708, 0.292, 0.17, 0.797, 0.131, 0.046],
  { illuminant: 'D65', xy: [0.3127, 0.329] },
  {
    toGamma: (value) => {
      const abs = Math.abs(value),
        alpha = 1.09929682680944,
        betta = 0.018053968510807;

      return betta < abs ? Math.sign(value) * (alpha * Math.pow(abs, 0.45) - (alpha - 1)) : value * 4.5;
    },
    toLinear: (value) => {
      const abs = Math.abs(value),
        alpha = 1.09929682680944,
        betta = 0.018053968510807;

      return betta * 4.5 <= abs ? Math.sign(value) * Math.pow((abs + alpha - 1) / alpha, 20 / 9) : value / 16;
    },
  }
);

/**
 * ProPhoto RGB (ROMM RGB)
 *
 * Original data: https://www.kodak.com/global/plugins/acrobat/en/professional/products/software/colorFlow/romm_rgb.pdf
 * Don't use non standard data from: https://en.wikipedia.org/wiki/ProPhoto_RGB_color_space
 *
 * @type {RgbSpace}
 */
export const proPhoto = new RgbSpace(
  [0.7347, 0.2653, 0.1596, 0.8404, 0.0366, 0.0001],
  { illuminant: 'D50', xy: [0.3457, 0.3585] },
  {
    toGamma: (value) => {
      const abs = Math.abs(value);

      return 1 / 512 <= abs ? Math.sign(value) * Math.pow(abs, 1 / 1.8) : value * 16;
    },
    toLinear: (value) => {
      const abs = Math.abs(value);

      return 16 / 512 < abs ? Math.sign(value) * Math.pow(abs, 1.8) : value / 16;
    },
  }
);

/**
 * Wide-gamut RGB (Adobe Wide Gamut RGB)
 * https://en.wikipedia.org/wiki/Wide-gamut_RGB_color_space
 *
 * @type {RgbSpace}
 */
export const wideGamut = new RgbSpace(
  [0.7347, 0.2653, 0.1152, 0.8264, 0.1566, 0.0177],
  { illuminant: 'D50', xy: [0.3457, 0.3585] },
  {
    // similar to Adobe RGB
    toGamma: a98RGB.toGamma,
    toLinear: a98RGB.toLinear,
  }
);
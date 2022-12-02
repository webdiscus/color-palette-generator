/**
 * Lib for working with color spaces.
 *
 * ISC License
 *
 * Copyright (c) 2021, webdiscus
 */

/**
 * References:
 * https://drafts.csswg.org/css-color/
 * https://engineering.purdue.edu/~bouman/ece637/notes/pdf/ColorSpaces.pdf
 * https://www.xrite.com/-/media/xrite/files/whitepaper_pdfs/l10-001_a_guide_to_understanding_color_communication/l10-001_understand_color_en.pdf
 * https://www.babelcolor.com/index_htm_files/A%20review%20of%20RGB%20color%20spaces.pdf
 * https://github.com/WebKit/WebKit/tree/main/Source/WebCore/platform/graphics
 * http://www.brucelindbloom.com
 * CIE Colorimetry: https://ia802802.us.archive.org/23/items/gov.law.cie.15.2004/cie.15.2004.pdf
 */

import { RAD2DEG, DEG2RAD, clamp, decToHex } from '@webdiscus/math-utils';
import { isHexColor, hexToRgba, getWhitepoint } from './ColorUtils.js';
import * as ColorSpace from './RgbColorSpaces.js';
import { deltaE2000 } from './ColorDifference.js';

// Shorthands
const { abs, min, max, floor, round, pow, sqrt, cbrt, cos, sin, acos, atan2 } = Math;

/**
 * CIE constants 2004 version standard.
 * In this version used exact rational fractions.
 *
 * Note. In the old 1976 version used decimal's definition:
 * - kappa = 903.3
 * - epsilon = 0.008856
 *
 * @type {{epsilon: number, kappa: number}}
 */
const CIE = {
  kappa: 24389 / 27,
  epsilon: 216 / 24389,
};

/**
 * Reference values of white point. Defaults, the illuminant is for observer 2° and illuminate D65.
 * @type {Tristimulus}
 */
const referenceWhite = getWhitepoint({ illuminant: 'D65' });

/**
 * @callback RGBCubeFunction Transformation of hue/chroma from the HSL/HSV chromaticity plane to RGB space.
 * @param {number} C The chroma.
 * @param {number} X The intermediate value.
 * @return [number, number, number] The array of values R,G,B.
 */

/**
 * @typedef {Object} RGBCube
 * @property {RGBCubeFunction} 0 Return R,G,B for   0 <= hue <  60
 * @property {RGBCubeFunction} 1 Return R,G,B for  60 <= hue < 120
 * @property {RGBCubeFunction} 2 Return R,G,B for 120 <= hue < 180
 * @property {RGBCubeFunction} 3 Return R,G,B for 180 <= hue < 240
 * @property {RGBCubeFunction} 4 Return R,G,B for 240 <= hue < 300
 * @property {RGBCubeFunction} 5 Return R,G,B for 300 <= hue < 360
 */

/**
 * @type {RGBCube}
 */
const RgbCube = {
  0: (C, X) => [C, X, 0],
  1: (C, X) => [X, C, 0],
  2: (C, X) => [0, C, X],
  3: (C, X) => [0, X, C],
  4: (C, X) => [X, 0, C],
  5: (C, X) => [C, 0, X],
};

/**
 * RGB color model.
 * This model represents many RGB color spaces.
 */
class Rgb {
  /**
   * @param {number} red The red value, in range [0, 1].
   * @param {number} green The green value, in range [0, 1].
   * @param {number} blue The blue value, in range [0, 1].
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   * @param {?string} [space='sRGB'] The working space of RGB. See available values in RgbColorSpaces.js.
   */
  constructor(red, green, blue, alpha = 1, space = 'sRGB') {
    if (red > 1 || green > 1 || blue > 1 || alpha > 1) {
      throw new RangeError(
        `The RGBA values must be in range [0,1], but given: r ${red} g ${green} b ${blue} a ${alpha}`,
      );
    }

    this.r = red;
    this.g = green;
    this.b = blue;
    this.alpha = alpha;
    this.space = space;
  }

  /**
   * Calculates the contrast ratio between a rgb color and itself.
   * @see https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
   *
   * @param {Rgb} rgb
   * @return {number}
   */
  contrastRatio(rgb) {
    return contrastRatio(this, rgb);
  }

  /**
   * The alpha compositing (alpha blending) self with other rgb colors by the alpha channel.
   * @see https://www.w3.org/TR/compositing-1/#simplealphacompositing
   *
   * @param {...[string|Rgb]} colors The one or more arguments as RRGGBBAA string or Rgb(r, g, b, a) object.
   * @return {Rgb}
   */
  blend(...colors) {
    return blend(this, ...colors);
  }

  /**
   * Convert to HSV color space.
   * @see https://en.wikipedia.org/wiki/HSL_and_HSV
   *
   * @return {Hsv}
   */
  toHsv() {
    const { r, g, b, alpha } = this,
      maxValue = max(r, g, b),
      delta = maxValue - min(r, g, b);
    let hue = 0,
      saturation = 0;

    if (delta > 0) {
      if (maxValue === r) hue = 60 * ((g - b) / delta);
      else if (maxValue === g) hue = 60 * (2 + (b - r) / delta);
      else if (maxValue === b) hue = 60 * (4 + (r - g) / delta);
      hue = round(hue + 360) % 360;
      saturation = delta / maxValue;
    }

    return new Hsv(hue, saturation, maxValue, alpha);
  }

  /**
   * Convert to HSL color space.
   *
   * @return {Hsl}
   */
  toHsl() {
    const { r, g, b, alpha } = this,
      maxValue = max(r, g, b),
      minValue = min(r, g, b),
      delta = maxValue - minValue,
      sum = maxValue + minValue,
      lightness = sum / 2;
    let hue = 0,
      saturation = 0;

    if (delta > 0) {
      if (maxValue === r) hue = 60 * ((g - b) / delta);
      else if (maxValue === g) hue = 60 * (2 + (b - r) / delta);
      else if (maxValue === b) hue = 60 * (4 + (r - g) / delta);
      hue = round(hue + 360) % 360;
      saturation = lightness <= 0.5 ? delta / sum : delta / (2 - sum);
    }

    return new Hsl(hue, saturation, lightness, alpha);
  }

  /**
   * Convert to HSI color space.
   *
   * todo test
   *
   * @return {Hsi}
   */
  toHsi() {
    const { r, g, b, alpha } = this,
      sumRgb = r + g + b,
      I = sumRgb / 3,
      S = 1 - (3 / sumRgb) * min(r, g, b),
      H = acos((r - g + (r - b)) / 2 / sqrt(pow(r - g, 2) + (r - b) * (g - b)));

    return new Hsi(H, S, I, alpha);
  }

  /**
   * Convert to HWB color space.
   *
   * @return {Hwb}
   */
  toHwb() {
    const { r, g, b, alpha } = this,
      { h } = this.toHsl(),
      white = min(r, g, b),
      black = 1 - max(r, g, b);

    return new Hwb(h, white, black, alpha);
  }

  /**
   * Convert to other RGB color space.
   *
   * todo test
   *
   * @param {string} space The output RGB color space.
   * @return {Rgb}
   */
  toSpace(space) {
    const [r, g, b] = ColorSpace[this.space].toRgbSpace([this.r, this.g, this.b], space);

    return new Rgb(r, g, b, this.alpha, space);
  }

  /**
   * Convert to XYZ color space.
   * @note The values for transform are correlated with RGB working space and illuminant.
   *
   * @param {?string} [space='sRGB'] The RGB space.
   * @param {?string} [illuminant=''] The illuminant of RGB space.
   * @return {Xyz}
   */
  toXyz(space = 'sRGB', illuminant = '') {
    const [x, y, z] = ColorSpace[this.space].toXyz([this.r, this.g, this.b]);

    return new Xyz(x, y, z, this.alpha);
  }

  /**
   * Convert to Lab color space.
   *
   * @return {Lab}
   */
  toLab() {
    return this.toXyz().toLab();
  }

  /**
   * Convert to LCHab color space.
   *
   * @return {LCHab}
   */
  toLCHab() {
    return this.toXyz().toLab().toLCHab();
  }

  /**
   * Convert to Luv color space.
   *
   * @return {Luv}
   */
  toLuv() {
    return this.toXyz().toLuv();
  }

  /**
   * Returns normalized to range [0, 255] values of red, green, blue and alpha in range [0, 1] as array.
   *
   * @return {[number, number, number]}
   */
  toValues() {
    return [round(255 * this.r), round(255 * this.g), round(255 * this.b), this.alpha];
  }

  /**
   * Convert to hex code string.
   *
   *  @return {string}
   */
  toHex() {
    return (
      decToHex(round(255 * this.r)) +
      decToHex(round(255 * this.g)) +
      decToHex(round(255 * this.b)) +
      (1 > this.alpha ? decToHex(round(255 * this.alpha)) : '')
    ).toUpperCase();
  }

  /**
   * Convert to rgba CSS property.
   *
   * @return {string}
   */
  toCss() {
    const r = round(this.r * 255),
      g = round(this.g * 255),
      b = round(this.b * 255);
    return `rgba(${r}, ${g}, ${b}, ${this.alpha})`;
  }

  /**
   * Correct the range of each component.
   *
   * todo find where it used and rename to 'clamp' method
   *
   * @return {Rgb}
   */
  check() {
    this.r = clamp(this.r, 0, 1);
    this.g = clamp(this.g, 0, 1);
    this.b = clamp(this.b, 0, 1);

    return this;
  }
}

/**
 * HSV (aka HSB) color space.
 */
class Hsv {
  /**
   * @param {number} hue The hue, in range [0, 360].
   * @param {number} saturation The saturation, in range [0, 1].
   * @param {number} value The brightness, in range [0, 1].
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   */
  constructor(hue, saturation, value, alpha = 1) {
    this.h = hue;
    this.s = saturation;
    this.v = value;
    this.alpha = alpha;
  }

  /**
   * Rotate HSV color.
   *
   * @param {number} deg The hue adjustment in degrees.
   * @return {Hsv}
   */
  rotate(deg) {
    return new Hsv((this.h + deg + 360) % 360, this.s, this.v, this.alpha);
  }

  /**
   * Convert to RGB color space.
   *
   * @return {Rgb}
   */
  toRgb() {
    const H1 = (this.h % 360) / 60,
      C = this.v * this.s,
      X = C * (1 - abs((H1 % 2) - 1)),
      m = this.v - C,
      [r, g, b] = RgbCube[floor(H1)](C, X);

    return new Rgb(clamp(r + m, 0, 1), clamp(g + m, 0, 1), clamp(b + m, 0, 1), this.alpha);
  }

  /**
   * Convert to HSL color space.
   * @see https://en.wikipedia.org/wiki/HSL_and_HSV
   *
   * @return {Hsl}
   */
  toHsl() {
    let lightness = this.v * (1 - this.s / 2),
      saturation = 0;

    if (0 < lightness && lightness < 1) saturation = (this.v - lightness) / min(lightness, 1 - lightness);

    return new Hsl(this.h, saturation, lightness, this.alpha);
  }

  /**
   * Convert to HWB color space.
   *
   * todo test
   *
   * @return {Hwb}
   */
  toHwb() {
    const w = this.v * (1 - this.s),
      b = 1 - this.v;

    return new Hwb(this.h, w, b, this.alpha);
  }

  /**
   * Convert to CSS property.
   *
   * @return {string}
   */
  toCss() {
    return this.toRgb().toCss();
  }
}

/**
 * HSL color space.
 */
class Hsl {
  /**
   * @param {number} hue The hue, in range [0, 360].
   * @param {number} saturation The saturation, in range [0, 1].
   * @param {number} lightness The lightness, in range [0, 1].
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   */
  constructor(hue, saturation, lightness, alpha = 1) {
    this.h = hue;
    this.s = saturation;
    this.l = lightness;
    this.alpha = alpha;
  }

  /**
   * Rotate HSL color.
   *
   * @param {number} deg The hue adjustment in degrees.
   * @return {Hsl}
   */
  rotate(deg) {
    return new Hsl((this.h + deg + 360) % 360, this.s, this.l, this.alpha);
  }

  /**
   * Convert to HSV color space.
   * @see https://en.wikipedia.org/wiki/HSL_and_HSV
   *
   * @return {Hsv}
   */
  toHsv() {
    let value = this.l + this.s * min(this.l, 1 - this.l),
      saturation = 0;

    if (0 < value) saturation = 2 * (1 - this.l / value);

    return new Hsv(this.h, saturation, value, this.alpha);
  }

  /**
   * Convert to RGB color space.
   * @see https://en.wikipedia.org/wiki/HSL_and_HSV
   *
   * @return {Rgb}
   */
  toRgb() {
    const H1 = (this.h % 360) / 60,
      C = (1 - abs(2 * this.l - 1)) * this.s,
      X = C * (1 - abs((H1 % 2) - 1)),
      m = this.l - C / 2,
      [r, g, b] = RgbCube[floor(H1)](C, X);

    return new Rgb(clamp(r + m, 0, 1), clamp(g + m, 0, 1), clamp(b + m, 0, 1), this.alpha);
  }

  /**
   * Convert to CSS property.
   * @compatibility IE >= 9
   *
   * @return {string}
   */
  toCss() {
    const h = round(this.h),
      s = round(this.s * 100),
      l = round(this.l * 100);
    return `hsla(${h}, ${s}%, ${l}%, ${this.alpha})`;
  }
}

/**
 * CIE HSI color space.
 */
class Hsi {
  /**
   *
   * @param {number} hue The hue, in range [0, 360].
   * @param {number} saturation The saturation, in range [0, 1].
   * @param {number} intensity The intensity, in range [0, 1].
   * @param {number} alpha
   */
  constructor(hue, saturation, intensity, alpha = 1) {
    this.h = hue;
    this.s = saturation;
    this.i = intensity;
    this.alpha = alpha;
  }

  /**
   * Convert to RGB color space.
   *
   * @return {Rgb}
   */
  toRgb() {
    const H1 = (this.h % 360) / 60,
      Z = 1 - abs((H1 % 2) - 1),
      C = (3 * this.i * this.s) / (1 + Z),
      X = C * Z,
      m = this.i * (1 - this.s),
      [r, g, b] = RgbCube[floor(H1)](C, X);

    return new Rgb(clamp(r + m, 0, 1), clamp(g + m, 0, 1), clamp(b + m, 0, 1), this.alpha);
  }
}

/**
 * CIE HWB color space.
 * http://alvyray.com/Papers/CG/HWB_JGTv208.pdf
 */
class Hwb {
  /**
   *
   * @param {number} hue The hue, in range [0, 360].
   * @param {number} whiteness The whiteness, in range [0, 1].
   * @param {number} blackness The blackness, in range [0, 1].
   * @param {number} alpha
   */
  constructor(hue, whiteness, blackness, alpha = 1) {
    this.h = hue;
    this.w = whiteness;
    this.b = blackness;
    this.alpha = alpha;
  }

  /**
   * Convert to RGB color space.
   *
   * todo test
   *
   * @return {Rgb}
   */
  toRgb() {
    let { h, w: white, b: black, alpha } = this,
      r,
      g,
      b;

    if (white + black >= 1) {
      r = g = b = white / (white + black);
    } else {
      [r, g, b] = new Hsl(h, 1, 0.5).toRgb();
      r = r * (1 - white - black) + white;
      g = g * (1 - white - black) + white;
      b = b * (1 - white - black) + white;
    }

    return new Rgb(r, g, b, alpha);
  }

  /**
   * Convert to HSV color space.
   *
   * todo test
   *
   * @return {Hsv}
   */
  toHsv() {
    const s = 1 - this.w / (1 - this.b),
      v = 1 - this.b;

    return new Hsv(this.h, s, v, this.alpha);
  }
}

/**
 * CIE L*a*b* colour space.
 */
class Lab {
  /**
   * @param {number} lightness The lightness, in range [0, >=100]%.
   *   Note: the value > 100% are permitted (for compatibility with HDR), and must not be clamped.
   * @param {number} a The green?red color component, in range [-128, 127].
   * @param {number} b The blue?yellow color component, in range [-128, 127]
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   * @param {?Tristimulus} [whitepoint=referenceWhite] The reference white.
   *   Defaults, the whitepoint is for observer 2° and illuminate D65.
   */
  constructor(lightness, a, b, alpha = 1, whitepoint = referenceWhite) {
    this.L = lightness;
    this.a = a;
    this.b = b;
    this.alpha = alpha;
    this.whitepoint = whitepoint;
  }

  /**
   * Calculates the color difference (Delta E) using the CIEDE2000 algorithm.
   *
   * @param {Lab} lab The color in Lab color space to compare with self.
   * @return {number}
   */
  deltaE(lab) {
    return deltaE2000(this, lab);
  }

  /**
   * Convert to XYZ color space.
   * @see https://en.wikipedia.org/wiki/CIELAB_color_space CIELAB to CIEXYZ
   *
   * Note: When transforming L*a*b* data to XYZ make sure that the whitepoint has the same illuminant used by L*a*b*.
   * If you want XYZ for a different illuminant, you must at last convert the XYZ data to the new illuminant
   * using a Bradford matrix.
   *
   * @return {Xyz}
   */
  toXyz() {
    /**
     * The intermediate luminance function CIE1976 for reverse transformation from CIELAB to CIEXYZ.
     *
     * @param {number} fY The given luminance.
     * @param {number} Yn The reference white luminance.
     * @return {number} The intermediate value in the luminance.
     */
    const f = (fY, Yn) => Yn * (fY > 6 / 29 ? fY * fY * fY : (fY - 4 / 29) * (108 / 841));

    const [Xn, Yn, Zn] = this.whitepoint,
      fY = (16 + this.L) / 116,
      fX = fY + this.a / 500,
      fZ = fY - this.b / 200,
      X = f(fX, Xn),
      Y = f(fY, Yn),
      Z = f(fZ, Zn);

    return new Xyz(X, Y, Z, this.alpha, this.whitepoint);
  }

  /**
   * Convert to LCHab color space.
   *
   * @return {LCHab}
   */
  toLCHab() {
    return new LCHab(
      this.L,
      sqrt(this.a * this.a + this.b * this.b),
      (atan2(this.b, this.a) * RAD2DEG + 360) % 360,
      this.alpha,
    );
  }

  /**
   * Convert to Luv color space.
   *
   * @return {Luv}
   */
  toLuv() {
    return this.toXyz().toLuv();
  }

  /**
   * Convert Lab to RGB.
   * @see http://www.brucelindbloom.com/index.html?Math.html
   *
   * @return {Rgb}
   */
  toRgb() {
    return this.toXyz().toRgb();
  }

  /**
   * Convert to CSS property.
   *
   * @return {string}
   */
  toCss() {
    return this.toRgb().toCss();
  }
}

/**
 * CIE XYZ color space.
 */
class Xyz {
  /**
   * @param {number} X The tristimulus value, in range [0, 1]
   * @param {number} Y The tristimulus value, roughly equivalent to luminance, in range [0, 1]
   * @param {number} Z The tristimulus value, in range [0, 1]
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   * @param {?Tristimulus} [whitepoint=referenceWhite] The reference white.
   *   Defaults, the whitepoint is for observer 2° and illuminate D65.
   *   todo Manche whitepoint definition bei XYZ/RGB sind entweder als [whitepoint=[X,Y,Z]] oder [illuminat='D65', observer=2]
   */
  constructor(X, Y, Z, alpha = 1, whitepoint = referenceWhite) {
    this.X = X;
    this.Y = Y;
    this.Z = Z;
    this.alpha = alpha;
    this.whitepoint = whitepoint;
  }

  /**
   * Convert to Lab color space.
   * @see http://www.brucelindbloom.com/Eqn_XYZ_to_Lab.html
   *
   * Note: When transforming XYZ data to L*a*b* make sure that the whitepoint has the same illuminant used by XYZ.
   * If you want L*a*b* for a different illuminant, you must first convert the XYZ data to the new illuminant
   * using a Bradford matrix.
   *
   * @return {Lab}
   */
  toLab() {
    /**
     * The intermediate lightness function CIE1976 for forward transformation from CIEXYZ to CIELAB.
     *
     * @param {number} Y The given luminance.
     * @param {number} Yn The reference white luminance.
     * @return {number} The intermediate value in the Lightness.
     */
    const f = (Y, Yn) => {
      Y /= Yn;
      return Y > CIE.epsilon ? cbrt(Y) : (CIE.kappa * Y + 16) / 116;
    };

    const [Xn, Yn, Zn] = this.whitepoint,
      fX = f(this.X, Xn),
      fY = f(this.Y, Yn),
      fZ = f(this.Z, Zn),
      L = 116 * fY - 16,
      a = 500 * (fX - fY),
      b = 200 * (fY - fZ);

    return new Lab(L, a, b, this.alpha, this.whitepoint);
  }

  /**
   * Convert to LCHab color space.
   *
   * @return {LCHab}
   */
  toLCHab() {
    this.toLab().toLCHab();
  }

  /**
   * Convert to Luv color space.
   * Reference formula:
   *   Poynton, Charles (2012) Digital Video and HDTV. Second edition.
   *   ISBN: 978-0-12-391926-7, p. 280-282.
   *
   * @return {Luv}
   */
  toLuv() {
    const [Xn, Yn, Zn] = this.whitepoint,
      sumXnYnZn = Xn + 15 * Yn + 3 * Zn,
      u0 = (4 * Xn) / sumXnYnZn,
      v0 = (9 * Yn) / sumXnYnZn,
      sumXYZ = this.X + 15 * this.Y + 3 * this.Z,
      u1 = (4 * this.X) / sumXYZ,
      v1 = (9 * this.Y) / sumXYZ,
      y0 = this.Y / Yn,
      // Luv
      L = y0 > CIE.epsilon ? 116 * cbrt(y0) - 16 : CIE.kappa * y0,
      u = 13 * L * (u1 - u0),
      v = 13 * L * (v1 - v0);

    return new Luv(L, u, v, this.alpha);
  }

  /**
   * Convert to LCHuv color space.
   *
   * @return {LCHuv}
   */
  toLCHuv() {
    this.toLuv().toLCHuv();
  }

  /**
   * Convert to Yxy color space.
   *
   * @return {Yxy}
   */
  toYxy() {
    const [Xn, Yn, Zn] = this.whitepoint,
      sumXYZ = this.X + this.Y + this.Z;
    let x, y;

    if (sumXYZ > 0) {
      x = this.X / sumXYZ;
      y = this.Y / sumXYZ;
    } else {
      // todo research whether return x,y as reference white point (Xn, Yn) or (0, 0)?
      const sumWhitepoint = Xn + Yn + Zn;
      x = Xn / sumWhitepoint;
      y = Yn / sumWhitepoint;
    }

    return new Yxy(this.Y, x, y, this.alpha, this.whitepoint);
  }

  /**
   * Convert to RGB color space.
   * @note The values for transform are correlated with RGB working space and whitepoint.
   *
   * @param {?string} [space='sRGB'] The RGB space.
   * @param {?string} [illuminant='D65'] The source illuminant of XYZ space.
   * E.g. XYZ(D50) -> sRGB(D65)
   * @return {Rgb}
   */
  toRgb(space = 'sRGB', illuminant = 'D65') {
    if (!ColorSpace[space]) throw new Error(`Unknown color space '${space}'.`);

    /** @type RgbSpace */
    const rgbSpace = ColorSpace[space],
      [r, g, b] = rgbSpace.toRgb([this.X, this.Y, this.Z], illuminant);

    return new Rgb(r, g, b, this.alpha, space);
  }

  /**
   * Convert to CSS property.
   *
   * @return {string}
   */
  toCss() {
    return this.toRgb().toCss();
  }
}

/**
 * CIE L*C*hab color space.
 */
class LCHab {
  /**
   * @param {number} lightness The lightness, in range [0, >=100]%.
   *   Note: the value > 100% are permitted (for compatibility with HDR), and must not be clamped.
   * @param {number} chroma The chroma is "amount of color", in range [0, ~230].
   * @param {number} hue The hue, in range [0, 360].
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   */
  constructor(lightness, chroma, hue, alpha = 1) {
    this.l = lightness;
    this.c = chroma;
    this.h = hue;
    this.alpha = alpha;
  }

  /**
   * Convert to Lab color space.
   *
   * @return {Lab}
   */
  toLab() {
    const rad = this.h * DEG2RAD;
    return new Lab(this.l, this.c * cos(rad), this.c * sin(rad), this.alpha);
  }

  /**
   * Convert to XYZ color space.
   *
   * @return {Xyz}
   */
  toXyz() {
    return this.toLab().toXyz();
  }

  /**
   * Convert to Luv color space.
   *
   * @return {Luv}
   */
  toLuv() {
    return this.toLab().toXyz().toLuv();
  }

  /**
   * Convert to LCHuv color space.
   *
   * @return {LCHuv}
   */
  toLCHuv() {
    return this.toXyz().toLCHuv();
  }

  /**
   * Convert to RGB.
   *
   * todo Investigate whether the chromatic adaptation D50 to D65 is necessary
   *   see LCH_to_sRGB() in https://drafts.csswg.org/css-color-4/utilities.js
   *
   * @return {Rgb}
   */
  toRgb() {
    return this.toLab().toRgb();
  }

  /**
   * Convert to CSS property.
   *
   * todo Add support display-P3, see https://github.com/LeaVerou/css.land/blob/master/lch/lch.js
   *
   * @return {string}
   */
  toCss() {
    return this.toRgb().toCss();
  }
}

/**
 * CIE L*u*v* color space.
 */
class Luv {
  /**
   * @param {number} L The uniform lightness, in range [0, 100].
   * @param {number} u The chromaticity value, in range [-134, 224].
   * @param {number} v The chromaticity value, in range [-140, 122].
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   * @param {?Tristimulus} [whitepoint=referenceWhite] The reference white.
   *   Defaults, the whitepoint is for observer 2° and illuminate D65.
   */
  constructor(L, u, v, alpha = 1, whitepoint = referenceWhite) {
    this.L = L;
    this.u = u;
    this.v = v;
    this.alpha = alpha;
    this.whitepoint = whitepoint;
  }

  /**
   * Convert to Lab color space.
   *
   * @return {Lab}
   */
  toLab() {
    return this.toXyz().toLab();
  }

  /**
   * Convert to XYZ color space.
   * @see https://en.wikipedia.org/wiki/CIELUV
   * Reference formula: Poynton, Charles (2012) Digital Video and HDTV. Second edition.
   *                    ISBN: 978-0-12-391926-7, p. 280-282.
   * @return {Xyz}
   */
  toXyz() {
    const [Xn, Yn, Zn] = this.whitepoint,
      sumXnYnZn = Xn + 15 * Yn + 3 * Zn,
      u0 = (4 * Xn) / sumXnYnZn,
      v0 = (9 * Yn) / sumXnYnZn,
      u1 = this.u / (13 * this.L) + u0,
      v1 = this.v / (13 * this.L) + v0,
      L1 = (this.L + 16) / 116,
      // XYZ
      Y = this.L > CIE.kappa * CIE.epsilon ? L1 * L1 * L1 : this.L / CIE.kappa,
      X = (Y * 9 * u1) / (4 * v1),
      Z = (Y * (12 - 3 * u1 - 20 * v1)) / (4 * v1);

    return new Xyz(X, Y, Z, this.alpha, this.whitepoint);
  }

  /**
   * Convert to Yxy color space.
   *
   * @return {Yxy}
   */
  toYxy() {
    const L1 = (this.L + 16) / 116,
      diffUV = 6 * this.u - 16 * this.v + 12,
      Y = this.L > CIE.kappa * CIE.epsilon ? L1 * L1 * L1 : this.L / CIE.kappa,
      x = (9 * this.u) / diffUV,
      y = (4 * this.v) / diffUV;

    return new Yxy(Y, x, y, this.alpha, this.whitepoint);
  }

  /**
   * Convert to LCHab color space.
   *
   * @return {LCHab}
   */
  toLCHab() {
    return this.toXyz().toLab().toLCHab();
  }

  /**
   * Convert to LCHuv color space.
   *
   * @return {LCHuv}
   */
  toLCHuv() {
    const c = sqrt(this.u * this.u + this.v * this.v);
    let h = atan2(this.v, this.u) * RAD2DEG;
    if (h < 0) h += 360;

    return new LCHuv(this.L, c, h, this.alpha, this.whitepoint);
  }

  /**
   * Convert to RGB.
   *
   * @return {Rgb}
   */
  toRgb() {
    return this.toXyz().toRgb();
  }

  /**
   * Convert to CSS property.
   *
   * @return {string}
   */
  toCss() {
    return this.toRgb().toCss();
  }
}

/**
 * CIE L*C*Huv color space.
 */
class LCHuv {
  /**
   * @param {number} lightness The lightness, in range [0, >=100]%.
   *   Note: the value > 100% are permitted (for compatibility with HDR), and must not be clamped.
   * @param {number} chroma The chroma is "amount of color", in range [0, ~230].
   * @param {number} hue The hue, in range [0, 360].
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   * @param {?Tristimulus} [whitepoint=referenceWhite] The reference white.
   *   Defaults, the whitepoint is for observer 2° and illuminate D65.
   */
  constructor(lightness, chroma, hue, alpha = 1, whitepoint = referenceWhite) {
    this.L = lightness;
    this.c = chroma;
    this.h = hue;
    this.alpha = alpha;
    this.whitepoint = whitepoint;
  }

  /**
   * Convert to Luv color space.
   *
   * @return {Luv}
   */
  toLuv() {
    const u = this.c * cos(this.h * DEG2RAD),
      v = this.c * cos(this.h * DEG2RAD);

    return new Luv(this.L, u, v, this.alpha, this.whitepoint);
  }

  /**
   * Convert to XYZ color space.
   *
   * @return {Xyz}
   */
  toXyz() {
    return this.toLuv().toXyz();
  }

  /**
   * Convert to Lab color space.
   *
   * @return {Lab}
   */
  toLab() {
    return this.toLuv().toLab();
  }

  /**
   * Convert to LCHab color space.
   *
   * @return {LCHab}
   */
  toLCHab() {
    return this.toLuv().toLCHab();
  }
}

/**
 * CIE Yxy (aka xyY) color space.
 */
class Yxy {
  /**
   * @param {number} Y in range [0, 1]
   * @param {number} x in range [0, 1]
   * @param {number} y in range [0, 1]
   * @param {?number} [alpha=1] The opacity, in range [0, 1].
   * @param {?Tristimulus} [whitepoint=referenceWhite] The reference white.
   *   Defaults, the whitepoint is for observer 2° and illuminate D65.
   */
  constructor(Y, x, y, alpha = 1, whitepoint = referenceWhite) {
    this.x = x;
    this.y = y;
    this.Y = Y;
    this.alpha = alpha;
    this.whitepoint = whitepoint;
  }

  /**
   * Convert to XYZ color space.
   *
   * @return {Xyz}
   */
  toXyz() {
    let X = 0,
      Y = 0,
      Z = 0;

    if (this.y >= 1e-6) {
      X = (this.x * this.Y) / this.y;
      Y = this.Y;
      Z = ((1 - this.x - this.y) * this.Y) / this.y;
    }

    return new Xyz(X, Y, Z, this.alpha, this.whitepoint);
  }

  /**
   * Convert to Luv color space.
   *
   * @return {Luv}
   */
  toLuv() {
    const [Xn, Yn, Zn] = this.whitepoint,
      y0 = this.Y / Yn,
      sumXY = -2 * this.x + 12 * this.y + 3,
      L = y0 > CIE.epsilon ? 116 * cbrt(y0) - 16 : CIE.kappa * y0,
      u = (4 * this.x) / sumXY,
      v = (9 * this.y) / sumXY;

    return new Luv(L, u, v, this.alpha);
  }

  /**
   * Convert to RGB.
   *
   * @return {Rgb}
   */
  toRgb() {
    return this.toXyz().toRgb();
  }
}

/**
 * Convert hex color string to a new RGB color instance with the red, green, blue and alpha channels.
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
 * @return {Rgb}
 */
const fromHex = (hex, digits = null) => new Rgb(...hexToRgba(hex, digits));

/**
 * Returns a new RGB color instance with the red, green, blue and alpha channels.
 *
 * @param {number} red in range [0, 255]
 * @param {number} green in range [0, 255]
 * @param {number} blue in range [0, 255]
 * @param {?number} [alpha=1] in range [0, 1]
 * @return {Rgb}
 */
const fromRgb = (red, green, blue, alpha = 1) => new Rgb(red / 255, green / 255, blue / 255, alpha);

/**
 * Returns a new RGB color instance with the red, green, blue and alpha channels.
 *
 * @param {number} hue in range [0, 360]
 * @param {number} saturation in range [0, 100]
 * @param {number} value in range [0, 100]
 * @param {?number} [alpha=1] in range [0, 1]
 * @return {Rgb}
 */
const fromHsv = (hue, saturation, value, alpha = 1) => new Hsl(hue, saturation / 100, value / 100, alpha).toRgb();

/**
 * Returns a new RGB color instance with the red, green, blue and alpha channels.
 *
 * @param {number} hue in range [0, 360]
 * @param {number} saturation in range [0, 100]
 * @param {number} lightness in range [0, 100]
 * @param {?number} [alpha=1] in range [0, 1]
 * @return {Rgb}
 */
const fromHsl = (hue, saturation, lightness, alpha = 1) =>
  new Hsl(hue, saturation / 100, lightness / 100, alpha).toRgb();

/**
 * Calculates the luminance for a RGB color.
 * @see https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
 *
 * @param {[number, number, number]} rgb The RGB values.
 * @param {?string} [space='sRGB'] The RGB space.
 * @return {number} The luminance of the color.
 */
const luminance = function([r, g, b], space = 'sRGB') {
  const inverseGamma = ColorSpace[space].toLinear;

  return 0.2126 * inverseGamma(r) + 0.7152 * inverseGamma(g) + 0.0722 * inverseGamma(b);
};

/**
 * Calculates the contrast ratio between two RGB colors.
 * @see https://www.w3.org/TR/WCAG20-TECHS/G17.html#G17-tests
 *
 * @param {Rgb} rgb1 The first color.
 * @param {Rgb} rgb2 The second color.
 * @return {number} The contrast ratio between the given colors.
 */
const contrastRatio = function(rgb1, rgb2) {
  const luminance1 = luminance([rgb1.r, rgb1.g, rgb1.b]) + 0.05,
    luminance2 = luminance([rgb2.r, rgb2.g, rgb2.b]) + 0.05;

  return luminance1 < luminance2 ? luminance2 / luminance1 : luminance1 / luminance2;
};

/**
 * Returns light or dark color dependent on contrast.
 * @see https://developer.mozilla.org/en-US/docs/Web/Accessibility/Understanding_WCAG/Perceivable/Color_contrast
 *
 * Contrast AA Level:
 *   - 4.5: For normal text.
 *   - 3.1: For large (24px or more) or bold (19px*) text, non-text elements, like icons, charts and controls.
 * Contrast AAA Level:
 *   - 7.0: For normal text.
 *   - 4.5: For large (24px or more) or bold (19px*) text.
 *
 * @param {Rgb} rgb The RGB color.
 * @param {Rgb?} dark The dark RGBA color, defaults black.
 * @param {Rgb?} light The light RGBA color, defaults white.
 * @param {number?} contrast The minimal contrast ratio, defaults AA level (3.1).
 * @return {Rgb}
 */
const contrastTextColor = function(rgb, dark = new Rgb(0, 0, 0, 0.87), light = new Rgb(1, 1, 1), contrast = 3.1) {
  const color = rgb.alpha < 1 ? rgb.blend() : rgb,
    darkColor = dark.alpha < 1 ? dark.blend() : dark,
    lightColor = light.alpha < 1 ? light.blend() : light,
    darkContrast = contrastRatio(color, darkColor),
    lightContrast = contrastRatio(color, lightColor);

  return contrast > lightContrast && lightContrast < darkContrast ? light : dark;
};

/**
 * The alpha compositing (alpha blending) of a colors by the alpha channel.
 * @see https://www.w3.org/TR/compositing-1/#simplealphacompositing
 *
 * @param {...[string|Rgb]} colors The one or more arguments as RRGGBBAA string or Rgb(r, g, b, a) object.
 * @return {Rgb}
 */
const blend = function(...colors) {
  let amount = colors.length,
    color,
    result,
    i;

  // when defined only one color then composite the color with fully opaque white backdrop
  if (amount === 1) amount = colors.unshift(new Rgb(1, 1, 1, 1));

  const fnBlend = (sourceColor, sourceAlpha, backdropColor, backdropAlpha) =>
    sourceColor * sourceAlpha + backdropColor * backdropAlpha * (1 - sourceAlpha);

  for (i = 0; i < amount; i++) {
    color = colors[i];
    // Note: the precision is exact 2 digits after decimal point by convert hex color to rgba values in range [0, 1].
    if (typeof color === 'string') color = fromHex(color, 2);

    if (!result) {
      result = color;
      continue;
    }

    result.r = fnBlend(color.r, color.alpha, result.r, result.alpha);
    result.g = fnBlend(color.g, color.alpha, result.g, result.alpha);
    result.b = fnBlend(color.b, color.alpha, result.b, result.alpha);
    result.alpha = 1;
  }

  return result;
};

// aggregates color space classes, color properties, color constants and color methods under the namespace `Color`
export default {
  Rgb,
  Hsv,
  Hsl,
  Lab,
  LCHab,
  Xyz,
  Yxy,
  Luv,
  LCHuv,
  fromHex,
  fromRgb,
  fromHsv,
  fromHsl,
  isHexColor,
  getWhitepoint,
  contrastRatio,
  luminance,
};

// todo test and compare with references:
// https://gist.github.com/exavolt/bdc830c8118aebbc00f7f03c089d1ed7
// https://material.io/inline-tools/color/

import * as MathUtils from '@webdiscus/math-utils';
import Color from './Color.js';

import {
  GOLDEN_PALETTES,
  GOLDEN_LIGHT_PALETTES,
  GOLDEN_DARK_PALETTES,
  LIGHTNESS_COMPENSATION,
  CHROMA_COMPENSATION,
  CHROMA_COMPENSATION_LIGHT,
} from './data/GoldenPaletteConstants.js';

// Color tones in palette, where A100, A200, A400, A700 are accent tones.
const PALETTE_TONES = [
  '50',
  '100',
  '200',
  '300',
  '400',
  '500',
  '600',
  '700',
  '800',
  '900',
  'A100',
  'A200',
  'A400',
  'A700',
];

let white = new Color.Rgb(1, 1, 1, 1);
let black = new Color.Rgb(0, 0, 0, 0.87);

const WHITE_COLOR = new Color.Rgb(1, 1, 1);
const BLACK_COLOR = new Color.Rgb(0, 0, 0);

const lightTextEmphasis = {
  high: new Color.Rgb(1, 1, 1, 1),
  medium: new Color.Rgb(1, 1, 1, 0.6),
  disabled: new Color.Rgb(1, 1, 1, 0.38),
};

const darkTextEmphasis = {
  high: new Color.Rgb(0, 0, 0, 0.87),
  medium: new Color.Rgb(0, 0, 0, 0.6),
  disabled: new Color.Rgb(0, 0, 0, 0.38),
};

/**
 * Get text contrast color on surface.
 *
 * @param {Rgb} rgbColor
 * @return {Rgb}
 */
const getTextColor = function (rgbColor) {
  const MIN_CONTRAST = 4.5;

  const whiteContrast = Color.contrastRatio(WHITE_COLOR, rgbColor);
  if (whiteContrast >= MIN_CONTRAST) return lightTextEmphasis.high;

  const darkContrast = Color.contrastRatio(BLACK_COLOR, rgbColor);

  if (darkContrast >= MIN_CONTRAST || darkContrast >= whiteContrast) return darkTextEmphasis.high;

  return lightTextEmphasis.high;
};

// The rules ensure a harmonic balance of color-palettes.
const harmonyRules = {
  mono: [],
  complementary: [180],
  splitComplementary: [150, -150],
  analogous: [30, -30],
  triadic: [120, -120],
  tetradic: [90, 180, 270],
};

/**
 * The structure of color palette object.
 *
 * @typedef {{}} ColorPaletteObject
 * @property {number} baseColorIndex
 * @property {Color.Rgb[]} colors
 */

class ColorPalette {
  // static property white
  static get white() {
    return white;
  }

  static set white(color) {
    return (white = color);
  }

  // static property black
  static get black() {
    return black;
  }

  static set black(color) {
    black = color;
  }

  /**
   * Determine whether the color is light or dark.
   * See https://www.w3.org/TR/WCAG20-TECHS/G18.html
   *     https://www.w3.org/TR/WCAG20-TECHS/G183.html
   *
   * @param color The rgba color.
   * @returns {string} Return dark|light.
   */
  static getColorTone(color) {
    if (typeof color === 'string' && ['dark', 'light'].indexOf(color) >= 0) {
      return color;
    }

    let minimumContrast = 3.1,
      lightContrast = Color.contrastRatio(color, this.white),
      darkContrast = Color.contrastRatio(color, this.black);

    if (lightContrast < minimumContrast && darkContrast > lightContrast) {
      return 'light';
    }

    return 'dark';
  }

  /**
   * Get palette tone by index.
   *
   * @param index The index of tone in palette.
   * @returns {string}
   */
  static getPaletteTone(index) {
    return PALETTE_TONES[index];
  }

  /**
   * Find the closest golden palette.
   *
   * @param {Lab} color The source color.
   * @param {(Lab[])[]} [palettes=GOLDEN_PALETTES] The harmonious palettes.
   * @returns {{baseColorIndex: number, colors: Lab[]}}
   */
  static findClosestPalette(color, palettes = GOLDEN_PALETTES) {
    if (!palettes.length || !palettes[0].length) throw Error('Invalid golden palettes');

    let colorIndex,
      minDeltaE = Infinity,
      paletteColors = palettes[0],
      baseColorIndex = -1,
      paletteIndex,
      deltaE;

    for (paletteIndex = 0; paletteIndex < palettes.length; paletteIndex++) {
      for (colorIndex = 0; colorIndex < palettes[paletteIndex].length && 0 < minDeltaE; colorIndex++) {
        const lab1 = palettes[paletteIndex][colorIndex];
        deltaE = lab1.deltaE(color);
        if (deltaE < minDeltaE) {
          minDeltaE = deltaE;
          paletteColors = palettes[paletteIndex];
          baseColorIndex = colorIndex;
        }
      }
    }

    return {
      baseColorIndex: baseColorIndex,
      colors: paletteColors,
    };
  }

  /**
   * Create color palette by base color.
   *
   * @param {string} hexColor The source color.
   * @param {(Lab[])[]} [palettes=GOLDEN_PALETTES] The harmonious palettes.
   * @param {number[]} [lightnessCompensation=LIGHTNESS_COMPENSATION]
   * @param {number[]} [chromaCompensation=CHROMA_COMPENSATION]
   * @returns {ColorPaletteObject}
   */
  static createPalette(hexColor, palettes, lightnessCompensation, chromaCompensation) {
    let maxLightness = 100;

    const colorRGB = Color.fromHex(hexColor),
      colorLab = colorRGB.toLab(),
      colorLCH = colorLab.toLCHab(),
      goldenPalette = this.findClosestPalette(colorLab),
      goldenColors = goldenPalette.colors,
      baseGoldenColorIndex = goldenPalette.baseColorIndex,
      baseGoldenColor = goldenColors[baseGoldenColorIndex],
      baseGoldenColorLCH = baseGoldenColor.toLCHab(),
      isGoldenColorChromaInMiddle = 30 > goldenColors[5].toLCHab().c,
      deltaLightness = baseGoldenColorLCH.l - colorLCH.l,
      deltaChroma = baseGoldenColorLCH.c - colorLCH.c,
      deltaHue = baseGoldenColorLCH.h - colorLCH.h,
      baseLC = lightnessCompensation[baseGoldenColorIndex],
      baseCC = chromaCompensation[baseGoldenColorIndex],
      lightnessStep = 1.7;

    const paletteColors = goldenColors.map(function (color, colorIndex) {
      if (color === baseGoldenColor) {
        maxLightness = Math.max(colorLCH.l - 1.7, 0);
        return colorRGB;
      }

      if (colorIndex === 10) {
        // for color from 900 to A100
        maxLightness = 100;
      }

      let cLch = color.toLCHab(),
        hue = (cLch.h - deltaHue + 360) % 360,
        lightness = cLch.l - (lightnessCompensation[colorIndex] / baseLC) * deltaLightness;
      lightness = MathUtils.clamp(Math.min(lightness, maxLightness), 0, 100);

      let chroma = isGoldenColorChromaInMiddle
        ? cLch.c - deltaChroma
        : cLch.c - deltaChroma * Math.min(chromaCompensation[colorIndex] / baseCC, 1.25);
      chroma = Math.max(0, chroma);

      maxLightness = Math.max(lightness - lightnessStep, 0);

      return new Color.LCHab(lightness, chroma, hue, color.alpha).toRgb();
    });

    return {
      baseColorIndex: baseGoldenColorIndex,
      colors: paletteColors,
    };
  }

  /**
   * Create harmonious color palette with accent tones.
   *
   * @param {string} hexColor
   * @returns {ColorPaletteObject}
   */
  static createColorPalette(hexColor) {
    return this.createPalette(hexColor, GOLDEN_PALETTES, LIGHTNESS_COMPENSATION, CHROMA_COMPENSATION);
  }

  /**
   * Create harmonious color palette with light tones.
   *
   * @param {string} hexColor
   * @returns {ColorPaletteObject}
   */
  static createLightPalette(hexColor) {
    return this.createPalette(hexColor, GOLDEN_LIGHT_PALETTES, LIGHTNESS_COMPENSATION, CHROMA_COMPENSATION_LIGHT);
  }

  /**
   * Create harmonious color palette with dark tones.
   *
   * @param {string} hexColor
   * @returns {ColorPaletteObject}
   */
  static createDarkPalette(hexColor) {
    return this.createPalette(hexColor, GOLDEN_DARK_PALETTES, LIGHTNESS_COMPENSATION, CHROMA_COMPENSATION);
  }

  /**
   * Create color palettes by list of angles.
   *
   * @param {string} hexColor
   * @param {Array<number>} angles The list of color rotation angles.
   * @returns {ColorPaletteObject[]}
   */
  static createColorPalettesByAngles(hexColor, angles) {
    let hslColor = Color.fromHex(hexColor).toHsl(),
      len = angles.length,
      palettes = [this.createColorPalette(hexColor)],
      i = 0;

    while (len--) {
      let color = hslColor
        .rotate(angles[i++])
        .toRgb()
        .toHex();
      palettes.push(this.createColorPalette(color));
    }

    return palettes;
  }

  /**
   * Create color palettes by harmony rule.
   *
   * @param {string} hexColor
   * @param {string} rule The name of color harmony rule. See `harmonyRules`.
   * @returns {ColorPaletteObject[]}
   */
  static createColorPalettesByRule(hexColor, rule) {
    let angles = harmonyRules[rule] || [];

    return this.createColorPalettesByAngles(hexColor, angles);
  }

  /**
   * Create complementary color palette.
   *
   * H0 is base color.
   * H1 = |(H0 + 180 degrees) - 360 degrees|
   *
   * @param {string} hexColor The base hex color.
   * @returns {ColorPaletteObject[]}
   */
  static createComplementaryColorPalette(hexColor) {
    return this.createColorPalettesByRule(hexColor, 'complementary');
  }

  /**
   * Create split complementary color palette.
   *
   * H0 is base color.
   * H1 = |(H0 + 150 degrees) - 360 degrees|
   * H2 = |(H0 + 210 degrees) - 360 degrees|
   *
   * @param {string} hexColor The base hex color.
   * @returns {ColorPaletteObject[]}
   */
  static createSplitComplementaryColorPalette(hexColor) {
    return this.createColorPalettesByRule(hexColor, 'splitComplementary');
  }

  /**
   * Create analogous color palettes.
   *
   * H1 = |(H0 + 30 degrees) - 360 degrees| -30 degrees from base color.
   * H2 = |(H0 + 60 degrees) - 360 degrees| The base color.
   * H3 = |(H0 + 90 degrees) - 360 degrees| +30 degrees to base color.
   *
   * @param {string} hexColor The base hex color.
   * @returns {ColorPaletteObject[]}
   */
  static createAnalogousColorPalettes(hexColor) {
    return this.createColorPalettesByRule(hexColor, 'analogous');
  }

  /**
   * Create triadic color palettes.
   *
   * H0 is base color.
   * H1 = |(H0 + 120 degrees) - 360 degrees|
   * H2 = |(H0 + 240 degrees) - 360 degrees|
   *
   * @param {string} hexColor The base hex color.
   * @returns {ColorPaletteObject[]}
   */
  static createTriadicColorPalettes(hexColor) {
    return this.createColorPalettesByRule(hexColor, 'triadic');
  }

  /**
   * Create tetradic color palettes.
   *
   * H0 is base color.
   * H1 = |(H0 +  90 degrees) - 360 degrees|
   * H2 = |(H0 + 180 degrees) - 360 degrees|
   * H4 = |(H0 + 270 degrees) - 360 degrees|
   *
   * @param {string} hexColor The base hex color.
   * @returns {ColorPaletteObject[]}
   */
  static createTetradicColorPalettes(hexColor) {
    return this.createColorPalettesByRule(hexColor, 'tetradic');
  }
}

export { ColorPalette };
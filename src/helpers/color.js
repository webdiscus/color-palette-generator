import Color from '@webdiscus/cie-color';
import { ColorPalette } from '@webdiscus/cie-color/src/ColorPalette';

export const colorWeightMap = [
  50,
  100,
  200,
  300,
  400,
  500,
  600,
  700,
  800,
  900,
  'A100',
  'A200',
  'A400',
  'A700',
];

export function getContrastColor(rgb) {
  let white = 'white',
    black = 'rgba(0, 0, 0, 0.87)';

  return ColorPalette.getColorTone(rgb) === 'dark' ? white : black;
}

export function getContrastColorTone(rgb) {
  return ColorPalette.getColorTone(rgb) === 'dark' ? 'light' : 'dark';
}

export function generateColorPalettesByRule(colorHex, colorRule = '') {
  return ColorPalette.createColorPalettesByRule(colorHex, colorRule);
}
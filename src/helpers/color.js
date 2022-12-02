import Color from '@webdiscus/cie-color';
import { ColorPalette } from '@webdiscus/cie-color/src/ColorPalette';

export const colorWeightList = [
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
  const lightColor = 'white';
  const darkColor = 'rgba(0, 0, 0, 0.87)';

  return ColorPalette.getColorTone(rgb) === 'dark' ? lightColor : darkColor;
}

export function getContrastColorTone(rgb) {
  return ColorPalette.getColorTone(rgb) === 'dark' ? 'light' : 'dark';
}

export function generateColorPalettesByRule(colorHex, colorRule = '') {
  return ColorPalette.createColorPalettesByRule(colorHex, colorRule);
}
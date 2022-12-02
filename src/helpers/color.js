import { ColorPalette } from '@webdiscus/cie-color/src/ColorPalette';

export function getContrastColor(rgb) {
  const lightColor = 'white';
  const darkColor = 'rgba(0, 0, 0, 0.87)';

  return ColorPalette.getColorTone(rgb) === 'dark' ? lightColor : darkColor;
}

export function getContrastColorTone(rgb) {
  return ColorPalette.getColorTone(rgb) === 'dark' ? 'light' : 'dark';
}

export function getPaletteToneName(index) {
  return ColorPalette.getPaletteTone(index);
}

export function generateColorPalettesByRule(colorHex, colorRule = '') {
  return ColorPalette.createColorPalettesByRule(colorHex, colorRule);
}
import styles from './styles.scss';

import { useContext } from 'react';

import Color from '@webdiscus/cie-color';
import { getPaletteToneName, generateColorPalettesByRule, getContrastColorTone } from '/@/helpers/color';

import ColorPalette from '/@/components/ColorPalette';
import ColorPickerContext from '/@/components/ColorPicker/ColorPicker';

export default function ColorPaletteList() {
  const PickerColor = useContext(ColorPickerContext);
  const { colorHex } = PickerColor;

  // TODO: add selectors for color rules in HTML form
  // harmonic color rules: mono, complementary, splitComplementary, analogous, triadic, tetradic
  const colorRule = 'tetradic';
  const palettes = generateColorPalettesByRule(colorHex, colorRule);
  const [basePalette] = palettes;
  const { baseColorIndex, colors } = basePalette;

  const baseColor = colors[baseColorIndex];
  const primaryColor = new Color.Rgb(baseColor.r, baseColor.g, baseColor.b);
  const primaryColorHex = primaryColor.toHex();
  const primaryContrastTone = getContrastColorTone(primaryColor);

  const colorCodes = [
    '// SCSS primary color palette',
    `$primary: #${primaryColorHex};`,
  ];

  const colorContrastCodes = [
    '// contrast colors for text ',
    '$light-color: white; // <= define it yourself',
    '$dark-color: rgba(0, 0, 0, 0.87); // <= define it yourself',
    `$primary-contrast: $${primaryContrastTone}-color;`,
  ];

  colors.forEach(({ r, g, b }, index) => {
    const colorRgb = new Color.Rgb(r, g, b);
    const colorHex = colorRgb.toHex();
    const colorTone = getContrastColorTone(colorRgb);
    const toneName = getPaletteToneName(index);

    colorCodes.push(`$primary-${toneName}: #${colorHex};`);
    colorContrastCodes.push(`$primary-${toneName}-contrast: $${colorTone}-color;`);
  });

  const generatedCodes = [...colorCodes, '', ...colorContrastCodes].join('<br>');

  return (
    <>
      <div className='color-palette-list'>
        {palettes.map((palette, index) => <ColorPalette key={index} palette={palette} />)}
      </div>

      <h3>SCSS variables</h3>
      <div className='color-palette-codes' dangerouslySetInnerHTML={{ __html: generatedCodes }}></div>
    </>
  );
}
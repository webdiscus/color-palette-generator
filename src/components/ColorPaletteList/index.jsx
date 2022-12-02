import styles from './styles.scss';

import { useRef, useContext } from 'react';

import ColorPalette from '/@/components/ColorPalette';
import ColorPickerContext from '/@/components/ColorPicker/ColorPicker';
import { colorWeightMap, generateColorPalettesByRule } from '/@/helpers/color';
import Color from '@webdiscus/cie-color';

export default function ColorPaletteList() {
  const PickerColor = useContext(ColorPickerContext);
  const { colorHex } = PickerColor;

  // harmonic color rules: mono, complementary, splitComplementary, analogous, triadic, tetradic
  //const colorRule = '';
  const colorRule = 'tetradic';
  const palettes = generateColorPalettesByRule(colorHex, colorRule);
  const [basePalette] = palettes;
  const { baseColorIndex, colors } = basePalette;

  // TODO: refactor
  //console.log('>> color palettes: ', palettes);

  let codes = colors.map(({ r, g, b }, index) => {
    const colorHex = new Color.Rgb(r, g, b).toHex();
    return `$primary-${colorWeightMap[index]}: #${colorHex};`;
  });

  const baseColor = colors[baseColorIndex];
  const primaryColorHex = new Color.Rgb(baseColor.r, baseColor.g, baseColor.b).toHex();
  codes = [`$primary: #${primaryColorHex};`, ...codes];

  return (
    <>
      <div className='color-palette-list'>
        {palettes.map((palette, index) => <ColorPalette key={index} palette={palette} />)}
      </div>

      <h3>SCSS variables</h3>
      <div className='color-palette-codes' dangerouslySetInnerHTML={{ __html: codes.join('<br>') }}></div>
    </>
  );
}
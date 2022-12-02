import styles from './styles.scss';

import Color from '@webdiscus/cie-color';
import { colorWeightMap, getContrastColor } from '/@/helpers/color';

export default function ColorPalette({ palette }) {
  const { baseColorIndex, colors } = palette;

  //console.log('>> palette: ', palette);

  return (
    <div className='color-palette'>
      {colors.map(
        ({ r, g, b }, index) => <div className='cell' style={{
          backgroundColor: new Color.Rgb(r, g, b).toCss(),
          color: getContrastColor(new Color.Rgb(r, g, b).toHex()),
        }}
                                     key={index}>{renderCellInnerText(baseColorIndex, index)}
        </div>)}
    </div>
  );
}

function renderCellInnerText(baseColorIndex, index) {
  return `${index === baseColorIndex ? '√ ' : ''} ${colorWeightMap[index]}`;
}
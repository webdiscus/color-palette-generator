import styles from './styles.scss';

import Color from '@webdiscus/cie-color';
import { getPaletteToneName, getContrastColor } from '/@/helpers/color';

export default function ColorPalette({ palette }) {
  const { baseColorIndex, colors } = palette;

  //console.log('>> palette: ', palette);

  return (
    <div className='color-palette'>
      {colors.map(
        (rgb, index) => {
          return <div className='cell' style={getCellStyle(rgb)} key={index}>{getCellText(baseColorIndex,
            index)} </div>;
        })}
    </div>
  );
}

function getCellStyle({ r, g, b }) {
  const rgb = new Color.Rgb(r, g, b);

  return {
    backgroundColor: rgb.toCss(),
    color: getContrastColor(rgb),
  };
}

function getCellText(baseColorIndex, index) {
  return `${index === baseColorIndex ? '√ ' : ''} ${getPaletteToneName(index)}`;
}
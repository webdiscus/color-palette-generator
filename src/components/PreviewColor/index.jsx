import styles from './styles.scss';

import { useRef, useContext, useEffect } from 'react';

import ColorPickerContext from '/@/components/ColorPicker/ColorPicker';
import { getContrastColor } from '/@/helpers/color';

export default function PreviewColor() {
  const refPreview = useRef();
  const PickerColor = useContext(ColorPickerContext);
  const { colorHex } = PickerColor;

  useEffect(() => {
    /** @type {HTMLElement} elm */
    const elm = refPreview.current;
    const textColor = getContrastColor(colorHex);

    if (elm) {
      elm.style.backgroundColor = `#${colorHex}`;
      elm.style.color = textColor;
    }
  }, [colorHex]);

  return (
    <div ref={refPreview} className='preview-color'>
      <div className='content'>
        <div className='h2'>Lorem ipsum dolor sit amet</div>
        <div className='p'>Integer facilisis risus vitae quam volutpat elementum. Maecenas vel libero a sem dapibus
          aliquam at non turpis.
        </div>
      </div>
    </div>
  );
}
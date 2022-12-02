import styles from './styles.scss';

import { useReducer } from 'react';
import PreviewColor from '/@/components/PreviewColor';
import ColorPicker from '/@/components/ColorPicker';
import ColorPickerContext from '/@/components/ColorPicker/ColorPicker';

import ColorPaletteList from '/@/components/ColorPaletteList';

// initial color hex code for color picker
const initialColorHex = '#2b949e';

export default function App() {
  const [color, colorDispatch] = useReducer(colorReducer, null, () => ({ colorHex: initialColorHex }));

  return (
    <ColorPickerContext.Provider value={color}>
      <h1>Color palette builder</h1>

      <div className='flex-row max-fit'>
        <div className='flex-column'>
          <PreviewColor />
        </div>
        <div className='flex-column'>
          <ColorPicker initialColorHex={initialColorHex} colorDispatch={colorDispatch} />
        </div>
      </div>

      <div>
        <ColorPaletteList />
      </div>
    </ColorPickerContext.Provider>
  );
}

function colorReducer(color, message = {}) {
  // return new object to trigger useEffect
  return { ...color };
}
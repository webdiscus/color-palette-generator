import { createContext } from 'react';

const ColorPickerContext = createContext({
  // color hex code
  colorHex: '#f00',
  // HSV/HSB color space used in color picker
  hsv: null,
});

export default ColorPickerContext;
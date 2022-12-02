import { useState, useContext } from 'react';
import ColorPickerContext from '/@/components/ColorPicker/ColorPicker';
import Color from '@webdiscus/cie-color';

export default function useColor(initValue) {
  const [colorHex, setColorHex] = useState(initValue);
  const [hsv, setHsv] = useState(Color.fromHex(initValue).toHsv());
  const [hue, setHue] = useState(hsv.h);
  const [saturation, setSaturation] = useState(hsv.s);
  const [brightness, setBrightness] = useState(hsv.v);

  const PickerColor = useContext(ColorPickerContext);
  PickerColor.hsv = hsv;
  PickerColor.colorHex = hsv.toRgb().toHex();

  return {
    colorHex, setColorHex,
    hsv, setHsv,
    hue, setHue,
    saturation, setSaturation,
    brightness, setBrightness,
  };
}
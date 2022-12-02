import styles from './styles.scss';

import { useState, useRef, useEffect, useContext, useMemo } from 'react';

import Color from '@webdiscus/cie-color';
import RangeSlider from '/@/components/RangeSlider';
import PickingArea from '/@/components/PickingArea';
import InputText from '/@/components/InputText';
import useColor from '/@/hooks/useColor';
import ColorPickerContext from '/@/components/ColorPicker/ColorPicker';

/**
 * The list of hue slider colors to calculate it according to saturation, lightness, etc.
 * @type {Color.Hsl[]}
 */
const hueSliderColors = [
  Color.fromHex('#ff0000').toHsl(),
  Color.fromHex('#ffff00').toHsl(),
  Color.fromHex('#00ff00').toHsl(),
  Color.fromHex('#00ffff').toHsl(),
  Color.fromHex('#0000ff').toHsl(),
  Color.fromHex('#ff00ff').toHsl(),
  Color.fromHex('#ff0000').toHsl(),
];

export default function ColorPicker({ initialColorHex = '#f00', colorDispatch }) {
  const PickerColor = useContext(ColorPickerContext);
  const { hsv, setHsv, hue, setHue, saturation, setSaturation, brightness, setBrightness } = useColor(initialColorHex);

  // TODO: refactor into separate 'useSliderProps' custom hook
  const [pickingAreaProps, setPickingAreaProps] = useState({
    x: hsv.s, // saturation
    y: hsv.v, // brightness
    xMin: 0,
    xMax: 1,
    yMin: 0,
    yMax: 1,
    step: 0.01,
  });

  const [hueProps, setHueProps] = useState({
    value: hsv.h,
    min: 0,
    max: 360,
    step: 1,
  });

  const [saturationProps, setSaturationProps] = useState({
    value: hsv.s,
    min: 0,
    max: 1,
    step: 0.01,
  });

  const [brightnessProps, setBrightnessProps] = useState({
    value: hsv.v,
    min: 0,
    max: 1,
    step: 0.01,
  });

  // references to component module API
  const refAreaPickerSlider = useRef();
  const refHueSlider = useRef();
  const refSaturationSlider = useRef();
  const refBrightnessSlider = useRef();

  // references to input elements
  const refInputHex = useRef();
  const refInputR = useRef();
  const refInputG = useRef();
  const refInputB = useRef();

  useEffect(() => {
    setHsv(new Color.Hsv(hue, saturation, brightness));

    const rgb = hsv.toRgb();
    const [r, g, b] = rgb.toValues();
    const cssColor = rgb.toCss();

    // update color in other components
    colorDispatch(PickerColor);

    if (refInputHex.current) refInputHex.current.value = rgb.toHex();
    if (refInputR.current) refInputR.current.value = r;
    if (refInputG.current) refInputG.current.value = g;
    if (refInputB.current) refInputB.current.value = b;

    // area picker
    /** @type {RectSlider} areaPickerSlider */
    const areaPickerSlider = refAreaPickerSlider.current;
    areaPickerSlider.areaElm.style.backgroundColor = new Color.Hsl(hsv.h, 1, 0.5).toCss();
    //areaPickerSlider.thumbElm.style.backgroundColor = cssColor;

    // hue slider
    /** @type {RangeSlider} hueSlider */
    const hueSlider = refHueSlider.current;
    const hsl = hsv.toHsl();
    const hueColors = hueSliderColors.map((color) => {
      color.s = hsl.s;
      color.l = hsl.l;
      return color.toCss();
    }).join(',');

    hueSlider.trackElm.style.backgroundImage = `linear-gradient(to right, ${hueColors})`;
    //hueSlider.thumbElm.style.backgroundColor = cssColor;

    // saturation slider
    /** @type {RangeSlider} saturationSlider */
    const saturationSlider = refSaturationSlider.current;
    let saturationSliderColor = new Color.Hsv(0, 0, hsv.v).toCss();

    saturationSlider.trackElm.style.backgroundColor = new Color.Hsv(hsv.h, 1, hsv.v).toCss();
    saturationSlider.trackElm.style.backgroundImage = `linear-gradient(to right, ${saturationSliderColor}, transparent`;
    //saturationSlider.thumbElm.style.backgroundColor = cssColor;

    // brightness slider
    /** @type {RangeSlider} brightnessSlider */
    const brightnessSlider = refBrightnessSlider.current;

    brightnessSlider.trackElm.style.backgroundColor = new Color.Hsv(hsv.h, hsv.s, 1).toCss();
    //brightnessSlider.thumbElm.style.backgroundColor = cssColor;

    return (() => {
      //console.log('>> useEffect hsv: ', hsv);
    });
  }, [hue, saturation, brightness]);

  function onPickingColor(event) {
    const { x: saturation, y } = event.detail.value;
    const brightness = 1 - y;

    setSaturationProps({ ...saturationProps, value: saturation });
    setBrightnessProps({ ...brightnessProps, value: brightness });
    setSaturation(saturation);
    setBrightness(brightness);
  }

  function onPickingHue(event) {
    setHue(event.detail.value);
  }

  function onPickingSaturation(event) {
    const newSaturation = event.detail.value;

    // TODO: bugfix - the brightness has always initial value, but must be current
    setPickingAreaProps({ ...pickingAreaProps, x: newSaturation, y: brightness });
    setSaturation(newSaturation);
  }

  function onPickingBrightness(event) {
    const newBrightness = event.detail.value;

    // TODO: bugfix - the saturation has always initial value, but must be current
    //console.log('>> onPickingBrightness: ', saturation, hsv.s,);
    setPickingAreaProps({ ...pickingAreaProps, x: saturation, y: newBrightness });
    setBrightness(newBrightness);
  }

  function onChangeHex(event) {
    const colorHex = event.currentTarget.value;

    if (Color.isHexColor(colorHex)) {
      const newHsv = Color.fromHex(colorHex).toHsv();

      // save new color
      setHsv(newHsv);

      // trigger useEffect
      setHue(newHsv.h);
      setSaturation(newHsv.s);
      setBrightness(newHsv.v);

      // re-draw all slider components
      setPickingAreaProps({ ...pickingAreaProps, x: newHsv.s, y: newHsv.v });
      setHueProps({ ...hueProps, value: newHsv.h });
      setSaturationProps({ ...saturationProps, value: newHsv.s });
      setBrightnessProps({ ...brightnessProps, value: newHsv.v });
    }
  }

  function onChangeRed(event) {
    const red = event.currentTarget.value;
    // TODO
    console.log('>> Input R: ', red);
  }

  function onChangeGreen(event) {
    const green = event.currentTarget.value;
    // TODO
    console.log('>> Input G: ', green);
  }

  function onChangeBlue(event) {
    const blue = event.currentTarget.value;
    // TODO
    console.log('>> Input B: ', blue);
  }

  // use memo to avoid not needed re-renders
  const PickingAreaMemo = useMemo(
    () => <PickingArea
      className='color-picking-area'
      onPicking={onPickingColor}
      refModule={refAreaPickerSlider}
      {...pickingAreaProps}
    />,
    [hsv]);

  return (
    <div className='color-palette-picker'>

      {PickingAreaMemo}

      <RangeSlider className='hue-slider' onPicking={onPickingHue} refModule={refHueSlider} {...hueProps} />
      <RangeSlider className='saturation-slider' onPicking={onPickingSaturation}
                   refModule={refSaturationSlider} {...saturationProps} />
      <RangeSlider className='brightness-slider' onPicking={onPickingBrightness}
                   refModule={refBrightnessSlider} {...brightnessProps} />

      <div className='color-input-container flex-row'>
        <InputText refElm={refInputHex} className='input-hex' maxLength='7' placeholder='Hex code'
                   onChange={onChangeHex} />
        <InputText refElm={refInputR} className='input-rgb' maxLength='3' placeholder='R' onChange={onChangeRed} />
        <InputText refElm={refInputG} className='input-rgb' maxLength='3' placeholder='G' onChange={onChangeGreen} />
        <InputText refElm={refInputB} className='input-rgb' maxLength='3' placeholder='B' onChange={onChangeBlue} />
      </div>
    </div>
  );
}
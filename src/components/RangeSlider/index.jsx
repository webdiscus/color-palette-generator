import styles from './styles.scss';

import { useRef, useEffect } from 'react';

import Slider from '@webdiscus/range-slider';
import Thumb from '/@/components/Thumb';

export default function RangeSlider({
  className,
  name,
  value = 0,
  min = 0,
  max = 1,
  step = 0.1,
  onPicking = () => {}, // function dispatched by mouse events
  refModule = null, // reference to module instance to allow use it in parent component
}) {
  const refRoot = useRef();

  useEffect(() => {
    const elm = refRoot.current;

    refModule.current = new Slider(elm, {
      value,
      min,
      max,
      step,
    });

    // subscribe this element to custom event 'change' dispatched in Slider module
    // note: React don't know about this custom events
    elm.addEventListener('change', onPicking);
  }, []);

  useEffect(() => {
    refModule.current.setValue(value);
    //console.log('*** Value: ', value);
  }, [value]);

  return (
    <div ref={refRoot} className={`range-slider ${className}`}>
      <input name={name} type='hidden' />
      <div className='track'></div>
      <Thumb />
    </div>
  );
}